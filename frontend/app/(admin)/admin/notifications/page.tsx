'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiCall } from '@/lib/api/admin/client';
import { 
  Bell, Send, History, User, Users, Star, 
  Search, ShieldCheck, Clock, CheckCircle2, AlertCircle, Info, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('send');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    target_type: 'all', // all, individual, basic, premium, vip
    member_id: '',
    link: ''
  });

  // Query History
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['admin-notifications-history'],
    queryFn: () => adminApiCall('/api/admin/notifications/history'),
    enabled: activeTab === 'history'
  });

  // Send Mutation
  const { mutate: sendNotification, isPending: isSending } = useMutation({
    mutationFn: (data: any) => adminApiCall('/api/admin/notifications/send', {
      method: 'POST',
      body: JSON.stringify({
        title: { vi: data.title },
        message: { vi: data.body }, // Đổi từ body -> message cho đồng bộ Backend
        target_type: data.target_type,
        member_id: data.target_type === 'individual' ? parseInt(data.member_id) : null,
        metadata: { link: data.link }
      })
    }),
    onSuccess: () => {
      toast.success('Gửi thông báo thành công!');
      setFormData({
        title: '',
        body: '',
        target_type: 'all',
        member_id: '',
        link: ''
      });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-history'] });
    },
    onError: (err: any) => toast.error(err.message || 'Lỗi khi gửi thông báo')
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      toast.error('Vui lòng nhập đầy đủ Tiêu đề và Nội dung');
      return;
    }
    sendNotification(formData);
  };

  const getTargetBadge = (type: string) => {
    switch (type) {
      case 'all': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Tất cả</Badge>;
      case 'premium': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Premium</Badge>;
      case 'vip': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 uppercase font-black">VIP</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
              <Bell className="w-8 h-8 animate-ring" />
            </div>
            Thông báo <span className="text-indigo-600">Đẩy App</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Gửi thông báo trực tiếp tới điện thoại của độc giả di động</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
        <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-auto border border-slate-200 shadow-sm">
          <TabsTrigger value="send" className="px-8 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 font-bold transition-all flex items-center gap-2">
            <Send className="w-4 h-4" /> Soạn thông báo mới
          </TabsTrigger>
          <TabsTrigger value="history" className="px-8 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 font-bold transition-all flex items-center gap-2">
            <History className="w-4 h-4" /> Nhật ký đã gửi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-8 mt-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 p-8">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" /> Nội dung thông báo
                </CardTitle>
                <CardDescription>Tin nhắn này sẽ hiển thị trên thanh trạng thái điện thoại của khách hàng</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700 ml-1">Tiêu đề thông báo <span className="text-rose-500">*</span></Label>
                  <Input 
                    placeholder="VD: Sách mới cực hấp dẫn vừa cập bến!"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="h-14 bg-slate-50 border-none rounded-2xl focus-visible:ring-indigo-500 font-bold px-6 text-lg shadow-inner"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700 ml-1">Nội dung chi tiết <span className="text-rose-500">*</span></Label>
                  <Textarea 
                    placeholder="VD: Khám phá ngay bộ sưu tập sách kỹ năng sống mới nhất chỉ dành riêng cho thành viên Premium..."
                    value={formData.body}
                    onChange={e => setFormData({ ...formData, body: e.target.value })}
                    className="min-h-[160px] bg-slate-50 border-none rounded-2xl p-6 focus-visible:ring-indigo-500 text-base leading-relaxed shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-sm font-bold text-slate-700 ml-1">Nhóm đối tượng nhận</Label>
                    <Select value={formData.target_type} onValueChange={v => setFormData({ ...formData, target_type: v })}>
                      <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-6 shadow-sm">
                        <SelectValue placeholder="Chọn đối tượng" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl shadow-2xl p-2 border-slate-100">
                        <SelectItem value="all" className="rounded-xl py-3 cursor-pointer">Tất cả người dùng App</SelectItem>
                        <SelectItem value="individual" className="rounded-xl py-3 cursor-pointer">Gửi cá nhân (Một hội viên)</SelectItem>
                        <SelectItem value="basic" className="rounded-xl py-3 cursor-pointer">Thành viên Basic (Thường)</SelectItem>
                        <SelectItem value="premium" className="rounded-xl py-3 cursor-pointer">Thành viên Premium</SelectItem>
                        <SelectItem value="vip" className="rounded-xl py-3 cursor-pointer">Thành viên VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.target_type === 'individual' && (
                    <div className="space-y-3 animate-in zoom-in-95 duration-300">
                      <Label className="text-sm font-bold text-rose-600 ml-1">ID Hội viên nhận thông báo <span className="text-rose-500">*</span></Label>
                      <Input 
                        placeholder="VD: 123 (Xem ID trong danh sách thành viên)"
                        value={formData.member_id}
                        onChange={e => setFormData({ ...formData, member_id: e.target.value })}
                        className="h-14 bg-rose-50 border-none rounded-2xl font-bold px-6 shadow-inner"
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-sm font-bold text-slate-700 ml-1">Đường dẫn khi nhấn vào (Tùy chọn)</Label>
                    <Input 
                      placeholder="VD: /news/123 hoặc https://..."
                      value={formData.link}
                      onChange={e => setFormData({ ...formData, link: e.target.value })}
                      className="h-14 bg-slate-50 border-none rounded-2xl font-medium px-6 shadow-sm"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <Button 
                    variant="default" 
                    size="lg" 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-16 font-black text-lg shadow-xl shadow-indigo-100 transition-all hover:-translate-y-1 active:translate-y-0"
                    onClick={handleSend}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <span className="flex items-center gap-2">
                        <Clock className="w-5 h-5 animate-spin" /> Đang đẩy thông báo...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-6 h-6" /> Gửi thông báo ngay bây giờ
                      </span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview & Guide */}
            <div className="space-y-8">
               <Card className="border-none shadow-2xl rounded-[2rem] bg-slate-900 text-white overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl group-hover:scale-150 transition-transform duration-1000">
                      <Bell className="w-32 h-32" />
                  </div>
                  <CardHeader className="relative z-10 p-8">
                     <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-indigo-400" /> Xem trước (Mobile)
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 relative z-10 space-y-6">
                      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-inner">
                         <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500 p-2 flex items-center justify-center">
                               <Bell className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                               <div className="h-2 w-20 bg-white/20 rounded-full mb-1" />
                               <div className="h-1.5 w-12 bg-white/10 rounded-full" />
                            </div>
                            <span className="text-[10px] text-white/40">vừa xong</span>
                         </div>
                         <div className="space-y-2">
                            <h5 className="font-bold text-white line-clamp-1">{formData.title || 'Tiêu đề thông báo...'}</h5>
                            <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                              {formData.body || 'Nội dung thông báo sẽ hiển thị ở đây để người dùng dễ dàng theo dõi...'}
                            </p>
                         </div>
                      </div>
                      <p className="text-xs text-slate-400 italic">Lưu ý: Bạn đang thực hiện đẩy thông báo đồng loạt. Hãy kiểm tra kỹ nội dung trước khi gửi.</p>
                  </CardContent>
               </Card>

               <Card className="border-none shadow-xl rounded-[2rem] bg-indigo-600 text-white p-8 overflow-hidden relative">
                  <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                  <div className="flex items-start gap-4 relative z-10">
                     <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10 shrink-0">
                        <Sparkles className="w-6 h-6 text-yellow-300" />
                     </div>
                     <div className="space-y-2">
                        <h4 className="font-bold text-white">Kết nối trực tiếp</h4>
                        <p className="text-sm text-indigo-50/80 leading-relaxed font-medium">
                          Sử dụng thông báo đẩy một cách hợp lý để tăng tương tác. Đưa độc giả quay lại thư viện một cách tự nhiên.
                        </p>
                     </div>
                  </div>
               </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="focus-visible:outline-none">
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 p-8 flex flex-row items-center justify-between space-y-0">
               <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-600" /> Lịch sử thông báo đã gửi
                  </CardTitle>
                  <CardDescription>Thống kê và kiểm tra lại các chiến dịch đã triển khai</CardDescription>
               </div>
               <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Tìm kiếm nhật ký..." className="pl-10 bg-white border-slate-200 rounded-xl" />
               </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/30">
                  <TableRow className="hover:bg-transparent border-slate-50 h-14">
                    <TableHead className="px-8 font-bold text-slate-800">Thông báo</TableHead>
                    <TableHead className="font-bold text-slate-800">Đối tượng</TableHead>
                    <TableHead className="font-bold text-slate-800">Người gửi</TableHead>
                    <TableHead className="font-bold text-slate-800">Trạng thái</TableHead>
                    <TableHead className="font-bold text-slate-800">Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingHistory ? (
                    <TableRow><TableCell colSpan={5} className="h-60 text-center animate-pulse text-slate-400 font-bold text-lg italic">Đang tải lịch sử...</TableCell></TableRow>
                  ) : historyData?.notifications?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-80 text-center">
                        <div className="opacity-20 flex flex-col items-center gap-4">
                           <History className="w-16 h-16" />
                           <p className="font-bold text-xl uppercase tracking-widest text-slate-500">Chưa có lịch sử thông báo</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    historyData?.notifications?.map((item: any) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/50 border-slate-50 group transition-all">
                        <TableCell className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                               <Bell className="w-5 h-5" />
                            </div>
                            <div>
                               <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {typeof item.title === 'string' ? item.title : (item.title?.vi || 'N/A')}
                               </div>
                               <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[300px]">
                                  {typeof item.body === 'string' ? item.body : (item.body?.vi || 'N/A')}
                               </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getTargetBadge(item.target_type)}</TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                              <User className="w-4 h-4 text-slate-400" /> {item.sender_name || 'Admin'}
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Thành công
                           </div>
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs font-medium">
                           <div className="flex items-center gap-2">
                             <Clock className="w-3.5 h-3.5" /> {new Date(item.created_at).toLocaleString('vi-VN')}
                           </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Smartphone({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
      <path d="M12 18h.01"/>
    </svg>
  );
}
