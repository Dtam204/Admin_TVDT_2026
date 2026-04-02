'use client';

import { useState } from 'react';
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
import { Crown, CreditCard, Banknote, Landmark, Loader2 } from 'lucide-react';
import { cn } from '@/components/ui/utils';

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

  const { data: plansData, isLoading: isLoadingPlans } = useMembershipPlans();
  const { mutate: upgradeMember, isPending } = useUpgradeMember();

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
        notes
      }
    }, {
      onSuccess: () => {
        toast.success(`Đã nâng cấp VIP cho ${member.full_name || member.reader_name}`);
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.message || 'Lỗi khi nâng cấp VIP');
      }
    });
  };

  const selectedPlan = plansData?.data?.find((p: any) => p.id.toString() === planId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-none shadow-2xl overflow-hidden p-0 bg-slate-50">
        <div className="bg-gradient-to-br from-indigo-600 via-violet-700 to-slate-900 p-8 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl">
                <Crown className="w-8 h-8 text-amber-300 fill-amber-300" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight text-white uppercase">Nâng cấp Đặc quyền</DialogTitle>
                <DialogDescription className="text-indigo-100 font-bold text-[11px] opacity-80 uppercase tracking-widest">
                  Gia hạn / Nâng cấp VIP hội viên thủ công
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6">
          {/* Member Summary */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
             <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black">
                {((member?.full_name || member?.reader_name || '?').charAt(0)).toUpperCase()}
             </div>
             <div>
                <div className="font-black text-slate-900 text-sm">{member?.full_name || member?.reader_name}</div>
                <div className="text-[10px] font-bold text-slate-400">THẺ: {member?.card_number}</div>
             </div>
          </div>

          <div className="grid gap-6">
            {/* Plan Selection */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Chọn Gói Hội Viên</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-800 focus:ring-indigo-500">
                  <SelectValue placeholder={isLoadingPlans ? "Đang tải gói..." : "Chọn một gói..."} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  {plansData?.data?.map((plan: any) => (
                    <SelectItem key={plan.id} value={plan.id.toString()} className="font-bold py-3">
                      <div className="flex justify-between items-center w-full min-w-[200px]">
                        <span className="text-xs uppercase">{plan.name?.vi || plan.name}</span>
                        <span className="text-[10px] text-emerald-600 font-black ml-4">{Number(plan.price).toLocaleString()}đ</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Phương thức Thanh toán</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'cash', icon: Banknote, label: 'Tiền mặt' },
                  { id: 'momo', icon: CreditCard, label: 'Momo' },
                  { id: 'bank', icon: Landmark, label: 'Ngân hàng' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all group",
                      paymentMethod === method.id 
                        ? "border-indigo-600 bg-indigo-50 shadow-md transform scale-105" 
                        : "border-slate-100 bg-white hover:border-slate-200"
                    )}
                  >
                    <method.icon className={cn("w-5 h-5", paymentMethod === method.id ? "text-indigo-600" : "text-slate-400")} />
                    <span className={cn("text-[8px] font-black uppercase tracking-tighter", paymentMethod === method.id ? "text-indigo-700" : "text-slate-500")}>
                      {method.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reference ID (Optional) */}
            {(paymentMethod === 'momo' || paymentMethod === 'bank') && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Mã tham chiếu Giao dịch</Label>
                <Input 
                  placeholder="Nhập mã TXN từ app..." 
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 font-bold text-xs"
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Ghi chú Nội bộ</Label>
              <Textarea 
                placeholder="Lý do nâng cấp, chi tiết thu tiền..." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl border-slate-200 min-h-[80px] font-medium text-xs focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-white border-t border-slate-100 sm:justify-end gap-3 rounded-b-2xl">
          <Button variant="ghost" onClick={onClose} className="font-black text-[10px] uppercase tracking-widest text-slate-400">Hủy bỏ</Button>
          <Button 
            onClick={handleUpgrade} 
            disabled={isPending || !planId}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-indigo-200 transition-all text-[11px] gap-3 uppercase tracking-tighter"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
            Xác nhận Nâng cấp VIP
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
