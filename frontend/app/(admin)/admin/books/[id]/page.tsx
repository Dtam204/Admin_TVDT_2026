'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useBook, useUpdateBook, useDeleteBook } from '@/lib/hooks/useBooks';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const bookId = parseInt(id);

  const { data: bookData, isLoading } = useBook(bookId);
  const { mutate: updateBook, isPending: isUpdating } = useUpdateBook(bookId);
  const { mutate: deleteBook, isPending: isDeleting } = useDeleteBook();

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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Đang tải...</div>
      </div>
    );
  }

  if (!bookData?.data) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Không tìm thấy sách</div>
      </div>
    );
  }

  const book = bookData.data;

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/books">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Chỉnh sửa sách</h1>
            <p className="text-muted-foreground">
              #{bookId} - {typeof book.title === 'string' ? JSON.parse(book.title).vi : book.title?.vi}
            </p>
          </div>
        </div>
        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
          <Trash2 className="w-4 h-4 mr-2" />
          Xóa sách
        </Button>
      </div>

      {/* Form - Similar to create page but with initialData */}
      <div className="space-y-6">
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="font-semibold mb-4">Thông tin sách</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">ISBN</p>
              <p className="font-medium">{book.isbn}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tên sách</p>
              <p className="font-medium">
                {typeof book.title === 'string' ? JSON.parse(book.title).vi : book.title?.vi}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Số lượng</p>
                <p className="font-medium">{book.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Còn lại</p>
                <p className="font-medium">{book.available_quantity}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trạng thái</p>
              <p className="font-medium">{book.status}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link href="/admin/books">
            <Button variant="outline">Quay lại</Button>
          </Link>
          <Button disabled>
            <Save className="w-4 h-4 mr-2" />
            Chỉnh sửa (Coming soon)
          </Button>
        </div>
      </div>
    </div>
  );
}
