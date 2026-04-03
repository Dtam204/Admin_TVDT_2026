-- ============================================================================
-- RESTORE MISSING SCHEMA ELEMENTS
-- ============================================================================

-- 1. Bổ sung cột cho membership_plans
ALTER TABLE membership_plans 
ADD COLUMN IF NOT EXISTS max_renewal_limit INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS allow_digital_read BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS allow_download BOOLEAN DEFAULT FALSE;

-- 2. Bổ sung cột cho publication_copies
ALTER TABLE publication_copies 
ADD COLUMN IF NOT EXISTS storage_location TEXT;

-- 3. Bổ sung cột cho news
ALTER TABLE news 
ADD COLUMN IF NOT EXISTS author TEXT,
ADD COLUMN IF NOT EXISTS read_time TEXT,
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS gallery_position VARCHAR(20) DEFAULT 'top',
ADD COLUMN IF NOT EXISTS show_author_box BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS published_date DATE;

-- Cập nhật data cho image_url từ thumbnail nếu cần
UPDATE news SET image_url = thumbnail WHERE image_url IS NULL;
UPDATE news SET published_date = published_at::date WHERE published_date IS NULL;

-- 4. Khôi phục bảng comments (Bình luận)
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    object_id INTEGER NOT NULL,
    object_type VARCHAR(50) NOT NULL, -- 'book', 'news', etc.
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    reply_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'approved', -- 'pending', 'approved', 'rejected', 'deleted'
    rating INTEGER DEFAULT 0,
    guest_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_object ON comments(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

-- 5. Khôi phục bảng comment_reports (Báo cáo bình luận)
CREATE TABLE IF NOT EXISTS comment_reports (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Khôi phục bảng interaction_logs (Nhật ký tương tác - Cho Dashboard)
CREATE TABLE IF NOT EXISTS interaction_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
    object_id INTEGER,
    object_type VARCHAR(50),
    action_type VARCHAR(50) NOT NULL, -- 'read', 'view', 'download', 'favorite'
    metadata JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interaction_logs_type ON interaction_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_created ON interaction_logs(created_at);

-- 7. Khôi phục bảng collections (Nếu chưa có đầy đủ hoặc cần đồng bộ)
-- Bảng này đã có trong schema.sql nhưng tôi thêm ở đây để đảm bảo an toàn
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES collections(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50), 
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
