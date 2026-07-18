import { traceHeaders, withSpan } from "../../packages/service-runtime/runtime.mjs"

export async function createOrderEventPublisher({ amqpUrl = process.env.AMQP_URL } = {}) {
  if (!amqpUrl) return { publish: async () => {}, ready: async () => true, close: async () => {}, adapter: "none" }
  const amqp = await import("amqplib")
  const connection = await amqp.connect(amqpUrl)
  const channel = await connection.createConfirmChannel()
  await channel.assertExchange("northstar.events", "topic", { durable: true })
  await channel.assertExchange("northstar.dlx", "topic", { durable: true })
  connection.on("error", (error) => console.error(JSON.stringify({ level: "error", service: "orders", adapter: "rabbitmq", message: error.message })))
  return {
    async publish(order, requestId) {
      return withSpan("rabbitmq publish order.confirmed.v1", { "messaging.system": "rabbitmq", "messaging.destination.name": "northstar.events", "messaging.operation.type": "publish" }, async () => {
        const event = {
        specversion: "1.0",
        type: "order.confirmed.v1",
        source: "northstar/orders",
        id: order.id,
        time: new Date().toISOString(),
        subject: order.id,
        data: order,
      }
        channel.publish("northstar.events", "order.confirmed.v1", Buffer.from(JSON.stringify(event)), {
        persistent: true,
        contentType: "application/cloudevents+json",
        messageId: order.id,
        correlationId: requestId,
        type: event.type,
        timestamp: Math.floor(Date.now() / 1000),
        headers: traceHeaders(),
        })
        await channel.waitForConfirms()
      })
    },
    async ready() { return !connection.connection.stream.destroyed },
    async close() { await channel.close(); await connection.close() },
    adapter: "rabbitmq",
  }
}
