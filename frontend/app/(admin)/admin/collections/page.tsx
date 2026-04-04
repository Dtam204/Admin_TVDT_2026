'use client';

import { useState } from 'react';
import {
  Plus, Search, MoreVertical, Edit2, Trash2,
  FolderTree, Book, Info, BarChart3, Layers, Eye, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAdminCollections } from '@/lib/hooks/usePublications';
import { adminApiCall } from '@/lib/api/admin/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDashboardStats } from '@/lib/hooks/useDashboard';
import { cn } from '@/components/ui/utils';
import { getCleanValue } from '@/lib/utils/locale-admin';

export default function CollectionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: collections, isLoading } = useAdminCollections();
  const { data: realStats } = useDashboardStats();
  const [searchQuery, setSearchQuery] = useState('');

  const { mutate: deleteCollection } = useMutation({
    mutationFn: async (id: string) =>
      adminApiCall(`/api/admin/collections/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Đã xóa bộ sưu tập');
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const filteredCollections = collections?.data?.filter((c: any) =>
    getCleanValue(c.name).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full pb-8 space-y-0 text-slate-900 bg-slate-50/30 min-h-screen">
      {/* ── RICH COMPACT HEADER – NO MARGIN HACK NEEDED ── */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-950 to-black px-6 py-5 md:px-10 md:py-6 2xl:py-10 shadow-xl relative overflow-hidden flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-white/10">
        {/* Subtle Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full -ml-24 -mb-24 blur-[80px]" />

        {/* LEFT SECTION: BRAND & ACTION */}
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl">
              <FolderTree className="w-8 h-8 lg:w-9 lg:h-9 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl 2xl:text-4xl font-black text-white tracking-tight">Thể loại & Bộ sưu tập</h1>
              <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 mt-1 opacity-60">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                PHÂN LOẠI & TỔ CHỨC HỆ THỐNG
              </p>
            </div>
          </div>

          <Link href="/admin/collections/new">
            <Button className="bg-white hover:bg-slate-50 text-indigo-900 font-black px-6 py-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-[11px] gap-2 h-10 w-fit">
              <Plus className="w-4 h-4 stroke-[3px]" />
              Thêm bộ sưu tập mới
            </Button>
          </Link>
        </div>

        {/* RIGHT SECTION: STATISTICS (COMPACT) */}
        <div className="relative z-10 flex flex-wrap xl:flex-nowrap items-center gap-3">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 transition-all hover:bg-white/10 min-w-[150px]">
             <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Layers className="w-5 h-5 text-indigo-300" />
             </div>
             <div>
                <p className="text-[7px] text-indigo-300 uppercase font-black tracking-widest leading-none mb-1">CATEGORIES</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-lg lg:text-xl font-black text-white">{collections?.data?.length || 0}</span>
                   <span className="text-[8px] text-indigo-500 font-bold uppercase">Nhóm</span>
                </div>
             </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 transition-all hover:bg-white/10 min-w-[150px]">
             <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Book className="w-5 h-5 text-emerald-300" />
             </div>
             <div>
                <p className="text-[7px] text-emerald-300 uppercase font-black tracking-widest leading-none mb-1">DATA NODES</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-lg lg:text-xl font-black text-white">{realStats?.totalBooks || 0}</span>
                   <span className="text-[8px] text-emerald-500 font-bold uppercase">Units</span>
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
              placeholder="Tìm kiếm Thể loại/Bộ sưu tập theo tên hoặc mô tả..."
              className="pl-10 h-11 border-2 border-slate-100 bg-white focus:bg-white text-[11px] rounded-xl transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
          <Table className="border-collapse">
            <TableHeader className="bg-slate-50 border-b-2 border-slate-200">
              <TableRow className="hover:bg-transparent h-11">
                <TableHead className="px-8 w-[400px] font-black text-slate-800 uppercase text-[10px] tracking-wider">Tên bộ sưu tập</TableHead>
                <TableHead className="text-center font-black text-slate-800 uppercase text-[10px] tracking-wider">Số ấn phẩm</TableHead>
                <TableHead className="text-center font-black text-slate-800 uppercase text-[10px] tracking-wider">Trạng thái</TableHead>
                <TableHead className="text-right font-black text-slate-800 pr-8 uppercase text-[10px] tracking-wider">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20">
                     <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Scanning Repository...</span>
                     </div>
                  </TableCell>
                </TableRow>
              ) : filteredCollections?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-32">
                     <Layers className="w-16 h-16 mx-auto mb-3 text-slate-100" />
                     <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">No Items Found</span>
                  </TableCell>
                </TableRow>
              ) : filteredCollections?.map((item: any) => (
                <TableRow key={item.id} className="group hover:bg-slate-50/80 transition-all h-20 border-slate-100">
                  <TableCell className="px-8 font-medium">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110 border-2 border-indigo-100/50 shadow-sm">
                        <FolderTree className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-slate-900 font-black uppercase text-[12px] group-hover:text-indigo-600 transition-colors tracking-tight">
                          {getCleanValue(item.name)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">
                          UID: {String(item.id).slice(0, 8)}
                        </div>
                        {item.description && (
                          <div className="text-[10px] text-slate-400 line-clamp-1 max-w-[300px] mt-1 italic font-medium">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex flex-col items-center">
                       <span className="text-sm font-black text-slate-900">{item.item_count || 0}</span>
                       <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Books</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {item.is_active ? (
                      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 border shadow-sm px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-50 text-rose-600 border-rose-200 border px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter">
                        Locked
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex justify-end gap-1">
                        <Link href={`/admin/collections/${item.id}`}>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                              <Edit2 className="w-3.5 h-3.5" />
                           </Button>
                        </Link>
                        <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-lg">
                                 <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl shadow-2xl border-slate-100">
                              <Link href={`/admin/books?collection_id=${item.id}`}>
                                 <DropdownMenuItem className="gap-3 py-2.5 px-3 cursor-pointer rounded-xl font-bold text-[10px] uppercase tracking-wider text-slate-600 hover:text-indigo-600">
                                    <Book className="w-4 h-4 text-emerald-500" /> Xem ấn phẩm
                                 </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem
                                 className="gap-3 py-2.5 px-3 text-rose-600 cursor-pointer rounded-xl font-bold text-[10px] uppercase tracking-wider focus:bg-rose-50 focus:text-rose-600"
                                 onClick={() => {
                                    if (confirm(`Xóa bộ sưu tập "${getCleanValue(item.name)}"?`)) {
                                       deleteCollection(item.id);
                                    }
                                 }}
                              >
                                 <Trash2 className="w-4 h-4" /> Xóa kho lưu trữ
                              </DropdownMenuItem>
                           </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Info Card */}
        <div className="bg-indigo-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp className="w-32 h-32" />
           </div>
           <div className="flex items-start gap-5 relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white flex-shrink-0 backdrop-blur-sm border border-white/10">
                 <Info className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                 <h4 className="font-extrabold text-white text-lg tracking-tight uppercase">Tối ưu phân loại nghiệp vụ</h4>
                 <p className="text-sm text-indigo-50/80 leading-relaxed font-bold italic">
                    Phân loại bộ sưu tập giúp tăng khả năng khám phá của bạn đọc trên nền tảng di động. Nhấn &quot;Xem ấn phẩm&quot; để quản lý ngay các tài liệu thuộc bộ sưu tập này.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
