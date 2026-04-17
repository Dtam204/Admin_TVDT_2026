-- ==========================================================================
-- Production Migration: Notifications + SePay + Storage Locations
-- Apply on existing production database (PostgreSQL)
-- Safe to run multiple times
-- ==========================================================================

BEGIN;

-- 1) Storage locations (for admin/publication flow)
CREATE TABLE IF NOT EXISTS storage_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_storage_locations_name ON storage_locations(name);
CREATE INDEX IF NOT EXISTS idx_storage_locations_active ON storage_locations(is_active);

DROP TRIGGER IF EXISTS update_storage_locations_updated_at ON storage_locations;
CREATE TRIGGER update_storage_locations_updated_at
BEFORE UPDATE ON storage_locations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO storage_locations (name, description, is_active)
VALUES
  ('Kho chính', 'Khu lưu trữ chính của thư viện', TRUE),
  ('Kho tham khảo', 'Tài liệu tham khảo, không cho mượn về', TRUE),
  ('Kho số', 'Tài nguyên số và file media', TRUE)
ON CONFLICT (name) DO NOTHING;

-- 2) Notifications schema sync
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS target_type VARCHAR(20) NOT NULL DEFAULT 'individual';
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'sent';
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notifications_target_type_check'
    ) THEN
        ALTER TABLE notifications
            ADD CONSTRAINT notifications_target_type_check
            CHECK (target_type IN ('individual', 'all'));
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notifications_status_check'
    ) THEN
        ALTER TABLE notifications
            ADD CONSTRAINT notifications_status_check
            CHECK (status IN ('draft', 'sent', 'failed', 'archived'));
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_target_type ON notifications(target_type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON notifications(sender_id);

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Backfill defaults for existing rows
UPDATE notifications
SET target_type = COALESCE(target_type, 'individual'),
    metadata = COALESCE(metadata, '{}'::jsonb),
    status = COALESCE(status, 'sent')
WHERE target_type IS NULL OR metadata IS NULL OR status IS NULL;

-- 3) wallet_deposit_orders / webhook_events are expected by SePay webhook flow
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
CREATE TRIGGER update_wallet_deposit_orders_updated_at
BEFORE UPDATE ON wallet_deposit_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
