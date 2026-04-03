-- ============================================================================
-- FIX BORROWING MODULE CONSTRAINTS & TABLES
-- ============================================================================

-- 1. Nới lỏng ràng buộc cho book_loans (Cho phép NULL cho các cột ngày tháng khi đăng ký)
ALTER TABLE book_loans ALTER COLUMN loan_date DROP NOT NULL;
ALTER TABLE book_loans ALTER COLUMN due_date DROP NOT NULL;

-- Đảm bảo status có giá trị mặc định là 'pending' nếu không được cung cấp
ALTER TABLE book_loans ALTER COLUMN status SET DEFAULT 'pending';

-- 2. Khôi phục bảng book_reservations (Đặt chỗ)
CREATE TABLE IF NOT EXISTS book_reservations (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'expired', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_book_reservations_member ON book_reservations(member_id);
CREATE INDEX IF NOT EXISTS idx_book_reservations_book ON book_reservations(book_id);
CREATE INDEX IF NOT EXISTS idx_book_reservations_status ON book_reservations(status);

-- 3. Đồng bộ hóa các cột khác nếu thiếu (Cẩn thận rà soát)
-- Bảng members cần check wallet_balance vs balance
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='wallet_balance') THEN
        -- Nếu tồn tại wallet_balance, đổi tên thành balance hoặc sync giá trị
        UPDATE members SET balance = wallet_balance WHERE balance = 0 AND wallet_balance > 0;
    END IF;
END $$;
