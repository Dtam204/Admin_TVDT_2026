'use client';

import { useState } from 'react';
import { useBookLoans, useDeleteBookLoan } from '@/lib/hooks/useBookLoans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function BookLoansPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useBookLoans({ page, limit: 20, search });
  const { mutate: deleteItem } = useDeleteBookLoan();

  const handleDelete = (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa phiếu mượn này?')) return;
    deleteItem(id, {
      onSuccess: () => toast.success('Đã xóa thành công'),
      onError: (error: any) => toast.error(error.message || 'Không thể xóa'),
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      borrowed: 'default',
      returned: 'outline',
      overdue: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            Quản lý Mượn/Trả sách
          </h1>
          <p className="text-muted-foreground mt-1">Theo dõi lịch sử mượn trả sách</p>
        </div>
        <Link href="/admin/book-loans/new">
          <Button size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Tạo phiếu mượn
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Thành viên</TableHead>
              <TableHead>Sách</TableHead>
              <TableHead>Ngày mượn</TableHead>
              <TableHead>Hạn trả</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Đang tải...</TableCell>
              </TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Chưa có phiếu mượn nào
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono">#{item.id}</TableCell>
                  <TableCell>{item.member_name || '-'}</TableCell>
                  <TableCell>{item.book_title || '-'}</TableCell>
                  <TableCell>{item.loan_date || '-'}</TableCell>
                  <TableCell>{item.due_date || '-'}</TableCell>
                  <TableCell className="text-center">{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Link href={`/admin/book-loans/${item.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
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

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Trước
          </Button>
          <span className="flex items-center px-4">
            Trang {page} / {data.pagination.totalPages}
          </span>
          <Button variant="outline" disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
