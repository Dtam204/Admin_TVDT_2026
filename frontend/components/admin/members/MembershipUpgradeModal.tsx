'use client';

import { useState, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMembershipPlans } from '@/lib/hooks/useMembershipPlans';
import { useUpgradeMember } from '@/lib/hooks/useMembers';
import { toast } from 'sonner';
import { 
  Crown, CreditCard, Banknote, Landmark, Loader2, 
  Zap, QrCode, ShieldCheck, Copy, Smartphone, Wallet 
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { Badge } from '@/components/ui/badge';

interface MembershipUpgradeModalProps {
  member: any;
  isOpen: boolean;
  onClose: () => void;
}

export function MembershipUpgradeModal({ member, isOpen, onClose }: MembershipUpgradeModalProps) {
  const [planId, setPlanId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [referenceId, setReferenceId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [manualDays, setManualDays] = useState<number | ''>('');

  const { data: plansData, isLoading: isLoadingPlans } = useMembershipPlans();
  const { mutate: upgradeMember, isPending } = useUpgradeMember();

  // OFFICIAL BANKING INFO
  const BANK_ID = 'MB'; 
  const ACCOUNT_NO = '0365930433'; 
  const ACCOUNT_NAME = 'LE DUC TAM';

  const selectedPlan = plansData?.data?.find((p: any) => p.id.toString() === planId);

  const qrUrl = useMemo(() => {
    if (paymentMethod !== 'bank' || !selectedPlan) return null;
    const amount = selectedPlan.price || '0';
    const content = `VIP ${member?.card_number || 'ST'}`;
    return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
  }, [paymentMethod, selectedPlan, member]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép');
  };

  const handleUpgrade = () => {
    if (!planId) {
      toast.error('Vui lòng chọn gói hội viên');
      return;
    }

    upgradeMember({
      id: member.id,
      data: {
        planId: parseInt(planId),
        paymentMethod,
        referenceId,
        notes,
        manual_days: manualDays === '' ? 0 : Number(manualDays)
      }
    }, {
      onSuccess: (res: any) => {
        toast.success(res.message || `Đã nâng cấp VIP thành công`);
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.message || 'Lỗi khi nâng cấp VIP');
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[620px] w-full border-none shadow-2xl overflow-hidden p-0 bg-white rounded-2xl mx-auto font-sans">
        
        {/* COMPACT HEADER */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-black p-3 sm:p-4 text-white relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl opacity-30" />
          <DialogHeader className="relative z-10 flex-row items-center gap-3 space-y-0">
            <div className="p-2 bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl shrink-0">
              <Crown className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            </div>
            <div>
              <DialogTitle className="text-xs font-black tracking-tight text-white uppercase italic leading-none">VIP UPGRADE HUB</DialogTitle>
              <DialogDescription className="text-indigo-200/40 font-bold text-[7px] uppercase tracking-[0.2em] mt-0.5 flex items-center gap-1.5 opacity-60">
                 <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" /> Pro Subscription Suite
              </DialogDescription>
            </div>
          </DialogHeader>
        </div>

        <div className="p-0 max-h-[80vh] overflow-hidden flex flex-col md:flex-row">
          {/* LEFT: ULTRA COMPACT FORM */}
          <div className="flex-1 p-4 sm:p-5 space-y-3.5 overflow-y-auto border-r border-slate-50">
            {/* Minimal Member Summary */}
            <div className="flex items-center gap-2.5 p-2.5 bg-slate-50/50 border border-slate-100 rounded-xl">
               <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black shrink-0 text-[10px] shadow-sm">
                  {((member?.full_name || member?.reader_name || '?').charAt(0)).toUpperCase()}
               </div>
               <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-slate-800 text-[10px] uppercase tracking-tight truncate">{member?.full_name || member?.reader_name}</div>
                  <div className="text-[8px] font-bold text-slate-400 font-mono tracking-tighter uppercase opacity-70">ID: {member?.card_number}</div>
               </div>
               <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-none text-[6px] font-black h-3.5 px-1">AUTO-SYNC</Badge>
            </div>

            <div className="space-y-3.5">
               {/* Selection Grid */}
               <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-12 flex justify-between items-center mb-1 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-3 h-3 text-indigo-600" />
                      <span className="text-[9px] font-black uppercase text-indigo-900 tracking-widest">Ví Hội Viên</span>
                    </div>
                    <span className={cn(
                      "text-[11px] font-black",
                      (member?.balance || 0) > 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {Number(member?.balance || 0).toLocaleString()}đ
                    </span>
                  </div>

                  <div className="sm:col-span-8 space-y-1">
                    <Label className="text-[8px] font-black uppercase text-slate-400 tracking-widest pl-1 opacity-70">Gói Hội Viên</Label>
                    <Select value={planId} onValueChange={setPlanId}>
                      <SelectTrigger className="h-8 rounded-lg border border-slate-200 bg-white font-bold text-slate-800 focus:border-indigo-600 transition-all text-[10px] shadow-sm px-2">
                        <SelectValue placeholder={isLoadingPlans ? "Đang tải..." : "Chọn gói..."} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-2xl max-h-[150px]">
                        {plansData?.data?.map((plan: any) => (
                          <SelectItem key={plan.id} value={plan.id.toString()} className="font-bold py-2">
                            <div className="flex justify-between items-center w-full min-w-[200px]">
                              <span className="text-[9px] uppercase tracking-tight">{plan.name?.vi || plan.name}</span>
                              <span className="text-[9px] text-indigo-600 font-black ml-4">{Number(plan.price).toLocaleString()}đ</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-[8px] font-black uppercase text-slate-400 tracking-widest pl-1 opacity-70">Tặng (+) </Label>
                    <div className="relative">
                      <Input 
                        type="number"
                        placeholder="0" 
                        value={manualDays}
                        onChange={(e) => setManualDays(e.target.value === '' ? '' : Number(e.target.value))}
                        className="h-8 rounded-lg border border-slate-200 font-black text-center pr-6 text-[10px] focus:border-indigo-600 transition-all no-spinner shadow-sm"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[7px] font-black text-slate-200 uppercase italic">d</span>
                    </div>
                  </div>
               </div>

               {/* Balance Alert for Wallet Payment */}
               {paymentMethod === 'wallet' && selectedPlan && (member?.balance || 0) < selectedPlan.price && (
                 <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-start gap-2">
                       <Smartphone className="w-3.5 h-3.5 text-rose-500 mt-0.5" />
                       <div>
                          <p className="text-[8px] font-black text-rose-700 uppercase leading-none mb-1">Số dư không đủ</p>
                          <p className="text-[8px] text-rose-600 font-bold leading-tight">Cần thêm {(selectedPlan.price - (member?.balance || 0)).toLocaleString()}đ để nâng cấp qua ví.</p>
                       </div>
                    </div>
                 </div>
               )}

               {/* Payment Strategy */}
               <div className="space-y-1">
                 <Label className="text-[8px] font-black uppercase text-slate-400 tracking-widest pl-1 opacity-70">Hình thức thanh toán</Label>
                 <div className="grid grid-cols-4 gap-1.5">
                   {[
                     { id: 'cash', icon: Banknote, label: 'CASH' },
                     { id: 'bank', icon: Landmark, label: 'BANK' },
                     { id: 'wallet', icon: Wallet, label: 'WALLET' },
                     { id: 'momo', icon: Smartphone, label: 'MOMO' },
                   ].map((method) => (
                     <button
                       key={method.id}
                       type="button"
                       onClick={() => setPaymentMethod(method.id)}
                       className={cn(
                         "flex flex-col items-center justify-center gap-0.5 p-1 rounded-lg border transition-all h-[42px] shadow-sm",
                         paymentMethod === method.id 
                           ? "border-indigo-600 bg-indigo-50/50" 
                           : "border-slate-100 bg-white hover:border-slate-200"
                       )}
                     >
                       <method.icon className={cn("w-3 h-3", paymentMethod === method.id ? "text-indigo-600" : "text-slate-400")} />
                       <span className={cn("text-[6px] font-black tracking-widest text-center uppercase", paymentMethod === method.id ? "text-indigo-700" : "text-slate-500")}>
                         {method.label}
                       </span>
                     </button>
                   ))}
                 </div>
               </div>

               <div className="space-y-1">
                  <Label className="text-[8px] font-black uppercase text-slate-400 tracking-widest pl-1 opacity-70">Ghi chú đối soát</Label>
                  <Textarea 
                    placeholder="Lý do nâng cấp, ghi chú nội bộ..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded-lg border border-slate-200 min-h-[40px] font-bold text-[9px] focus:border-indigo-600 transition-all resize-none p-1.5 shadow-sm"
                  />
               </div>
            </div>
          </div>

          {/* RIGHT: COMPACT BILLING (W-210px) */}
          <div className="w-full md:w-[210px] bg-slate-50 p-4 sm:p-5 space-y-3.5 flex flex-col justify-between border-l border-slate-100">
             <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                   <h4 className="text-[8px] font-black text-slate-900 uppercase tracking-widest opacity-60">Status</h4>
                   <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                </div>
                
                {qrUrl ? (
                   <div className="space-y-2 animate-in fade-in duration-300 text-center">
                      <div className="w-[125px] h-[125px] bg-white rounded-xl mx-auto p-1 border border-slate-200 shadow-sm flex items-center justify-center">
                         <img src={qrUrl} alt="Bank QR" className="w-[115px] h-[115px] object-contain mix-blend-multiply" />
                      </div>
                      <div>
                         <p className="text-[9px] font-black text-slate-900 uppercase tracking-tight">{ACCOUNT_NAME}</p>
                         <p className="text-[8px] font-bold text-indigo-600 font-mono flex items-center justify-center gap-1 cursor-pointer" onClick={() => handleCopy(ACCOUNT_NO)}>
                            {ACCOUNT_NO} <Copy className="w-2 h-2" />
                         </p>
                      </div>
                      <div className="bg-white px-1 py-1 rounded-lg border border-indigo-50 text-center cursor-pointer" onClick={() => handleCopy(`VIP ${member?.card_number}`)}>
                         <p className="text-[8px] font-black text-slate-700 font-mono tracking-tighter uppercase line-clamp-1">VIP {member?.card_number}</p>
                      </div>
                   </div>
                ) : (
                   <div className="h-[135px] flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl text-slate-300 space-y-1.5 bg-white/50">
                      <QrCode className="w-7 h-7 opacity-20" />
                      <p className="text-[6px] font-black uppercase tracking-widest text-center px-4 leading-tight">SELECT BANK FOR QR</p>
                   </div>
                )}

                <div className="bg-slate-900 text-white rounded-xl p-2.5 space-y-1.5 items-stretch shadow-lg">
                   <div className="flex justify-between items-center opacity-40 text-[6px] font-black uppercase">
                      <span>Base Plan</span>
                      <span>{selectedPlan ? Number(selectedPlan.price).toLocaleString() : '0'}đ</span>
                   </div>
                   <div className="flex justify-between items-center text-indigo-400 text-[6px] font-black uppercase tracking-tighter">
                      <span>Total Days</span>
                      <span>{(selectedPlan?.duration_days || 0) + (Number(manualDays) || 0)}d</span>
                   </div>
                   <div className="pt-1.5 border-t border-white/5 flex justify-between items-center">
                      <span className="text-[7px] font-black uppercase text-indigo-300">TOTAL</span>
                      <span className="text-[11px] font-black text-white">{selectedPlan ? Number(selectedPlan.price).toLocaleString() : '0'}đ</span>
                   </div>
                </div>
             </div>

             <div className="pt-3 md:pt-0 space-y-1.5">
                <Button 
                  onClick={handleUpgrade} 
                  disabled={isPending || !planId}
                  className="w-full bg-indigo-600 hover:bg-slate-900 text-white font-black h-8 rounded-lg shadow-sm transition-all border-none flex flex-col gap-0 leading-none"
                >
                  {isPending ? (
                     <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                     <span className="text-[9px] uppercase tracking-tight">XÁC NHẬN NÂNG CẤP</span>
                  )}
                </Button>
                <Button variant="ghost" onClick={onClose} className="w-full font-black text-[7px] uppercase tracking-widest text-slate-400 h-6 hover:bg-slate-100 transition-colors">Hủy bỏ</Button>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
