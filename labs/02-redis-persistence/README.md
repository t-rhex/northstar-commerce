# Lab 02: Redis-backed cart persistence

## Objective

Distinguish stateless module replacement from stateful infrastructure lifecycle.

## Exercise

Start the stack and add a product through the storefront. Inspect the Redis key:

```bash
docker-compose exec redis redis-cli KEYS 'northstar:cart:*'
docker-compose exec redis redis-cli TTL northstar:cart:demo
```

Restart only the cart module:

```bash
docker-compose restart cart
```

Refresh the storefront. The cart remains because state belongs to the Redis adapter, not the cart process.

Next, stop the stack without deleting volumes, then start it again:

```bash
docker-compose down
docker-compose up -d
```

The AOF-backed Redis volume preserves the cart. `docker-compose down -v` is intentionally destructive and removes that state.
