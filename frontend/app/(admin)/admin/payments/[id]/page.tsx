'use client';

import { use } from 'react';
import { usePayment } from '@/lib/hooks/usePayments';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, AlertCircle, Clock, RefreshCcw, Zap } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

function getStatusBadge(status: string) {
  const key = String(status || '').toLowerCase();
  const map: any = {
    completed: { label: 'Thanh cong', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
    pending: { label: 'Dang xu ly', cls: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
    failed: { label: 'That bai', cls: 'bg-rose-50 text-rose-700 border-rose-100', icon: AlertCircle },
    refunded: { label: 'Hoan tien', cls: 'bg-slate-50 text-slate-700 border-slate-100', icon: RefreshCcw }
  };
  const cfg = map[key] || { label: status || 'N/A', cls: 'bg-slate-50 text-slate-700 border-slate-100', icon: Clock };
  const Icon = cfg.icon;
  return (
    <Badge className={`text-[10px] font-bold border ${cfg.cls}`}>
      <Icon className="w-3 h-3 mr-1" />
      {cfg.label}
    </Badge>
  );
}

export default function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = usePayment(parseInt(id));

  if (isLoading) return <div className="container mx-auto p-6"><div className="text-center py-12">Dang tai...</div></div>;
  if (!data?.data) return <div className="container mx-auto p-6"><div className="text-center py-12">Khong tim thay</div></div>;

  const item = data.data;

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
      <div className="bg-card p-6 rounded-lg border space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">Transaction ID</p>
            <p className="font-mono text-base font-bold">{item.transaction_id || '-'}</p>
          </div>
          <div className="flex items-center gap-2">
            {item.sync_status === 'automated' ? (
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">
                <Zap className="w-3 h-3 mr-1" />Automated
              </Badge>
            ) : (
              <Badge className="bg-slate-50 text-slate-700 border border-slate-100 text-[10px] font-bold">Manual</Badge>
            )}
            {getStatusBadge(item.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-md bg-slate-50 border">
            <p className="text-xs text-slate-500 mb-1">Member ID</p>
            <p className="font-semibold">{item.member_id || '-'}</p>
          </div>
          <div className="p-3 rounded-md bg-slate-50 border">
            <p className="text-xs text-slate-500 mb-1">Amount</p>
            <p className="font-semibold">{Number(item.amount || 0).toLocaleString('vi-VN')}đ</p>
          </div>
          <div className="p-3 rounded-md bg-slate-50 border">
            <p className="text-xs text-slate-500 mb-1">Type</p>
            <p className="font-semibold">{item.type || '-'}</p>
          </div>
          <div className="p-3 rounded-md bg-slate-50 border">
            <p className="text-xs text-slate-500 mb-1">Payment Method</p>
            <p className="font-semibold">{item.payment_method || '-'}</p>
          </div>
          <div className="p-3 rounded-md bg-slate-50 border">
            <p className="text-xs text-slate-500 mb-1">External Txn</p>
            <p className="font-mono font-semibold break-all">{item.external_txn_id || '-'}</p>
          </div>
          <div className="p-3 rounded-md bg-slate-50 border">
            <p className="text-xs text-slate-500 mb-1">Reference ID</p>
            <p className="font-mono font-semibold break-all">{item.reference_id || '-'}</p>
          </div>
          <div className="p-3 rounded-md bg-slate-50 border">
            <p className="text-xs text-slate-500 mb-1">Gateway</p>
            <p className="font-semibold">{item.gateway || '-'}</p>
          </div>
          <div className="p-3 rounded-md bg-slate-50 border">
            <p className="text-xs text-slate-500 mb-1">Created At</p>
            <p className="font-semibold">{item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '-'}</p>
          </div>
        </div>

        <div className="p-3 rounded-md bg-slate-50 border">
          <p className="text-xs text-slate-500 mb-1">Description</p>
          <p className="font-medium">{item.description || '-'}</p>
        </div>

        <div className="p-3 rounded-md bg-slate-50 border">
          <p className="text-xs text-slate-500 mb-1">Payment Content</p>
          <p className="font-medium break-words">{item.payment_content || '-'}</p>
        </div>
      </div>
    </div>
  );
}
