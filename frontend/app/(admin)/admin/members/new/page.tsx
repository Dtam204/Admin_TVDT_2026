'use client';

import { useRouter } from 'next/navigation';
import { useCreateMember } from '@/lib/hooks/useMembers';
import { useMembershipPlans } from '@/lib/hooks/useMembershipPlans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, User, CreditCard, ShieldCheck, Save, Loader2, Search, CheckCircle2, UserPlus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';
import { adminApiCall, AdminEndpoints } from '@/lib/api/admin';

export default function NewMemberPage() {
  const router = useRouter();
  const { mutate: create, isPending } = useCreateMember();
  const { data: plansData } = useMembershipPlans();
  const [activeTab, setActiveTab] = useState("account");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [existingUser, setExistingUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    status: 'active',
    card_number: '',
    membership_plan_id: '',
    date_of_birth: '',
    identity_number: '',
    phone: '',
    address: '',
    gender: 'other',
    balance: 0,
    issued_date: new Date().toISOString().split('T')[0],
    membership_expires: ''
  });

  const checkEmail = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      toast.error('Vui lòng nhập email hợp lệ');
      return;
    }

    try {
      setIsCheckingEmail(true);
      setExistingUser(null);
      
      const response = await adminApiCall<{ success: boolean; data?: any[] }>(
        `${AdminEndpoints.users.list}?search=${encodeURIComponent(formData.email)}`
      );

      if (response.success && response.data && response.data.length > 0) {
        // Find exact match
        const user = response.data.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
        if (user) {
          setExistingUser(user);
          setFormData(prev => ({ 
            ...prev, 
            full_name: user.name || prev.full_name,
            password: '' // Reset password since we use existing account
          }));
          toast.info(`Tìm thấy tài khoản: ${user.name}. Sẽ liên kết với hồ sơ Bạn đọc này.`);
        } else {
          toast.success('Email này chưa có tài khoản. Bạn có thể tạo mới ngay tại đây.');
        }
      } else {
        toast.success('Email này chưa có tài khoản. Bạn có thể tạo mới ngay tại đây.');
      }
    } catch (error) {
      console.error('Check email error:', error);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [id]: value };
      
      // Auto-fill balance and expiry if plan is selected
      if (id === 'membership_plan_id' && plansData?.data) {
        const selectedPlan = plansData.data.find((p: any) => p.id.toString() === value);
        if (selectedPlan) {
          newData.balance = selectedPlan.price || 0;
          
          // Also pre-calculate expiry if duration is set and no expiry yet
          if (selectedPlan.duration_days && !prev.membership_expires) {
            const start = prev.issued_date ? new Date(prev.issued_date) : new Date();
            const end = new Date(start);
            end.setDate(end.getDate() + selectedPlan.duration_days);
            newData.membership_expires = end.toISOString().split('T')[0];
          }
        }
      }
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.full_name || !formData.card_number) {
        toast.error('Vui lòng điền các trường bắt buộc (Email, Họ tên, Mã thẻ)');
        return;
    }

    create(formData, {
      onSuccess: () => {
        toast.success(existingUser ? 'Đã liên kết và tạo Bạn đọc thành công!' : 'Đã tạo tài khoản và Bạn đọc thành công!');
        // Delay nhỏ để tránh lỗi unmount và hiển thị toast
        setTimeout(() => {
          router.push('/admin/members');
        }, 500);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Lỗi khi tạo Bạn đọc');
      }
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6 text-gray-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/members">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Thêm Bạn đọc mới</h1>
            <p className="text-muted-foreground">Thiết lập tài khoản và đặc quyền thư viện kỹ thuật số.</p>
          </div>
        </div>
        <Button 
          type="submit" 
          form="member-form" 
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-700 h-11 px-6 shadow-md"
        >
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Lưu thông tin
        </Button>
      </div>

      <form id="member-form" onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-14 bg-gray-100/50 p-1 rounded-xl">
            <TabsTrigger value="account" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Tài khoản & Bảo mật
            </TabsTrigger>
            <TabsTrigger value="library" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <CreditCard className="w-4 h-4 mr-2" />
                Thông tin Thẻ & VIP
            </TabsTrigger>
            <TabsTrigger value="personal" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <User className="w-4 h-4 mr-2" />
                Thông tin Cá nhân
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="account">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle>Cài đặt Truy cập</CardTitle>
                  <CardDescription>Tìm tài khoản có sẵn hoặc tạo mới để liên kết với hồ sơ thư viện.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label htmlFor="email">Email đăng nhập *</Label>
                       <div className="flex gap-2">
                         <Input 
                           id="email" 
                           type="email" 
                           value={formData.email} 
                           onChange={handleChange} 
                           placeholder="example@gmail.com" 
                           className={existingUser ? "border-blue-200 bg-blue-50/50" : ""}
                           required 
                         />
                         <Button 
                           type="button" 
                           variant="outline" 
                           size="icon"
                           onClick={checkEmail}
                           disabled={isCheckingEmail}
                           className="shrink-0"
                         >
                           {isCheckingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                         </Button>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="password">Mật khẩu {existingUser ? "(Dùng theo tài khoản cũ)" : "ban đầu"}</Label>
                       <div className="flex gap-2">
                         <Input 
                           id="password" 
                           type="password" 
                           value={formData.password} 
                           onChange={handleChange} 
                           disabled={!!existingUser}
                           placeholder={existingUser ? "********" : "Mặc định: 123456"} 
                           className={existingUser ? "bg-gray-50 opacity-50" : ""}
                         />
                         {!existingUser && (
                           <Button
                             type="button"
                             variant="outline"
                             onClick={() => {
                               const randomPass = Math.random().toString(36).slice(-8);
                               setFormData(prev => ({...prev, password: randomPass}));
                               toast.info(`Mật khẩu ngẫu nhiên: ${randomPass}`);
                             }}
                             className="shrink-0"
                             title="Sinh ngẫu nhiên"
                           >
                             <Sparkles className="w-4 h-4" /> 
                           </Button>
                         )}
                       </div>
                    </div>
                  </div>

                  {existingUser && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3 text-sm text-blue-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <div>
                        Đang liên kết với tài khoản: <strong>{existingUser.name}</strong> ({existingUser.email}).
                        Bạn chỉ cần bổ sung thông tin thẻ và cá nhân bên dưới.
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-auto text-blue-600 hover:text-blue-800"
                        onClick={() => { setExistingUser(null); setFormData(prev => ({...prev, email: ''})); }}
                      >
                        Hủy
                      </Button>
                    </div>
                  )}

                  {!existingUser && formData.email.includes('@') && !isCheckingEmail && (
                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-center gap-3 text-sm text-gray-600">
                      <UserPlus className="w-5 h-5" />
                      <div>Tài khoản mới sẽ được tạo cùng với hồ sơ Bạn đọc.</div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label htmlFor="role">Vai trò (Cố định)</Label>
                       <Input value="Bạn đọc (Reader)" disabled className="bg-gray-50" />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="status">Trạng thái tài khoản</Label>
                       <Select value={formData.status} onValueChange={(val) => handleSelectChange('status', val)}>
                         <SelectTrigger>
                           <SelectValue placeholder="Trạng thái" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="active">Hoạt động (Active)</SelectItem>
                           <SelectItem value="inactive">Khóa (Inactive)</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="library">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle>Dữ liệu Thẻ thư viện</CardTitle>
                  <CardDescription>Quản lý mã định danh và các hạn mức mượn/đọc sách.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label htmlFor="card_number">Mã số thẻ (Card Number) *</Label>
                       <div className="flex gap-2">
                         <Input id="card_number" value={formData.card_number} onChange={handleChange} placeholder="Ví dụ: LIB2026-XXXX" required />
                         <Button
                           type="button"
                           variant="outline"
                           onClick={() => {
                             const randomCard = 'LIB' + new Date().getFullYear() + Math.floor(1000 + Math.random() * 9000);
                             setFormData(prev => ({...prev, card_number: randomCard}));
                             toast.success(`Đã tạo mã thẻ: ${randomCard}`);
                           }}
                           className="shrink-0 text-blue-600"
                           title="Sinh tự động"
                         >
                           Tự động
                         </Button>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="membership_plan_id">Gói Hội viên (Membership Plan)</Label>
                       <Select value={formData.membership_plan_id} onValueChange={(val) => handleSelectChange('membership_plan_id', val)}>
                         <SelectTrigger>
                           <SelectValue placeholder="Chọn gói" />
                         </SelectTrigger>
                         <SelectContent>
                           {plansData?.data?.map((plan: any) => (
                             <SelectItem key={plan.id} value={plan.id.toString()}>
                               {typeof plan.name === 'object' ? (Object.values(plan.name).find((v: any) => typeof v === 'string' && v.trim()) || plan.slug) : (plan.name || plan.slug)} {plan.tier_code ? `[Tier: ${plan.tier_code.toUpperCase()}]` : ''}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label htmlFor="balance">Nạp tiền khởi tạo (Deposit)</Label>
                       <Input id="balance" type="number" value={formData.balance} onChange={handleChange} className={formData.membership_plan_id ? "border-blue-100 bg-blue-50/20" : ""} />
                       <p className="text-[10px] text-muted-foreground italic">
                         {formData.membership_plan_id 
                           ? "Số tiền này tự động điền theo gói cước và sẽ được ghi vào Lịch sử giao dịch."
                           : "Nếu nạp tiền ngay, số tiền này sẽ được ghi vào Lịch sử giao dịch (Thanh toán)."}
                       </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dashed">
                    <div className="space-y-2">
                       <Label htmlFor="issued_date">Ngày bắt đầu (Ngày thêm)</Label>
                       <Input id="issued_date" type="date" value={formData.issued_date} onChange={handleChange} className="h-11 shadow-sm" />
                       <p className="text-[10px] text-muted-foreground italic">Mặc định là ngày hôm nay</p>
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="membership_expires">Ngày kết thúc (Ngày hết hạn)</Label>
                       <Input id="membership_expires" type="date" value={formData.membership_expires} onChange={handleChange} className="h-11 shadow-sm border-blue-100" />
                       <p className="text-[10px] text-blue-600 italic">Dùng làm mốc căn cứ để gia hạn sau này</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="personal">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle>Thông tin định danh</CardTitle>
                  <CardDescription>Thông tin cá nhân dùng cho hồ sơ mượn trả.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                     <Label htmlFor="full_name">Họ và tên *</Label>
                     <Input id="full_name" value={formData.full_name} onChange={handleChange} placeholder="Nguyễn Văn A" required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label htmlFor="phone">Số điện thoại</Label>
                       <Input id="phone" value={formData.phone} onChange={handleChange} placeholder="090 xxx xxxx" />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="identity_number">Số CCCD/Passport</Label>
                       <Input id="identity_number" value={formData.identity_number} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label htmlFor="date_of_birth">Ngày sinh</Label>
                       <Input id="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="gender">Giới tính</Label>
                       <Select value={formData.gender} onValueChange={(val) => handleSelectChange('gender', val)}>
                         <SelectTrigger>
                           <SelectValue placeholder="Chọn giới tính" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="male">Nam</SelectItem>
                           <SelectItem value="female">Nữ</SelectItem>
                           <SelectItem value="other">Khác</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="address">Địa chỉ thường trú</Label>
                     <Input id="address" value={formData.address} onChange={handleChange} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </form>
    </div>
  );
}
