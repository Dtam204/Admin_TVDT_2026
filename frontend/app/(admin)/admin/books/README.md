# Books Module - Frontend Structure

## Pages Structure

```
books/
├── page.tsx                  # List all books (main page)
├── new/
│   └── page.tsx              # Create new book form
├── [id]/
│   └── page.tsx              # View/Edit book details
└── components/
    ├── BookList.tsx          # Table/Grid of books
    ├── BookForm.tsx          # Create/Edit form
    ├── BookFilters.tsx       # Search & filter UI
    ├── BookCard.tsx          # Single book card
    └── BookDetails.tsx       # Book detail view
```

## Implementation Example

### 1. Main List Page (`page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useBooks } from '@/lib/hooks/useBooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { BookList } from './components/BookList';
import { BookFilters } from './components/BookFilters';

export default function BooksPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});

  const { data, isLoading } = useBooks({ page, search, ...filters });

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Sách</h1>
          <p className="text-muted-foreground">
            Quản lý toàn bộ sách trong thư viện
          </p>
        </div>
        <Link href="/admin/books/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Thêm sách mới
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <Input
            placeholder="Tìm kiếm theo tên sách, ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
            icon={<Search className="w-4 h-4" />}
          />
          <BookFilters onChange={setFilters} />
        </div>
      </div>

      {/* Book List */}
      <BookList
        books={data?.data || []}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
```

### 2. Create Page (`new/page.tsx`)

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useCreateBook } from '@/lib/hooks/useBooks';
import { BookForm } from '../components/BookForm';
import { toast } from 'sonner';

export default function NewBookPage() {
  const router = useRouter();
  const { mutate: createBook, isPending } = useCreateBook();

  const handleSubmit = (data: any) => {
    createBook(data, {
      onSuccess: () => {
        toast.success('Đã tạo sách thành công');
        router.push('/admin/books');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Có lỗi xảy ra');
      },
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Thêm sách mới</h1>
        <p className="text-muted-foreground">
          Nhập thông tin sách và liên kết với tác giả, thể loại
        </p>
      </div>

      <BookForm onSubmit={handleSubmit} loading={isPending} />
    </div>
  );
}
```

### 3. Detail/Edit Page (`[id]/page.tsx`)

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useBook, useUpdateBook, useDeleteBook } from '@/lib/hooks/useBooks';
import { BookForm } from '../components/BookForm';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BookDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const bookId = parseInt(params.id);
  
  const { data: book, isLoading } = useBook(bookId);
  const { mutate: updateBook, isPending: isUpdating } = useUpdateBook(bookId);
  const { mutate: deleteBook, isPending: isDeleting } = useDeleteBook();

  const handleUpdate = (data: any) => {
    updateBook(data, {
      onSuccess: () => {
        toast.success('Đã cập nhật sách thành công');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Có lỗi xảy ra');
      },
    });
  };

  const handleDelete = () => {
    if (!confirm('Bạn có chắc muốn xóa sách này?')) return;
    
    deleteBook(bookId, {
      onSuccess: () => {
        toast.success('Đã xóa sách thành công');
        router.push('/admin/books');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Không thể xóa sách');
      },
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (!book) return <div>Không tìm thấy sách</div>;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Chỉnh sửa sách</h1>
          <p className="text-muted-foreground">
            Cập nhật thông tin sách #{bookId}
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Xóa sách
        </Button>
      </div>

      <BookForm
        initialData={book}
        onSubmit={handleUpdate}
        loading={isUpdating}
      />
    </div>
  );
}
```

## API Hooks Setup

Create file: `frontend/lib/hooks/useBooks.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useBooks(params?: any) {
  return useQuery({
    queryKey: ['books', params],
    queryFn: () => api.admin.books.getAll(params),
    staleTime: 5 * 60 * 1000,
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

## Next Steps

1. **Create components/**
   - Copy this structure for other modules (courses, members, etc.)
   
2. **Implement BookList.tsx**
   - Use DataTable or custom table
   - Add pagination, sorting, filtering
   
3. **Implement BookForm.tsx**
   - Form with validation (react-hook-form + zod)
   - Multi-select for authors, categories
   - Image upload for cover
   
4. **Test the flow**
   - Create → Edit → Delete
   - Search & filter
   - Pagination

---

**Similar structure for:**
- `/admin/courses`
- `/admin/members`
- `/admin/book-loans`
- etc.
