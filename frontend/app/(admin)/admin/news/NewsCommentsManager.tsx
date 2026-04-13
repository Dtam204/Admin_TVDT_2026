"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Trash2, Eye, EyeOff, Reply, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { adminApiCall, AdminEndpoints } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { safeFormatDateTimeVN } from '@/lib/date';

interface Comment {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'hidden' | 'deleted';
  parent_id: number | null;
  reply_to_name?: string;
  created_at: string;
  replies: Comment[];
}

interface NewsCommentsManagerProps {
  newsId: number;
}

export default function NewsCommentsManager({ newsId }: NewsCommentsManagerProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await adminApiCall<{ success: boolean; data: Comment[] }>(
        `${AdminEndpoints.comments.admin.list}?objectType=news&objectId=${newsId}`
      );
      setComments(response.data || []);
    } catch (error: any) {
      toast.error("Không thể tải danh sách bình luận");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (newsId) fetchComments();
  }, [newsId]);

  const handleStatusChange = async (commentId: number, newStatus: string) => {
    try {
      await adminApiCall(AdminEndpoints.comments.admin.status(commentId), {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success("Đã cập nhật trạng thái bình luận");
      fetchComments();
    } catch (error: any) {
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
    try {
      await adminApiCall(AdminEndpoints.comments.admin.delete(commentId), {
        method: "DELETE",
      });
      toast.success("Đã xóa bình luận");
      fetchComments();
    } catch (error: any) {
      toast.error("Lỗi khi xóa bình luận");
    }
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim() || !replyingTo) return;
    try {
      setSubmittingReply(true);
      await adminApiCall(AdminEndpoints.comments.admin.reply(replyingTo.id), {
        method: "POST",
        body: JSON.stringify({
          content: replyContent,
        }),
      });
      toast.success("Đã gửi phản hồi");
      setReplyContent("");
      setReplyingTo(null);
      fetchComments();
    } catch (error: any) {
      toast.error("Lỗi khi gửi phản hồi");
    } finally {
      setSubmittingReply(false);
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? "ml-8 mt-4 border-l-2 pl-4" : "mt-6"} group`}>
      <Card className={`p-4 ${comment.status === 'hidden' ? 'bg-gray-50 opacity-75' : 'bg-white shadow-sm'}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
              {comment.user_name.substring(0, 2)}
            </div>
            <div>
              <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                {comment.user_name}
                {comment.reply_to_name && (
                  <span className="text-xs text-blue-500 font-normal">
                    phản hồi @{comment.reply_to_name}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-gray-400">{safeFormatDateTimeVN(comment.created_at)}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => setReplyingTo(comment)}
              title="Phản hồi"
            >
              <Reply className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-gray-700"
              onClick={() => handleStatusChange(comment.id, comment.status === 'hidden' ? 'approved' : 'hidden')}
              title={comment.status === 'hidden' ? "Hiện" : "Ẩn"}
            >
              {comment.status === 'hidden' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleDelete(comment.id)}
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-gray-700 mb-2 leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </div>

        <div className="flex items-center gap-2 mt-2">
          {comment.status === 'approved' && (
            <Badge className="bg-green-50 text-green-600 border-green-100 font-normal text-[10px] py-0">
              Đã duyệt
            </Badge>
          )}
          {comment.status === 'hidden' && (
            <Badge className="bg-yellow-50 text-yellow-600 border-yellow-100 font-normal text-[10px] py-0">
              Đã ẩn
            </Badge>
          )}
        </div>
      </Card>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="replies-list">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          Quản lý bình luận ({comments.length})
        </h3>
        <Button variant="outline" size="sm" onClick={fetchComments} disabled={loading}>
          Làm mới
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400 italic">Đang tải bình luận...</div>
      ) : comments.length === 0 ? (
        <div className="py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center text-gray-400">
          Chưa có bình luận nào cho bài viết này.
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => renderComment(comment))}
        </div>
      )}

      {/* Reply Dialog/Input Box */}
      {replyingTo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-gray-900">Phản hồi bình luận</h4>
              <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)}>
                <XCircle className="w-5 h-5 text-gray-400" />
              </Button>
            </div>
            
            <div className="p-3 bg-gray-50 rounded text-sm text-gray-600 italic border-l-4 border-blue-500">
              " {replyingTo.content.substring(0, 100)}{replyingTo.content.length > 100 ? "..." : ""} "
              <div className="mt-1 font-semibold text-blue-600">— {replyingTo.user_name}</div>
            </div>

            <Textarea
              placeholder="Nhập nội dung phản hồi của bạn..."
              className="min-h-[120px]"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setReplyingTo(null)}>Hủy</Button>
              <Button 
                onClick={handleReplySubmit} 
                disabled={submittingReply || !replyContent.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
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
