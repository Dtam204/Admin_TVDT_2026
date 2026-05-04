# Database Scripts

Scripts để quản lý database cho Library Management System.

---

## 📋 Available Scripts

### Setup & Reset

#### `setup-simple.js` - Setup database từ đầu
```bash
npm run setup
# hoặc
node scripts/setup-simple.js
```

**Chức năng:**
- Tạo database nếu chưa có
- Chạy `schema.sql` (tất cả tables, indexes, triggers, seed data, optimizations)
- Chạy bổ sung `seed-sample-data.js` để tạo dữ liệu mẫu đầy đủ cho luồng admin/app/reader
- Verify setup thành công

---

#### `seed-sample-data.js` - Bổ sung dữ liệu mẫu đa luồng
```bash
npm run seed:sample
# hoặc
node scripts/seed-sample-data.js
```

**Chức năng:**
- Seed dữ liệu mẫu cho các luồng chính: Publications, Members, Borrow, Payments, News, Homepage, Menu, Notifications
- Seed tài khoản bạn đọc mẫu để test API Reader/App qua Swagger
- Idempotent: chạy lại không bị trùng dữ liệu chính

**Tài khoản mẫu sau khi seed:**
- Admin: `admin@gmail.com` / `admin123`
- Reader: `reader.basic@example.com` / `admin123` (Card: `TV0010001`)
- Reader: `reader.premium@example.com` / `admin123` (Card: `TV0010002`)
- Reader: `reader.vip@example.com` / `admin123` (Card: `TV0010003`)

---

#### `reset-database.js` - Reset database
```bash
npm run reset-db
# hoặc
node scripts/reset-database.js
```

**Chức năng:**
- Drop và tạo lại database `library_tn`
- ⚠️ **CẢNH BÁO:** Xóa tất cả dữ liệu!

---

#### `force-reset-database.js` - Force reset (terminate connections)
```bash
npm run force-reset-db
# hoặc
node scripts/force-reset-database.js
```

**Chức năng:**
- Terminate tất cả connections đến database
- Drop và tạo lại database
- ⚠️ **CẢNH BÁO:** Xóa tất cả dữ liệu!
- ✅ **Dùng khi:** `reset-db` bị lỗi "database is being accessed"

---

### User Management

**Lưu ý:** Admin user (`admin@gmail.com` / `admin123`) đã được tự động tạo trong `schema.sql` khi chạy `npm run setup`. Không cần script riêng.

---

### Optimization

#### `optimize-database.js` - Tối ưu database
```bash
npm run optimize-db
# hoặc
node scripts/optimize-database.js
```

**Chức năng:**
- Analyze tất cả tables (update statistics)
- Refresh materialized views
- Hiển thị database statistics

**Note:** Performance indexes đã được include trong `schema.sql`, script này chỉ chạy maintenance tasks.

---

### Utilities

#### `generate-password-hash.js` - Generate password hash
```bash
npm run generate-password-hash
# hoặc
node scripts/generate-password-hash.js
```

**Chức năng:**
- Generate bcrypt hash cho password
- Dùng để update password trong database

---

## 🚀 Quick Start Workflow

### Setup database mới:

```bash
# 1. Stop backend server (Ctrl+C)

# 2. Reset database
npm run force-reset-db

# 3. Setup schema (bao gồm cả admin user)
npm run setup

# 4. Start backend
npm run dev
```

---

## 📝 Notes

- **Tất cả SQL đã được gộp vào `schema.sql`** - Không cần file SQL riêng lẻ
- **Scripts đã được tối ưu** - Chỉ giữ lại scripts đang sử dụng
- **Performance optimizations** đã được include trong `schema.sql`

---

## 🗑️ Deleted Scripts

Các scripts sau đã bị xóa vì không còn cần thiết:
- ❌ `setup-all.js` - Thay bằng `setup-simple.js`
- ❌ `add-phase1-permissions.js` - Permissions đã có trong `schema.sql`
- ❌ `convert-dump-to-inserts.js` - One-time script
- ❌ `generate-phase1-controllers.js` - Đã generate xong
- ❌ `create-admin.js` - Admin user đã được seed tự động trong `schema.sql`
- ❌ `check-backend.js` - Script test không được sử dụng

---

## 📚 Related Files

- `../database/schema.sql` - Single source of truth cho database
- `../database/README.md` - Database structure documentation
