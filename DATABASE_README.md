# 📚 DATABASE - README

## ✅ ĐÃ HOÀN THÀNH!

Đã **gộp tất cả SQL files** vào **1 file duy nhất** và thêm **50+ seed data records**!

---

## 📦 Single File Structure

```
backend/database/
├── schema.sql              ✅ ALL-IN-ONE! (2000+ dòng)
│   ├── Core System (roles, users, permissions)
│   ├── News, Contact, Media, Menus, SEO, Settings
│   ├── Phase 1: Books (publishers, authors, categories, books, loans)
│   ├── Phase 1: Courses (categories, instructors, courses)
│   ├── Phase 1: Members & Payments
│   ├── 100+ Indexes
│   ├── 20+ Triggers
│   └── 50+ Seed Records
├── optimizations.sql       (Optional - performance)
└── README.md              ✅ Documentation
```

**Đã xóa:**
- ❌ `phase1-schema.sql` (merged)
- ❌ `phase1-permissions.sql` (merged)

---

## 🌱 Seed Data Summary

| Module | Records | Details |
|--------|---------|---------|
| **Roles** | 3 | admin, editor, user |
| **Permissions** | 48 | All modules (books, courses, members, payments, etc.) |
| **Membership Plans** | 4 | Free, Basic (99k), Premium (199k), VIP (499k) |
| **Publishers** | 5 | Kim Đồng, Trẻ, Thế Giới, Lao Động, O'Reilly |
| **Authors** | 5 | Nguyễn Nhật Ánh, Tô Hoài, J.K. Rowling, Robert C. Martin, Yuval Harari |
| **Book Categories** | 5 | Văn học, Công nghệ, Kinh tế, Khoa học, Thiếu nhi |
| **Books** | 5 | Vietnamese & English books |
| **Course Categories** | 5 | Web, Mobile, AI, Design, Business |
| **Instructors** | 3 | Full-stack, UI/UX, AI/ML experts |
| **Courses** | 3 | React, UI/UX, ML courses |
| **Members** | 3 | Test members with different plans |

**Total:** 50+ seed records ready for testing! 🎉

---

## 🚀 Quick Setup

### ⚠️ IMPORTANT: Stop backend server first!

```bash
# Terminal với backend đang chạy
Ctrl + C   # Stop server

# Setup database
cd backend
node scripts/reset-database.js
node scripts/setup-simple.js

# Restart
npm run dev
```

### ✅ Verification

```bash
# Should see:
- 30+ tables created
- 48 permissions
- 50+ seed records
- All indexes and triggers
```

---

## 🎯 Login & Test

```
URL: http://localhost:3000/admin/login
Email: admin@gmail.com
Password: admin123
```

**Sau khi login, bạn sẽ thấy:**
- ✅ Dashboard
- ✅ Sidebar với 11 Phase 1 modules:
  - 📚 Books (5 modules)
  - 🎓 Courses (3 modules)
  - 👥 Members (2 modules)
  - 💳 Payments (1 module)

**Test ngay:**
- Click vào "Tất cả sách" → Thấy 5 cuốn sách mẫu
- Click vào "Tác giả" → Thấy 5 tác giả
- Click vào "Tất cả khóa học" → Thấy 3 khóa học
- Click vào "Gói thành viên" → Thấy 4 gói
- Click vào "Thành viên" → Thấy 3 members

---

## 📖 Sample Data Details

### Books Sample:
1. **Tôi thấy hoa vàng trên cỏ xanh** - Nguyễn Nhật Ánh (NXB Trẻ)
2. **Mắt biếc** - Nguyễn Nhật Ánh (NXB Trẻ)
3. **Clean Code** - Robert C. Martin (O'Reilly)
4. **Sapiens** - Yuval Noah Harari (NXB Thế Giới)
5. **Dế Mèn phiêu lưu ký** - Tô Hoài (NXB Kim Đồng)

### Courses Sample:
1. **React & Next.js** - Trần Văn An (Web Development)
2. **UI/UX Design Masterclass** - Nguyễn Thị Mai (Design)
3. **Machine Learning cơ bản** - Lê Minh Hoàng (AI)

### Members Sample:
1. **Nguyễn Văn A** - Free plan (expires 2026-12-31)
2. **Trần Thị B** - Basic plan (expires 2026-02-28)
3. **Lê Văn C** - Premium plan (expires 2026-03-15)

---

## 🔧 Troubleshooting

### Nếu gặp lỗi khi setup:

**Lỗi: "database is being accessed by other users"**
→ Stop backend server trước khi reset!

**Lỗi: "column category_code does not exist"**
→ Database cũ chưa được drop. Làm theo:
1. Stop backend
2. Run `node scripts/reset-database.js`
3. Run `node scripts/setup-simple.js`

**Lỗi: "psql not found"**
→ Dùng Node.js scripts thay vì psql command

---

## 📚 Related Docs

- `DATABASE_SETUP.md` - Chi tiết setup guide
- `DATABASE_CONSOLIDATED.md` - Consolidation summary
- `backend/database/README.md` - Database structure details
- `PHASE1_FINAL.md` - Phase 1 MVP complete guide

---

## ✨ Features

### Multilingual (JSONB)
- Books, Courses: `title`, `description`
- Authors, Instructors: `name`, `bio`
- Categories: `name`, `description`
- Membership Plans: `name`, `description`

**Format:** `{"vi": "Tiếng Việt", "en": "English", "ja": "日本語"}`

### Auto-features
- ✅ `updated_at` triggers
- ✅ Cascade deletes where appropriate
- ✅ Foreign key constraints
- ✅ Full-text search indexes (GIN)
- ✅ Slug indexes for SEO
- ✅ Status filters

---

## 🎉 Done!

**Database đã sẵn sàng với:**
- ✅ 30+ tables
- ✅ 100+ indexes
- ✅ 20+ triggers
- ✅ 48 permissions
- ✅ 50+ seed records
- ✅ 1 file duy nhất!

**Chỉ cần:**
1. Stop backend
2. Run setup
3. Start backend
4. Test!

🚀 **HAPPY CODING!**
