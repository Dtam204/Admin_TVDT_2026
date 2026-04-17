BEGIN;

-- Thêm cột storage_location_id
ALTER TABLE publication_copies
ADD COLUMN IF NOT EXISTS storage_location_id INTEGER;

-- Thêm cột condition
ALTER TABLE publication_copies
ADD COLUMN IF NOT EXISTS condition VARCHAR(50) DEFAULT 'good';

-- Tạo index cho storage_location_id
CREATE INDEX IF NOT EXISTS idx_publication_copies_storage_location_id
ON publication_copies(storage_location_id);

-- Thêm foreign key (nếu chưa có)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'publication_copies_storage_location_id_fkey'
      AND table_name = 'publication_copies'
  ) THEN
    ALTER TABLE publication_copies
    ADD CONSTRAINT publication_copies_storage_location_id_fkey
    FOREIGN KEY (storage_location_id)
    REFERENCES storage_locations(id)
    ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;