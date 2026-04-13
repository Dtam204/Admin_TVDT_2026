'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMembers } from '@/lib/hooks/useMembers';
import { useAdminPublications, useAdminPublicationDetail } from '@/lib/hooks/usePublications';
import { useRegisterBorrow, useCreateReservation } from '@/lib/hooks/useBookLoans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Search, User, Book, Barcode, Calendar, Save, Clock,
  CheckCircle2, AlertCircle, Monitor, BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/components/ui/utils';

// ─── Helper Badges ────────────────────────────────────────────────────────────
function MediaTypeBadge({ type }: { type?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    Physical: { label: '📖 Sách in', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Digital:  { label: '💻 Tài liệu số', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    Hybrid:   { label: '🔀 Tích hợp',   cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  };
  const cfg = map[type || 'Physical'] || map['Physical'];
  return <Badge variant="outline" className={`text-[9px] h-4 font-bold ${cfg.cls}`}>{cfg.label}</Badge>;
}

function AccessPolicyBadge({ policy }: { policy?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    public:   { label: '🌐 Công khai', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
    internal: { label: '🔒 Nội bộ',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    vip:      { label: '⭐ Premium',   cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  };
  const cfg = map[policy || 'public'] || map['public'];
  return <Badge variant="outline" className={`text-[9px] h-4 font-bold ${cfg.cls}`}>{cfg.label}</Badge>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function LoanForm() {
  const router = useRouter();

  const [memberSearch, setMemberSearch] = useState('');
  const [bookSearch, setBookSearch]     = useState('');

  const [selectedMember, setSelectedMember]   = useState<any>(null);
  const [selectedBookId, setSelectedBookId]   = useState<string | null>(null);
  const [selectedBookInfo, setSelectedBookInfo] = useState<any>(null);
  const [selectedCopy, setSelectedCopy]       = useState<any>(null);
  const [notes, setNotes]                     = useState('');
  const [directBorrow, setDirectBorrow]       = useState(true);

  const { data: membersData, isLoading: isLoadingMembers }   = useMembers({ search: memberSearch, limit: 5 });
  const { data: booksData,   isLoading: isLoadingBooks }     = useAdminPublications({ searchQuery: bookSearch, pageSize: 5 });
  const { data: bookDetail,  isLoading: isLoadingDetail }    = useAdminPublicationDetail(selectedBookId || '');

  const { mutate: register, isPending } = useRegisterBorrow();
  const { mutate: reserve,  isPending: isReserving } = useCreateReservation();

  // ─── Derived state ───────────────────────────────────────────────────────
  // Merge dữ liệu: ưu tiên bookDetail (đầy đủ) fallback về selectedBookInfo (tạm từ dropdown)
  const selectedPub = bookDetail?.data?.publication ?? bookDetail?.data ?? null;
  const copies: any[] = bookDetail?.data?.copies ?? [];
  const pubData      = selectedPub || selectedBookInfo;
  const mediaType    = pubData?.media_type || selectedBookInfo?.media_type || 'Physical';
  const accessPolicy = pubData?.access_policy || selectedBookInfo?.access_policy || 'public';
  const isCeased     = pubData?.cooperation_status === 'ceased_cooperation';

  // Tài liệu Digital thuần — không cần form mượn vật lý
  const isDigitalOnly = mediaType === 'Digital';

  const availableCopies = copies.filter((c: any) =>
    c.status === 'available' || c.status === 'tại kho' || c.status === 'Khả dụng'
  );

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleSelectBook = (b: any) => {
    setSelectedBookId(b.id.toString());
    setSelectedBookInfo(b);
    setBookSearch('');
    setSelectedCopy(null);
  };

  const handleReserve = () => {
    if (!selectedMember) return toast.error('Vui lòng chọn thành viên');
    if (!selectedBookId) return toast.error('Vui lòng chọn ấn phẩm');
    reserve({ readerId: selectedMember.id, publicationId: selectedBookId, notes }, {
      onSuccess: () => { toast.success('Đã đăng ký hàng đợi thành công!'); router.push('/admin/book-loans'); }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return toast.error('Vui lòng chọn thành viên');
    if (isCeased)        return toast.error('Ấn phẩm đang Ngưng hợp tác — không thể mượn');
    if (isDigitalOnly)   return toast.error('Tài liệu số — không cần phiếu mượn. Truy cập trực tiếp từ trang chi tiết.');
    if (!selectedCopy)   return toast.error('Vui lòng chọn bản sao trước khi tạo phiếu');

    register({
      readerId:      selectedMember.id,
      copyId:        selectedCopy.id,
      barcode:       selectedCopy.barcode,
      publicationId: selectedBookId,
      notes,
      directBorrow,
      mediaType,
    }, {
      onSuccess: () => {
        toast.success(directBorrow ? 'Đã cho mượn sách thành công!' : 'Đã tạo yêu cầu mượn thành công!');
        router.push('/admin/book-loans');
      },
      onError: (err: any) => toast.error(err.message || 'Lỗi khi tạo phiếu mượn'),
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-12 gap-8">

        {/* ── CỘT TRÁI: Thành viên + Ấn phẩm (7/12) ── */}
        <div className="col-span-12 lg:col-span-7 space-y-6">

          {/* BƯỚC 1: Chọn thành viên */}
          <Card className="p-6 border-none shadow-xl rounded-2xl bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">1. Thông tin Bạn đọc</h3>
                <p className="text-xs text-slate-400">Tìm theo tên hoặc email</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Tìm theo tên hoặc email thành viên..."
                  className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all"
                  value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
              </div>

              {isLoadingMembers && <div className="py-2 text-center text-xs text-slate-400">Đang tìm kiếm...</div>}

              {memberSearch && !isLoadingMembers && (membersData?.data || []).length > 0 && (
                <div className="rounded-xl border border-slate-100 overflow-hidden bg-white shadow-lg">
                  {membersData.data.map((m: any) => (
                    <div key={m.id}
                      className={cn("p-3 flex items-center justify-between cursor-pointer hover:bg-indigo-50 transition-colors border-b last:border-0 border-slate-50",
                        selectedMember?.id === m.id && "bg-indigo-50")}
                      onClick={() => { setSelectedMember(m); setMemberSearch(''); }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                          {(m.full_name || '?').charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-700">{m.full_name}</div>
                          <div className="text-[10px] text-slate-500">{m.email}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px]">{m.card_number || 'No Card'}</Badge>
                    </div>
                  ))}
                </div>
              )}

              {selectedMember && (
                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg">
                      {(selectedMember.full_name || '?').charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-indigo-900">{selectedMember.full_name}</div>
                      <div className="text-xs text-indigo-600">SĐT: {selectedMember.phone || 'Chưa cập nhật'}</div>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" className="text-indigo-400 hover:text-red-500"
                    onClick={() => setSelectedMember(null)}>Thay đổi</Button>
                </div>
              )}
            </div>
          </Card>

          {/* BƯỚC 2: Chọn ấn phẩm */}
          <Card className="p-6 border-none shadow-xl rounded-2xl bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                <Book className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">2. Chọn Ấn phẩm cần mượn</h3>
                <p className="text-xs text-slate-400">Tìm sách cần đăng ký mượn bản in</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Tìm theo tên sách..."
                  className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all"
                  value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} />
              </div>

              {isLoadingBooks && <div className="py-2 text-center text-xs text-slate-400">Đang tìm kiếm...</div>}

              {bookSearch && !isLoadingBooks && (booksData?.data || []).length > 0 && (
                <div className="rounded-xl border border-slate-100 overflow-hidden bg-white shadow-lg">
                  {booksData.data.map((b: any) => {
                    const title = typeof b.title === 'object'
                      ? (Object.values(b.title).find((v: any) => typeof v === 'string' && v.trim()) || 'Chưa có tiêu đề')
                      : (b.title || 'Chưa có tiêu đề');
                    return (
                      <div key={b.id}
                        className={cn("p-3 flex items-center gap-3 cursor-pointer hover:bg-orange-50 transition-colors border-b last:border-0 border-slate-50",
                          selectedBookId === b.id.toString() && "bg-orange-50")}
                        onClick={() => handleSelectBook(b)}>
                        <div className="w-10 h-14 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                          {b.thumbnail ? <img src={b.thumbnail} className="w-full h-full object-cover" /> : <Book className="w-full h-full p-2 text-slate-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-700 line-clamp-1">{title}</div>
                          <div className="text-[10px] text-slate-500 mb-1">{b.author || 'Không rõ tác giả'}</div>
                          <div className="flex gap-1">
                            <MediaTypeBadge type={b.media_type} />
                            <AccessPolicyBadge policy={b.access_policy} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sách đã chọn — hiển thị ngay từ selectedBookInfo */}
              {selectedBookId && (selectedBookInfo || selectedPub) && (() => {
                const title = typeof pubData?.title === 'object'
                  ? (Object.values(pubData.title).find((v: any) => typeof v === 'string' && v.trim()) || pubData?.name || 'Đang tải...')
                  : (pubData?.title || pubData?.name || 'Đang tải...');
                const thumbnail = pubData?.thumbnail || pubData?.cover_image || '';
                return (
                  <div className="space-y-3 animate-in slide-in-from-top-2">
                    {/* ── Cảnh báo Ngưng hợp tác ── */}
                    {isCeased && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-red-700">Ấn phẩm đang Ngưng hợp tác</p>
                          <p className="text-[10px] text-red-500 mt-0.5">Không thể tạo phiếu mượn mới.</p>
                        </div>
                      </div>
                    )}

                    {/* ── Thông báo Digital — không cần form ── */}
                    {isDigitalOnly && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                        <Monitor className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-blue-800">Tài liệu số — Không cần phiếu mượn</p>
                          {accessPolicy === 'vip' ? (
                            <p className="text-xs text-blue-600 mt-1">
                              Tài liệu <strong>Premium</strong>. Người đọc cần tài khoản Premium để truy cập trực tiếp từ ứng dụng.
                            </p>
                          ) : (
                            <p className="text-xs text-blue-600 mt-1">
                              Người đọc truy cập trực tiếp từ trang chi tiết ấn phẩm — không qua quầy thủ thư.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Card chi tiết sách ── */}
                    <div className={cn("p-4 rounded-xl border flex items-start gap-4",
                      isCeased ? "bg-red-50/30 border-red-100 opacity-60" : "bg-slate-50/50 border-slate-100")}>
                      <div className="w-16 h-24 rounded shadow-sm overflow-hidden bg-white flex-shrink-0 border border-slate-200">
                        {thumbnail ? <img src={thumbnail} className="w-full h-full object-cover" /> : <Book className="w-full h-full p-3 text-slate-300" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 leading-tight mb-1">{title}</h4>
                        <p className="text-xs text-slate-500 mb-3">{pubData?.author}</p>
                        <div className="flex flex-wrap gap-1.5">
                          <MediaTypeBadge type={mediaType} />
                          <AccessPolicyBadge policy={accessPolicy} />
                          {isLoadingDetail && <span className="text-[9px] text-slate-400 italic">Đang tải...</span>}
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="sm"
                        className="text-slate-400 hover:text-red-500 flex-shrink-0"
                        onClick={() => { setSelectedBookId(null); setSelectedBookInfo(null); setSelectedCopy(null); }}>
                        Gỡ bỏ
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </Card>
        </div>

        {/* ── CỘT PHẢI: Bản sao + Xác nhận (5/12) ── */}
        <div className="col-span-12 lg:col-span-5">
          <Card className={cn("p-6 border-none shadow-xl rounded-2xl bg-white/80 backdrop-blur-sm flex flex-col h-full transition-opacity",
            !selectedBookId && "opacity-40 pointer-events-none")}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Barcode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">3. Chọn bản sao</h3>
                <p className="text-xs text-slate-400">
                  {isDigitalOnly ? 'Không áp dụng với tài liệu số' : 'Chọn bản sao vật lý khả dụng'}
                </p>
              </div>
            </div>

            {/* Nếu là Digital thuần — ẩn danh sách bản sao */}
            {isDigitalOnly ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <Monitor className="w-10 h-10 text-blue-400" />
                </div>
                <p className="text-sm font-bold text-slate-600 mb-1">Tài liệu số</p>
                <p className="text-xs text-slate-400 max-w-[200px]">
                  {accessPolicy === 'vip'
                    ? 'Người đọc cần tài khoản Premium để truy cập.'
                    : 'Người đọc truy cập trực tiếp không cần mượn.'}
                </p>
              </div>
            ) : (
              /* Physical / Hybrid — Danh sách bản sao */
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] pr-1">
                {isLoadingDetail ? (
                  <div className="py-20 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    Đang quét bản sao...
                  </div>
                ) : !selectedBookId ? (
                  <div className="py-16 text-center text-slate-300">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Hãy chọn ấn phẩm trước</p>
                  </div>
                ) : copies.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 px-6">
                    <AlertCircle className="w-10 h-10 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">Không có bản sao vật lý nào</p>
                    <p className="text-xs mt-1 text-slate-300">Ấn phẩm này chưa có bản in được đăng ký</p>
                  </div>
                ) : availableCopies.length === 0 ? (
                  <div className="py-10 text-center px-6 animate-in fade-in zoom-in-95">
                    <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-orange-400" />
                    </div>
                    <h4 className="font-bold text-slate-700 mb-2">Tất cả bản sao đang bận</h4>
                    <p className="text-sm text-slate-500 mb-4">Không có bản sao nào sẵn sàng.</p>
                    <Button type="button" className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-10"
                      onClick={handleReserve} disabled={isReserving}>
                      {isReserving ? 'Đang đăng ký...' : '⏳ Đặt giữ chỗ trong hàng đợi'}
                    </Button>
                  </div>
                ) : (
                  copies.map((copy: any) => {
                    const isAvail = copy.status === 'available' || copy.status === 'tại kho' || copy.status === 'Khả dụng';
                    return (
                      <div key={copy.id}
                        onClick={() => isAvail && setSelectedCopy(copy)}
                        className={cn("p-4 rounded-xl border-2 transition-all relative",
                          selectedCopy?.id === copy.id ? "border-emerald-500 bg-emerald-50 shadow-md" :
                          isAvail ? "border-slate-100 bg-white hover:border-emerald-200 hover:shadow-sm cursor-pointer" :
                          "border-slate-50 bg-slate-50/50 opacity-50 cursor-not-allowed")}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Barcode className={cn("w-4 h-4", selectedCopy?.id === copy.id ? "text-emerald-600" : "text-slate-400")} />
                            <span className="text-sm font-bold font-mono tracking-wider">{copy.barcode}</span>
                          </div>
                          <Badge className={cn("text-[9px] h-5", isAvail ? "bg-emerald-500" : "bg-slate-300")}>
                            {isAvail ? 'Khả dụng' : copy.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Bản số: <strong className="text-slate-700">{copy.copy_number}</strong></span>
                          {copy.storage_name && <span>Kệ: <strong className="text-slate-700">{copy.storage_name}</strong></span>}
                        </div>
                        {!isAvail && (
                          <Button type="button" variant="ghost" size="sm"
                            className="absolute right-2 top-2 h-6 px-2 text-[9px] text-orange-600 hover:bg-orange-50"
                            onClick={(e) => { e.stopPropagation(); handleReserve(); }} disabled={isReserving}>
                            <Clock className="w-2.5 h-2.5 mr-1" />Đặt chỗ
                          </Button>
                        )}
                        {selectedCopy?.id === copy.id && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── Phần dưới: Ghi chú + Nút Submit ── */}
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">Ghi chú</Label>
                <Textarea placeholder="Tình trạng sách khi mượn, yêu cầu đặc biệt..."
                  className="rounded-xl bg-slate-50 border-slate-100 min-h-[70px] resize-none text-sm"
                  value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              {/* Chỉ hiện tùy chọn duyệt trực tiếp nếu không phải Digital */}
              {!isDigitalOnly && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/30 border border-indigo-100">
                  <div>
                    <span className="text-sm font-bold text-indigo-900">Duyệt trực tiếp</span>
                    <div className="text-[10px] text-indigo-500">Bỏ qua bước phê duyệt</div>
                  </div>
                  <input type="checkbox" className="w-5 h-5 accent-indigo-600 cursor-pointer"
                    checked={directBorrow} onChange={(e) => setDirectBorrow(e.target.checked)} />
                </div>
              )}

              {!isDigitalOnly && (
                <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase">Hạn trả dự kiến</span>
                  </div>
                  <div className="text-sm font-black text-slate-800">
                    {directBorrow ? '14 ngày từ hôm nay' : '14 ngày kể từ khi Duyệt'}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl"
                  onClick={() => router.back()}>Hủy bỏ</Button>
                <Button type="submit"
                  className={cn("flex-[2] h-12 rounded-xl font-bold shadow-lg",
                    isDigitalOnly
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                  )}
                  disabled={isPending || !selectedMember || isCeased || isDigitalOnly}>
                  {isPending ? 'Đang xử lý...' : (
                    <div className="flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" />
                      {isDigitalOnly ? 'Không cần phiếu mượn' : 'Tạo phiếu Mượn sách in'}
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
