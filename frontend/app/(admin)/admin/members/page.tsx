'use client';

import { useState } from 'react';
import { useMembers, useDeleteMember, useMembershipRequests, useMemberStats } from '@/lib/hooks/useMembers';
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
import { Plus, Search, Edit, Trash2, Users, Clock, UserCheck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/components/ui/utils';
import { MembershipUpgradeModal } from '@/components/admin/members/MembershipUpgradeModal';
import { Crown } from 'lucide-react';

export default function MembersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [inactiveOnly, setInactiveOnly] = useState(false);
  
  // Upgrade Modal State
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const { data: statsData } = useMemberStats();
  const { data: requestsData } = useMembershipRequests({ status: 'pending' });
  const pendingCount = requestsData?.pagination?.total || 0;

  const { data, isLoading } = useMembers({ 
    page, 
    limit: 20, 
    search, 
    status: status === 'all' ? undefined : status,
    inactive_only: inactiveOnly ? 'true' : undefined
  });
  const { mutate: deleteItem } = useDeleteMember();

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
    const map: any = {
      active: { label: 'Hoạt động', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      inactive: { label: 'Tạm khóa', cls: 'bg-slate-100 text-slate-400 border-slate-200' },
      expired: { label: 'Hết hạn', cls: 'bg-rose-50 text-rose-600 border-rose-100' },
    };
    const cfg = map[status] || { label: status, cls: '' };
    return (
      <Badge className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border shadow-sm", cfg.cls)}>
        {cfg.label}
      </Badge>
    );
  };

  return (
    <div className="w-full pb-8 space-y-0 text-slate-900 bg-slate-50/30 min-h-screen">
      {/* ── RICH COMPACT HEADER (SYNC WITH BOOKS) ── */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-black px-6 py-5 md:px-10 md:py-6 2xl:py-10 shadow-xl relative overflow-hidden flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-white/10">
        {/* Subtle Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full -ml-24 -mb-24 blur-[80px]" />

        {/* LEFT SECTION: BRAND & ACTION */}
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl">
              <Users className="w-8 h-8 lg:w-9 lg:h-9 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl 2xl:text-4xl font-black text-white tracking-tight">Hồ sơ Bạn Đọc</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 mt-1 opacity-60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                QUẢN TRỊ THÀNH VIÊN & ĐẶC QUYỀN
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin/members/requests" className="shrink-0">
              <Button variant="outline" className="h-10 border-amber-200/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold px-4 rounded-xl text-[11px] gap-2 transition-all relative">
                <Clock className="w-4 h-4" />
                Duyệt yêu cầu
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-slate-900 animate-bounce">
                    {pendingCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/admin/members/new">
              <Button className="bg-white hover:bg-slate-50 text-slate-900 font-black px-6 py-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-[11px] gap-2 h-10">
                <Plus className="w-4 h-4 stroke-[3px]" />
                Thêm Bạn đọc mới
              </Button>
            </Link>
          </div>
        </div>

        {/* RIGHT SECTION: STATISTICS (COMPACT) */}
        <div className="relative z-10 flex flex-wrap xl:flex-nowrap items-center gap-3">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 transition-all hover:bg-white/10 min-w-[150px]">
            <div className="p-2 bg-slate-700/50 rounded-lg">
              <Users className="w-5 h-5 text-slate-200" />
            </div>
            <div>
              <p className="text-[7px] text-slate-400 uppercase font-black tracking-widest">TỔNG THÀNH VIÊN</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg lg:text-xl font-black text-white">{statsData?.data?.totalItems || 0}</span>
                <span className="text-[8px] text-slate-500 font-bold uppercase">Qty</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 transition-all hover:bg-white/10 min-w-[150px]">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <UserCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[7px] text-amber-500 uppercase font-black tracking-widest">HỆ SINH THÁI VIP</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg lg:text-xl font-black text-amber-400">{statsData?.data?.vipItems || 0}</span>
                <span className="text-[8px] text-amber-600 font-bold uppercase">Vip</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-4 pt-6">
        {/* ── FILTER ROW ── */}
        <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900" />
            <Input
              placeholder="Tìm kiếm theo tên, email, mã thẻ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 border-none bg-slate-50/50 focus:bg-white text-[11px] rounded-xl transition-all shadow-sm"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px] h-10 border-none bg-slate-50/50 font-bold text-slate-700 text-[11px] rounded-xl">
              <SelectValue placeholder="Trạng thái thẻ" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100">
               <SelectItem value="all" className="text-xs font-bold uppercase">Tất cả hội viên</SelectItem>
               <SelectItem value="active" className="text-xs font-bold uppercase text-emerald-600">✅ Đang hoạt động</SelectItem>
               <SelectItem value="expired" className="text-xs font-bold uppercase text-rose-600">❌ Đã hết hạn</SelectItem>
               <SelectItem value="inactive" className="text-xs font-bold uppercase text-slate-400">🔒 Đã khóa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── CONTENT TABLE – COMPACT ── */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
          <Table className="border-collapse">
            <TableHeader className="bg-slate-50 border-b-2 border-slate-200">
              <TableRow className="hover:bg-transparent h-11">
                <TableHead className="font-black text-slate-800 pl-6 uppercase text-[10px] tracking-wider">Hội viên & Định danh</TableHead>
                <TableHead className="font-black text-slate-800 uppercase text-[10px] tracking-wider px-4">Thông tin liên lạc</TableHead>
                <TableHead className="font-black text-slate-800 uppercase text-[10px] tracking-wider px-4">Hạng thẻ & Ví</TableHead>
                <TableHead className="text-center font-black text-slate-800 uppercase text-[10px] tracking-wider px-4 w-[120px]">Trạng thái</TableHead>
                <TableHead className="text-right font-black text-slate-800 pr-6 uppercase text-[10px] tracking-wider w-[150px]">Nghiệp vụ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                     <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Loading Member Data...</span>
                     </div>
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-32">
                     <Users className="w-16 h-16 mx-auto mb-3 text-slate-100" />
                     <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">No Members Found</span>
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((item: any) => {
                  const displayName = item.reader_name || item.name;
                  return (
                    <TableRow key={item.id} className="group hover:bg-slate-50/80 transition-all h-20">
                      <TableCell className="pl-6 py-3">
                        <div className="flex items-center gap-3 text-slate-900">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shrink-0 font-black text-xs">
                             {(displayName || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-black uppercase text-[12px] tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{displayName}</div>
                            <div className="text-[10px] font-bold text-slate-400 font-mono mt-0.5 tracking-tighter">CARD: {item.card_number || 'N/A'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 text-slate-900">
                        <div className="text-[11px] font-bold">{item.email}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{item.phone || '-'}</div>
                      </TableCell>
                      <TableCell className="px-4 text-slate-900">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-indigo-600">{item.membership_plan || 'Cơ bản'}</span>
                            <span className="text-[11px] font-bold font-mono text-emerald-600">VÍ: {Number(item.balance || 0).toLocaleString()}đ</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-center px-4">
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell className="text-right pr-6 py-2">
                        <div className="flex gap-1.5 justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-amber-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            onClick={() => {
                              setSelectedMember(item);
                              setIsUpgradeOpen(true);
                            }}
                            title="Nâng cấp VIP / Gia hạn"
                          >
                            <Crown className="w-3.5 h-3.5 fill-amber-400/20" />
                          </Button>
                          <Link href={`/admin/members/${item.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            onClick={() => handleDelete(item.id, displayName)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          
          {/* ── PAGINATION – COMPACT ── */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t-2 border-slate-200 rounded-b-2xl shadow-sm">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                Member records • Page <strong>{page}</strong> of {data.pagination.totalPages}
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline" size="sm"
                  className="h-8 px-4 rounded-lg font-black text-[10px] border-slate-200 text-slate-600 uppercase tracking-widest"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Prev
                </Button>
                <Button
                  variant="outline" size="sm"
                  className="h-8 px-4 rounded-lg font-black text-[10px] border-slate-200 text-slate-600 uppercase tracking-widest"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <MembershipUpgradeModal 
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        member={selectedMember}
      />
    </div>
  );
}
