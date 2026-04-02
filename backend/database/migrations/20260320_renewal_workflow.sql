-- Migration: Membership Renewal Workflow & Hygiene
-- Date: 2026-03-20

-- 1. Add last_activity_at to members to track inactivity
ALTER TABLE members ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE;

-- 2. Create membership_requests table for the approval flow
CREATE TABLE IF NOT EXISTS membership_requests (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES membership_plans(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    request_note TEXT,
    admin_note TEXT,
    manual_days_approved INTEGER, -- For 3, 5, 7 day custom overrides
    processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_membership_requests_member ON membership_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_membership_requests_status ON membership_requests(status);
CREATE INDEX IF NOT EXISTS idx_members_last_activity ON members(last_activity_at);

-- 4. Add updated_at trigger
DROP TRIGGER IF EXISTS update_membership_requests_updated_at ON membership_requests;
CREATE TRIGGER update_membership_requests_updated_at BEFORE UPDATE ON membership_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN membership_requests.manual_days_approved IS 'Số ngày gia hạn do Admin nhập thủ công (3, 5, 7...). Nếu NULL sẽ dùng theo Gói cước.';
