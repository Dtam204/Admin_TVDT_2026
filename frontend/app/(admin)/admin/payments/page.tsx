'use client';

import { useState } from 'react';
import { usePayments, useDeletePayment, useFinanceStats } from '@/lib/hooks/usePayments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Search, Trash2, CreditCard, BadgeCent, TrendingUp, 
  Wallet, ArrowUpCircle, Landmark, Zap, CheckCircle2, 
  Clock, AlertCircle, RefreshCcw, Filter, ExternalLink, Info
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/components/ui/utils';
import { safeFormatDateVN, safeFormatTimeVN } from '@/lib/date';

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const { data, isLoading } = usePayments({ page, limit: 20, search, type: filterType });
  const { data: statsData } = useFinanceStats();
  const { mutate: deleteItem } = useDeletePayment();

  // Financial Stats with Defaults
  const stats = statsData?.data || {
    dailyRevenue: 0,
    trendPercent: 0,
    automatedCount: 0,
    totalWallet: 0
  };

  const handleDelete = (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa giao dịch này?')) return;
    deleteItem(id, {
      onSuccess: () => toast.success('Đã xóa thành công'),
      onError: (error: any) => toast.error(error.message || 'Không thể xóa'),
    });
  };

  const getStatusBadge = (status: string) => {
    const map: any = {
      completed: { label: 'Thành công', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      pending: { label: 'Đang xử lý', icon: Clock, cls: 'bg-amber-50 text-amber-600 border-amber-100 italic' },
      failed: { label: 'Thất bại', icon: AlertCircle, cls: 'bg-rose-50 text-rose-600 border-rose-100' },
      refunded: { label: 'Hoàn tiền', icon: RefreshCcw, cls: 'bg-slate-50 text-slate-500 border-slate-100' },
    };
    const cfg = map[status] || { label: status, icon: Info, cls: '' };
    const Icon = cfg.icon;
    return (
      <Badge className={cn("px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm flex items-center gap-1 w-fit", cfg.cls)}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </Badge>
    );
  };

  const getBankBadge = (gateway: string, method: string) => {
    if (method === 'cash') return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-600 rounded-lg border border-slate-200">
        <Wallet className="w-3 h-3" />
        <span className="text-[9px] font-black uppercase">Tiền mặt</span>
      </div>
    );

    const isMB = gateway?.toLowerCase().includes('mb');
    return (
      <div className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-lg border shadow-sm",
        isMB ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-indigo-50 text-indigo-700 border-indigo-100"
      )}>
        <Landmark className="w-3 h-3" />
        <span className="text-[9px] font-black uppercase">{gateway || 'BANKING'}</span>
      </div>
    );
  };

  const getSyncBadge = (syncStatus: string) => {
    if (syncStatus === 'automated') return (
      <div className="flex items-center gap-1 group/sync relative">
        <div className="flex items-center justify-center w-5 h-5 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-200 animate-pulse">
          <Zap className="w-3 h-3 fill-white" />
        </div>
        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter opacity-0 group-hover/sync:opacity-100 transition-opacity absolute left-6 whitespace-nowrap bg-white px-2 py-0.5 rounded border border-emerald-100 z-20">
          Xác thực bởi SePay
        </span>
      </div>
    );
    return null;
  };

  const getTypeBadge = (type: string) => {
    const normalized = String(type || '').toLowerCase();
    const map: any = {
      wallet_deposit: { label: 'Nap vi', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
      membership: { label: 'Hoi vien', cls: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
      fee_penalty: { label: 'Tien phat', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
      manual_payment: { label: 'Manual', cls: 'bg-slate-50 text-slate-700 border-slate-100' },
      refund: { label: 'Hoan tien', cls: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
      wallet_withdrawal: { label: 'Rut vi', cls: 'bg-rose-50 text-rose-700 border-rose-100' }
    };
    const cfg = map[normalized] || { label: normalized || 'N/A', cls: 'bg-slate-50 text-slate-600 border-slate-100' };
    return (
      <Badge className={cn('px-2 py-0.5 rounded-md text-[9px] font-black uppercase border', cfg.cls)}>
        {cfg.label}
      </Badge>
    );
  };

  return (
    <div className="w-full pb-8 space-y-0 text-slate-900 bg-[#f8fafc] min-h-screen font-sans">
      {/* ── PROFESSIONAL COMPACT HEADER ── */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-950 to-black px-6 py-4 md:px-10 md:py-6 shadow-2xl relative overflow-hidden border-b border-white/5">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-[100px]" />
        
        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-xl">
                <BadgeCent className="w-8 h-8 text-indigo-300" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl 2xl:text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                   Tài chính & Giao dịch
                  <Badge className="bg-emerald-500 text-white border-none text-[9px] font-black uppercase px-2 py-0.5 rounded-md">LIVE</Badge>
                </h1>
                <p className="text-indigo-200/40 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 mt-1">
                  <Landmark className="w-3.5 h-3.5 text-indigo-400" />
                  Banking Integrated Hub
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/admin/payments/new">
                <Button className="bg-white text-slate-900 hover:bg-slate-100 font-black px-6 py-2 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-[11px] gap-2 h-10 border-none">
                  <Plus className="w-4 h-4 stroke-[3px]" />
                  TẠO GIAO DỊCH
                </Button>
              </Link>
              <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-10 px-4 font-bold text-[10px] gap-2">
                <RefreshCcw className="w-3.5 h-3.5" />
                ĐỐI SOÁT SEPAY
              </Button>
            </div>
          </div>

          {/* FINANCIAL KPI CARDS - CONNECTED */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-3.5 rounded-2xl flex items-center gap-4 min-w-[200px] hover:bg-white/10 transition-all group flex-1 md:flex-none">
               <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
               </div>
               <div>
                  <p className="text-[7px] text-emerald-400 font-black uppercase tracking-[0.2em] mb-0.5">Dòng tiền ngày</p>
                  <div className="flex items-baseline gap-1.5">
                     <span className="text-lg font-black text-white tracking-tight">
                        {stats.dailyRevenue >= 1000000 
                          ? `${(stats.dailyRevenue / 1000000).toFixed(1)}M+` 
                          : `${stats.dailyRevenue.toLocaleString()}đ`}
                     </span>
                     <span className={cn(
                        "text-[9px] font-bold",
                        stats.trendPercent >= 0 ? "text-emerald-500" : "text-rose-500"
                     )}>
                        {stats.trendPercent >= 0 ? '+' : ''}{stats.trendPercent}%
                     </span>
                  </div>
               </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-3.5 rounded-2xl flex items-center gap-4 min-w-[200px] hover:bg-white/10 transition-all group flex-1 md:flex-none">
               <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400" />
               </div>
               <div>
                  <p className="text-[7px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-0.5">Giao dịch tự động</p>
                  <div className="flex items-baseline gap-1.5 text-white">
                     <span className="text-lg font-black tracking-tight">{stats.automatedCount}</span>
                     <span className="text-[8px] text-indigo-400 font-bold uppercase opacity-60">Success</span>
                  </div>
               </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-3.5 rounded-2xl flex items-center gap-4 min-w-[200px] hover:bg-white/10 transition-all group flex-1 md:flex-none">
               <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Wallet className="w-5 h-5 text-blue-400" />
               </div>
               <div>
                  <p className="text-[7px] text-blue-400 font-black uppercase tracking-[0.2em] mb-0.5">Tổng số dư ví</p>
                  <div className="flex items-baseline gap-1.5 text-white">
                     <span className="text-lg font-black tracking-tight">{(stats.totalWallet / 1000000).toFixed(1)}M</span>
                     <span className="text-[8px] text-blue-400 font-bold uppercase opacity-60">Total</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 -mt-6 space-y-4 relative z-20">
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <p className="text-[11px] font-black text-indigo-700 uppercase tracking-wider">Payment Sync V2 Enabled</p>
            <p className="text-[12px] text-indigo-900">
              Bang nay da dong bo theo luong moi: external txn, sync status, reference id va doi soat webhook.
            </p>
          </div>
          <Link href="/api-docs" className="text-[11px] font-black text-indigo-700 underline underline-offset-2">
            Mo Swagger de doi chieu
          </Link>
        </div>

        {/* COMPACT TOOLBAR */}
        <div className="bg-white rounded-3xl p-3 shadow-xl flex flex-col md:flex-row items-center gap-3 border border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 transition-colors" />
            <Input
              placeholder="Tìm theo Mã GD, Mã MB Bank, Tên hội viên..."
              className="pl-11 h-11 border-none bg-slate-50/50 focus:bg-white text-[12px] font-medium rounded-xl transition-all shadow-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterType}
                  onChange={(e) => {
                    setPage(1);
                    setFilterType(e.target.value);
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-600"
                >
                  <option value="all">Tat ca</option>
                  <option value="wallet_deposit">Nap vi</option>
                  <option value="membership">Hoi vien</option>
                  <option value="fee_penalty">Tien phat</option>
                  <option value="manual_payment">Manual</option>
                  <option value="refund">Hoan tien</option>
                </select>
             </div>
             <div className="h-6 w-[1px] bg-slate-200 hidden md:block" />
             <Button variant="ghost" className="h-11 rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest text-slate-500 px-4">
                <ExternalLink className="w-3.5 h-3.5" />
                XUẤT FILE
             </Button>
          </div>
        </div>

        {/* FINANCIAL DATA TABLE */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                <TableRow className="hover:bg-transparent h-16">
                  <TableHead className="px-8 font-black text-slate-500 uppercase text-[10px] tracking-widest w-[140px]">Đối soát</TableHead>
                  <TableHead className="px-4 font-black text-slate-500 uppercase text-[10px] tracking-widest">Hội viên & Thẻ</TableHead>
                  <TableHead className="px-4 font-black text-slate-500 uppercase text-[10px] tracking-widest text-center">Nghiệp vụ</TableHead>
                  <TableHead className="px-4 font-black text-slate-500 uppercase text-[10px] tracking-widest text-center">Nguồn tiền</TableHead>
                  <TableHead className="px-4 font-black text-slate-500 uppercase text-[10px] tracking-widest text-right">Số tiền</TableHead>
                  <TableHead className="px-4 font-black text-slate-500 uppercase text-[10px] tracking-widest text-center">Trạng thái</TableHead>
                  <TableHead className="px-4 font-black text-slate-500 uppercase text-[10px] tracking-widest text-center">Thời gian</TableHead>
                  <TableHead className="pr-8 font-black text-slate-500 uppercase text-[10px] tracking-widest text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-32">
                       <div className="flex flex-col items-center gap-6">
                          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-lg shadow-indigo-200" />
                          <span className="text-slate-400 font-black uppercase text-[11px] tracking-[0.3em] animate-pulse">Syncing Financial Cloud...</span>
                       </div>
                    </TableCell>
                  </TableRow>
                ) : data?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-40">
                       <div className="bg-slate-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform rotate-12">
                          <CreditCard className="w-10 h-10 text-slate-200" />
                       </div>
                       <span className="text-sm font-black text-slate-300 uppercase tracking-[0.4em]">Zero Transactions Found</span>
                    </TableCell>
                  </TableRow>
                ) : data?.data?.map((item: any) => (
                  <TableRow key={item.id} className="group hover:bg-indigo-50/30 transition-all h-24 border-slate-50 text-slate-900 border-b last:border-none">
                    <TableCell className="px-8">
                       <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                             <span className="text-[12px] font-black font-mono text-slate-900 group-hover:text-indigo-600">#{item.id}</span>
                             {getSyncBadge(item.sync_status)}
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 font-mono tracking-tighter truncate max-w-[100px]">
                             {item.external_txn_id || 'LOCAL-TXN'}
                          </span>
                       </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform">
                            {((item.member_name || '?').charAt(0)).toUpperCase()}
                         </div>
                         <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-black text-slate-900 uppercase truncate leading-tight">{item.member_name || '-'}</span>
                            <span className="text-[10px] text-indigo-500 font-bold font-mono tracking-tighter">CARD: {item.card_number || 'ST-GUEST'}</span>
                         </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        {getTypeBadge(item.type || item.transaction_type)}
                        <span className="text-[9px] text-slate-400 font-mono truncate max-w-[110px]">
                          {item.reference_id || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 text-center">
                       <div className="flex flex-col items-center gap-1.5">
                          {getBankBadge(item.gateway, item.payment_method)}
                          <span className="text-[9px] text-slate-400 font-medium italic truncate max-w-[120px]">
                            {item.payment_content || item.description || ''}
                          </span>
                       </div>
                    </TableCell>
                    <TableCell className="px-4 text-right">
                       <div className="flex flex-col items-end">
                          <span className={cn("text-base font-black tracking-tight", 
                             item.amount > 0 ? 'text-emerald-600' : 'text-slate-900'
                          )}>
                             {item.amount > 0 ? '+' : ''}{item.amount?.toLocaleString('vi-VN')}đ
                          </span>
                          <span className="text-[9px] text-slate-400 font-black uppercase opacity-60">VNĐ</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-center px-4">
                      <div className="flex justify-center">
                        {getStatusBadge(item.status)}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 text-center">
                       <div className="flex flex-col items-center leading-none gap-1">
                          <span className="text-[11px] text-slate-900 font-black">{safeFormatDateVN(item.created_at)}</span>
                          <span className="text-[9px] text-indigo-500 font-bold font-mono opacity-80">{safeFormatTimeVN(item.created_at)}</span>
                       </div>
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                      <div className="flex justify-end gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-lg rounded-xl transition-all" onClick={() => toast.info(`Nội dung: ${item.payment_content || item.description}`)}>
                          <Search className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-lg rounded-xl transition-all" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-6 bg-slate-50/50 border-t border-slate-100 gap-4">
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Transacting Globally • Page <span className="text-indigo-600 underline">0{page}</span> of 0{data.pagination.totalPages}
               </p>
               <div className="flex gap-3">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="h-11 px-6 rounded-2xl font-black text-[11px] border-slate-200 text-slate-600 uppercase tracking-widest hover:bg-white hover:text-indigo-600 transition-all">
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)} className="h-11 px-6 rounded-2xl font-black text-[11px] border-slate-200 text-slate-600 uppercase tracking-widest hover:bg-white hover:text-indigo-600 transition-all">
                    Next
                  </Button>
               </div>
            </div>
          )}
        </div>
        
        {/* PRO FOOTER BANNER */}
        <div className="bg-slate-950 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-300 group">
           <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform group-hover:scale-[1.7] group-hover:rotate-0 duration-700">
              <TrendingUp className="w-64 h-64 text-indigo-400" />
           </div>
           <div className="flex flex-col md:flex-row items-center justify-between md:items-start gap-8 relative z-10">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-white/10 rounded-[2rem] flex items-center justify-center text-emerald-400 flex-shrink-0 backdrop-blur-2xl border border-white/10 shadow-2xl group-hover:rotate-6 transition-transform">
                   <Wallet className="w-8 h-8" />
                </div>
                <div className="space-y-2 text-center md:text-left">
                   <h4 className="font-black text-white text-xl lg:text-2xl tracking-tighter uppercase leading-none">Minh bạch Tài chính Chuyên nghiệp</h4>
                   <p className="text-[13px] text-slate-400 leading-relaxed font-bold italic max-w-2xl opacity-80">
                      Hệ thống tự động liên kết với <strong>SePay & MB Bank</strong> để đối soát dòng tiền theo thời gian thực. 
                      Mọi giao dịch nạp quỹ, gia hạn thẻ đều được mã hóa và theo dõi vết ID ngân hàng 100%.
                   </p>
                </div>
              </div>
              <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
                 <div className="text-[8px] font-black uppercase tracking-[0.4em] text-indigo-400">Security Standard</div>
                 <div className="flex gap-2">
                    <div className="w-10 h-7 bg-white/5 rounded-md border border-white/10 flex items-center justify-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all italic font-black text-[8px]">PCI-DSS</div>
                    <div className="w-10 h-7 bg-white/5 rounded-md border border-white/10 flex items-center justify-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all italic font-black text-[8px]">MB-BANK</div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
