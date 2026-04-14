-- Migration: Split reader progress by read mode (page/chapter/scroll)
-- Keep legacy user_reading_progress for backward compatibility (PDF-priority resume)

CREATE TABLE IF NOT EXISTS user_reading_progress_modes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    read_mode VARCHAR(20) NOT NULL,
    last_page INTEGER,
    progress_percent NUMERIC(5,2) DEFAULT 0,
    scroll_percent NUMERIC(5,2),
    scroll_offset INTEGER,
    is_finished BOOLEAN DEFAULT FALSE,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id, read_mode)
);

CREATE INDEX IF NOT EXISTS idx_user_reading_progress_modes_user_book
    ON user_reading_progress_modes(user_id, book_id);

CREATE INDEX IF NOT EXISTS idx_user_reading_progress_modes_mode
    ON user_reading_progress_modes(read_mode);
