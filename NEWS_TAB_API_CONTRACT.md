# NEWS TAB API CONTRACT (2026-04-10)

Tai lieu nay chuan hoa API cho tab Tin tuc tren Mobile App.

## 1. Muc tieu
- Dong bo endpoint giua frontend va backend cho tab Tin tuc.
- Dung chung response envelope 7 truong: `code`, `success`, `message`, `data`, `errorId`, `appId`, `errors`.

## 2. API can dung tren News tab

### 2.1 Danh sach tin tuc
- Method: `GET /api/public/news`
- Query:
  - `search`: tim theo tieu de/noi dung
  - `category_id`: loc danh muc
  - `featured`: loc bai viet noi bat
  - `page`, `limit`: phan trang
- Response data:
  - Danh sach bai viet public da published

### 2.2 Chi tiet tin tuc
- Method: `GET /api/public/news/{slug}`
- Response data:
  - Chi tiet bai viet + noi dung day du

### 2.3 Goi y tin tuc theo tu khoa (cho man search news)
- Method: `GET /api/public/search/ai-news-suggest?query=lap+trinh&pageIndex=1&pageSize=10`
- Response data:
  - `data`: danh sach bai viet
  - `pagination`: phan trang (`page`, `limit`, `total`, `totalPages`)
  - `ai_interpreted`: thong tin parser tu khoa

## 3. Luu y tich hop frontend
- Debounce 300ms truoc khi goi API 2.3.
- Neu `query` rong, nen fallback ve API 2.1 de hien thi danh sach mac dinh.
- Uu tien hien thi anh: `image_url` -> placeholder.
- Date hien thi: parse tu `published_date`.

## 4. Luong goi API de render News tab
1. Vao man News: goi `GET /api/public/news`.
2. User search: goi `GET /api/public/search/ai-news-suggest`.
3. User click bai viet: goi `GET /api/public/news/{slug}`.