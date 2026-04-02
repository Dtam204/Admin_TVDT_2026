-- Nâng cấp bảng news để hỗ trợ CMS chuyên nghiệp
ALTER TABLE news RENAME COLUMN thumbnail TO image_url;

ALTER TABLE news ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS read_time TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS gradient TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS gallery_title TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';
ALTER TABLE news ADD COLUMN IF NOT EXISTS gallery_position VARCHAR(20) DEFAULT 'top';
ALTER TABLE news ADD COLUMN IF NOT EXISTS show_table_of_contents BOOLEAN DEFAULT TRUE;
ALTER TABLE news ADD COLUMN IF NOT EXISTS enable_share_buttons BOOLEAN DEFAULT TRUE;
ALTER TABLE news ADD COLUMN IF NOT EXISTS show_author_box BOOLEAN DEFAULT TRUE;
ALTER TABLE news ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS published_date DATE DEFAULT CURRENT_DATE;

-- Đảm bảo các chỉ mục cho tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_news_published_date ON news(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_is_featured_active ON news(is_featured) WHERE is_featured = TRUE;
