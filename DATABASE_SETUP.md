# 🔧 DATABASE SETUP GUIDE

## ⚠️ Vấn đề hiện tại

Database `library_tn` hiện đang có schema cũ không tương thích với schema mới đã consolidate.

**Lỗi:** `column "category_code" does not exist`

**Nguyên nhân:** Database cũ không có column này cho `news` table.

---

## ✅ GIẢI PHÁP: Tạo lại database từ đầu

### Option 1: Dùng Node.js Scripts (RECOMMENDED)

#### Bước 1: Stop tất cả processes đang dùng database

```bash
# Stop backend server (Ctrl+C nếu đang chạy)
# Stop frontend server (Ctrl+C nếu đang chạy)
```

#### Bước 2: Reset database

```bash
cd backend
node scripts/reset-database.js
```

#### Bước 3: Setup schema mới với seed data

```bash
node scripts/setup-simple.js
```

#### Bước 4: Start lại servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

### Option 2: Manual (nếu Option 1 không work)

#### Bước 1: Stop backend server

```bash
# Press Ctrl+C in terminal running backend
```

#### Bước 2: Connect to PostgreSQL

```bash
# Open pgAdmin hoặc Command Line
# Connect to PostgreSQL server
```

#### Bước 3: Drop database

```sql
-- Run in pgAdmin Query Tool hoặc psql
DROP DATABASE IF EXISTS library_tn;
CREATE DATABASE library_tn;
```

#### Bước 4: Run schema.sql

**Option A: Using psql**
```bash
psql -U postgres -d library_tn -f backend/database/schema.sql
```

**Option B: Using pgAdmin**
1. Open pgAdmin
2. Connect to `library_tn` database
3. Open Query Tool
4. Load `backend/database/schema.sql`
5. Execute (F5)

#### Bước 5: Verify

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should see 30+ tables

-- Check seed data
SELECT COUNT(*) FROM publishers;    -- Should be 5
SELECT COUNT(*) FROM authors;       -- Should be 5
SELECT COUNT(*) FROM books;         -- Should be 5
SELECT COUNT(*) FROM courses;       -- Should be 3
SELECT COUNT(*) FROM membership_plans; -- Should be 4
```

#### Bước 6: Start servers

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

---

## 📊 Sau khi setup thành công

### Database Structure

```
✅ 30+ tables created
✅ 100+ indexes
✅ 20+ triggers
✅ 48 permissions
✅ 50+ seed records
```

### Seed Data Summary

| Module | Records |
|--------|---------|
| **Roles** | 3 (admin, editor, user) |
| **Permissions** | 48 |
| **Membership Plans** | 4 |
| **Publishers** | 5 |
| **Authors** | 5 |
| **Book Categories** | 5 |
| **Books** | 5 |
| **Course Categories** | 5 |
| **Instructors** | 3 |
| **Courses** | 3 |
| **Members** | 3 |

---

## 🧪 Test Login

1. Go to: `http://localhost:3000/admin/login`
2. Email: `admin@gmail.com`
3. Password: `admin123`
4. Should see dashboard with all Phase 1 modules in sidebar!

---

## 📝 Files đã consolidate

### ✅ Đã gộp vào `backend/database/schema.sql`:
- ✅ `phase1-schema.sql` (DELETED)
- ✅ `phase1-permissions.sql` (DELETED)
- ✅ All seed data

### ✅ Còn lại:
- `backend/database/schema.sql` - File duy nhất chứa tất cả
- `backend/database/optimizations.sql` - Optional performance tuning
- `backend/database/README.md` - Documentation

---

## 🔍 Troubleshooting

### Nếu vẫn bị lỗi "category_code" sau khi reset:

1. Chắc chắn đã stop backend server
2. Chắc chắn database đã được drop thành công
3. Chắc chắn chạy `schema.sql` file MỚI NHẤT

### Nếu không thể drop database:

```sql
-- Terminate all connections first
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'library_tn'
  AND pid <> pg_backend_pid();

-- Then drop
DROP DATABASE library_tn;
CREATE DATABASE library_tn;
```

---

## 🎉 Hoàn tất!

Khi setup thành công, bạn sẽ có:
- ✅ Database hoàn chỉnh với 30+ tables
- ✅ Seed data cho testing
- ✅ Tất cả permissions đã được gán cho admin
- ✅ Phase 1 MVP ready to use!

**Next:** Restart backend & frontend, login và test! 🚀
