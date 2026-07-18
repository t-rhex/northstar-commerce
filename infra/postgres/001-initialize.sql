CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS catalog.products (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  compare_at numeric(12,2),
  rating numeric(2,1) NOT NULL,
  reviews integer NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  badge text NOT NULL DEFAULT '',
  color text NOT NULL,
  image text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO catalog.products (id, name, category, price, compare_at, rating, reviews, stock, badge, color, image, description) VALUES
('arc-chair', 'Arc Lounge Chair', 'Furniture', 680, 760, 4.9, 84, 12, 'Bestseller', 'Oat', 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85', 'A low, sculptural lounge chair shaped for slow mornings and long reads.'),
('signal-lamp', 'Signal Table Lamp', 'Lighting', 189, NULL, 4.8, 52, 21, 'New', 'Ink', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85', 'Warm, focused light with a hand-spun shade and tactile dimmer.'),
('field-headphones', 'Field Headphones', 'Audio', 249, 289, 4.7, 106, 8, 'Limited', 'Graphite', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85', 'Immersive, balanced sound in a lightweight all-day silhouette.'),
('orbit-watch', 'Orbit Watch', 'Accessories', 315, NULL, 4.9, 41, 15, '', 'Silver', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85', 'A quiet, precise timepiece with a brushed case and woven strap.'),
('tempo-runner', 'Tempo Runner', 'Footwear', 148, NULL, 4.6, 73, 18, '', 'Carmine', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85', 'Responsive everyday trainers made for city miles and weekend escapes.'),
('roam-pack', 'Roam Day Pack', 'Accessories', 124, NULL, 4.8, 64, 27, 'Staff pick', 'Forest', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85', 'A weather-ready pack with a clean profile and thoughtful pocketing.'),
('fold-stool', 'Fold Side Stool', 'Furniture', 220, NULL, 4.7, 29, 10, '', 'Natural', 'https://images.unsplash.com/photo-1532372320572-cda25653a694?auto=format&fit=crop&w=1200&q=85', 'Solid oak, softened edges, and a footprint that fits anywhere.'),
('drift-speaker', 'Drift Speaker', 'Audio', 198, NULL, 4.8, 91, 14, 'Bestseller', 'Sand', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=85', 'Room-filling wireless audio wrapped in a tactile woven shell.')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, price = EXCLUDED.price, compare_at = EXCLUDED.compare_at, rating = EXCLUDED.rating, reviews = EXCLUDED.reviews, stock = EXCLUDED.stock, badge = EXCLUDED.badge, color = EXCLUDED.color, image = EXCLUDED.image, description = EXCLUDED.description, updated_at = now();

CREATE TABLE IF NOT EXISTS orders.orders (
  id text PRIMARY KEY,
  idempotency_key text UNIQUE NOT NULL,
  status text NOT NULL,
  customer jsonb NOT NULL,
  cart jsonb NOT NULL,
  transaction_id text,
  payment_id text,
  reservation_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders.outbox (
  id bigserial PRIMARY KEY,
  aggregate_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  request_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
CREATE INDEX IF NOT EXISTS outbox_unpublished_idx ON orders.outbox (created_at) WHERE published_at IS NULL;

CREATE TABLE IF NOT EXISTS inventory.stock (
  product_id text PRIMARY KEY REFERENCES catalog.products(id),
  available integer NOT NULL CHECK (available >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO inventory.stock (product_id, available) SELECT id, stock FROM catalog.products ON CONFLICT (product_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS inventory.reservations (
  id text PRIMARY KEY,
  transaction_id text UNIQUE NOT NULL,
  status text NOT NULL,
  items jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz
);

CREATE TABLE IF NOT EXISTS payments.authorizations (
  id text PRIMARY KEY,
  transaction_id text UNIQUE NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL,
  customer_email text NOT NULL,
  status text NOT NULL,
  provider text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  voided_at timestamptz
);

CREATE TABLE IF NOT EXISTS analytics.order_events (
  event_id text PRIMARY KEY,
  order_id text NOT NULL,
  transaction_id text,
  customer_email text NOT NULL,
  total numeric(12,2) NOT NULL,
  item_count integer NOT NULL,
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);
