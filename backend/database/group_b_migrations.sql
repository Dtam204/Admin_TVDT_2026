-- ============================================================================
-- COMMENT & REPLY SYSTEM - Migration
-- Support tiered comments, moderation, and reporting
-- ============================================================================

-- Báº£ng comments (lÆ°u trá»¯ bÃ¬nh luáº­n vÃ  pháº£n há»“i)
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_id INTEGER NOT NULL, -- ID cá»§a sÃ¡ch, bÃ i viáº¿t, hoáº·c khÃ³a há»c
  object_type VARCHAR(50) NOT NULL, -- 'book', 'news', 'course'
  parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE, -- ID cá»§a bÃ¬nh luáº­n cha (null náº¿u lÃ  bÃ¬nh luáº­n gá»‘c)
  reply_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- ID ngÆ°á»i dÃ¹ng Ä‘Æ°á»£c pháº£n há»“i (Ä‘á»ƒ tag tÃªn)
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden', 'deleted')),
  is_featured BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index Ä‘á»ƒ tá»‘i Æ°u tÃ¬m kiáº¿m theo ná»™i dung
CREATE INDEX IF NOT EXISTS idx_comments_object ON comments(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);

-- Trigger cáº­p nháº­t updated_at
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Báº£ng comment_reports (lÆ°u trá»¯ bÃ¡o cÃ¡o vi pháº¡m)
CREATE TABLE IF NOT EXISTS comment_reports (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'processing', 'resolved', 'ignored')),
  resolved_by INTEGER REFERENCES users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comment_reports_comment ON comment_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_status ON comment_reports(status);

-- Seed permissions cho viá»‡c quáº£n lÃ½ bÃ¬nh luáº­n (Admin)
INSERT INTO permissions (code, name, description, module) VALUES
  ('comments.view', 'Xem bÃ¬nh luáº­n', 'Xem danh sÃ¡ch bÃ¬nh luáº­n há»‡ thá»‘ng', 'comments'),
  ('comments.manage', 'Quáº£n lÃ½ bÃ¬nh luáº­n', 'PhÃª duyá»‡t, áº©n, xÃ³a bÃ¬nh luáº­n', 'comments'),
  ('comment_reports.manage', 'Quáº£n lÃ½ bÃ¡o cÃ¡o', 'Xá»­ lÃ½ cÃ¡c bÃ¡o cÃ¡o vi pháº¡m bÃ¬nh luáº­n', 'comments')
ON CONFLICT (code) DO NOTHING;
-- Migration: Bá»• sung tráº¡ng thÃ¡i há»£p tÃ¡c cho áº¤n pháº©m (Books)
-- GiÃ¡ trá»‹: 'cooperating' (Máº·c Ä‘á»‹nh), 'ceased_cooperation' (NgÆ°ng há»£p tÃ¡c)

ALTER TABLE books 
ADD COLUMN cooperation_status VARCHAR(50) DEFAULT 'cooperating';

-- Cáº­p nháº­t táº¥t cáº£ sÃ¡ch hiá»‡n táº¡i sang tráº¡ng thÃ¡i 'cooperating'
UPDATE books SET cooperation_status = 'cooperating' WHERE cooperation_status IS NULL;

-- Comment cho cá»™t má»›i
COMMENT ON COLUMN books.cooperation_status IS 'Tráº¡ng thÃ¡i há»£p tÃ¡c báº£n quyá»n (cooperating/ceased_cooperation)';
-- Migration: SePay Integration & Strict Pricing
-- Date: 2026-04-02

-- 1. Add amount and external_txn_id to membership_requests
-- amount: To lock the price at request time
-- external_txn_id: To track the SePay/Bank transaction ID
ALTER TABLE membership_requests 
ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS external_txn_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS gateway VARCHAR(50);

-- 2. Add index for external_txn_id to prevent duplicates
CREATE INDEX IF NOT EXISTS idx_membership_requests_txn ON membership_requests(external_txn_id);

COMMENT ON COLUMN membership_requests.amount IS 'Sá»‘ tiá»n chá»‘t táº¡i thá»i Ä‘iá»ƒm Ä‘Äƒng kÃ½ (Ä‘á»ƒ Ä‘á»‘i soÃ¡t Webhook)';
COMMENT ON COLUMN membership_requests.external_txn_id IS 'MÃ£ giao dá»‹ch tá»« SePay hoáº·c NgÃ¢n hÃ ng';
-- Migration: Phase 2 - Member Interactions (Notifications, Reviews, Wishlists)
-- Date: 2026-04-03
-- Author: Antigravity

-- 1. Notifications Table (Há»‡ thá»‘ng thÃ´ng bÃ¡o ná»™i bá»™)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'overdue', 'renewal', 'system', 'payment'
    title JSONB NOT NULL, -- Há»— trá»£ Ä‘a ngÃ´n ngá»¯
    message JSONB NOT NULL, -- Há»— trá»£ Ä‘a ngÃ´n ngá»¯
    is_read BOOLEAN DEFAULT false,
    related_id INTEGER, -- ID cá»§a book_loan hoáº·c payment liÃªn quan
    related_type VARCHAR(50), -- 'book_loan', 'payment', 'news'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_member_id ON notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 2. Book Reviews Table (ÄÃ¡nh giÃ¡ sÃ¡ch - Hiá»ƒn thá»‹ ngay)
CREATE TABLE IF NOT EXISTS book_reviews (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status VARCHAR(20) DEFAULT 'published', -- 'published', 'hidden', 'flagged'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(book_id, member_id) -- Má»—i há»™i viÃªn chá»‰ Ä‘Ã¡nh giÃ¡ 1 láº§n cho má»—i cuá»‘n sÃ¡ch
);

CREATE INDEX IF NOT EXISTS idx_book_reviews_book_id ON book_reviews(book_id);

-- 3. Wishlists Table (Danh sÃ¡ch yÃªu thÃ­ch)
CREATE TABLE IF NOT EXISTS wishlists (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(member_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_member_id ON wishlists(member_id);

-- 4. Bá»• sung Trigger Ä‘á»ƒ cáº­p nháº­t updated_at cho book_reviews
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_book_reviews_modtime
    BEFORE UPDATE ON book_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();
