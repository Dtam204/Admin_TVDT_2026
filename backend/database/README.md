# Database Schema - Library & Courses Management System

## 📦 File duy nhất: `schema.sql`

**Tất cả schema, seed data, và performance optimizations đã được gộp vào 1 file duy nhất** để dễ quản lý!

**Bao gồm:**
- ✅ Tất cả table definitions
- ✅ Tất cả indexes (120+)
- ✅ Tất cả triggers (20+)
- ✅ Tất cả permissions
- ✅ Seed data (50+ records)
- ✅ Performance optimizations (indexes, materialized views, functions)

---

## 🗂️ Database Structure

### Core System (8 tables)
- `roles` - Vai trò người dùng
- `users` - Người dùng hệ thống
- `permissions` - Quyền chi tiết
- `role_permissions` - Gán quyền cho vai trò
- `news`, `news_categories` - Quản lý tin tức
- `contact_requests` - Yêu cầu liên hệ
- `homepage_sections` - Nội dung trang chủ

### Media Management (2 tables)
- `media_folders` - Thư mục media
- `media_files` - File media

### Menu Management (2 tables)
- `menus` - Menus
- `menu_items` - Menu items

### SEO & Settings (2 tables)
- `seo_pages` - SEO cho từng page
- `site_settings` - Cài đặt hệ thống

### 📚 Phase 1: Books Module (7 tables)
- `publishers` - Nhà xuất bản
- `authors` - Tác giả
- `book_categories` - Thể loại sách
- `books` - Sách
- `book_authors` - Junction (Books ↔ Authors)
- `book_category_books` - Junction (Books ↔ Categories)
- `book_loans` - Mượn/Trả sách

### 🎓 Phase 1: Courses Module (5 tables)
- `course_categories` - Danh mục khóa học
- `instructors` - Giảng viên
- `courses` - Khóa học
- `course_instructors` - Junction (Courses ↔ Instructors)
- `course_category_courses` - Junction (Courses ↔ Categories)

### 👥 Phase 1: Members Module (2 tables)
- `membership_plans` - Gói thành viên
- `members` - Thành viên

### 💳 Phase 1: Payments Module (1 table)
- `payments` - Thanh toán

---

## 📊 Summary

| Component | Count |
|-----------|-------|
| **Total Tables** | 30 |
| **Indexes** | 100+ |
| **Triggers** | 20+ |
| **Seed Records** | 50+ |

---

## 🚀 Setup Instructions

### 1. First Time Setup

```bash
# From project root
cd backend
npm run setup
```

This will:
- Drop existing database (if exists)
- Create database `library_tn`
- Run `schema.sql` to create all tables
- Insert all seed data

### 2. Manual Setup (Alternative)

```bash
# Create database
psql -U postgres -c "CREATE DATABASE library_tn;"

# Run schema
psql -U postgres -d library_tn -f database/schema.sql
```

### 3. Verify Setup

```bash
# Check tables
psql -U postgres -d library_tn -c "\dt"

# Check seed data
psql -U postgres -d library_tn -c "SELECT * FROM membership_plans;"
psql -U postgres -d library_tn -c "SELECT * FROM publishers;"
psql -U postgres -d library_tn -c "SELECT * FROM authors;"
```

---

## 📝 Seed Data Included

### Membership Plans (4 records)
- ✅ **Miễn phí** - 3 books, 1 course, Free
- ✅ **Cơ bản** - 5 books, 3 courses, 99,000đ/month
- ✅ **Premium** - 10 books, 10 courses, 199,000đ/month
- ✅ **VIP** - Unlimited, 499,000đ/month

### Publishers (5 records)
- ✅ NXB Kim Đồng
- ✅ NXB Trẻ
- ✅ NXB Thế Giới
- ✅ NXB Lao Động
- ✅ O'Reilly Media

### Authors (5 records)
- ✅ Nguyễn Nhật Ánh
- ✅ Tô Hoài
- ✅ J.K. Rowling
- ✅ Robert C. Martin
- ✅ Yuval Noah Harari

### Book Categories (5 records)
- ✅ Văn học (FICTION)
- ✅ Công nghệ (TECH)
- ✅ Kinh tế (BUSINESS)
- ✅ Khoa học (SCIENCE)
- ✅ Thiếu nhi (CHILD)

### Books (5 records)
- ✅ Tôi thấy hoa vàng trên cỏ xanh
- ✅ Mắt biếc
- ✅ Clean Code
- ✅ Sapiens
- ✅ Dế Mèn phiêu lưu ký

### Course Categories (5 records)
- ✅ Lập trình Web (WEBDEV)
- ✅ Lập trình Mobile (MOBILE)
- ✅ Trí tuệ nhân tạo (AI)
- ✅ Thiết kế (DESIGN)
- ✅ Kỹ năng kinh doanh (BUSINESS)

### Instructors (3 records)
- ✅ Trần Văn An - Full-stack Developer
- ✅ Nguyễn Thị Mai - UI/UX Designer
- ✅ Lê Minh Hoàng - AI/ML Engineer

### Courses (3 records)
- ✅ React & Next.js - Từ cơ bản đến nâng cao
- ✅ UI/UX Design Masterclass
- ✅ Machine Learning cơ bản

### Members (3 records)
- ✅ Nguyễn Văn A (Free plan)
- ✅ Trần Thị B (Basic plan)
- ✅ Lê Văn C (Premium plan)

### Permissions (48 permissions)
- ✅ Core: users, roles, permissions
- ✅ Content: news, contact, homepage
- ✅ Media: media files & folders
- ✅ Phase 1: books, courses, members, payments

---

## 🔑 Features

### Multilingual Support (JSONB)
- `books.title`, `books.description`
- `courses.title`, `courses.description`
- `authors.name`, `authors.bio`
- `instructors.name`, `instructors.bio`
- `book_categories.name`, `book_categories.description`
- `course_categories.name`, `course_categories.description`
- `membership_plans.name`, `membership_plans.description`

Format: `{"vi": "...", "en": "...", "ja": "..."}`

### Auto-updated Timestamps
All tables have `updated_at` trigger automatically updating on modification.

### Comprehensive Indexes
- **Slug indexes** for SEO-friendly URLs
- **Status indexes** for filtering
- **GIN indexes** for JSONB full-text search
- **Foreign key indexes** for JOIN performance

### Data Integrity
- Foreign key constraints with proper CASCADE/SET NULL
- CHECK constraints for enums
- UNIQUE constraints for critical fields
- NOT NULL constraints for required fields

---

## 🛠️ Maintenance

### Add More Seed Data

Edit `schema.sql` at the bottom, then re-run:

```bash
npm run setup
```

### Backup Database

```bash
pg_dump -U postgres library_tn > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
psql -U postgres library_tn < backup_20260122.sql
```

---

## 📖 Related Documentation

- `../README.md` - Backend API documentation
- `../../frontend/README.md` - Frontend documentation
- `../../PHASE1_FINAL.md` - Complete Phase 1 summary
- `../../START_HERE.md` - Quick start guide

---

## ✅ Database is Ready!

**All tables, indexes, triggers, permissions, and seed data are in `schema.sql`!**

Run `npm run setup` and start coding! 🚀
