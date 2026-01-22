'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useMembershipPlan, useDeleteMembershipPlan } from '@/lib/hooks/useMembershipPlans';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function MembershipPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const itemId = parseInt(id);

  const { data, isLoading } = useMembershipPlan(itemId);
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteMembershipPlan();

  const handleDelete = () => {
    if (!confirm('Bạn có chắc muốn xóa?')) return;

    deleteItem(itemId, {
      onSuccess: () => {
        toast.success('Đã xóa thành công');
        router.push('/admin/membership-plans');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Không thể xóa');
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

  if (!data?.data) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Không tìm thấy dữ liệu</div>
      </div>
    );
  }

  const item = data.data;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/membership-plans">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Chi tiết Gói thành viên</h1>
            <p className="text-muted-foreground">#{itemId}</p>
          </div>
        </div>
        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
          <Trash2 className="w-4 h-4 mr-2" />
          Xóa
        </Button>
      </div>

      <div className="bg-card p-6 rounded-lg border">
        <pre className="text-sm">{JSON.stringify(item, null, 2)}</pre>
      </div>
    </div>
  );
}
