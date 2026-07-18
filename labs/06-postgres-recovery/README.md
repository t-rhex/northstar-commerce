# Lab 06: PostgreSQL persistence and recovery

## Goal

Prove that catalog, inventory, payment, order, and analytics state is durable and understand which service owns each schema.

## Exercise

1. Complete a checkout.
2. Inspect schema ownership with `docker-compose exec postgres psql -U northstar -d northstar -c "\dn"`.
3. Inspect products with `docker-compose exec postgres psql -U northstar -d northstar -c "SELECT id, name, stock FROM catalog.products"`.
4. Restart `catalog`, `orders`, `inventory`, `payments`, and `analytics` and confirm the records remain.
5. Create a logical backup with `docker-compose exec -T postgres pg_dump -U northstar -d northstar > northstar.sql`.

The shared PostgreSQL container is a local-lab optimization. Schema ownership represents boundaries that can become separate database clusters in production.
