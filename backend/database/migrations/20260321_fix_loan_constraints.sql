-- Migration: Sửa lỗi ràng buộc NOT NULL cho book_loans và tối ưu hóa cho mượn trực tiếp
-- Date: 2026-03-21

-- 1. Cho phép due_date và loan_date nhận giá trị NULL (cần thiết cho trạng thái 'pending')
ALTER TABLE book_loans ALTER COLUMN due_date DROP NOT NULL;
ALTER TABLE book_loans ALTER COLUMN loan_date DROP NOT NULL;

-- 2. Đảm bảo loan_date mặc định là NULL nếu không cung cấp (thay vì CURRENT_DATE) 
-- để phân biệt rõ giữa "Ngày yêu cầu" và "Ngày thực tế cầm sách"
ALTER TABLE book_loans ALTER COLUMN loan_date SET DEFAULT NULL;

-- 3. Cập nhật các bản ghi cũ nếu cần (tùy chọn)
-- UPDATE book_loans SET registration_date = loan_date WHERE registration_date IS NULL AND loan_date IS NOT NULL;
