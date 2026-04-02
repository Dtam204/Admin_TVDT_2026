'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiCall } from '@/lib/api/admin/client';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, User, Sparkles, Globe, Calendar, CheckCircle2, XCircle, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/components/ui/utils';

export default function AuthorsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['authors', { page, search }],
    queryFn: () => adminApiCall(`/api/admin/authors?page=${page}&limit=10&search=${search}`),
  });

  const items = data?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApiCall(`/api/admin/authors/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      toast.success('Đã xóa tác giả thành công');
    },
    onError: (err: any) => toast.error(err.message || 'Lỗi khi xóa tác giả')
  });

  const getDisplayName = (name: any) => {
    if (!name) return 'N/A';
    if (typeof name === 'string') return name;
    return name.vi || name.en || Object.values(name)[0] || 'N/A';
  };

  const handleDelete = (id: string, name: any) => {
    if (confirm(`Bạn có chắc muốn xóa tác giả "${getDisplayName(name)}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="w-full pb-8 space-y-0 text-slate-900 bg-slate-50/30 min-h-screen">
      {/* ── RICH COMPACT HEADER (SYNC WITH BOOKS & MEMBERS) ── */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-black px-6 py-5 md:px-10 md:py-6 2xl:py-10 shadow-xl relative overflow-hidden flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-white/10">
        {/* Subtle Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full -ml-24 -mb-24 blur-[80px]" />

        {/* LEFT SECTION: BRAND & ACTION */}
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl">
              <User className="w-8 h-8 lg:w-9 lg:h-9 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl 2xl:text-4xl font-black text-white tracking-tight">Quản lý Tác giả</h1>
              <p className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 mt-1 opacity-60">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                DATABASE DANH NHÂN & TÁC GIẢ
              </p>
            </div>
          </div>

          <Link href="/admin/authors/new">
            <Button className="bg-white hover:bg-blue-50 text-indigo-900 font-black px-6 py-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-[11px] gap-2 h-10 w-fit">
              <Plus className="w-4 h-4 stroke-[3px]" />
              Thêm tác giả mới
            </Button>
          </Link>
        </div>

        {/* RIGHT SECTION: STATISTICS (COMPACT) */}
        <div className="relative z-10 flex flex-wrap xl:flex-nowrap items-center gap-3">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 transition-all hover:bg-white/10 min-w-[150px]">
             <div className="p-2 bg-blue-500/20 rounded-lg">
                <LayoutDashboard className="w-5 h-5 text-blue-300" />
             </div>
             <div>
                <p className="text-[7px] text-blue-300 uppercase font-black tracking-widest leading-none mb-1">TỔNG QUAN DỮ LIỆU</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-lg lg:text-xl font-black text-white">{data?.pagination?.totalItems || items.length}</span>
                   <span className="text-[8px] text-blue-500 font-bold uppercase">Nhân vật</span>
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
              placeholder="Tìm theo tên tác giả, quốc tịch hoặc bút danh..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 border-2 border-slate-100 bg-white focus:bg-white text-[11px] rounded-xl transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
          <Table className="border-collapse">
            <TableHeader className="bg-slate-50 border-b-2 border-slate-200">
              <TableRow className="hover:bg-transparent h-11">
                <TableHead className="w-[80px] font-black text-slate-800 pl-6 uppercase text-[10px] tracking-wider">Avatar</TableHead>
                <TableHead className="font-black text-slate-800 uppercase text-[10px] tracking-wider">Thông tin tác giả</TableHead>
                <TableHead className="font-black text-slate-800 uppercase text-[10px] tracking-wider">Tiểu sử tóm lược</TableHead>
                <TableHead className="text-center font-black text-slate-800 uppercase text-[10px] tracking-wider">Niên đại</TableHead>
                <TableHead className="text-center font-black text-slate-800 uppercase text-[10px] tracking-wider">Tài nguyên</TableHead>
                <TableHead className="font-black text-slate-800 uppercase text-[10px] tracking-wider">Trạng thái</TableHead>
                <TableHead className="text-right font-black text-slate-800 pr-8 uppercase text-[10px] tracking-wider">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                     <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Searching...</span>
                     </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-32">
                     <User className="w-16 h-16 mx-auto mb-3 text-slate-100" />
                     <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">No Authors Found</span>
                  </TableCell>
                </TableRow>
              ) : items.map((author: any) => (
                <TableRow key={author.id} className="hover:bg-slate-50/80 transition-all h-16 group">
                  <TableCell className="pl-6">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-sm transition-transform group-hover:scale-110">
                      {author.avatar ? (
                        <img src={author.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50 font-black text-xs">
                          {(getDisplayName(author.name) || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-900 uppercase text-[12px] tracking-tight group-hover:text-blue-600 transition-colors">{getDisplayName(author.name)}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium italic mt-0.5">
                      <Globe className="w-2.5 h-2.5" /> {typeof author.nationality === 'string' ? author.nationality : (author.nationality?.vi || author.nationality?.en || 'Chưa rõ')}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[250px]">
                    <p className="text-[11px] text-slate-500 font-medium line-clamp-1 italic leading-relaxed">
                       {typeof author.bio === 'string' ? author.bio : (author.bio?.vi || author.bio?.en || 'Chưa cập nhật tiểu sử...')}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 border border-slate-200">
                      <Calendar className="w-3 h-3 text-blue-500" />
                      {author.birth_year || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-black">
                    <div className="text-xs text-slate-900">{author.total_books}</div>
                    <div className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Files</div>
                  </TableCell>
                  <TableCell>
                    {author.status === 'active' ? (
                      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 border shadow-sm px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-400 border-slate-200 border px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter">
                        Disabled
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                     <div className="flex justify-end gap-1">
                        <Link href={`/admin/authors/${author.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                             <Edit className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(author.id, author.name)}
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                           <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                     </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-t-2 border-slate-200">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                 Page <strong>{page}</strong> of {data.pagination.totalPages}
               </p>
               <div className="flex items-center gap-1.5">
                  {Array.from({ length: Math.min(5, data.pagination.totalPages) }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button 
                        key={i} 
                        variant={page === pageNum ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          "w-8 h-8 p-0 rounded-lg font-black text-xs transition-all",
                          page === pageNum ? "bg-slate-900 border-slate-900 shadow-md" : "border-slate-200 text-slate-600"
                        )}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
