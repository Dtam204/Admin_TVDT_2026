-- ============================================================================
-- FINANCE & BANKING SUITE - WALLET DEPOSIT ORDER SYNC (v7)
-- Date: 2026-04-09
-- Purpose: harden webhook idempotency and order-based wallet top-up flow
-- ============================================================================

BEGIN;

-- 1) Ensure banking metadata exists on payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS external_txn_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_content TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'manual';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payer_info JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_payments_external_txn ON payments(external_txn_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_external_txn_not_null
  ON payments(external_txn_id)
  WHERE external_txn_id IS NOT NULL;

-- 2) Order table for wallet deposit requests
CREATE TABLE IF NOT EXISTS wallet_deposit_orders (
  id BIGSERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  client_reference VARCHAR(80) NOT NULL UNIQUE,
  transfer_code VARCHAR(80) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'credited', 'failed', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  matched_external_txn_id VARCHAR(100),
  credited_at TIMESTAMPTZ,
  failure_reason TEXT,
  webhook_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_deposit_orders_member ON wallet_deposit_orders(member_id);
CREATE INDEX IF NOT EXISTS idx_wallet_deposit_orders_status ON wallet_deposit_orders(status);
CREATE INDEX IF NOT EXISTS idx_wallet_deposit_orders_expires ON wallet_deposit_orders(expires_at);

DROP TRIGGER IF EXISTS update_wallet_deposit_orders_updated_at ON wallet_deposit_orders;
CREATE TRIGGER update_wallet_deposit_orders_updated_at BEFORE UPDATE ON wallet_deposit_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3) Webhook event ledger for idempotency + audit
CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(30) NOT NULL,
  external_txn_id VARCHAR(120) NOT NULL,
  event_type VARCHAR(50) NOT NULL DEFAULT 'BANK_INBOUND',
  signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
  received_payload JSONB NOT NULL,
  processing_status VARCHAR(20) NOT NULL DEFAULT 'received'
    CHECK (processing_status IN ('received', 'processed', 'ignored', 'duplicated', 'failed')),
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, external_txn_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(processing_status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at);

COMMIT;
