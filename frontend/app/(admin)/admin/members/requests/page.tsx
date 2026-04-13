'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Search, 
  Filter, 
  MoreHorizontal,
  ChevronRight,
  ArrowLeft,
  CalendarDays,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useMembershipRequests, useApproveRenewal, useRejectRenewal } from '@/lib/hooks/useMembers';
import { toast } from 'sonner';
import Link from 'next/link';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { safeFormatDateVN } from '@/lib/date';

export default function MembershipRequestsPage() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading } = useMembershipRequests({ status: statusFilter });
  
  const approveMutation = useApproveRenewal();
  const rejectMutation = useRejectRenewal();

  // Dialog states
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [manualDays, setManualDays] = useState('');

  const requests = data?.data || [];

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    try {
      await approveMutation.mutateAsync({
        id: selectedRequest.id,
        data: {
          admin_note: adminNote,
          manual_days: manualDays,
          processed_by: 1 // TODO: Get from auth context
        }
      });
      toast.success('Đã phê duyệt gia hạn hội viên thành công');
      setIsApproveOpen(false);
      resetDialog();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi phê duyệt');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    try {
      await rejectMutation.mutateAsync({
        id: selectedRequest.id,
        data: {
          admin_note: adminNote,
          processed_by: 1
        }
      });
      toast.success('Đã từ chối yêu cầu gia hạn');
      setIsRejectOpen(false);
      resetDialog();
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const resetDialog = () => {
    setSelectedRequest(null);
    setAdminNote('');
    setManualDays('');
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/members">
              <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại Quản lý bạn đọc
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Duyệt yêu cầu Gia hạn</h1>
          <p className="text-muted-foreground">Phê duyệt hoặc từ chối các yêu cầu gia hạn từ bạn đọc qua Mobile App.</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-amber-100 bg-amber-50/30">
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Đang chờ duyệt</CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-amber-900">{requests.filter((r:any) => r.status === 'pending').length}</div>
            <p className="text-xs text-amber-600">Yêu cầu cần xử lý ngay</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex items-center gap-2">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Tìm theo tên hoặc mã thẻ..." 
                  className="pl-9 bg-gray-50/50" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex border rounded-md p-1 bg-gray-100">
                <Button 
                  variant={statusFilter === 'pending' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className={`h-7 px-3 text-xs ${statusFilter === 'pending' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => setStatusFilter('pending')}
                >
                  Đang chờ
                </Button>
                <Button 
                  variant={statusFilter === 'approved' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className={`h-7 px-3 text-xs ${statusFilter === 'approved' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => setStatusFilter('approved')}
                >
                  Đã duyệt
                </Button>
                <Button 
                  variant={statusFilter === 'all' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className={`h-7 px-3 text-xs ${statusFilter === 'all' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  Tất cả
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead>Bạn đọc / Mã thẻ</TableHead>
                <TableHead>Gói yêu cầu</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead>Lý do / Ghi chú</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">Đang tải dữ liệu...</TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Không có yêu cầu nào.</TableCell>
                </TableRow>
              ) : (
                requests.map((request: any) => (
                  <TableRow key={request.id} className="hover:bg-gray-50/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{request.member_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{request.card_number}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100 font-medium">
                        {request.plan_name || 'Mặc định'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {safeFormatDateVN(request.created_at)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate italic text-gray-500 text-sm">
                      "{request.request_note || 'Không có ghi chú'}"
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' && <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Đang chờ</Badge>}
                      {request.status === 'approved' && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Đã duyệt</Badge>}
                      {request.status === 'rejected' && <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Từ chối</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsApproveOpen(true);
                            }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Duyệt
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsRejectOpen(true);
                            }}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs italic text-muted-foreground">Xử lý bởi: {request.processor_name}</p>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* APPROVE DIALOG */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <ShieldCheck className="w-5 h-5" /> Phê duyệt gia hạn hội viên
            </DialogTitle>
            <DialogDescription>
              Bạn đang phê duyệt yêu cầu của <strong>{selectedRequest?.member_name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-2">
              <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Thông tin gói yêu cầu
              </h4>
              <p className="text-sm text-blue-700">
                Gói yêu cầu: <strong>{selectedRequest?.plan_name}</strong>
              </p>
              <p className="text-xs text-blue-600 italic">
                * Mặc định hệ thống sẽ tự cộng số ngày theo gói cước nếu bạn bỏ trống mục bên dưới.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manualDays" className="font-bold">Số ngày gia hạn thủ công (Nếu muốn thay đổi)</Label>
                <div className="flex gap-2">
                  {[3, 7, 30].map(day => (
                    <Button 
                      key={day} 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className={manualDays === day.toString() ? 'bg-blue-600 text-white' : ''}
                      onClick={() => setManualDays(day.toString())}
                    >
                      +{day} ngày
                    </Button>
                  ))}
                  <Input 
                    id="manualDays" 
                    placeholder="Nhập số ngày khác..." 
                    type="number" 
                    className="flex-1"
                    value={manualDays}
                    onChange={(e) => setManualDays(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminNote">Ghi chú phản hồi cho bạn đọc</Label>
                <Textarea 
                  id="adminNote" 
                  placeholder="Ví dụ: Đã phê duyệt gia hạn gói VIP..." 
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Hủy</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleApprove} disabled={approveMutation.isPending}>
              Xác nhận Phê duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECT DIALOG */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-700">Từ chối yêu cầu</DialogTitle>
            <DialogDescription>Nhập lý do từ chối yêu cầu của hội viên.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="rejectNote">Lý do từ chối</Label>
            <Textarea 
              id="rejectNote" 
              placeholder="Ví dụ: Tài khoản vi phạm quy định, đã hết hạn thẻ lâu ngày..." 
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>
              Xác nhận Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
