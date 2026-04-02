'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMember, useUpdateMember, useDeleteMember, useMemberActivities, useMemberTransactions, useDeposit, useResetPassword } from '@/lib/hooks/useMembers';
import { useMembershipPlans } from '@/lib/hooks/useMembershipPlans';
import { useBookLoans, useExtendBorrow, useReturnBook } from '@/lib/hooks/useBookLoans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, Trash2, Save, Calendar, 
  User as UserIcon, BookOpen, CreditCard, 
  CheckCircle2, Clock, ShieldCheck, 
  History, Receipt, Wallet, KeyRound, 
  PlusCircle, AlertTriangle, Layers, ArrowUpRight, RotateCcw, Loader2,
  Activity, AlertCircle, Bookmark
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";

export default function MemberEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const itemId = parseInt(id);

  const { data, isLoading } = useMember(itemId);
  const { mutate: updateItem, isPending: isUpdating } = useUpdateMember(itemId);
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteMember();
  
  // Phase 1.6 Hooks
  const { data: activitiesData } = useMemberActivities(itemId);
  const { data: transactionsData } = useMemberTransactions(itemId);
  const { data: plansData } = useMembershipPlans();
  const { data: loansData, isLoading: isLoadingLoans, refetch: refetchLoans } = useBookLoans({ memberId: itemId, limit: 100 });
  const extendMutation = useExtendBorrow();
  const returnMutation = useReturnBook();
  const depositMutation = useDeposit();
  const resetPasswordMutation = useResetPassword();

  const [formData, setFormData] = useState<any>({});
  
  // Dialog States
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [isResetPassOpen, setIsResetPassOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (data?.data) {
      const item = data.data;
      const formatDate = (dateVal: any) => {
        if (!dateVal) return '';
        try {
          const d = new Date(dateVal);
          if (isNaN(d.getTime())) return '';
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch (e) {
          return '';
        }
      };

      setFormData({
        ...item,
        date_of_birth: formatDate(item.date_of_birth),
        membership_expires: formatDate(item.membership_expires),
        issued_date: formatDate(item.issued_date),
      });
    }
  }, [data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      updateItem(formData, {
        onSuccess: () => {
          toast.success('Cập nhật thông tin thành công');
        },
        onError: (err: any) => {
          console.error('Save failed:', err);
          toast.error(err.message || 'Lỗi khi cập nhật. Vui lòng thử lại.');
        }
      });
    } catch (error: any) {
      console.error('Critical handleSave error:', error);
      toast.error('Có lỗi xảy ra trong quá trình xử lý lưu.');
    }
  };

  const handleDelete = () => {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn Bạn đọc này không?')) return;
    deleteItem(itemId, {
      onSuccess: () => {
        toast.success('Đã xóa thành công');
        router.push('/admin/members');
      }
    });
  };

  const addExpiration = (months: number) => {
    const current = formData.membership_expires ? new Date(formData.membership_expires) : new Date();
    current.setMonth(current.getMonth() + months);
    setFormData((prev: any) => ({ 
      ...prev, 
      membership_expires: current.toISOString().split('T')[0] 
    }));
    toast.info(`Đã cộng thêm ${months} tháng. Đừng quên nhấn Lưu.`);
  };

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(parseFloat(depositAmount))) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    
    depositMutation.mutate({ 
      id: itemId, 
      data: { amount: parseFloat(depositAmount), description: depositNote } 
    }, {
      onSuccess: () => {
        toast.success(`Đã nạp ${depositAmount} VNĐ thành công`);
        setIsDepositOpen(false);
        setDepositAmount('');
        setDepositNote('');
      }
    });
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    resetPasswordMutation.mutate({
      id: itemId,
      data: { new_password: newPassword }
    }, {
      onSuccess: () => {
        toast.success('Đã thay đổi mật khẩu thành công');
        setIsResetPassOpen(false);
        setNewPassword('');
      }
    });
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'wallet_deposit': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">Nạp tiền</Badge>;
      case 'wallet_withdrawal': return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-none">Rút tiền</Badge>;
      case 'fee_penalty': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none">Phí phạt</Badge>;
      case 'plan_subscription': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">Đăng ký gói</Badge>;
      case 'manual_payment': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none">Thanh toán</Badge>;
      case 'refund': return <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-200 border-none">Hoàn tiền</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  const item = data?.data;
  if (!item) return <div className="p-12 text-center text-red-500">Không tìm thấy dữ liệu</div>;

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/members">
            <Button variant="outline" size="icon" className="rounded-full shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{formData.full_name || 'Hồ sơ Bạn đọc'}</h1>
              <Badge variant={formData.status === 'active' ? 'default' : 'secondary'} className={formData.status === 'active' ? 'bg-emerald-500' : ''}>
                {formData.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 mt-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              Email: {formData.email} • Mã thẻ: {formData.card_number}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 rounded-xl" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 className="w-4 h-4 mr-2" />
            Xóa hồ sơ
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 px-8 rounded-xl min-w-[140px]" 
            onClick={handleSave} 
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="library" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-8 bg-gray-100 p-1 rounded-xl h-auto">
          <TabsTrigger value="library" className="rounded-lg py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BookOpen className="w-4 h-4 mr-2" /> Thư viện
          </TabsTrigger>
          <TabsTrigger value="loans" className="rounded-lg py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Layers className="w-4 h-4 mr-2" /> Phiếu mượn
          </TabsTrigger>
          <TabsTrigger value="transactions" className="rounded-lg py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Receipt className="w-4 h-4 mr-2" /> Giao dịch
          </TabsTrigger>
          <TabsTrigger value="activities" className="rounded-lg py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <History className="w-4 h-4 mr-2" /> Nhật ký
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-lg py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ShieldCheck className="w-4 h-4 mr-2" /> Bảo mật
          </TabsTrigger>
          <TabsTrigger value="personal" className="rounded-lg py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <UserIcon className="w-4 h-4 mr-2" /> Cá nhân
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Library Config */}
        <TabsContent value="library" className="space-y-6">
          {/* Member Health Stats - DEEP SYNC */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <Bookmark className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Hạn mức mượn</p>
                  <p className="text-2xl font-black text-indigo-900">
                    {loansData?.data?.filter((l:any) => l.status === 'borrowing').length || 0}
                    <span className="text-sm font-bold text-slate-400 mx-1">/</span>
                    {item.max_books_borrowed || 3}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Sách đang giữ trong kho</p>
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br border shadow-sm transition-all ${
              (transactionsData?.data?.filter((t:any) => t.type === 'fee_penalty' && t.status === 'pending').reduce((acc:number, t:any) => acc + parseFloat(t.amount), 0) > 0)
              ? 'from-red-50 to-white border-red-100'
              : 'from-emerald-50 to-white border-emerald-100'
            }`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                  (transactionsData?.data?.filter((t:any) => t.type === 'fee_penalty' && t.status === 'pending').reduce((acc:number, t:any) => acc + parseFloat(t.amount), 0) > 0)
                  ? 'bg-red-500 shadow-red-200'
                  : 'bg-emerald-500 shadow-emerald-200'
                }`}>
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest ${
                    (transactionsData?.data?.filter((t:any) => t.type === 'fee_penalty' && t.status === 'pending').reduce((acc:number, t:any) => acc + parseFloat(t.amount), 0) > 0)
                    ? 'text-red-400'
                    : 'text-emerald-400'
                  }`}>Nợ phí phạt</p>
                  <p className={`text-2xl font-black ${
                    (transactionsData?.data?.filter((t:any) => t.type === 'fee_penalty' && t.status === 'pending').reduce((acc:number, t:any) => acc + parseFloat(t.amount), 0) > 0)
                    ? 'text-red-700'
                    : 'text-emerald-700'
                  }`}>
                    {(transactionsData?.data?.filter((t:any) => t.type === 'fee_penalty' && t.status === 'pending').reduce((acc:number, t:any) => acc + parseFloat(t.amount), 0) || 0).toLocaleString('vi-VN')} đ
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Khoản nợ trễ hạn tồn đọng</p>
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br border shadow-sm transition-all ${
              (item.membership_expires && new Date(item.membership_expires) < new Date())
              ? 'from-amber-50 to-white border-amber-100'
              : 'from-blue-50 to-white border-blue-100'
            }`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                  (item.membership_expires && new Date(item.membership_expires) < new Date())
                  ? 'bg-amber-500 shadow-amber-200'
                  : 'bg-blue-600 shadow-blue-200'
                }`}>
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest ${
                    (item.membership_expires && new Date(item.membership_expires) < new Date())
                    ? 'text-amber-400'
                    : 'text-blue-400'
                  }`}>Trạng thái thẻ</p>
                  <p className={`text-xl font-black ${
                    (item.membership_expires && new Date(item.membership_expires) < new Date())
                    ? 'text-amber-700'
                    : 'text-blue-800'
                  }`}>
                    {(item.membership_expires && new Date(item.membership_expires) < new Date()) ? 'HẾT HẠN' : (item.tier_code?.toUpperCase() || 'GIẤY')}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Hết hạn: {item.membership_expires ? new Date(item.membership_expires).toLocaleDateString('vi-VN') : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Membership Card */}
            <Card className="border-blue-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <CreditCard className="w-24 h-24 rotate-12" />
              </div>
              <CardHeader>
                <CardTitle className="text-blue-700 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" /> Thông tin Thẻ thành viên
                </CardTitle>
                <CardDescription>Cấp mã thẻ và quản lý đặc quyền mượn sách.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card_number">Mã số thẻ (Barcode)</Label>
                  <Input 
                    id="card_number" 
                    name="card_number" 
                    value={formData.card_number || ''} 
                    onChange={handleInputChange}
                    className="font-mono text-lg font-bold border-blue-200 bg-blue-50/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hạng thành viên</Label>
                    <Select 
                      value={formData.membership_plan_id?.toString() || ""} 
                      onValueChange={(v) => handleSelectChange('membership_plan_id', v)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Chọn gói (Bắt buộc)" />
                      </SelectTrigger>
                      <SelectContent>
                        {plansData?.data?.map((plan: any) => (
                           <SelectItem key={plan.id} value={plan.id.toString()}>
                             {plan.name?.vi || plan.name} {plan.tier_code ? `[Tier: ${plan.tier_code.toUpperCase()}]` : ''}
                           </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="balance">Số dư tài khoản (VNĐ)</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="balance" 
                        name="balance" 
                        type="number"
                        value={formData.balance ?? 0} 
                        onChange={handleInputChange}
                        disabled
                        className="bg-gray-50 font-bold text-blue-700"
                      />
                      <Button variant="outline" size="icon" className="text-blue-600 border-blue-200 bg-white" onClick={() => setIsDepositOpen(true)}>
                        <PlusCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Profile 360 Stats Phase 1 */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-100/50">
                  <div className="bg-white p-3 rounded-xl border border-blue-50/50 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Đang mượn</p>
                    <p className="text-2xl font-black text-indigo-600">{formData.currentLoansCount || 0} <span className="text-xs text-indigo-400 font-medium">cuốn</span></p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-red-50/50 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nợ phạt</p>
                    <p className="text-2xl font-black text-red-600">{Number(formData.totalFines || 0).toLocaleString()} <span className="text-xs text-red-400 font-medium">đ</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expiration Management - KEY CONVENIENCE */}
            <Card className="border-amber-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-amber-700 flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Thời hạn & Hiệu lực
                </CardTitle>
                <CardDescription>Gia hạn thời gian sử dụng dịch vụ thư viện.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="membership_expires" className="flex justify-between">
                    <span>Ngày hết hạn thành viên</span>
                    <span className={new Date(formData.membership_expires) < new Date() ? 'text-red-500 text-xs font-bold animate-pulse' : 'text-emerald-500 text-xs font-bold'}>
                      {formData.membership_expires ? (new Date(formData.membership_expires) < new Date() ? 'Đã hết hạn!' : 'Còn hiệu lực') : 'Vô hạn'}
                    </span>
                  </Label>
                  <div className="relative">
                    <Input 
                      id="membership_expires" 
                      name="membership_expires" 
                      type="date"
                      value={formData.membership_expires || ''} 
                      onChange={handleInputChange}
                      className="h-12 border-amber-200"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Gia hạn nhanh</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" className="border-amber-200 hover:bg-amber-50" onClick={() => addExpiration(1)}>+1 Tháng</Button>
                    <Button variant="outline" size="sm" className="border-amber-200 hover:bg-amber-50" onClick={() => addExpiration(6)}>+6 Tháng</Button>
                    <Button variant="outline" size="sm" className="border-amber-200 hover:bg-amber-50" onClick={() => addExpiration(12)}>+1 Năm</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Active Loans */}
        <TabsContent value="loans" className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-indigo-700 flex items-center gap-2">
                  <Layers className="w-5 h-5" /> Danh sách Phiếu mượn
                </CardTitle>
                <CardDescription>Các ấn phẩm Bạn đọc đang giữ hoặc đã từng mượn.</CardDescription>
              </div>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                Tổng cộng: {loansData?.data?.length || 0}
              </Badge>
            </CardHeader>
            <CardContent>
              {isLoadingLoans ? (
                <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></div>
              ) : loansData?.data?.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
                  <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">Chưa có lịch sử mượn sách.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/50 text-left">
                        <th className="py-4 px-4 font-bold text-slate-700">Ấn phẩm</th>
                        <th className="py-4 px-4 font-bold text-slate-700">Ngày mượn</th>
                        <th className="py-4 px-4 font-bold text-slate-700">Hạn trả</th>
                        <th className="py-4 px-4 font-bold text-slate-700">Trạng thái</th>
                        <th className="py-4 px-4 font-bold text-slate-700 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loansData.data.map((loan: any) => (
                        <tr key={loan.id} className="border-b hover:bg-slate-50/80 transition-colors group">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              {loan.cover_image && (
                                <img src={loan.cover_image} alt="" className="w-10 h-14 object-cover rounded shadow-sm" />
                              )}
                              <div>
                                <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase text-[12px]">{loan.book_title}</p>
                                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                  Barcode: <span className="font-mono text-blue-600 bg-blue-50 px-1 rounded">{loan.copy_barcode}</span>
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-600 font-medium whitespace-nowrap">
                            {loan.loan_date ? new Date(loan.loan_date).toLocaleDateString('vi-VN') : '---'}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className={`font-bold ${new Date(loan.due_date) < new Date() && loan.status !== 'returned' ? 'text-red-500' : 'text-slate-600'}`}>
                              {new Date(loan.due_date).toLocaleDateString('vi-VN')}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={loan.status === 'returned' ? 'outline' : loan.status === 'overdue' ? 'destructive' : 'default'} className="rounded-full">
                              {loan.status === 'borrowing' ? 'Đang mượn' : loan.status === 'returned' ? 'Đã trả' : loan.status === 'overdue' ? 'Quá hạn' : loan.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                            {loan.status !== 'returned' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => {
                                    if(confirm('Gia hạn thêm 7 ngày?')) {
                                      extendMutation.mutate({ id: loan.id, days: 7 }, { onSuccess: () => { toast.success('Đã gia hạn thành công'); refetchLoans(); } });
                                    }
                                  }}
                                  disabled={extendMutation.isPending}
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> Gia hạn
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => {
                                    if(confirm('Xác nhận Bạn đọc đã trả cuốn sách này?')) {
                                      returnMutation.mutate(loan.id, { onSuccess: () => { toast.success('Đã thu hồi sách thành công'); refetchLoans(); } });
                                    }
                                  }}
                                  disabled={returnMutation.isPending}
                                >
                                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Trả sách
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Giao dịch */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-blue-700 flex items-center gap-2">
                  <Receipt className="w-5 h-5" /> Lịch sử Giao dịch tài chính
                </CardTitle>
                <CardDescription>Bao gồm nạp tiền, thanh toán phí gia hạn và các phí khác.</CardDescription>
              </div>
              <Button onClick={() => setIsDepositOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Wallet className="w-4 h-4 mr-2" /> Nạp tiền thủ công
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[10px] tracking-wider">Thời gian</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[10px] tracking-wider">Loại GD</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-400 uppercase text-[10px] tracking-wider">Số tiền</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[10px] tracking-wider">Nội dung</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-400 uppercase text-[10px] tracking-wider">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {!transactionsData?.data || transactionsData.data.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">Chưa có giao dịch nào được ghi nhận.</td>
                      </tr>
                    ) : (
                      transactionsData.data.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-indigo-50/20 transition-colors">
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {new Date(tx.created_at).toLocaleString('vi-VN')}
                          </td>
                          <td className="px-4 py-3">
                            {getTransactionTypeBadge(tx.transaction_type)}
                          </td>
                          <td className={`px-4 py-3 text-right font-black ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {tx.amount > 0 ? '+' : ''}{parseFloat(tx.amount).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="px-4 py-3 text-slate-600 max-w-[300px]">
                            <div className="flex flex-col">
                              <span className="font-medium text-xs">{tx.description}</span>
                              <span className="text-[10px] text-slate-400 mt-0.5 font-mono">Mã GD: #{tx.id}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                             <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className={tx.status === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'}>
                                {tx.status === 'completed' ? 'Thành công' : 'Chờ xử lý'}
                             </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Nhật ký */}
        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-700 flex items-center gap-2">
                <History className="w-5 h-5" /> Nhật ký hoạt động hội viên
              </CardTitle>
              <CardDescription>Ghi nhận các thao tác quan trọng trên tài khoản (Audit Log).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!activitiesData?.data || activitiesData.data.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground italic border rounded-lg">Chưa có hoạt động nào được ghi nhận.</p>
                ) : (
                  <div className="relative pl-6 border-l-2 border-gray-100 space-y-6">
                    {activitiesData.data.map((act: any) => (
                      <div key={act.id} className="relative">
                        <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-500 shadow-sm"></div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900 capitalize">{act.activity_type.replace('_', ' ')}</p>
                            <span className="text-[10px] text-muted-foreground">• {new Date(act.created_at).toLocaleString('vi-VN')}</span>
                          </div>
                          <p className="text-sm text-gray-600">{act.description}</p>
                          {act.ip_address && (
                            <p className="text-[10px] text-muted-foreground font-mono">IP: {act.ip_address}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Account Security */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" /> Quản lý Tài khoản
              </CardTitle>
              <CardDescription>Kiểm soát trạng thái đăng nhập và vai trò.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Email (Dùng để đăng nhập)</Label>
                  <Input value={formData.email || ''} disabled className="bg-gray-50 italic" />
                  <p className="text-[10px] text-muted-foreground italic">* Email không thể thay đổi để đảm bảo tính nhất quán dữ liệu.</p>
                </div>
                <div className="space-y-2">
                  <Label>Trạng thái hoạt động</Label>
                  <Select value={formData.status || "active"} onValueChange={(v) => handleSelectChange('status', v)}>
                    <SelectTrigger className={formData.status === 'active' ? 'border-emerald-200 text-emerald-700' : 'border-red-200 text-red-700'}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Kích hoạt (Active)</SelectItem>
                      <SelectItem value="inactive">Khóa tài khoản (Inactive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Security Actions */}
              <div className="pt-6 border-t space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2 text-red-700">
                  <KeyRound className="w-4 h-4" /> Tùy chọn bảo mật chuyên sâu
                </h4>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-red-900">Đặt lại mật khẩu</p>
                    <p className="text-xs text-red-700">Buộc đổi mật khẩu mới cho bạn đọc nếu họ quên hoặc tài khoản bị xâm nhập.</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => setIsResetPassOpen(true)}>
                    Reset Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Personal Info */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" /> Thông tin định danh
              </CardTitle>
              <CardDescription>Thông tin pháp lý và liên lạc của bạn đọc.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Họ và tên</Label>
                  <Input id="full_name" name="full_name" value={formData.full_name || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="identity_number">Số CMND/CCCD</Label>
                  <Input id="identity_number" name="identity_number" value={formData.identity_number || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" name="phone" value={formData.phone || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Ngày sinh</Label>
                  <Input id="date_of_birth" name="date_of_birth" type="date" value={formData.date_of_birth || ''} onChange={handleInputChange} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Địa chỉ thường trú</Label>
                  <Input id="address" name="address" value={formData.address || ''} onChange={handleInputChange} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* DIALOGS */}
      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-emerald-700 flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Nạp tiền vào ví hội viên
            </DialogTitle>
            <DialogDescription>Nhập số tiền mặt bạn đã nhận được từ hội viên tại quầy.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Số tiền nạp (VNĐ)</Label>
              <Input 
                type="number" 
                placeholder="Ví dụ: 50000" 
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="text-lg font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú (Tùy chọn)</Label>
              <Input 
                placeholder="Ví dụ: Khách nạp tiền mặt tại quầy..." 
                value={depositNote}
                onChange={(e) => setDepositNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDepositOpen(false)}>Hủy</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl" onClick={handleDeposit} disabled={depositMutation.isPending}>
                      {depositMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        'Xác nhận nạp tiền'
                      )}
                    </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetPassOpen} onOpenChange={setIsResetPassOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Reset mật khẩu hội viên
            </DialogTitle>
            <DialogDescription>Mật khẩu mới sẽ có hiệu lực ngay lập tức.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Mật khẩu mới</Label>
              <Input 
                type="text" 
                placeholder="Nhập ít nhất 6 ký tự..." 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPassOpen(false)}>Hủy</Button>
                    <Button className="bg-red-600 hover:bg-red-700 rounded-xl" onClick={handleResetPassword} disabled={resetPasswordMutation.isPending}>
                      {resetPasswordMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang reset...
                        </>
                      ) : (
                        'Đổi mật khẩu'
                      )}
                    </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer Info */}
      <div className="flex justify-center text-[10px] text-muted-foreground gap-4 border-t pt-4">
        <span>Ngày tham gia: {item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '---'}</span>
        <span>ID Hệ thống: {item.id}</span>
      </div>
    </div>
  );
}
