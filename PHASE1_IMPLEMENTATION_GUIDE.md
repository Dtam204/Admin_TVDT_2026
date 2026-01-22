# 🚀 Phase 1 MVP - Implementation Guide

**Ngày bắt đầu:** 2026-01-21  
**Timeline:** 2-3 tháng  
**Features:** Books, Courses, Members, Payments

---

## 📋 OVERVIEW

Phase 1 MVP bao gồm:
1. ✅ Books Management (CRUD) + Authors + Categories + Publishers
2. ✅ Courses Management (CRUD) + Categories + Instructors
3. ✅ Members Management + Membership Plans
4. ✅ Book Loans (Basic)
5. ✅ Simple Payments

---

## 🗄️ DATABASE SETUP

### 1. Chạy Phase 1 Schema

```bash
cd backend

# Option 1: Add to existing database
psql -U postgres -d library_tn -f database/phase1-schema.sql

# Option 2: Integrate với setup script
# Thêm vào backend/scripts/setup-all.js:
```

```javascript
// backend/scripts/setup-all.js
const phase1Path = path.join(__dirname, '../database/phase1-schema.sql');
await executeSchemaFile(phase1Path);
console.log('✅ Phase 1 schema created');
```

### 2. Verify Tables Created

```sql
-- Check all phase 1 tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN (
  'books', 'authors', 'book_categories', 'publishers',
  'courses', 'course_categories', 'instructors',
  'members', 'membership_plans', 'book_loans', 'payments'
);
```

---

## 🔧 BACKEND API IMPLEMENTATION

### Cấu trúc Controllers

```
backend/src/controllers/
├── books.controller.js          ✅ Đã tạo
├── authors.controller.js        🔲 Cần tạo
├── bookCategories.controller.js 🔲 Cần tạo
├── publishers.controller.js     🔲 Cần tạo
├── courses.controller.js        🔲 Cần tạo
├── courseCategories.controller.js 🔲 Cần tạo
├── instructors.controller.js    🔲 Cần tạo
├── members.controller.js        🔲 Cần tạo
├── membershipPlans.controller.js 🔲 Cần tạo
├── bookLoans.controller.js      🔲 Cần tạo
└── payments.controller.js       🔲 Cần tạo (simple)
```

### Template Controller (Copy từ books.controller.js)

```javascript
/**
 * [Module] Controller
 * Description
 */

const { pool } = require('../config/database');

// GET /api/admin/[module]
exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    // ... implement pagination & search
  } catch (error) {
    return next(error);
  }
};

// GET /api/admin/[module]/:id
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    // ... implement get by id
  } catch (error) {
    return next(error);
  }
};

// POST /api/admin/[module]
exports.create = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // ... implement create
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

// PUT /api/admin/[module]/:id
exports.update = async (req, res, next) => {
  // Similar to create
};

// DELETE /api/admin/[module]/:id
exports.delete = async (req, res, next) => {
  // ... implement delete
};
```

### Routes Structure

```javascript
// backend/src/routes/books.routes.js
const express = require('express');
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/books.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, getBooks);
router.get('/:id', requireAuth, getBookById);
router.post('/', requireAuth, createBook);
router.put('/:id', requireAuth, updateBook);
router.delete('/:id', requireAuth, deleteBook);

module.exports = router;
```

### Update app.js

```javascript
// backend/src/app.js
// Add new routes
const booksRoutes = require('./routes/books.routes');
const authorsRoutes = require('./routes/authors.routes');
const bookCategoriesRoutes = require('./routes/bookCategories.routes');
const publishersRoutes = require('./routes/publishers.routes');
const coursesRoutes = require('./routes/courses.routes');
const courseCategoriesRoutes = require('./routes/courseCategories.routes');
const instructorsRoutes = require('./routes/instructors.routes');
const membersRoutes = require('./routes/members.routes');
const membershipPlansRoutes = require('./routes/membershipPlans.routes');
const bookLoansRoutes = require('./routes/bookLoans.routes');
const paymentsRoutes = require('./routes/payments.routes');

// Register routes
app.use('/api/admin/books', requireAuth, booksRoutes);
app.use('/api/admin/authors', requireAuth, authorsRoutes);
app.use('/api/admin/book-categories', requireAuth, bookCategoriesRoutes);
app.use('/api/admin/publishers', requireAuth, publishersRoutes);
app.use('/api/admin/courses', requireAuth, coursesRoutes);
app.use('/api/admin/course-categories', requireAuth, courseCategoriesRoutes);
app.use('/api/admin/instructors', requireAuth, instructorsRoutes);
app.use('/api/admin/members', requireAuth, membersRoutes);
app.use('/api/admin/membership-plans', requireAuth, membershipPlansRoutes);
app.use('/api/admin/book-loans', requireAuth, bookLoansRoutes);
app.use('/api/admin/payments', requireAuth, paymentsRoutes);
```

---

## 🎨 FRONTEND ADMIN IMPLEMENTATION

### Cấu trúc Pages

```
frontend/app/(admin)/admin/
├── books/
│   ├── page.tsx                # List books
│   ├── new/page.tsx            # Create book
│   ├── [id]/page.tsx           # View/Edit book
│   └── components/
│       ├── BookList.tsx
│       ├── BookForm.tsx
│       └── BookFilters.tsx
├── authors/
│   ├── page.tsx
│   ├── new/page.tsx
│   └── [id]/page.tsx
├── book-categories/
│   ├── page.tsx
│   └── ... (similar structure)
├── publishers/
│   └── ...
├── courses/
│   ├── page.tsx
│   ├── new/page.tsx
│   ├── [id]/page.tsx
│   └── components/
│       ├── CourseList.tsx
│       ├── CourseForm.tsx
│       └── CourseFilters.tsx
├── course-categories/
│   └── ...
├── instructors/
│   └── ...
├── members/
│   ├── page.tsx
│   ├── [id]/
│   │   ├── page.tsx
│   │   ├── loans/page.tsx      # Book loans history
│   │   └── courses/page.tsx    # Enrolled courses
│   └── components/
│       ├── MemberList.tsx
│       └── MemberProfile.tsx
├── membership-plans/
│   └── ...
├── book-loans/
│   ├── page.tsx                # All loans
│   ├── new/page.tsx            # Create loan
│   └── components/
│       ├── LoanList.tsx
│       └── LoanForm.tsx
└── payments/
    ├── page.tsx
    └── components/
        └── PaymentList.tsx
```

### Template Page Component

```typescript
// frontend/app/(admin)/admin/books/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';

export default function BooksPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['books', page, search],
    queryFn: () => api.admin.books.getAll({ page, limit: 20, search }),
  });

  const columns = [
    { header: 'ISBN', accessorKey: 'isbn' },
    { header: 'Tên sách', accessorKey: 'title' },
    { header: 'Tác giả', accessorKey: 'author_count' },
    { header: 'Trạng thái', accessorKey: 'status' },
    { header: 'Số lượng', accessorKey: 'quantity' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Sách</h1>
        <Link href="/admin/books/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Thêm sách
          </Button>
        </Link>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Tìm kiếm theo tên, ISBN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
```

### API Client Structure

```typescript
// frontend/lib/api/admin/endpoints.ts
export const endpoints = {
  books: {
    getAll: '/api/admin/books',
    getById: (id: number) => `/api/admin/books/${id}`,
    create: '/api/admin/books',
    update: (id: number) => `/api/admin/books/${id}`,
    delete: (id: number) => `/api/admin/books/${id}`,
  },
  authors: {
    getAll: '/api/admin/authors',
    // ... similar structure
  },
  courses: {
    getAll: '/api/admin/courses',
    // ... similar structure
  },
  members: {
    getAll: '/api/admin/members',
    // ... similar structure
  },
  bookLoans: {
    getAll: '/api/admin/book-loans',
    create: '/api/admin/book-loans',
    // ... similar structure
  },
};
```

### React Query Hooks

```typescript
// frontend/lib/hooks/useBooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useBooks(params?: any) {
  return useQuery({
    queryKey: ['books', params],
    queryFn: () => api.admin.books.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBook(id: number) {
  return useQuery({
    queryKey: ['books', id],
    queryFn: () => api.admin.books.getById(id),
    enabled: !!id,
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => api.admin.books.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}

export function useUpdateBook(id: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => api.admin.books.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['books', id] });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.admin.books.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}
```

---

## 📱 UI COMPONENTS NEEDED

### Shared Components

```typescript
// Use existing Shadcn/UI components:
- Button
- Input
- Select
- Dialog/Modal
- Table/DataTable
- Form components
- Badge
- Card
- Tabs
- DatePicker
- Toast/Notifications
```

### Custom Components to Create

```
frontend/components/admin/
├── books/
│   ├── BookCard.tsx
│   ├── BookTable.tsx
│   ├── BookForm.tsx
│   └── BookFilters.tsx
├── courses/
│   ├── CourseCard.tsx
│   ├── CourseTable.tsx
│   └── CourseForm.tsx
├── members/
│   ├── MemberCard.tsx
│   └── MemberProfile.tsx
└── shared/
    ├── StatusBadge.tsx
    ├── ImageUpload.tsx
    ├── MultiSelect.tsx
    └── RichTextEditor.tsx
```

---

## 🎯 IMPLEMENTATION PRIORITY

### Week 1-2: Books Module
- [x] Database schema ✅
- [ ] Backend API (books, authors, categories, publishers)
- [ ] Frontend pages (CRUD)
- [ ] Testing

### Week 3-4: Courses Module
- [ ] Backend API (courses, categories, instructors)
- [ ] Frontend pages (CRUD)
- [ ] Testing

### Week 5-6: Members & Loans
- [ ] Backend API (members, membership plans, book loans)
- [ ] Frontend pages
- [ ] Loan workflow (borrow, return, overdue)
- [ ] Testing

### Week 7-8: Payments & Polish
- [ ] Simple payments API
- [ ] Payment UI
- [ ] Dashboard integration
- [ ] Bug fixes & optimization
- [ ] Documentation

---

## 🧪 TESTING CHECKLIST

### Books Module
- [ ] Create book with authors & categories
- [ ] Update book information
- [ ] Delete book (check constraints)
- [ ] Search & filter books
- [ ] Upload book cover image
- [ ] Bulk import books (CSV/Excel)

### Courses Module
- [ ] Create course with instructors & categories
- [ ] Update course
- [ ] Delete course
- [ ] Search & filter courses
- [ ] Upload course thumbnail

### Members Module
- [ ] Register new member
- [ ] Update member profile
- [ ] Assign membership plan
- [ ] View member history

### Book Loans
- [ ] Create loan (check availability)
- [ ] Return book
- [ ] Calculate late fees
- [ ] View overdue books
- [ ] Member loan history

### Payments
- [ ] Record payment
- [ ] View payment history
- [ ] Payment status updates

---

## 🔐 SECURITY CHECKLIST

- [ ] All routes protected with `requireAuth`
- [ ] Input validation (Joi schemas)
- [ ] SQL injection prevention (parameterized queries) ✅
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] File upload validation

---

## 📊 PERFORMANCE OPTIMIZATION

### Database
- [x] Indexes created ✅
- [ ] Query optimization
- [ ] Connection pooling
- [ ] Caching strategy (Redis)

### Frontend
- [ ] React Query caching
- [ ] Image optimization
- [ ] Code splitting
- [ ] Lazy loading

---

## 📝 DOCUMENTATION TASKS

- [ ] API documentation (Swagger)
- [ ] Frontend component docs (Storybook)
- [ ] User manual
- [ ] Admin guide
- [ ] Deployment guide

---

## 🚀 DEPLOYMENT

### Development
```bash
# Backend
cd backend
npm install
npm run setup
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Production
```bash
# Build
npm run build

# Docker
docker-compose up -d
```

---

## 📈 SUCCESS METRICS

### Functionality
- [ ] All CRUD operations working
- [ ] Search & filters working
- [ ] Relationships (authors, categories) working
- [ ] File uploads working
- [ ] Pagination working

### Performance
- [ ] Page load < 2s
- [ ] API response < 500ms
- [ ] Database queries optimized
- [ ] No N+1 queries

### Code Quality
- [ ] Clean code structure
- [ ] Consistent naming
- [ ] Error handling
- [ ] Comments & documentation
- [ ] No linter errors

---

## 🎉 NEXT STEPS (Phase 2)

After Phase 1 MVP is complete:
1. Course Lessons & Sections
2. Course Enrollments
3. Quizzes/Assignments
4. Reviews & Ratings
5. Notifications
6. Advanced features

---

**Good luck building! 🚀📚🎓**
