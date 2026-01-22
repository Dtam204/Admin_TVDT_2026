# 📚 Gợi ý Tính năng - Hệ thống Thư viện Sách & Khóa học

**Dự án:** Library Management System + Online Courses  
**Mục tiêu:** Xây dựng admin panel hoàn chỉnh để phục vụ frontend client

---

## 🎯 CORE FEATURES CẦN CÓ

### 1. 📚 QUẢN LÝ THƯ VIỆN SÁCH

#### 1.1. Books (Quản lý sách)
**Mục đích:** Catalog toàn bộ sách trong thư viện

**Fields cần có:**
```typescript
interface Book {
  id: number;
  isbn: string;                    // Mã ISBN (unique)
  title: string;                   // Tên sách (multilang)
  slug: string;                    // SEO-friendly URL
  author_ids: number[];            // Nhiều tác giả
  publisher_id: number;            // Nhà xuất bản
  category_ids: number[];          // Nhiều thể loại
  description: string;             // Mô tả (multilang)
  cover_image: string;             // Ảnh bìa
  publication_year: number;        // Năm xuất bản
  language: string;                // Ngôn ngữ (vi, en, ja)
  pages: number;                   // Số trang
  format: 'hardcover' | 'paperback' | 'ebook' | 'audiobook';
  quantity: number;                // Số lượng có sẵn
  available_quantity: number;      // Số lượng còn lại
  price: number;                   // Giá mua (nếu bán)
  rental_price: number;            // Giá thuê/mượn
  status: 'available' | 'out_of_stock' | 'discontinued';
  featured: boolean;               // Sách nổi bật
  rating_average: number;          // Đánh giá TB (1-5)
  total_reviews: number;           // Số lượt đánh giá
  total_borrowed: number;          // Lượt mượn
  location: string;                // Vị trí trong thư viện (Kệ A1-B3)
  metadata: jsonb;                 // Thông tin mở rộng
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Features:**
- ✅ CRUD sách
- ✅ Tìm kiếm nâng cao (title, ISBN, author, category)
- ✅ Filter theo category, author, language, format
- ✅ Bulk import (Excel/CSV)
- ✅ Bulk export
- ✅ QR code generation cho mỗi sách
- ✅ Barcode scanning support
- ✅ Stock management (theo dõi số lượng)

---

#### 1.2. Authors (Quản lý tác giả)
**Mục đích:** Quản lý thông tin tác giả

**Fields cần có:**
```typescript
interface Author {
  id: number;
  name: string;                    // Tên tác giả (multilang)
  slug: string;
  bio: string;                     // Tiểu sử (multilang)
  avatar: string;                  // Ảnh đại diện
  birth_year: number;
  nationality: string;
  website: string;
  social_links: jsonb;             // Facebook, Twitter, etc.
  total_books: number;             // Số sách đã viết
  featured: boolean;
  status: 'active' | 'inactive';
  created_at: timestamp;
}
```

---

#### 1.3. Book Categories (Thể loại sách)
**Mục đích:** Phân loại sách

**Fields cần có:**
```typescript
interface BookCategory {
  id: number;
  code: string;                    // FICT, SCIFI, HISTORY, etc.
  name: string;                    // Multilang
  slug: string;
  description: string;
  icon: string;
  parent_id: number;               // Hỗ trợ nested categories
  sort_order: number;
  total_books: number;
  status: 'active' | 'inactive';
}
```

**Examples:**
- Văn học (Fiction)
  - Tiểu thuyết (Novel)
  - Truyện ngắn (Short Story)
  - Thơ (Poetry)
- Khoa học (Science)
  - Vật lý (Physics)
  - Hóa học (Chemistry)
- Lịch sử (History)
- Kinh tế (Economics)
- Công nghệ (Technology)

---

#### 1.4. Publishers (Nhà xuất bản)
**Mục đích:** Quản lý nhà xuất bản

**Fields cần có:**
```typescript
interface Publisher {
  id: number;
  name: string;
  slug: string;
  logo: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  total_books: number;
  status: 'active' | 'inactive';
}
```

---

#### 1.5. Book Loans (Quản lý mượn/trả sách)
**Mục đích:** Theo dõi việc mượn/trả sách của độc giả

**Fields cần có:**
```typescript
interface BookLoan {
  id: number;
  member_id: number;               // ID độc giả
  book_id: number;
  loan_date: date;                 // Ngày mượn
  due_date: date;                  // Hạn trả
  return_date: date;               // Ngày trả thực tế
  status: 'borrowed' | 'returned' | 'overdue' | 'lost';
  late_fee: number;                // Phí trễ hạn
  notes: string;
  staff_id: number;                // Thủ thư xử lý
  created_at: timestamp;
}
```

**Features:**
- ✅ Tạo phiếu mượn
- ✅ Gia hạn sách
- ✅ Trả sách
- ✅ Tính phí trễ hạn tự động
- ✅ Gửi nhắc nhở trước hạn trả (email/SMS)
- ✅ Báo cáo sách quá hạn
- ✅ Lịch sử mượn của member

---

#### 1.6. Book Reviews (Đánh giá sách)
**Mục đích:** Độc giả đánh giá sách

**Fields cần có:**
```typescript
interface BookReview {
  id: number;
  book_id: number;
  member_id: number;
  rating: number;                  // 1-5 sao
  title: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  helpful_count: number;           // Số người thấy hữu ích
  created_at: timestamp;
}
```

---

### 2. 🎓 QUẢN LÝ KHÓA HỌC

#### 2.1. Courses (Quản lý khóa học)
**Mục đích:** Catalog các khóa học online

**Fields cần có:**
```typescript
interface Course {
  id: number;
  title: string;                   // Multilang
  slug: string;
  instructor_ids: number[];        // Nhiều giảng viên
  category_ids: number[];          // Nhiều danh mục
  description: string;             // Mô tả ngắn
  content: string;                 // Nội dung chi tiết
  thumbnail: string;
  preview_video: string;           // Video giới thiệu
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  duration_hours: number;          // Tổng thời lượng
  total_lessons: number;
  price: number;
  discount_price: number;
  is_free: boolean;
  certificate: boolean;            // Có cấp chứng chỉ không
  requirements: string[];          // Yêu cầu (multilang)
  what_you_learn: string[];        // Học được gì
  target_audience: string[];       // Đối tượng học
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  rating_average: number;
  total_reviews: number;
  total_enrolled: number;          // Số học viên
  total_completed: number;
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Features:**
- ✅ CRUD khóa học
- ✅ Course builder (drag-drop lessons)
- ✅ Preview mode
- ✅ Pricing management
- ✅ Promo codes/coupons

---

#### 2.2. Course Categories (Danh mục khóa học)
**Mục đích:** Phân loại khóa học

**Fields cần có:**
```typescript
interface CourseCategory {
  id: number;
  code: string;                    // PROG, DESIGN, MARKETING, etc.
  name: string;                    // Multilang
  slug: string;
  description: string;
  icon: string;
  parent_id: number;
  sort_order: number;
  total_courses: number;
  status: 'active' | 'inactive';
}
```

**Examples:**
- Lập trình (Programming)
  - Web Development
  - Mobile Development
  - Data Science
- Thiết kế (Design)
  - UI/UX Design
  - Graphic Design
- Marketing
  - Digital Marketing
  - SEO
- Kinh doanh (Business)
- Ngoại ngữ (Languages)

---

#### 2.3. Course Lessons (Bài học)
**Mục đích:** Nội dung từng bài học trong khóa học

**Fields cần có:**
```typescript
interface CourseLesson {
  id: number;
  course_id: number;
  section_id: number;              // Thuộc phần nào (Module 1, 2, 3...)
  title: string;
  slug: string;
  content: string;                 // Nội dung text
  video_url: string;               // Link video (YouTube, Vimeo, S3)
  duration_minutes: number;
  attachments: jsonb;              // Files PDF, slides, code
  is_preview: boolean;             // Cho xem trước không
  sort_order: number;
  status: 'draft' | 'published';
  created_at: timestamp;
}
```

---

#### 2.4. Course Sections (Phần/Module)
**Mục đích:** Nhóm các bài học thành module

**Fields cần có:**
```typescript
interface CourseSection {
  id: number;
  course_id: number;
  title: string;                   // Module 1: Introduction
  description: string;
  sort_order: number;
  total_lessons: number;
}
```

---

#### 2.5. Instructors (Giảng viên)
**Mục đích:** Quản lý giảng viên

**Fields cần có:**
```typescript
interface Instructor {
  id: number;
  user_id: number;                 // Link với users table
  name: string;
  slug: string;
  title: string;                   // Chức danh (PhD, MBA, etc.)
  bio: string;                     // Tiểu sử
  avatar: string;
  expertise: string[];             // Chuyên môn
  social_links: jsonb;
  total_courses: number;
  total_students: number;
  rating_average: number;
  featured: boolean;
  status: 'active' | 'inactive';
}
```

---

#### 2.6. Course Enrollments (Đăng ký khóa học)
**Mục đích:** Theo dõi học viên đăng ký khóa học

**Fields cần có:**
```typescript
interface CourseEnrollment {
  id: number;
  course_id: number;
  member_id: number;
  payment_id: number;              // Link với payments
  enrollment_date: date;
  expiry_date: date;               // Hết hạn (nếu có)
  progress_percentage: number;     // % hoàn thành
  completed_lessons: number[];
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  certificate_issued: boolean;
  certificate_url: string;
  last_accessed: timestamp;
  created_at: timestamp;
}
```

**Features:**
- ✅ Theo dõi tiến độ học
- ✅ Cấp chứng chỉ tự động
- ✅ Thống kê completion rate

---

#### 2.7. Course Reviews (Đánh giá khóa học)
**Mục đích:** Học viên đánh giá khóa học

**Fields cần có:**
```typescript
interface CourseReview {
  id: number;
  course_id: number;
  member_id: number;
  enrollment_id: number;
  rating: number;                  // 1-5 sao
  title: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  helpful_count: number;
  created_at: timestamp;
}
```

---

#### 2.8. Quizzes/Assignments (Bài kiểm tra)
**Mục đích:** Đánh giá học viên

**Fields cần có:**
```typescript
interface Quiz {
  id: number;
  course_id: number;
  lesson_id: number;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_score: number;           // % để pass
  questions: jsonb;                // Array of questions
  total_questions: number;
  status: 'draft' | 'published';
}

interface QuizAttempt {
  id: number;
  quiz_id: number;
  member_id: number;
  answers: jsonb;
  score: number;
  passed: boolean;
  started_at: timestamp;
  completed_at: timestamp;
}
```

---

### 3. 👥 QUẢN LÝ THÀNH VIÊN

#### 3.1. Members (Độc giả/Học viên)
**Mục đích:** Quản lý người dùng cuối

**Fields cần có:**
```typescript
interface Member {
  id: number;
  user_id: number;                 // Link với users table
  full_name: string;
  email: string;
  phone: string;
  avatar: string;
  date_of_birth: date;
  gender: 'male' | 'female' | 'other';
  address: string;
  membership_type: 'free' | 'basic' | 'premium' | 'vip';
  membership_expires: date;
  total_books_borrowed: number;
  total_courses_enrolled: number;
  total_courses_completed: number;
  wallet_balance: number;          // Số dư ví
  points: number;                  // Điểm tích lũy
  status: 'active' | 'suspended' | 'banned';
  created_at: timestamp;
}
```

**Features:**
- ✅ Membership tiers
- ✅ Points/Rewards system
- ✅ Wallet management
- ✅ Activity history

---

#### 3.2. Membership Plans (Gói thành viên)
**Mục đích:** Các gói đăng ký

**Fields cần có:**
```typescript
interface MembershipPlan {
  id: number;
  name: string;                    // Free, Basic, Premium, VIP
  slug: string;
  description: string;
  price: number;
  duration_days: number;
  features: jsonb;                 // List of features
  max_books_borrowed: number;      // Giới hạn mượn sách
  max_concurrent_courses: number;  // Giới hạn khóa học
  discount_percentage: number;     // Giảm giá courses
  priority_support: boolean;
  sort_order: number;
  status: 'active' | 'inactive';
}
```

---

### 4. 💰 QUẢN LÝ THANH TOÁN

#### 4.1. Payments (Thanh toán)
**Mục đích:** Theo dõi các giao dịch

**Fields cần có:**
```typescript
interface Payment {
  id: number;
  transaction_id: string;          // Unique
  member_id: number;
  type: 'course' | 'membership' | 'book_rental' | 'late_fee';
  related_id: number;              // ID khóa học, membership, sách
  amount: number;
  currency: string;
  payment_method: 'card' | 'bank_transfer' | 'momo' | 'zalopay' | 'wallet';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_gateway: string;
  gateway_response: jsonb;
  notes: string;
  paid_at: timestamp;
  created_at: timestamp;
}
```

---

#### 4.2. Coupons (Mã giảm giá)
**Mục đích:** Quản lý khuyến mãi

**Fields cần có:**
```typescript
interface Coupon {
  id: number;
  code: string;                    // SUMMER2024
  name: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_purchase: number;            // Giá trị đơn tối thiểu
  max_discount: number;            // Giảm tối đa
  usage_limit: number;             // Số lần dùng
  used_count: number;
  valid_from: date;
  valid_to: date;
  applicable_to: 'all' | 'courses' | 'membership';
  applicable_ids: number[];        // Specific courses/memberships
  status: 'active' | 'expired' | 'disabled';
}
```

---

### 5. 📊 BÁO CÁO & THỐNG KÊ

#### 5.1. Reports (Báo cáo)
**Các báo cáo cần có:**

**Thư viện:**
- 📈 Thống kê mượn/trả sách (theo tháng, năm)
- 📈 Top sách được mượn nhiều nhất
- 📈 Sách quá hạn
- 📈 Độc giả tích cực nhất
- 📈 Inventory report (sách sắp hết)
- 📈 Lost/Damaged books

**Khóa học:**
- 📈 Doanh thu theo khóa học/tháng
- 📈 Top khóa học bán chạy
- 📈 Completion rate
- 📈 Student engagement
- 📈 Instructor performance
- 📈 Revenue by category

**Tài chính:**
- 📈 Revenue report (theo tháng, quý, năm)
- 📈 Payment methods breakdown
- 📈 Refunds report
- 📈 Outstanding fees

---

### 6. 🔔 HỆ THỐNG THÔNG BÁO

#### 6.1. Notifications (Thông báo)
**Mục đích:** Gửi thông báo cho members

**Fields cần có:**
```typescript
interface Notification {
  id: number;
  member_id: number;
  type: 'book_due' | 'course_new' | 'course_update' | 'payment' | 'system';
  title: string;
  content: string;
  action_url: string;
  is_read: boolean;
  sent_at: timestamp;
  read_at: timestamp;
}
```

**Channels:**
- ✅ In-app notifications
- ✅ Email
- ✅ SMS (optional)
- ✅ Push notifications (PWA)

---

### 7. 🎯 CÁC TÍNH NĂNG NÂNG CAO

#### 7.1. Wishlists (Danh sách yêu thích)
```typescript
interface Wishlist {
  id: number;
  member_id: number;
  item_type: 'book' | 'course';
  item_id: number;
  created_at: timestamp;
}
```

#### 7.2. Reading Lists (Danh sách đọc)
```typescript
interface ReadingList {
  id: number;
  member_id: number;
  name: string;                    // "Sách mùa hè", "Học lập trình"
  description: string;
  book_ids: number[];
  is_public: boolean;
  created_at: timestamp;
}
```

#### 7.3. Discussion Forums (Diễn đàn thảo luận)
```typescript
interface ForumTopic {
  id: number;
  related_type: 'book' | 'course';
  related_id: number;
  member_id: number;
  title: string;
  content: string;
  total_replies: number;
  last_reply_at: timestamp;
  status: 'open' | 'closed' | 'pinned';
}

interface ForumReply {
  id: number;
  topic_id: number;
  member_id: number;
  content: string;
  likes: number;
  created_at: timestamp;
}
```

#### 7.4. Events (Sự kiện thư viện)
```typescript
interface Event {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  event_type: 'book_signing' | 'workshop' | 'webinar' | 'meetup';
  start_date: timestamp;
  end_date: timestamp;
  location: string;
  max_attendees: number;
  registered_count: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}
```

#### 7.5. Recommendations (Gợi ý thông minh)
- AI-powered book recommendations
- Course suggestions based on interests
- Personalized homepage
- "People who borrowed this also borrowed..."

#### 7.6. Analytics Dashboard
- Real-time statistics
- Traffic analytics
- User behavior tracking
- Conversion rates
- A/B testing support

---

## 🗄️ DATABASE STRUCTURE SUMMARY

### Core Tables (20+):

**Books:**
1. `books`
2. `authors`
3. `book_categories`
4. `publishers`
5. `book_loans`
6. `book_reviews`
7. `book_authors` (junction)
8. `book_categories_books` (junction)

**Courses:**
9. `courses`
10. `course_categories`
11. `course_sections`
12. `course_lessons`
13. `instructors`
14. `course_enrollments`
15. `course_reviews`
16. `quizzes`
17. `quiz_attempts`
18. `course_instructors` (junction)
19. `course_categories_courses` (junction)

**Members:**
20. `members`
21. `membership_plans`
22. `payments`
23. `coupons`
24. `wishlists`
25. `reading_lists`
26. `notifications`

**Others:**
27. `events`
28. `event_registrations`
29. `forum_topics`
30. `forum_replies`

---

## 🎯 PRIORITY ROADMAP

### Phase 1 - MVP (2-3 tháng):
1. ✅ Books management (CRUD)
2. ✅ Authors & Categories
3. ✅ Members management
4. ✅ Book Loans (basic)
5. ✅ Courses management (CRUD)
6. ✅ Course Categories
7. ✅ Instructors
8. ✅ Simple payments

### Phase 2 - Enhanced (2-3 tháng):
1. ✅ Course Lessons & Sections
2. ✅ Course Enrollments
3. ✅ Quizzes/Assignments
4. ✅ Reviews & Ratings
5. ✅ Membership Plans
6. ✅ Coupons
7. ✅ Notifications

### Phase 3 - Advanced (2-3 tháng):
1. ✅ Analytics Dashboard
2. ✅ Reports
3. ✅ Events
4. ✅ Forums
5. ✅ Recommendations
6. ✅ Mobile app integration

---

## 💡 TECHNOLOGY RECOMMENDATIONS

### Backend:
- ✅ Express.js (đã có)
- ✅ PostgreSQL (đã có)
- ⚡ Redis - Caching courses, book data
- ⚡ Elasticsearch - Full-text search cho sách, courses
- ⚡ Bull/BullMQ - Job queues (send emails, generate reports)
- ⚡ Socket.io - Real-time notifications

### Frontend Client (Website):
- Next.js 15/16
- Tailwind CSS + Shadcn/UI
- React Query - Data fetching
- Zustand/Redux - State management
- Stripe/MoMo/ZaloPay - Payment integration

### Media:
- AWS S3/CloudFlare R2 - Video hosting
- FFmpeg - Video processing
- Cloudinary - Image optimization

### Infrastructure:
- Docker - Containerization
- Nginx - Reverse proxy
- PM2 - Process management
- Sentry - Error tracking
- Google Analytics - User tracking

---

## 📝 NOTES

- Tất cả tables cần hỗ trợ **multilingual** (vi, en, ja)
- Implement **soft delete** cho tất cả data quan trọng
- **Audit logs** cho admin actions
- **Rate limiting** cho tất cả public APIs
- **Image optimization** tự động
- **SEO-friendly** URLs cho mọi content
- **Mobile-first** design
- **Accessibility (a11y)** compliance

---

## 🚀 NEXT STEPS

1. **Review** features với team/stakeholders
2. **Design database schema** chi tiết
3. **Create ERD diagram**
4. **Implement Phase 1 MVP**
5. **Beta testing**
6. **Launch & iterate**

---

**Happy Building!** 🎉📚🎓
