'use client';

import { use } from 'react';
import { usePayment } from '@/lib/hooks/usePayments';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = usePayment(parseInt(id));

  if (isLoading) return <div className="container mx-auto p-6"><div className="text-center py-12">Đang tải...</div></div>;
  if (!data?.data) return <div className="container mx-auto p-6"><div className="text-center py-12">Không tìm thấy</div></div>;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/payments">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Chi tiết giao dịch</h1>
          <p className="text-muted-foreground">#{id}</p>
        </div>
      </div>
      <div className="bg-card p-6 rounded-lg border">
        <pre className="text-sm">{JSON.stringify(data.data, null, 2)}</pre>
      </div>
    </div>
  );
}
