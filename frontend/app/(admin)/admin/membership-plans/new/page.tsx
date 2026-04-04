'use client';

import { useRouter } from 'next/navigation';
import { useCreateMembershipPlan } from '@/lib/hooks/useMembershipPlans';
import { MembershipPlanForm } from '../MembershipPlanForm';
import { toast } from 'sonner';

export default function NewMembershipPlanPage() {
  const router = useRouter();
  const { mutate: create, isPending } = useCreateMembershipPlan();

  const handleSubmit = (data: any) => {
    create(data, {
      onSuccess: () => {
        toast.success('Đã tạo Gói Bạn Đọc thành công!');
        // Delay nhỏ để tránh lỗi unmount và hiển thị toast
        setTimeout(() => {
          router.push('/admin/membership-plans');
        }, 500);
      },
      onError: (err: any) => {
        toast.error(err.message || 'Lỗi khi tạo gói.');
      }
    });
  };

  return <MembershipPlanForm onSubmit={handleSubmit} isSubmitting={isPending} />;
}
