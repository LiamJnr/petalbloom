CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'checkout_failed', 'refunded')),
  purchaser_email TEXT NOT NULL,
  cart_json TEXT NOT NULL,
  buyer_json TEXT NOT NULL,
  delivery_json TEXT NOT NULL DEFAULT '{}',
  total_cents INTEGER NOT NULL CHECK (total_cents > 0),
  subtotal_usd_cents INTEGER NOT NULL CHECK (subtotal_usd_cents >= 0),
  delivery_fee_usd_cents INTEGER NOT NULL CHECK (delivery_fee_usd_cents >= 0),
  discount_usd_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_usd_cents >= 0),
  promo_code TEXT,
  payment_currency TEXT NOT NULL CHECK (payment_currency GLOB '[A-Z][A-Z][A-Z]'),
  payment_provider TEXT NOT NULL,
  payment_intent_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT,
  last_payment_check_at TEXT,
  receipt_access_hash TEXT NOT NULL,
  CHECK (status <> 'paid' OR paid_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON orders(payment_intent_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_intent_id_unique ON orders(payment_intent_id) WHERE payment_intent_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_receipt_access_hash_unique ON orders(receipt_access_hash) WHERE receipt_access_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_purchaser_email_status ON orders(purchaser_email, status);

CREATE TABLE IF NOT EXISTS api_rate_limits (
  bucket_start TEXT NOT NULL,
  scope TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  PRIMARY KEY (bucket_start, scope)
);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);
