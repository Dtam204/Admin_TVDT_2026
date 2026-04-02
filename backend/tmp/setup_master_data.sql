-- Script khởi tạo bảng Master Data cho Hệ thống Ấn phẩm
-- Tác giả: Antigravity

-- Kích hoạt tiện ích sinh UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Bảng Thư viện / Kho (Libraries & Storages)
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

-- 2. Bảng Bộ sưu tập / Thể loại (Collections)
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES collections(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50), -- Tên icon cho App (material icon v.v.)
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Nhà xuất bản (Publishers)
CREATE TABLE IF NOT EXISTS publishers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    email VARCHAR(255),
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Ấn phẩm (Nâng cấp)
CREATE TABLE IF NOT EXISTS publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE, -- Mã biểu ghi (maSoBieuGhi)
    title TEXT NOT NULL,
    author TEXT,
    thumbnail TEXT,
    description TEXT,
    category_id UUID, -- Liên kết thể loại gốc
    publisher_id UUID REFERENCES publishers(id) ON DELETE SET NULL,
    collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
    publication_year VARCHAR(10),
    language VARCHAR(50),
    page_count VARCHAR(20),
    isbd_content TEXT,
    metadata JSONB, -- Lưu Marc21 fields
    is_digital BOOLEAN DEFAULT false,
    digital_file_url TEXT,
    ai_summary TEXT,
    dominant_color VARCHAR(20),
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    trending_score NUMERIC(5,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'SanSang',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng Bản sao (Copies)
CREATE TABLE IF NOT EXISTS publication_copies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id UUID REFERENCES publications(id) ON DELETE CASCADE,
    storage_id UUID REFERENCES storages(id) ON DELETE SET NULL,
    barcode VARCHAR(100) UNIQUE,
    copy_number VARCHAR(100), -- Số ĐKCB
    price NUMERIC(15,2),
    status VARCHAR(50) DEFAULT 'SanSang', -- SanSang,Borrowed,Lost,Repair
    added_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
