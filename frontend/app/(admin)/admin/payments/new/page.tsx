'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMembers, useMember } from '@/lib/hooks/useMembers';
import { useCreateTransaction } from '@/lib/hooks/usePayments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, ArrowLeft, Search, User, Wallet, History, 
  Loader2, Landmark, Smartphone, Banknote, ShieldCheck, 
  Zap, QrCode, TrendingUp, Info, CheckCircle2, Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/components/ui/utils';

function TransactionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const memberIdParam = searchParams.get('memberId');
  
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [formData, setFormData] = useState({
    amount: '',
    transaction_type: 'deposit',
    description: '',
    payment_method: 'bank_transfer',
    gateway: 'MB BANK',
    external_txn_id: '',
  });

  const { data: membersData, isLoading: isLoadingMembers } = useMembers({ search: memberSearch, limit: 5 });
  const { data: memberDetail, isLoading: isLoadingDetail } = useMember(memberIdParam ? parseInt(memberIdParam) : 0);
  const { mutate: createTransaction, isPending } = useCreateTransaction();

  // OFFICIAL BANKING INFO
  const BANK_ID = 'MB'; 
  const ACCOUNT_NO = '0365930433'; 
  const ACCOUNT_NAME = 'LE DUC TAM';

  useEffect(() => {
    if (memberDetail?.data && !selectedMember) {
      setSelectedMember(memberDetail.data);
    }
  }, [memberDetail, selectedMember]);

  const qrUrl = useMemo(() => {
    if (formData.payment_method !== 'bank_transfer') return null;
    const amount = formData.amount || '0';
    const content = `NAP ${selectedMember?.card_number || 'TV'}`;
    // VietQR Compact 2 Template
    return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
  }, [formData.payment_method, formData.amount, selectedMember]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép vào bộ nhớ tạm');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return toast.error('Vui lòng chọn hội viên');
    if (!formData.amount || parseFloat(formData.amount) <= 0) return toast.error('Số tiền không hợp lệ');

    createTransaction({
      member_id: selectedMember.id,
      amount: parseFloat(formData.amount),
      transaction_type: formData.transaction_type,
      description: formData.description || (formData.transaction_type === 'deposit' ? 'Nạp quỹ thư viện' : 'Trừ tiền tài khoản'),
      payment_method: formData.payment_method,
      gateway: formData.payment_method === 'bank_transfer' ? formData.gateway : null,
      external_txn_id: formData.external_txn_id || null,
    }, {
      onSuccess: () => {
        toast.success('Giao dịch đã được tạo thành công');
        router.push('/admin/payments');
      },
      onError: (err: any) => toast.error(err.message || 'Lỗi khi tạo giao dịch'),
    });
  };

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] pb-20 font-sans">
      {/* ── PROFESSIONAL COMPACT HEADER ── */}
      <div className="bg-white border-b px-6 py-3 md:px-10 flex items-center justify-between shadow-sm sticky top-0 z-50 backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-slate-100 h-9 w-9">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Tạo Giao Dịch
              <Badge className="bg-indigo-600 text-white border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-md shadow-lg shadow-indigo-200">PRO</Badge>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Direct Transaction Suite</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 italic font-black text-[9px]">
           <ShieldCheck className="w-3.5 h-3.5" /> SECURE HUB
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ── LEFT: MAIN FORM (COL-7) ── */}
          <div className="lg:col-span-7 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* STEP 1: MEMBER SELECTION */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 mb-1 px-1">
                 <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">01</div>
                 <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">Xác định Hội viên</h2>
              </div>
              
              {!selectedMember ? (
                <Card className="border-2 border-slate-200 shadow-none overflow-hidden focus-within:border-indigo-600 transition-all rounded-2xl">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Tìm Tên hội viên hoặc Mã thẻ..." 
                      className="pl-12 h-14 border-none text-[13px] font-medium bg-white focus-visible:ring-0"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                    />
                  </div>
                  {isLoadingMembers && (
                    <div className="p-3 border-t flex items-center gap-2 text-slate-400 italic text-[11px]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sedicating Financial Data...
                    </div>
                  )}
                  {memberSearch && membersData?.data?.length > 0 && (
                    <div className="border-t divide-y bg-slate-50/20">
                       {membersData.data.map((m: any) => (
                         <div 
                          key={m.id} 
                          className="p-3.5 flex items-center justify-between hover:bg-white cursor-pointer transition-all group/item"
                          onClick={() => { setSelectedMember(m); setMemberSearch(''); }}
                         >
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg group-hover/item:scale-105 transition-transform">
                                  {m.full_name?.charAt(0).toUpperCase()}
                               </div>
                               <div>
                                  <p className="font-black text-slate-900 uppercase text-[12px]">{m.full_name}</p>
                                  <p className="text-[10px] font-bold text-indigo-500 font-mono tracking-tighter uppercase">{m.card_number}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[11px] font-black text-slate-900">{m.balance?.toLocaleString()}đ</p>
                               <p className="text-[8px] text-slate-400 font-black uppercase">Balance</p>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
                </Card>
              ) : (
                <div className="p-5 rounded-[1.5rem] bg-indigo-950 text-white shadow-xl shadow-indigo-100 flex items-center justify-between relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                      <User className="w-20 h-20" />
                   </div>
                   <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl font-black text-white shadow-2xl">
                         {selectedMember.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-0.5">Selected Member</p>
                         <h3 className="text-lg font-black tracking-tight uppercase leading-none mb-1">{selectedMember.full_name}</h3>
                         <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-indigo-300 font-mono tracking-tighter italic">{selectedMember.card_number}</span>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[8px] font-black h-4">VIP</Badge>
                         </div>
                      </div>
                   </div>
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    className="relative z-10 bg-white/5 hover:bg-white/10 text-white font-black text-[9px] uppercase rounded-xl h-8 px-3"
                    onClick={() => setSelectedMember(null)}
                   >
                     ĐỔI HỘI VIÊN
                   </Button>
                </div>
              )}
            </section>

            {/* STEP 2: PAYMENT METHOD & TYPE */}
            <section className="space-y-4">
               <div className="flex items-center gap-2.5 mb-1 px-1">
                 <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">02</div>
                 <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">Phương thức & Nghiệp vụ</h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                     <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Loại Nghiệp Vụ</Label>
                     <Select 
                        value={formData.transaction_type} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, transaction_type: v }))}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-2 border-slate-100 bg-white shadow-sm font-black text-[12px] text-slate-700 focus:border-indigo-600 transition-all">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-2xl border-slate-100">
                          <SelectItem value="deposit" className="py-2.5 font-bold text-indigo-600">Nạp quỹ (Wallet Deposit)</SelectItem>
                          <SelectItem value="withdrawal" className="py-2.5 font-bold text-rose-600">Chi tiền (Debit)</SelectItem>
                          <SelectItem value="fee" className="py-2.5 font-bold">Phí & Phạt (Service Fee)</SelectItem>
                          <SelectItem value="refund" className="py-2.5 font-bold text-emerald-600">Hoàn dư (Internal Refund)</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>

                  <div className="space-y-2">
                     <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Hình thức thanh toán</Label>
                     <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'cash', label: 'TIỀN MẶT', icon: Banknote },
                          { id: 'bank_transfer', label: 'NGÂN HÀNG', icon: Landmark },
                          { id: 'momo', label: 'MOMO', icon: Smartphone }
                        ].map((item) => {
                          const Icon = item.icon;
                          const isActive = formData.payment_method === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, payment_method: item.id }))}
                              className={cn(
                                "flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border-2 transition-all",
                                isActive 
                                  ? `border-indigo-600 bg-indigo-50/50` 
                                  : "border-slate-100 bg-white hover:border-slate-300"
                              )}
                            >
                               <Icon className={cn("w-4 h-4", isActive ? "text-indigo-600" : "text-slate-400")} />
                               <span className={cn("text-[8px] font-black uppercase tracking-tight", isActive ? "text-indigo-700" : "text-slate-500")}>
                                 {item.label}
                               </span>
                            </button>
                          );
                        })}
                     </div>
                  </div>
               </div>

               {formData.payment_method === 'bank_transfer' && (
                 <div className="p-5 rounded-2xl bg-blue-50/50 border-2 border-blue-100/50 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in zoom-in-95 duration-300">
                    <div className="space-y-1.5">
                       <Label className="text-[9px] font-black text-blue-600 uppercase italic">Bank Reference ID</Label>
                       <Input 
                        placeholder="Mã GD Ngân hàng (FT...)" 
                        className="h-11 rounded-lg border-blue-200 focus:border-blue-500 font-mono font-bold text-[12px] bg-white"
                        value={formData.external_txn_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, external_txn_id: e.target.value }))}
                       />
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[9px] font-black text-blue-600 uppercase italic">Gateway</Label>
                       <Select 
                        value={formData.gateway} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, gateway: v }))}
                       >
                         <SelectTrigger className="h-11 rounded-lg border-blue-200 bg-white font-bold text-[12px]">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="MB BANK" className="font-bold">MB BANK (QR SEPAY)</SelectItem>
                            <SelectItem value="TECHCOMBANK" className="font-bold">Techcombank</SelectItem>
                            <SelectItem value="VIETCOMBANK" className="font-bold">Vietcombank</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                 </div>
               )}
            </section>

            {/* STEP 3: AMOUNT & NOTES */}
            <section className="space-y-4">
               <div className="flex items-center gap-2.5 mb-1 px-1">
                 <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">03</div>
                 <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">Nội dung Giao dịch</h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  <div className="md:col-span-4 space-y-2">
                     <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Số tiền (VNĐ)</Label>
                     <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="0" 
                          className="h-14 rounded-xl border-2 border-slate-100 bg-white text-xl font-black text-slate-900 focus:border-indigo-600 transition-all pr-8 text-center"
                          value={formData.amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase">đ</span>
                     </div>
                  </div>
                  <div className="md:col-span-8 space-y-2">
                     <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Ghi chú nghiệp vụ</Label>
                     <Input
                       placeholder="VD: Nạp tiền học phí kì 2..." 
                       className="h-14 rounded-xl border-2 border-slate-100 bg-white font-bold text-[12px] focus:border-indigo-600 transition-all shadow-none"
                       value={formData.description}
                       onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                     />
                  </div>
               </div>
            </section>
          </div>

          {/* ── RIGHT: COMPACT PREVIEW & QR (COL-5) ── */}
          <div className="lg:col-span-5 space-y-5">
            <div className="sticky top-20 space-y-5">
               
               {/* MINI PREVIEW CARD */}
               <Card className="border-0 shadow-lg rounded-[1.5rem] overflow-hidden bg-slate-950 text-white p-6 relative group">
                  <TrendingUp className="absolute -right-4 -bottom-4 w-20 h-20 text-white/5 group-hover:scale-110 transition-transform duration-700" />
                  
                  <div className="flex justify-between items-center mb-6">
                     <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-600 text-white text-[7px] font-black px-1.5 py-0">LIVE</Badge>
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Transaction Cloud</span>
                     </div>
                     <Zap className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500 animate-pulse" />
                  </div>

                  <div className="space-y-4 relative z-10">
                     <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Current</span>
                        <span className="text-sm font-black">{selectedMember?.balance?.toLocaleString() || 0}đ</span>
                     </div>
                     <div className="flex justify-between items-baseline border-b border-white/5 pb-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Input</span>
                        <span className={cn("text-xl font-black", formData.transaction_type === 'deposit' ? 'text-emerald-400' : 'text-rose-400')}>
                           {formData.transaction_type === 'deposit' ? '+' : '-'}{parseFloat(formData.amount || '0').toLocaleString()}đ
                        </span>
                     </div>
                     <div className="flex justify-between items-center pt-1">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Post-Balance</span>
                        <span className="text-2xl font-black tracking-tighter">
                           {((selectedMember?.balance || 0) + (formData.transaction_type === 'deposit' ? Math.abs(parseFloat(formData.amount || '0')) : -Math.abs(parseFloat(formData.amount || '0')))).toLocaleString()}đ
                        </span>
                     </div>
                  </div>
               </Card>

               {/* COMPACT QR VIEWER (FOR BANKING) */}
               {qrUrl && (
                 <div className="p-5 rounded-[1.8rem] bg-white border border-slate-200 shadow-xl space-y-4 animate-in slide-in-from-right-4 duration-500 text-center">
                    <div className="flex items-center justify-center gap-2 text-indigo-600 mb-2">
                       <QrCode className="w-4 h-4" />
                       <span className="text-[10px] font-black uppercase tracking-widest">VietQR Standard Service</span>
                    </div>
                    
                    <div className="w-[180px] h-[180px] bg-white rounded-2xl mx-auto p-1 border-2 border-indigo-50 relative group overflow-hidden shadow-inner">
                       <img src={qrUrl} alt="Bank QR" className="w-full h-full object-contain" />
                    </div>

                    <div className="space-y-1 pb-1">
                       <p className="text-[13px] font-black text-slate-950 uppercase tracking-tight">{ACCOUNT_NAME}</p>
                       <p className="text-[11px] font-bold text-indigo-600 font-mono tracking-tighter flex items-center justify-center gap-1.5 group/copy cursor-pointer hover:underline" onClick={() => handleCopy(ACCOUNT_NO)}>
                          {ACCOUNT_NO} <Copy className="w-3 h-3 text-slate-300 group-hover/copy:text-indigo-600" />
                       </p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between cursor-pointer group/memo hover:bg-indigo-50 transition-all" onClick={() => handleCopy(`NAP ${selectedMember?.card_number}`)}>
                       <div className="text-left">
                          <p className="text-[7px] font-black text-slate-400 uppercase leading-none mb-0.5 tracking-widest">SePay Format</p>
                          <p className="text-[11px] font-black text-slate-800 font-mono leading-none tracking-tighter uppercase whitespace-nowrap">NAP {selectedMember?.card_number || 'ST-GUEST'}</p>
                       </div>
                       <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm opacity-0 group-hover/memo:opacity-100 transition-opacity">
                          <Check className="w-3.5 h-3.5" />
                       </div>
                    </div>
                 </div>
               )}

               <div className="grid grid-cols-1 gap-3">
                  <Button 
                    className="h-16 rounded-[1.2rem] bg-indigo-600 hover:bg-slate-900 text-white font-black text-lg shadow-xl shadow-indigo-100 group transition-all active:scale-95 border-none"
                    onClick={handleCreate}
                    disabled={isPending || !selectedMember}
                  >
                    {isPending ? (
                       <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                       <div className="flex flex-col items-center leading-none">
                         <span className="text-base">XÁC NHẬN NGAY</span>
                         <span className="text-[9px] text-indigo-200 mt-1 uppercase tracking-widest group-hover:block hidden">Ready to Transact</span>
                       </div>
                    )}
                  </Button>
                  <p className="text-[10px] text-slate-400 text-center font-bold px-4 leading-relaxed group">
                    <Info className="w-3.5 h-3.5 inline mr-1 text-indigo-400" />
                    Bấm xác nhận để cập nhật số dư Hội viên. Giao dịch này sẽ được lưu dấu (Audited) 100%.
                  </p>
               </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center bg-white min-h-screen font-sans">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <span className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] animate-pulse">Syncing Banking Core...</span>
    </div>}>
      <TransactionForm />
    </Suspense>
  );
}
