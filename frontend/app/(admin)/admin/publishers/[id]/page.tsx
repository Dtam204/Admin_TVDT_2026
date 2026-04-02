'use client';
import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePublisher, useUpdatePublisher, useDeletePublisher } from '@/lib/hooks/usePublishers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Building2, Mail, Phone, Globe, MapPin, Save, Trash2, Info } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function EditPublisherPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const itemId = parseInt(id);

  const { data, isLoading } = usePublisher(itemId);
  const { mutate: update, isPending: isUpdating } = useUpdatePublisher(itemId);
  const { mutate: deleteItem, isPending: isDeleting } = useDeletePublisher();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    status: 'active'
  });

  // Load data vào form
  useEffect(() => {
    if (data?.data) {
      const p = data.data;
      
      const getValue = (val: any) => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        return val.vi || val.en || Object.values(val)[0] || '';
      };

      setFormData({
        name: getValue(p.name),
        slug: p.slug || '',
        description: getValue(p.description),
        address: p.address || '',
        phone: p.phone || '',
        email: p.email || '',
        website: p.website || '',
        status: p.status || 'active'
      });
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Vui lòng nhập tên nhà xuất bản');
      return;
    }

    update(formData, {
      onSuccess: () => {
        toast.success('Cập nhật thành công!');
        router.push('/admin/publishers');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Có lỗi xảy ra');
      }
    });
  };

  const handleDelete = () => {
    if (!confirm('Bạn có chắc muốn xóa nhà xuất bản này?')) return;

    deleteItem(itemId, {
      onSuccess: () => {
        toast.success('Đã xóa thành công');
        router.push('/admin/publishers');
      }
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>;
  }

  return (
    <div className="container mx-auto p-4 lg:p-8 max-w-5xl">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/publishers">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              Hiệu chỉnh Nhà xuất bản
            </h1>
            <p className="text-slate-500 text-sm mt-1">Sửa đổi thông tin đơn vị ID #{itemId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="destructive" className="rounded-xl px-4" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="rounded-xl px-6" onClick={() => router.back()}>Quay lại</Button>
          <Button 
            className="rounded-xl px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
            onClick={handleSubmit}
            disabled={isUpdating}
          >
            {isUpdating ? 'Đang lưu...' : <><Save className="w-4 h-4 mr-2" /> Cập nhật</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-indigo-600 font-bold mb-2">
                    <Building2 className="w-5 h-5" /> Thông tin cơ bản
                 </div>
                 <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-600 font-medium ml-1">Tên Nhà xuất bản <span className="text-red-500">*</span></Label>
                      <Input 
                        placeholder="VD: Nhà xuất bản Trẻ..."
                        className="bg-slate-50 border-none rounded-2xl h-12 text-lg focus-visible:ring-indigo-500 font-semibold"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-slate-600 font-medium ml-1">Giới thiệu ngắn</Label>
                       <Textarea 
                         placeholder="..."
                         className="bg-slate-50 border-none rounded-2xl min-h-[150px] focus-visible:ring-indigo-500"
                         value={formData.description}
                         onChange={e => setFormData({ ...formData, description: e.target.value })}
                       />
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
               <div className="flex items-center gap-2 text-indigo-600 font-bold mb-2">
                  <Info className="w-5 h-5" /> Thông tin liên hệ
               </div>
               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" /> SĐT
                    </Label>
                    <Input 
                      className="bg-slate-50 border-none rounded-xl h-11"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" /> Email
                    </Label>
                    <Input 
                      className="bg-slate-50 border-none rounded-xl h-11"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-400" /> Website
                    </Label>
                    <Input 
                      className="bg-slate-50 border-none rounded-xl h-11"
                      value={formData.website}
                      onChange={e => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" /> Địa chỉ
                    </Label>
                    <Input 
                      className="bg-slate-50 border-none rounded-xl h-11"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
            <CardContent className="p-8">
              <Label className="text-indigo-100 font-medium">Trạng thái hoạt động</Label>
              <Select 
                value={formData.status} 
                onValueChange={v => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger className="bg-white/10 border-none rounded-2xl h-14 mt-3 text-white focus:ring-offset-0 focus:ring-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="active" className="py-3 px-4">Đang cộng tác (Active)</SelectItem>
                  <SelectItem value="inactive" className="py-3 px-4">Ngưng hoạt động (Inactive)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
