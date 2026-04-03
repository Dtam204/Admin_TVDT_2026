-- ============================================================================
-- FINANCE & BANKING SUITE - CORE STABILIZATION (v6)
-- Date: 2026-04-03
-- ============================================================================

BEGIN;

-- 1. Upgrade PAYMENTS table with Banking Metadata
DO $$ 
BEGIN 
    -- External Transaction ID (Real Bank Txn ID from SePay/MB)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='external_txn_id') THEN
        ALTER TABLE payments ADD COLUMN external_txn_id VARCHAR(100);
    END IF;

    -- Gateway (MBBank, Techcombank, Momo...)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='gateway') THEN
        ALTER TABLE payments ADD COLUMN gateway VARCHAR(100);
    END IF;

    -- Payment Method (Cash, Banking, QR, Wallet)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='payment_method') THEN
        ALTER TABLE payments ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Cash';
    END IF;

    -- Real Bank Transfer Content
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='payment_content') THEN
        ALTER TABLE payments ADD COLUMN payment_content TEXT;
    END IF;

    -- Reference ID (Internal or External Request Reference)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='reference_id') THEN
        ALTER TABLE payments ADD COLUMN reference_id VARCHAR(100);
    END IF;
    
    -- Sync Status (Automated / Manual Verified)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='sync_status') THEN
        ALTER TABLE payments ADD COLUMN sync_status VARCHAR(50) DEFAULT 'manual';
    END IF;

    -- Payer Info (Account Name/Number if any)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='payer_info') THEN
        ALTER TABLE payments ADD COLUMN payer_info JSONB DEFAULT '{}';
    END IF;
END $$;

-- 2. Add Index for Fast Banking Lookup
CREATE INDEX IF NOT EXISTS idx_payments_external_txn ON payments(external_txn_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference_id);

COMMIT;
