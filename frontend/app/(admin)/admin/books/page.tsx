'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdminPublications, useDeletePublication, useAdminCollections, useAdminPublicationStats } from '@/lib/hooks/usePublications';
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
  Plus, Search, Edit, Trash2, Book, Sparkles, Smartphone, Layers,
  ChevronLeft, ChevronRight, Star, Lock, Globe, Filter,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/components/ui/utils';
import { getCleanValue } from '@/lib/utils/locale-admin';

// ─── Helpers ────────────────────────────────────────────────────────────────
// Safe stringify bất kỳ giá trị nào có thể là multilang JSON object
const getDisplayTitle = (title: any): string => getCleanValue(title, 'N/A');

function MediaBadge({ type }: { type?: string }) {
  const cfg: Record<string, { label: string; cls: string; icon: any }> = {
    Physical: { label: 'Sách in', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Book },
    Digital: { label: 'Tài liệu số', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: Smartphone },
    Hybrid: { label: 'Tích hợp', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Layers },
  };
  const c = cfg[type || 'Physical'] ?? cfg['Physical'];
  const Icon = c.icon;
  return (
    <Badge variant="outline" className={`text-[9px] h-5 font-bold gap-1 ${c.cls}`}>
      <Icon className="w-2.5 h-2.5" />{c.label}
    </Badge>
  );
}

function PolicyBadge({ policy }: { policy?: string }) {
  if (policy === 'vip') return <Badge variant="outline" className="text-[9px] h-5 font-bold bg-purple-50 text-purple-700 border-purple-200 gap-1"><Star className="w-2.5 h-2.5" />VIP</Badge>;
  if (policy === 'premium') return <Badge variant="outline" className="text-[9px] h-5 font-bold bg-amber-50 text-amber-700 border-amber-200 gap-1"><Lock className="w-2.5 h-2.5" />Premium</Badge>;
  return <Badge variant="outline" className="text-[9px] h-5 font-bold bg-slate-50 text-slate-500 border-slate-200 gap-1"><Globe className="w-2.5 h-2.5" />Cơ bản</Badge>;
}

function CoopBadge({ status }: { status?: string }) {
  return status === 'ceased_cooperation'
    ? <Badge className="text-[9px] h-5 font-bold bg-rose-500 text-white border-none">Ngưng HT</Badge>
    : <Badge className="text-[9px] h-5 font-bold bg-emerald-500 text-white border-none">Hợp tác</Badge>;
}

// ─── Component Chính ────────────────────────────────────────────────────────
function BooksContent() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mediaFilter, setMediaFilter] = useState('all');

  const initialCoop = searchParams.get('cooperation_status');
  const [coopFilter, setCoopFilter] = useState(
    initialCoop === 'ceased_cooperation' || initialCoop === 'cooperating' ? initialCoop : 'all'
  );

  const [policyFilter, setPolicyFilter] = useState('all');

  const initialCol = searchParams.get('collection_id');
  const [collectionFilter, setCollectionFilter] = useState(initialCol || 'all');

  const { data: collectionsData } = useAdminCollections();
  const collections = collectionsData?.data || [];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useAdminPublications({
    pageIndex: page,
    pageSize: 10,
    searchQuery: debouncedSearch,
    formats: (mediaFilter !== 'all') ? [mediaFilter] : undefined,
    cooperationStatus: coopFilter !== 'all' ? coopFilter : undefined,
    collectionId: collectionFilter !== 'all' ? collectionFilter : undefined,
  });

  const { data: statsData } = useAdminPublicationStats();
  const { mutate: deletePublication } = useDeletePublication();

  const pagination = data?.pagination;
  const items: any[] = data?.data ?? [];

  const handleDelete = (id: string, titleObj: any) => {
    const titleStr = getDisplayTitle(titleObj);
    if (!confirm(`Xóa ấn phẩm "${titleStr}"?\nHành động này sẽ xóa tất cả bản sao vật lý liên quan.`)) return;
    deletePublication(id, {
      onSuccess: () => toast.success('Đã xóa ấn phẩm thành công'),
      onError: (err: any) => toast.error(err.message || 'Không thể xóa'),
    });
  };

  const filteredItems = policyFilter === 'all'
    ? items
    : items.filter(i => i.access_policy === policyFilter);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="w-full pb-8 space-y-0 text-slate-900 bg-slate-50/30 min-h-screen">

      {/* ── RICH COMPACT HEADER (OPTIMIZED FOR 1440 & 1920) ── */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-violet-950 px-6 py-5 md:px-10 md:py-6 2xl:py-10 shadow-xl relative overflow-hidden flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-indigo-400/20">
        {/* Subtle Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full -ml-24 -mb-24 blur-[80px]" />

        {/* LEFT SECTION: BRAND & ACTION (COMPACT) */}
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl">
              <Book className="w-8 h-8 lg:w-9 lg:h-9 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl 2xl:text-4xl font-black text-white tracking-tight">Quản trị Ấn phẩm</h1>
              <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 mt-1 opacity-60">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                KHO NỘI DUNG SỐ & TÀI LIỆU
              </p>
            </div>
          </div>

          <div className="text-left">
            <Link href="/admin/books/new">
              <Button className="bg-white hover:bg-slate-50 text-indigo-700 font-black px-6 py-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-[11px] gap-2 h-10">
                <Plus className="w-4 h-4 stroke-[3px]" />
                Thêm mới Ấn phẩm
              </Button>
            </Link>
          </div>
        </div>

        {/* RIGHT SECTION: STATISTICS (COMPACT) */}

        <div className="relative z-10 flex flex-wrap xl:flex-nowrap items-center gap-3">
          {/* Stat 1 */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 transition-all hover:bg-white/20 min-w-[150px]">
            <div className="p-2 bg-indigo-500/30 rounded-lg">
              <Layers className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <p className="text-[7px] text-indigo-200 uppercase font-black tracking-widest">HỆ THỐNG</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg lg:text-xl font-black text-white">
                  {statsData?.data?.totalPublications || pagination?.totalItems || 0}
                </span>
                <span className="text-[8px] text-indigo-300 font-bold uppercase">Ấn phẩm</span>
              </div>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 transition-all hover:bg-white/20 min-w-[150px]">
            <div className="p-2 bg-violet-500/30 rounded-lg">
              <Book className="w-5 h-5 text-violet-100" />
            </div>
            <div>
              <p className="text-[7px] text-violet-200 uppercase font-black tracking-widest">BẢN SAO</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg lg:text-xl font-black text-white">
                  {statsData?.data?.totalCopies || 0}
                </span>
                <span className="text-[8px] text-violet-300 font-bold uppercase">Bản ghi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-4 pt-6">
        {/* ── FILTER ROW ── */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Search */}
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900" />
            <Input
              placeholder="Tìm theo nhan đề, tác giả, ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 border-none bg-slate-50/50 focus:bg-white text-[11px] rounded-xl transition-all"
            />
          </div>

          {/* Collection */}
          <Select value={collectionFilter} onValueChange={(v) => { setCollectionFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl border-none bg-slate-50/80 font-bold text-slate-700 text-[10px]">
              <SelectValue placeholder="Bộ sưu tập" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-[10px] font-bold">Tất cả bộ sưu tập</SelectItem>
              {collections.map((c: any) => (
                <SelectItem key={c.id} value={c.id.toString()} className="text-[10px]">
                  {getDisplayTitle(c.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Format */}
          <Select value={mediaFilter} onValueChange={(v) => { setMediaFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[130px] h-10 rounded-xl border-none bg-slate-50/80 font-bold text-slate-700 text-[10px]">
              <SelectValue placeholder="Loại tài liệu" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-[10px] font-bold">Tất cả loại</SelectItem>
              <SelectItem value="Physical" className="text-[10px] font-bold">📖 Sách in</SelectItem>
              <SelectItem value="Digital" className="text-[10px] font-bold">💻 Tài liệu số</SelectItem>
              <SelectItem value="Hybrid" className="text-[10px] font-bold">🔀 Tích hợp</SelectItem>
            </SelectContent>
          </Select>

          {/* Coop Status */}
          <Select value={coopFilter} onValueChange={(v) => { setCoopFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[125px] h-10 rounded-xl border-none bg-slate-50/80 font-bold text-slate-700 text-[10px]">
              <SelectValue placeholder="Hợp tác" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-[10px] font-bold">Mọi hợp tác</SelectItem>
              <SelectItem value="cooperating" className="text-[10px] font-bold text-emerald-600">Đang HT</SelectItem>
              <SelectItem value="ceased_cooperation" className="text-[10px] font-bold text-rose-600">Ngưng HT</SelectItem>
            </SelectContent>
          </Select>

          {/* Access Policy */}
          <Select value={policyFilter} onValueChange={(v) => { setPolicyFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[135px] h-10 rounded-xl border-none bg-slate-50/80 font-bold text-slate-700 text-[10px]">
              <SelectValue placeholder="Hạng thẻ TN" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-[10px] font-bold">Tất cả hạng</SelectItem>
              <SelectItem value="basic" className="text-[10px] font-bold text-slate-600">🌐 Cơ bản</SelectItem>
              <SelectItem value="premium" className="text-[10px] font-bold text-amber-600">🔒 Premium</SelectItem>
              <SelectItem value="vip" className="text-[10px] font-bold text-purple-600">⭐ VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>

      {/* ── BẢNG DỮ LIỆU – COMPACT & PRO ── */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden mb-6">
        <Table className="border-collapse">
          <TableHeader className="bg-slate-50 border-b-2 border-slate-200">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[100px] font-black text-slate-800 text-[10px] uppercase tracking-wider h-11 pl-6">Mã / ISBN</TableHead>
              <TableHead className="font-black text-slate-800 text-[10px] uppercase tracking-wider h-11 pl-6">Ấn phẩm & Tác giả</TableHead>
              <TableHead className="font-black text-slate-800 text-[10px] uppercase tracking-wider h-11 px-6">Loại hình</TableHead>
              <TableHead className="font-black text-slate-800 text-[10px] uppercase tracking-wider h-11 px-6">Quyền TT</TableHead>
              <TableHead className="text-center font-black text-slate-800 text-[10px] uppercase tracking-wider h-11 px-6">Bản sao</TableHead>
              <TableHead className="text-center font-black text-slate-800 text-[10px] uppercase tracking-wider h-11 px-6">Năm XB</TableHead>
              <TableHead className="text-right font-black text-slate-800 text-[10px] uppercase tracking-wider h-11 pr-8">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm animate-pulse">Đang tải dữ liệu...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-24">
                  <Layers className="w-14 h-14 mx-auto mb-4 text-slate-200" />
                  <p className="text-slate-400 font-medium">Không tìm thấy ấn phẩm nào</p>
                  <p className="text-slate-300 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item: any) => (
                <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors group border-slate-100">
                  <TableCell className="font-mono text-[11px] text-slate-400">
                    {item.code || item.isbn || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-14 rounded-lg bg-slate-100 flex-shrink-0 border border-slate-200 overflow-hidden shadow-sm">
                        {item.thumbnail || item.cover_image
                          ? <img src={item.thumbnail || item.cover_image} alt="" className="w-full h-full object-cover" />
                          : <Book className="w-5 h-5 m-auto text-slate-300" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1 text-sm">
                          {getDisplayTitle(item.title)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {getDisplayTitle(item.author) !== 'N/A' ? getDisplayTitle(item.author) : 'Khuyết danh'}
                          {item.publisher_name && <span className="ml-1 text-slate-300">· {getDisplayTitle(item.publisher_name)}</span>}
                        </div>
                        {item.cooperation_status === 'ceased_cooperation' && (
                          <span className="text-[9px] text-rose-500 font-bold">⚠ Ngưng hợp tác</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <MediaBadge type={item.media_type || item.format} />
                  </TableCell>
                  <TableCell>
                    <PolicyBadge policy={item.access_policy} />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600">
                      {item.copy_count ?? item.total_copies ?? item.countCopies ?? 0}
                      <span className="text-[9px] text-slate-400 font-normal">bản</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs text-slate-500 font-mono">
                    {item.publication_year || '—'}
                  </TableCell>
                  <TableCell className="text-right pr-6 py-2">
                    <div className="flex gap-1.5 justify-end">
                      <Link href={`/admin/books/${item.id}`}>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border border-slate-300 bg-white hover:bg-indigo-50 hover:border-indigo-500 hover:text-indigo-600 shadow-sm transition-all">
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 hover:border-rose-500 text-rose-400 hover:text-rose-600 shadow-sm transition-all" onClick={() => handleDelete(item.id, item.title)}>
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
        {pagination && (
          <div className="flex items-center justify-between px-6 py-5 bg-slate-100 border-t-[3px] border-slate-300">
            <p className="text-xs text-slate-500">
              Trang <strong>{pagination.currentPage}</strong> / {pagination.totalPages || 1}
              &nbsp;·&nbsp;Tổng <strong>{pagination.totalItems}</strong> ấn phẩm
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="h-8 w-8 p-0 rounded-lg">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.min(pagination.totalPages || 1, 7) }, (_, i) => i + 1).map(p => (
                <Button key={p} variant={page === p ? 'default' : 'outline'} size="sm" className={cn("h-8 w-8 p-0 rounded-lg text-xs", page === p && "bg-indigo-600")} onClick={() => setPage(p)}>{p}</Button>
              ))}
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= (pagination.totalPages || 1)} className="h-8 w-8 p-0 rounded-lg">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

// ─── Export wrapper có Suspense theo chuẩn Next.js ─────────────────────────
export default function BooksPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[400px] items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <BooksContent />
    </Suspense>
  );
}
