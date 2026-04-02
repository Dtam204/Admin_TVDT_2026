'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FolderTree, Save, Info, Sparkles, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { adminApiCall } from '@/lib/api/admin/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NewCollectionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order_index: 0,
    is_active: true
  });

  const { mutate: createCollection, isPending: isCreating } = useMutation({
    mutationFn: async (data: any) => {
      return adminApiCall('/api/admin/collections', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast.success('Đã tạo bộ sưu tập mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      router.push('/admin/collections');
    },
    onError: (err: any) => toast.error(err.message || 'Có lỗi xảy ra khi tạo bộ sưu tập')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Vui lòng nhập tên bộ sưu tập');
      return;
    }
    createCollection(formData);
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link href="/admin/collections">
            <Button variant="outline" size="icon" className="rounded-xl border-slate-100 hover:bg-slate-50 transition-all shadow-sm">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-indigo-200 shadow-lg">
                <FolderTree className="w-6 h-6" />
              </div>
              Tạo Thể loại & Bộ sưu tập mới
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Phân loại ấn phẩm chuyên nghiệp và khoa học</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="ghost" onClick={() => router.back()} className="rounded-xl font-semibold text-slate-500">Hủy bỏ</Button>
           <Button 
            onClick={handleSubmit} 
            disabled={isCreating} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-10 h-12 font-bold shadow-xl shadow-indigo-100 transition-all active:scale-95"
           >
             {isCreating ? 'Đang lưu...' : (
               <>
                 <Save className="w-4 h-4 mr-2" />
                 Tạo ngay
               </>
             )}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 p-8">
              <CardTitle className="text-lg font-bold text-slate-800">Thông tin cơ bản</CardTitle>
              <CardDescription className="text-slate-400">Tên hiển thị và mô tả giới thiệu về bộ sưu tập</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-bold text-slate-700 ml-1">Tên bộ sưu tập <span className="text-rose-500">*</span></Label>
                <Input 
                  id="name"
                  placeholder="VD: Sách Giáo Khoa, Truyện Ngụ Ngôn, Công Nghệ..."
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-50 border-none rounded-2xl h-14 focus-visible:ring-indigo-500 font-bold text-slate-900 px-6 text-lg"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-sm font-bold text-slate-700 ml-1">Mô tả (Tùy chọn)</Label>
                <Textarea 
                  id="description"
                  placeholder="Giới thiệu sơ qua mục đích hoặc nội dung của bộ sưu tập này để người dùng dễ nhận biết..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-[160px] bg-slate-50 border-none rounded-2xl p-6 focus-visible:ring-indigo-500 text-base text-slate-600 leading-relaxed resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-3xl bg-indigo-50/50 border border-indigo-100 overflow-hidden">
             <CardContent className="p-8 flex items-start gap-6">
                <div className="p-4 bg-white rounded-2xl text-indigo-600 shadow-sm border border-indigo-50">
                   <Info className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                   <h4 className="font-extrabold text-indigo-900 text-lg">Lưu ý về sắp xếp</h4>
                   <p className="text-sm text-indigo-700 leading-relaxed font-medium">
                     Thứ tự hiển thị (Order Index) thấp hơn sẽ được ưu tiên hiển thị trước trên ứng dụng Mobile.
                     Mặc định các bộ sưu tập mới sẽ có thứ tự là 0. Bạn có thể thay đổi số này để tổ chức lại trang chủ.
                   </p>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-8">
           <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
             <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 p-6">
                <CardTitle className="text-base font-bold text-slate-800">Cấu hình hiển thị</CardTitle>
             </CardHeader>
             <CardContent className="p-8 space-y-8">
                <div className="flex items-center justify-between bg-slate-50 p-5 rounded-2xl border border-slate-100">
                   <div className="space-y-1">
                      <Label className="text-sm font-bold text-slate-800">Trạng thái hoạt động</Label>
                      <p className="text-[11px] text-slate-500 font-medium">Cho phép hiển thị trên App</p>
                   </div>
                   <Switch 
                     checked={formData.is_active}
                     onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
                     className="data-[state=checked]:bg-indigo-600"
                   />
                </div>

                <div className="space-y-3">
                   <Label className="text-xs uppercase text-slate-400 font-extrabold tracking-widest ml-1">Thứ tự ưu tiên (Order Index)</Label>
                   <Input 
                      type="number"
                      value={formData.order_index}
                      onChange={e => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                      className="bg-slate-50 border-none rounded-2xl h-14 font-bold text-indigo-600 px-6 text-lg text-center"
                   />
                </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-2xl rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-8 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
              <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-indigo-400/20 rounded-full blur-xl" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-extrabold text-xl">Gợi ý hệ thống</h3>
                  <p className="text-indigo-50/80 text-sm leading-relaxed font-medium">
                    Hãy đặt tên ngắn gọn và súc tích để tối ưu hóa không gian hiển thị trên màn hình nhỏ. 
                    Mô tả nên chứa từ khóa về nội dung bên trong.
                  </p>
                  <div className="pt-4 flex items-center gap-3 text-sm font-bold text-white/90">
                     <Book className="w-4 h-4 text-indigo-300" />
                     <span>Sẽ hiển thị dạng danh sách ngang</span>
                  </div>
                </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
