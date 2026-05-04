# Public/App API Handoff

Tài liệu này chốt toàn bộ các endpoint `public/app` để FE có thể bắt đầu tích hợp API cho giao diện app.

## Mục tiêu
- API cho giao diện app phải **đủ**.
- Swagger phải **rõ** để FE call được ngay.
- Không lặp, không trùng, không ép chung sai schema.
- Giữ nguyên các luồng backend đang hoạt động ổn định.
- Bỏ qua toàn bộ module khóa học theo yêu cầu.

---

## 1. Phạm vi triển khai

Các nhóm API public/app hiện đã được rà soát:

1. `Public Home`
2. `Public Books`
3. `Public News`
4. `Comments`
5. `Public Search`
6. `Public Resource`
7. `Public Notification`

---

## 2. Checklist theo từng module

### 2.1 Public Home

#### Mục đích
Dùng để dựng các block ở trang chủ app:
- banner
- gợi ý
- mới cập nhật
- xem nhiều
- mượn nhiều
- yêu thích
- gói hội viên

#### Endpoints
- `GET /api/public/home/get-suggest-books`
- `GET /api/public/home/get-updated-books`
- `GET /api/public/home/get-most-viewed-books-of-the-week`
- `GET /api/public/home/get-most-borrowed-documents`
- `GET /api/public/home/get-top-favorite`
- `GET /api/public/home/get-top-recommend`
- `GET /api/public/home/membership-plans`
- `GET /api/public/home/membership-plans/{id}`
- `GET /api/public/home`

#### Màn hình FE
- Home screen
- Membership plan screen
- Banner carousel
- Book section cards

#### Checklist FE
- render banner section từ `get-top-recommend`
- render sách gợi ý từ `get-suggest-books`
- render sách mới từ `get-updated-books`
- render trending tuần từ `get-most-viewed-books-of-the-week`
- render sách mượn nhiều từ `get-most-borrowed-documents`
- render nổi bật/yêu thích từ `get-top-favorite`
- render list gói hội viên từ `membership-plans`
- render detail gói từ `membership-plans/{id}`
- nếu section rỗng thì ẩn section tương ứng
- không ép chung schema giữa các section

#### Field thường dùng
**Các section sách**
- `id`
- `title`
- `thumbnail`
- `author`
- `publication_year`
- `pages`
- `dominant_color`
- `is_digital`
- `views`
- `borrow_count`
- `description`
- `created_at`

**Membership plan**
- `id`
- `name`
- `tier_code`
- `slug`
- `price`
- `duration_days`
- `description`
- `features`
- `max_books_borrowed`
- `max_renewal_limit`
- `allow_digital_read`
- `allow_download`
- `discount_percentage`
- `priority_support`
- `late_fee_per_day`
- `pricing`
- `benefit_cards`
- `highlight_features`
- `cta`

---

### 2.2 Public Books

#### Mục đích
Dùng cho:
- trang chi tiết ấn phẩm
- màn đọc online
- tải PDF
- tài liệu liên quan
- reviews/favorites
- copies vật lý
- tóm tắt AI

#### Endpoints
- `GET /api/public/publications/lookups`
- `GET /api/public/publications/home-unified`
- `GET /api/public/publications/{id}`
- `GET /api/public/publications/{id}/reading-content`
- `GET /api/public/publications/{id}/pdf-file`
- `GET /api/public/publications/{id}/related`
- `GET /api/public/publications/{id}/copies`
- `POST /api/public/publications/{id}/summarize`
- `GET /api/public/publications/{id}/reviews`
- `POST /api/public/publications/{id}/reviews`
- `POST /api/public/publications/{id}/favorite`
- `DELETE /api/public/publications/{id}/favorite`
- `GET /api/public/publications/{id}/favorite-status`

#### Màn hình FE
- Book detail screen
- Book reader screen
- PDF viewer
- Related books section
- Reviews section
- Favorite button
- Physical copy list / availability
- AI summary block

#### Checklist FE
- call detail bằng `GET /{id}`
- hiển thị metadata đầy đủ
- hiển thị related documents
- hiển thị copies nếu là sách vật lý
- hiển thị summary/trailer nếu có
- hiển thị actions đọc / tải / mượn
- call `reading-content` để biết mode nào có
- nếu có `page_mode` thì mở PDF page reader
- nếu có `chapter_mode` thì render TOC/chapter list
- nếu có `scroll_mode` thì render đọc cuộn
- nếu có `pdf-file` thì tải/đọc file thật
- hỗ trợ `Range` nếu FE download/resume
- show reviews list từ `GET /reviews`
- submit review từ `POST /reviews`
- favorite/unfavorite
- favorite status check
- call `summarize` để lấy tóm tắt

#### Field thường dùng
**Detail**
- `id`
- `title`
- `author`
- `authors_list`
- `slug`
- `publisher_name`
- `description`
- `cover_image`
- `thumbnail`
- `dominant_color`
- `publication_year`
- `pages`
- `status`
- `media_type`
- `is_digital`
- `format`
- `cooperation_status`
- `view_count`
- `favorite_count`
- `copy_count`
- `content_url`
- `digital_file_url`
- `digital_file_path`
- `access_policy`
- `actions`
- `current_collection`
- `collection_list`
- `copies`
- `related_documents`
- `information_fields`
- `trailerInfo`
- `preview_pages`
- `digitized_files`
- `reading_content`
- `user_interaction`

**Reading content**
- `can_read`
- `source_policy`
- `available_modes`
- `default_mode`
- `page_mode`
- `chapter_mode`
- `scroll_mode`

---

### 2.3 Public News

#### Mục đích
Dùng cho:
- danh sách tin tức
- chi tiết bài viết
- bài viết theo locale
- block news trong app

#### Endpoints
- `GET /api/public/news`
- `GET /api/public/news/{slug}`

#### Màn hình FE
- News list screen
- News detail screen

#### Checklist FE
- render danh sách tin tức từ `GET /news`
- hỗ trợ search theo query nếu cần
- render thumbnail + summary + read time
- render HTML content ở detail
- render gallery images
- render seo metadata nếu cần

#### Field thường dùng
**List**
- `id`
- `title`
- `slug`
- `summary`
- `excerpt`
- `author`
- `readTime`
- `thumbnail`
- `imageUrl`
- `isFeatured`
- `status`
- `publishedDate`
- `commentsCount`

**Detail**
- `content`
- `galleryTitle`
- `seoTitle`
- `seoDescription`
- `seoKeywords`
- `galleryImages`

---

### 2.4 Comments

#### Mục đích
Dùng cho:
- comment tin tức
- comment sách
- comment reply đa tầng
- report comment

#### Endpoints
- `GET /api/public/comments/{objectType}/{objectId}`
- `POST /api/public/comments`
- `PUT /api/public/comments/{id}`
- `DELETE /api/public/comments/{id}`
- `POST /api/public/comments/{id}/report`

#### Màn hình FE
- Comment section của book detail
- Comment section của news detail
- Reply thread
- Report comment modal

#### Checklist FE
- hiển thị cây reply đa tầng
- chỉ show comment approved
- render avatar/name/time/content/replies
- login required cho create/update/delete/report
- support reply via `parentId`
- support `replyToUserId`
- support `rating` nếu cần

#### Field thường dùng
- `id`
- `userId`
- `user_name`
- `user_email`
- `objectType`
- `objectId`
- `parentId`
- `replyToUserId`
- `content`
- `rating`
- `status`
- `replies`
- `created_at`
- `updated_at`

---

### 2.5 Public Search

#### Mục đích
Dùng cho toàn bộ luồng tìm kiếm trên app:
- autocomplete
- search ấn phẩm
- search tin tức
- AI smart search
- barcode scan

#### Endpoints
- `POST /api/public/search/ai-smart`
- `GET /api/public/search/ai-news-suggest`
- `GET /api/public/search/autocomplete`
- `GET /api/public/search/publications`
- `GET /api/public/search/barcode/{barcode}`

#### Màn hình FE
- Search bar
- Search result screen
- Autocomplete dropdown
- AI search screen
- Barcode scan result screen
- News search tab
- Books search tab

#### Checklist FE
- debounce 300ms cho autocomplete
- call autocomplete khi nhập từ 2 ký tự
- search publications theo keyword/author/year/collection
- support pagination cho publications search
- AI smart search hiển thị `ai_interpreted` nếu cần debug
- barcode scan điều hướng trực tiếp sang detail nếu found

#### Field thường dùng
**Autocomplete**
- `id`
- `label`
- `subtitle`
- `thumbnail`
- `year`
- `type`

**Publications search**
- `items`
- `pagination`

**News search**
- `items`
- `pagination`

**AI smart**
- `type`
- `items`
- `totalRecords`
- `totalPages`
- `pageIndex`
- `pageSize`
- `ai_interpreted`

---

### 2.6 Public Resource

#### Mục đích
Dùng cho:
- resource hub
- tab điều hướng
- trending
- alias-based resource listing

#### Endpoints
- `POST /api/public/resource/list`
- `POST /api/public/resource/list-tab`
- `POST /api/public/resource/trending`
- `POST /api/public/resource/alias`

#### Màn hình FE
- Resource hub screen
- Discovery / explore screen
- Trending sections
- Category/alias section

#### Checklist FE
- render tree-view or hub list
- render tabs bằng `key`, `label`, `icon`
- filter trending/favorite/views/rating
- support deep-linked category/collection via alias

#### Field thường dùng
**Resource item**
- `id`
- `title`
- `thumbnail`
- `author`
- `publication_year`
- `dominant_color`
- `is_digital`
- `views`
- `borrow_count`
- `rating`

**Resource tab item**
- `key`
- `label`
- `icon`

---

### 2.7 Public Notification

#### Mục đích
Dùng cho in-app notification của bạn đọc/app user.

#### Endpoints
- `GET /api/public/notifications`
- `POST /api/public/notifications/{id}/read`
- `POST /api/public/notifications/mark-all-read`
- `DELETE /api/public/notifications/{id}`

#### Màn hình FE
- Notification center screen
- Bell dropdown
- Unread badge
- Startup announcement nếu cần

#### Checklist FE
- show unread badge count
- show title/message by locale
- show read/unread state
- update item state immediately after read
- bulk update UI after mark all read
- remove item after delete

#### Field thường dùng
- `id`
- `member_id`
- `sender_id`
- `target_type`
- `title`
- `message`
- `metadata`
- `type`
- `status`
- `is_read`
- `related_id`
- `related_type`
- `created_at`
- `updated_at`
- `unreadCount`
- `startupAnnouncement`

---

## 3. Bảng mapping API → màn hình app

| Màn hình App | Endpoint | Mục đích |
|---|---|---|
| Home | `GET /api/public/home/get-suggest-books` | Block sách gợi ý |
| Home | `GET /api/public/home/get-updated-books` | Block mới cập nhật |
| Home | `GET /api/public/home/get-most-viewed-books-of-the-week` | Block trending tuần |
| Home | `GET /api/public/home/get-most-borrowed-documents` | Block mượn nhiều |
| Home | `GET /api/public/home/get-top-favorite` | Block nổi bật/yêu thích |
| Home | `GET /api/public/home/get-top-recommend` | Banner carousel |
| Home | `GET /api/public/home/membership-plans` | Danh sách gói hội viên |
| Membership detail | `GET /api/public/home/membership-plans/{id}` | Chi tiết gói |
| Book detail | `GET /api/public/publications/{id}` | Chi tiết ấn phẩm |
| Book reader | `GET /api/public/publications/{id}/reading-content` | Dữ liệu đọc |
| Book reader/download | `GET /api/public/publications/{id}/pdf-file` | File PDF thật |
| Book detail | `GET /api/public/publications/{id}/related` | Tài liệu liên quan |
| Book detail | `GET /api/public/publications/{id}/copies` | Bản sao vật lý |
| Book detail | `GET /api/public/publications/{id}/reviews` | Danh sách review |
| Book detail | `POST /api/public/publications/{id}/reviews` | Gửi review |
| Book detail | `POST /api/public/publications/{id}/favorite` | Yêu thích |
| Book detail | `DELETE /api/public/publications/{id}/favorite` | Bỏ yêu thích |
| Book detail | `GET /api/public/publications/{id}/favorite-status` | Trạng thái yêu thích |
| News list | `GET /api/public/news` | Danh sách tin tức |
| News detail | `GET /api/public/news/{slug}` | Chi tiết tin tức |
| Comment section | `GET /api/public/comments/{objectType}/{objectId}` | Lấy comment tree |
| Comment section | `POST /api/public/comments` | Tạo comment/reply |
| Comment section | `PUT /api/public/comments/{id}` | Sửa comment |
| Comment section | `DELETE /api/public/comments/{id}` | Xóa comment |
| Comment section | `POST /api/public/comments/{id}/report` | Báo cáo comment |
| Search bar | `GET /api/public/search/autocomplete` | Gợi ý nhanh |
| Search screen | `GET /api/public/search/publications` | Tìm ấn phẩm |
| Search news tab | `GET /api/public/search/ai-news-suggest` | Gợi ý tin tức |
| Search AI | `POST /api/public/search/ai-smart` | Tìm kiếm thông minh |
| Barcode scan | `GET /api/public/search/barcode/{barcode}` | Tra cứu bằng mã |
| Resource hub | `POST /api/public/resource/list` | Danh sách tài nguyên |
| Resource hub tabs | `POST /api/public/resource/list-tab` | Danh sách tab |
| Resource hub trending | `POST /api/public/resource/trending` | Top trending |
| Resource alias | `POST /api/public/resource/alias` | Theo alias |
| Notification center | `GET /api/public/notifications` | Danh sách thông báo |
| Notification item | `POST /api/public/notifications/{id}/read` | Đánh dấu đã đọc |
| Notification center | `POST /api/public/notifications/mark-all-read` | Đọc tất cả |
| Notification item | `DELETE /api/public/notifications/{id}` | Xóa thông báo |

---

## 4. Điều FE cần lưu ý để tránh lỗi luồng

### A. Không giả định response giống nhau
Ví dụ:
- home section không giống book detail
- search response không giống resource response
- notification response không giống comment response

### B. Luôn check null/empty
- `page_mode`
- `chapter_mode`
- `scroll_mode`
- `related_documents`
- `copies`
- `galleryImages`
- `items`

### C. Tách luồng login / không login
- comments create/update/delete/report cần login
- notifications cần login
- favorite/review có thể cần login tùy rule backend

### D. Chỉ render khi API thật sự trả dữ liệu
Không ép UI theo field “có lẽ có”.

---

## 5. Kết luận bàn giao

### Đã đủ để FE bắt đầu call
- Public Home
- Public Books
- Public News
- Comments
- Public Search
- Public Resource
- Public Notification

### Cần FE test thực tế
- auth / token flows
- PDF/Range
- fulltext/scroll
- chapter mode
- locale strings
- empty state handling
- pagination on search/resource/plans

### Trạng thái hệ thống
- Luồng public/app hiện đã đủ để FE bắt đầu tích hợp.
- Swagger đã rõ hơn và có thể dùng làm tài liệu call API.
- Không đụng module khóa học.
- Không cố gom các section home vào 1 schema chung, giữ đúng từng kiểu trả riêng.

---

## 6. Ghi chú cuối
Tài liệu này phục vụ bàn giao FE. Nếu cần, có thể tách tiếp thành:
- checklist ngắn cho dev FE
- bảng API request/response mẫu
- tài liệu riêng cho Book Reader
