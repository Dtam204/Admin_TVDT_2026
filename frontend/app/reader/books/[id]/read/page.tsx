'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { 
  ChevronLeft, 
  Settings, 
  List, 
  Bookmark, 
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { buildUrl } from '@/lib/api/base';

export default function ReadingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(100); // Giả định
  const saveTimerRef = useRef<any>(null);

  useEffect(() => {
    fetchReadingContent();
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [id]);

  const fetchReadingContent = async () => {
    try {
      const token = localStorage.getItem('token');
         const res = await fetch(buildUrl(`/api/public/publications/${id}`), {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (json.success) {
        setBook(json.data);
        // Nếu có tiến độ cũ thì set
        if (json.data.readingProgress) {
            setCurrentPage(json.data.readingProgress.last_page);
        }
      } else {
        toast.error("Không có quyền truy cập nội dung này");
        router.back();
      }
    } catch (error) {
       console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (page: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
         await fetch(buildUrl(`/api/reader/actions/progress`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookId: id,
          lastPage: page,
          progressPercent: (page / totalPages) * 100,
          isFinished: page === totalPages
        })
      });
    } catch (e) {
      console.error("Lưu tiến độ thất bại");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    
    // Debounce save progress
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveProgress(newPage), 2000);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Đang tải trình đọc...</div>;

   const parseMaybeJsonText = (value: any) => {
      if (typeof value !== 'string') return value;
      try {
         const parsed = JSON.parse(value);
         if (parsed && typeof parsed === 'object') {
            return parsed.vi || parsed.en || value;
         }
         return value;
      } catch {
         return value;
      }
   };

   const title = parseMaybeJsonText(book?.title) || 'Chưa có tiêu đề';

  return (
    <div className="h-screen bg-slate-100 flex flex-col overflow-hidden">
      {/* Top Bar Reader */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-sm z-50">
         <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
               <ChevronLeft className="w-6 h-6" />
            </Button>
            <div>
               <h2 className="text-sm font-bold line-clamp-1 max-w-[150px]">
                  {title}
               </h2>
               <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Trang {currentPage} / {totalPages}</p>
            </div>
         </div>
         <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon"><Bookmark className="w-5 h-5" /></Button>
            <Button variant="ghost" size="icon"><List className="w-5 h-5" /></Button>
            <Button variant="ghost" size="icon"><Settings className="w-5 h-5" /></Button>
         </div>
      </div>

      {/* Main Content Area (Fake Reader View) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-10 flex justify-center bg-slate-200/50">
         <div className="bg-white w-full max-w-2xl shadow-xl rounded-lg p-8 md:p-16 min-h-[120%] text-slate-800 leading-relaxed font-serif">
            {book.digital_file_url ? (
               <div className="flex flex-col items-center justify-center h-full space-y-6">
                  <div className="p-10 bg-indigo-50 rounded-full text-indigo-200">
                     <FileText className="w-20 h-20" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Trình xem PDF đang khởi tạo</h3>
                  <p className="text-slate-500 text-center max-w-xs">Tài liệu "{book.digital_file_url}" đang được tải bảo mật.</p>
                  <Button className="bg-indigo-600">Tải xuống để đọc offline</Button>
               </div>
            ) : (
               <div className="space-y-6">
                  <h3 className="text-3xl font-black mb-10 text-slate-900">Chương {Math.ceil(currentPage / 10)}</h3>
                  <p>
                     Đây là nội dung giả định của ấn phẩm. Trong thực tế, hệ thống sẽ tích hợp `react-pdf` hoặc `epub.js` để hiển thị nội dung gốc từ file `{book.digital_file_url || 'N/A'}`.
                  </p>
                  <p>
                     Tiến độ đọc của bạn hiện tại là <strong>{currentPage} / {totalPages} ({(currentPage/totalPages*100).toFixed(0)}%)</strong>.
                     Hệ thống đã tự động ghi nhận vị trí này vào Database để bạn có thể tiếp tục đọc trên thiết bị khác.
                  </p>
                  <div className="h-40 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 italic">
                     [Nội dung trang {currentPage} tiếp tục tại đây...]
                  </div>
               </div>
            )}
         </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-white border-t border-slate-200 p-4 shadow-top z-50">
         <div className="max-w-xl mx-auto space-y-4">
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-bold text-slate-400">0%</span>
               <Progress value={(currentPage / totalPages) * 100} className="h-1.5 flex-1" />
               <span className="text-[10px] font-bold text-slate-400">100%</span>
            </div>
            <div className="flex items-center justify-between">
               <Button 
                variant="outline" 
                className="rounded-xl px-6"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
               >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Trước
               </Button>
               <Button variant="ghost" size="icon" className="text-slate-400">
                  <RotateCcw className="w-4 h-4" />
               </Button>
               <Button 
                className="rounded-xl px-6 bg-slate-900 border-none"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
               >
                  Tiếp <ArrowRight className="w-4 h-4 ml-2" />
               </Button>
            </div>
         </div>
      </div>
    </div>
  );
}
