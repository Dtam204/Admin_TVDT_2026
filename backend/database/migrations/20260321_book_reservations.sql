-- Migration: Tạo bảng quản lý đặt giữ chỗ (Reservations) - FIX ĐỊNH DẠNG ID
-- Thời gian: 2026-03-21

CREATE TABLE IF NOT EXISTS book_reservations (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'fulfilled', 'cancelled', 'expired')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index để tìm kiếm hàng đợi nhanh theo sách
CREATE INDEX IF NOT EXISTS idx_reservations_book_id ON book_reservations(book_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_member_id ON book_reservations(member_id);
