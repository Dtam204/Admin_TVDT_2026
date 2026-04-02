-- Migration: Nâng cấp thông tin chi tiết cho Tác giả và Ấn phẩm
-- Date: 2026-03-21

-- 1. Cập nhật bảng authors
ALTER TABLE authors 
ADD COLUMN IF NOT EXISTS pseudonyms JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS professional_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS cover_image VARCHAR(500),
ADD COLUMN IF NOT EXISTS death_year INTEGER,
ADD COLUMN IF NOT EXISTS birth_place VARCHAR(255),
ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS awards JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS career_highlights JSONB DEFAULT '{}';

-- 2. Cập nhật bảng books
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS author TEXT;

-- 3. Cập nhật dữ liệu cũ cho cột author trong books (nếu có thể)
-- Đây là bước tùy chọn để đồng bộ tên tác giả đầu tiên vào cột author mới
UPDATE books b
SET author = (
  SELECT a.name->>'vi' 
  FROM authors a 
  JOIN book_authors ba ON ba.author_id = a.id 
  WHERE ba.book_id = b.id 
  ORDER BY ba.sort_order ASC 
  LIMIT 1
)
WHERE b.author IS NULL;
