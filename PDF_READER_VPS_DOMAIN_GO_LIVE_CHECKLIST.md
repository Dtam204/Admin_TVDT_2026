# PDF Reader VPS Domain Go-Live Checklist

Muc tieu: Chot luong API PDF chuan production de app tai lan dau, doc ngay, cache offline on dinh.

## 1) Contract chuan backend (bat buoc)

Endpoint chinh:
- GET /api/public/publications/{id_or_slug}
- GET /api/public/publications/{id_or_slug}/reading-content
- GET /api/public/publications/{id_or_slug}/pdf-file
- POST /api/reader/actions/progress
- GET /api/reader/actions/progress/{bookId}

Trong reading_content.page_mode phai co:
- enabled: true/false
- pdf_url: uu tien path tuong doi hoac URL public
- pdf_asset.download_url: duong dan tai file that (/api/public/publications/{id}/pdf-file)
- pdf_asset.file_hash
- pdf_asset.version
- pdf_asset.file_size
- pdf_asset.updated_at
- pdf_asset.mime_type = application/pdf
- pdf_asset.supports_range = true
- total_pages: tong so trang PDF that
- preview_pages: danh sach trang 1..N (metadata trang PDF)
- preview_source = pdf_pages

## 2) Rule nghiep vu

- Physical: khong doc online, chi borrow request
- Digital/Hybrid: cho read/download neu dat access_policy
- FE render nut theo publication.actions.required_action:
  - read_now
  - borrow_request

## 3) Env production

Backend:
- NODE_ENV=production
- JWT_SECRET=... (manh)
- PUBLIC_BASE_URL=https://api.tenmien-cua-ban.com

Frontend/App:
- EXPO_PUBLIC_API_BASE_URL=https://api.tenmien-cua-ban.com

## 4) CORS va reverse proxy

- Cho phep origin app/web cua ban
- Bat HTTPS hop le (Let's Encrypt hoac cert hop le)
- Reverse proxy khong duoc cat header:
  - Range
  - Content-Length
  - Content-Range
  - ETag
  - Last-Modified

## 5) Smoke test truoc khi mo cho FE

1. Kiem tra payload reading-content:
- curl.exe -s "https://api.tenmien-cua-ban.com/api/public/publications/1/reading-content"
- Xac nhan:
  - page_mode.total_pages > 0
  - preview_pages.length = total_pages
  - pdf_asset.download_url ton tai

2. Kiem tra tai full file:
- curl.exe -I "https://api.tenmien-cua-ban.com/api/public/publications/1/pdf-file"
- Phai co:
  - Accept-Ranges: bytes
  - Content-Length
  - Content-Type: application/pdf

3. Kiem tra range download:
- curl.exe -H "Range: bytes=0-1023" -I "https://api.tenmien-cua-ban.com/api/public/publications/1/pdf-file"
- Phai la:
  - HTTP 206
  - Content-Range hop le

4. Kiem tra auth policy:
- Publication premium/vip khong token -> 403 o pdf-file
- Co token dung tier -> 200/206

5. Kiem tra app:
- Lan 1 tai file local co progress
- Lan 2 mo cache local
- Doi file tren admin (version/hash thay doi) -> app refresh cache

## 6) Tieu chi go-live

Dat go-live khi tat ca dieu kien sau deu pass:
- Payload reading_content dung contract
- pdf-file stream duoc voi range
- App Android mo duoc PDF tren may that
- Progress save/get on dinh theo mode
- Khong con URL localhost trong payload production
