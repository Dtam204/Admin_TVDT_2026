"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  MessageSquare, 
  Trash2, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  Search, 
  Filter, 
  User, 
  ExternalLink,
  MessageCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Reply,
  XCircle,
  Clock
} from "lucide-react";
import { adminApiCall, AdminEndpoints } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Comment {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'hidden' | 'deleted';
  object_type: string;
  object_id: number;
  object_title?: string;
  parent_id: number | null;
  reply_to_name?: string;
  created_at: string;
  report_count?: number;
}

interface CommentReport {
  id: number;
  comment_id: number;
  comment_content: string;
  reporter_id: number;
  reporter_name: string;
  reason: string;
  created_at: string;
}

export default function AdminCommentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center animate-pulse text-gray-500">Đang tải trình quản lý bình luận...</div>}>
      <CommentsManagerContent />
    </Suspense>
  );
}

function CommentsManagerContent() {
  const searchParams = useSearchParams();
  const initialObjectId = searchParams.get("objectId");
  const initialObjectType = searchParams.get("objectType") || "all";

  const [comments, setComments] = useState<Comment[]>([]);
  const [reports, setReports] = useState<CommentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState(initialObjectType);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"all" | "reports">("all");
  const pageSize = 10;

  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [commentsRes, reportsRes] = await Promise.all([
        adminApiCall<{ success: boolean; data: Comment[] }>(AdminEndpoints.comments.admin.list),
        adminApiCall<{ success: boolean; data: CommentReport[] }>(AdminEndpoints.comments.admin.reports)
      ]);
      setComments(commentsRes.data || []);
      setReports(reportsRes.data || []);
    } catch (error: any) {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await adminApiCall(AdminEndpoints.comments.admin.status(id), {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success("Đã cập nhật trạng thái");
      fetchData();
    } catch (error: any) {
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
    try {
      await adminApiCall(AdminEndpoints.comments.public.delete(id), {
        method: "DELETE",
      });
      toast.success("Đã xóa bình luận");
      fetchData();
    } catch (error: any) {
      toast.error("Lỗi khi xóa bình luận");
    }
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim() || !replyingTo) return;
    try {
      setSubmittingReply(true);
      await adminApiCall(AdminEndpoints.comments.public.create, {
        method: "POST",
        body: JSON.stringify({
          objectType: replyingTo.object_type,
          objectId: replyingTo.object_id,
          parentId: replyingTo.parent_id || replyingTo.id,
          replyToUserId: replyingTo.user_id,
          content: replyContent,
        }),
      });
      toast.success("Đã gửi phản hồi");
      setReplyContent("");
      setReplyingTo(null);
      fetchData();
    } catch (error: any) {
      toast.error("Lỗi khi gửi phản hồi");
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredComments = useMemo(() => {
    return comments.filter(c => {
      const matchesSearch = c.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.user_email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesType = typeFilter === "all" || c.object_type === typeFilter;
      const matchesId = !initialObjectId || c.object_id === parseInt(initialObjectId);
      return matchesSearch && matchesStatus && matchesType && matchesId;
    });
  }, [comments, searchTerm, statusFilter, typeFilter, initialObjectId]);

  const paginatedComments = filteredComments.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredComments.length / pageSize);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Đã duyệt</Badge>;
      case 'pending': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Chờ duyệt</Badge>;
      case 'hidden': return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs">Đã ẩn</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Bị từ chối</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            Quản lý bình luận
          </h1>
          <p className="text-gray-500 mt-1">Kiểm duyệt và phản hồi ý kiến từ độc giả trên toàn hệ thống.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <Clock className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-gray-100 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng bình luận</p>
                <h3 className="text-2xl font-bold text-gray-900">{comments.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-100 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Chờ duyệt</p>
                <h3 className="text-2xl font-bold text-gray-900">{comments.filter(c => c.status === 'pending').length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-100 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                <Flag className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Báo cáo vi phạm</p>
                <h3 className="text-2xl font-bold text-gray-900">{comments.filter(c => (c.report_count || 0) > 0).length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-100 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Đã duyệt</p>
                <h3 className="text-2xl font-bold text-gray-900">{comments.filter(c => c.status === 'approved').length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="bg-gray-100/50 p-1 mb-6">
          <TabsTrigger value="all" className="rounded-lg px-6">
            Tất cả bình luận
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-lg px-6 flex gap-2">
            Báo cáo vi phạm
            {reports.length > 0 && (
              <Badge className="bg-red-500 text-white border-0 px-1.5 h-4 text-[10px]">
                {reports.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card className="border-gray-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50/50 pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Tìm bình luận, tên người dùng, email..."
                    className="pl-9 bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px] bg-white">
                      <Filter className="w-4 h-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="pending">Chờ duyệt</SelectItem>
                      <SelectItem value="approved">Đã duyệt</SelectItem>
                      <SelectItem value="hidden">Đã ẩn</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[160px] bg-white">
                      <SelectValue placeholder="Chuyên mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả chuyên mục</SelectItem>
                      <SelectItem value="news">Tin tức</SelectItem>
                      <SelectItem value="course">Khóa học</SelectItem>
                      <SelectItem value="book">Ấn phẩm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-y border-gray-100 text-gray-600 font-medium">
                    <tr>
                      <th className="px-6 py-4">Người dùng</th>
                      <th className="px-6 py-4">Nội dung</th>
                      <th className="px-6 py-4">Nguồn</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={5} className="px-6 py-8 h-20 bg-gray-50/20"></td>
                        </tr>
                      ))
                    ) : paginatedComments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                          Không tìm thấy bình luận nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      paginatedComments.map((comment) => (
                        <tr key={comment.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                {comment.user_name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{comment.user_name}</div>
                                <div className="text-xs text-gray-500">{comment.user_email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 max-w-md">
                            <div className="line-clamp-2 text-gray-700 leading-relaxed mb-1">
                              {comment.content}
                            </div>
                            <div className="text-[10px] text-gray-400 flex items-center gap-2">
                               <Clock className="w-3 h-3" />
                               {new Date(comment.created_at).toLocaleString('vi-VN')}
                               {(comment.report_count || 0) > 0 && (
                                 <Badge className="bg-red-50 text-red-600 border-none px-1.5 h-4 text-[9px]">
                                   {comment.report_count} báo cáo
                                 </Badge>
                               )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <Badge variant="secondary" className="w-fit text-[10px] mb-1 capitalize">
                                {comment.object_type === 'news' ? 'Tin tức' : comment.object_type}
                              </Badge>
                              <span className="text-xs font-medium text-gray-600 truncate max-w-[150px]">
                                {comment.object_title || `#${comment.object_id}`}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            {getStatusBadge(comment.status)}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                onClick={() => setReplyingTo(comment)}
                                title="Phản hồi"
                              >
                                <Reply className="w-4 h-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4 text-gray-400" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Tùy chọn</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleStatusChange(comment.id, 'approved')}>
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                    Duyệt ngay
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(comment.id, 'hidden')}>
                                    <EyeOff className="w-4 h-4 mr-2 text-yellow-600" />
                                    Ẩn bình luận
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(comment.id)}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Xóa vĩnh viễn
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredComments.length)} trên {filteredComments.length} bình luận
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="text-sm font-medium">Trang {page} / {totalPages}</div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={page === totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-0">
               <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-y border-gray-100 text-gray-600 font-medium">
                    <tr>
                      <th className="px-6 py-4">Bình luận</th>
                      <th className="px-6 py-4">Người báo cáo</th>
                      <th className="px-6 py-4">Lý do</th>
                      <th className="px-6 py-4">Ngày gửi</th>
                      <th className="px-6 py-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={5} className="px-6 py-8 h-20 bg-gray-50/20"></td>
                        </tr>
                      ))
                    ) : reports.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                          Chưa có báo cáo vi phạm nào.
                        </td>
                      </tr>
                    ) : (
                      reports.map((report) => (
                        <tr key={report.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-5 max-w-xs">
                            <div className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                              {report.comment_content}
                            </div>
                            <div className="text-[10px] text-gray-400">ID Bình luận: #{report.comment_id}</div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="font-medium text-gray-700">{report.reporter_name}</div>
                            <div className="text-[10px] text-gray-400">ID: #{report.reporter_id}</div>
                          </td>
                          <td className="px-6 py-5">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100">
                              {report.reason}
                            </Badge>
                          </td>
                          <td className="px-6 py-5">
                             <span className="text-gray-500 text-xs">
                               {new Date(report.created_at).toLocaleString('vi-VN')}
                             </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 text-xs border-green-200 text-green-700 hover:bg-green-50"
                                  onClick={() => handleStatusChange(report.comment_id, 'approved')}
                                >
                                  Giữ lại
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  className="h-8 text-xs"
                                  onClick={() => handleStatusChange(report.comment_id, 'hidden')}
                                >
                                  Ẩn ngay
                                </Button>
                             </div>
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
      </Tabs>

      {/* Reply Dialog */}
      {replyingTo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <Reply className="w-4 h-4 text-blue-600" />
                Phản hồi bình luận
              </h4>
              <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)}>
                <XCircle className="w-5 h-5 text-gray-400" />
              </Button>
            </div>
            
            <div className="p-3 bg-gray-50 rounded text-sm text-gray-600 italic border-l-4 border-blue-500">
              " {replyingTo.content.substring(0, 150)}{replyingTo.content.length > 150 ? "..." : ""} "
              <div className="mt-1 font-semibold text-blue-600">— {replyingTo.user_name}</div>
            </div>

            <Textarea
              placeholder="Nhập nội dung phản hồi từ Admin..."
              className="min-h-[120px] focus:ring-2 focus:ring-blue-500"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setReplyingTo(null)} className="rounded-xl">Hủy</Button>
              <Button 
                onClick={handleReplySubmit} 
                disabled={submittingReply || !replyContent.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl shadow-md"
              >
                {submittingReply ? "Đang gửi..." : "Gửi phản hồi"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
