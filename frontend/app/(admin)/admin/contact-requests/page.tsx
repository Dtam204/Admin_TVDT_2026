"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Eye, Trash2, Edit, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { adminApiCall, AdminEndpoints } from "@/lib/api/admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type RequestStatus = "pending" | "processing" | "completed" | "cancelled";

interface ContactRequest {
  id: number;
  name: string;
  email: string;
  phone: string;
  company?: string;
  service: string;
  message: string;
  status: RequestStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const PAGE_SIZE = 10;

const statusLabels: Record<RequestStatus, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const statusColors: Record<RequestStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminContactRequestsPage() {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | RequestStatus>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<RequestStatus>("pending");
  const [editNotes, setEditNotes] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
      });
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (search) {
        params.append("search", search);
      }

      const data = await adminApiCall<{
        success: boolean;
        data?: ContactRequest[];
        pagination?: { total: number; page: number; limit: number; totalPages: number };
      }>(`${AdminEndpoints.contact.requests.list}?${params.toString()}`);

      setRequests(data?.data || []);
      setTotal(data?.pagination?.total || 0);
    } catch (error: any) {
      toast.error(error?.message || "Không thể tải danh sách yêu cầu");
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRequests();
  }, [page, statusFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleView = (request: ContactRequest) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleEdit = (request: ContactRequest) => {
    setSelectedRequest(request);
    setEditStatus(request.status);
    setEditNotes(request.notes || "");
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedRequest) return;

    try {
      await adminApiCall(AdminEndpoints.contact.requests.update(selectedRequest.id), {
        method: "PUT",
        body: JSON.stringify({
          status: editStatus,
          notes: editNotes,
        }),
      });
      toast.success("Đã cập nhật yêu cầu thành công");
      setEditDialogOpen(false);
      void fetchRequests();
    } catch (error: any) {
      toast.error(error?.message || "Không thể cập nhật yêu cầu");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa yêu cầu này?")) return;

    try {
      await adminApiCall(AdminEndpoints.contact.requests.delete(id), {
        method: "DELETE",
      });
      toast.success("Đã xóa yêu cầu thành công");
      void fetchRequests();
    } catch (error: any) {
      toast.error(error?.message || "Không thể xóa yêu cầu");
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý yêu cầu tư vấn</h1>
          <p className="text-gray-600 mt-2">Quản lý các yêu cầu tư vấn từ form liên hệ</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="processing">Đang xử lý</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Đang tải...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Không có yêu cầu nào</div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{request.name}</h3>
                          <Badge className={statusColors[request.status]}>
                            {statusLabels[request.status]}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Email:</span> {request.email}
                          </div>
                          <div>
                            <span className="font-medium">Điện thoại:</span> {request.phone}
                          </div>
                          {request.company && (
                            <div>
                              <span className="font-medium">Công ty:</span> {request.company}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Dịch vụ:</span> {request.service}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {request.message}
                        </p>
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(request.createdAt).toLocaleString("vi-VN")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(request)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(request)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(request.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Hiển thị {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, total)} / {total}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Trước
                    </Button>
                    <span className="text-sm text-gray-600">
                      Trang {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu tư vấn</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Họ và tên</Label>
                  <p className="font-medium">{selectedRequest.name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Email</Label>
                  <p className="font-medium">{selectedRequest.email}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Điện thoại</Label>
                  <p className="font-medium">{selectedRequest.phone}</p>
                </div>
                {selectedRequest.company && (
                  <div>
                    <Label className="text-gray-500">Công ty</Label>
                    <p className="font-medium">{selectedRequest.company}</p>
                  </div>
                )}
                <div>
                  <Label className="text-gray-500">Dịch vụ quan tâm</Label>
                  <p className="font-medium">{selectedRequest.service}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Trạng thái</Label>
                  <Badge className={statusColors[selectedRequest.status]}>
                    {statusLabels[selectedRequest.status]}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">Nội dung yêu cầu</Label>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                  {selectedRequest.message}
                </p>
              </div>
              {selectedRequest.notes && (
                <div>
                  <Label className="text-gray-500">Ghi chú</Label>
                  <p className="mt-1 p-3 bg-blue-50 rounded-lg whitespace-pre-wrap">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}
              <div className="text-sm text-gray-500">
                <p>Ngày tạo: {new Date(selectedRequest.createdAt).toLocaleString("vi-VN")}</p>
                <p>Ngày cập nhật: {new Date(selectedRequest.updatedAt).toLocaleString("vi-VN")}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Đóng
            </Button>
            {selectedRequest && (
              <Button onClick={() => {
                setViewDialogOpen(false);
                handleEdit(selectedRequest);
              }}>
                Chỉnh sửa
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa yêu cầu tư vấn</DialogTitle>
            <DialogDescription>
              Cập nhật trạng thái và ghi chú cho yêu cầu này
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <Label>Trạng thái</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as RequestStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                    <SelectItem value="processing">Đang xử lý</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ghi chú</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Thêm ghi chú về yêu cầu này..."
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdate}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

