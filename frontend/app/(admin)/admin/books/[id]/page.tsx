'use client';

import { useRouter, useParams } from 'next/navigation';
import { 
  useAdminPublication, 
  useUpdatePublication, 
  useAdminCollections, 
  useUploadPdf, 
  useUploadImage,
  useAdminStorageLocations 
} from '@/lib/hooks/usePublications';
import { useAuthorsSelect, usePublishersSelect } from '@/lib/hooks/useBooks';
import { usePublishers } from '@/lib/hooks/usePublishers';
import { useBookLoans } from '@/lib/hooks/useBookLoans';
import { getApiBaseUrl } from '@/lib/api/base';
import { useState, useEffect } from 'react';
import { getCleanValue, normalizeLocaleValue } from '@/lib/utils/locale-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from '@/components/ui/textarea';
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Save, Sparkles, BookOpen, Layers,
  Smartphone, Barcode, Plus, Trash2, Info, GraduationCap, Image, Hash, Library, Building, ExternalLink,
  Clock, User, AlertTriangle, CheckCircle2, RotateCcw, CalendarClock
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { MultiAuthorSelect } from '@/components/admin/MultiAuthorSelect';
import { safeFormatDateVN } from '@/lib/date';

// ─── LoanHistoryTab ─────────────────────────────────────────────────────────
function LoanHistoryTab({ bookId }: { bookId: string }) {
  const { data, isLoading } = useBookLoans({ bookId, limit: 50 });
  const loans: any[] = data?.data ?? [];

  const statusCfg: Record<string, { label: string; cls: string; icon: any }> = {
    pending:   { label: 'Chờ duyệt',   cls: 'bg-slate-50 text-slate-500 border-slate-200',   icon: Clock },
    borrowing: { label: 'Đang mượn',   cls: 'bg-amber-50 text-amber-600 border-amber-200',   icon: BookOpen },
    overdue:   { label: 'Quá hạn',      cls: 'bg-rose-50 text-rose-600 border-rose-200',     icon: AlertTriangle },
    returned:  { label: 'Đã trả',       cls: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle2 },
    cancelled: { label: 'Đã hủy',       cls: 'bg-slate-50 text-slate-400 border-slate-100',   icon: RotateCcw },
  };

  const fmt = (d?: string | null) => safeFormatDateVN(d, '—');

  if (isLoading) return (
    <div className="p-16 text-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-slate-400 text-sm">Đang tải lịch sử mượn...</p>
    </div>
  );

  return (
    <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-5 bg-slate-50/50 border-b border-slate-100">
        <div>
          <CardTitle className="text-slate-700 text-sm font-bold flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-amber-500" />
            Lịch sử mượn ấn phẩm
          </CardTitle>
          <CardDescription className="text-[10px] mt-1">
            {loans.length} phiếu mượn
            &nbsp;•&nbsp;
            <span className="text-amber-600 font-bold">
              {loans.filter(l => l.status === 'borrowing' || l.status === 'overdue').length} đang chưa trả
            </span>
          </CardDescription>
        </div>
        <Link href="/admin/book-loans">
          <Button variant="outline" size="sm" className="rounded-full text-xs h-8">
            Xem tất cả phiếu
          </Button>
        </Link>
      </div>

      {loans.length === 0 ? (
        <div className="p-16 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-400 text-sm">Chưa có phiếu mượn nào cho ấn phẩm này</p>
        </div>
      ) : (
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100">
              <TableHead className="px-5 text-[10px] uppercase font-bold text-slate-500 w-[130px]">Thành viên</TableHead>
              <TableHead className="text-[10px] uppercase font-bold text-slate-500">Barcode</TableHead>
              <TableHead className="text-[10px] uppercase font-bold text-slate-500 text-center">Ngày mượn</TableHead>
              <TableHead className="text-[10px] uppercase font-bold text-slate-500 text-center">Hạn trả</TableHead>
              <TableHead className="text-[10px] uppercase font-bold text-slate-500 text-center">Ngày trả thực tế</TableHead>
              <TableHead className="text-[10px] uppercase font-bold text-slate-500 text-center">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map((loan: any) => {
              const cfg = statusCfg[loan.status] ?? statusCfg['pending'];
              const Icon = cfg.icon;
              const isOverdue = loan.status === 'borrowing' && loan.due_date && new Date(loan.due_date) < new Date();
              return (
                <TableRow key={loan.id} className="border-slate-50 hover:bg-slate-50/50 group">
                  <TableCell className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-700 line-clamp-1">{loan.member_name || '—'}</div>
                        <div className="text-[9px] text-slate-400">{loan.member_card || ''}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-slate-500">{loan.copy_barcode || '—'}</TableCell>
                  <TableCell className="text-center text-[10px] text-slate-500">{fmt(loan.loan_date)}</TableCell>
                  <TableCell className="text-center">
                    <span className={`text-[10px] font-bold ${isOverdue ? 'text-rose-500' : 'text-slate-500'}`}>
                      {fmt(loan.due_date)}
                      {isOverdue && ' ⚠'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-[10px] text-slate-500">{fmt(loan.returned_at)}</TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${isOverdue ? 'bg-rose-50 text-rose-600 border-rose-200' : cfg.cls}`}>
                      <Icon className="w-2.5 h-2.5" />
                      {isOverdue ? 'Quá hạn' : cfg.label}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

export default function EditBookPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: pubDetail, isLoading: isLoadingDetail } = useAdminPublication(id);
  const { mutate: updatePublication, isPending: isUpdating } = useUpdatePublication();
  const { mutate: uploadPdf, isPending: isUploading } = useUploadPdf();
  const { mutate: uploadImage, isPending: isUploadingImage } = useUploadImage();
  
  const { data: collections } = useAdminCollections();
  const { data: publishersData } = usePublishers({ limit: 100 });
  const publishers = publishersData?.data || [];
  
  const { data: authorsSelect } = useAuthorsSelect();
  const { data: storageLocationsRes } = useAdminStorageLocations();
  const storageLocations = Array.isArray(storageLocationsRes?.data)
    ? storageLocationsRes.data
    : Array.isArray((storageLocationsRes as any)?.data?.data)
      ? (storageLocationsRes as any).data.data
      : [];

  // Đã chuyển sang dùng getCleanValue từ locale-admin.ts

  const [digitalMode, setDigitalMode] = useState<'url' | 'pdf' | 'text'>('pdf');

  // Form State
  const [formData, setFormData] = useState<any>({
    publication: {
      code: '', title: '', author: '', publisher_id: '',
      collection_id: '', description: '', thumbnail: '',
      publicationYear: new Date().getFullYear(), language: 'vi',
      pageCount: '', is_digital: false, digital_file_url: '',
      isbdContent: '', aiSummary: '', dominantColor: '#4f46e5',
      metadata: {}, status: 'available',
      edition: '', volume: '', dimensions: '', keywords: '',
      digitalContent: { segments: [] },
      toc: [], access_policy: 'basic',
      cooperation_status: 'cooperating'
    },
    copies: []
  });

  useEffect(() => {
    if (pubDetail?.data) {
      // API có thể trả về { publication, copies } hoặc trực tiếp đối tượng publication
      const raw = pubDetail.data;
      const d = raw.publication ?? (raw.id ? raw : null);
      
      if (!d) return;

      const copiesFromApi = Array.isArray(raw.copies) ? raw.copies : (Array.isArray(d.copies) ? d.copies : []);

      setFormData({
        publication: {
          code: d.code || '',
          title: getCleanValue(d.title),
          author: (typeof d.author === 'string' && d.author !== 'Nhiều tác giả' ? d.author : (d.authors_list?.[0]?.name || d.author || '')),
          author_ids: d.authors_list?.map((a: any) => a.id) || [],
          publisher_id: (d.publisher_id || d.publisher?.id || '').toString(),
          collection_id: d.collection_id?.toString() || '',
          description: getCleanValue(d.description),
          thumbnail: d.cover_image || d.thumbnail || '',
          publicationYear: d.publication_year || new Date().getFullYear(),
          language: d.language || 'vi',
          pageCount: d.pages || d.page_count || '',
          is_digital: !!d.is_digital,
          digital_file_url: d.digital_file_url || '',
          isbdContent: d.isbd_content || d.isbn || '',
          aiSummary: d.ai_summary || d.aiSummary || '',
          dominantColor: d.dominant_color || d.dominantColor || '#4f46e5',
          metadata: {
            ...d.metadata,
            fullText: d.metadata?.fullText || d.metadata?.full_text_raw || ''
          },
          status: d.status || 'available',
          edition: d.edition || '',
          volume: d.volume || '',
          dimensions: d.dimensions || '',
          keywords: Array.isArray(d.keywords) ? d.keywords : (typeof d.keywords === 'string' ? d.keywords.split(',').map((k: string) => k.trim()) : []),
          digitalContent: Array.isArray(d.digital_content) ? d.digital_content : (typeof d.digital_content === 'string' ? JSON.parse(d.digital_content) : (d.digitalContent || { segments: [] })),
          toc: Array.isArray(d.toc) ? d.toc : (typeof d.toc === 'string' ? JSON.parse(d.toc) : []),
          access_policy: d.access_policy || 'basic',
          cooperation_status: d.cooperation_status || 'cooperating',
          media_type: d.media_type || (d.is_digital ? 'Digital' : 'Physical')
        },
        copies: copiesFromApi.map((c: any) => ({
          storage_id: c.storage_id || '',
          barcode: c.barcode || '',
          copy_number: c.copy_number || '',
          price: c.price || 0,
          status: c.status || 'available',
          storage_location_id: c.storage_location_id?.toString() || ''
        }))
      });
      
      if (d.metadata?.fullText) setDigitalMode('text');
      else if (d.digital_file_url?.includes('.pdf')) setDigitalMode('pdf');
      else if (d.digital_file_url) setDigitalMode('url');
    }
  }, [pubDetail, id]);


  const handleCopyChange = (index: number, field: string, value: any) => {
    const newCopies = [...formData.copies];
    newCopies[index] = { ...newCopies[index], [field]: value };
    setFormData({ ...formData, copies: newCopies });
  };

  const addCopy = () => {
    const nextIndex = formData.copies.length + 1;
    const baseCode = formData.publication.code || `PUB-${id}`;
    const autoBarcode = `${baseCode}-${nextIndex.toString().padStart(2, '0')}`;
    
    setFormData({
      ...formData,
      copies: [...formData.copies, { 
        storage_location_id: '', 
        barcode: autoBarcode, 
        copy_number: nextIndex.toString(), 
        price: 0, 
        status: 'available' 
      }]
    });
    toast.info(`Hệ thống đã tự động gợi ý Barcode: ${autoBarcode}`);
  };

  const removeCopy = (index: number) => {
    setFormData({
      ...formData,
      copies: formData.copies.filter((_: any, i: number) => i !== index)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const publicationYear = Number(formData.publication.publicationYear) || new Date().getFullYear();
    const pageCount = Number(formData.publication.pageCount) || 0;
    const normalizedKeywords = Array.isArray(formData.publication.keywords)
      ? formData.publication.keywords
      : String(formData.publication.keywords || '')
          .split(',')
          .map((k: string) => k.trim())
          .filter(Boolean);
    
    // Gửi trực tiếp dưới dạng chuỗi (Plain String) để đồng bộ với DB phẳng
    const submissionData = {
      ...formData,
      publication: {
        ...formData.publication,
        title: formData.publication.title,
        code: formData.publication.code,
        isbn: formData.publication.isbn || formData.publication.isbdContent || formData.publication.code,
        author: formData.publication.author || 'Nhiều tác giả',
        publication_year: publicationYear,
        pages: pageCount,
        description: formData.publication.description,
        keywords: normalizedKeywords,
        ai_summary: formData.publication.aiSummary || null,
        dominant_color: formData.publication.dominantColor || '#4f46e5',
        cover_image: formData.publication.thumbnail || null,
        toc: formData.publication.toc || [],
        access_policy: formData.publication.access_policy || 'basic',
        author_ids: formData.publication.author_ids || [],
        digital_content: {
          ...formData.publication.digitalContent,
          type: formData.publication.metadata?.fullText ? 'text_paginated' : (formData.publication.digital_file_url ? 'pdf' : null),
          full_text_raw: formData.publication.metadata?.fullText
        },
        metadata: {
          ...formData.publication.metadata,
          full_text_raw: formData.publication.metadata?.fullText // Đồng bộ cả 2 field để backend/frontend đều đọc được
        }
      }
    };

    updatePublication({ id, data: submissionData }, {
      onSuccess: () => {
        toast.success('Đã cập nhật ấn phẩm thành công!');
        // Delay nhỏ để tránh lỗi unmount và hiển thị toast
        setTimeout(() => {
          router.push('/admin/books');
        }, 500);
      },
      onError: (err: any) => {
        console.error('Update publication error:', err);
        toast.error(err.message || 'Có lỗi xảy ra khi lưu dữ liệu');
      }
    });
  };

  if (isLoadingDetail) {
    return <div className="p-20 text-center animate-pulse">Đang tải thông tin ấn phẩm...</div>;
  }

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
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Biên tập Ấn phẩm
            </h1>
            <p className="text-xs text-slate-500 font-medium">Mã hệ thống: {id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/books">
            <Button variant="outline" className="rounded-full border-slate-200 text-slate-600">
              Hủy bỏ
            </Button>
          </Link>
          <Button onClick={handleSubmit} disabled={isUpdating} className="bg-indigo-600 hover:bg-indigo-700 px-8 rounded-full shadow-lg shadow-indigo-100">
            <Save className="w-4 h-4 mr-2" />
            {isUpdating ? 'Đang lưu...' : 'Cập nhật & Xuất bản'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* CỘT TRÁI: FORM BIÊN TẬP (6/12) */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="bg-white p-1 rounded-xl border border-slate-100 mb-4 shadow-sm flex-wrap">
              <TabsTrigger value="basic" className="rounded-lg px-4">Thông tin chính</TabsTrigger>
              <TabsTrigger value="specs" className="rounded-lg px-4">Thông số chi tiết</TabsTrigger>
              <TabsTrigger value="operations" className="rounded-lg px-4">Nghiệp vụ</TabsTrigger>
              <TabsTrigger value="copies" className="rounded-lg px-4">Bản sao ({formData.copies.length})</TabsTrigger>
              <TabsTrigger value="toc" className="rounded-lg px-4 font-bold text-indigo-600">Mục lục</TabsTrigger>
              <TabsTrigger value="digital" className="rounded-lg px-4">Digital</TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg px-4 text-amber-600 font-bold">Ấn phiếu mượn</TabsTrigger>
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
                      className="bg-slate-50 border-none rounded-xl h-12 focus-visible:ring-indigo-500 transition-all font-semibold text-indigo-900"
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
                                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
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
                      value={formData.publication.publisher_id?.toString()}
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
                          <SelectItem key={p.id} value={p.id.toString()}>{getCleanValue(p.name)}</SelectItem>
                        ))}
                        {publishers.length === 0 && (
                          <div className="p-2 text-center text-xs text-slate-400">Chưa có dữ liệu</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                      <Label className="text-slate-500">Nhan đề chính</Label>
                      <Input 
                        className="bg-slate-50 border-none rounded-xl h-11 font-bold text-lg focus-visible:ring-indigo-500" 
                        value={formData.publication.title || ""} 
                        onChange={e => setFormData({...formData, publication: {...formData.publication, title: e.target.value}})} 
                      />
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
                      <Label className="text-slate-500">Ngày cập nhật cuối</Label>
                      <div className="h-11 flex items-center px-4 bg-slate-50 rounded-xl text-slate-400 text-xs italic font-medium">
                        Dữ liệu đồng bộ realtime với Database
                      </div>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-slate-500">Mô tả giới thiệu</Label>
                    <Textarea 
                      className="min-h-[200px] bg-slate-50 border-none rounded-2xl p-4 focus-visible:ring-indigo-500" 
                      value={formData.publication.description} 
                      onChange={e => setFormData({...formData, publication: {...formData.publication, description: e.target.value}})} 
                    />
                 </div>
              </Card>
            </TabsContent>

            <TabsContent value="operations" className="mt-0">
               <Card className="border-none shadow-sm rounded-2xl p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-slate-500">Chuỗi ISBD</Label>
                      <Textarea 
                        className="min-h-[120px] bg-slate-50 border-none rounded-xl font-mono text-sm"
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
                          <Input type="number" className="bg-slate-50 border-none rounded-xl" value={formData.publication.publicationYear} onChange={e => setFormData({...formData, publication: {...formData.publication, publicationYear: parseInt(e.target.value)}})} />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-slate-500">Số trang</Label>
                          <Input className="bg-slate-50 border-none rounded-xl" value={formData.publication.pageCount} onChange={e => setFormData({...formData, publication: {...formData.publication, pageCount: e.target.value}})} />
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
                      <CardDescription className="text-[10px] mt-1 flex items-center gap-2">
                        {(() => {
                          const avail  = formData.copies.filter((c: any) => c.status === 'available' || c.status === 'tại kho').length;
                          const total  = formData.copies.length;
                          const borrow = formData.copies.filter((c: any) => c.status === 'borrowed' || c.status === 'borrowing').length;
                          return (
                            <>
                              <span className="font-bold text-emerald-600">{avail} khả dụng</span>
                              <span className="text-slate-300">/</span>
                              <span className="font-bold text-amber-600">{borrow} đang mượn</span>
                              <span className="text-slate-300">/</span>
                              <span>{total} tổng bản sao</span>
                            </>
                          );
                        })()}
                      </CardDescription>
                    </div>
                    <Button onClick={addCopy} variant="outline" size="sm" className="rounded-full bg-white shadow-sm hover:bg-slate-50">
                      <Plus className="w-3 h-3 mr-1"/>Thêm bản sao
                    </Button>
                 </div>
                 <Table>
                    <TableHeader><TableRow className="border-slate-50 bg-slate-50/30">
                      <TableHead className="px-6 text-[10px] uppercase tracking-wider w-[170px]">Barcode</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider">Vị trí kho</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider w-20 text-center">Số hiệu</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider w-28 text-right pr-4">Giá (VNĐ)</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider w-28 text-center">Trạng thái</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {formData.copies.map((copy: any, idx: number) => (
                        <TableRow key={idx} className="border-slate-50 hover:bg-slate-50/50 group">
                          <TableCell className="px-6">
                            <Input
                              className="border-none bg-transparent h-8 focus-visible:ring-0 font-mono text-sm"
                              value={copy.barcode || ''}
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
                              value={copy.copy_number || idx + 1}
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
                            {copy.status === 'available' || copy.status === 'tại kho' ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">Khả dụng</span>
                            ) : copy.status === 'borrowed' || copy.status === 'borrowing' ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100">Đang mượn</span>
                            ) : copy.status === 'lost' ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100">Mất</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-50 text-slate-400 border border-slate-100">{copy.status || 'Mới'}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => removeCopy(idx)}
                              disabled={copy.status === 'borrowed' || copy.status === 'borrowing'}
                              className="text-slate-200 hover:text-rose-500 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-20"
                            >
                              <Trash2 className="w-3.5 h-3.5"/>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {formData.copies.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-400">
                          Chưa có bản sao nào
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
                    <Input className="bg-slate-50 border-none rounded-xl" value={formData.publication.edition} onChange={e => setFormData({...formData, publication: {...formData.publication, edition: e.target.value}})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-500">Tập (Volume)</Label>
                    <Input className="bg-slate-50 border-none rounded-xl" value={formData.publication.volume} onChange={e => setFormData({...formData, publication: {...formData.publication, volume: e.target.value}})} />
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
                      <Label className="text-slate-500">Trạng thái phát hành</Label>
                      <Badge className={formData.publication.status === 'available' ? 'bg-emerald-500' : 'bg-slate-400'}>
                         {formData.publication.status.toUpperCase()}
                      </Badge>
                   </div>
                </div>

                <div className="pt-4 border-t border-slate-100 grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="text-indigo-600 font-bold flex items-center gap-2">
                          Trạng thái Hợp tác (Bản quyền)
                       </Label>
                       <Select 
                         value={formData.publication.cooperation_status || 'cooperating'} 
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
                        Trình soạn thảo Mục lục
                      </CardTitle>
                      <p className="text-[10px] text-slate-400 mt-1">Gán tiêu đề chương với số trang tương ứng</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-indigo-600 hover:bg-indigo-50 rounded-full h-8 px-4"
                        onClick={() => {
                          toast.info("AI đang phân tích mục lục từ tệp tin...");
                          // Giả lập AI trích xuất
                          setTimeout(() => {
                            const aiToc = [
                              { title: "Lời mở đầu", page: 1, level: 1 },
                              { title: "Chương 1: Tổng quan", page: 10, level: 1 },
                              { title: "Chương 2: Kiến thức cơ bản", page: 45, level: 1 },
                              { title: "Chương 3: Nâng cao", page: 120, level: 1 },
                              { title: "Kết luận", page: 200, level: 1 }
                            ];
                            setFormData({...formData, publication: {...formData.publication, toc: aiToc}});
                            toast.success("Đã trích xuất mục lục thành công!");
                          }, 1500);
                        }}
                      >
                        <Sparkles className="w-3 h-3 mr-1" /> AI Suggest
                      </Button>
                      <Button 
                        onClick={() => {
                          const currentToc = Array.isArray(formData.publication.toc) ? formData.publication.toc : [];
                          const newToc = [...currentToc];
                          newToc.push({ title: '', page: 1, level: 1 });
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
                        <TableHead className="px-6 text-[10px] uppercase tracking-wider">Tiêu đề chương / phần</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-wider w-32 px-2 text-center">Trang bắt đầu</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(formData.publication.toc) && formData.publication.toc.map((item: any, idx: number) => (
                        <TableRow key={idx} className="border-slate-50 hover:bg-slate-100/50 group">
                          <TableCell className="px-6 py-2">
                            <Input 
                              className="border-none bg-transparent h-9 focus-visible:ring-0 font-medium text-slate-700" 
                              placeholder="VD: Chương 1..."
                              value={item.title} 
                              onChange={e => {
                                const currentToc = Array.isArray(formData.publication.toc) ? formData.publication.toc : [];
                                const newToc = [...currentToc];
                                newToc[idx].title = e.target.value;
                                setFormData({...formData, publication: {...formData.publication, toc: newToc}});
                              }} 
                            />
                          </TableCell>
                          <TableCell className="px-2 py-2">
                             <div className="flex items-center gap-2 justify-center">
                                <Input 
                                  className="border-none bg-slate-100 h-8 w-16 text-center rounded-lg font-mono text-xs focus-visible:ring-indigo-500" 
                                  type="number"
                                  value={item.page} 
                                  onChange={e => {
                                     const currentToc = Array.isArray(formData.publication.toc) ? formData.publication.toc : [];
                                    const newToc = [...currentToc];
                                    newToc[idx].page = parseInt(e.target.value);
                                    setFormData({...formData, publication: {...formData.publication, toc: newToc}});
                                  }} 
                                />
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    // Logic nhảy trang ở PDF Preview
                                    toast.info(`Đang chuyển đến trang ${item.page}`);
                                    const iframe = document.querySelector('iframe');
                                    if (iframe && formData.publication.digital_file_url) {
                                       const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.thuvientn.site';
                                       const rawUrl = formData.publication.digital_file_url;
                                       const fullUrl = rawUrl.startsWith('http') ? rawUrl : `${baseUrl}${rawUrl}`;
                                       iframe.src = `${fullUrl}#page=${item.page}`;
                                    }
                                  }}
                                  title="Xem trang này"
                                >
                                  <Smartphone className="w-3 h-3" />
                                </Button>
                             </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                const currentToc = Array.isArray(formData.publication.toc) ? formData.publication.toc : [];
                                const newToc = currentToc.filter((_: any, i: number) => i !== idx);
                                setFormData({...formData, publication: {...formData.publication, toc: newToc}});
                              }} 
                              className="text-slate-300 hover:text-rose-500 h-8 w-8"
                            >
                              <Trash2 className="w-3.5 h-3.5"/>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!formData.publication.toc || formData.publication.toc.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={3} className="h-40 text-center space-y-2">
                             <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto grayscale opacity-50">
                                <Layers className="w-6 h-6 text-slate-400" />
                             </div>
                             <p className="text-slate-400 text-xs">Chưa có mục lục. Nhấn "Thêm mục" hoặc sử dụng AI.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
               </Card>
            </TabsContent>

            <TabsContent value="digital" className="mt-0">
              <Card className="border-none shadow-sm rounded-2xl p-6 space-y-6">
                  <div className="flex bg-slate-100/50 p-1 rounded-xl w-max mb-4">
                    <Button variant={digitalMode === 'pdf' ? 'secondary' : 'ghost'} size="sm" className="rounded-lg px-6" onClick={() => setDigitalMode('pdf')}>PDF Asset</Button>
                    <Button variant={digitalMode === 'text' ? 'secondary' : 'ghost'} size="sm" className="rounded-lg px-6" onClick={() => setDigitalMode('text')}>Full Text</Button>
                    <Button variant={digitalMode === 'url' ? 'secondary' : 'ghost'} size="sm" className="rounded-lg px-6" onClick={() => setDigitalMode('url')}>External Link</Button>
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
                        <Input type="file" accept=".pdf" className="hidden" id="edit-pdf" onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) uploadPdf(file, { onSuccess: (res: any) => {
                            const fileUrl = res.url || res.data?.url || res;
                            if (fileUrl) {
                               const pc = res.pageCount || res.data?.pageCount;
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
                        <Button variant="outline" className="rounded-full bg-white border-slate-200" onClick={() => document.getElementById('edit-pdf')?.click()} disabled={isUploading}>
                          {isUploading ? 'Đang xử lý...' : 'Thay đổi tệp PDF'}
                        </Button>
                      </div>

                      <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-indigo-900 font-bold flex items-center gap-2">
                             <Layers className="w-4 h-4" /> Cấu hình Phân chương Tự động
                          </Label>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-indigo-600 font-bold"
                            onClick={() => {
                               // Giả lập chia 5 trang/chương
                               const pageQty = parseInt(formData.publication.pageCount) || 20;
                               const segments = [];
                               for(let i=1; i<=pageQty; i+=5) {
                                 segments.push({ title: `Chương ${Math.floor(i/5)+1}`, start_page: i, end_page: Math.min(i+4, pageQty) });
                               }
                               setFormData({...formData, publication: {...formData.publication, digitalContent: { ...formData.publication.digitalContent, segments }}});
                               toast.info(`Đã tự động chia thành ${segments.length} chương (5 trang/chương)`);
                            }}
                          >
                             Chạy phân đoạn
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                           {Array.isArray(formData.publication.digitalContent?.segments) && formData.publication.digitalContent.segments.map((s: any, i: number) => (
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
                             <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">Đã chia {formData.publication.digitalContent.pages.length} trang</Badge>
                           )}
                           <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100">Cấu trúc Scrolling</Badge>
                        </div>
                      </div>
                      <Textarea 
                        className="min-h-[400px] border-none bg-slate-50 rounded-2xl p-6 focus-visible:ring-indigo-500 font-serif leading-relaxed" 
                        placeholder="Nhập nội dung văn bản thô để hiển thị dạng cuộn..."
                        value={formData.publication.metadata?.fullText || ''} 
                        onChange={e => setFormData({...formData, publication: {...formData.publication, is_digital: true, metadata: {...formData.publication.metadata, fullText: e.target.value}}})}
                      />
                      <Button 
                        variant="secondary" 
                        className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl"
                        onClick={() => {
                           const text = formData.publication.metadata?.fullText || '';
                           if (!text) return toast.error("Vui lòng nhập nội dung trước");
                           
                           // Logic phân trang thông minh
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
                        <Layers className="w-4 h-4 mr-2" /> Tự động phân trang văn bản
                      </Button>
                    </div>
                  )}

                  {digitalMode === 'url' && (
                    <div className="space-y-4">
                      <Label>Đường dẫn tài liệu bên ngoài</Label>
                      <Input 
                        className="bg-slate-50 border-none h-12 rounded-xl"
                        placeholder="https://example.com/ebook.pdf"
                        value={formData.publication.digital_file_url} 
                        onChange={e => setFormData({...formData, publication: {...formData.publication, digital_file_url: e.target.value, is_digital: !!e.target.value}})} 
                      />
                    </div>
                  )}
              </Card>
            </TabsContent>

            {/* ── TAB LỊCH SỬ MƯỢN ── */}
            <TabsContent value="history" className="mt-0">
              <LoanHistoryTab bookId={id} />
            </TabsContent>
          </Tabs>

          {/* Cấu hình Visual & Analytics */}
          <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm rounded-2xl p-6">
                <CardTitle className="text-sm font-bold mb-4">Màu sắc thương hiệu</CardTitle>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-2xl shadow-inner cursor-pointer" 
                    style={{ backgroundColor: formData.publication.dominantColor }}
                  />
                  <Input 
                    type="color" 
                    className="w-12 h-12 p-1 border-none bg-transparent" 
                    value={formData.publication.dominantColor} 
                    onChange={e => setFormData({...formData, publication: {...formData.publication, dominantColor: e.target.value}})} 
                  />
                  <Input 
                    className="font-mono text-xs bg-slate-50 border-none flex-1 h-12 rounded-xl" 
                    value={formData.publication.dominantColor} 
                    readOnly 
                  />
                </div>
              </Card>
              <Card className="border-none shadow-sm rounded-2xl p-6">
                <CardTitle className="text-sm font-bold mb-4">Ảnh bìa (Thumbnail)</CardTitle>
                <div className="flex gap-4">
                  <div className="w-20 h-28 bg-slate-100 rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-slate-100">
                    {formData.publication.thumbnail ? (
                      <img src={typeof formData.publication.thumbnail === 'string' && formData.publication.thumbnail.startsWith('/') ? `${getApiBaseUrl()}${formData.publication.thumbnail}` : (typeof formData.publication.thumbnail === 'string' ? formData.publication.thumbnail : '')} className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-6 h-6 text-slate-300 m-4" />
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <Input 
                      placeholder="URL ảnh bìa..."
                      className="bg-slate-50 border-none h-11 rounded-xl text-xs"
                      value={formData.publication.thumbnail || ""} 
                      onChange={e => setFormData({...formData, publication: {...formData.publication, thumbnail: e.target.value}})} 
                    />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      id="edit-thumb" 
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) uploadImage(file, { onSuccess: (res: any) => {
                          const imageUrl = res.data?.url || res.url || res;
                          if (imageUrl) {
                            setFormData({...formData, publication: {...formData.publication, thumbnail: imageUrl}});
                            toast.success("Đã thay đổi ảnh bìa thành công!");
                          }
                        }});
                      }} 
                    />
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl border-dashed border-slate-300 text-slate-500 h-11 bg-white hover:bg-slate-50"
                      onClick={() => document.getElementById('edit-thumb')?.click()}
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? 'Đang tải...' : 'Upload ảnh mới'}
                    </Button>
                  </div>
                </div>
              </Card>
          </div>
        </div>

        {/* CỘT PHẢI: PDF VIEWER & AI INSIGHTS (5/12) */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* PDF PREVIEW CARD */}
          <Card className="border-none shadow-xl rounded-2xl overflow-hidden flex flex-col h-[600px] h-max-[750px]">
             <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Live Preview</span>
                </div>
                <div className="flex gap-2">
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white"><Layers className="w-4 h-4"/></Button>
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white"><Smartphone className="w-4 h-4"/></Button>
                </div>
             </div>
             <div className="flex-1 bg-slate-200 relative group">
                {formData.publication.digital_file_url ? (
                  <iframe 
                    src={(() => {
                      const url = formData.publication.digital_file_url;
                      if (!url) return '';
                      if (url.startsWith('http')) return url;
                      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.thuvientn.site';
                      const fullUrl = `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
                      console.log('PDF Preview URL debug:', fullUrl);
                      return fullUrl;
                    })()} 
                    className="w-full h-full border-none"
                    title="PDF Viewer"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-300/50 rounded-full flex items-center justify-center grayscale">
                      <BookOpen className="w-10 h-10 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">Chưa có tệp PDF để hiển thị</p>
                    <p className="text-xs text-slate-400">Tải tệp lên tab "Digital" để xem trước nội dung trực tiếp tại đây</p>
                  </div>
                )}
             </div>
             <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Badge variant="outline" className="rounded-full border-indigo-100 text-indigo-600 bg-indigo-50/50">Admin Mode</Badge>
                   <span className="text-[10px] text-slate-400 font-medium italic">Powered by Core Engine v2.0</span>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-slate-500 h-8">Full screen</Button>
             </div>
          </Card>

          {/* AI SUMMARY CARD */}
          <Card className="border-none shadow-xl rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Sparkles className="w-32 h-32" />
             </div>
             <div className="relative space-y-4">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                   </div>
                   <h3 className="font-bold">Gemini AI Insight</h3>
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <Label className="text-indigo-200 text-xs">Bản tóm tắt nội dung</Label>
                      <Textarea 
                         className="bg-white/5 border-white/10 min-h-[150px] text-indigo-100 text-sm placeholder:text-slate-600"
                         placeholder="AI sẽ tóm tắt nội dung tại đây..."
                         value={formData.publication.aiSummary}
                         onChange={e => setFormData({...formData, publication: {...formData.publication, aiSummary: e.target.value}})}
                      />
                   </div>
                   <div className="flex gap-2">
                      <Button className="flex-1 bg-white text-indigo-900 hover:bg-indigo-50 font-bold rounded-xl h-10">
                        <Sparkles className="w-4 h-4 mr-2" /> Tối ưu bằng AI
                      </Button>
                   </div>
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
