CREATE INDEX IF NOT EXISTS idx_books_code ON books(code);
CREATE INDEX IF NOT EXISTS idx_books_slug ON books(slug);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_copies_barcode ON publication_copies(barcode);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC);
