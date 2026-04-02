'use client';

import { use, useState, useEffect } from 'react';
import { useBookLoan, useUpdateBookLoan } from '@/lib/hooks/useBookLoans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, CalendarDays, User, BookOpen, Fingerprint, Banknote,
  CheckCircle, AlertTriangle, Clock, Save, History, Info
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function BookLoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useBookLoan(parseInt(id));
  const { mutate: updateLoan, isPending: isUpdating } = useUpdateBookLoan(parseInt(id));

  const [formData, setFormData] = useState({
    notes: '',
    status: '',
    due_date: ''
  });

  useEffect(() => {
    if (data?.data) {
      setFormData({
        notes: data.data.notes || '',
        status: data.data.status || '',
        due_date: data.data.due_date ? new Date(data.data.due_date).toISOString().split('T')[0] : ''
      });
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-6 text-slate-500 font-black uppercase text-xs tracking-widest animate-pulse">Retrieving Loan Data...</p>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-20 h-20 text-slate-200 mb-6" />
        <h2 className="text-2xl font-black text-slate-800 uppercase italic">Hồ sơ không tồn tại</h2>
        <Link href="/admin/book-loans" className="mt-8">
          <Button variant="outline" className="rounded-2xl px-8 h-12 font-bold border-slate-200">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  const loan = data.data;

  const handleSave = () => {
    updateLoan(formData, {
      onSuccess: () => toast.success('Đã cập nhật thông tin hồ sơ mượn trả thành công!'),
      onError: (err: any) => toast.error(err.message || 'Lỗi khi cập nhật')
    });
  };

  const getStatusBadge = (status: string) => {
    const map: any = {
      pending:   { label: 'Chờ duyệt',  cls: 'bg-amber-100 text-amber-700 border-amber-200' },
      borrowing: { label: 'Đang mượn',  cls: 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-100' },
      returned:  { label: 'Đã trả',     cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      overdue:   { label: 'Quá hạn',    cls: 'bg-red-600 text-white border-transparent' },
      lost:      { label: 'Mất sách',   cls: 'bg-slate-900 text-white border-transparent' },
      rejected:  { label: 'Từ chối',    cls: 'bg-red-100 text-red-700 border-red-200' },
    };
    const cfg = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
    return <Badge className={`px-4 py-1.5 rounded-xl font-black uppercase text-[10px] tracking-widest ${cfg.cls}`}>{cfg.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl space-y-10 animate-in fade-in zoom-in duration-500">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20">
        <div className="flex items-center gap-5">
          <Link href="/admin/book-loans">
            <Button variant="outline" size="icon" className="w-14 h-14 rounded-2xl border-slate-100 hover:bg-slate-50 shadow-sm transition-all text-slate-400 hover:text-indigo-600 group">
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-4">
               <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Quản trị Hồ sơ</h1>
               {getStatusBadge(loan.status)}
            </div>
            <div className="text-slate-400 mt-1 font-bold flex items-center gap-2 text-xs uppercase tracking-widest">
              <Fingerprint className="w-4 h-4 text-indigo-500" /> Reference: <span className="font-mono text-slate-900">#LOAN-{loan.id}</span>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSave}
          disabled={isUpdating}
          className="bg-indigo-600 hover:bg-indigo-700 h-14 px-10 rounded-2xl font-black shadow-2xl shadow-indigo-200 text-white transition-all transform hover:scale-[1.02] active:scale-95"
        >
          {isUpdating ? 'PROCESSING...' : <><Save className="w-5 h-5 mr-3" /> CẬP NHẬT GHI CHÚ</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Form Fields */}
        <div className="md:col-span-2 space-y-8">
           <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 pb-0 flex flex-row items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <History className="w-6 h-6" />
                 </div>
                 <div>
                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Nghiệp vụ chi tiết</CardTitle>
                    <p className="text-xs font-bold text-slate-400 uppercase mt-1">Operational Data Override</p>
                 </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Clock className="w-4 h-4 text-indigo-500" /> Trạng thái hồ sơ
                       </label>
                       <Select 
                        value={formData.status} 
                        onValueChange={(val) => setFormData({...formData, status: val})}
                       >
                          <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 font-bold focus:ring-indigo-500">
                             <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl font-bold">
                             <SelectItem value="pending">Chờ duyệt</SelectItem>
                             <SelectItem value="borrowing">Đang mượn</SelectItem>
                             <SelectItem value="overdue">Quá hạn</SelectItem>
                             <SelectItem value="returned">Đã trả sách</SelectItem>
                             <SelectItem value="lost" className="text-red-600">Đã mất sách</SelectItem>
                             <SelectItem value="rejected">Từ chối mượn</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>

                    <div className="space-y-3">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-indigo-500" /> Điều chỉnh hạn trả
                       </label>
                       <Input 
                        type="date" 
                        value={formData.due_date}
                        onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                        className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 font-bold focus:ring-indigo-50"
                       />
                    </div>
                 </div>

                 <div className="space-y-3 pt-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Info className="w-4 h-4 text-indigo-500" /> Ghi chú nghiệp vụ của thủ thư
                    </label>
                    <Textarea 
                      rows={6} 
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Ghi chú về tình trạng sách khi trả, lý do gia hạn đặc biệt, hoặc các vấn đề phát sinh..."
                      className="rounded-[2rem] border-slate-100 bg-slate-50/50 p-6 font-medium focus:bg-white transition-all shadow-inner"
                    />
                 </div>
              </CardContent>
           </Card>

           {/* Read-only Data cards in 2 columns */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Member Card */}
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white overflow-hidden group">
                 <div className="p-8 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                       <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black group-hover:rotate-6 transition-transform">
                          {(loan.member_name || '?').charAt(0)}
                       </div>
                       <User className="w-6 h-6 text-slate-200" />
                    </div>
                    <div className="mt-6">
                       <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Reader Account</div>
                       <div className="text-xl font-black text-slate-900 mt-1">{loan.member_name}</div>
                       <div className="flex items-center gap-2 mt-4">
                          <span className="text-[10px] font-mono bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-black border border-indigo-100 uppercase">
                             IDC-{loan.member_card}
                          </span>
                       </div>
                    </div>
                 </div>
              </Card>

              {/* Finance Overview */}
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-slate-900 text-white overflow-hidden">
                 <div className="p-8 h-full flex flex-col justify-between bg-gradient-to-br from-slate-800 to-black">
                    <div className="flex justify-between items-start">
                       <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
                          <Banknote className="w-6 h-6" />
                       </div>
                       <Clock className="w-6 h-6 text-slate-700" />
                    </div>
                    <div className="mt-6">
                       <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Financial Penalty</div>
                       <div className={`text-3xl font-black mt-2 ${Number(loan.late_fee) > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                          {Number(loan.late_fee || 0).toLocaleString()} <span className="text-sm">VND</span>
                       </div>
                       <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">Automatic Fee Calculation</p>
                    </div>
                 </div>
              </Card>
           </div>
        </div>

        {/* Cột 3: Publication Detail (Sidebar style) */}
        <div className="space-y-8">
           <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white sticky top-10 overflow-hidden">
              <div className="relative h-48 bg-indigo-600 overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent group-hover:scale-110 transition-transform duration-700">
                    <img 
                      src={loan.cover_image || 'https://images.unsplash.com/photo-1543004223-249527ec45b6?w=800'} 
                      alt="" 
                      className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                    />
                 </div>
                 <div className="absolute bottom-6 left-8 flex items-end gap-5">
                    <div className="w-24 h-36 bg-white/10 backdrop-blur-xl rounded-xl overflow-hidden border border-white/20 shadow-2xl shadow-indigo-900/50 p-1">
                       <img 
                        src={loan.cover_image || 'https://images.unsplash.com/photo-1543004223-249527ec45b6?w=800'} 
                        alt="" 
                        className="w-full h-full object-cover rounded-lg"
                       />
                    </div>
                 </div>
              </div>
              
              <CardContent className="p-8 pt-6 space-y-6">
                 <div>
                    <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">Authenticated Publication</div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">{loan.book_title}</h3>
                    <p className="text-slate-500 font-bold mt-1 text-sm italic">{loan.book_author || 'Khuyết danh'}</p>
                 </div>

                 <div className="flex flex-col gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-dotted border-slate-200 flex justify-between items-center group cursor-help">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Barcode Identity</span>
                          <span className="font-mono text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-widest">{loan.copy_barcode || 'N/A'}</span>
                       </div>
                       <BookOpen className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-slate-50 p-3 rounded-xl flex flex-col justify-center border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Medium</span>
                          <span className="text-[11px] font-black text-slate-700">{loan.media_type || 'PRINT'}</span>
                       </div>
                       <div className="bg-slate-50 p-3 rounded-xl flex flex-col justify-center border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Policy</span>
                          <span className="text-[11px] font-black text-slate-700 uppercase">{loan.access_policy || 'BASIC'}</span>
                       </div>
                    </div>
                 </div>

                 <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <History className="w-3 h-3" /> Audit Timeline
                    </h4>
                    <div className="space-y-4">
                       <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold">Lưu thông từ</span>
                          <span className="text-xs font-black text-slate-700">{loan.loan_date ? new Date(loan.loan_date).toLocaleDateString('vi-VN') : 'Pending'}</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold">Hạn thu hồi</span>
                          <span className="text-xs font-black text-indigo-600">{loan.due_date ? new Date(loan.due_date).toLocaleDateString('vi-VN') : 'Pending'}</span>
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
