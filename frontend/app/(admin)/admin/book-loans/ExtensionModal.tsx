'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';

interface ExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { id: number; days?: number; newDueDate?: string }) => void;
  loan: any;
  isPending?: boolean;
}

export function ExtensionModal({ isOpen, onClose, onConfirm, loan, isPending }: ExtensionModalProps) {
  const [days, setDays] = useState(7);
  const [newDate, setNewDate] = useState('');

  if (!loan) return null;

  const handleConfirm = () => {
    if (newDate) {
      onConfirm({ id: loan.id, newDueDate: newDate });
    } else {
      onConfirm({ id: loan.id, days });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Gia hạn mượn sách
          </DialogTitle>
          <DialogDescription>
            Điều chỉnh thời gian trả sách cho cuốn: <strong className="text-slate-900">{loan.publicationName || loan.book_title}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="days" className="font-bold">Gia hạn thêm số ngày</Label>
            <div className="flex items-center gap-4">
              <Input
                id="days"
                type="number"
                value={days}
                onChange={(e) => {
                  setDays(parseInt(e.target.value));
                  setNewDate(''); // Clear specific date if days is changed
                }}
                className="rounded-xl border-slate-200"
              />
              <span className="text-slate-500 font-medium">ngày</span>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-bold">Hoặc chọn ngày cụ thể</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="due_date" className="font-bold">Ngày hạn trả mới</Label>
            <Input
              id="due_date"
              type="date"
              value={newDate}
              onChange={(e) => {
                setNewDate(e.target.value);
                setDays(0); // Clear days if specific date is picked
              }}
              className="rounded-xl border-slate-200"
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-xs text-slate-500">
            Hạn trả hiện tại: {new Date(loan.dueDate || loan.due_date).toLocaleDateString('vi-VN')}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Hủy</Button>
          <Button 
            onClick={handleConfirm} 
            className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8"
            disabled={isPending || (!days && !newDate)}
          >
            {isPending ? 'Đang xử lý...' : 'Xác nhận gia hạn'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
