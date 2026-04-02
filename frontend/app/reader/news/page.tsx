"use client";

import { useState, useEffect } from "react";
import { Search, Sparkles, Calendar, User, ArrowRight, Loader2, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "sonner";

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  summary: string;
  image_url: string;
  author: string;
  published_date: string;
}

export default function PublicNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiInterpreted, setAiInterpreted] = useState<any>(null);

  const fetchNews = async (query = "") => {
    try {
      setLoading(true);
      const endpoint = query 
        ? `/api/public/search/ai-news-suggest?query=${encodeURIComponent(query)}`
        : "/api/public/news";
      
      const res = await fetch(endpoint);
      const data = await res.json();
      
      if (data.success) {
        setNews(data.data);
        if (data.ai_interpreted) {
          setAiInterpreted(data.ai_interpreted);
        } else {
          setAiInterpreted(null);
        }
      }
    } catch (error) {
      toast.error("Không thể tải tin tức");
    } finally {
      setLoading(false);
      setIsAiSearching(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchNews();
      return;
    }
    setIsAiSearching(true);
    fetchNews(searchQuery);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header & Search */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Tin tức & Sự kiện
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Cập nhật những thông tin mới nhất về thư viện, học thuật và các hoạt động nổi bật.
        </p>
        
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              {isAiSearching ? (
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              ) : (
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              )}
            </div>
            <Input
              type="text"
              placeholder="Hỏi AI về tin tức... (VD: Tin tức về lập trình mới nhất)"
              className="pl-12 pr-32 py-7 bg-white shadow-xl border-gray-200 rounded-2xl text-lg focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
              type="submit"
              className="absolute right-2 top-2 bottom-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 px-6 shadow-lg shadow-blue-200"
              disabled={isAiSearching}
            >
              {isAiSearching ? "Đang phân tích..." : (
                <span className="flex items-center gap-2">
                  <Bot className="w-5 h-5" /> Tìm bằng AI
                </span>
              )}
            </Button>
          </div>
          
          {aiInterpreted && (
            <div className="mt-4 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-gray-500">
                AI đang tìm kiếm: 
                <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-700 border-blue-100">
                  {aiInterpreted.title || aiInterpreted.keywords?.join(", ")}
                </Badge>
              </span>
            </div>
          )}
        </form>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-100 animate-pulse rounded-2xl h-[400px]"></div>
          ))}
        </div>
      ) : news.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item) => (
            <Card key={item.id} className="group overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl bg-white flex flex-col">
              <div className="relative h-56 overflow-hidden">
                <img
                  src={item.image_url || "/images/placeholder-news.jpg"}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.published_date).toLocaleDateString("vi-VN")}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {item.author}
                  </span>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h2>
                
                <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>
                
                <div className="mt-auto pt-4 border-t border-gray-50">
                  <Link 
                    href={`/reader/news/${item.slug}`}
                    className="flex items-center justify-between text-blue-600 font-semibold group/link"
                  >
                    <span>Đọc tiếp</span>
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Search className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy bài viết nào</h3>
          <p className="text-gray-500">Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
          <Button 
            variant="outline" 
            className="mt-6 rounded-xl"
            onClick={() => { setSearchQuery(""); fetchNews(); }}
          >
            Xem tất cả tin tức
          </Button>
        </div>
      )}
    </div>
  );
}
