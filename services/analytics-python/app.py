import json
import logging
import os
import threading
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import pika
import psycopg
from fastapi import FastAPI, HTTPException
from opentelemetry import context, propagate, trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("analytics")
database_url = os.getenv("DATABASE_URL", "postgresql://northstar:northstar-dev@localhost:5432/northstar")
amqp_url = os.getenv("AMQP_URL", "amqp://guest:guest@localhost:5672")
consumer_ready = threading.Event()
stop_event = threading.Event()


def configure_telemetry():
    endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
    if not endpoint:
        return
    provider = TracerProvider(resource=Resource.create({"service.name": os.getenv("OTEL_SERVICE_NAME", "analytics-python")}))
    provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=endpoint.rstrip("/") + "/v1/traces")))
    trace.set_tracer_provider(provider)


configure_telemetry()
tracer = trace.get_tracer("northstar.analytics")


def db_connection():
    return psycopg.connect(database_url, autocommit=True)


def consume_orders():
    while not stop_event.is_set():
        try:
            connection = pika.BlockingConnection(pika.URLParameters(amqp_url))
            channel = connection.channel()
            channel.exchange_declare(exchange="northstar.events", exchange_type="topic", durable=True)
            channel.exchange_declare(exchange="northstar.dlx", exchange_type="topic", durable=True)
            channel.queue_declare(queue="analytics.order-confirmed.v1.dlq", durable=True)
            channel.queue_bind(queue="analytics.order-confirmed.v1.dlq", exchange="northstar.dlx", routing_key="analytics.failed.v1")
            channel.queue_declare(queue="analytics.order-confirmed.v1", durable=True, arguments={"x-dead-letter-exchange": "northstar.dlx", "x-dead-letter-routing-key": "analytics.failed.v1"})
            channel.queue_bind(queue="analytics.order-confirmed.v1", exchange="northstar.events", routing_key="order.confirmed.v1")
            channel.basic_qos(prefetch_count=int(os.getenv("WORKER_CONCURRENCY", "10")))
            consumer_ready.set()

            def handle_message(ch, method, properties, body):
                carrier = {str(key): str(value) for key, value in (properties.headers or {}).items()}
                token = context.attach(propagate.extract(carrier))
                try:
                    with tracer.start_as_current_span("rabbitmq process analytics.order-confirmed.v1") as span:
                        event = json.loads(body)
                        order = event["data"]
                        cart = order["cart"]
                        span.set_attribute("messaging.system", "rabbitmq")
                        span.set_attribute("order.id", order["id"])
                        with db_connection() as database:
                            database.execute(
                                """INSERT INTO analytics.order_events (event_id, order_id, transaction_id, customer_email, total, item_count, occurred_at)
                                VALUES (%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (event_id) DO NOTHING""",
                                (event["id"], order["id"], order.get("transactionId"), order["customer"]["email"], cart["total"], cart["itemCount"], event["time"]),
                            )
                        logger.info(json.dumps({"level": "info", "service": "analytics-python", "event": "order.analyzed", "orderId": order["id"]}))
                        ch.basic_ack(delivery_tag=method.delivery_tag)
                except Exception as error:
                    logger.exception(json.dumps({"level": "error", "service": "analytics-python", "event": "analytics.failed", "message": str(error)}))
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
                finally:
                    context.detach(token)

            channel.basic_consume(queue="analytics.order-confirmed.v1", on_message_callback=handle_message)
            channel.start_consuming()
        except Exception as error:
            consumer_ready.clear()
            if not stop_event.wait(2):
                logger.error(json.dumps({"level": "error", "service": "analytics-python", "event": "consumer.reconnecting", "message": str(error)}))


@asynccontextmanager
async def lifespan(_: FastAPI):
    worker = threading.Thread(target=consume_orders, daemon=True)
    worker.start()
    yield
    stop_event.set()
    worker.join(timeout=5)


app = FastAPI(title="Northstar Analytics", version="1.0.0", lifespan=lifespan)
FastAPIInstrumentor.instrument_app(app)


@app.get("/health/live")
@app.get("/health")
def live():
    return {"service": "analytics-python", "status": "up"}


@app.get("/health/ready")
def ready():
    try:
        with db_connection() as database:
            database.execute("SELECT 1").fetchone()
        if not consumer_ready.is_set():
            raise RuntimeError("RabbitMQ consumer is not ready")
        return {"service": "analytics-python", "status": "ready"}
    except Exception as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.get("/analytics/summary")
def summary():
    with db_connection() as database:
        row = database.execute("SELECT count(*) AS orders, COALESCE(sum(total),0) AS revenue, COALESCE(avg(total),0) AS average_order_value, COALESCE(sum(item_count),0) AS items FROM analytics.order_events").fetchone()
    return {"orders": row[0], "revenue": float(row[1]), "averageOrderValue": round(float(row[2]), 2), "items": row[3], "generatedAt": datetime.now(timezone.utc).isoformat()}


@app.get("/analytics/recent")
def recent():
    with db_connection() as database:
        rows = database.execute("SELECT order_id, transaction_id, total, item_count, occurred_at FROM analytics.order_events ORDER BY occurred_at DESC LIMIT 25").fetchall()
    return {"items": [{"orderId": row[0], "transactionId": row[1], "total": float(row[2]), "itemCount": row[3], "occurredAt": row[4]} for row in rows]}
