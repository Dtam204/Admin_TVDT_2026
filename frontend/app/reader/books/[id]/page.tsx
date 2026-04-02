'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Heart, 
  Share2, 
  ChevronLeft, 
  Star, 
  User, 
  Calendar, 
  FileText, 
  Info,
  Smartphone,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth'; // Giả định hook có sẵn

export default function BookDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    fetchBookDetail();
  }, [id]);

  const fetchBookDetail = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/public/publications/${id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (json.success) {
        setBook(json.data);
        setIsFavorited(json.data.isFavorited);
      } else {
        toast.error("Không tìm thấy ấn phẩm");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để yêu thích sách");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/reader/actions/favorites/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookId: book.id })
      });
      const json = await res.json();
      if (json.success) {
        setIsFavorited(json.isFavorited);
        toast.success(json.message);
      }
    } catch (error) {
      toast.error("Lỗi khi xử lý");
    }
  };

  if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-64 w-full" /><Skeleton className="h-10 w-3/4" /><Skeleton className="h-4 w-full" /></div>;
  if (!book) return <div className="p-20 text-center">Không tìm thấy sách.</div>;

  const title = typeof book.title === 'string' ? JSON.parse(book.title).vi : book.title?.vi || book.title;
  const description = typeof book.description === 'string' ? JSON.parse(book.description).vi : book.description?.vi || book.description;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="font-bold text-slate-900 line-clamp-1 max-w-[200px]">Chi tiết Ấn phẩm</h1>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Share2 className="w-5 h-5" />
        </Button>
      </div>

      <div className="max-w-4xl mx-auto pb-24">
        {/* Book Header Section */}
        <div className="bg-white p-6 pb-12 shadow-sm rounded-b-[40px] relative overflow-hidden">
            {/* Background Decor */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -mr-32 -mt-32" />
          
          <div className="flex flex-col items-center relative z-10">
            {/* Book Cover */}
            <div className="w-48 h-64 bg-slate-100 rounded-2xl shadow-2xl overflow-hidden mb-6 border-4 border-white">
              {book.thumbnail ? (
                <img src={book.thumbnail.startsWith('http') ? book.thumbnail : `http://localhost:5000${book.thumbnail}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-12 h-12 text-slate-300" /></div>
              )}
            </div>

            <h2 className="text-2xl font-black text-center text-slate-900 mb-2 px-4">{title}</h2>
            <p className="text-indigo-600 font-bold mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> {book.author || "Nhiều tác giả"}
            </p>

            <div className="flex items-center gap-2 mb-6">
              <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-amber-100 px-3">
                <Star className="w-3 h-3 mr-1 fill-amber-600" /> 4.9
              </Badge>
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-indigo-100 px-3">
                {book.is_digital ? 'Sách số' : 'Sách in'}
              </Badge>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 px-3">
                {book.status === 'available' ? 'Có sẵn' : 'Đã mượn'}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-8 text-center w-full max-w-sm pt-4 border-t border-slate-50">
               <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Trang</p>
                  <p className="font-bold text-slate-700">{book.pages || 'N/A'}</p>
               </div>
               <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Ngon ngữ</p>
                  <p className="font-bold text-slate-700">{book.language === 'vi' ? '🇻🇳' : '🇺🇸'}</p>
               </div>
               <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Năm</p>
                  <p className="font-bold text-slate-700">{book.publication_year || 'N/A'}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Content Tabs / Info */}
        <div className="px-6 mt-10 space-y-10">
           {/* Actions bar for Mobile App style */}
           <div className="flex gap-4">
              {book.cooperation_status === 'ceased_cooperation' ? (
                <div className="flex-1 bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-700">
                  <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-rose-900">Ấn phẩm tạm ngưng hợp tác</p>
                    <p className="text-[10px] text-rose-600">Thư viện đã tạm dừng chia sẻ nội dung này theo yêu cầu bản quyền hoặc nhà cung cấp.</p>
                  </div>
                </div>
              ) : (
                <>
                  <Button 
                    onClick={toggleFavorite}
                    variant={isFavorited ? "secondary" : "outline"} 
                    className={`flex-1 h-14 rounded-2xl shadow-sm font-bold ${isFavorited ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-white'}`}
                  >
                    <Heart className={`w-5 h-5 mr-2 ${isFavorited ? 'fill-rose-600' : ''}`} /> {isFavorited ? "Đã thích" : "Yêu thích"}
                  </Button>
                  <Button disabled className="bg-white border-slate-200 text-slate-400 h-14 px-6 rounded-2xl shadow-sm">
                    <CheckCircle2 className="w-5 h-5" />
                  </Button>
                </>
              )}
           </div>

           {/* AI Summary Card */}
           {book.ai_summary && (
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-10"><Info className="w-20 h-20" /></div>
                 <div className="relative z-10">
                    <h3 className="flex items-center gap-2 text-indigo-300 font-bold mb-4 text-sm tracking-widest uppercase">
                       <Smartphone className="w-4 h-4" /> Gemini AI Insight
                    </h3>
                    <p className="text-slate-200 leading-relaxed text-sm italic">
                       "{book.ai_summary}"
                    </p>
                 </div>
              </div>
           )}

           {/* Description */}
           <div className="space-y-4">
              <h3 className="font-black text-slate-900 text-lg">Giới thiệu nội dung</h3>
              <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                {description || "Chưa có mô tả chi tiết cho ấn phẩm này."}
              </p>
           </div>

           {/* Metadata Box */}
           <div className="bg-white rounded-3xl p-6 border border-slate-100 space-y-4 shadow-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <FileText className="w-5 h-5 text-indigo-500" /> Thông số xuất bản
              </h3>
              <div className="space-y-3">
                 <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                    <span className="text-slate-400">Mã ISBN</span>
                    <span className="font-mono font-bold text-slate-700">{book.isbn || book.code}</span>
                 </div>
                 <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                    <span className="text-slate-400">Nhà xuất bản</span>
                    <span className="font-bold text-slate-700">{book.publisher?.name || "Đang cập nhật"}</span>
                 </div>
                 <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                    <span className="text-slate-400">Quyền truy cập</span>
                    <Badge variant={book.access_policy === 'public' ? 'outline' : 'secondary'} className="rounded-md">
                       {book.access_policy === 'public' ? 'Công khai' : (book.access_policy === 'vip' ? 'Thành viên VIP' : 'Nội bộ')}
                    </Badge>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Floating Action Button for Reading */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent z-50">
         <div className="max-w-md mx-auto">
            {book.cooperation_status === 'ceased_cooperation' ? (
              <Button disabled className="w-full h-16 bg-slate-100 text-slate-400 rounded-2xl shadow-none font-bold text-lg border border-slate-200 cursor-not-allowed">
                Bản quyền ngưng hợp tác
              </Button>
            ) : book.canRead ? (
              <Button 
                onClick={() => router.push(`/reader/books/${id}/read`)} 
                className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-2xl shadow-indigo-200 font-black text-lg group"
              >
                Đọc Ngay 
                <BookOpen className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button disabled className="w-full h-16 bg-slate-200 text-slate-500 rounded-2xl shadow-none font-bold text-lg">
                <Lock className="w-5 h-5 mr-2" /> Đăng nhập để đọc
              </Button>
            )}
         </div>
      </div>
    </div>
  );
}
