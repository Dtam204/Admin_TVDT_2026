-- Patch SQL: Nâng cấp hệ thống Ấn phẩm Thế hệ mới (AI & Digital)
-- Tác giả: Antigravity

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Bổ sung các bảng Master Data mới
CREATE TABLE IF NOT EXISTS libraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS storages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID REFERENCES libraries(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Đổi khái niệm book_categories thành collections chuyên nghiệp hơn
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

-- 3. Nâng cấp bảng books (Ấn phẩm) - Sử dụng ALTER để không mất dữ liệu cũ
ALTER TABLE books ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE;
ALTER TABLE books ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT false;
ALTER TABLE books ADD COLUMN IF NOT EXISTS digital_file_url TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS isbd_content TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS dominant_color VARCHAR(20);
ALTER TABLE books ADD COLUMN IF NOT EXISTS trending_score NUMERIC(5,2) DEFAULT 0;

-- 4. Bảng Bản sao (Thay thế/Nâng cấp luồng quản lý thực thể)
CREATE TABLE IF NOT EXISTS publication_copies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id INTEGER REFERENCES books(id) ON DELETE CASCADE, -- Map với id SERIAL của books
    storage_id UUID REFERENCES storages(id) ON DELETE SET NULL,
    barcode VARCHAR(100) UNIQUE,
    copy_number VARCHAR(100),
    price NUMERIC(15,2),
    status VARCHAR(50) DEFAULT 'available',
    added_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng phục vụ Nội dung số (Digital Reading)
CREATE TABLE IF NOT EXISTS publication_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    page_number INTEGER NOT NULL,
    parent_id UUID REFERENCES publication_bookmarks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS publication_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    content TEXT, -- Text trích xuất để AI tìm kiếm
    image_url TEXT, -- Ảnh trang sách (nếu có)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(publication_id, page_number)
);
