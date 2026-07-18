# Lab 15: Managed data and messaging

## Outcome

Move stateful dependencies behind production-shaped AWS services and prove failover/recovery behavior.

## Work

Set `enable_managed_data=true` only after reviewing cost. Supply cache/broker credentials through approved secure inputs. Plan RDS PostgreSQL, TLS-only encrypted Valkey, and private Amazon MQ RabbitMQ. For the production comparison, plan Multi-AZ RDS with deletion protection/final snapshot and retain RabbitMQ `CLUSTER_MULTI_AZ` quorum queues.

Run database migrations as a separately observable Job before application rollout. Populate products, run checkout, and verify outbox-to-MQ consumption. Reboot/fail over one dependency using the supported AWS operation, then measure client reconnect and application recovery.

Discuss when MSK is appropriate for retained event streams versus RabbitMQ for the current work-queue contract; do not replace technology without changing the service contract.

## Evidence and gate

Submit private endpoints, encryption/TLS controls, backup settings, migration logs, successful checkout, failover timeline, and a destroy/final-snapshot decision. No public database/cache/broker is accepted.

[RDS encryption](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.Encryption.html) · [Amazon MQ RabbitMQ architecture](https://docs.aws.amazon.com/amazon-mq/latest/developer-guide/rabbitmq-broker-architecture.html)
