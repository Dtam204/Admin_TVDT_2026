-- ============================================================================
-- MASTER RESTORATION & SYNCHRONIZATION SCRIPT (100% SYNC)
-- Date: 2026-04-03
-- Goal: Restore all missing tables and columns requested by backend and UI.
-- ============================================================================

BEGIN;

-- 1. Helper Function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- I. CORE CONTENT TABLES (Missing from schema.sql)
-- ============================================================================

-- 1. Authors Table
CREATE TABLE IF NOT EXISTS authors (
    id SERIAL PRIMARY KEY,
    name JSONB NOT NULL, -- Multilingual
    slug VARCHAR(255) NOT NULL UNIQUE,
    pseudonyms JSONB DEFAULT '{}',
    professional_title VARCHAR(255),
    gender VARCHAR(50),
    bio JSONB DEFAULT '{}',
    avatar VARCHAR(500),
    cover_image VARCHAR(500),
    birth_year INTEGER,
    death_year INTEGER,
    nationality VARCHAR(100),
    birth_place VARCHAR(255),
    education JSONB DEFAULT '{}',
    awards JSONB DEFAULT '{}',
    career_highlights JSONB DEFAULT '{}',
    website VARCHAR(255),
    social_links JSONB DEFAULT '{}',
    featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_authors_slug ON authors(slug);
CREATE INDEX IF NOT EXISTS idx_authors_status ON authors(status);

-- 2. Collections Table
CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
    icon VARCHAR(100),
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Book-Authors Link Table
CREATE TABLE IF NOT EXISTS book_authors (
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES authors(id) ON DELETE CASCADE,
    role VARCHAR(100) DEFAULT 'main_author',
    PRIMARY KEY (book_id, author_id)
);

-- ============================================================================
-- II. MISSING COLUMNS SYNC
-- ============================================================================

-- 1. Books table enhancements
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS cooperation_status VARCHAR(50) DEFAULT 'cooperating',
ADD COLUMN IF NOT EXISTS collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS digital_file_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 2. Members table enhancements
ALTER TABLE members
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_borrowed INTEGER DEFAULT 0;

-- 3. Membership Plans enhancements
ALTER TABLE membership_plans
ADD COLUMN IF NOT EXISTS max_renewal_limit INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS allow_digital_read BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS allow_download BOOLEAN DEFAULT FALSE;

-- 4. Publication Copies enhancements (Storage Location issue)
ALTER TABLE publication_copies
ADD COLUMN IF NOT EXISTS storage_location VARCHAR(255);

-- 5. News table enhancements (Admin News management)
ALTER TABLE news
ADD COLUMN IF NOT EXISTS author VARCHAR(255),
ADD COLUMN IF NOT EXISTS read_time INTEGER,
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- ============================================================================
-- III. INTERACTION & SOCIAL TABLES (Phase 2 - Restore)
-- ============================================================================

-- 1. Membership Requests
CREATE TABLE IF NOT EXISTS membership_requests (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES membership_plans(id) ON DELETE SET NULL,
    request_note TEXT,
    amount DECIMAL(15, 2),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    external_txn_id VARCHAR(100),
    gateway VARCHAR(50),
    processed_by INTEGER REFERENCES users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Comments & Replies
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    object_id INTEGER NOT NULL,
    object_type VARCHAR(50) NOT NULL, -- 'book', 'news', 'course'
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    rating INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Comment Reports
CREATE TABLE IF NOT EXISTS comment_reports (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new',
    resolved_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Notifications System
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title JSONB NOT NULL,
    message JSONB NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id INTEGER,
    related_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Book Reviews (Detailed)
CREATE TABLE IF NOT EXISTS book_reviews (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(book_id, member_id)
);

-- 6. Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(member_id, book_id)
);

-- 7. User Favorites (Advanced)
CREATE TABLE IF NOT EXISTS user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id)
);

-- 8. Reading Progress (Advanced)
CREATE TABLE IF NOT EXISTS user_reading_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    current_page INTEGER DEFAULT 1,
    total_pages INTEGER,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id)
);

-- ============================================================================
-- IV. MEDIA MANAGEMENT TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS media_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    parent_id INTEGER REFERENCES media_folders(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_files (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER REFERENCES media_folders(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    description TEXT,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- V. DATA INTEGRITY & INDEXES
-- ============================================================================

-- Triggers for updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name IN ('authors', 'collections', 'membership_requests', 'comments', 'book_reviews', 'media_folders', 'media_files')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END $$;

-- Book Loans relax constraints for pending state (Repeat just in case)
ALTER TABLE book_loans ALTER COLUMN loan_date DROP NOT NULL;
ALTER TABLE book_loans ALTER COLUMN due_date DROP NOT NULL;
ALTER TABLE book_loans ALTER COLUMN approved_at DROP NOT NULL;

-- Index for Dashboard performance
CREATE INDEX IF NOT EXISTS idx_members_last_activity ON members(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_book_loans_status ON book_loans(status);

COMMIT;
