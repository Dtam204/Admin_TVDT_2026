"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Edit, Trash2, Eye, EyeOff, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { adminApiCall, AdminEndpoints } from "@/lib/api/admin";
import { getLocalizedText } from "@/lib/utils/i18n";
import { useTranslationControls } from "@/lib/hooks/useTranslationControls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type NewsStatus = "draft" | "published";
type Locale = 'vi' | 'en' | 'ja';

interface NewsItem {
  id: number;
  title: string | Record<Locale, string>;
  excerpt?: string | Record<Locale, string>;
  category: string | Record<Locale, string>;
  categoryId?: string;
  status: NewsStatus | string;
  createdAt: string;
  imageUrl?: string;
  author?: string | Record<Locale, string>;
  readTime?: string | Record<Locale, string>;
  gradient?: string;
  link?: string;
  isFeatured?: boolean;
}

interface CategoryOption {
  code: string;
  name: string | Record<Locale, string>;
  isActive: boolean;
}

const PAGE_SIZE = 10;

export default function AdminNewsPage() {
  const router = useRouter();
  
  // Use translation controls hook
  const {
    globalLocale,
  } = useTranslationControls();
  
  const [news, setNews] = useState<NewsItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<"all" | NewsStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured" | "normal">("all");
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const data = await adminApiCall<{ success: boolean; data?: NewsItem[] }>(
        AdminEndpoints.news.list,
      );
      setNews(data?.data || []);
    } catch (error: any) {
      toast.error(error?.message || "Không thể tải danh sách bài viết");
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await adminApiCall<{
        success: boolean;
        data?: { code: string; name: string; isActive: boolean }[];
      }>(AdminEndpoints.categories.list);
      setCategories(data.data || []);
    } catch (error: any) {
      // Silently fail
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    void fetchNews();
    void fetchCategories();
  }, []);

  useEffect(() => {
    // Khi thay đổi bộ lọc hoặc tìm kiếm thì quay lại trang 1
    setPage(1);
  }, [search, statusFilter, categoryFilter, featuredFilter]);

  const filteredNews = useMemo(() => {
    const searchLower = search.toLowerCase();

    return news.filter((item) => {
      // Extract string values from locale objects for search
      const titleStr = typeof item.title === 'string' ? item.title : (item.title?.vi || item.title?.en || item.title?.ja || '');
      const excerptStr = typeof item.excerpt === 'string' ? item.excerpt : (item.excerpt?.vi || item.excerpt?.en || item.excerpt?.ja || '');

      const matchesSearch =
        !searchLower ||
        titleStr.toLowerCase().includes(searchLower) ||
        excerptStr.toLowerCase().includes(searchLower);

      const matchesStatus =
        statusFilter === "all" || (item.status && item.status === statusFilter);

      const matchesCategory =
        categoryFilter === "all" ||
        item.categoryId === categoryFilter ||
        (typeof item.category === 'string' ? item.category : (item.category?.vi || item.category?.en || item.category?.ja || '')) === categoryFilter;

      const matchesFeatured =
        featuredFilter === "all"
          ? true
          : featuredFilter === "featured"
          ? !!item.isFeatured
          : !item.isFeatured;

      return matchesSearch && matchesStatus && matchesCategory && matchesFeatured;
    });
  }, [news, search, statusFilter, categoryFilter, featuredFilter]);

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
      await adminApiCall(AdminEndpoints.news.detail(id), { method: "DELETE" });
      toast.success("Đã xóa bài viết");
      fetchNews();
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi khi xóa bài viết");
      // Silently fail
    }
  };

  const toggleStatus = async (id: number, currentStatus: NewsStatus | string) => {
    try {
      const nextStatus = currentStatus === "published" ? "draft" : "published";
      await adminApiCall(AdminEndpoints.news.detail(id), {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });
      toast.success("Đã cập nhật trạng thái");
      fetchNews();
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi khi cập nhật trạng thái");
      // Silently fail
    }
  };

  return (
    <div className="space-y-6 w-full">
      <Card className="border border-gray-100 shadow-sm w-full">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-row items-center justify-between w-full gap-4 mb-1">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>
                  <span className="inline-block w-1.5 h-5 bg-gradient-to-t from-blue-500 to-indigo-400 rounded-full mr-2"></span>
                  Danh sách bài viết
                </span>
                <span className="hidden md:inline-block ml-3 px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                  Quản trị
                </span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  className="bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-600 transition-all text-base font-semibold flex items-center px-5 py-2"
                  onClick={handleCreateNew}
                >
                  <Plus className="w-5 h-5 mr-2" /> Viết bài mới
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs md:text-sm text-gray-600">
              <span className="px-3 py-1 rounded-full bg-[#F5F7FA] border border-gray-200 flex items-center gap-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" />
                  <path stroke="currentColor" d="M12 6v6l4 2" />
                </svg>
                <span>Tổng:</span>
                <span className="font-semibold text-gray-900 ml-1">{totalNews}</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 flex items-center gap-1">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                </svg>
                <span>Xuất bản:</span>
                <span className="font-semibold ml-1">{totalPublished}</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-yellow-50 border border-yellow-100 text-yellow-700 flex items-center gap-1">
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 2a1 1 0 0 1 1 1v4h6V3a1 1 0 1 1 2 0v4.382A2 2 0 0 1 18 9v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 1-1.618V3a1 1 0 0 1 1-1zM4 9v7h12V9H4zm6 3v2m0 0H8m2 0h2" />
                </svg>
                <span>Bản nháp/khác:</span>
                <span className="font-semibold ml-1">{totalDraft}</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>Nổi bật:</span>
                <span className="font-semibold ml-1">{totalFeatured}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Input
                placeholder="Tìm theo tiêu đề hoặc mô tả bài viết..."
                className="pl-9 bg-gray-50 border border-gray-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Bộ lọc
              </div>
              <div className="flex flex-wrap gap-3">
                <Select
                  value={categoryFilter}
                  onValueChange={(v) => setCategoryFilter(v)}
                  disabled={loadingCategories}
                >
                  <SelectTrigger className="w-[180px] bg-gray-50 border border-gray-200 text-sm">
                    <SelectValue placeholder="Chuyên mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả chuyên mục</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.code} value={cat.code}>
                        {typeof cat.name === "string"
                          ? cat.name
                          : (cat.name as any)?.vi || (cat.name as any)?.en || (cat.name as any)?.ja || ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={(v) =>
                    setStatusFilter(v as "all" | NewsStatus)
                  }
                >
                  <SelectTrigger className="w-[160px] bg-gray-50 border border-gray-200 text-sm">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="published">Đã xuất bản</SelectItem>
                    <SelectItem value="draft">Bản nháp</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={featuredFilter}
                  onValueChange={(v) =>
                    setFeaturedFilter(v as "all" | "featured" | "normal")
                  }
                >
                  <SelectTrigger className="w-[160px] bg-gray-50 border border-gray-200 text-sm">
                    <SelectValue placeholder="Tin nổi bật" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="featured">Chỉ tin nổi bật</SelectItem>
                    <SelectItem value="normal">Tin thường</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-hidden px-1">
            <table className="w-full table-fixed border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[13px] text-gray-600 font-semibold bg-gray-50">
                  <th className="py-3 pl-3 md:pl-5 pr-1 md:pr-2 rounded-l-xl text-left w-[44px]">
                    #
                  </th>
                  <th className="py-3 px-1 md:px-2 text-left">Tiêu đề</th>
                  <th className="py-3 px-1 md:px-2 text-left w-[140px]">Chuyên mục</th>
                  <th className="py-3 px-1 md:px-2 text-center w-[64px]">Nổi bật</th>
                  <th className="py-3 px-1 md:px-2 text-center w-[120px]">Trạng thái</th>
                  <th className="py-3 px-1 md:px-2 hidden md:table-cell text-center w-[120px]">Ngày tạo</th>
                  <th className="py-3 px-2 md:px-4 text-center rounded-r-xl w-[140px]">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedNews.length > 0 ? paginatedNews.map((item, i) => (
                  <tr
                    key={item.id}
                    className={`bg-white shadow-sm border border-gray-100 rounded-lg hover:shadow-md transition-all ${
                      item.isFeatured ? "ring-2 ring-amber-200" : ""
                    }`}
                    style={{ borderRadius: 12 }}
                  >
                    <td className="py-3 px-1 md:px-2 md:pl-5 md:pr-2 align-middle text-xs text-gray-500 w-[44px]">
                      {startIndex + i + 1}
                    </td>
                     <td className="py-3 px-1 md:px-2 align-middle overflow-hidden">
                      <div className="flex gap-2 items-start">
                        <div className="flex flex-col gap-1 min-w-0 w-full">
                          <span className="font-medium text-gray-900 flex items-center gap-1 whitespace-normal break-words break-all leading-snug min-w-0 max-w-full">
                            {typeof item.title === 'string' ? item.title : getLocalizedText(item.title, globalLocale)}
                          </span>
                          {item.excerpt ? (
                            <span className="text-xs text-gray-500 italic whitespace-normal break-words break-all min-w-0 max-w-full">
                              {(() => {
                                const excerptStr = typeof item.excerpt === 'string' ? item.excerpt : getLocalizedText(item.excerpt, globalLocale) || '';
                                return excerptStr.length > 60
                                  ? `${excerptStr.slice(0, 60)}...`
                                  : excerptStr;
                              })()}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-1 md:px-2 align-middle">
                      <Badge variant="outline" className="bg-blue-50 border-blue-100 text-blue-700 text-xs font-medium whitespace-normal break-words break-all max-w-full">
                        {typeof item.category === 'string' ? item.category : getLocalizedText(item.category, globalLocale) || "Chưa phân loại"}
                      </Badge>
                    </td>
                    <td className="py-3 px-1 md:px-2 align-middle text-center">
                      <span title={item.isFeatured ? "Nổi bật" : ""}>
                        <Star
                          className={`inline w-4 h-4 ${item.isFeatured ? "text-yellow-500 fill-yellow-200" : "text-gray-300 fill-white"}`}
                        />
                      </span>
                    </td>
                    <td className="py-3 px-1 md:px-2 align-middle text-center">
                      <Badge
                        className={`gap-1 text-xs px-2 py-1 border-0 ${item.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"}`}
                        >
                        {item.status === "published" ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                        {item.status === "published"
                          ? "Đã xuất bản"
                          : "Bản nháp"}
                      </Badge>
                    </td>
                    <td className="py-3 px-1 md:px-2 align-middle text-center hidden md:table-cell">
                      <span className="text-gray-400 text-xs">
                        {item.createdAt}
                      </span>
                    </td>
                    <td className="py-3 px-2 md:px-4 align-middle text-center">
                      <div className="flex items-center justify-center gap-1 md:gap-2 flex-wrap">
                        <Button
                          variant="secondary"
                          size="icon"
                          className={`rounded-full flex items-center justify-center shadow border h-8 w-8 md:h-9 md:w-9 ${item.status === "published"
                            ? "bg-yellow-100 border-yellow-200 text-yellow-800 hover:bg-yellow-200"
                            : "bg-green-100 border-green-200 text-green-800 hover:bg-green-200"
                          }`}
                          onClick={() => toggleStatus(item.id, item.status)}
                          title={item.status === "published" ? "Chuyển thành nháp" : "Xuất bản"}
                        >
                          {item.status === "published"
                            ? <EyeOff className="w-4 h-4" />
                            : <Eye className="w-4 h-4" />
                          }
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8 md:h-9 md:w-9 rounded-full flex items-center justify-center text-primary hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 md:h-9 md:w-9 rounded-full flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400 text-sm bg-white rounded-xl shadow">
                      {!loading
                        ? "Không tìm thấy bài viết phù hợp với điều kiện lọc hiện tại."
                        : <span>Đang tải...</span>
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {filteredNews.length > 0 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-4 text-sm text-gray-700">
                <div>
                  Hiển thị&nbsp;
                  <span className="font-semibold text-primary">
                    {startIndex + 1}-
                    {Math.min(startIndex + PAGE_SIZE, filteredNews.length)}
                  </span>
                  &nbsp;trên&nbsp;
                  <span className="font-semibold">
                    {filteredNews.length}
                  </span>
                  &nbsp;bài viết phù hợp bộ lọc
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg"
                  >
                    Trang trước
                  </Button>
                  <span>
                    <span className="font-semibold text-primary">{currentPage}</span>
                    /{totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setPage((p) => (p < totalPages ? p + 1 : p))
                    }
                    className="rounded-lg"
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

