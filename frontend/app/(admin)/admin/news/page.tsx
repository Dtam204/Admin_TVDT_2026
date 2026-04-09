"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Edit, Trash2, Eye, EyeOff, Star, Newspaper, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { adminApiCall, AdminEndpoints } from "@/lib/api/admin";
import { getCleanValue } from "@/lib/utils/locale-admin";
import { buildUrl } from "@/lib/api/base";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/components/ui/utils";

type NewsStatus = "draft" | "published";
// type Locale = 'vi' | 'en' | 'ja'; // Removed unused Locale type

interface NewsItem {
  id: number;
  title: string;
  excerpt?: string;
  status: NewsStatus | string;
  createdAt: string;
  imageUrl?: string;
  author?: string;
  readTime?: string;
  slug?: string;
  isFeatured?: boolean;
  commentsCount?: number;
}

function normalizeImageUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  if (url.startsWith("/")) return buildUrl(url);
  return url;
}


const PAGE_SIZE = 10;

export default function AdminNewsPage() {
  const router = useRouter();
  
  const [news, setNews] = useState<NewsItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<"all" | NewsStatus>("all");
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured" | "normal">("all");
  const [page, setPage] = useState(1);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const data = await adminApiCall<{ success: boolean; data?: NewsItem[] }>(
        AdminEndpoints.news.list,
      );
      setNews(data?.data || []);
    } catch (error: any) {
      toast.error(error?.message || "Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNews();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, featuredFilter]);

  const filteredNews = useMemo(() => {
    const searchLower = search.toLowerCase();

    return news.filter((item) => {
      const titleStr = getCleanValue(item.title);
      const excerptStr = getCleanValue(item.excerpt);

      const matchesSearch =
        !searchLower ||
        titleStr.toLowerCase().includes(searchLower) ||
        excerptStr.toLowerCase().includes(searchLower);

      const matchesStatus =
        statusFilter === "all" || (item.status && item.status === statusFilter);

      const matchesFeatured =
        featuredFilter === "all"
          ? true
          : featuredFilter === "featured"
          ? !!item.isFeatured
          : !item.isFeatured;

      return matchesSearch && matchesStatus && matchesFeatured;
    });
  }, [news, search, statusFilter, featuredFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredNews.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedNews = filteredNews.slice(startIndex, startIndex + PAGE_SIZE);

  const totalNews = news.length;
  const totalPublished = news.filter((n) => n.status === "published").length;
  const totalDraft = news.filter((n) => n.status !== "published").length;
  const totalFeatured = news.filter((n) => n.isFeatured).length;

  const handleCreateNew = () => {
    router.push("/admin/news/create");
  };

  const handleEdit = (item: NewsItem) => {
    router.push(`/admin/news/edit/${item.id}`);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
    try {
      await adminApiCall(AdminEndpoints.news.delete(id), { method: "DELETE" });
      toast.success("Đã xóa bài viết");
      fetchNews();
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi khi xóa bài viết");
    }
  };

  const toggleFeatured = async (id: number, currentFeatured: boolean) => {
    try {
      const nextFeatured = !currentFeatured;
      await adminApiCall(AdminEndpoints.news.featured(id), {
        method: "PATCH",
        body: JSON.stringify({ isFeatured: nextFeatured }),
      });
      toast.success(nextFeatured ? "Đã đặt làm tin nổi bật" : "Đã bỏ tin nổi bật");
      setNews(prev => prev.map(item => item.id === id ? { ...item, isFeatured: nextFeatured } : item));
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi khi cập nhật");
    }
  };

  const toggleStatus = async (id: number, currentStatus: NewsStatus | string) => {
    try {
      const nextStatus = currentStatus === "published" ? "draft" : "published";
      await adminApiCall(AdminEndpoints.news.status(id), {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      toast.success("Đã cập nhật trạng thái");
      setNews(prev => prev.map(item => item.id === id ? { ...item, status: nextStatus } : item));
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi khi cập nhật");
    }
  };

  return (
    <div className="w-full pb-8 space-y-0 text-slate-900 bg-slate-50/30 min-h-screen">
      {/* ── RICH COMPACT HEADER – NEWS & EVENTS ── */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-950 to-black px-6 py-5 md:px-10 md:py-6 2xl:py-10 shadow-xl relative overflow-hidden flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-white/10">
        {/* Subtle Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full -ml-24 -mb-24 blur-[80px]" />

        {/* LEFT SECTION: BRAND & ACTION */}
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl">
              <Newspaper className="w-8 h-8 lg:w-9 lg:h-9 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl 2xl:text-4xl font-black text-white tracking-tight">Tin tức & Sự kiện</h1>
              <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 mt-1 opacity-60">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                TRUYỀN THÔNG & CMS HỆ THỐNG
              </p>
            </div>
          </div>

          <Button
            className="bg-white hover:bg-slate-100 text-indigo-950 font-black px-6 py-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-[11px] gap-2 h-10 w-fit border-none"
            onClick={handleCreateNew}
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            Viết bài mới
          </Button>
        </div>

        {/* RIGHT SECTION: STATISTICS (COMPACT) */}
        <div className="relative z-10 flex flex-wrap xl:flex-nowrap items-center gap-3 text-white">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 transition-all hover:bg-white/10 min-w-[140px]">
             <div className="p-2 bg-blue-500/20 rounded-lg">
                <Newspaper className="w-5 h-5 text-blue-300" />
             </div>
             <div>
                <p className="text-[7px] text-blue-300 uppercase font-black tracking-widest leading-none mb-1">TOTAL POSTS</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-lg lg:text-xl font-black text-white">{totalNews}</span>
                   <span className="text-[8px] text-blue-500 font-bold uppercase">Items</span>
                </div>
             </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 transition-all hover:bg-white/10 min-w-[140px]">
             <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Eye className="w-5 h-5 text-emerald-300" />
             </div>
             <div>
                <p className="text-[7px] text-emerald-300 uppercase font-black tracking-widest leading-none mb-1">PUBLISHED</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-lg lg:text-xl font-black text-white">{totalPublished}</span>
                   <span className="text-[8px] text-emerald-500 font-bold uppercase">Active</span>
                </div>
             </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 transition-all hover:bg-white/10 min-w-[140px]">
             <div className="p-2 bg-amber-500/20 rounded-lg">
                <Star className="w-5 h-5 text-amber-300" />
             </div>
             <div>
                <p className="text-[7px] text-amber-300 uppercase font-black tracking-widest leading-none mb-1">FEATURED</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-lg lg:text-xl font-black text-white">{totalFeatured}</span>
                   <span className="text-[8px] text-amber-500 font-bold uppercase">Hits</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-4 pt-6">
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row gap-3 group">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <Input
              placeholder="Tìm kiếm bài viết theo tiêu đề hoặc nội dung..."
              className="pl-10 h-11 border-2 border-slate-100 bg-white focus:bg-white text-[11px] rounded-xl transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[180px] h-11 border-2 border-slate-100 bg-white rounded-xl text-[11px] font-bold">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                <SelectItem value="all" className="text-xs font-bold uppercase">Tất cả bài viết</SelectItem>
                <SelectItem value="published" className="text-xs font-bold uppercase text-emerald-600">✅ Đã xuất bản</SelectItem>
                <SelectItem value="draft" className="text-xs font-bold uppercase text-slate-400">📝 Bản nháp</SelectItem>
              </SelectContent>
            </Select>
            <Select value={featuredFilter} onValueChange={(v) => setFeaturedFilter(v as any)}>
              <SelectTrigger className="w-[180px] h-11 border-2 border-slate-100 bg-white rounded-xl text-[11px] font-bold">
                <SelectValue placeholder="Tin nổi bật" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                <SelectItem value="all" className="text-xs font-bold uppercase">Tất cả loại bài</SelectItem>
                <SelectItem value="featured" className="text-xs font-bold uppercase text-amber-600">⭐ Chỉ tin nổi bật</SelectItem>
                <SelectItem value="normal" className="text-xs font-bold uppercase">📄 Tin thường</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50 border-b-2 border-slate-200">
              <tr className="h-11">
                <th className="px-6 font-black text-slate-800 uppercase text-[10px] tracking-wider w-[50px]">#</th>
                <th className="px-4 font-black text-slate-800 uppercase text-[10px] tracking-wider text-left">Tiêu đề bài viết</th>
                <th className="px-4 font-black text-slate-800 uppercase text-[10px] tracking-wider text-center w-[80px]">Nổi bật</th>
                <th className="px-4 font-black text-slate-800 uppercase text-[10px] tracking-wider text-center w-[100px]">Tương tác</th>
                <th className="px-4 font-black text-slate-800 uppercase text-[10px] tracking-wider text-center w-[120px]">Trạng thái</th>
                <th className="px-4 font-black text-slate-800 uppercase text-[10px] tracking-wider text-center w-[120px]">Ngày tạo</th>
                <th className="pr-6 font-black text-slate-800 uppercase text-[10px] tracking-wider text-right w-[150px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedNews.length > 0 ? (
                paginatedNews.map((item, i) => (
                <tr key={item.id} className="group hover:bg-slate-50/80 transition-all h-20 border-slate-100">
                  <td className="px-6 text-xs text-slate-400 font-bold font-mono">
                    {startIndex + i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-4">
                      {item.imageUrl && (
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform bg-slate-100">
                          <img src={normalizeImageUrl(item.imageUrl)} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-black text-slate-800 uppercase text-[12px] group-hover:text-indigo-600 transition-colors tracking-tight line-clamp-1">
                          {getCleanValue(item.title)}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 mt-1 italic font-medium max-w-[400px]">
                          {getCleanValue(item.excerpt)}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all">
                           <Badge className="bg-slate-100 text-slate-500 rounded px-1.5 py-0 text-[8px] font-bold uppercase">{getCleanValue(item.author) || 'ADMIN'}</Badge>
                           <span className="text-[9px] text-slate-400 font-mono">/ {item.slug}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      onClick={() => toggleFeatured(item.id, !!item.isFeatured)}
                      className={cn(
                        "p-2 rounded-full transition-all",
                        item.isFeatured ? "bg-amber-50 text-amber-500 shadow-sm shadow-amber-200" : "text-slate-200 hover:text-slate-400"
                      )}
                    >
                      <Star className={cn("w-4 h-4", item.isFeatured && "fill-current")} />
                    </button>
                  </td>
                  <td className="text-center">
                    <div 
                      className="cursor-pointer group/stats"
                      onClick={() => router.push(`/admin/comments?objectId=${item.id}&objectType=news`)}
                    >
                      <div className="text-[11px] font-black text-slate-800 group-hover/stats:text-indigo-600 transition-colors uppercase">{item.commentsCount || 0}</div>
                      <div className="text-[8px] text-slate-400 uppercase font-black tracking-widest leading-none">REVIEWS</div>
                    </div>
                  </td>
                  <td className="text-center">
                    <button
                      onClick={() => toggleStatus(item.id, item.status)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border transition-all",
                        item.status === "published" 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm" 
                        : "bg-slate-100 text-slate-400 border-slate-200"
                      )}
                    >
                      {item.status === "published" ? "Live" : "Draft"}
                    </button>
                  </td>
                  <td className="text-center">
                    <div className="text-[10px] text-slate-500 font-bold font-mono uppercase truncate">
                      {item.createdAt ? item.createdAt.split(' ')[0] : '---'}
                    </div>
                  </td>
                  <td className="pr-6 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => handleEdit(item)}
                        className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-32 text-center">
                    <Newspaper className="w-16 h-16 mx-auto mb-3 text-slate-100" />
                    <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">No Articles Found</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {filteredNews.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t-2 border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Showing <strong>{startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, filteredNews.length)}</strong> of {filteredNews.length} articles
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="outline" size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-4 rounded-lg font-black text-[10px] border-slate-200 text-slate-600 uppercase tracking-widest"
                >
                  Prev
                </Button>
                <div className="flex items-center px-4 bg-white border-2 border-slate-100 rounded-lg text-xs font-black text-indigo-600">
                  {currentPage} / {totalPages}
                </div>
                <Button
                  variant="outline" size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                  className="h-8 px-4 rounded-lg font-black text-[10px] border-slate-200 text-slate-600 uppercase tracking-widest"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
