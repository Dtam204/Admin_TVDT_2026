'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMembers, useMember } from '@/lib/hooks/useMembers';
import { useCreateTransaction } from '@/lib/hooks/usePayments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ArrowLeft, Search, User, Wallet, History, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
  });

  const { data: membersData, isLoading: isLoadingMembers } = useMembers({ search: memberSearch, limit: 5 });
  const { data: memberDetail, isLoading: isLoadingDetail } = useMember(memberIdParam ? parseInt(memberIdParam) : 0);
  const { mutate: createTransaction, isPending } = useCreateTransaction();

  useEffect(() => {
    if (memberDetail?.data && !selectedMember) {
      setSelectedMember(memberDetail.data);
    }
  }, [memberDetail, selectedMember]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return toast.error('Vui lòng chọn hội viên');
    if (!formData.amount || parseFloat(formData.amount) <= 0) return toast.error('Số tiền không hợp lệ');

    createTransaction({
      member_id: selectedMember.id,
      amount: parseFloat(formData.amount),
      transaction_type: formData.transaction_type,
      description: formData.description || (formData.transaction_type === 'deposit' ? 'Nạp tiền thủ công' : 'Trừ tiền tài khoản'),
    }, {
      onSuccess: () => {
        toast.success('Giao dịch đã được tạo thành công');
        router.push('/admin/payments');
      },
      onError: (err: any) => toast.error(err.message || 'Lỗi khi tạo giao dịch'),
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Tạo giao dịch mới</h1>
          <p className="text-muted-foreground">Ghi nhận biến động số dư cho hội viên</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" /> Thông tin giao dịch
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>1. Chọn hội viên</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Tìm theo tên hoặc mã thẻ..." 
                    className="pl-10 h-11"
                    value={memberSearch}
                    onChange={(e) => {
                      setMemberSearch(e.target.value);
                      if (selectedMember) setSelectedMember(null);
                    }}
                  />
                </div>
                
                {isLoadingMembers || isLoadingDetail ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Đang tìm kiếm...
                  </p>
                ) : memberSearch && !selectedMember && (
                  <div className="border rounded-lg divide-y bg-gray-50/50">
                    {membersData?.data?.map((m: any) => (
                      <button
                        key={m.id}
                        type="button"
                        className="w-full flex items-center justify-between p-3 hover:bg-white transition-colors text-left"
                        onClick={() => {
                          setSelectedMember(m);
                          setMemberSearch('');
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs uppercase">
                            {m.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{m.full_name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{m.card_number}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{m.balance?.toLocaleString()} đ</Badge>
                      </button>
                    ))}
                    {membersData?.data?.length === 0 && (
                      <p className="p-3 text-sm text-center text-muted-foreground">Không tìm thấy hội viên nào</p>
                    )}
                  </div>
                )}

                {selectedMember && (
                  <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-900">{selectedMember.full_name}</p>
                        <p className="text-xs text-blue-700">Mã thẻ: {selectedMember.card_number}</p>
                      </div>
                    </div>
                    {!memberIdParam && (
                      <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)} className="text-xs text-blue-600">Thay đổi</Button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loại giao dịch</Label>
                  <Select 
                    value={formData.transaction_type} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, transaction_type: v }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposit">Nạp tiền (Deposit)</SelectItem>
                      <SelectItem value="withdrawal">Rút/Trừ tiền (Withdrawal)</SelectItem>
                      <SelectItem value="payment">Thanh toán (Payment)</SelectItem>
                      <SelectItem value="refund">Hoàn tiền (Refund)</SelectItem>
                      <SelectItem value="fee">Phí phạt/dịch vụ (Fee)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Số tiền (VNĐ)</Label>
                  <Input 
                    type="number" 
                    placeholder="Ví dụ: 50000" 
                    className="h-11 font-bold text-lg"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mô tả (Ghi chú)</Label>
                <Textarea 
                  placeholder="Nhập nội dung giao dịch..." 
                  className="resize-none"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative">
            <Wallet className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
            <CardHeader>
              <CardTitle className="text-lg">Tóm tắt nguồn chi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="space-y-1">
                <p className="text-blue-100 text-xs uppercase tracking-wider">Số dư hiện tại</p>
                <p className="text-2xl font-bold">{selectedMember?.balance?.toLocaleString() || 0} đ</p>
              </div>
              <div className="pt-4 border-t border-white/20 flex items-center justify-between text-sm">
                <span>Biến động:</span>
                <span className={`font-bold ${formData.transaction_type === 'deposit' ? 'text-emerald-300' : 'text-orange-300'}`}>
                  {formData.transaction_type === 'deposit' ? '+' : '-'}{formData.amount ? parseFloat(formData.amount).toLocaleString() : 0} đ
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between text-sm font-bold">
                <span>Sau giao dịch:</span>
                <span>
                  {((selectedMember?.balance || 0) + (formData.transaction_type === 'deposit' ? Math.abs(parseFloat(formData.amount || '0')) : -Math.abs(parseFloat(formData.amount || '0')))).toLocaleString()} đ
                </span>
              </div>
            </CardContent>
          </Card>

          <Button 
            className="w-full h-14 text-lg shadow-xl shadow-blue-500/20" 
            size="lg"
            onClick={handleCreate}
            disabled={isPending || !selectedMember}
          >
            {isPending ? 'Đang xử lý...' : 'Xác nhận Giao dịch'}
          </Button>

          <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <History className="w-3 h-3" /> Hành động này sẽ cập nhật số dư ví của hội viên ngay lập tức và lưu vào nhật ký hệ thống.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" /> Đang tải trang giao dịch...</div>}>
      <TransactionForm />
    </Suspense>
  );
}
