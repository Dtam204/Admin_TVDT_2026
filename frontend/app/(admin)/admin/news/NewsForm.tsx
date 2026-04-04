"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Clock,
  User,
  Link as LinkIcon,
  Image as ImageIcon,
  Settings,
  Info,
  Calendar,
  Sparkles,
  MessageCircle,
  Trash,
  Smartphone,
  X,
} from "lucide-react";
import { adminApiCall, AdminEndpoints } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { getCleanValue } from "@/lib/utils/locale-admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUpload from "@/components/admin/ImageUpload";
import { buildUrl } from "@/lib/api/base";
import MediaLibraryPicker from "./MediaLibraryPicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateForInput, generateSlug } from "@/lib/date";
import NewsCommentsManager from "./NewsCommentsManager";

// Types

type NewsStatus = "draft" | "pending" | "approved" | "rejected" | "published";


interface NewsFormData {
  id?: number;
  title: string;
  excerpt: string;
  content: string;
  status: NewsStatus;
  isFeatured: boolean;
  imageUrl?: string;
  author: string;
  readTime: string;
  slug: string;
  publishedDate: string;

  // Cấu hình nội dung chi tiết
  galleryImages: string[];
  galleryPosition: "top" | "bottom";
  showAuthorBox: boolean;
}

interface NewsFormProps {
  initialData?: Partial<NewsFormData>;
  onSave: (data: NewsFormData) => void | Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function NewsForm({
  initialData,
  onSave,
  onCancel,
  isEditing = false,
}: NewsFormProps) {

  const [formData, setFormData] = useState<NewsFormData>({
    id: initialData?.id,
    title: initialData?.title || "",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    status: (initialData?.status as NewsStatus) || "draft",
    isFeatured: initialData?.isFeatured ?? false,
    imageUrl: initialData?.imageUrl,
    author: initialData?.author || "Thư viện TN",
    readTime: initialData?.readTime || "5 phút đọc",
    slug: initialData?.slug || "",
    publishedDate:
      initialData?.publishedDate || new Date().toISOString().split("T")[0],

    // Cấu hình nâng cao cho nội dung chi tiết
    galleryImages: (initialData as any)?.galleryImages || [],
    galleryPosition: (initialData as any)?.galleryPosition || "top",
    showAuthorBox:
      (initialData as any)?.showAuthorBox ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageTab, setImageTab] = useState<"library" | "upload">("library");
  const [activeTab, setActiveTab] = useState<"content" | "settings" | "comments">("content");
  // Nếu đang edit và đã có slug từ DB, không tự động generate nữa
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!(isEditing && initialData?.slug));
  // Key để reset component ImageUpload dùng cho gallery (re-mount sau mỗi lần chọn ảnh)
  const [galleryUploadKey, setGalleryUploadKey] = useState(0);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Tự động generate slug từ title khi title thay đổi (chỉ khi chưa chỉnh sửa thủ công và không có slug từ DB)
  useEffect(() => {
    // Chỉ tự động generate khi:
    // 1. Chưa chỉnh sửa thủ công
    // 2. Có tiêu đề
    // 3. Không phải đang edit với slug đã có từ DB
    const titleText = formData.title;
    if (!slugManuallyEdited && titleText && !(isEditing && ((initialData as any)?.slug || (initialData as any)?.link))) {
      const autoSlug = generateSlug(titleText);
      if (autoSlug) {
        setFormData(prev => ({ ...prev, slug: autoSlug }));
      }
    }
  }, [formData.title, slugManuallyEdited, isEditing, (initialData as any)?.slug, (initialData as any)?.link]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const titleText = formData.title;
    if (!titleText.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài viết");
      return;
    }

    const contentText = formData.content;
    if (!contentText.trim()) {
      toast.error("Vui lòng nhập nội dung bài viết");
      return;
    }

    try {
      setSaving(true);
      // Gửi dữ liệu chuỗi thuần sau khi database đã được flatten
      await onSave(formData);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi lưu bài viết");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditing ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {isEditing
                    ? "Cập nhật thông tin bài viết"
                    : "Điền đầy đủ thông tin để tạo bài viết"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowMobilePreview(true)}
                className="hidden sm:flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Smartphone className="w-4 h-4" />
                Xem trước
              </Button>
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={saving}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Đang lưu..." : isEditing ? "Cập nhật" : "Lưu bài viết"}
              </Button>
            </div>
          </div>
        </div>
      </div>


      {/* Form Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <form onSubmit={handleSubmit}>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
            className="w-full space-y-6"
          >
            {/* Horizontal tabs navigation */}
            <Card className="mb-6">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  {[
                    {
                      value: "content",
                      label: "Nội dung",
                      description: "Tiêu đề, tóm tắt, nội dung",
                      icon: Info,
                    },
                    {
                      value: "settings",
                      label: "Cấu hình",
                      description: "Trạng thái, Tác giả, Ảnh bìa",
                      icon: Settings,
                    },
                    ...(isEditing && initialData?.id ? [{
                      value: "comments",
                      label: "Bình luận",
                      description: "Quản lý phản hồi",
                      icon: MessageCircle,
                    }] : []),
                  ].map((tab, index) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.value;
                    const isLast = (isEditing && initialData?.id) ? index === 2 : index === 1;
                    return (
                      <div key={tab.value} className="flex items-center flex-1">
                        <button
                          type="button"
                          onClick={() => setActiveTab(tab.value as any)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                            ? "bg-blue-50 text-blue-700 border-2 border-blue-500"
                            : "bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100"
                            }`}
                        >
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isActive
                            ? "bg-blue-500 text-white"
                            : "bg-gray-300 text-gray-600"
                            }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-sm">{tab.label}</div>
                            <div className="text-xs opacity-75">{tab.description}</div>
                          </div>
                        </button>
                        {!isLast && (
                          <div className="flex-1 h-0.5 mx-2 bg-gray-300" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <div className="w-full space-y-6">
              <TabsContent value="content" className="space-y-6">
                {/* Nội dung bài viết */}
                <section className="space-y-4 lg:space-y-5">
                  <Card className="border border-gray-100 shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Info className="w-5 h-5 text-blue-600" />
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                              Nội dung bài viết
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Phần nội dung chính người dùng sẽ nhìn thấy trên trang tin tức.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-5">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title" className="text-sm font-semibold italic text-blue-700">Tiêu đề bài viết</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Nhập tiêu đề bài viết..."
                            className="h-10 border-blue-100 focus:border-blue-400"
                          />
                        </div>

{/* 
                        <div className="space-y-2">
                          <Label htmlFor="link" className="text-sm font-semibold">
                            <LinkIcon className="w-3 h-3 inline mr-1" />
                            Slug / Đường dẫn
                          </Label>
                          <Input
                            id="link"
                            value={formData.slug}
                            onChange={(e) => {
                              setSlugManuallyEdited(true);
                              setFormData({ ...formData, slug: e.target.value });
                            }}
                            placeholder="tin-tuc-slug"
                          />
                          <p className="text-[11px] text-gray-500">
                            Dùng tiếng Việt không dấu, cách nhau bằng dấu gạch ngang.
                          </p>
                        </div>
*/}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="excerpt" className="text-sm font-semibold italic text-blue-700">Tóm tắt bài viết</Label>
                        <Textarea
                          id="excerpt"
                          value={formData.excerpt}
                          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                          placeholder="Nhập tóm tắt ngắn gọn về tin tức..."
                          className="min-h-[80px] border-blue-100 focus:border-blue-400"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label className="text-sm font-semibold">
                            Nội dung chi tiết (Tiếng Việt)
                          </Label>
                        </div>
                        <div className="border rounded-lg min-h-[360px]">
                          <RichTextEditor
                            value={formData.content}
                            onChange={(value) => {
                              setFormData({ ...formData, content: value });
                            }}
                          />
                        </div>
                      </div>

                      {/* Gallery ảnh */}
                      <div className="space-y-4 pt-4 border-t">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-blue-600" />
                          Thư viện ảnh (Gallery)
                        </Label>

                        <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
                          <ImageUpload
                            key={galleryUploadKey}
                            multiple
                            currentImage={undefined}
                            onImagesSelect={(urls) => {
                              if (!urls || urls.length === 0) return;
                              setFormData((prev) => ({
                                ...prev,
                                galleryImages: [
                                  ...prev.galleryImages,
                                  ...urls,
                                ],
                              }));
                              setGalleryUploadKey((prev) => prev + 1);
                            }}
                          />

                          {formData.galleryImages.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-2">
                              {formData.galleryImages.map((img, idx) => (
                                <div
                                  key={idx}
                                  className="relative w-28 h-20 rounded-md overflow-hidden bg-white border border-gray-200 shadow-sm"
                                >
                                  <img
                                    src={typeof img === 'string' && img.startsWith("/") ? buildUrl(img) : (typeof img === 'string' ? img : '')}
                                    alt={`Gallery ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        galleryImages: prev.galleryImages.filter(
                                          (_, i) => i !== idx,
                                        ),
                                      }))
                                    }
                                    className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] bg-red-600 text-white rounded opacity-0 hover:opacity-100 transition"
                                  >
                                    Xoá
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-3 space-y-2">
                          <Label className="text-sm font-semibold">
                            Vị trí hiển thị gallery
                          </Label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={formData.galleryPosition === "top"}
                                onChange={() => setFormData({ ...formData, galleryPosition: "top" })}
                              />
                              <span className="text-sm">Trên cùng</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={formData.galleryPosition === "bottom"}
                                onChange={() => setFormData({ ...formData, galleryPosition: "bottom" })}
                              />
                              <span className="text-sm">Dưới cùng</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                </section>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-6 space-y-6">
                    <Card className="p-4 space-y-5">
                      <h2 className="text-lg font-semibold">Cài đặt chung</h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Trạng thái</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(val: NewsStatus) => setFormData({ ...formData, status: val })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Bản nháp</SelectItem>
                              <SelectItem value="published">Xuất bản</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Ngày xuất bản</Label>
                          <Input
                            type="date"
                            value={formData.publishedDate}
                            onChange={(e) => setFormData({ ...formData, publishedDate: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="featured"
                          checked={formData.isFeatured}
                          onCheckedChange={(val) => setFormData({ ...formData, isFeatured: val })}
                        />
                        <Label htmlFor="featured">Bài viết nổi bật</Label>
                      </div>
{/* 
                      <div className="space-y-2">
                        <Label>Đường dẫn tĩnh (Slug)</Label>
                        <div className="flex gap-2">
                          <Input
                            value={formData.slug}
                            onChange={(e) => {
                              setFormData({ ...formData, slug: e.target.value });
                              setSlugManuallyEdited(true);
                            }}
                            placeholder="url-bai-viet"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const titleText = typeof formData.title === 'string' ? formData.title : (formData.title as any)?.vi || '';
                              setFormData({ ...formData, slug: generateSlug(titleText) });
                              setSlugManuallyEdited(false);
                            }}
                          >
                            Tự động
                          </Button>
                        </div>
                      </div>
*/}
                    </Card>

                    <Card className="p-4 space-y-4">
                      <h2 className="text-lg font-semibold">Thông tin hiển thị</h2>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="author" className="text-sm font-semibold">Tác giả</Label>
                          <Input
                            id="author"
                            value={formData.author}
                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                            placeholder="Tên tác giả..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="readTime" className="text-sm font-semibold">Thời gian đọc</Label>
                          <Input
                            id="readTime"
                            value={formData.readTime}
                            onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                            placeholder="Ví dụ: 5 phút đọc"
                          />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div>
                            <p className="text-sm font-medium text-gray-800">Hiển thị Box tác giả</p>
                            <p className="text-[11px] text-gray-500">Hiển thị thông tin tác giả ở cuối bài.</p>
                          </div>
                          <Switch
                            checked={formData.showAuthorBox}
                            onCheckedChange={(checked) => setFormData({ ...formData, showAuthorBox: checked })}
                          />
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="md:col-span-6">
                    <Card className="p-4 space-y-4">
                      <h2 className="text-lg font-semibold">Ảnh bìa bài viết</h2>
                      <div 
                        className="w-full h-64 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 overflow-hidden"
                        onClick={() => setShowImageDialog(true)}
                      >
                        {formData.imageUrl ? (
                          <img src={typeof formData.imageUrl === 'string' && formData.imageUrl.startsWith("/") ? buildUrl(formData.imageUrl) : (typeof formData.imageUrl === 'string' ? formData.imageUrl : '')} className="w-full h-full object-cover" alt="Cover" />
                        ) : (
                          <div className="text-center text-gray-500">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>Nhấn để chọn ảnh bìa</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setShowImageDialog(true)}>
                          {formData.imageUrl ? "Thay đổi ảnh" : "Chọn ảnh"}
                        </Button>
                        {formData.imageUrl && (
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setFormData({ ...formData, imageUrl: "" })}>
                            <Trash className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  </div>
                </section>
              </TabsContent>


              {isEditing && formData.id && (
                <TabsContent value="comments">
                  <Card className="p-6">
                    <NewsCommentsManager newsId={formData.id} />
                  </Card>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </form>
      </div>

      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Thư viện Media</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
            <Button size="sm" variant={imageTab === "library" ? "default" : "ghost"} onClick={() => setImageTab("library")}>Thư viện</Button>
            <Button size="sm" variant={imageTab === "upload" ? "default" : "ghost"} onClick={() => setImageTab("upload")}>Tải lên</Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {imageTab === "library" ? (
              <MediaLibraryPicker onSelectImage={(url) => { setFormData({ ...formData, imageUrl: url }); setShowImageDialog(false); }} />
            ) : (
              <ImageUpload currentImage={formData.imageUrl} onImageSelect={(url) => { setFormData({ ...formData, imageUrl: url }); }} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
