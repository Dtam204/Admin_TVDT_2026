'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, FolderTree, Save, Info, Sparkles, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAdminCollection, useUpdateCollection } from '@/lib/hooks/usePublications';
import { toast } from 'sonner';
import Link from 'next/link';
import { getCleanValue } from '@/lib/utils/locale-admin';

export default function EditCollectionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: collectionResponse, isLoading } = useAdminCollection(id);
  const { mutate: updateCollection, isPending: isUpdating } = useUpdateCollection();

  // Handle nested data from common API structure
  const collection = collectionResponse?.data || collectionResponse;

  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
    order_index: 0,
    description: ''
  });

  useEffect(() => {
    if (collection) {
      setFormData({
        name: getCleanValue(collection.name),
        is_active: collection.is_active ?? true,
        order_index: collection.order_index || 0,
        description: getCleanValue(collection.description)
      });
    }
  }, [collection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Vui lòng nhập tên bộ sưu tập');
      return;
    }

    updateCollection({ id, data: formData }, {
      onSuccess: () => {
        toast.success('Cập nhật bộ sưu tập thành công');
        // Delay nhỏ để tránh lỗi unmount và hiển thị toast
        setTimeout(() => {
          router.push('/admin/collections');
        }, 500);
      },
      onError: (err: any) => {
        toast.error(err.message || 'Có lỗi xảy ra');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/collections">
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FolderTree className="w-6 h-6 text-indigo-600" />
              Chỉnh sửa Thể loại & Bộ sưu tập
            </h1>
            <p className="text-sm text-slate-500">ID: {id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => router.back()} className="rounded-full">Hủy bỏ</Button>
           <Button onClick={handleSubmit} disabled={isUpdating} className="bg-indigo-600 hover:bg-indigo-700 rounded-full px-8 shadow-lg shadow-indigo-100">
             <Save className="w-4 h-4 mr-2" />
             Lưu thay đổi
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-bold">Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên hiển thị <span className="text-red-500">*</span></Label>
                <Input 
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-50 border-none rounded-xl h-12 focus-visible:ring-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả (Tùy chọn)</Label>
                <textarea 
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full min-h-[120px] bg-slate-50 border-none rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Giới thiệu ngắn về bộ sưu tập này..."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-2xl bg-indigo-50/50">
             <CardContent className="p-6 flex items-start gap-4">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                   <Info className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                   <h4 className="font-bold text-indigo-900 text-sm">Lưu ý về sắp xếp</h4>
                   <p className="text-xs text-indigo-700 leading-relaxed">
                     Thứ tự hiển thị (Order Index) thấp hơn sẽ được ưu tiên hiển thị trước trên ứng dụng Mobile.
                     Mặc định các bộ sưu tập mới sẽ có thứ tự là 0.
                   </p>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
           <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
             <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold">Cấu hình hiển thị</CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Trạng thái hoạt động</Label>
                      <p className="text-[10px] text-slate-400">Cho phép hiển thị trên App</p>
                   </div>
                   <Switch 
                     checked={formData.is_active}
                     onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
                   />
                </div>

                <div className="space-y-2">
                   <Label className="text-xs uppercase text-slate-400 font-bold">Thứ tự ưu tiên</Label>
                   <Input 
                      type="number"
                      value={formData.order_index}
                      onChange={e => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                      className="bg-slate-50 border-none rounded-xl h-10"
                   />
                </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-xl rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-6">
              <Sparkles className="w-8 h-8 text-white/30 mb-4" />
              <div className="space-y-2">
                <h3 className="font-bold">Thống kê nhanh</h3>
                <div className="flex items-center gap-2 text-sm text-white/80">
                   <Book className="w-4 h-4" />
                   <span>{collection?.item_count || 0} Ấn phẩm trong bộ này</span>
                </div>
                <div className="pt-4">
                   <Link href={`/admin/books?collection_id=${id}`}>
                      <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20 border-none text-white text-xs h-9">
                        Xem tất cả ấn phẩm
                      </Button>
                   </Link>
                </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
