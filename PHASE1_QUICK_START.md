# ⚡ Phase 1 MVP - Quick Start Guide

**5 phút để bắt đầu!** 🚀

---

## 📦 FILES ĐÃ TẠO

```
✅ backend/database/phase1-schema.sql           (500+ dòng - Database)
✅ backend/src/controllers/books.controller.js  (400+ dòng - CRUD Books)
✅ backend/src/controllers/courses.controller.js (350+ dòng - CRUD Courses)
✅ backend/src/routes/books.routes.js           (70 dòng - REST API)
✅ PHASE1_IMPLEMENTATION_GUIDE.md               (300+ dòng - Hướng dẫn chi tiết)
✅ PHASE1_SUMMARY.md                            (200+ dòng - Tổng kết)
✅ PHASE1_QUICK_START.md                        (File này)
```

---

## 🚀 3 BƯỚC BẮT ĐẦU

### BƯỚC 1: Setup Database (2 phút)

```bash
cd e:\Workspace\hethong-thuvien\admin\backend

# Chạy Phase 1 schema
psql -U postgres -d library_tn -f database/phase1-schema.sql

# Hoặc qua pgAdmin: Run SQL file
```

**Kết quả:** 11 tables mới được tạo:
- `books`, `authors`, `book_categories`, `publishers`
- `courses`, `course_categories`, `instructors`
- `members`, `membership_plans`
- `book_loans`, `payments`

### BƯỚC 2: Register Routes (1 phút)

**Mở file:** `backend/src/app.js`

**Thêm import routes (sau các imports hiện có):**
```javascript
// Phase 1 MVP Routes
const booksRoutes = require('./routes/books.routes');
// const coursesRoutes = require('./routes/courses.routes'); // Tạo sau
```

**Thêm route registration (sau các routes hiện có):**
```javascript
// Phase 1 MVP APIs
app.use('/api/admin/books', requireAuth, booksRoutes);
// app.use('/api/admin/courses', requireAuth, coursesRoutes); // Tạo sau
```

### BƯỚC 3: Test API (2 phút)

```bash
# Start backend
cd backend
npm run dev

# Test với Postman hoặc curl:
GET http://localhost:5000/api/admin/books
```

**Expected response:**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

---

## 📝 TIẾP THEO - LÀM GÌ?

### Option 1: Complete Backend (Recommended)

**Tạo các controllers còn lại (copy từ template):**

```bash
# Trong backend/src/controllers/
cp books.controller.js authors.controller.js
cp books.controller.js bookCategories.controller.js
cp books.controller.js publishers.controller.js
cp courses.controller.js courseCategories.controller.js
cp courses.controller.js instructors.controller.js
# ... và sửa lại table names, field names
```

**Tạo các routes còn lại:**

```bash
# Trong backend/src/routes/
cp books.routes.js authors.routes.js
cp books.routes.js bookCategories.routes.js
# ... và sửa lại controller imports
```

**Checklist:**
- [ ] authors.controller.js + routes
- [ ] bookCategories.controller.js + routes
- [ ] publishers.controller.js + routes
- [ ] courseCategories.controller.js + routes
- [ ] instructors.controller.js + routes
- [ ] members.controller.js + routes
- [ ] membershipPlans.controller.js + routes
- [ ] bookLoans.controller.js + routes
- [ ] payments.controller.js + routes

### Option 2: Start Frontend

**Tạo Books pages:**

```bash
cd frontend/app/(admin)/admin
mkdir -p books/new books/[id]
```

**Tạo files:**
- `books/page.tsx` - List books
- `books/new/page.tsx` - Create book
- `books/[id]/page.tsx` - View/Edit book

**Template:** Xem trong `PHASE1_IMPLEMENTATION_GUIDE.md`

### Option 3: Test với Dummy Data

**Insert test data:**

```sql
-- Test author
INSERT INTO authors (name, slug, bio, status) VALUES 
('{"vi": "Nguyễn Du", "en": "Nguyen Du"}', 'nguyen-du', '{"vi": "Thi hào Việt Nam"}', 'active');

-- Test category
INSERT INTO book_categories (code, name, slug, status) VALUES 
('FICT', '{"vi": "Văn học", "en": "Fiction"}', 'van-hoc', 'active');

-- Test publisher
INSERT INTO publishers (name, slug, status) VALUES 
('NXB Kim Đồng', 'nxb-kim-dong', 'active');

-- Test book
INSERT INTO books (isbn, title, slug, publisher_id, quantity, available_quantity, status) VALUES 
('978-604-2', '{"vi": "Truyện Kiều"}', 'truyen-kieu', 1, 10, 10, 'available');

-- Link book with author & category
INSERT INTO book_authors (book_id, author_id) VALUES (1, 1);
INSERT INTO book_category_books (book_id, category_id) VALUES (1, 1);
```

**Test API:**
```bash
GET http://localhost:5000/api/admin/books
GET http://localhost:5000/api/admin/books/1
```

---

## 🎯 MILESTONES

### Week 1-2: Books Module Complete
- [x] Database schema ✅
- [x] books.controller.js ✅
- [x] books.routes.js ✅
- [ ] authors.controller.js
- [ ] bookCategories.controller.js
- [ ] publishers.controller.js
- [ ] Frontend books pages
- [ ] Testing

### Week 3-4: Courses Module Complete
- [x] Database schema ✅
- [x] courses.controller.js ✅
- [ ] courses.routes.js
- [ ] courseCategories.controller.js
- [ ] instructors.controller.js
- [ ] Frontend courses pages
- [ ] Testing

### Week 5-6: Members & Loans
- [ ] members.controller.js
- [ ] membershipPlans.controller.js
- [ ] bookLoans.controller.js
- [ ] Frontend pages
- [ ] Testing

### Week 7-8: Payments & Polish
- [ ] payments.controller.js
- [ ] Frontend payments
- [ ] Dashboard updates
- [ ] Bug fixes
- [ ] Documentation

---

## 💡 TIPS

### Khi tạo controller mới:
1. Copy từ `books.controller.js`
2. Tìm & thay: `books` → `[table_name]`
3. Sửa field names theo table
4. Kiểm tra relationships
5. Test với Postman

### Khi tạo routes mới:
1. Copy từ `books.routes.js`
2. Sửa controller import
3. Sửa route paths
4. Register trong `app.js`

### Khi tạo frontend pages:
1. Xem template trong `PHASE1_IMPLEMENTATION_GUIDE.md`
2. Tạo React Query hooks
3. Tạo API client functions
4. Build UI với Shadcn/UI
5. Test CRUD operations

---

## 📚 DOCUMENTATION

**Chi tiết trong:**
- `PHASE1_IMPLEMENTATION_GUIDE.md` - Hướng dẫn đầy đủ
- `PHASE1_SUMMARY.md` - Tổng kết & checklist
- `phase1-schema.sql` - Database schema

**Templates:**
- `books.controller.js` - Controller pattern
- `courses.controller.js` - Controller with relationships
- `books.routes.js` - Routes pattern

---

## ❓ FAQ

**Q: Tôi nên bắt đầu từ đâu?**  
A: Hoàn thành Backend trước (controllers + routes), sau đó làm Frontend.

**Q: Có cần làm hết 11 modules ngay?**  
A: Không! Bắt đầu với Books module, test kỹ, sau đó mới sang module khác.

**Q: Database schema có thể thay đổi không?**  
A: Có, nhưng nên hoàn thiện schema trước khi code nhiều.

**Q: Frontend cần làm gì trước?**  
A: Setup React Query, tạo API client, build Books pages trước.

**Q: Timeline 2-3 tháng có realistic không?**  
A: Có! Nếu làm full-time. Part-time có thể 3-4 tháng.

---

## 🎊 READY TO CODE!

**Bạn đã có:**
✅ Complete database schema  
✅ 2 working controllers (Books, Courses)  
✅ 1 working routes (Books)  
✅ Implementation guide chi tiết  
✅ Clear structure & patterns  

**Hãy bắt đầu build! 💪**

---

**Good luck! 🚀📚🎓**

*Có câu hỏi? Đọc `PHASE1_IMPLEMENTATION_GUIDE.md` hoặc hỏi tôi!*
