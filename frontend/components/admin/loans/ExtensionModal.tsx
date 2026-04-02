'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface ExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: any;
  onConfirm: (days: number) => void;
  isPending: boolean;
}

export function ExtensionModal({ isOpen, onClose, loan, onConfirm, isPending }: ExtensionModalProps) {
  const [days, setDays] = useState(7);

  if (!loan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white">
        <DialogHeader className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Clock className="w-24 h-24" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
             <Calendar className="w-6 h-6" />
             Gia hạn lưu thông
          </DialogTitle>
          <p className="text-indigo-100 text-xs font-medium mt-2 opacity-80 uppercase tracking-widest">Thiết lập thời hạn mới</p>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
               <AlertCircle className="w-5 h-5" />
            </div>
            <div>
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Ấn phẩm hiện tại</p>
               <p className="text-sm font-bold text-slate-800 line-clamp-1">{loan.publicationName || loan.book_title}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Số ngày gia hạn thêm</Label>
            <div className="relative">
               <Input 
                 type="number" 
                 value={days} 
                 onChange={(e) => setDays(parseInt(e.target.value) || 0)}
                 className="h-14 rounded-2xl border-2 border-slate-100 bg-white px-6 font-black text-lg focus-visible:ring-indigo-600 transition-all"
               />
               <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 uppercase text-[10px] tracking-widest pointer-events-none">NGÀY</span>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t-2 border-slate-100 flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-100">
            Hủy bỏ
          </Button>
          <Button 
            onClick={() => onConfirm(days)} 
            disabled={isPending}
            className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
          >
            {isPending ? 'Đang xử lý...' : 'Xác nhận gia hạn'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
