'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useMembershipPlan, useDeleteMembershipPlan, useUpdateMembershipPlan } from '@/lib/hooks/useMembershipPlans';
import { MembershipPlanForm } from '../MembershipPlanForm';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MembershipPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const itemId = parseInt(id);

  const { data, isLoading } = useMembershipPlan(itemId);
  const { mutate: update, isPending: isUpdating } = useUpdateMembershipPlan(itemId);
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteMembershipPlan();

  const handleDelete = () => {
    if (!confirm('Bạn có chắc muốn xóa Hạng thẻ này khỏi Thư viện?')) return;
    deleteItem(itemId, {
      onSuccess: () => {
        toast.success('Đã xóa Hạng thẻ!');
        router.push('/admin/membership-plans');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Không thể xóa');
      },
    });
  };

  const handleUpdate = (updatedData: any) => {
    update(updatedData, {
      onSuccess: () => {
        toast.success('Lưu cấu hình Hạng thẻ thành công!');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Lỗi khi cập nhật!');
      }
    });
  };

  if (isLoading) return <div className="text-center py-12">Đang tải cấu hình...</div>;
  if (!data?.data) return <div className="text-center py-12">Không tìm thấy dữ liệu</div>;

  return (
    <div className="relative">
      <div className="absolute top-6 right-6 z-10">
         <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
           <Trash2 className="w-4 h-4 mr-2" /> Xóa Thẻ
         </Button>
      </div>
      <MembershipPlanForm initialData={data.data} onSubmit={handleUpdate} isSubmitting={isUpdating} />
    </div>
  );
}
