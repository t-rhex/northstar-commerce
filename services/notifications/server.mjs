import { createJsonService, withRemoteSpan } from "../../packages/service-runtime/runtime.mjs"
import amqp from "amqplib"

const port = Number(process.env.PORT || 4004)
const amqpUrl = process.env.AMQP_URL || "amqp://guest:guest@localhost:5672"
const connection = await amqp.connect(amqpUrl)
const channel = await connection.createChannel()

await channel.assertExchange("northstar.events", "topic", { durable: true })
await channel.assertExchange("northstar.dlx", "topic", { durable: true })
await channel.assertQueue("notifications.order-confirmed.v1.dlq", { durable: true })
await channel.bindQueue("notifications.order-confirmed.v1.dlq", "northstar.dlx", "notification.failed.v1")
await channel.assertQueue("notifications.order-confirmed.v1", {
  durable: true,
  arguments: {
    "x-dead-letter-exchange": "northstar.dlx",
    "x-dead-letter-routing-key": "notification.failed.v1",
  },
})
await channel.bindQueue("notifications.order-confirmed.v1", "northstar.events", "order.confirmed.v1")
await channel.prefetch(Number(process.env.WORKER_CONCURRENCY || 10))

await channel.consume("notifications.order-confirmed.v1", async (message) => {
  if (!message) return
  await withRemoteSpan("rabbitmq process order.confirmed.v1", message.properties.headers, { "messaging.system": "rabbitmq", "messaging.destination.name": "notifications.order-confirmed.v1", "messaging.operation.type": "process" }, async () => {
   try {
    const event = JSON.parse(message.content.toString("utf8"))
    if (!event.data?.customer?.email) throw new Error("Order event has no customer email")
    console.log(JSON.stringify({ level: "info", service: "notifications", event: "notification.sent", orderId: event.data.id, recipient: event.data.customer.email, correlationId: message.properties.correlationId }))
    channel.ack(message)
  } catch (error) {
    console.error(JSON.stringify({ level: "error", service: "notifications", event: "notification.failed", message: error.message, messageId: message.properties.messageId }))
    channel.nack(message, false, false)
  }
  })
}, { noAck: false })

createJsonService({
  name: "notifications",
  port,
  ready: async () => !connection.connection.stream.destroyed,
  handle: async () => undefined,
  onShutdown: async () => { await channel.close(); await connection.close() },
})
