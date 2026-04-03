'use client';

import { useRouter } from 'next/navigation';
import { 
  useCreatePublication, 
  useAdminCollections, 
  useSummarize, 
  useUploadPdf, 
  useUploadImage,
  useAdminStorageLocations
} from '@/lib/hooks/usePublications';
import { useAuthorsSelect, usePublishersSelect } from '@/lib/hooks/useBooks';
import { useState } from 'react';
import { usePublishers } from '@/lib/hooks/usePublishers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Save, Sparkles, BookOpen, Layers,
  Smartphone, Barcode, Plus, Trash2, Info, Image, Hash, Library, Building, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { MultiAuthorSelect } from '@/components/admin/MultiAuthorSelect';

export default function NewBookPage() {
  const router = useRouter();
  const { mutate: createPublication, isPending } = useCreatePublication();
  const { mutate: summarize, isPending: isSummarizing } = useSummarize();
  const { mutate: uploadPdf, isPending: isUploading } = useUploadPdf();
  const { mutate: uploadImage, isPending: isUploadingImage } = useUploadImage();

  const { data: collections } = useAdminCollections();
  const { data: authors } = useAuthorsSelect();
  const { data: publishersData } = usePublishers({ limit: 100 });
  const publishers = publishersData?.data || [];
  const { data: storageLocationsRes } = useAdminStorageLocations();
  const storageLocations = storageLocationsRes?.data || [];

  const getDisplayValue = (val: any) => {
    if (!val) return 'N/A';
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return parsed.vi || parsed.en || Object.values(parsed)[0] || val;
      } catch {
        return val;
      }
    }
    if (typeof val === 'object') {
      return val.vi || val.en || Object.values(val)[0] || 'N/A';
    }
    return String(val);
  };

  const [digitalMode, setDigitalMode] = useState<'url' | 'pdf' | 'text'>('pdf');

  // Integrated Form State
  const [formData, setFormData] = useState({
    publication: {
      code: '',
      title: '',
      publisher_id: '',
      collection_id: '',
      author_ids: [] as number[],
      description: '',
      thumbnail: '',
      publicationYear: new Date().getFullYear(),
      language: 'vi',
      pageCount: '',
      is_digital: false,
      digital_file_url: '',
      isbdContent: '',
      aiSummary: '',
      dominantColor: '#4f46e5',
      metadata: {} as any,
      status: 'available',
      edition: '',
      volume: '',
      dimensions: '',
      keywords: '',
      digitalContent: { segments: [] } as any,
      toc: [] as any[],
      access_policy: 'basic',
      cooperation_status: 'cooperating',
      media_type: 'Physical'
    },
    copies: [
      { storage_location_id: '', barcode: '', copy_number: '01', price: 0, condition: 'good' }
    ]
  });

  const handleCopyChange = (index: number, field: string, value: any) => {
    const newCopies = [...formData.copies];
    newCopies[index] = { ...newCopies[index], [field]: value };
    setFormData({ ...formData, copies: newCopies });
  };

  const addCopy = () => {
    const nextIndex = formData.copies.length + 1;
    const baseCode = formData.publication.code || 'NEW-PUB';
    const autoBarcode = `${baseCode}-${nextIndex.toString().padStart(2, '0')}`;
    
    setFormData({
      ...formData,
      copies: [...formData.copies, { 
        storage_location_id: '',
        barcode: autoBarcode, 
        copy_number: nextIndex.toString().padStart(2, '0'), 
        price: 0,
        condition: 'good'
      }]
    });
    toast.info(`${autoBarcode}`);
  };

  const removeCopy = (index: number) => {
    setFormData({
      ...formData,
      copies: formData.copies.filter((_, i) => i !== index)
    });
  };

  const handleAISummarize = () => {
    if (!formData.publication.description) {
      toast.error("Vui lòng nhập mô tả trước khi yêu cầu AI tóm tắt");
      return;
    }
    summarize(formData.publication.description, {
      onSuccess: (res: any) => {
        setFormData({
          ...formData,
          publication: { ...formData.publication, aiSummary: res.data }
        });
        toast.success("AI đã hoàn thành tóm tắt!");
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      publication: {
        ...formData.publication,
        title: { vi: formData.publication.title },
        description: { vi: formData.publication.description },
        keywords: Array.isArray(formData.publication.keywords) ? formData.publication.keywords : (formData.publication.keywords as string).split(',').map(k => k.trim()),
        toc: formData.publication.toc || [],
        access_policy: formData.publication.access_policy || 'basic',
        digital_content: {
          ...formData.publication.digitalContent,
          type: formData.publication.metadata?.fullText ? 'text_paginated' : (formData.publication.digital_file_url ? 'pdf' : null),
          full_text_raw: formData.publication.metadata?.fullText
        },
        metadata: {
          ...formData.publication.metadata,
          full_text_raw: formData.publication.metadata?.fullText // Đồng bộ cả 2 field
        }
      }
    };
    createPublication(submissionData, {
      onSuccess: () => {
        toast.success('Hệ thống đã lưu Ấn phẩm và các Bản sao thành công!');
        router.push('/admin/books');
      },
      onError: (err: any) => toast.error(err.message)
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 -m-6 p-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Link href="/admin/books">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
          </Link>
          <div className="h-8 w-[1px] bg-slate-200 mx-2" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Thêm Ấn phẩm mới
            </h1>
            <p className="text-xs text-slate-500 font-medium">Khởi tạo dữ liệu cho hệ thống thư viện số</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/books">
            <Button variant="outline" className="rounded-full border-slate-200 text-slate-600">
              Hủy bỏ (Lưu nháp)
            </Button>
          </Link>
          <Button onClick={handleSubmit} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 px-8 rounded-full shadow-lg shadow-indigo-100">
            <Save className="w-4 h-4 mr-2" />
            {isPending ? 'Đang tạo...' : 'Xuất bản Ấn phẩm'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* CỘT TRÁI: FORM NHẬP LIỆU (7/12) */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="bg-white p-1 rounded-xl border border-slate-100 mb-4 shadow-sm w-max">
              <TabsTrigger value="basic" className="rounded-lg px-6">Thông tin chính</TabsTrigger>
              <TabsTrigger value="specs" className="rounded-lg px-6">Thông số chi tiết</TabsTrigger>
              <TabsTrigger value="operations" className="rounded-lg px-6">Nghiệp vụ</TabsTrigger>
              <TabsTrigger value="copies" className="rounded-lg px-6">Bản sao ({formData.copies.length})</TabsTrigger>
              <TabsTrigger value="toc" className="rounded-lg px-6 font-bold text-indigo-600">Mục lục</TabsTrigger>
              <TabsTrigger value="digital" className="rounded-lg px-6">Digital Content</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-0">
              <Card className="border-none shadow-sm rounded-2xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-medium flex items-center gap-2">
                      <Hash className="w-4 h-4 text-slate-400" /> Mã ấn phẩm <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      placeholder="VD: 978-604..."
                      className="bg-slate-50 border-none rounded-xl h-12 focus-visible:ring-indigo-500 transition-all"
                      value={formData.publication.code}
                      onChange={(e) => setFormData({
                        ...formData,
                        publication: { ...formData.publication, code: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-medium flex items-center gap-2">
                      <Library className="w-4 h-4 text-slate-400" /> Bộ sưu tập / Loại
                    </Label>
                    <Select 
                      value={formData.publication.collection_id} 
                      onValueChange={v => setFormData({...formData, publication: {...formData.publication, collection_id: v}})}
                    >
                      <SelectTrigger className="bg-slate-50 border-none rounded-xl h-12 focus:ring-indigo-500 font-medium">
                        <SelectValue placeholder="Chọn Bộ sưu tập" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl">
                        {collections?.data?.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-indigo-600 font-bold flex items-center gap-2">
                      <Layers className="w-4 h-4" /> Loại hình tài liệu
                    </Label>
                    <Select 
                      value={formData.publication.media_type || 'Physical'} 
                      onValueChange={v => setFormData({...formData, publication: {...formData.publication, media_type: v}})}
                    >
                      <SelectTrigger className="bg-indigo-50/50 border-indigo-100 rounded-xl h-12 focus:ring-indigo-500 font-bold text-indigo-700">
                        <SelectValue placeholder="Chọn loại hình" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl">
                        <SelectItem value="Physical">Sách in (Physical)</SelectItem>
                        <SelectItem value="Digital">Tài liệu số (Digital)</SelectItem>
                        <SelectItem value="Hybrid">Tích hợp (Số & In)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-600 font-medium flex items-center gap-2">
                        <Building className="w-4 h-4 text-slate-400" /> Nhà xuất bản
                      </Label>
                      <Link href="/admin/publishers/new" target="_blank" className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1">
                        Thêm mới <ExternalLink className="w-2 h-2" />
                      </Link>
                    </div>
                    <Select 
                      value={formData.publication.publisher_id}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        publication: { ...formData.publication, publisher_id: value }
                      })}
                    >
                      <SelectTrigger className="bg-slate-50 border-none rounded-xl h-12 focus:ring-indigo-500">
                        <SelectValue placeholder="Chọn nhà xuất bản" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl">
                        {publishers.map((p: any) => (
                          <SelectItem key={p.id} value={p.id.toString()}>{getDisplayValue(p.name)}</SelectItem>
                        ))}
                        {publishers.length === 0 && (
                          <div className="p-2 text-center text-xs text-slate-400">Chưa có dữ liệu</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-500">Nhan đề chính</Label>
                      <Input 
                        placeholder="Nhập tên sách/ấn phẩm..."
                        className="bg-slate-50 border-none rounded-xl h-11 font-bold text-lg focus-visible:ring-indigo-500" 
                        value={formData.publication.title} 
                        onChange={e => setFormData({...formData, publication: {...formData.publication, title: e.target.value}})} 
                      />
                    </div>
                 </div>
                 <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-500">Danh sách Tác giả</Label>
                    <MultiAuthorSelect 
                      selectedIds={formData.publication.author_ids || []}
                      onChange={(ids) => setFormData({
                        ...formData,
                        publication: { ...formData.publication, author_ids: ids }
                      })}
                    />
                  </div>
                    <div className="space-y-2">
                      <Label className="text-slate-500">Ghi chú nhanh</Label>
                      <Input 
                        placeholder="VD: Tài liệu nội bộ..."
                        className="bg-slate-50 border-none rounded-xl h-11 italic text-xs text-slate-400" 
                        readOnly
                        value="Dữ liệu sẽ được phân loại theo Bộ sưu tập"
                      />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-slate-500">Mô tả giới thiệu</Label>
                    <Textarea 
                      placeholder="Viết vài dòng giới thiệu về ấn phẩm này..."
                      className="min-h-[150px] bg-slate-50 border-none rounded-2xl p-4 focus-visible:ring-indigo-500" 
                      value={formData.publication.description} 
                      onChange={e => setFormData({...formData, publication: {...formData.publication, description: e.target.value}})} 
                    />
                 </div>
              </Card>
            </TabsContent>

            <TabsContent value="operations" className="mt-0">
               <Card className="border-none shadow-sm rounded-2xl p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                         <Label className="text-slate-500">Chuỗi ISBD</Label>
                         <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-600 border-blue-100">Library Standard</Badge>
                      </div>
                      <Textarea 
                        placeholder=". - H. : Trẻ, 2023. - 350 tr. ; 21 cm"
                        className="min-h-[120px] bg-slate-50 border-none rounded-xl font-mono text-sm p-4"
                        value={formData.publication.isbdContent} 
                        onChange={e => setFormData({...formData, publication: {...formData.publication, isbdContent: e.target.value}})} 
                      />
                      <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-0">
                        <Sparkles className="w-3 h-3 mr-1" /> Tự động tạo bằng AI
                      </Button>
                    </div>
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <Label className="text-slate-500">Năm xuất bản</Label>
                          <Input type="number" placeholder="2024" className="bg-slate-50 border-none rounded-xl h-11" value={formData.publication.publicationYear} onChange={e => setFormData({...formData, publication: {...formData.publication, publicationYear: parseInt(e.target.value)}})} />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-slate-500">Số trang</Label>
                          <Input placeholder="350 trang" className="bg-slate-50 border-none rounded-xl h-11" value={formData.publication.pageCount} onChange={e => setFormData({...formData, publication: {...formData.publication, pageCount: e.target.value}})} />
                       </div>
                    </div>
                  </div>
               </Card>
            </TabsContent>

            <TabsContent value="copies" className="mt-0">
              <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                 <div className="flex items-center justify-between p-6 bg-slate-50/50 border-b border-slate-100">
                    <div>
                       <CardTitle className="text-slate-700 text-sm font-bold flex items-center gap-2">
                        <Barcode className="w-4 h-4 text-indigo-600" />
                        Quản lý Bản sao
                      </CardTitle>
                      <CardDescription className="text-[10px] mt-1">
                        Mỗi cuốn sách vật lý cần một Barcode riêng
                        &nbsp;•&nbsp;
                        <span className="text-indigo-600 font-bold">{formData.copies.length} bản sao</span> sẽ được nhập kho
                      </CardDescription>
                    </div>
                    <Button onClick={addCopy} variant="outline" size="sm" className="rounded-full bg-white shadow-sm hover:bg-slate-50">
                      <Plus className="w-3 h-3 mr-1"/>Thêm bản sao
                    </Button>
                 </div>
                 <Table>
                    <TableHeader><TableRow className="border-slate-50 bg-slate-50/30">
                      <TableHead className="px-6 text-[10px] uppercase tracking-wider w-[180px]">Barcode *</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider">Vị trí kho</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider w-20 text-center">Số hiệu</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider w-28 text-right pr-4">Giá (VNĐ)</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider w-32 text-center">Tình trạng</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {formData.copies.map((copy: any, idx: number) => (
                        <TableRow key={idx} className="border-slate-50 hover:bg-slate-50/50 group">
                          <TableCell className="px-6">
                            <Input
                              className="border-none bg-transparent h-8 focus-visible:ring-0 font-mono text-sm placeholder:text-slate-300"
                              placeholder="VD: SACH-001-01"
                              value={copy.barcode}
                              onChange={e => handleCopyChange(idx, 'barcode', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={copy.storage_location_id} 
                              onValueChange={v => handleCopyChange(idx, 'storage_location_id', v)}
                            >
                              <SelectTrigger className="border-none bg-transparent h-8 focus:ring-0 text-sm p-0">
                                <SelectValue placeholder="Chọn kệ" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-none shadow-2xl">
                                {storageLocations.map((loc: any) => (
                                  <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
                                ))}
                                {storageLocations.length === 0 && (
                                  <SelectItem value="none" disabled>Không có dữ liệu</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              className="border-none bg-transparent h-8 focus-visible:ring-0 text-center font-mono text-sm w-16 mx-auto"
                              value={copy.copy_number}
                              onChange={e => handleCopyChange(idx, 'copy_number', e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="text-right pr-4">
                            <Input
                              type="number"
                              className="border-none bg-transparent h-8 focus-visible:ring-0 text-right font-mono text-sm"
                              placeholder="0"
                              value={copy.price || ''}
                              onChange={e => handleCopyChange(idx, 'price', parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <select
                              className="text-[10px] border border-slate-100 rounded-lg px-2 py-1 bg-slate-50 text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                              value={copy.condition || 'good'}
                              onChange={e => handleCopyChange(idx, 'condition', e.target.value)}
                            >
                              <option value="new">Mới</option>
                              <option value="good">Đạt yêu cầu</option>
                              <option value="fair">Bình thường</option>
                              <option value="poor">Xuống cấp</option>
                            </select>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removeCopy(idx)} className="text-slate-200 hover:text-rose-500 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-3.5 h-3.5"/>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {formData.copies.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-400">
                          <Barcode className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          Nhấn “Thêm bản sao” để khai báo bản in vật lý
                        </TableCell></TableRow>
                      )}
                    </TableBody>
                 </Table>
              </Card>
            </TabsContent>

            <TabsContent value="specs" className="mt-0">
              <Card className="border-none shadow-sm rounded-2xl p-6 space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-500">Lần xuất bản (Edition)</Label>
                    <Input className="bg-slate-50 border-none rounded-xl" placeholder="VD: Tái bản lần 1" value={formData.publication.edition} onChange={e => setFormData({...formData, publication: {...formData.publication, edition: e.target.value}})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-500">Tập (Volume)</Label>
                    <Input className="bg-slate-50 border-none rounded-xl" placeholder="VD: Tập 1" value={formData.publication.volume} onChange={e => setFormData({...formData, publication: {...formData.publication, volume: e.target.value}})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-500">Kích thước (Dimensions)</Label>
                    <Input className="bg-slate-50 border-none rounded-xl" placeholder="VD: 14x20cm" value={formData.publication.dimensions} onChange={e => setFormData({...formData, publication: {...formData.publication, dimensions: e.target.value}})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-500">Từ khóa (Keywords - cách nhau bằng dấu phẩy)</Label>
                  <Input className="bg-slate-50 border-none rounded-xl" placeholder="công nghệ, lập trình, java..." value={Array.isArray(formData.publication.keywords) ? formData.publication.keywords.join(', ') : formData.publication.keywords} onChange={e => setFormData({...formData, publication: {...formData.publication, keywords: e.target.value}})} />
                </div>
                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                   <div className="space-y-2">
                       <Label className="text-slate-500 font-bold">Chính sách Truy cập (Hạng thẻ)</Label>
                       <Select value={formData.publication.access_policy || 'basic'} onValueChange={v => setFormData({...formData, publication: {...formData.publication, access_policy: v}})}>
                         <SelectTrigger className="bg-slate-50 border-none rounded-xl h-12"><SelectValue placeholder="Chọn hạng thẻ yêu cầu" /></SelectTrigger>
                         <SelectContent className="rounded-xl">
                            <SelectItem value="basic">Tài khoản Cơ bản (Basic - Mọi thành viên)</SelectItem>
                            <SelectItem value="premium">Tài khoản Premium (Trả phí)</SelectItem>
                            <SelectItem value="vip">Tài khoản VIP (Đặc quyền tối đa)</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                   <div className="space-y-2">
                      <Label className="text-indigo-600 font-bold flex items-center gap-2">
                         Trạng thái Hợp tác (Bản quyền)
                      </Label>
                      <Select 
                        value={formData.publication.cooperation_status} 
                        onValueChange={v => setFormData({...formData, publication: {...formData.publication, cooperation_status: v}})}
                      >
                        <SelectTrigger className="bg-slate-50 border-none rounded-xl h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="cooperating">Đang hợp tác (Hiển thị công khai)</SelectItem>
                          <SelectItem value="ceased_cooperation">Ngưng hợp tác (Ẩn khỏi danh sách)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-400">Ấn phẩm ngưng hợp tác sẽ tự động ẩn khỏi giao diện người đọc.</p>
                   </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="toc" className="mt-0">
               <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-6 bg-slate-50/50 border-b border-slate-100">
                    <div>
                      <CardTitle className="text-slate-700 text-sm font-bold flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        Thiết lập Mục lục sớm
                      </CardTitle>
                      <p className="text-[10px] text-slate-400 mt-1">AI có thể hỗ trợ trích xuất mục lục sau khi bạn tải PDF lên</p>
                    </div>
                    <div className="flex gap-2">
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-indigo-600 hover:bg-indigo-50 rounded-full h-8 px-4"
                        onClick={() => {
                          toast.info("AI đang phân tích cấu trúc...");
                          setTimeout(() => {
                             toast.success("Đã gợi ý mục lục mẫu!");
                             setFormData({...formData, publication: {...formData.publication, toc: [
                               { title: "Chương 1: Mở đầu", page: 1 },
                               { title: "Chương 2: Nội dung chính", page: 15 }
                             ]}});
                          }, 1000);
                        }}
                      >
                        <Sparkles className="w-3 h-3 mr-1" /> AI Draft
                      </Button>
                      <Button 
                        onClick={() => {
                          const newToc = [...(formData.publication.toc || [])];
                          newToc.push({ title: '', page: 1 });
                          setFormData({...formData, publication: {...formData.publication, toc: newToc}});
                        }} 
                        variant="outline" 
                        size="sm" 
                        className="rounded-full bg-white shadow-sm h-8"
                      >
                        <Plus className="w-3 h-3 mr-1"/> Thêm mục
                      </Button>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-50 bg-slate-50/30">
                        <TableHead className="px-6 text-[10px] uppercase tracking-wider">Tiêu đề</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-wider w-32 px-2 text-center">Trang</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.publication.toc?.map((item: any, idx: number) => (
                        <TableRow key={idx} className="border-slate-50 hover:bg-slate-100/50 group">
                          <TableCell className="px-6 py-2">
                            <Input 
                              className="border-none bg-transparent h-9 focus-visible:ring-0 font-medium text-slate-700" 
                              placeholder="VD: Chương 1..."
                              value={item.title} 
                              onChange={e => {
                                const newToc = [...formData.publication.toc];
                                newToc[idx].title = e.target.value;
                                setFormData({...formData, publication: {...formData.publication, toc: newToc}});
                              }} 
                            />
                          </TableCell>
                          <TableCell className="px-2 py-2 text-center">
                            <Input 
                              className="border-none bg-slate-100 h-8 w-16 text-center rounded-lg font-mono text-xs focus-visible:ring-indigo-500 mx-auto" 
                              type="number"
                              value={item.page} 
                              onChange={e => {
                                const newToc = [...formData.publication.toc];
                                newToc[idx].page = parseInt(e.target.value);
                                setFormData({...formData, publication: {...formData.publication, toc: newToc}});
                              }} 
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                const newToc = formData.publication.toc.filter((_: any, i: number) => i !== idx);
                                setFormData({...formData, publication: {...formData.publication, toc: newToc}});
                              }} 
                              className="text-slate-300 hover:text-rose-500 h-8 w-8"
                            >
                              <Trash2 className="w-3.5 h-3.5"/>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
               </Card>
            </TabsContent>

            <TabsContent value="digital" className="mt-0">
              <Card className="border-none shadow-sm rounded-2xl p-6 space-y-6">
                  <div className="flex bg-slate-100/50 p-1 rounded-xl w-max mb-4">
                    <Button variant={digitalMode === 'pdf' ? 'secondary' : 'ghost'} size="sm" className="rounded-lg px-6" onClick={() => setDigitalMode('pdf')}>Tải tệp PDF</Button>
                    <Button variant={digitalMode === 'text' ? 'secondary' : 'ghost'} size="sm" className="rounded-lg px-6" onClick={() => setDigitalMode('text')}>Nội dung văn bản</Button>
                    <Button variant={digitalMode === 'url' ? 'secondary' : 'ghost'} size="sm" className="rounded-lg px-6" onClick={() => setDigitalMode('url')}>Link ngoài</Button>
                  </div>
                  
                  {digitalMode === 'pdf' && (
                    <div className="space-y-6">
                      <div className="p-10 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30 text-center space-y-4">
                        <div className="w-12 h-12 bg-white rounded-full mx-auto flex items-center justify-center shadow-sm">
                            <Smartphone className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-700">Tệp tin số hóa</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Link: {formData.publication.digital_file_url || 'Chưa được tải lên'}</p>
                        </div>
                        <Input type="file" accept=".pdf" className="hidden" id="new-pdf" onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) uploadPdf(file, { onSuccess: (res: any) => {
                            const fileUrl = res.url || res.data?.url || res;
                            const pc = res.pageCount || res.data?.pageCount;
                            if (fileUrl) {
                               setFormData({
                                 ...formData, 
                                 publication: {
                                   ...formData.publication, 
                                   digital_file_url: fileUrl, 
                                   is_digital: true, 
                                   status: 'available',
                                   pageCount: pc ? pc.toString() : formData.publication.pageCount
                                 }
                               });
                               toast.success("Tải tệp số hóa lên thành công!");
                            }
                          }});
                        }} />
                        <Button variant="outline" className="rounded-full bg-white border-slate-200" onClick={() => document.getElementById('new-pdf')?.click()} disabled={isUploading}>
                          {isUploading ? 'Đang xử lý...' : 'Chọn tệp PDF'}
                        </Button>
                      </div>

                      <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-indigo-900 font-bold flex items-center gap-2">
                             <Layers className="w-4 h-4" /> Cấu hình Phân chương PDF
                          </Label>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-indigo-600 font-bold"
                            onClick={() => {
                               const pageQty = parseInt(formData.publication.pageCount) || 20;
                               const segments = [];
                               for(let i=1; i<=pageQty; i+=5) {
                                 segments.push({ title: `Chương ${Math.floor(i/5)+1}`, start_page: i, end_page: Math.min(i+4, pageQty) });
                               }
                               setFormData({...formData, publication: {...formData.publication, digitalContent: { ...formData.publication.digitalContent, segments }}});
                               toast.info(`Đã tự động chia thành ${segments.length} chương (5 trang/chương)`);
                            }}
                          >
                             Chạy phân đoạn (5 trang/chương)
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                           {formData.publication.digitalContent?.segments?.map((s: any, i: number) => (
                             <Badge key={i} variant="secondary" className="bg-white border-indigo-100 text-indigo-700 justify-start py-2 px-3">
                                {s.title}: {s.start_page}-{s.end_page}
                             </Badge>
                           ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {digitalMode === 'text' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Nội dung văn bản (Hỗ trợ cuộn dọc dài)</Label>
                        <div className="flex gap-2">
                           {formData.publication.digitalContent?.pages?.length > 0 && (
                             <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">Đã chia {formData.publication.digitalContent.pages.length} trang</Badge>
                           )}
                           <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100">Scrolling Active</Badge>
                        </div>
                      </div>
                      <Textarea 
                        className="min-h-[400px] border-none bg-slate-50 rounded-2xl p-6 focus-visible:ring-indigo-500 font-serif leading-relaxed text-lg" 
                        placeholder="Dán nội dung sách vào đây..."
                        value={formData.publication.metadata?.fullText || ''} 
                        onChange={e => setFormData({...formData, publication: {...formData.publication, is_digital: true, metadata: {...formData.publication.metadata, fullText: e.target.value}}})}
                      />
                      <Button 
                        variant="secondary" 
                        className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl"
                        onClick={() => {
                           const text = formData.publication.metadata?.fullText || '';
                           if (!text) return toast.error("Vui lòng nhập nội dung trước");
                           
                           const pages = [];
                           const targetSize = 2500;
                           let currentPos = 0;
                           while (currentPos < text.length) {
                             let endPos = currentPos + targetSize;
                             if (endPos < text.length) {
                               const lastPeriod = text.lastIndexOf('.', endPos);
                               const lastNewline = text.lastIndexOf('\n', endPos);
                               const breakPos = Math.max(lastPeriod, lastNewline);
                               if (breakPos > currentPos + (targetSize * 0.6)) endPos = breakPos + 1;
                               else {
                                 const lastSpace = text.lastIndexOf(' ', endPos);
                                 if (lastSpace > currentPos) endPos = lastSpace + 1;
                               }
                             }
                             pages.push(text.slice(currentPos, endPos).trim());
                             currentPos = endPos;
                           }
                           
                           setFormData({
                             ...formData, 
                             publication: {
                               ...formData.publication, 
                               is_digital: true,
                               pageCount: pages.length.toString(),
                               digitalContent: { ...formData.publication.digitalContent, pages, type: 'text_paginated' }
                             }
                           });
                           toast.success(`Đã tự động phân thành ${pages.length} trang văn bản!`);
                        }}
                      >
                        <Layers className="w-4 h-4 mr-2" /> Phân trang văn bản tự động
                      </Button>
                    </div>
                  )}

                  {digitalMode === 'url' && (
                    <div className="space-y-4">
                      <Label>URL tài liệu ngoài</Label>
                      <Input 
                        className="bg-slate-50 border-none h-12 rounded-xl"
                        placeholder="https://..."
                        value={formData.publication.digital_file_url} 
                        onChange={e => setFormData({...formData, publication: {...formData.publication, digital_file_url: e.target.value, is_digital: !!e.target.value}})} 
                      />
                    </div>
                  )}
              </Card>
            </TabsContent>
          </Tabs>

          <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm rounded-2xl p-6">
                <CardTitle className="text-xs font-bold mb-4 uppercase text-slate-400 tracking-wider">Màu thương hiệu</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl shadow-inner" style={{ backgroundColor: formData.publication.dominantColor }} />
                  <Input type="color" className="w-12 h-12 p-1 border-none bg-transparent cursor-pointer" value={formData.publication.dominantColor} onChange={e => setFormData({...formData, publication: {...formData.publication, dominantColor: e.target.value}})} />
                  <Input className="font-mono text-xs bg-slate-50 border-none flex-1 h-12 rounded-xl" value={formData.publication.dominantColor} readOnly />
                </div>
              </Card>
              <Card className="border-none shadow-sm rounded-2xl p-6">
                <CardTitle className="text-xs font-bold mb-4 uppercase text-slate-400 tracking-wider">Ảnh bìa (Thumbnail)</CardTitle>
                <div className="flex gap-4">
                  <div className="w-20 h-28 bg-slate-100 rounded-xl overflow-hidden shadow-sm flex-shrink-0 flex items-center justify-center border border-slate-100">
                    {formData.publication.thumbnail ? (
                      <img src={formData.publication.thumbnail.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000'}${formData.publication.thumbnail}` : formData.publication.thumbnail} className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <Input 
                      placeholder="Hoặc dán link ảnh ngoại bộ..."
                      className="bg-slate-50 border-none h-11 rounded-xl text-xs"
                      value={formData.publication.thumbnail} 
                      onChange={e => setFormData({...formData, publication: {...formData.publication, thumbnail: e.target.value}})} 
                    />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      id="upload-thumb" 
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) uploadImage(file, { onSuccess: (res: any) => {
                          const imageUrl = res.data?.url || res.url || res;
                          if (imageUrl) {
                            setFormData({...formData, publication: {...formData.publication, thumbnail: imageUrl}});
                            toast.success("Tải ảnh bìa lên thành công!");
                          }
                        }});
                      }} 
                    />
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl border-dashed border-slate-300 text-slate-500 h-11 bg-white hover:bg-slate-50"
                      onClick={() => document.getElementById('upload-thumb')?.click()}
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? 'Đang tải...' : 'Upload từ máy tính'}
                    </Button>
                  </div>
                </div>
              </Card>
          </div>
        </div>

        {/* CỘT PHẢI: AI INSIGHTS & UTILITIES (5/12) */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <Card className="border-none shadow-xl rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-8 relative overflow-hidden group min-h-[500px]">
             <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                <Sparkles className="w-64 h-64" />
             </div>
             <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                   </div>
                   <div>
                      <h3 className="font-bold text-lg">Trợ lý Gemini AI</h3>
                      <p className="text-xs text-indigo-300">Tự động hóa biên mục và tóm tắt</p>
                   </div>
                </div>
                <div className="space-y-6">
                   <div className="space-y-3">
                      <Label className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Nội dung tóm tắt</Label>
                      <Textarea 
                         className="bg-white/5 border-white/10 min-h-[220px] text-indigo-50 text-sm leading-relaxed placeholder:text-slate-600 rounded-2xl p-5"
                         placeholder="AI sẽ phân tích và tóm tắt nội dung ấn phẩm..."
                         value={formData.publication.aiSummary}
                         onChange={e => setFormData({...formData, publication: {...formData.publication, aiSummary: e.target.value}})}
                      />
                   </div>
                   <Button 
                      onClick={handleAISummarize} 
                      disabled={isSummarizing || !formData.publication.description} 
                      className="w-full bg-white text-indigo-900 hover:bg-slate-100 rounded-2xl h-12 font-bold shadow-lg"
                   >
                      <Sparkles className="w-4 h-4 mr-2" /> {isSummarizing ? 'Đang phân tích...' : 'Tạo Insight bằng AI'}
                   </Button>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-[11px] text-indigo-200/80 leading-relaxed">
                   <Info className="w-4 h-4 inline mr-2" />
                   Tải lên PDF hoặc dán Full-text để AI có đủ dữ liệu xử lý thông tin chuyên sâu.
                </div>
             </div>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl p-6 bg-blue-50/50 border border-blue-100/50">
             <div className="flex items-center gap-3 text-blue-800 mb-4">
                <Smartphone className="w-5 h-5" />
                <span className="font-bold text-sm">Xem trước Mobile App</span>
             </div>
             <div className="aspect-[9/16] bg-slate-900 rounded-[32px] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden mx-auto max-w-[220px]">
                <div className="p-4 pt-10 text-white">
                   <div className="w-full aspect-[3/4] bg-slate-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden border-none">
                      {formData.publication.thumbnail ? (
                        <img 
                          src={formData.publication.thumbnail.startsWith('http') ? formData.publication.thumbnail : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000'}${formData.publication.thumbnail}`} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <BookOpen className="w-8 h-8 text-slate-700" />
                      )}
                   </div>
                   <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
                   <div className="h-3 bg-slate-800 rounded w-1/2" />
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
