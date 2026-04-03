'use client';

import { useState } from 'react';
import { 
  useMembershipRequests, 
  useApproveMembershipRequest, 
  useRejectMembershipRequest 
} from '@/lib/hooks/useMembershipRequests';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Bell, CheckCircle2, XCircle, Clock, Search, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function MembershipRequestsPage() {
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useMembershipRequests({ status, page, limit: 20 });
  const approveMutation = useApproveMembershipRequest();
  const rejectMutation = useRejectMembershipRequest();

  // Dialog states
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNote, setAdminNote] = useState('');
  const [manualDays, setManualDays] = useState<number | ''>('');
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);



  const handleApprove = () => {
    if (!selectedRequest) return;
    approveMutation.mutate({
      id: selectedRequest.id,
      data: { admin_note: adminNote, manual_days: manualDays === '' ? undefined : Number(manualDays) }
    }, {
      onSuccess: (res) => {
        toast.success(res.message || 'Đã phê duyệt thành công');
        setIsApproveOpen(false);
        resetForm();
      },
      onError: (err: any) => toast.error(err.message || 'Lỗi khi phê duyệt')
    });
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    rejectMutation.mutate({
      id: selectedRequest.id,
      data: { admin_note: adminNote }
    }, {
      onSuccess: () => {
        toast.success('Đã từ chối yêu cầu');
        setIsRejectOpen(false);
        resetForm();
      },
      onError: (err: any) => toast.error(err.message || 'Lỗi khi thực hiện')
    });
  };

  const resetForm = () => {
    setSelectedRequest(null);
    setAdminNote('');
    setManualDays('');
  };

  const getStatusBadge = (status: string) => {
    const map: any = {
      pending: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
      approved: { label: 'Đã phê duyệt', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      rejected: { label: 'Đã từ chối', cls: 'bg-red-100 text-red-700 border-red-200' },
    };
    const cfg = map[status] || { label: status, cls: '' };
    return <Badge variant="outline" className={`font-bold ${cfg.cls}`}>{cfg.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
              <Bell className="w-7 h-7" />
            </div>
            Duyệt đơn <span className="text-amber-600">Gia hạn & Nâng cấp</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Xử lý các yêu cầu thay đổi hạng thẻ từ độc giả Online</p>
        </div>
      </div>

      <Tabs value={status} onValueChange={(val) => { setStatus(val); setPage(1); }} className="w-full">
        <TabsList className="bg-slate-100 p-1 mb-6 rounded-xl">
          <TabsTrigger value="pending" className="px-6 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Đang chờ</TabsTrigger>
          <TabsTrigger value="approved" className="px-6 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-emerald-600 font-bold">Đã duyệt</TabsTrigger>
          <TabsTrigger value="rejected" className="px-6 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-red-600 font-bold">Từ chối</TabsTrigger>
        </TabsList>

        <Card className="border-slate-200 shadow-xl shadow-slate-100 overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold pl-6 py-4">Bạn đọc</TableHead>
                  <TableHead className="font-bold">Gói & Giá tiền</TableHead>
                  <TableHead className="font-bold text-center">Thời hạn</TableHead>
                  <TableHead className="font-bold">Ghi chú từ khách</TableHead>
                  <TableHead className="font-bold">Thời gian gửi</TableHead>
                  <TableHead className="text-right pr-6">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-400">Đang tải dữ liệu...</TableCell></TableRow>
                ) : data?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-60 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <CheckCircle2 className="w-12 h-12 opacity-20" />
                        <p className="font-medium italic text-lg">Không có yêu cầu nào trong danh sách này</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.data.map((req: any) => (
                    <TableRow key={req.id} className="group hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{req.member_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Card: {req.card_number}</div>
                        {req.status === 'pending' && (
                          <div className="mt-2 p-1.5 bg-indigo-50 rounded-lg border border-indigo-100 w-fit">
                            <p className="text-[9px] font-black uppercase text-indigo-600 tracking-tighter leading-none mb-1">NỘI DUNG CHUYỂN KHOẢN (SEPAY)</p>
                            <p className="text-xs font-black text-indigo-700 font-mono">TVDT {req.id}</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-bold w-fit">
                            {req.plan_name || 'Gói mặc định'}
                          </Badge>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Giá chốt đơn:</span>
                            <span className="text-sm font-black text-emerald-600">
                              {Number(req.amount || req.plan_price || 0).toLocaleString('vi-VN')} VNĐ
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium text-slate-600">
                        {req.plan_duration || 30} ngày
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="text-sm text-slate-600 italic line-clamp-2">{req.request_note || '-'}</p>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(req.created_at).toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {req.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                             <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-500 border-red-100 hover:bg-red-50"
                              onClick={() => { setSelectedRequest(req); setIsRejectOpen(true); }}
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Từ chối
                            </Button>

                            <Button 
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => { setSelectedRequest(req); setIsApproveOpen(true); }}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" /> Duyệt
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            {getStatusBadge(req.status)}
                            {req.status === 'approved' && (
                              <div className="mt-2 text-right">
                                {req.external_txn_id && (
                                  <div className="text-[9px] text-emerald-600 font-black uppercase font-mono bg-emerald-50 px-2 py-1 rounded border border-emerald-100 mb-1">
                                    TXN: {req.external_txn_id}
                                  </div>
                                )}
                                <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1 font-bold">
                                  <Info className="w-3 h-3" /> {req.gateway ? `Qua ${req.gateway}` : `Bởi: ${req.processor_name || 'Admin'}`}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" /> Xác nhận phê duyệt
            </DialogTitle>
            <DialogDescription>
              Hệ thống sẽ kích hoạt hoặc gia hạn thẻ cho <strong>{selectedRequest?.member_name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-bold">Số ngày gia hạn (Để trống nếu dùng mặc định của gói)</Label>
              <Input 
                type="number" 
                placeholder="Ví dụ: 30, 90, 365" 
                value={manualDays} 
                onChange={(e) => setManualDays(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-bold">Ghi chú nội bộ</Label>
              <Textarea 
                placeholder="Nội dung sẽ hiển thị trong nhật ký hoạt động..." 
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Hủy</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? 'Đang xử lý...' : 'Xác nhận Kích hoạt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
              <XCircle className="w-6 h-6" /> Từ chối yêu cầu
            </DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối để độc giả được biết.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-bold">Lý do từ chối (Gửi cho khách)</Label>
              <Textarea 
                placeholder="Ví dụ: Chưa nhận được thanh toán chuyển khoản, thông tin không hợp lệ..." 
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Quay lại</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? 'Đang xử lý...' : 'Xác nhận Từ chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
