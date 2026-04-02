'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Wallet, AlertCircle } from 'lucide-react';

interface ReturnConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number) => void;
  loan: any;
  isPending?: boolean;
}

export function ReturnConfirmModal({ isOpen, onClose, onConfirm, loan, isPending }: ReturnConfirmModalProps) {
  if (!loan) return null;

  const getDaysLate = () => {
    const dueDate = new Date(loan.dueDate || loan.due_date);
    const today = new Date();
    if (today <= dueDate) return 0;
    const diffTime = Math.abs(today.getTime() - dueDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLate = getDaysLate();
  const estimatedFine = daysLate * 5000; // Mặc định 5k/ngày

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-slate-900 text-white p-8 -m-6 mb-4">
          <DialogTitle className="text-2xl font-black flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <RotateCcw className="w-6 h-6" />
             </div>
             Xác nhận Thu hồi sách
          </DialogTitle>
          <DialogDescription className="text-slate-400 mt-2 font-medium">
             Vui lòng kiểm tra tình trạng sách trước khi xác nhận vào kho.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-6 px-2">
          <div className="space-y-1">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ấn phẩm quản lý</div>
             <div className="text-lg font-bold text-slate-900">{loan.publicationName || loan.book_title}</div>
             <div className="text-sm font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit">{loan.barcode || loan.copy_barcode || 'N/A'}</div>
          </div>

          <div className="space-y-1">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bạn đọc mượn</div>
             <div className="text-base font-bold text-slate-800">{loan.readerName || loan.member_name}</div>
          </div>

          {daysLate > 0 ? (
             <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex flex-col gap-3 animate-in zoom-in duration-300">
                <div className="flex items-center gap-2 text-red-600 font-bold">
                   <AlertCircle className="w-5 h-5" />
                   Cảnh báo: Trả trễ hạn {daysLate} ngày
                </div>
                <div className="flex items-center justify-between bg-white/50 p-3 rounded-xl border border-red-50">
                   <div className="flex items-center gap-2 text-red-700 font-medium">
                      <Wallet className="w-4 h-4" /> Phí phạt dự kiến:
                   </div>
                   <div className="text-xl font-black text-red-600">
                      {estimatedFine.toLocaleString()}đ
                   </div>
                </div>
                <p className="text-[10px] text-red-400 italic">Hệ thống sẽ tự động tạo phiếu thu phí phạt sau khi xác nhận.</p>
             </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 text-emerald-700 font-medium text-sm">
               <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-50">
                  <RotateCcw className="w-4 h-4" />
               </div>
               Sách trả đúng hạn. Không phát sinh phí phạt.
            </div>
          )}
        </div>

        <DialogFooter className="flex-row-reverse sm:flex-row gap-3 mt-4">
          <Button variant="ghost" onClick={onClose} className="flex-1 rounded-xl text-slate-500 hover:text-slate-700 font-bold">Hủy bỏ</Button>
          <Button 
            onClick={() => onConfirm(loan.id)} 
            className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-xl text-md font-black shadow-lg shadow-indigo-100"
            disabled={isPending}
          >
            {isPending ? 'Đang cập nhật...' : 'Xác nhận Thu hồi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
