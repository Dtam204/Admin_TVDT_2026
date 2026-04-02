'use client';

import { useState } from 'react';
import { usePayments, useDeletePayment } from '@/lib/hooks/usePayments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, CreditCard, BadgeCent, TrendingUp, Info, Wallet, ArrowUpCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/components/ui/utils';

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = usePayments({ page, limit: 20, search });
  const { mutate: deleteItem } = useDeletePayment();

  const handleDelete = (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa giao dịch này?')) return;
    deleteItem(id, {
      onSuccess: () => toast.success('Đã xóa thành công'),
      onError: (error: any) => toast.error(error.message || 'Không thể xóa'),
    });
  };

  const getStatusBadge = (status: string) => {
    const map: any = {
      completed: { label: 'Thành công', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      pending: { label: 'Đang xử lý', cls: 'bg-amber-50 text-amber-600 border-amber-100 italic' },
      failed: { label: 'Thất bại', cls: 'bg-rose-50 text-rose-600 border-rose-100' },
      refunded: { label: 'Hoàn tiền', cls: 'bg-slate-50 text-slate-500 border-slate-100' },
    };
    const cfg = map[status] || { label: status, cls: '' };
    return (
      <Badge className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border shadow-sm", cfg.cls)}>
        {cfg.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const map: any = {
      deposit: { label: 'Nạp dư quỹ', icon: Wallet, color: 'emerald' },
      fee_penalty: { label: 'Phí quá hạn', icon: Info, color: 'rose' },
      plan_subscription: { label: 'Gia hạn thẻ', icon: ArrowUpCircle, color: 'indigo' },
      withdrawal: { label: 'Chi hoàn', icon: Trash2, color: 'slate' },
    };
    const cfg = map[type] || { label: type, icon: CreditCard, color: 'slate' };
    const Icon = cfg.icon;
    return (
      <div className="flex items-center gap-2 group/type">
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover/type:scale-110", `bg-${cfg.color}-50 text-${cfg.color}-600 border border-${cfg.color}-100`)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{cfg.label}</span>
      </div>
    );
  };

  return (
    <div className="w-full pb-8 space-y-0 text-slate-900 bg-slate-50/30 min-h-screen">
      {/* ── RICH COMPACT HEADER – FINANCIAL & PAYMENTS ── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-black px-6 py-5 md:px-10 md:py-6 2xl:py-10 shadow-xl relative overflow-hidden flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-white/10">
        {/* Subtle Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full -ml-24 -mb-24 blur-[80px]" />

        {/* LEFT SECTION: BRAND & ACTION */}
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl">
              <BadgeCent className="w-8 h-8 lg:w-9 lg:h-9 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl 2xl:text-4xl font-black text-white tracking-tight">Tài chính & Giao dịch</h1>
              <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 mt-1 opacity-60">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                HỆ THỐNG QUẢN LÝ DÒNG TIỀN
              </p>
            </div>
          </div>

          <Link href="/admin/payments/new">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-[11px] gap-2 h-10 w-fit border-none">
              <Plus className="w-4 h-4 stroke-[3px]" />
              Tạo giao dịch mới
            </Button>
          </Link>
        </div>

        {/* RIGHT SECTION: STATISTICS (COMPACT) */}
        <div className="relative z-10 flex flex-wrap xl:flex-nowrap items-center gap-3">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 transition-all hover:bg-white/10 min-w-[150px]">
             <div className="p-2 bg-emerald-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-300" />
             </div>
             <div>
                <p className="text-[7px] text-emerald-300 uppercase font-black tracking-widest leading-none mb-1">REVENUE FLOW</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-lg lg:text-xl font-black text-white">UP</span>
                   <span className="text-[8px] text-emerald-500 font-bold uppercase">Health</span>
                </div>
             </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 transition-all hover:bg-white/10 min-w-[150px]">
             <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Wallet className="w-5 h-5 text-indigo-300" />
             </div>
             <div>
                <p className="text-[7px] text-indigo-300 uppercase font-black tracking-widest leading-none mb-1">VOLUME</p>
                <div className="flex items-baseline gap-1 text-white">
                   <span className="text-lg lg:text-xl font-black">20K+</span>
                   <span className="text-[8px] text-indigo-400 font-bold uppercase">Txns</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-4 pt-6">
        {/* Toolbar */}
        <div className="flex items-center gap-4 group">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <Input
              placeholder="Tìm kiếm giao dịch theo ID, tên hội viên, mã thẻ hoặc nội dung..."
              className="pl-10 h-11 border-2 border-slate-100 bg-white focus:bg-white text-[11px] rounded-xl transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
          <Table className="border-collapse">
            <TableHeader className="bg-slate-50 border-b-2 border-slate-200">
              <TableRow className="hover:bg-transparent h-11">
                <TableHead className="px-6 font-black text-slate-800 uppercase text-[10px] tracking-wider w-[100px]">Mã GD</TableHead>
                <TableHead className="px-4 font-black text-slate-800 uppercase text-[10px] tracking-wider text-left">Hội viên & Thẻ</TableHead>
                <TableHead className="px-4 font-black text-slate-800 uppercase text-[10px] tracking-wider text-left">Loại giao dịch</TableHead>
                <TableHead className="px-4 font-black text-slate-800 uppercase text-[10px] tracking-wider text-right">Số tiền</TableHead>
                <TableHead className="px-4 font-black text-slate-800 uppercase text-[10px] tracking-wider text-center">Trạng thái</TableHead>
                <TableHead className="px-4 font-black text-slate-800 uppercase text-[10px] tracking-wider text-center">Thời gian</TableHead>
                <TableHead className="pr-6 font-black text-slate-800 uppercase text-[10px] tracking-wider text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                     <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Processing Transaction Data...</span>
                     </div>
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-32">
                     <CreditCard className="w-16 h-16 mx-auto mb-3 text-slate-100" />
                     <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">No Transactions Found</span>
                  </TableCell>
                </TableRow>
              ) : data?.data?.map((item: any) => (
                <TableRow key={item.id} className="group hover:bg-slate-50/80 transition-all h-20 border-slate-100 text-slate-900">
                  <TableCell className="px-6">
                    <span className="text-[11px] font-black font-mono text-slate-400">#{item.id}</span>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex flex-col">
                       <span className="text-[12px] font-black text-slate-900 uppercase group-hover:text-emerald-600 transition-colors">{item.member_name || '-'}</span>
                       <span className="text-[9px] text-slate-400 font-bold font-mono tracking-tighter">CARD: {item.card_number || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    {getTypeBadge(item.type)}
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    <span className={cn("text-[13px] font-black", 
                       item.amount > 0 && (item.type === 'deposit' || item.type === 'plan_subscription') ? 'text-emerald-600' : 'text-slate-900'
                    )}>
                       {item.amount > 0 ? '+' : ''}{item.amount?.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(item.status)}
                  </TableCell>
                  <TableCell className="px-4 text-center">
                     <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-500 font-bold">{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                        <span className="text-[8px] text-slate-400 font-mono italic opacity-60">{new Date(item.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                     </div>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <div className="flex justify-end gap-1 px-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" onClick={() => toast.info('Tính năng chi tiết đang phát triển')}>
                        <Search className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t-2 border-slate-200">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Financial Records • Page <strong>{page}</strong> of {data.pagination.totalPages}
               </p>
               <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="h-8 px-4 rounded-lg font-black text-[10px] border-slate-200 text-slate-600 uppercase tracking-widest">
                    Prev
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)} className="h-8 px-4 rounded-lg font-black text-[10px] border-slate-200 text-slate-600 uppercase tracking-widest">
                    Next
                  </Button>
               </div>
            </div>
          )}
        </div>
        
        {/* Financial Info Card */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-slate-200 mt-6">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp className="w-32 h-32 text-emerald-400" />
           </div>
           <div className="flex items-start gap-5 relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 flex-shrink-0 backdrop-blur-sm border border-white/10 shadow-lg">
                 <Wallet className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                 <h4 className="font-extrabold text-white text-lg tracking-tight uppercase leading-none">Minh bạch tài chính thư viện</h4>
                 <p className="text-[12px] text-slate-400 leading-relaxed font-bold italic max-w-2xl">
                    Hệ thống tự động ghi nhật ký mọi giao dịch nạp tiền, gia hạn thẻ và phí phạt. Vui lòng kiểm tra kỹ Mã giao dịch (GD) trước khi thực hiện các nghiệp vụ đối soát thủ công.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
