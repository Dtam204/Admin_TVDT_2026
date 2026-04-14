# READER READING SYNC API GUIDE

Tài liệu này mô tả đầy đủ API đọc ấn phẩm online và đồng bộ vị trí đọc dở cho team giao diện app.

Mục tiêu:
- Team app gọi API là render được ngay 3 chế độ đọc: Trang, Chương, Cuộn.
- Khi thoát ra vào lại, app tự nhảy đúng vị trí đọc dở.

## 1. Tổng quan kiến trúc đọc

Quy ước nguồn dữ liệu:
- Tab Trang: lấy từ PDF.
- Tab Chương: lấy từ PDF (TOC/chapter map).
- Tab Cuộn: lấy từ Fulltext.

Payload chuẩn đã được backend gom sẵn trong trường `reading_content`.

## 2. Danh sách endpoint cần dùng

### 2.1 Lấy chi tiết ấn phẩm (kèm reading_content + readingProgress)
- Method: `GET /api/public/publications/{id_or_slug}`
- Auth: optional (nếu có token sẽ trả thêm `readingProgress` theo user)
- Dùng khi vào màn chi tiết hoặc vào reader bằng 1 call duy nhất.

Trường quan trọng trong response:
- `data.reading_content`: cấu hình mode đọc.
- `data.readingProgress`: vị trí đang đọc dở của user (nếu đăng nhập).

### 2.2 Lấy payload đọc online chuyên dụng
- Method: `GET /api/public/publications/{id_or_slug}/reading-content`
- Auth: optional
- Dùng khi app muốn tách riêng call cho reader.

Trường quan trọng:
- `data.reading_content.available_modes`
- `data.reading_content.default_mode`
- `data.reading_content.page_mode`
- `data.reading_content.chapter_mode`
- `data.reading_content.scroll_mode`

PDF asset mới cho tải offline/cache:
- `data.reading_content.page_mode.pdf_asset.download_url` (URL tải file PDF thật)
- `data.reading_content.page_mode.pdf_asset.file_hash`
- `data.reading_content.page_mode.pdf_asset.version`
- `data.reading_content.page_mode.pdf_asset.file_size`
- `data.reading_content.page_mode.pdf_asset.updated_at`
- `data.reading_content.page_mode.pdf_asset.mime_type`
- `data.reading_content.page_mode.pdf_asset.supports_range`

### 2.3 Lưu tiến độ đọc
- Method: `POST /api/reader/actions/progress`
- Auth: required
- Body:
```json
{
  "bookId": 123,
  "readMode": "page",
  "lastPage": 27,
  "progressPercent": 45.5,
  "scrollPercent": null,
  "scrollOffset": null,
  "isFinished": false
}
```

Quy ước mode:
- `readMode = page|chapter`: đồng bộ theo số trang PDF, đồng thời cập nhật bảng tiến độ chuẩn để resume chính xác theo trang.
- `readMode = scroll`: lưu tiến độ riêng cho fulltext (`scrollPercent`, `scrollOffset`), không ghi đè vị trí trang PDF.

### 2.4 Lấy tiến độ đọc theo ấn phẩm
- Method: `GET /api/reader/actions/progress/{bookId}`
- Auth: required

Response có thêm:
- `data.mode_progress`: tiến độ tách theo từng mode (`page`, `chapter`, `scroll`).
- `data.preferred_mode`: mode ưu tiên để resume.

Nguyên tắc ưu tiên resume:
- Ưu tiên `page` (PDF) -> nếu không có thì `chapter` -> nếu không có thì `scroll`.

Nếu chưa có dữ liệu, backend trả mặc định:
- `last_page = 1`
- `progress_percent = 0`
- `is_finished = false`

## 3. Contract payload đọc online

`reading_content` có cấu trúc:

```json
{
  "can_read": true,
  "source_policy": {
    "page": "pdf",
    "chapter": "pdf",
    "scroll": "fulltext"
  },
  "available_modes": ["page", "chapter", "scroll"],
  "default_mode": "page",
  "page_mode": {
    "enabled": true,
    "pdf_url": "/uploads/.../file.pdf",
    "pdf_asset": {
      "download_url": "/api/public/publications/123/pdf-file",
      "pdf_url_absolute": "https://api.example.com/uploads/.../file.pdf",
      "download_url_absolute": "https://api.example.com/api/public/publications/123/pdf-file",
      "file_hash": "sha256...",
      "version": "1245000-1713078123456",
      "file_size": 1245000,
      "updated_at": "2026-04-14T08:01:20.000Z",
      "mime_type": "application/pdf",
      "supports_range": true
    },
    "total_pages": 210,
    "preview_pages": [
      { "index": 1, "label": "Trang 1", "value": 1 }
    ],
    "preview_source": "pdf_pages",
    "preview_images_ready": false
  },
  "chapter_mode": {
    "enabled": true,
    "total_chapters": 12,
    "chapters": [
      {
        "id": "chapter-1",
        "title": "Chương 1",
        "order": 1,
        "start_page": 1,
        "end_page": 12,
        "page_range": "1-12"
      }
    ]
  },
  "scroll_mode": {
    "enabled": true,
    "full_text": {
      "enabled": true,
      "format": "html",
      "content": "<p>...</p>",
      "word_count": 18500,
      "excerpt": "..."
    }
  }
}
```

## 4. Luồng tích hợp chuẩn cho app

### Bước 1: Mở màn đọc
- Gọi `GET /api/public/publications/{id}`.
- Lấy `reading_content` để render 3 tab.
- Nếu có `readingProgress.last_page`, set vị trí mở ban đầu theo trang đó.

### Bước 2: Render theo tab
- Tab Trang:
  - Dùng `page_mode.pdf_url` + `page_mode.total_pages`.
- Tab Chương:
  - Dùng `chapter_mode.chapters` để nhảy trang trong PDF.
- Tab Cuộn:
  - Dùng `scroll_mode.full_text.content` để render HTML/Text.

### Bước 3: Ghi tiến độ định kỳ
- Khi user đổi trang hoặc sau debounce 1-2s:
  - Gọi `POST /api/reader/actions/progress`.
- Trường hợp đọc xong:
  - Set `isFinished = true`, `progressPercent = 100`.

### Bước 4: Resume khi vào lại
- Cách nhanh: đọc `data.readingProgress` từ API chi tiết.
- Cách tách riêng: gọi thêm `GET /api/reader/actions/progress/{bookId}`.

## 5. Mapping UI theo dữ liệu API

- Header `Trang x/y`:
  - `x = readingProgress.last_page` (nếu có), fallback 1.
  - `y = reading_content.page_mode.total_pages`.

- Danh sách chương:
  - `title = chapter.title`
  - `sub = "Tr.${start_page}-${end_page}"`

- Tab Cuộn:
  - Nếu `format = html`, render WebView/HTML widget.
  - Nếu `format = text`, render text viewer chuẩn.

## 6. Lưu ý xử lý lỗi

- `can_read = false`:
  - Hiện paywall/upgrade theo `access_policy`.
- `page_mode.enabled = false`:
  - Ẩn tab Trang.
- `chapter_mode.enabled = false`:
  - Ẩn tab Chương.
- `scroll_mode.enabled = false`:
  - Ẩn tab Cuộn.

## 7. Checklist test nhanh cho team app

1. Mở ấn phẩm số có PDF -> thấy tab Trang hoạt động.
2. Có TOC -> tab Chương hiển thị đúng danh sách.
3. Có fulltext -> tab Cuộn render nội dung.
4. Đọc đến trang 27 -> thoát -> vào lại -> tự nhảy trang 27.
5. Đọc xong 100% -> backend trả `is_finished = true`.

## 8. Endpoint matrix

- Public/Reader view:
  - `GET /api/public/publications/{id_or_slug}`
  - `GET /api/public/publications/{id_or_slug}/reading-content`
  - `GET /api/public/publications/{id_or_slug}/pdf-file`

- Authenticated reader actions:
  - `POST /api/reader/actions/progress`
  - `GET /api/reader/actions/progress/{bookId}`

Tài liệu này đã đồng bộ với backend hiện tại.