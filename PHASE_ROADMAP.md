# 🗺️ ROADMAP - Các Phase Còn Lại

**Dự án:** Hệ thống Quản lý Thư viện & Khóa học Online  
**Ngày tạo:** 2026-01-21  
**Trạng thái:** Phase 1 ✅ Hoàn thành | Phase 2-4 🔲 Đang lên kế hoạch

---

## 📊 TỔNG QUAN CÁC PHASE

| Phase | Tên | Thời gian | Trạng thái | Mô tả |
|-------|-----|-----------|------------|-------|
| **Phase 1** | MVP Cốt lõi | 2-3 tháng | ✅ **HOÀN THÀNH** | Sách, Khóa học, Thành viên, Thanh toán cơ bản |
| **Phase 2** | Tính năng Nâng cao | 2-3 tháng | 🔲 **ĐANG LÊN KẾ HOẠCH** | Nội dung khóa học, Đánh giá, Mã giảm giá, Thông báo |
| **Phase 3** | Tính năng Nâng cao | 2-3 tháng | 🔲 **ĐANG LÊN KẾ HOẠCH** | Phân tích, Sự kiện, Diễn đàn, Gợi ý |
| **Phase 4** | Doanh nghiệp & Mở rộng | 2-3 tháng | 🔲 **ĐANG LÊN KẾ HOẠCH** | Đa tổ chức, Ứng dụng di động, Tính năng AI, Phân tích nâng cao |

**Tổng thời gian ước tính:** 8-12 tháng

---

## ✅ PHASE 1 - MVP CỐT LÕI (HOÀN THÀNH)

**Thời gian:** Đã hoàn thành  
**Trạng thái:** ✅ Sẵn sàng cho Production

### Đã hoàn thành:

#### 📚 Module Sách
- ✅ CRUD Sách (tạo, sửa, xóa, xem)
- ✅ Quản lý Tác giả
- ✅ Quản lý Thể loại sách
- ✅ Quản lý Nhà xuất bản
- ✅ Mượn/Trả sách (cơ bản)
- ✅ Tìm kiếm & Lọc
- ✅ Phân trang

#### 🎓 Module Khóa học
- ✅ CRUD Khóa học
- ✅ Thể loại khóa học
- ✅ Quản lý Giảng viên
- ✅ Tìm kiếm & Lọc
- ✅ Phân trang

#### 👥 Module Thành viên
- ✅ CRUD Thành viên
- ✅ Gói thành viên (4 gói)
- ✅ Hồ sơ thành viên

#### 💳 Module Thanh toán
- ✅ Theo dõi thanh toán cơ bản
- ✅ Lịch sử thanh toán
- ✅ Quản lý giao dịch

#### 🗄️ Cơ sở dữ liệu
- ✅ 30+ bảng
- ✅ 120+ chỉ mục
- ✅ 20+ trigger
- ✅ 50+ dữ liệu mẫu

#### 🎨 Giao diện Frontend
- ✅ 30+ trang (Danh sách, Tạo mới, Chi tiết/Chỉnh sửa)
- ✅ React Query hooks
- ✅ Giao diện Admin hoàn chỉnh

---

## 🔲 PHASE 2 - TÍNH NĂNG NÂNG CAO

**Thời gian:** 2-3 tháng  
**Trạng thái:** 🔲 Đang lên kế hoạch  
**Ưu tiên:** Cao

### 🎯 Mục tiêu
Mở rộng tính năng cho Khóa học, thêm Đánh giá & Xếp hạng, Mã giảm giá, và Hệ thống thông báo.

---

### 📋 Module 1: Quản lý Nội dung Khóa học

#### 1.1. Chương khóa học (Course Sections)
**Mục đích:** Tổ chức nội dung khóa học thành các chương

**Cơ sở dữ liệu:**
```sql
CREATE TABLE course_sections (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title JSONB NOT NULL,
  description JSONB,
  order_index INTEGER NOT NULL,
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Tính năng:**
- ✅ CRUD chương
- ✅ Kéo thả để sắp xếp thứ tự
- ✅ Xem trước chương (cho người dùng miễn phí)
- ✅ Theo dõi tiến độ chương

**API Endpoints:**
- `GET /api/admin/courses/:courseId/sections` - Lấy danh sách chương
- `POST /api/admin/courses/:courseId/sections` - Tạo chương mới
- `PUT /api/admin/sections/:id` - Cập nhật chương
- `DELETE /api/admin/sections/:id` - Xóa chương
- `PATCH /api/admin/sections/:id/reorder` - Sắp xếp lại thứ tự

---

#### 1.2. Bài học (Course Lessons)
**Mục đích:** Quản lý từng bài học trong chương

**Cơ sở dữ liệu:**
```sql
CREATE TABLE course_lessons (
  id SERIAL PRIMARY KEY,
  section_id INTEGER REFERENCES course_sections(id) ON DELETE CASCADE,
  title JSONB NOT NULL,
  content TEXT,
  lesson_type VARCHAR(50) NOT NULL, -- 'video', 'text', 'quiz', 'assignment'
  video_url TEXT,
  video_duration INTEGER, -- giây
  order_index INTEGER NOT NULL,
  is_preview BOOLEAN DEFAULT false,
  resources JSONB, -- tệp đính kèm, liên kết
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Tính năng:**
- ✅ CRUD bài học
- ✅ Tải lên & phát video
- ✅ Nội dung văn bản với trình soạn thảo phong phú
- ✅ Tài nguyên bài học (PDF, liên kết)
- ✅ Xem trước bài học
- ✅ Theo dõi hoàn thành bài học

**API Endpoints:**
- `GET /api/admin/sections/:sectionId/lessons` - Lấy danh sách bài học
- `POST /api/admin/sections/:sectionId/lessons` - Tạo bài học mới
- `PUT /api/admin/lessons/:id` - Cập nhật bài học
- `DELETE /api/admin/lessons/:id` - Xóa bài học
- `PATCH /api/admin/lessons/:id/reorder` - Sắp xếp lại thứ tự

---

#### 1.3. Đăng ký khóa học (Course Enrollments)
**Mục đích:** Quản lý việc đăng ký khóa học của thành viên

**Cơ sở dữ liệu:**
```sql
CREATE TABLE course_enrollments (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  progress_percentage INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'dropped'
  UNIQUE(course_id, member_id)
);

CREATE TABLE lesson_progress (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER REFERENCES course_enrollments(id) ON DELETE CASCADE,
  lesson_id INTEGER REFERENCES course_lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP,
  time_spent INTEGER DEFAULT 0, -- giây
  UNIQUE(enrollment_id, lesson_id)
);
```

**Tính năng:**
- ✅ Đăng ký/Hủy đăng ký khóa học
- ✅ Theo dõi tiến độ bài học
- ✅ Tính phần trăm hoàn thành khóa học
- ✅ Theo dõi lần truy cập cuối
- ✅ Lịch sử đăng ký

**API Endpoints:**
- `GET /api/admin/enrollments` - Lấy danh sách đăng ký
- `POST /api/admin/courses/:courseId/enroll` - Đăng ký khóa học
- `DELETE /api/admin/enrollments/:id` - Hủy đăng ký
- `GET /api/admin/enrollments/:id/progress` - Lấy tiến độ
- `PATCH /api/admin/lessons/:lessonId/complete` - Đánh dấu hoàn thành bài học

---

### 📋 Module 2: Bài kiểm tra & Bài tập

#### 2.1. Bài kiểm tra (Quizzes)
**Cơ sở dữ liệu:**
```sql
CREATE TABLE quizzes (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id INTEGER REFERENCES course_lessons(id) ON DELETE SET NULL,
  title JSONB NOT NULL,
  description JSONB,
  time_limit INTEGER, -- phút, NULL = không giới hạn
  passing_score INTEGER DEFAULT 60, -- phần trăm
  max_attempts INTEGER DEFAULT 3,
  shuffle_questions BOOLEAN DEFAULT false,
  show_correct_answers BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quiz_questions (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text JSONB NOT NULL,
  question_type VARCHAR(50) NOT NULL, -- 'multiple_choice', 'true_false', 'short_answer'
  options JSONB, -- Cho câu hỏi trắc nghiệm: [{"text": "...", "is_correct": true}, ...]
  correct_answer TEXT, -- Cho câu trả lời ngắn
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL
);

CREATE TABLE quiz_attempts (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP,
  score INTEGER,
  passed BOOLEAN,
  answers JSONB -- Lưu câu trả lời của thành viên
);
```

**Tính năng:**
- ✅ Tạo bài kiểm tra với nhiều loại câu hỏi
- ✅ Giới hạn thời gian & số lần làm
- ✅ Tự động chấm điểm
- ✅ Theo dõi lần làm bài
- ✅ Kết quả & phân tích

**API Endpoints:**
- `GET /api/admin/quizzes` - Lấy danh sách bài kiểm tra
- `POST /api/admin/quizzes` - Tạo bài kiểm tra mới
- `PUT /api/admin/quizzes/:id` - Cập nhật bài kiểm tra
- `DELETE /api/admin/quizzes/:id` - Xóa bài kiểm tra
- `GET /api/admin/quizzes/:id/questions` - Lấy câu hỏi
- `POST /api/admin/quizzes/:id/questions` - Thêm câu hỏi
- `POST /api/admin/quizzes/:id/attempt` - Làm bài kiểm tra (thành viên)
- `GET /api/admin/quiz-attempts` - Lấy lịch sử làm bài

---

#### 2.2. Bài tập (Assignments)
**Cơ sở dữ liệu:**
```sql
CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id INTEGER REFERENCES course_lessons(id) ON DELETE SET NULL,
  title JSONB NOT NULL,
  description JSONB,
  instructions TEXT,
  due_date TIMESTAMP,
  max_score INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assignment_submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  content TEXT,
  attachments JSONB, -- URL tệp
  score INTEGER,
  feedback TEXT,
  graded_at TIMESTAMP,
  graded_by INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'submitted' -- 'submitted', 'graded', 'returned'
);
```

**Tính năng:**
- ✅ Tạo bài tập
- ✅ Nộp bài tập (văn bản + tệp)
- ✅ Chấm điểm bài tập (giảng viên)
- ✅ Hệ thống phản hồi
- ✅ Theo dõi hạn nộp

**API Endpoints:**
- `GET /api/admin/assignments` - Lấy danh sách bài tập
- `POST /api/admin/assignments` - Tạo bài tập mới
- `PUT /api/admin/assignments/:id` - Cập nhật bài tập
- `POST /api/admin/assignments/:id/submit` - Nộp bài tập (thành viên)
- `POST /api/admin/submissions/:id/grade` - Chấm điểm bài nộp
- `GET /api/admin/submissions` - Lấy danh sách bài nộp

---

### 📋 Module 3: Đánh giá & Xếp hạng

#### 3.1. Đánh giá Sách
**Cơ sở dữ liệu:**
```sql
CREATE TABLE book_reviews (
  id SERIAL PRIMARY KEY,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT,
  helpful_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book_id, member_id)
);

CREATE TABLE review_helpful (
  id SERIAL PRIMARY KEY,
  review_id INTEGER REFERENCES book_reviews(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE(review_id, member_id)
);
```

**Tính năng:**
- ✅ Đánh giá sách (1-5 sao)
- ✅ Viết đánh giá
- ✅ Bình chọn hữu ích
- ✅ Kiểm duyệt đánh giá
- ✅ Tính điểm trung bình
- ✅ Phân trang đánh giá

**API Endpoints:**
- `GET /api/admin/books/:bookId/reviews` - Lấy đánh giá sách
- `POST /api/admin/books/:bookId/reviews` - Tạo đánh giá (thành viên)
- `PUT /api/admin/reviews/:id` - Cập nhật đánh giá
- `DELETE /api/admin/reviews/:id` - Xóa đánh giá
- `POST /api/admin/reviews/:id/helpful` - Đánh dấu hữu ích
- `PATCH /api/admin/reviews/:id/approve` - Duyệt đánh giá

---

#### 3.2. Đánh giá Khóa học
**Cơ sở dữ liệu:**
```sql
CREATE TABLE course_reviews (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  helpful_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id, member_id)
);
```

**Tính năng:** Tương tự Đánh giá Sách

---

### 📋 Module 4: Mã giảm giá & Khuyến mãi

**Cơ sở dữ liệu:**
```sql
CREATE TABLE coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name JSONB NOT NULL,
  description JSONB,
  discount_type VARCHAR(50) NOT NULL, -- 'percentage', 'fixed_amount'
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  usage_limit INTEGER, -- NULL = không giới hạn
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  applicable_to VARCHAR(50), -- 'all', 'membership', 'course', 'book'
  applicable_ids JSONB, -- ID cụ thể nếu applicable_to là cụ thể
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'expired'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coupon_usage (
  id SERIAL PRIMARY KEY,
  coupon_id INTEGER REFERENCES coupons(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  discount_amount DECIMAL(10,2) NOT NULL
);
```

**Tính năng:**
- ✅ Tạo mã giảm giá (phần trăm/số tiền cố định)
- ✅ Giới hạn số lần sử dụng
- ✅ Thời hạn hiệu lực
- ✅ Áp dụng cho sản phẩm cụ thể
- ✅ Theo dõi sử dụng mã giảm giá
- ✅ Tự động áp dụng mã giảm giá

**API Endpoints:**
- `GET /api/admin/coupons` - Lấy danh sách mã giảm giá
- `POST /api/admin/coupons` - Tạo mã giảm giá mới
- `PUT /api/admin/coupons/:id` - Cập nhật mã giảm giá
- `DELETE /api/admin/coupons/:id` - Xóa mã giảm giá
- `POST /api/admin/coupons/validate` - Kiểm tra mã có hợp lệ không
- `GET /api/admin/coupons/:id/usage` - Lấy lịch sử sử dụng

---

### 📋 Module 5: Hệ thống Thông báo

**Cơ sở dữ liệu:**
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'loan_due', 'loan_overdue', 'enrollment', 'payment', 'system'
  title JSONB NOT NULL,
  message JSONB NOT NULL,
  related_type VARCHAR(50), -- 'book_loan', 'course_enrollment', 'payment'
  related_id INTEGER,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_settings (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  UNIQUE(member_id, notification_type)
);
```

**Tính năng:**
- ✅ Thông báo trong ứng dụng
- ✅ Thông báo qua email
- ✅ Thông báo đẩy (tương lai)
- ✅ Tùy chọn thông báo
- ✅ Đánh dấu đã đọc/chưa đọc
- ✅ Lịch sử thông báo

**API Endpoints:**
- `GET /api/admin/notifications` - Lấy thông báo (thành viên)
- `GET /api/admin/notifications/unread-count` - Đếm thông báo chưa đọc
- `PATCH /api/admin/notifications/:id/read` - Đánh dấu đã đọc
- `PATCH /api/admin/notifications/read-all` - Đánh dấu tất cả đã đọc
- `GET /api/admin/notification-settings` - Lấy cài đặt thông báo
- `PUT /api/admin/notification-settings` - Cập nhật cài đặt

---

### 📋 Module 6: Danh sách Yêu thích & Danh sách Đọc

**Cơ sở dữ liệu:**
```sql
CREATE TABLE wishlists (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(member_id, book_id)
);

CREATE TABLE reading_lists (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reading_list_books (
  id SERIAL PRIMARY KEY,
  reading_list_id INTEGER REFERENCES reading_lists(id) ON DELETE CASCADE,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(reading_list_id, book_id)
);
```

**Tính năng:**
- ✅ Thêm vào danh sách yêu thích
- ✅ Tạo danh sách đọc
- ✅ Danh sách công khai/riêng tư
- ✅ Chia sẻ danh sách đọc

**API Endpoints:**
- `GET /api/admin/wishlist` - Lấy danh sách yêu thích (thành viên)
- `POST /api/admin/wishlist` - Thêm vào danh sách yêu thích
- `DELETE /api/admin/wishlist/:bookId` - Xóa khỏi danh sách yêu thích
- `GET /api/admin/reading-lists` - Lấy danh sách đọc
- `POST /api/admin/reading-lists` - Tạo danh sách đọc mới
- `POST /api/admin/reading-lists/:id/books` - Thêm sách vào danh sách
- `DELETE /api/admin/reading-lists/:id/books/:bookId` - Xóa sách khỏi danh sách

---

### 🎯 Lộ trình Triển khai Phase 2

| Tuần | Module | Nhiệm vụ |
|------|--------|----------|
| **1-2** | Chương & Bài học Khóa học | Cơ sở dữ liệu, Backend API, Giao diện Frontend |
| **3-4** | Đăng ký Khóa học | Hệ thống đăng ký, Theo dõi tiến độ |
| **5-6** | Bài kiểm tra & Bài tập | Trình tạo bài kiểm tra, Hệ thống bài tập |
| **7-8** | Đánh giá & Xếp hạng | Hệ thống đánh giá, Kiểm duyệt |
| **9-10** | Mã giảm giá & Thông báo | Quản lý mã giảm giá, Hệ thống thông báo |
| **11-12** | Danh sách Yêu thích & Hoàn thiện | Tính năng cuối, Kiểm thử, Sửa lỗi |

---

## 🔲 PHASE 3 - TÍNH NĂNG NÂNG CAO

**Thời gian:** 2-3 tháng  
**Trạng thái:** 🔲 Đang lên kế hoạch  
**Ưu tiên:** Trung bình

### 🎯 Mục tiêu
Thêm Bảng điều khiển Phân tích, Quản lý Sự kiện, Diễn đàn, và Gợi ý dựa trên AI.

---

### 📋 Module 1: Phân tích & Báo cáo

#### 1.1. Bảng điều khiển Phân tích
**Tính năng:**
- ✅ Thống kê thời gian thực
- ✅ Xu hướng mượn sách
- ✅ Xu hướng đăng ký khóa học
- ✅ Phân tích doanh thu
- ✅ Biểu đồ tăng trưởng thành viên
- ✅ Sách/Khóa học phổ biến
- ✅ Xuất báo cáo (PDF, Excel)

**Cơ sở dữ liệu:**
```sql
CREATE TABLE analytics_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL, -- 'page_view', 'book_view', 'course_view', 'search'
  entity_type VARCHAR(50), -- 'book', 'course', 'member'
  entity_id INTEGER,
  member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics_daily_stats (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  total_visits INTEGER DEFAULT 0,
  total_members INTEGER DEFAULT 0,
  total_loans INTEGER DEFAULT 0,
  total_enrollments INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**API Endpoints:**
- `GET /api/admin/analytics/dashboard` - Lấy dữ liệu bảng điều khiển
- `GET /api/admin/analytics/books` - Phân tích sách
- `GET /api/admin/analytics/courses` - Phân tích khóa học
- `GET /api/admin/analytics/revenue` - Phân tích doanh thu
- `GET /api/admin/analytics/members` - Phân tích thành viên
- `POST /api/admin/analytics/export` - Xuất báo cáo

---

#### 1.2. Báo cáo
**Tính năng:**
- ✅ Báo cáo mượn sách
- ✅ Báo cáo doanh thu
- ✅ Báo cáo hoạt động thành viên
- ✅ Báo cáo hoàn thành khóa học
- ✅ Phạm vi ngày tùy chỉnh
- ✅ Báo cáo theo lịch (email)

**API Endpoints:**
- `GET /api/admin/reports/loans` - Báo cáo mượn sách
- `GET /api/admin/reports/revenue` - Báo cáo doanh thu
- `GET /api/admin/reports/members` - Báo cáo thành viên
- `GET /api/admin/reports/courses` - Báo cáo khóa học
- `POST /api/admin/reports/schedule` - Lên lịch báo cáo

---

### 📋 Module 2: Quản lý Sự kiện

**Cơ sở dữ liệu:**
```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title JSONB NOT NULL,
  description JSONB,
  thumbnail TEXT,
  event_type VARCHAR(50) NOT NULL, -- 'book_signing', 'workshop', 'webinar', 'meetup'
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  location VARCHAR(255),
  online_link TEXT, -- Cho sự kiện trực tuyến
  max_attendees INTEGER,
  registered_count INTEGER DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'upcoming', -- 'upcoming', 'ongoing', 'completed', 'cancelled'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attended BOOLEAN DEFAULT false,
  UNIQUE(event_id, member_id)
);
```

**Tính năng:**
- ✅ Tạo sự kiện
- ✅ Đăng ký sự kiện
- ✅ Hệ thống điểm danh
- ✅ Nhắc nhở sự kiện
- ✅ Lịch sử sự kiện

**API Endpoints:**
- `GET /api/admin/events` - Lấy danh sách sự kiện
- `POST /api/admin/events` - Tạo sự kiện mới
- `PUT /api/admin/events/:id` - Cập nhật sự kiện
- `DELETE /api/admin/events/:id` - Xóa sự kiện
- `POST /api/admin/events/:id/register` - Đăng ký sự kiện (thành viên)
- `GET /api/admin/events/:id/registrations` - Lấy danh sách đăng ký
- `POST /api/admin/events/:id/check-in` - Điểm danh

---

### 📋 Module 3: Diễn đàn Thảo luận

**Cơ sở dữ liệu:**
```sql
CREATE TABLE forum_topics (
  id SERIAL PRIMARY KEY,
  related_type VARCHAR(50), -- 'book', 'course', 'general'
  related_id INTEGER,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  total_replies INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'closed', 'pinned'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE forum_replies (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER REFERENCES forum_topics(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  is_solution BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE forum_likes (
  id SERIAL PRIMARY KEY,
  reply_id INTEGER REFERENCES forum_replies(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE(reply_id, member_id)
);
```

**Tính năng:**
- ✅ Tạo chủ đề
- ✅ Trả lời chủ đề
- ✅ Thích câu trả lời
- ✅ Đánh dấu giải pháp
- ✅ Ghim chủ đề
- ✅ Tìm kiếm diễn đàn

**API Endpoints:**
- `GET /api/admin/forum/topics` - Lấy danh sách chủ đề
- `POST /api/admin/forum/topics` - Tạo chủ đề mới
- `GET /api/admin/forum/topics/:id` - Lấy chi tiết chủ đề
- `POST /api/admin/forum/topics/:id/replies` - Trả lời chủ đề
- `POST /api/admin/forum/replies/:id/like` - Thích câu trả lời
- `PATCH /api/admin/forum/replies/:id/solution` - Đánh dấu giải pháp

---

### 📋 Module 4: Gợi ý AI

**Tính năng:**
- ✅ Gợi ý sách dựa trên lịch sử đọc
- ✅ Gợi ý khóa học dựa trên sở thích
- ✅ "Những người mượn cuốn này cũng mượn..."
- ✅ Trang chủ cá nhân hóa
- ✅ Nội dung đang thịnh hành

**Cơ sở dữ liệu:**
```sql
CREATE TABLE member_preferences (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE UNIQUE,
  favorite_categories JSONB, -- Thể loại sách/khóa học yêu thích
  favorite_authors JSONB,
  reading_history JSONB, -- ID sách với xếp hạng
  course_history JSONB, -- ID khóa học với hoàn thành
  interests JSONB, -- Thẻ/sở thích
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recommendations (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL, -- 'book', 'course'
  item_id INTEGER NOT NULL,
  recommendation_type VARCHAR(50), -- 'similar', 'trending', 'personalized'
  score DECIMAL(5,2), -- Điểm tin cậy
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**API Endpoints:**
- `GET /api/admin/recommendations/books` - Gợi ý sách (thành viên)
- `GET /api/admin/recommendations/courses` - Gợi ý khóa học (thành viên)
- `POST /api/admin/preferences` - Cập nhật sở thích (thành viên)
- `GET /api/admin/trending` - Nội dung đang thịnh hành

---

### 🎯 Lộ trình Triển khai Phase 3

| Tuần | Module | Nhiệm vụ |
|------|--------|----------|
| **1-3** | Bảng điều khiển Phân tích | Cơ sở dữ liệu, Backend, Biểu đồ, Báo cáo |
| **4-5** | Quản lý Sự kiện | CRUD sự kiện, Đăng ký, Điểm danh |
| **6-8** | Diễn đàn Thảo luận | Hệ thống diễn đàn, Kiểm duyệt |
| **9-10** | Gợi ý AI | Thuật toán, Tích hợp |
| **11-12** | Hoàn thiện & Kiểm thử | Hiệu suất, Cải thiện UX |

---

## 🔲 PHASE 4 - DOANH NGHIỆP & MỞ RỘNG

**Thời gian:** 2-3 tháng  
**Trạng thái:** 🔲 Đang lên kế hoạch  
**Ưu tiên:** Thấp (Tương lai)

### 🎯 Mục tiêu
Hỗ trợ đa tổ chức, Ứng dụng di động, Tính năng AI nâng cao, và Phân tích doanh nghiệp.

---

### 📋 Module 1: Hỗ trợ Đa tổ chức

**Tính năng:**
- ✅ Nhiều tổ chức/thư viện
- ✅ Cài đặt riêng cho từng tổ chức
- ✅ Cô lập dữ liệu
- ✅ Vai trò quản trị tổ chức

**Cơ sở dữ liệu:**
```sql
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  settings JSONB,
  subscription_plan VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Thêm organization_id vào các bảng hiện có
ALTER TABLE books ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE courses ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
-- ... v.v
```

---

### 📋 Module 2: API Ứng dụng Di động

**Tính năng:**
- ✅ RESTful API cho di động
- ✅ Thông báo đẩy
- ✅ Hỗ trợ offline
- ✅ Endpoint tối ưu cho di động

**API Endpoints:**
- `GET /api/mobile/books` - Lấy sách
- `GET /api/mobile/courses` - Lấy khóa học
- `POST /api/mobile/auth/login` - Đăng nhập
- `POST /api/mobile/loans/borrow` - Mượn sách
- `GET /api/mobile/profile` - Lấy hồ sơ

---

### 📋 Module 3: Tính năng AI Nâng cao

**Tính năng:**
- ✅ Hỗ trợ chatbot
- ✅ Tự động gắn thẻ nội dung
- ✅ Phân tích cảm xúc (đánh giá)
- ✅ Phân tích dự đoán
- ✅ Gợi ý nội dung tự động

---

### 📋 Module 4: Phân tích Doanh nghiệp

**Tính năng:**
- ✅ Bảng điều khiển tùy chỉnh
- ✅ Báo cáo nâng cao
- ✅ Xuất dữ liệu (API)
- ✅ API tích hợp (webhooks)
- ✅ Hỗ trợ nhãn trắng

---

## 📊 TỔNG KẾT

### Kết quả Phase 2:
- ✅ Chương & Bài học Khóa học
- ✅ Đăng ký Khóa học & Tiến độ
- ✅ Bài kiểm tra & Bài tập
- ✅ Đánh giá & Xếp hạng
- ✅ Mã giảm giá & Khuyến mãi
- ✅ Hệ thống Thông báo
- ✅ Danh sách Yêu thích & Danh sách Đọc

### Kết quả Phase 3:
- ✅ Bảng điều khiển Phân tích
- ✅ Hệ thống Báo cáo
- ✅ Quản lý Sự kiện
- ✅ Diễn đàn Thảo luận
- ✅ Gợi ý AI

### Kết quả Phase 4:
- ✅ Hỗ trợ Đa tổ chức
- ✅ API Ứng dụng Di động
- ✅ Tính năng AI Nâng cao
- ✅ Phân tích Doanh nghiệp

---

## 🚀 BƯỚC TIẾP THEO

1. **Xem xét & Ưu tiên** - Xác định các tính năng quan trọng nhất
2. **Thiết kế Cơ sở dữ liệu** - Thiết kế schema chi tiết cho Phase 2
3. **Lập kế hoạch API** - Thiết kế các endpoint API
4. **Thiết kế UI/UX** - Mockups cho các tính năng mới
5. **Triển khai** - Bắt đầu với Phase 2 Module 1

---

**📝 Lưu ý:** Lộ trình này có thể được điều chỉnh dựa trên phản hồi và ưu tiên thực tế.
