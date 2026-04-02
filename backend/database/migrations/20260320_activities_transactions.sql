-- Migration: Member Activity, Transactions & Security
-- Date: 2026-03-20

-- 1. Table for Member Activity Logs
CREATE TABLE IF NOT EXISTS member_activities (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'login', 'renew_request', 'approved', 'rejected', 'update_profile', 'password_change', 'deposit'
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table for Member Transactions (Financial Ledger)
CREATE TABLE IF NOT EXISTS member_transactions (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL, -- Positive for deposit, negative for spending
    transaction_type VARCHAR(50) NOT NULL, -- 'deposit', 'membership_fee', 'fine', 'refund'
    description TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_member_activities_member ON member_activities(member_id);
CREATE INDEX IF NOT EXISTS idx_member_activities_type ON member_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_member_transactions_member ON member_transactions(member_id);

-- 4. Sample Activity Type comment
COMMENT ON COLUMN member_activities.activity_type IS 'Loại hành động: login, profile_update, password_reset, renewal_request, etc.';
COMMENT ON COLUMN member_transactions.amount IS 'Số tiền biến động. Dương là nạp, âm là chi.';
