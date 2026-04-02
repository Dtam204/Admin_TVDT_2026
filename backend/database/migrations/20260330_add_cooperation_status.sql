-- Migration: Bổ sung trạng thái hợp tác cho Ấn phẩm (Books)
-- Giá trị: 'cooperating' (Mặc định), 'ceased_cooperation' (Ngưng hợp tác)

ALTER TABLE books 
ADD COLUMN cooperation_status VARCHAR(50) DEFAULT 'cooperating';

-- Cập nhật tất cả sách hiện tại sang trạng thái 'cooperating'
UPDATE books SET cooperation_status = 'cooperating' WHERE cooperation_status IS NULL;

-- Comment cho cột mới
COMMENT ON COLUMN books.cooperation_status IS 'Trạng thái hợp tác bản quyền (cooperating/ceased_cooperation)';
