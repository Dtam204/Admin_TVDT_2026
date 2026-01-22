'use client';

import { useState } from 'react';
import { useBooks, useDeleteBook } from '@/lib/hooks/useBooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Book } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function BooksPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');

  const { data, isLoading } = useBooks({ 
    page, 
    limit: 20, 
    search, 
    status: status === 'all' ? undefined : status 
  });
  const { mutate: deleteBook } = useDeleteBook();

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa sách "${JSON.parse(title).vi || title}"?`)) return;

    deleteBook(id, {
      onSuccess: () => {
        toast.success('Đã xóa sách thành công');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Không thể xóa sách');
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      available: 'default',
      out_of_stock: 'destructive',
      discontinued: 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Book className="w-8 h-8" />
            Quản lý Sách
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý toàn bộ sách trong thư viện
          </p>
        </div>
        <Link href="/admin/books/new">
          <Button size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Thêm sách mới
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên sách, ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="available">Còn hàng</SelectItem>
            <SelectItem value="out_of_stock">Hết hàng</SelectItem>
            <SelectItem value="discontinued">Ngừng kinh doanh</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ISBN</TableHead>
              <TableHead>Tên sách</TableHead>
              <TableHead>NXB</TableHead>
              <TableHead className="text-center">Số lượng</TableHead>
              <TableHead className="text-center">Còn lại</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Chưa có sách nào
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((book: any) => (
                <TableRow key={book.id}>
                  <TableCell className="font-mono text-sm">{book.isbn}</TableCell>
                  <TableCell className="font-medium">
                    {typeof book.title === 'string' 
                      ? JSON.parse(book.title).vi || book.title
                      : book.title?.vi || 'N/A'
                    }
                  </TableCell>
                  <TableCell>{book.publisher_name || '-'}</TableCell>
                  <TableCell className="text-center">{book.quantity || 0}</TableCell>
                  <TableCell className="text-center">{book.available_quantity || 0}</TableCell>
                  <TableCell className="text-center">{getStatusBadge(book.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Link href={`/admin/books/${book.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(book.id, book.title)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Trước
          </Button>
          <span className="flex items-center px-4">
            Trang {page} / {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
