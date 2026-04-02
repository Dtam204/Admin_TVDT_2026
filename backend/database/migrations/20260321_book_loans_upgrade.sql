-- Migration: Nâng cấp hệ thống Mượn Trả liên kết với Bản sao (Copies)
-- Date: 2026-03-21

-- 1. Cập nhật bảng book_loans
ALTER TABLE book_loans 
ADD COLUMN IF NOT EXISTS copy_id UUID REFERENCES publication_copies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ma_dang_ky_ca_biet VARCHAR(100);

-- 2. Cập nhật ràng buộc trạng thái (Status)
ALTER TABLE book_loans DROP CONSTRAINT IF EXISTS book_loans_status_check;
ALTER TABLE book_loans ADD CONSTRAINT book_loans_status_check 
CHECK (status IN ('pending', 'approved', 'borrowing', 'returned', 'overdue', 'lost', 'rejected'));

-- 3. Tạo index cho hiệu năng
CREATE INDEX IF NOT EXISTS idx_book_loans_copy_id ON book_loans(copy_id);
CREATE INDEX IF NOT EXISTS idx_book_loans_registration_date ON book_loans(registration_date);
