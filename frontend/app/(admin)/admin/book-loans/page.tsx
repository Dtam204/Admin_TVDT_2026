'use client';

import React, { useState, useEffect } from 'react';
import { useBookLoans, useReservations } from '@/lib/hooks/useBookLoans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Edit, Trash2, BookOpen, CheckCircle, Clock, RotateCcw, Calendar, History, Wallet, Download, AlertCircle, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/components/ui/utils';
import { ExtensionModal } from '@/components/admin/loans/ExtensionModal';
import { ReturnConfirmModal } from '@/components/admin/loans/ReturnConfirmModal';

export default function BookLoansPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // States cho Modals
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  const { data: loansData, isLoading, refetch } = useBookLoans({
    page,
    limit: 10,
    search,
    status: activeTab === 'all' || activeTab === 'reservations' ? undefined : activeTab
  });

  const { data: reservationsData, isLoading: isLoadingRes } = useReservations();

  const [isExporting, setIsExporting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Mock export delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Đã xuất báo cáo mượn trả thành công!');
    } catch (error) {
      toast.error('Lỗi khi xuất báo cáo');
    } finally {
      setIsExporting(false);
    }
  };

  const handleApprove = async (id: number) => {
    setIsApproving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Đã duyệt yêu cầu mượn sách!');
      refetch();
    } catch (error) {
      toast.error('Lỗi khi duyệt yêu cầu');
    } finally {
      setIsApproving(false);
    }
  };

  const handleConfirmExtend = async (days: number) => {
    setIsExtending(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`Đã gia hạn thành công thêm ${days} ngày!`);
      setIsExtendModalOpen(false);
      refetch();
    } catch (error) {
      toast.error('Lỗi khi gia hạn');
    } finally {
      setIsExtending(false);
    }
  };

  const handleConfirmReturn = async () => {
    setIsReturning(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Đã xác nhận trả sách thành công!');
      setIsReturnModalOpen(false);
      refetch();
    } catch (error) {
      toast.error('Lỗi khi trả sách');
    } finally {
      setIsReturning(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      toast.success('Đã xóa bản ghi thành công!');
      refetch();
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: any = {
      pending: { label: 'Chờ duyệt', className: 'bg-amber-100 text-amber-700 border-amber-200' },
      borrowing: { label: 'Đang mượn', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      returned: { label: 'Đã trả', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      overdue: { label: 'Quá hạn', className: 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse' },
      cancelled: { label: 'Đã hủy', className: 'bg-slate-100 text-slate-500 border-slate-200' },
    };

    const config = configs[status] || configs.pending;
    return (
      <Badge variant="outline" className={cn("px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border-2 shadow-sm", config.className)}>
        {config.label}
      </Badge>
    );
  };

  const getMediaTypeBadge = (type: string) => {
    if (type === 'ebook') return <Badge className="bg-indigo-500 text-white border-none text-[8px] h-4">E-BOOK</Badge>;
    return <Badge className="bg-slate-700 text-white border-none text-[8px] h-4">SÁCH IN</Badge>;
  };

  return (
    <div className="w-full pb-8 space-y-0 text-slate-900 bg-slate-50/30 min-h-screen">
      {/* ── RICH COMPACT HEADER (SYNC WITH BOOKS & MEMBERS) ── */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black px-6 py-5 md:px-10 md:py-6 2xl:py-10 shadow-xl relative overflow-hidden flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-white/10">
        {/* Subtle Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full -ml-24 -mb-24 blur-[80px]" />

        {/* LEFT SECTION: BRAND & ACTION */}
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl">
              <BookOpen className="w-8 h-8 lg:w-9 lg:h-9 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl 2xl:text-4xl font-black text-white tracking-tight">Quản lý Mượn/Trả</h1>
              <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 mt-1 opacity-60">
                <History className="w-3.5 h-3.5 text-blue-400" />
                LƯU THÔNG & CHU TRÌNH ẤN PHẨM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              className="h-10 border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold px-4 rounded-xl text-[11px] gap-2 transition-all shadow-lg"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 text-blue-300" />
              {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
            </Button>
            <Link href="/admin/book-loans/new">
              <Button className="bg-white hover:bg-slate-50 text-indigo-900 font-black px-6 py-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-[11px] gap-2 h-10">
                <Plus className="w-4 h-4 stroke-[3px]" />
                Lập phiếu mượn mới
              </Button>
            </Link>
          </div>
        </div>

        {/* RIGHT SECTION: STATISTICS (COMPACT) */}
        <div className="relative z-10 flex flex-wrap xl:flex-nowrap items-center gap-3">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 transition-all hover:bg-white/10 min-w-[150px]">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <LayoutDashboard className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <p className="text-[7px] text-indigo-300 uppercase font-black tracking-widest">THỐNG KÊ BẢN GHI</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg lg:text-xl font-black text-white">
                  {activeTab === 'reservations' ? (reservationsData?.data?.length || 0) : (loansData?.pagination?.totalItems || 0)} 
                </span>
                <span className="text-[8px] text-indigo-500 font-bold uppercase">Units</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-4 pt-6">
        {/* ── FILTER & TABS ROW ── */}
        <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
          <div className="flex flex-col lg:flex-row items-center gap-3 mb-4">
            <div className="w-full lg:flex-1 relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900" />
              <Input
                placeholder="Tìm bạn đọc, tên sách, mã vạch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 border-2 border-slate-100 bg-white focus:bg-white text-[11px] rounded-xl transition-all shadow-sm"
              />
            </div>
            
            <TabsList className="bg-slate-100 p-1 rounded-xl h-11 border border-slate-200 shrink-0">
              <TabsTrigger value="all" className="rounded-lg h-9 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm px-4 font-bold text-[10px] uppercase tracking-wider transition-all">Tất cả</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg h-9 data-[state=active]:bg-white data-[state=active]:text-slate-900 px-4 font-bold text-[10px] uppercase tracking-wider flex gap-2 transition-all">
                 Chờ duyệt
                 {loansData?.data?.some((i: any) => i.status === 'pending') && 
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                 }
              </TabsTrigger>
              <TabsTrigger value="borrowing" className="rounded-lg h-9 data-[state=active]:bg-white data-[state=active]:text-slate-900 px-4 font-bold text-[10px] uppercase tracking-wider">Lưu thông</TabsTrigger>
              <TabsTrigger value="overdue" className="rounded-lg h-9 data-[state=active]:bg-white data-[state=active]:text-red-600 px-4 font-bold text-[10px] uppercase tracking-wider">Quá hạn</TabsTrigger>
              <TabsTrigger value="returned" className="rounded-lg h-9 data-[state=active]:bg-white data-[state=active]:text-emerald-600 px-4 font-bold text-[10px] uppercase tracking-wider">Đã trả</TabsTrigger>
              <TabsTrigger value="reservations" className="rounded-lg h-9 data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-4 font-bold text-[10px] uppercase tracking-wider transition-all">Đặt giữ</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0 outline-none">
            {activeTab === 'reservations' ? (
              <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
                  <Table className="border-collapse">
                    <TableHeader className="bg-slate-50 border-b-2 border-slate-200">
                      <TableRow className="hover:bg-transparent h-11">
                        <TableHead className="font-black text-slate-800 pl-6 uppercase text-[10px] tracking-wider">Đối tượng chờ</TableHead>
                        <TableHead className="font-black text-slate-800 uppercase text-[10px] tracking-wider">Ấn phẩm giữ chỗ</TableHead>
                        <TableHead className="font-black text-slate-800 uppercase text-[10px] tracking-wider">Ngày đăng ký</TableHead>
                        <TableHead className="font-black text-slate-800 uppercase text-[10px] tracking-wider text-center">Độ ưu tiên</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100">
                      {isLoadingRes ? (
                         <TableRow><TableCell colSpan={4} className="py-16 text-center text-slate-400 text-xs font-medium">Đang truy xuất hàng đợi...</TableCell></TableRow>
                      ) : (reservationsData?.data || []).length === 0 ? (
                         <TableRow><TableCell colSpan={4} className="py-16 text-center text-slate-400 italic text-xs font-medium opacity-50">Không có yêu cầu đặt chỗ nào trong danh sách</TableCell></TableRow>
                      ) : (
                        reservationsData.data.map((res: any) => (
                          <TableRow key={res.id} className="hover:bg-slate-50/80 transition-all h-16">
                            <TableCell className="pl-6">
                             <div className="font-bold text-slate-800 uppercase text-[12px]">{res.readerName || res.member_name}</div>
                             <div className="text-[10px] text-slate-400 mt-0.5">
                               Card ID: <span className="font-mono text-indigo-500 font-bold">{res.cardNumber || res.member_card}</span>
                             </div>
                          </TableCell>
                            <TableCell className="font-bold text-slate-600 text-xs">{res.publicationName || res.book_title}</TableCell>
                            <TableCell className="text-slate-500 font-medium text-xs">{new Date(res.registerDate || res.requested_at).toLocaleDateString('vi-VN')}</TableCell>
                            <TableCell className="text-center pr-6">
                              <Badge className="bg-indigo-100 text-indigo-600 border-none px-3 py-0.5 rounded-full text-[9px] font-black uppercase">Ưu tiên</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
               </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
                <Table className="border-collapse">
                  <TableHeader className="bg-slate-50 border-b-2 border-slate-200">
                    <TableRow className="hover:bg-transparent h-11">
                      <TableHead className="w-[80px] font-black text-slate-500 pl-6 uppercase text-[9px] tracking-wider">Log ID</TableHead>
                      <TableHead className="font-black text-slate-800 uppercase text-[10px] tracking-wider px-4">Bạn đọc</TableHead>
                      <TableHead className="font-black text-slate-800 uppercase text-[10px] tracking-wider px-4">Ấn phẩm lưu thông</TableHead>
                      <TableHead className="font-black text-slate-800 uppercase text-[10px] tracking-wider px-4">Giai đoạn</TableHead>
                      <TableHead className="text-center font-black text-slate-800 uppercase text-[10px] tracking-wider px-4">Trạng thái</TableHead>
                      <TableHead className="text-right font-black text-slate-800 pr-8 uppercase text-[10px] tracking-wider">Nghiệp vụ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-20">
                           <div className="flex flex-col items-center gap-3">
                              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Synchronizing...</span>
                           </div>
                        </TableCell>
                      </TableRow>
                    ) : (loansData?.data || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-32">
                           <History className="w-16 h-16 mx-auto mb-3 text-slate-100" />
                           <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">No Records Found</span>
                        </TableCell>
                      </TableRow>
                    ) : (
                      loansData.data.map((item: any) => (
                        <TableRow key={item.id} className="group hover:bg-slate-50/80 transition-all h-20">
                          <TableCell className="font-mono text-[10px] font-bold text-slate-400 pl-6">#{item.id}</TableCell>
                          <TableCell className="px-4">
                            <div className="flex items-center gap-3">
                               <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm shrink-0">
                                  <span className="text-xs font-black">{(item.readerName || item.member_name || '?').charAt(0).toUpperCase()}</span>
                               </div>
                               <div>
                                  <div className="font-bold text-slate-800 uppercase text-[12px] tracking-tight line-clamp-1">{item.readerName || item.member_name || '-'}</div>
                                  <div className="text-[9px] font-bold text-slate-400 font-mono mt-0.5">{item.cardNumber || item.member_card || 'Chưa định danh'}</div>
                               </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4">
                            <div className="max-w-[250px]">
                               <div className="font-bold text-slate-800 line-clamp-1 text-xs">{item.publicationName || item.book_title || '-'}</div>
                               <div className="flex flex-wrap items-center gap-1 mt-1.5">
                                  {getMediaTypeBadge(item.media_type)}
                                  <Badge variant="outline" className="text-[8px] h-3.5 bg-slate-100 text-slate-600 border-slate-200 font-mono px-1 scale-90 origin-left">
                                    {item.barcode || item.copy_barcode || 'N/A'}
                                  </Badge>
                                  {Number(item.lateFee || item.late_fee || 0) > 0 && (
                                     <Badge className="text-[8px] h-3.5 bg-red-500 text-white border-none font-bold px-1 animate-pulse">
                                        Phạt: {Number(item.lateFee || item.late_fee).toLocaleString()}đ
                                     </Badge>
                                  )}
                               </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4">
                             <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                                   <Calendar className="w-3 h-3" />
                                   <span>{ (item.borrowDate || item.loan_date) ? new Date(item.borrowDate || item.loan_date).toLocaleDateString('vi-VN') : 'Pending' }</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-800">
                                   <Clock className="w-3 h-3 text-slate-400" />
                                   <span className={cn(item.status === 'overdue' && "text-red-500")}>
                                      Hạn: { (item.dueDate || item.due_date) ? new Date(item.dueDate || item.due_date).toLocaleDateString('vi-VN') : '-' }
                                   </span>
                                </div>
                             </div>
                          </TableCell>
                          <TableCell className="text-center">
                             <div className="scale-90">{getStatusBadge(item.status)}</div>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex gap-1 justify-end">
                              {item.status === 'pending' && (
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  className="h-8 bg-emerald-600 hover:bg-emerald-700 shadow-sm rounded-lg font-bold px-3 text-[10px]"
                                  onClick={() => handleApprove(item.id)}
                                  disabled={isApproving}
                                >
                                  Duyệt
                                </Button>
                              )}
                              {(item.status === 'borrowing' || item.status === 'overdue') && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-bold px-2 text-[10px]"
                                    onClick={() => {
                                      setSelectedLoan(item);
                                      setIsExtendModalOpen(true);
                                    }}
                                    disabled={isExtending}
                                  >
                                    Gia hạn
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    size="sm" 
                                    className={cn(
                                      "h-8 rounded-lg font-black px-2 text-[10px]",
                                      item.status === 'overdue' ? "bg-red-600 hover:bg-red-700" : "bg-slate-900 hover:bg-black"
                                    )}
                                    onClick={() => {
                                      setSelectedLoan(item);
                                      setIsReturnModalOpen(true);
                                    }}
                                    disabled={isReturning}
                                  >
                                    Trả sách
                                  </Button>
                                </>
                              )}
                              <div className="flex ml-1">
                                <Link href={`/admin/book-loans/${item.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                </Link>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(item.id)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {activeTab !== 'reservations' && loansData?.pagination && loansData.pagination.totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-t-2 border-slate-200 rounded-b-2xl shadow-sm mt-4">
                <p className="text-xs text-slate-500">
                  Trang <strong>{page}</strong> / {loansData.pagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="h-8 px-4 rounded-lg font-bold text-xs">
                    Trước
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= loansData.pagination.totalPages} onClick={() => setPage(page + 1)} className="h-8 px-4 rounded-lg font-bold text-xs">
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <ExtensionModal 
        isOpen={isExtendModalOpen}
        onClose={() => setIsExtendModalOpen(false)}
        loan={selectedLoan}
        onConfirm={handleConfirmExtend}
        isPending={isExtending}
      />

      <ReturnConfirmModal 
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        loan={selectedLoan}
        onConfirm={handleConfirmReturn}
        isPending={isReturning}
      />
    </div>
  );
}
