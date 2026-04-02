"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Reply, Lock, Send, AlertCircle, Trash2, EyeOff, Flag } from "lucide-react";
import { buildUrl } from "@/lib/api/base";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";

interface Comment {
  id: number;
  user_id: number;
  user_name: string;
  content: string;
  parent_id: number | null;
  reply_to_name?: string;
  created_at: string;
  replies: Comment[];
}

interface PublicCommentListProps {
  objectId: number;
  objectType: 'news' | 'book' | 'course';
}

export default function PublicCommentList({ objectId, objectType }: PublicCommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
    fetchComments();
  }, [objectId]);

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/public/comments/${objectType}/${objectId}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (error) {
      console.error("Fetch comments error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    // Lưu URL hiện tại để chuyển hướng sau khi đăng nhập
    localStorage.setItem("redirectAfterLogin", pathname);
    router.push("/admin/login"); // Giả định trang login dùng chung hoặc login cho reader
  };

  const handleSubmit = async (e?: React.FormEvent, parentId: number | null = null, replyToUserId: number | null = null) => {
    if (e) e.preventDefault();
    const commentContent = parentId ? replyContent : content;
    
    if (!commentContent.trim()) return;
    if (!isLoggedIn) {
      handleLoginRedirect();
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/public/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          objectType,
          objectId,
          parentId,
          replyToUserId,
          content: commentContent
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(parentId ? "Đã gửi phản hồi" : "Đã gửi bình luận");
        setContent("");
        setReplyContent("");
        setReplyingTo(null);
        fetchComments();
      } else {
        toast.error(data.message || "Không thể gửi bình luận");
      }
    } catch (error) {
      toast.error("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeleteComment = async (id: number) => {
    if (!window.confirm("Bạn có muốn xóa bình luận này không?")) return;
    try {
      const res = await fetch(`${buildUrl(`/api/public/comments/${id}`)}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Đã xóa bình luận");
        fetchComments();
      } else {
        toast.error(data.message || "Lỗi khi xóa");
      }
    } catch (error) {
      toast.error("Lỗi kết nối");
    }
  };

  const handleReportComment = async (id: number) => {
    const reason = window.prompt("Lý do báo cáo vi phạm:");
    if (!reason || !reason.trim()) return;
    try {
      const res = await fetch(`${buildUrl(`/api/public/comments/${id}/report`)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Đã gửi báo cáo");
      } else {
        toast.error(data.message || "Lỗi khi báo cáo");
      }
    } catch (error) {
      toast.error("Lỗi kết nối");
    }
  };


  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? "ml-6 md:ml-12 mt-4 border-l-2 border-gray-100 pl-4" : "mt-8"}`}>
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {comment.user_name?.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 text-sm">{comment.user_name}</span>
            <span className="text-[10px] text-gray-400">{new Date(comment.created_at).toLocaleDateString('vi-VN')}</span>
          </div>
          <div className="text-gray-700 text-sm leading-relaxed">
            {comment.reply_to_name && (
              <span className="text-blue-600 font-medium mr-1 small">@{comment.reply_to_name}</span>
            )}
            {comment.content}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <button 
              onClick={() => isLoggedIn ? setReplyingTo(comment) : handleLoginRedirect()}
              className="text-xs font-medium text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <Reply className="w-3 h-3" /> Phản hồi
            </button>
            {user?.id === comment.user_id ? (
              <button 
                onClick={() => handleDeleteComment(comment.id)}
                className="text-xs font-medium text-red-300 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Xóa
              </button>
            ) : isLoggedIn && (
              <button 
                onClick={() => handleReportComment(comment.id)}
                className="text-xs font-medium text-amber-300 hover:text-amber-500 transition-colors flex items-center gap-1"
              >
                <Flag className="w-3 h-3" /> Báo cáo
              </button>
            )}
          </div>
          
          {/* Reply Input Area */}
          {replyingTo?.id === comment.id && (
            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <Textarea 
                placeholder={`Phản hồi @${comment.user_name}...`}
                className="text-sm min-h-[80px] focus:ring-blue-500"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>Hủy</Button>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 h-8"
                  disabled={submitting || !replyContent.trim()}
                  onClick={() => handleSubmit(undefined, comment.parent_id || comment.id, comment.user_id)}
                >
                  Gửi phản hồi
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="replies">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 mt-12 pt-12 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          Bình luận ({comments.reduce((acc, curr) => acc + 1 + (curr.replies?.length || 0), 0)})
        </h3>
      </div>

      {/* Main Comment Input */}
      {!isLoggedIn ? (
        <div className="p-6 border rounded-2xl bg-blue-50/50 flex flex-col md:flex-row items-center justify-between gap-4 border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-gray-900 text-sm md:text-base text-center md:text-left">Bạn cần đăng nhập để bình luận</h4>
              <p className="text-xs text-gray-500 hidden md:block">Tham gia thảo luận cùng cộng đồng bạn đọc Thư viện TN</p>
            </div>
          </div>
          <Button 
            onClick={handleLoginRedirect}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl shadow-md w-full md:w-auto"
          >
            Đăng nhập ngay
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-3">
             <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
               {user?.name?.substring(0, 2).toUpperCase()}
             </div>
             <Textarea 
               placeholder="Chia sẻ ý kiến của bạn về bài viết này..."
               className="flex-1 min-h-[100px] focus:ring-blue-500"
               value={content}
               onChange={(e) => setContent(e.target.value)}
             />
          </div>
          <div className="flex justify-end">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 px-6"
              disabled={submitting || !content.trim()}
              onClick={(e) => handleSubmit(e)}
            >
              {submitting ? "Đang gửi..." : "Đăng bình luận"}
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse">
           {[1,2,3].map(i => (
             <div key={i} className="flex gap-3">
               <div className="w-10 h-10 rounded-full bg-gray-200" />
               <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
               </div>
             </div>
           ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-gray-400 italic">
           Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ!
        </div>
      ) : (
        <div className="divide-y divide-gray-50 pb-12">
          {comments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  );
}
