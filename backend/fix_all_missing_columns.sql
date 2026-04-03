-- ============================================================================
-- DEEP SYNCHRONIZATION - FIX ALL MISSING COLUMNS
-- ============================================================================

BEGIN;

-- 1. Fix media_files table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media_files' AND column_name='file_type') THEN
        ALTER TABLE media_files ADD COLUMN file_type VARCHAR(50) DEFAULT 'image';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media_files' AND column_name='mime_type') THEN
        ALTER TABLE media_files ADD COLUMN mime_type VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media_files' AND column_name='file_size') THEN
        ALTER TABLE media_files ADD COLUMN file_size BIGINT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media_files' AND column_name='uploaded_by') THEN
        ALTER TABLE media_files ADD COLUMN uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media_files' AND column_name='width') THEN
        ALTER TABLE media_files ADD COLUMN width INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media_files' AND column_name='height') THEN
        ALTER TABLE media_files ADD COLUMN height INTEGER;
    END IF;
END $$;

-- 2. Fix news table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news' AND column_name='author') THEN
        ALTER TABLE news ADD COLUMN author VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news' AND column_name='read_time') THEN
        ALTER TABLE news ADD COLUMN read_time INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news' AND column_name='gallery_images') THEN
        ALTER TABLE news ADD COLUMN gallery_images JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news' AND column_name='image_url') THEN
        ALTER TABLE news ADD COLUMN image_url VARCHAR(500);
    END IF;
END $$;

-- 3. Fix books table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='cooperation_status') THEN
        ALTER TABLE books ADD COLUMN cooperation_status VARCHAR(50) DEFAULT 'cooperating';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='is_digital') THEN
        ALTER TABLE books ADD COLUMN is_digital BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='metadata') THEN
        ALTER TABLE books ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='collection_id') THEN
        ALTER TABLE books ADD COLUMN collection_id INTEGER;
    END IF;
END $$;

-- 4. Fix members table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='points') THEN
        ALTER TABLE members ADD COLUMN points INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='last_activity_at') THEN
        ALTER TABLE members ADD COLUMN last_activity_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 5. Fix membership_plans table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='membership_plans' AND column_name='max_renewal_limit') THEN
        ALTER TABLE membership_plans ADD COLUMN max_renewal_limit INTEGER DEFAULT 1;
    END IF;
END $$;

-- 6. Fix notifications table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='target_type') THEN
        ALTER TABLE notifications ADD COLUMN target_type VARCHAR(50) DEFAULT 'individual';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='sender_id') THEN
        ALTER TABLE notifications ADD COLUMN sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='status') THEN
        ALTER TABLE notifications ADD COLUMN status VARCHAR(20) DEFAULT 'sent';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='metadata') THEN
        ALTER TABLE notifications ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

COMMIT;
