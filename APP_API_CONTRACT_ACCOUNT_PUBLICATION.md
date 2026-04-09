# APP API Contract - Account + Publication (2026-04-09)

## 1. Muc tieu
- Chuan hoa API cho giao dien app theo luong on dinh.
- Dam bao response thong nhat 7 truong:
  - `code`, `success`, `message`, `data`, `errorId`, `appId`, `errors`
- API danh sach va chi tiet an pham co contract ro rang de app render truc tiep.

## 2. API tab Tai khoan (Account)

### 2.1 Profile
- Method: `GET /api/reader/profile/me`
- Auth: Bearer token
- Data chinh:
  - `full_name`, `email`, `phone`, `card_number`, `balance`, `membership_expires`, `plan_name`, `tier_code`, `is_expired`

### 2.2 Lich su giao dich
- Method: `GET /api/reader/transactions?page=1&limit=10`
- Auth: Bearer token
- Data item:
  - `id`, `amount`, `type`, `status`, `description`, `transaction_id`, `created_at`
- Pagination:
  - `total_items`, `total_pages`, `current_page`, `limit`

### 2.3 Lich su muon tra
- Method: `GET /api/reader/borrow-history?page=1&limit=10`
- Auth: Bearer token
- Data item:
  - `id`, `borrow_date`, `return_date`, `due_date`, `status`, `late_fee`, `title`, `author`, `thumbnail`, `barcode`

### 2.4 Lich su goi hoi vien
- Method: `GET /api/reader/membership-requests?page=1&limit=10`
- Auth: Bearer token
- Data item:
  - `id`, `status`, `amount`, `note`, `plan_name`, `transaction_id`, `created_at`

## 3. API danh sach an pham cho app

### 3.1 Danh sach an pham
- Method: `GET /api/public/publications`
- Auth: optional
- Query:
  - `search`, `title`, `author`, `year_from`, `year_to`, `publisher_id`, `media_type`, `sort_by`, `order`, `page`, `limit`
- Runtime clamp:
  - `page >= 1`
  - `1 <= limit <= 100`
- Response:
  - `data`: array
  - `pagination`: object (`page`, `limit`, `total`, `totalItems`, `totalPages`, `currentPage`)

- Item fields (app can render directly):
  - `id`, `code`, `isbn`, `title`, `author`, `slug`, `cover_image`, `thumbnail`, `publication_year`, `pages`, `media_type`, `status`, `access_policy`, `publisher_name`, `copy_count`, `view_count`, `favorite_count`

## 4. API chi tiet an pham cho app

### 4.1 Chi tiet an pham
- Method: `GET /api/public/publications/{id_or_slug}`
- Auth: optional (token neu can personalization)
- Response data:
  - Full publication info + `copies` + `relatedItems` + `user_interaction` + `canRead`
- Ghi nhan view:
  - Backend ghi `interaction_logs` theo `pub.id` da resolve de ho tro ca id va slug on dinh.

### 4.2 Tom tat AI
- Method: `POST /api/public/publications/{id_or_slug}/summarize`
- Response data:
  - `summary`, `cached`

## 5. Quy uoc response
- Success: `code = 0`
- Fail: `code = HTTP status` (4xx/5xx)
- Luon co `success` bool va `message` de app hien thong bao.

## 6. Luu y tich hop frontend app
- `title`/`description` co the la plain text hoac JSON string. Nen parse an toan.
- Uu tien hien thi anh theo thu tu: `thumbnail` -> `cover_image`.
- O detail, favorite state uu tien doc:
  - `data.user_interaction.isFavorited` sau do fallback `data.isFavorited`.

## 7. Endpoints su dung de viet giao dien ngay
- Account:
  - `GET /api/reader/profile/me`
  - `GET /api/reader/transactions`
  - `GET /api/reader/borrow-history`
  - `GET /api/reader/membership-requests`
- Publication:
  - `GET /api/public/publications`
  - `GET /api/public/publications/{id_or_slug}`
  - `POST /api/public/publications/{id_or_slug}/summarize`
