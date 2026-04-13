'use client';

import { useEffect, useState } from 'react';
import { useMembershipPlans, useDeleteMembershipPlan } from '@/lib/hooks/useMembershipPlans';
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
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const toFeatureCount = (value: any) => {
  if (!value) return 0;
  if (Array.isArray(value)) return value.filter(Boolean).length;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).length;
      if (parsed && typeof parsed === 'object') return Object.values(parsed).filter(Boolean).length;
    } catch {
      return value.split(/\r?\n|,/).map((x) => x.trim()).filter(Boolean).length;
    }
  }
  if (typeof value === 'object') return Object.values(value).filter(Boolean).length;
  return 0;
};

const formatVnd = (amount: any) => `${Number(amount || 0).toLocaleString('vi-VN')}đ`;

export default function MembershipPlansPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, isLoading } = useMembershipPlans({ 
    page, 
    limit: 20, 
    search, 
    status: status === 'all' ? undefined : status 
  });
  const { mutate: deleteItem } = useDeleteMembershipPlan();

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa "${name}"?`)) return;

    deleteItem(id, {
      onSuccess: () => {
        toast.success('Đã xóa thành công');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Không thể xóa');
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      active: 'default',
      inactive: 'secondary',
      draft: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8" />
            Quản lý Hạng thẻ Bạn Đọc
          </h1>
          <p className="text-muted-foreground mt-1">
            Thiết lập các cấp độ thẻ, quyền hạn truy cập (Basic, Premium, VIP) cho Bạn đọc
          </p>
        </div>
        <Link href="/admin/membership-plans/new">
          <Button size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Thêm mới
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {isMounted ? (
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <div className="w-[200px] h-10 rounded-md border bg-background" />
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tên Hạng Thẻ</TableHead>
              <TableHead>Phân cấp (Tier)</TableHead>
              <TableHead>Giá / Thời hạn</TableHead>
              <TableHead>Quyền lợi chính</TableHead>
              <TableHead>Digital</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((item: any) => {
                // Parse multilang field
                let displayName = 'N/A';
                const nameField = item.name;
                
                if (nameField) {
                  if (typeof nameField === 'string') {
                    try {
                      const parsed = JSON.parse(nameField);
                      if (parsed && typeof parsed === 'object') {
                        const firstString = Object.values(parsed).find((v) => typeof v === 'string' && String(v).trim());
                        displayName = (firstString as string) || nameField;
                      } else {
                        displayName = nameField;
                      }
                    } catch {
                      displayName = nameField;
                    }
                  } else if (typeof nameField === 'object') {
                    const firstString = Object.values(nameField).find((v) => typeof v === 'string' && String(v).trim());
                    displayName = (firstString as string) || 'N/A';
                  } else {
                    displayName = String(nameField);
                  }
                }
                
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">#{item.id}</TableCell>
                    <TableCell className="font-medium">{displayName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase font-mono">
                        {item.tier_code || 'basic'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-semibold">{formatVnd(item.price)}</div>
                      <div className="text-xs text-muted-foreground">{item.duration_days || 0} ngày</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div>Mượn: <span className="font-semibold">{item.max_books_borrowed || 0}</span></div>
                        <div>Gia hạn: <span className="font-semibold">{item.max_renewal_limit || 0}</span></div>
                        <div>Features: <span className="font-semibold">{toFeatureCount(item.features)}</span></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        <Badge variant={item.allow_digital_read ? 'default' : 'secondary'} className="w-fit">{item.allow_digital_read ? 'Đọc online' : 'Không đọc số'}</Badge>
                        <Badge variant={item.allow_download ? 'default' : 'secondary'} className="w-fit">{item.allow_download ? 'Tải offline' : 'Không tải'}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/admin/membership-plans/${item.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item.id, displayName)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
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
