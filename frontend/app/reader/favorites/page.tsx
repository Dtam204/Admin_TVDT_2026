'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  ChevronLeft, 
  Trash2, 
  BookOpen,
  Heart,
  Grid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Vui lòng đăng nhập");
        router.push('/login');
        return;
      }
      const res = await fetch(`http://localhost:5000/api/reader/actions/favorites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setFavorites(json.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (e: React.MouseEvent, bookId: number) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/reader/actions/favorites/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookId })
      });
      const json = await res.json();
      if (json.success) {
        setFavorites(favorites.filter(f => f.id !== bookId));
        toast.success("Đã xóa khỏi tủ sách");
      }
    } catch (error) {
      toast.error("Lỗi khi xóa");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="font-black text-slate-900 text-lg">Tủ sách yêu thích</h1>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Grid className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-6 pb-20">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-2xl w-full" />)}
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                <Heart className="w-10 h-10" />
             </div>
             <p className="text-slate-500 font-medium">Tủ sách của bạn đang trống.</p>
             <Button onClick={() => router.push('/')} variant="outline" className="rounded-xl px-8">Khám phá ngay</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {favorites.map((book) => (
              <div 
                key={book.id} 
                className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100 group animate-in fade-in slide-in-from-bottom-2 duration-300 cursor-pointer"
                onClick={() => router.push(`/reader/books/${book.id}`)}
              >
                <div className="aspect-[3/4] relative overflow-hidden bg-slate-100">
                  {book.thumbnail ? (
                    <img 
                      src={book.thumbnail.startsWith('http') ? book.thumbnail : `http://localhost:5000${book.thumbnail}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <BookOpen className="w-10 h-10" />
                    </div>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => removeFavorite(e, book.id)}
                    className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full w-8 h-8 text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">
                    {book.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-0.5">
                    {book.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
