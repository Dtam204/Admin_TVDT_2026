'use client';

import { useState, useEffect } from 'react';
import { usePublishers, useDeletePublisher } from '@/lib/hooks/usePublishers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Search, Edit, Trash2, Building2, Globe, Phone, Mail,
  ChevronLeft, ChevronRight, Book, CheckCircle2, XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const parseName = (name: any): string => {
  if (!name) return 'N/A';
  if (typeof name === 'string') {
    try { const p = JSON.parse(name); return p.vi || p.en || p.ja || name; } catch { return name; }
  }
  if (typeof name === 'object') return name.vi || name.en || name.ja || 'N/A';
  return String(name);
};

export default function PublishersPage() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = usePublishers({
    page,
    limit: 20,
    search: debouncedSearch,
    status: status === 'all' ? undefined : status,
  });

  const { mutate: deleteItem } = useDeletePublisher();
  const pagination = data?.pagination;
  const items: any[] = data?.data ?? [];

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Xóa nhà xuất bản "${name}"?\nCác ấn phẩm liên quan sẽ mất thông tin NXB.`)) return;
    deleteItem(id, {
      onSuccess: () => toast.success('Đã xóa thành công'),
      onError: (err: any) => toast.error(err.message || 'Không thể xóa'),
    });
  };

  return (
    <div className="w-full pb-8 space-y-0 text-slate-900 bg-slate-50/30 min-h-screen">
      {/* ── RICH COMPACT HEADER (SYNC WITH BOOKS & MEMBERS) ── */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black px-6 py-5 md:px-10 md:py-6 2xl:py-10 shadow-xl relative overflow-hidden flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-white/10">
        {/* Subtle Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full -ml-24 -mb-24 blur-[80px]" />

        {/* LEFT SECTION: BRAND & ACTION */}
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl">
              <Building2 className="w-8 h-8 lg:w-9 lg:h-9 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl 2xl:text-4xl font-black text-white tracking-tight">Nhà xuất bản</h1>
              <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 mt-1 opacity-60">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                HỆ THỐNG ĐỐI TÁC PHÁT HÀNH
              </p>
            </div>
          </div>

          <Link href="/admin/publishers/new">
            <Button className="bg-white hover:bg-slate-50 text-indigo-900 font-black px-6 py-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-[11px] gap-2 h-10 w-fit">
              <Plus className="w-4 h-4 stroke-[3px]" />
              Thêm nhà xuất bản mới
            </Button>
          </Link>
        </div>

        {/* RIGHT SECTION: STATISTICS (COMPACT) */}
        <div className="relative z-10 flex flex-wrap xl:flex-nowrap items-center gap-3">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 transition-all hover:bg-white/10 min-w-[150px]">
             <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Building2 className="w-5 h-5 text-indigo-300" />
             </div>
             <div>
                <p className="text-[7px] text-indigo-300 uppercase font-black tracking-widest leading-none mb-1">PARTNERS DATA</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-lg lg:text-xl font-black text-white">{pagination?.totalItems ?? items.length}</span>
                   <span className="text-[8px] text-indigo-500 font-bold uppercase">Units</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-4 pt-6">
        {/* ── BỘ LỌC ── */}
        <div className="flex flex-col lg:flex-row gap-3 group">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <Input 
              placeholder="Tìm theo tên nhà xuất bản hoặc website..."
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 border-2 border-slate-100 bg-white focus:bg-white text-[11px] rounded-xl transition-all shadow-sm"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-full lg:w-[200px] h-11 border-2 border-slate-100 bg-white rounded-xl text-[11px] font-bold">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
              <SelectItem value="all" className="text-xs font-bold uppercase">Tất cả trạng thái</SelectItem>
              <SelectItem value="active" className="text-xs font-bold uppercase text-emerald-600">✅ Đang hoạt động</SelectItem>
              <SelectItem value="inactive" className="text-xs font-bold uppercase text-slate-400">❌ Ngưng hợp tác</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── BẢNG ── */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
          <Table className="border-collapse">
            <TableHeader className="bg-slate-50 border-b-2 border-slate-200">
              <TableRow className="hover:bg-transparent h-11">
                <TableHead className="font-black text-slate-800 uppercase text-[10px] tracking-wider pl-6">Nhà xuất bản</TableHead>
                <TableHead className="font-black text-slate-800 uppercase text-[10px] tracking-wider">Website</TableHead>
                <TableHead className="font-black text-slate-800 uppercase text-[10px] tracking-wider">Kênh liên hệ</TableHead>
                <TableHead className="text-center font-black text-slate-800 uppercase text-[10px] tracking-wider">Ấn phẩm</TableHead>
                <TableHead className="text-center font-black text-slate-800 uppercase text-[10px] tracking-wider">Trạng thái</TableHead>
                <TableHead className="text-right font-black text-slate-800 uppercase pr-8 text-[10px] tracking-wider">Nghiệp vụ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                     <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Searching...</span>
                     </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-32">
                     <Building2 className="w-16 h-16 mx-auto mb-3 text-slate-100" />
                     <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">No Partners Found</span>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/80 transition-all h-20 group border-slate-50">
                    {/* Tên NXB */}
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white flex-shrink-0 font-black text-[12px] shadow-sm">
                          {(parseName(item.name) || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 uppercase text-[12px] group-hover:text-indigo-600 transition-all tracking-tight line-clamp-1">
                            {parseName(item.name)}
                          </div>
                          {item.slug && <div className="text-[9px] text-slate-400 font-bold font-mono mt-0.5">{item.slug}</div>}
                        </div>
                      </div>
                    </TableCell>

                    {/* Website */}
                    <TableCell>
                      {item.website ? (
                        <a href={item.website.startsWith('http') ? item.website : `https://${item.website}`}
                          target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                          <Globe className="w-3 h-3 text-indigo-400" />
                          <span className="truncate max-w-[140px] uppercase">{item.website.replace(/^https?:\/\//, '')}</span>
                        </a>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </TableCell>

                    {/* Liên hệ */}
                    <TableCell>
                      <div className="space-y-1">
                        {item.email && (
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                            <Mail className="w-3 h-3 text-slate-300" />
                            <span className="truncate max-w-[160px]">{item.email}</span>
                          </div>
                        )}
                        {item.phone && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-800">
                            <Phone className="w-3 h-3 text-slate-300" />
                            {item.phone}
                          </div>
                        )}
                        {!item.email && !item.phone && <span className="text-slate-300 text-xs">—</span>}
                      </div>
                    </TableCell>

                    {/* Số ấn phẩm */}
                    <TableCell className="text-center font-black">
                      <div className="text-xs text-slate-900">{item.publication_count ?? item.book_count ?? item.total_books ?? 0}</div>
                      <div className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Books</div>
                    </TableCell>

                    {/* Trạng thái */}
                    <TableCell className="text-center">
                      {item.status === 'active' ? (
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 border shadow-sm px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-400 border-slate-200 border px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter">
                          Closed
                        </Badge>
                      )}
                    </TableCell>

                    {/* Thao tác */}
                    <TableCell className="text-right pr-6">
                      <div className="flex gap-1 justify-end transition-opacity">
                        <Link href={`/admin/publishers/${item.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-50"
                          onClick={() => handleDelete(item.id, parseName(item.name))}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* ── PAGINATION ── */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t-2 border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Page <strong>{pagination.currentPage}</strong> / {pagination.totalPages}
              </p>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-8 px-4 rounded-lg font-black text-xs border-slate-200 text-slate-600"
                  disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Trước
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-4 rounded-lg font-black text-xs border-slate-200 text-slate-600"
                  disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                  Sau <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
