-- Migration: Add Reader fields and Entitlement system
-- Date: 2026-03-19

-- 1. Update members table with new fields
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS card_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS identity_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS card_type_id INTEGER,
ADD COLUMN IF NOT EXISTS issued_date DATE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS balance DECIMAL(15,2) DEFAULT 0;

-- 2. Update membership_plans table with additional library-specific fields if missing
ALTER TABLE membership_plans
ADD COLUMN IF NOT EXISTS max_renewal_limit INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS allow_digital_read BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS allow_download BOOLEAN DEFAULT FALSE;

-- 3. Create reader_entitlements table for granular access
CREATE TABLE IF NOT EXISTS reader_entitlements (
    id SERIAL PRIMARY KEY,
    reader_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES membership_plans(id) ON DELETE SET NULL,
    resource_type VARCHAR(50), -- 'book', 'course', 'collection'
    resource_id INTEGER, -- ID of the book or course
    start_date DATE DEFAULT CURRENT_DATE,
    expire_date DATE,
    extra_borrow_limit INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create interaction_logs table for analytics
CREATE TABLE IF NOT EXISTS interaction_logs (
    id SERIAL PRIMARY KEY,
    reader_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
    resource_type VARCHAR(50), -- 'book', 'news', 'course'
    resource_id INTEGER,
    action_type VARCHAR(50), -- 'read', 'download', 'favorite', 'comment'
    metadata JSONB, -- For additional info
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
