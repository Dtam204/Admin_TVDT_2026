'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiCall } from '@/lib/api/admin/client';
import { useUploadImage } from '@/lib/hooks/usePublications';
import { 
  User, Save, Globe, Link as LinkIcon, Facebook, Twitter, Github, 
  Sparkles, Info, Image as ImageIcon, Award, GraduationCap,
  History, MapPin, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { LocaleInput } from './LocaleInput';

interface AuthorFormProps {
  initialData?: any;
  isNew?: boolean;
  id?: string;
}

export function AuthorForm({ initialData, isNew = false, id }: AuthorFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate: uploadImage, isPending: isUploading } = useUploadImage();

  const [formData, setFormData] = useState({
    name: { vi: '', en: '', ja: '' },
    slug: '',
    pseudonyms: { vi: '', en: '', ja: '' },
    professional_title: '',
    gender: 'other',
    bio: { vi: '', en: '', ja: '' },
    avatar: '',
    cover_image: '',
    birth_year: '',
    death_year: '',
    nationality: '',
    birth_place: '',
    education: { vi: '', en: '', ja: '' },
    awards: { vi: '', en: '', ja: '' },
    career_highlights: { vi: '', en: '', ja: '' },
    website: '',
    social_links: { facebook: '', twitter: '', github: '', linkedin: '', wikipedia: '', google_scholar: '' },
    featured: false,
    status: 'active'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData,
        ...initialData,
        name: initialData.name || { vi: '', en: '', ja: '' },
        pseudonyms: initialData.pseudonyms || { vi: '', en: '', ja: '' },
        bio: initialData.bio || { vi: '', en: '', ja: '' },
        education: initialData.education || { vi: '', en: '', ja: '' },
        awards: initialData.awards || { vi: '', en: '', ja: '' },
        career_highlights: initialData.career_highlights || { vi: '', en: '', ja: '' },
        social_links: { 
          facebook: initialData.social_links?.facebook || '',
          twitter: initialData.social_links?.twitter || '',
          github: initialData.social_links?.github || '',
          linkedin: initialData.social_links?.linkedin || '',
          wikipedia: initialData.social_links?.wikipedia || '',
          google_scholar: initialData.social_links?.google_scholar || ''
        },
        professional_title: initialData.professional_title || '',
        gender: initialData.gender || 'other',
        avatar: initialData.avatar || '',
        cover_image: initialData.cover_image || '',
        nationality: initialData.nationality || '',
        birth_place: initialData.birth_place || '',
        website: initialData.website || '',
        birth_year: initialData.birth_year ? String(initialData.birth_year) : '',
        death_year: initialData.death_year ? String(initialData.death_year) : '',
      });
    }
  }, [initialData]);

  const mutation = useMutation({
    mutationFn: (data: any) => 
      adminApiCall(isNew ? '/api/admin/authors' : `/api/admin/authors/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      toast.success(isNew ? 'Đã tạo tác giả mới' : 'Cập nhật tác giả thành công');
      router.push('/admin/authors');
    },
    onError: (err: any) => toast.error(err.message || 'Có lỗi xảy ra')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.vi && !formData.name.en) {
      toast.error('Vui lòng nhập ít nhất tên Tiếng Việt hoặc Tiếng Anh');
      return;
    }
    
    const payload = {
      ...formData,
      birth_year: formData.birth_year ? parseInt(formData.birth_year) : null,
      death_year: formData.death_year ? parseInt(formData.death_year) : null
    };
    mutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4 sticky top-0 z-50 bg-slate-50/80 backdrop-blur-md py-4 border-b border-slate-200 -mx-6 px-6 mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          <User className="w-6 h-6 text-blue-600" />
          {isNew ? 'Thêm Tác giả Mới' : `Chỉnh sửa: ${formData.name.vi || formData.name.en || 'Tác giả'}`}
        </h2>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl px-6">Hủy</Button>
          <Button type="submit" disabled={mutation.isPending} className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8 shadow-lg shadow-blue-200">
            <Save className="w-4 h-4 mr-2" />
            Lưu dữ liệu
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid grid-cols-4 w-full bg-slate-100 p-1 rounded-2xl h-14">
              <TabsTrigger value="basic" className="rounded-xl gap-2 font-medium"><Info className="w-4 h-4" /> Cơ bản</TabsTrigger>
              <TabsTrigger value="bio" className="rounded-xl gap-2 font-medium"><History className="w-4 h-4" /> Tiểu sử</TabsTrigger>
              <TabsTrigger value="achievements" className="rounded-xl gap-2 font-medium"><Award className="w-4 h-4" /> Thành tựu</TabsTrigger>
              <TabsTrigger value="social" className="rounded-xl gap-2 font-medium"><LinkIcon className="w-4 h-4" /> Kết nối</TabsTrigger>
            </TabsList>

            {/* Tab 1: Thông tin cơ bản */}
            <TabsContent value="basic" className="space-y-6 mt-6">
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                   <CardTitle className="text-lg font-bold flex items-center gap-2">
                     <User className="w-5 h-5 text-blue-500" /> Định danh Tác giả
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <LocaleInput 
                    label="Tên chính thức"
                    value={formData.name}
                    onChange={v => setFormData({...formData, name: v})}
                    placeholder="Nhập họ tên thật..."
                  />
                  
                  <LocaleInput 
                    label="Bút danh (Nếu có)"
                    value={formData.pseudonyms}
                    onChange={v => setFormData({...formData, pseudonyms: v})}
                    placeholder="Các tên gọi khác..."
                  />

                  <div className="grid md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Học hàm / Học vị</Label>
                      <Input 
                        value={formData.professional_title || ""}
                        onChange={e => setFormData({...formData, professional_title: e.target.value})}
                        className="h-12 bg-slate-50 border-none rounded-xl"
                        placeholder="VD: Giáo sư, Tiến sĩ..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Giới tính</Label>
                      <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
                        <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="male">Nam (Male)</SelectItem>
                          <SelectItem value="female">Nữ (Female)</SelectItem>
                          <SelectItem value="other">Khác / Chưa rõ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-8 space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-700">
                  <MapPin className="w-5 h-5 text-emerald-500" /> Thông tin nhân học
                </h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Quốc tịch</Label>
                      <Input 
                        value={formData.nationality || ""}
                        onChange={e => setFormData({...formData, nationality: e.target.value})}
                        placeholder="VD: Việt Nam, Pháp..."
                        className="bg-slate-50 border-none rounded-xl h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quê quán / Nơi sinh</Label>
                      <Input 
                        value={formData.birth_place || ""}
                        onChange={e => setFormData({...formData, birth_place: e.target.value})}
                        className="bg-slate-50 border-none rounded-xl h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Năm sinh</Label>
                      <Input 
                        type="number"
                        value={formData.birth_year}
                        onChange={e => setFormData({...formData, birth_year: e.target.value})}
                        className="bg-slate-50 border-none rounded-xl h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Năm mất (Để trống nếu còn sống)</Label>
                      <Input 
                        type="number"
                        value={formData.death_year}
                        onChange={e => setFormData({...formData, death_year: e.target.value})}
                        className="bg-slate-50 border-none rounded-xl h-11 text-rose-600"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Tab 2: Tiểu sử */}
            <TabsContent value="bio" className="mt-6">
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-8 space-y-8">
                <LocaleInput 
                  label="Tiểu sử & Sự nghiệp chi tiết"
                  multiline
                  value={formData.bio}
                  onChange={v => setFormData({...formData, bio: v})}
                  placeholder="Viết về cuộc đời, phong cách sáng tác..."
                />

                <div className="pt-6 border-t border-slate-100">
                  <LocaleInput 
                    label="Quá trình đào tạo / Học vấn"
                    multiline
                    value={formData.education}
                    onChange={v => setFormData({...formData, education: v})}
                    placeholder="Các trường đã học, văn bằng..."
                  />
                </div>
              </Card>
            </TabsContent>

            {/* Tab 3: Thành tựu */}
            <TabsContent value="achievements" className="mt-6">
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-8 space-y-8">
                <LocaleInput 
                  label="Giải thưởng & Vinh danh"
                  multiline
                  value={formData.awards}
                  onChange={v => setFormData({...formData, awards: v})}
                  placeholder="Giải Nobel, Giải Nhà nước..."
                />

                <div className="pt-6 border-t border-slate-100">
                  <LocaleInput 
                    label="Các mốc sự nghiệp quan trọng"
                    multiline
                    value={formData.career_highlights}
                    onChange={v => setFormData({...formData, career_highlights: v})}
                    placeholder="Những dấu ấn lịch sử..."
                  />
                </div>
              </Card>
            </TabsContent>

            {/* Tab 4: Kết nối */}
            <TabsContent value="social" className="mt-6">
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500" /> Website chính thức</Label>
                    <Input value={formData.website || ""} onChange={e => setFormData({...formData, website: e.target.value})} className="bg-slate-50 border-none rounded-xl h-11" placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-blue-800"><Search className="w-4 h-4" /> Wikipedia</Label>
                    <Input value={formData.social_links.wikipedia} onChange={e => setFormData({...formData, social_links: {...formData.social_links, wikipedia: e.target.value}})} className="bg-slate-50 border-none rounded-xl h-11" placeholder="Link Wikipedia..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-blue-600"><Facebook className="w-4 h-4" /> Facebook</Label>
                    <Input value={formData.social_links.facebook} onChange={e => setFormData({...formData, social_links: {...formData.social_links, facebook: e.target.value}})} className="bg-slate-50 border-none rounded-xl h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sky-500"><Twitter className="w-4 h-4" /> Twitter / X</Label>
                    <Input value={formData.social_links.twitter} onChange={e => setFormData({...formData, social_links: {...formData.social_links, twitter: e.target.value}})} className="bg-slate-50 border-none rounded-xl h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-blue-700"><LinkIcon className="w-4 h-4" /> LinkedIn</Label>
                    <Input value={formData.social_links.linkedin} onChange={e => setFormData({...formData, social_links: {...formData.social_links, linkedin: e.target.value}})} className="bg-slate-50 border-none rounded-xl h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-emerald-600"><GraduationCap className="w-4 h-4" /> Google Scholar</Label>
                    <Input value={formData.social_links.google_scholar} onChange={e => setFormData({...formData, social_links: {...formData.social_links, google_scholar: e.target.value}})} className="bg-slate-50 border-none rounded-xl h-11" />
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-800 text-white p-6">
                 <CardTitle className="text-sm font-bold flex items-center gap-2">
                   <ImageIcon className="w-4 h-4" /> Hình ảnh & Truyền thông
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <Label className="text-xs font-bold uppercase text-slate-400 text-center block">Ảnh chân dung</Label>
                  <div className="w-40 h-40 rounded-full mx-auto border-4 border-slate-50 bg-slate-100 shadow-inner flex flex-col items-center justify-center text-slate-400 relative overflow-hidden group">
                     {formData.avatar ? (
                       <img src={formData.avatar.startsWith('http') ? formData.avatar : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000'}${formData.avatar}`} className="w-full h-full object-cover" />
                     ) : (
                       <User className="w-12 h-12 opacity-20" />
                     )}
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button type="button" variant="ghost" className="text-white hover:text-white" onClick={() => document.getElementById('avatar-upload')?.click()} disabled={isUploading}>
                           {isUploading ? 'Đang tải...' : 'Thay đổi'}
                        </Button>
                     </div>
                  </div>
                  <input 
                    type="file" 
                    id="avatar-upload" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        uploadImage(file, {
                          onSuccess: (res: any) => {
                            const url = res.data?.url || res.url || res;
                            setFormData({ ...formData, avatar: url });
                            toast.success('Đã tải ảnh chân dung lên');
                          }
                        });
                      }
                    }}
                  />
                  <Input value={formData.avatar || ""} onChange={e => setFormData({...formData, avatar: e.target.value})} className="h-9 text-[10px] text-center bg-slate-50 border-dashed" placeholder="URL hoặc đường dẫn ảnh..." />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <Label className="text-xs font-bold uppercase text-slate-400 text-center block">Banner trang cá nhân</Label>
                  <div className="w-full aspect-[2/1] rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden relative group">
                    {formData.cover_image ? (
                       <img src={formData.cover_image.startsWith('http') ? formData.cover_image : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000'}${formData.cover_image}`} className="w-full h-full object-cover" />
                     ) : (
                       <ImageIcon className="w-8 h-8 opacity-20" />
                     )}
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button type="button" variant="ghost" className="text-white hover:text-white" onClick={() => document.getElementById('cover-upload')?.click()} disabled={isUploading}>
                           {isUploading ? 'Đang tải...' : 'Thay đổi'}
                        </Button>
                     </div>
                  </div>
                  <input 
                    type="file" 
                    id="cover-upload" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        uploadImage(file, {
                          onSuccess: (res: any) => {
                            const url = res.data?.url || res.url || res;
                            setFormData({ ...formData, cover_image: url });
                            toast.success('Đã tải ảnh bìa lên');
                          }
                        });
                      }
                    }}
                  />
                  <Input value={formData.cover_image || ""} onChange={e => setFormData({...formData, cover_image: e.target.value})} className="h-9 text-[10px] text-center bg-slate-50 border-dashed" placeholder="URL hoặc đường dẫn ảnh bìa banner..." />
                </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                   <Label className="text-base font-bold text-slate-700">Tác giả tiêu biểu</Label>
                   <p className="text-[10px] text-slate-400 italic">Đưa tác giả vào sảnh danh vọng</p>
                </div>
                <Switch checked={formData.featured} onCheckedChange={v => setFormData({...formData, featured: v})} />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Label className="text-base font-bold text-slate-700">Trạng thái phát hành</Label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger className="w-32 rounded-xl bg-slate-50 border-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Tạm ngưng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
           </Card>

           <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-8 relative overflow-hidden">
              <Sparkles className="absolute -top-4 -right-4 w-24 h-24 opacity-20 rotate-12" />
              <div className="relative z-10 space-y-4">
                 <h3 className="font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5" /> Trợ lý AI
                 </h3>
                 <p className="text-xs text-blue-50 leading-relaxed font-medium">
                    Hệ thống AI sẽ sử dụng các thông tin này để phân tích chuyên sâu về phong cách viết và lịch sử của tác giả, giúp người đọc có trải nghiệm khám phá tốt hơn.
                 </p>
              </div>
           </Card>
        </div>
      </div>
    </form>
  );
}
