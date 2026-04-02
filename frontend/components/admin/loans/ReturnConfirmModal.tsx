'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/components/ui/utils';

interface ReturnConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: any;
  onConfirm: () => void;
  isPending: boolean;
}

export function ReturnConfirmModal({ isOpen, onClose, loan, onConfirm, isPending }: ReturnConfirmModalProps) {
  if (!loan) return null;

  const isOverdue = loan.status === 'overdue';
  const lateFee = Number(loan.lateFee || loan.late_fee || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white">
        <DialogHeader className={cn(
          "p-10 text-white relative flex flex-col items-center text-center",
          isOverdue ? "bg-gradient-to-br from-rose-600 to-rose-900" : "bg-gradient-to-br from-emerald-600 to-emerald-900"
        )}>
          <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-2xl animate-in zoom-in-50 duration-300">
             <RotateCcw className="w-10 h-10 text-white" />
          </div>
          <DialogTitle className="text-3xl font-black tracking-tight">Xác nhận trả sách</DialogTitle>
          <p className="text-white/80 text-xs font-bold mt-2 uppercase tracking-[0.2em] opacity-60">Kết thúc chu trình lưu thông</p>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
              <span>Chi tiết ấn phẩm</span>
              <span>Trạng thái</span>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 flex items-center justify-between gap-4">
               <div className="flex-1">
                  <p className="text-xs font-black text-slate-800 line-clamp-1 uppercase">{loan.publicationName || loan.book_title}</p>
                  <p className="text-[10px] text-indigo-500 font-mono font-bold mt-0.5">{loan.barcode || loan.copy_barcode}</p>
               </div>
               <div className={cn(
                 "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter border-2 shadow-sm",
                 isOverdue ? "bg-rose-50 text-rose-600 border-rose-100 animate-pulse" : "bg-emerald-50 text-emerald-600 border-emerald-100"
               )}>
                 {isOverdue ? 'Quá hạn' : 'Đúng hạn'}
               </div>
            </div>
          </div>

          {isOverdue && lateFee > 0 && (
            <div className="bg-amber-50 p-5 rounded-2xl border-2 border-amber-100 flex items-start gap-4 animate-in slide-in-from-bottom-5 duration-500">
               <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-amber-200">
                  <AlertTriangle className="w-5 h-5 fill-white text-amber-500" />
               </div>
               <div>
                  <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest leading-none mb-1">Phạt quá hạn (Ước tính)</p>
                  <p className="text-2xl font-black text-amber-700 tracking-tight">{lateFee.toLocaleString()}đ</p>
                  <p className="text-[11px] text-amber-600 font-medium mt-1 leading-tight opacity-70">
                    Vui lòng nhắc nhở bạn đọc thanh toán phí phạt trước khi đóng phiếu.
                  </p>
               </div>
            </div>
          )}

          <div className="flex items-center gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
             <CheckCircle2 className="w-4 h-4 text-indigo-500" />
             <p className="text-[11px] text-indigo-700 font-bold italic">Ấn phẩm sẽ được chuyển về trạng thái &quot;Sẵn sàng&quot; ngay sau khi xác nhận.</p>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t-2 border-slate-100 flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-100">
            Để sau
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isPending}
            className={cn(
              "flex-1 h-12 rounded-xl text-white font-black shadow-lg transition-all hover:scale-105 active:scale-95",
              isOverdue ? "bg-rose-600 hover:bg-rose-700 shadow-rose-100" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
            )}
          >
            {isPending ? 'Đang cập nhật...' : 'Xác nhận thu hồi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
