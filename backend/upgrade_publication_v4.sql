-- ============================================================================
-- PUBLICATION REPOSITORY - CORE STABILIZATION (v4)
-- Date: 2026-04-03
-- ============================================================================

BEGIN;

-- 1. Create Storages Table if missing (Used by UI in future, but requested by logic)
CREATE TABLE IF NOT EXISTS storages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    capacity INTEGER DEFAULT 100,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Upgrade BOOKS table with advanced fields
DO $$ 
BEGIN 
    -- Advanced Technical Metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='media_type') THEN
        ALTER TABLE books ADD COLUMN media_type VARCHAR(50) DEFAULT 'Physical';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='edition') THEN
        ALTER TABLE books ADD COLUMN edition VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='volume') THEN
        ALTER TABLE books ADD COLUMN volume VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='dimensions') THEN
        ALTER TABLE books ADD COLUMN dimensions VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='keywords') THEN
        ALTER TABLE books ADD COLUMN keywords JSONB DEFAULT '[]';
    END IF;
    
    -- Content & AI
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='ai_summary') THEN
        ALTER TABLE books ADD COLUMN ai_summary TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='dominant_color') THEN
        ALTER TABLE books ADD COLUMN dominant_color VARCHAR(20) DEFAULT '#4f46e5';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='toc') THEN
        ALTER TABLE books ADD COLUMN toc JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='access_policy') THEN
        ALTER TABLE books ADD COLUMN access_policy VARCHAR(50) DEFAULT 'basic';
    END IF;
    
    -- Digital Content Structure
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='digital_content') THEN
        ALTER TABLE books ADD COLUMN digital_content JSONB DEFAULT '{}';
    END IF;
END $$;

-- 3. Upgrade PUBLICATION_COPIES table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='publication_copies' AND column_name='price') THEN
        ALTER TABLE publication_copies ADD COLUMN price DECIMAL(15, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='publication_copies' AND column_name='condition') THEN
        ALTER TABLE publication_copies ADD COLUMN condition VARCHAR(50) DEFAULT 'good';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='publication_copies' AND column_name='storage_location') THEN
        ALTER TABLE publication_copies ADD COLUMN storage_location VARCHAR(255);
    END IF;
END $$;

COMMIT;
