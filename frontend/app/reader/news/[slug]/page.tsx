"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowLeft, 
  Share2, 
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PublicCommentList from "@/components/PublicCommentList";
import { toast } from "sonner";

interface NewsArticle {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  image_url: string;
  author: string;
  published_date: string;
  read_time: string;
  gallery_title?: string;
  gallery_images: string[];
  gallery_position?: 'top' | 'bottom';
  show_table_of_contents: boolean;
  enable_share_buttons: boolean;
  show_author_box: boolean;
}

export default function PublicNewsDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/public/news/${slug}`);
        const data = await res.json();
        if (data.success) {
          setArticle(data.data);
        } else {
          toast.error("Không tìm thấy bài viết");
          router.push("/admin/news");
        }
      } catch (error) {
        toast.error("Lỗi khi tải nội dung");
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!article) return null;

  const renderGallery = () => {
    if (!article.gallery_images || article.gallery_images.length === 0) return null;

    return (
      <div className="my-12 space-y-4">
        {article.gallery_title && (
          <h3 className="text-xl font-bold text-gray-900 border-l-4 border-blue-600 pl-4">
            {article.gallery_title}
          </h3>
        )}
        <div className="relative group overflow-hidden rounded-2xl bg-gray-100 aspect-video">
           <img 
             src={article.gallery_images[currentImageIndex]} 
             alt={`Gallery ${currentImageIndex}`}
             className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
           />
           
           {article.gallery_images.length > 1 && (
             <>
               <Button
                 variant="secondary"
                 size="icon"
                 className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                 onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? article.gallery_images.length - 1 : prev - 1))}
               >
                 <ChevronLeft className="h-6 w-6" />
               </Button>
               <Button
                 variant="secondary"
                 size="icon"
                 className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                 onClick={() => setCurrentImageIndex((prev) => (prev === article.gallery_images.length - 1 ? 0 : prev + 1))}
               >
                 <ChevronRight className="h-6 w-6" />
               </Button>
             </>
           )}
        </div>
        <div className="flex gap-2 justify-center overflow-x-auto py-2">
           {article.gallery_images.map((img, idx) => (
             <button 
               key={idx}
               onClick={() => setCurrentImageIndex(idx)}
               className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${idx === currentImageIndex ? 'border-blue-600 scale-110' : 'border-transparent opacity-60'}`}
             >
               <img src={img} className="w-full h-full object-cover" />
             </button>
           ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Article Header & Cover */}
      <header className="relative w-full h-[60vh] min-h-[400px]">
        <img 
          src={article.image_url} 
          alt={article.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <div className="max-w-4xl mx-auto space-y-6">
            <Button 
               variant="ghost" 
               className="text-white hover:bg-white/20 mb-4" 
               onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
            </Button>
            
            
            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
              {article.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-gray-200 text-sm md:text-base">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <span className="font-medium text-white">{article.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>{new Date(article.published_date).toLocaleDateString('vi-VN', { 
                  day: 'numeric', month: 'long', year: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>{article.read_time}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Article Body */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1">
            {/* Excerpt */}
            <p className="text-xl md:text-2xl font-medium text-gray-600 mb-10 leading-relaxed italic border-l-4 border-gray-200 pl-6">
              {article.excerpt}
            </p>

            {/* Content Gallery (Top) */}
            {article.gallery_position === 'top' && renderGallery()}

            {/* Main Content */}
            <div 
              className="prose prose-lg prose-blue max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-img:rounded-2xl"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Content Gallery (Bottom) */}
            {article.gallery_position === 'bottom' && renderGallery()}

            {/* Comments Section */}
            <PublicCommentList objectId={article.id} objectType="news" />
          </div>
          
          {/* Sidebar (Optional - for share/actions) */}
          {article.enable_share_buttons && (
            <aside className="lg:w-16 flex lg:flex-col gap-4 sticky top-24 h-fit">
               <Button variant="outline" size="icon" className="rounded-full h-12 w-12 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm">
                 <Share2 className="w-5 h-5" />
               </Button>
               <Button variant="outline" size="icon" className="rounded-full h-12 w-12 hover:bg-orange-50 hover:text-orange-600 transition-all shadow-sm">
                 <Bookmark className="w-5 h-5" />
               </Button>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
