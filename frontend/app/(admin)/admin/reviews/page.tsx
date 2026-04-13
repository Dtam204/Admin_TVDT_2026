'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiCall } from '@/lib/api/admin/client';
import { 
  Star, MessageSquare, ShieldAlert, Trash2, Eye, EyeOff, 
  Search, Filter, Calendar, User, BookOpen, CheckCircle2, AlertTriangle,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { safeFormatDateVN } from '@/lib/date';

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // 1. Fetch Reviews
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-reviews', statusFilter, searchTerm],
    queryFn: async () => {
      const response: any = await adminApiCall(`/api/admin/library/reviews?status=${statusFilter || ''}&search=${searchTerm}`);
      const payload = response?.data?.reviews ? response.data : response;
      return {
        reviews: Array.isArray(payload?.reviews) ? payload.reviews : [],
        pagination: payload?.pagination || null,
      };
    },
  });

  const reviews = Array.isArray(data?.reviews) ? data.reviews : [];

  // 2. Mutation: Update Status (Duyệt/Ẩn)
  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => 
      adminApiCall(`/api/admin/library/reviews/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái đánh giá');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
    onError: (err: any) => toast.error(err.message || 'Lỗi khi cập nhật')
  });

  // 3. Mutation: Delete Review
  const { mutate: deleteReview } = useMutation({
    mutationFn: (id: number) => 
      adminApiCall(`/api/admin/library/reviews/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Đã xóa đánh giá thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
    onError: (err: any) => toast.error(err.message || 'Lỗi khi xóa')
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': 
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5 font-bold uppercase tracking-tight text-[10px]">
          <CheckCircle2 className="w-3 h-3" /> Hiển thị
        </Badge>;
      case 'hidden': 
        return <Badge variant="secondary" className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full flex items-center gap-1.5 font-bold uppercase tracking-tight text-[10px]">
          <EyeOff className="w-3 h-3" /> Đã ẩn
        </Badge>;
      case 'flagged': 
        return <Badge variant="destructive" className="px-3 py-1 rounded-full flex items-center gap-1.5 font-bold uppercase tracking-tight text-[10px]">
          <ShieldAlert className="w-3 h-3" /> Cảnh báo
        </Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star 
            key={s} 
            className={`w-3.5 h-3.5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-100">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-slate-900">
                Kiểm duyệt <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Đánh giá</span>
              </h1>
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Quản lý phản hồi và đánh giá từ độc giả (Admin & Editor)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            variant={statusFilter === null ? 'default' : 'outline'}
            onClick={() => setStatusFilter(null)}
            className={`rounded-2xl px-6 h-12 font-bold transition-all ${statusFilter === null ? 'bg-slate-900 shadow-xl' : 'bg-white'}`}
          >
            Tất cả
          </Button>
          <Button 
            variant={statusFilter === 'published' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('published')}
            className={`rounded-2xl px-6 h-12 font-bold transition-all ${statusFilter === 'published' ? 'bg-emerald-600 shadow-emerald-100 shadow-xl' : 'bg-white'}`}
          >
            Đang hiển thị
          </Button>
          <Button 
            variant={statusFilter === 'hidden' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('hidden')}
            className={`rounded-2xl px-6 h-12 font-bold transition-all ${statusFilter === 'hidden' ? 'bg-slate-600 shadow-xl' : 'bg-white'}`}
          >
            Đã ẩn
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl border border-white">
        <CardHeader className="p-10 border-b border-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <Filter className="w-5 h-5 text-indigo-500" /> Danh sách phản hồi
            </CardTitle>
            <CardDescription className="font-medium text-slate-400">Xem và xử lý các đánh giá mới nhất từ hội viên</CardDescription>
          </div>
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
            <Input 
              placeholder="Tìm theo tên sách hoặc hội viên..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-14 pl-12 pr-6 bg-slate-50 border-none rounded-2xl focus-visible:ring-indigo-500 font-medium shadow-inner transition-all"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-50 h-16">
                <TableHead className="pl-10 font-bold text-slate-800 uppercase text-[11px] tracking-widest">Độc giả & Sách</TableHead>
                <TableHead className="font-bold text-slate-800 uppercase text-[11px] tracking-widest">Đánh giá & Nội dung</TableHead>
                <TableHead className="font-bold text-slate-800 uppercase text-[11px] tracking-widest">Trạng thái</TableHead>
                <TableHead className="font-bold text-slate-800 uppercase text-[11px] tracking-widest">Ngày gửi</TableHead>
                <TableHead className="pr-10 font-bold text-slate-800 uppercase text-[11px] tracking-widest text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-96 text-center">
                    <div className="flex flex-col items-center gap-4 animate-pulse">
                      <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                      <p className="text-slate-400 font-bold italic">Bình tĩnh, hệ thống đang nạp dữ liệu...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-96 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-80">
                       <AlertTriangle className="w-16 h-16 stroke-rose-300" />
                       <p className="font-bold text-lg text-rose-500">
                         {(error as Error)?.message || 'Không thể tải danh sách đánh giá'}
                       </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-96 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-30">
                       <MessageSquare className="w-24 h-24 stroke-slate-200" />
                       <p className="font-black text-2xl uppercase tracking-widest text-slate-400">Không tìm thấy đánh giá nào</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((review: any) => (
                  <TableRow key={review.id} className="hover:bg-slate-50/70 border-slate-50 group transition-all duration-300">
                    <TableCell className="pl-10 py-8">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                             <User className="w-6 h-6 text-indigo-400" />
                          </div>
                          <div>
                            <div className="font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{review.member_name}</div>
                            <div className="text-[12px] text-slate-400 font-medium mb-2">{review.member_email}</div>
                            <div className="flex items-center gap-2 px-2 py-1 bg-white border border-slate-100 rounded-lg shadow-sm w-fit">
                               <BookOpen className="w-3 h-3 text-emerald-500" />
                               <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                 {review.book_title}
                               </span>
                            </div>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="max-w-[400px]">
                       <div className="space-y-2">
                          {renderStars(review.rating)}
                          <p className="text-sm text-slate-600 leading-relaxed font-medium italic break-words">
                            "{review.comment || 'Chỉ chấm điểm, không để lại bình luận.'}"
                          </p>
                       </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(review.status)}</TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2 text-slate-400 font-medium text-xs">
                          <Calendar className="w-3.5 h-3.5" />
                          {safeFormatDateVN(review.created_at)}
                       </div>
                    </TableCell>
                    <TableCell className="pr-10 text-right">
                       <div className="flex items-center justify-end gap-2 group/actions">
                          {review.status === 'hidden' ? (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => updateStatus({ id: review.id, status: 'published' })}
                              className="h-10 w-10 p-0 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm bg-white"
                              title="Hiển thị"
                            >
                              <Eye className="w-5 h-5" />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => updateStatus({ id: review.id, status: 'hidden' })}
                              className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100 hover:text-slate-600 transition-all shadow-sm bg-white"
                              title="Ẩn đánh giá"
                            >
                              <EyeOff className="w-5 h-5" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => {
                              if (confirm('Bạn có chắc chắn muốn xóa đánh giá này vĩnh viễn?')) {
                                deleteReview(review.id);
                              }
                            }}
                            className="h-10 w-10 p-0 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm bg-white"
                            title="Xóa vĩnh viễn"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stats Summary - Floating Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 mb-20">
         <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            <Sparkles className="absolute -right-4 -top-4 w-24 h-24 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
            <h4 className="text-indigo-200 font-black uppercase tracking-widest text-[10px] mb-2">Lời khuyên Quản trị</h4>
            <p className="font-bold leading-relaxed">
              Duyệt đánh giá giúp xây dựng cộng đồng văn minh. Hãy ưu tiên các đánh giá mang tính xây dựng.
            </p>
         </div>
         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl flex items-center gap-6 group hover:border-emerald-200 transition-colors">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-transform">
               <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
               <div className="text-3xl font-black text-slate-800">100%</div>
               <div className="text-slate-400 font-bold text-sm">Duyệt nhanh</div>
            </div>
         </div>
         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl flex items-center gap-6 group hover:border-amber-200 transition-colors">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-110 transition-transform">
               <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
               <div className="text-3xl font-black text-slate-800">5 Phút</div>
               <div className="text-slate-400 font-bold text-sm">Phản hồi mẫu</div>
            </div>
         </div>
      </div>
    </div>
  );
}
