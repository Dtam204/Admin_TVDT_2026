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
  Search as SearchIcon,
  Calendar,
  Sparkles,
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
import { LocaleInput } from "@/components/admin/LocaleInput";
import { normalizeLocaleValue, getLocaleValue, setLocaleValue } from "@/lib/utils/locale-admin";
import { useTranslationControls } from "@/lib/hooks/useTranslationControls";
import { TranslationControls } from "@/components/admin/TranslationControls";
import { AIProviderSelector } from "@/components/admin/AIProviderSelector";
import { getLocalizedText } from "@/lib/utils/i18n";
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

// Types

type NewsStatus = "draft" | "pending" | "approved" | "rejected" | "published";
type CategoryId = "product" | "company" | "tech" | string;

interface NewsCategory {
  id: CategoryId;
  name: string | Record<'vi' | 'en' | 'ja', string>;
  isActive?: boolean;
}

const GRADIENT_OPTIONS = [
  {
    value: "from-blue-600 to-cyan-600",
    label: "Xanh dương - Cyan",
    preview: "bg-gradient-to-r from-blue-600 to-cyan-600",
  },
  {
    value: "from-purple-600 to-pink-600",
    label: "Tím - Hồng",
    preview: "bg-gradient-to-r from-purple-600 to-pink-600",
  },
  {
    value: "from-emerald-600 to-teal-600",
    label: "Xanh lá - Teal",
    preview: "bg-gradient-to-r from-emerald-600 to-teal-600",
  },
  {
    value: "from-orange-600 to-amber-600",
    label: "Cam - Vàng",
    preview: "bg-gradient-to-r from-orange-600 to-amber-600",
  },
  {
    value: "from-red-600 to-rose-600",
    label: "Đỏ - Hồng",
    preview: "bg-gradient-to-r from-red-600 to-rose-600",
  },
  {
    value: "from-indigo-600 to-purple-600",
    label: "Indigo - Tím",
    preview: "bg-gradient-to-r from-indigo-600 to-purple-600",
  },
  {
    value: "from-cyan-600 to-blue-600",
    label: "Cyan - Xanh dương",
    preview: "bg-gradient-to-r from-cyan-600 to-blue-600",
  },
];

interface NewsFormData {
  title: string | Record<'vi' | 'en' | 'ja', string>;
  excerpt: string | Record<'vi' | 'en' | 'ja', string>;
  category: string;
  categoryId: CategoryId | "";
  content: string | Record<'vi' | 'en' | 'ja', string>;
  status: NewsStatus;
  isFeatured: boolean;
  imageUrl?: string;
  author: string | Record<'vi' | 'en' | 'ja', string>;
  readTime: string | Record<'vi' | 'en' | 'ja', string>;
  gradient: string;
  link: string;
  publishedDate: string;
  seoTitle: string | Record<'vi' | 'en' | 'ja', string>;
  seoDescription: string | Record<'vi' | 'en' | 'ja', string>;
  seoKeywords: string | Record<'vi' | 'en' | 'ja', string>;

  // Cấu hình nâng cao cho nội dung chi tiết
  galleryTitle?: string | Record<'vi' | 'en' | 'ja', string>;
  galleryImages: string[];
  galleryPosition: "top" | "bottom";
  showTableOfContents: boolean;
  enableShareButtons: boolean;
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
  // Use translation controls hook
  const {
    globalLocale,
    setGlobalLocale,
    aiProvider,
    setAiProvider,
    translatingAll,
    translateSourceLang,
    setTranslateSourceLang,
    translateData,
  } = useTranslationControls();

  // Locale riêng cho khối nội dung chi tiết (RichTextEditor)
  const [contentLocale, setContentLocale] = useState<'vi' | 'en' | 'ja'>(globalLocale);

  useEffect(() => {
    setContentLocale(globalLocale);
  }, [globalLocale]);

  const [formData, setFormData] = useState<NewsFormData>({
    title: initialData?.title || "",
    excerpt: initialData?.excerpt || "",
    category: initialData?.category || "",
    categoryId: initialData?.categoryId || "",
    content: initialData?.content || "",
    status: (initialData?.status as NewsStatus) || "draft",
    isFeatured: initialData?.isFeatured ?? false,
    imageUrl: initialData?.imageUrl,
    author: initialData?.author || "Thư viện TN",
    readTime: initialData?.readTime || "5 phút đọc",
    gradient: initialData?.gradient || "from-blue-600 to-cyan-600",
    link: initialData?.link || "",
    publishedDate:
      initialData?.publishedDate || new Date().toISOString().split("T")[0],
    seoTitle: initialData?.seoTitle || "",
    seoDescription: initialData?.seoDescription || "",
    seoKeywords: initialData?.seoKeywords || "",

    // Cấu hình nâng cao cho nội dung chi tiết (lấy từ initialData nếu có)
    galleryTitle: (initialData as any)?.galleryTitle || "",
    galleryImages: (initialData as any)?.galleryImages || [],
    galleryPosition: (initialData as any)?.galleryPosition || "top",
    showTableOfContents:
      (initialData as any)?.showTableOfContents ?? true,
    enableShareButtons:
      (initialData as any)?.enableShareButtons ?? true,
    showAuthorBox:
      (initialData as any)?.showAuthorBox ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [imageTab, setImageTab] = useState<"library" | "upload">("library");
  const [activeTab, setActiveTab] = useState<"content" | "basic" | "seo">("content");
  // Nếu đang edit và đã có slug từ DB, không tự động generate nữa
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!(isEditing && initialData?.link));
  // Key để reset component ImageUpload dùng cho gallery (re-mount sau mỗi lần chọn ảnh)
  const [galleryUploadKey, setGalleryUploadKey] = useState(0);
  // Key để reset RichTextEditor khi đổi locale
  const [contentEditorKey, setContentEditorKey] = useState(0);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await adminApiCall<{ data: any[] }>(
          AdminEndpoints.categories.list,
        );
        const cats = (data?.data || data || []).map((c: any) => ({
          id: c.code,
          name: c.name,
          isActive: c.isActive !== false,
        }));
        setCategories(cats);
      } catch (error) {
        // Silently fail
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Tự động generate slug từ title khi title thay đổi (chỉ khi chưa chỉnh sửa thủ công và không có slug từ DB)
  useEffect(() => {
    // Chỉ tự động generate khi:
    // 1. Chưa chỉnh sửa thủ công
    // 2. Có tiêu đề
    // 3. Không phải đang edit với slug đã có từ DB
    const titleText = typeof formData.title === 'string' 
      ? formData.title 
      : formData.title?.vi || '';
    if (!slugManuallyEdited && titleText && !(isEditing && initialData?.link)) {
      const autoSlug = generateSlug(titleText);
      if (autoSlug) {
        setFormData(prev => ({ ...prev, link: autoSlug }));
      }
    }
  }, [formData.title, slugManuallyEdited, isEditing, initialData?.link]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const titleText = typeof formData.title === 'string' 
      ? formData.title 
      : formData.title?.vi || '';
    if (!titleText.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài viết");
      return;
    }

    if (!formData.categoryId) {
      toast.error("Vui lòng chọn danh mục");
      return;
    }

    const contentText = typeof formData.content === 'string' 
      ? formData.content 
      : getLocalizedText(formData.content || { vi: "", en: "", ja: "" }, globalLocale) || '';
    if (!contentText.trim()) {
      toast.error("Vui lòng nhập nội dung bài viết");
      return;
    }

    try {
      setSaving(true);
      await onSave(formData);
      // Toast và redirect được handle bởi parent component (create/page.tsx hoặc edit/page.tsx)
      // Không show toast ở đây để tránh duplicate
    } catch (error) {
      toast.error("Có lỗi xảy ra khi lưu bài viết");
      // Silently fail
      throw error; // Re-throw để parent component có thể handle
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
              <AIProviderSelector
                value={aiProvider}
                onChange={setAiProvider}
              />
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
            onValueChange={(value) => setActiveTab(value as "content" | "basic" | "seo")}
            className="w-full space-y-6"
          >
            {/* Horizontal tabs navigation */}
            <Card className="mb-6">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  {[
                    {
                      value: "content",
                      label: "Nội dung bài viết",
                      description: "Tiêu đề, tóm tắt, nội dung",
                      icon: Info,
                    },
                    {
                      value: "basic",
                      label: "Thông tin cơ bản",
                      description: "Danh mục, trạng thái, ảnh bìa, cài đặt",
                      icon: Settings,
                    },
                    {
                      value: "seo",
                      label: "SEO & hiển thị nâng cao",
                      description: "Tối ưu SEO",
                      icon: SearchIcon,
                    },
                  ].map((tab, index) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.value;
                    return (
                      <div key={tab.value} className="flex items-center flex-1">
                        <button
                          type="button"
                          onClick={() => setActiveTab(tab.value as "content" | "basic" | "seo")}
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
                        {index < 2 && (
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
                        <TranslationControls
                          globalLocale={globalLocale}
                          setGlobalLocale={setGlobalLocale}
                        />
                      </div>
                    </div>
                    <div className="p-4 space-y-5">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <LocaleInput
                            value={normalizeLocaleValue(formData.title)}
                            onChange={(value) => setFormData({ ...formData, title: value })}
                            label="Tiêu đề bài viết"
                            placeholder="Nhập tiêu đề bài viết..."
                            defaultLocale={globalLocale}
                            aiProvider={aiProvider}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="link" className="text-sm font-semibold">
                            <LinkIcon className="w-3 h-3 inline mr-1" />
                            Slug / Đường dẫn
                          </Label>
                          <Input
                            id="link"
                            value={formData.link}
                            onChange={(e) => {
                              setSlugManuallyEdited(true);
                              setFormData({ ...formData, link: e.target.value });
                            }}
                            placeholder="tin-tuc-slug"
                          />
                          <p className="text-[11px] text-gray-500">
                            Dùng tiếng Việt không dấu, cách nhau bằng dấu gạch ngang.
                          </p>
                        </div>
                      </div>

                      <LocaleInput
                        value={normalizeLocaleValue(formData.excerpt)}
                        onChange={(value) => setFormData({ ...formData, excerpt: value })}
                        label="Tóm tắt"
                        placeholder="Nhập tóm tắt ngắn gọn về tin tức..."
                        multiline={true}
                        defaultLocale={globalLocale}
                        aiProvider={aiProvider}
                      />
                      <div className="flex items-center justify-between -mt-2">
                        <p className="text-xs text-gray-500">
                          Tóm tắt sẽ hiển thị trong danh sách tin tức và hỗ trợ SEO.
                        </p>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            (typeof formData.excerpt === 'string' ? formData.excerpt : formData.excerpt?.vi || '').length > 200
                              ? "text-red-600 bg-red-50"
                              : (typeof formData.excerpt === 'string' ? formData.excerpt : formData.excerpt?.vi || '').length > 150
                                ? "text-yellow-600 bg-yellow-50"
                                : "text-gray-400 bg-gray-50"
                          }`}
                        >
                          {(typeof formData.excerpt === 'string' ? formData.excerpt : formData.excerpt?.vi || '').length}/200
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label className="text-sm font-semibold">
                            Nội dung chi tiết ({contentLocale.toUpperCase()})
                          </Label>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Hiển thị:</span>
                            <Select
                              value={contentLocale}
                              onValueChange={(value: 'vi' | 'en' | 'ja') => setContentLocale(value)}
                            >
                              <SelectTrigger className="h-7 w-[120px] px-2 py-1 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
                                <SelectItem value="en">🇬🇧 English</SelectItem>
                                <SelectItem value="ja">🇯🇵 日本語</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="border rounded-lg min-h-[360px]">
                          <RichTextEditor
                            key={`content-${contentLocale}-${contentEditorKey}`}
                            value={typeof formData.content === 'string' 
                              ? formData.content 
                              : getLocalizedText(formData.content || { vi: "", en: "", ja: "" }, contentLocale) || ""}
                            onChange={(value) => {
                              const currentContent = formData.content || { vi: "", en: "", ja: "" };
                              const updatedContent = typeof currentContent === 'string' 
                                ? { vi: currentContent, en: "", ja: "" }
                                : { ...currentContent, [contentLocale]: value };
                              setFormData({ ...formData, content: updatedContent });
                            }}
                            globalLocale={contentLocale}
                            translateData={translateData}
                            translatingAll={translatingAll}
                            translateSourceLang={translateSourceLang}
                            setTranslateSourceLang={setTranslateSourceLang}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Sử dụng trình soạn thảo để tạo nội dung bài viết với định dạng phong
                          phú. Nội dung sẽ được lưu riêng cho từng ngôn ngữ.
                        </p>
                      </div>

                      {/* Gallery ảnh và cấu hình vị trí hiển thị */}
                      <div className="space-y-4 pt-4 border-t">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-blue-600" />
                          Thư viện ảnh (Gallery)
                        </Label>
                        <div className="space-y-2">
                          <LocaleInput
                            value={normalizeLocaleValue((formData as any).galleryTitle as any)}
                            onChange={(value) =>
                              setFormData((prev: any) => ({
                                ...prev,
                                galleryTitle: value,
                              }))
                            }
                            label="Tiêu đề bộ sưu tập (tuỳ chọn)"
                            placeholder="Nhập tiêu đề cho gallery (nếu cần)"
                            defaultLocale={globalLocale}
                            aiProvider={aiProvider}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Chọn nhiều ảnh để hiển thị dạng gallery trong bài viết. Ảnh sẽ
                          được render ở vị trí bạn chọn bên dưới (trên/giữa/dưới nội dung).
                        </p>

                        <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
                          <div className="text-xs font-medium text-gray-600">
                            Thêm ảnh vào gallery
                          </div>
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
                              // Reset lại component upload để người dùng chọn ảnh tiếp theo nhanh
                              setGalleryUploadKey((prev) => prev + 1);
                            }}
                          />
                          <p className="text-[11px] text-gray-500">
                            Sau khi chọn, ảnh sẽ được thêm vào danh sách bên dưới. Bạn có
                            thể xoá từng ảnh nếu không cần.
                          </p>

                          {formData.galleryImages.length > 0 ? (
                            <div className="flex flex-wrap gap-3 mt-2">
                              {formData.galleryImages.map((img, idx) => (
                                <div
                                  key={idx}
                                  className="relative w-28 h-20 rounded-md overflow-hidden bg-white border border-gray-200 shadow-sm"
                                >
                                  <img
                                    src={
                                      img.startsWith("/")
                                        ? buildUrl(img)
                                        : img
                                    }
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
                                    title="Xoá ảnh"
                                  >
                                    Xoá
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 mt-1">
                              Chưa có ảnh nào trong gallery. Chọn ảnh để thêm.
                            </p>
                          )}
                        </div>

                        <div className="mt-3 space-y-2">
                          <Label className="text-sm font-semibold">
                            Vị trí hiển thị gallery trong bài viết
                          </Label>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="gallery-position"
                                value="top"
                                checked={formData.galleryPosition === "top"}
                                onChange={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    galleryPosition: "top",
                                  }))
                                }
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <span>Trên cùng bài viết</span>
                            </label>
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="gallery-position"
                                value="bottom"
                                checked={formData.galleryPosition === "bottom"}
                                onChange={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    galleryPosition: "bottom",
                                  }))
                                }
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <span>Cuối bài viết</span>
                            </label>
                          </div>
                          <p className="text-[11px] text-gray-500">
                            Phần hiển thị thực tế bạn xử lý ở component trang public
                            (chèn gallery tương ứng với vị trí đã chọn).
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                  {/* Cấu hình hiển thị chi tiết bài viết */}
                  <Card className="border border-gray-100 shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Cấu hình hiển thị chi tiết bài viết
                      </h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Các tuỳ chọn này chỉ ảnh hưởng tới cách hiển thị bài viết trên
                        trang public (không ảnh hưởng dữ liệu SEO).
                      </p>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            Hiển thị mục lục (Table of Contents)
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Tự động tạo mục lục từ các heading (H2, H3) trong bài viết.
                          </p>
                        </div>
                        <Switch
                          checked={formData.showTableOfContents}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                              ...prev,
                              showTableOfContents: checked,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            Nút chia sẻ mạng xã hội
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Hiển thị nút chia sẻ Facebook, LinkedIn… ở đầu/cuối bài viết.
                          </p>
                        </div>
                        <Switch
                          checked={formData.enableShareButtons}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                              ...prev,
                              enableShareButtons: checked,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            Hiển thị box tác giả
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Hiển thị thông tin tác giả, avatar tại cuối bài viết.
                          </p>
                        </div>
                        <Switch
                          checked={formData.showAuthorBox}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                              ...prev,
                              showAuthorBox: checked,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </Card>
                </section>
              </TabsContent>

              <TabsContent value="basic" className="space-y-6">
                {/* Thông tin cơ bản & Ảnh bìa */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-start">
                  <div className="md:col-span-6 lg:col-span-5 space-y-4 lg:space-y-5">
                    <Card className="border border-gray-100 shadow-sm">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <div className="flex flex-col gap-1">
                          <h2 className="text-lg font-semibold text-gray-900">
                            Thông tin cơ bản
                          </h2>
                          <p className="text-xs text-gray-500">
                            Nhập thông tin cơ bản cho bài viết tin tức.
                          </p>
                        </div>
                      </div>
                      <div className="p-4 space-y-5">
                        {/* Nhóm phân loại */}
                        <div className="space-y-2">
                          <Label htmlFor="categoryId" className="text-sm font-semibold">
                            Danh mục <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.categoryId}
                            onValueChange={(value: CategoryId) => {
                              const selectedCategory = categories.find(
                                (c) => c.id === value && c.isActive !== false,
                              );
                              const categoryName = selectedCategory?.name 
                                ? (typeof selectedCategory.name === 'string' 
                                    ? selectedCategory.name 
                                    : getLocalizedText(selectedCategory.name, globalLocale))
                                : "";
                              setFormData({
                                ...formData,
                                categoryId: value,
                                category: categoryName,
                              });
                            }}
                            disabled={loadingCategories}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  loadingCategories ? "Đang tải..." : "Chọn danh mục"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {categories
                                .filter((cat) => cat.isActive !== false)
                                .map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {typeof cat.name === 'string' 
                                      ? cat.name 
                                      : getLocalizedText(cat.name, globalLocale)}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Nhóm trạng thái xuất bản */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">Trạng thái</Label>
                            <Select
                              value={formData.status}
                              onValueChange={(value: NewsStatus) =>
                                setFormData({ ...formData, status: value })
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Bản nháp</SelectItem>
                                <SelectItem value="pending">Chờ duyệt</SelectItem>
                                <SelectItem value="approved">Đã duyệt</SelectItem>
                                <SelectItem value="rejected">Từ chối</SelectItem>
                                <SelectItem value="published">Xuất bản</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="publishedDate" className="text-sm font-semibold">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              Ngày xuất bản
                            </Label>
                            <Input
                              id="publishedDate"
                              type="date"
                              value={formatDateForInput(formData.publishedDate)}
                              onChange={(e) =>
                                setFormData({ ...formData, publishedDate: e.target.value })
                              }
                              className="w-full"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <Switch
                            id="isFeatured"
                            checked={formData.isFeatured}
                            onCheckedChange={(checked: boolean) =>
                              setFormData({ ...formData, isFeatured: checked })
                            }
                          />
                          <Label htmlFor="isFeatured" className="text-sm font-semibold">
                            Bài viết nổi bật
                          </Label>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="md:col-span-6 lg:col-span-7 space-y-4 lg:space-y-5">
                    {/* Ảnh bìa */}
                    <Card className="border border-gray-100 shadow-sm">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-blue-600" />
                          <h2 className="text-lg font-semibold text-gray-900">Ảnh bìa</h2>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="space-y-3">
                          <div
                            className="w-full border-2 border-dashed border-gray-300 rounded-lg h-40 flex items-center justify-center bg-gray-50 cursor-pointer hover:border-blue-500 transition-colors"
                            onClick={() => setShowImageDialog(true)}
                          >
                            {formData.imageUrl ? (
                              <img
                                src={
                                  formData.imageUrl.startsWith("/")
                                    ? buildUrl(formData.imageUrl)
                                    : formData.imageUrl
                                }
                                alt="Ảnh đại diện"
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-gray-500">
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                                <span className="text-sm font-medium">Chọn ảnh bìa</span>
                                <span className="text-xs text-gray-400">
                                  Click để mở thư viện media
                                </span>
                              </div>
                            )}
                          </div>
                          {formData.imageUrl && (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={() => setShowImageDialog(true)}
                            >
                              Thay đổi ảnh
                            </Button>
                          )}
                          {!formData.imageUrl && (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={() => setShowImageDialog(true)}
                            >
                              Chọn ảnh
                            </Button>
                          )}
                          <p className="text-xs text-gray-500">
                            Khuyến nghị: 1200x600px. Dùng ảnh rõ nét, tối ưu dung lượng (&lt; 10MB).
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Cài đặt hiển thị */}
                  <div className="md:col-span-12 space-y-4 lg:space-y-5">
                    <Card className="border border-gray-100 shadow-sm">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-2">
                          <Settings className="w-5 h-5 text-blue-600" />
                          <h2 className="text-lg font-semibold text-gray-900">
                            Cài đặt hiển thị
                          </h2>
                        </div>
                      </div>
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="author" className="text-sm font-semibold">
                              <User className="w-3 h-3 inline mr-1" />
                              Tác giả
                            </Label>
                            <LocaleInput
                              value={normalizeLocaleValue(formData.author as any)}
                              onChange={(value) =>
                                setFormData({ ...formData, author: value as any })
                              }
                              label=""
                              placeholder="Thư viện TN"
                              defaultLocale={globalLocale}
                              aiProvider={aiProvider}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="readTime" className="text-sm font-semibold">
                              <Clock className="w-3 h-3 inline mr-1" />
                              Thời gian đọc
                            </Label>
                            <LocaleInput
                              value={normalizeLocaleValue(formData.readTime as any)}
                              onChange={(value) =>
                                setFormData({ ...formData, readTime: value as any })
                              }
                              label=""
                              placeholder="5 phút đọc"
                              defaultLocale={globalLocale}
                              aiProvider={aiProvider}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="gradient" className="text-sm font-semibold">
                            Màu gradient
                          </Label>
                          <Select
                            value={formData.gradient}
                            onValueChange={(value) =>
                              setFormData({ ...formData, gradient: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {GRADIENT_OPTIONS.map((grad) => (
                                <SelectItem key={grad.value} value={grad.value}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-4 h-4 rounded ${grad.preview}`}
                                    />
                                    <span>{grad.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </Card>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="seo" className="space-y-6">
                {/* Khu vực SEO & Cài đặt nâng cao */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-start">
                  <div className="md:col-span-7 lg:col-span-8 space-y-4 lg:space-y-5">
                    <Card className="border border-gray-100 shadow-sm">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center gap-2">
                          <SearchIcon className="w-5 h-5 text-blue-600" />
                          <h2 className="text-lg font-semibold text-gray-900">
                            Tối ưu hóa SEO
                          </h2>
                        </div>
                      </div>
                      <div className="p-4 space-y-4">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-3 shadow-sm">
                          <div className="flex items-start gap-2">
                            <div className="bg-blue-100 rounded-full p-1.5">
                              <Sparkles className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-blue-900 mb-1">
                                Tối ưu hóa SEO
                              </p>
                              <p className="text-xs text-blue-700 leading-relaxed">
                                Điền đầy đủ thông tin SEO để bài viết dễ dàng được tìm thấy trên
                                Google. Nhấn "Tự động" để sử dụng tiêu đề và mô tả hiện có.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {/* Tiêu đề SEO đa ngôn ngữ */}
                          <div className="space-y-2">
                            <div className="flex items-center justify giữa">
                              <Label htmlFor="seoTitle" className="text-sm font-semibold">
                                Tiêu đề SEO
                              </Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs px-2"
                                onClick={() => {
                                  if (formData.title) {
                                    const titleText = typeof formData.title === 'string'
                                      ? formData.title
                                      : formData.title?.vi || '';
                                    const autoTitle =
                                      titleText.length > 60
                                        ? titleText.substring(0, 57) + "..."
                                        : titleText;
                                    const currentSeo =
                                      !formData.seoTitle || typeof formData.seoTitle === 'string'
                                        ? { vi: "", en: "", ja: "" }
                                        : (formData.seoTitle as any);
                                    setFormData({
                                      ...formData,
                                      seoTitle: { ...currentSeo, [globalLocale]: autoTitle },
                                    });
                                  }
                                }}
                                disabled={!formData.title}
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                Tự động
                              </Button>
                            </div>
                            <LocaleInput
                              value={getLocaleValue(formData, "seoTitle")}
                              onChange={(value) => {
                                const updated = setLocaleValue(formData, "seoTitle", value);
                                setFormData(updated);
                              }}
                              label=""
                              placeholder={
                                (() => {
                                  const titleText =
                                    typeof formData.title === "string"
                                      ? formData.title
                                      : formData.title?.vi || "";
                                  return titleText
                                    ? `Tự động: ${titleText.substring(0, 40)}...`
                                    : "Nhập tiêu đề SEO...";
                                })()
                              }
                              defaultLocale={globalLocale}
                              aiProvider={aiProvider}
                              className="text-sm"
                            />
                            {(() => {
                              const seoTitleText =
                                typeof formData.seoTitle === "string"
                                  ? formData.seoTitle
                                  : getLocalizedText(
                                      formData.seoTitle as any,
                                      globalLocale
                                    );
                              return (
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-gray-500">
                                    Khuyến nghị: 50-60 ký tự
                                  </p>
                                  <span
                                    className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                                      seoTitleText.length > 60
                                        ? "text-red-600 bg-red-50"
                                        : seoTitleText.length >= 50 &&
                                          seoTitleText.length <= 60
                                        ? "text-green-600 bg-green-50"
                                        : seoTitleText.length > 0
                                        ? "text-yellow-600 bg-yellow-50"
                                        : "text-gray-400 bg-gray-50"
                                    }`}
                                  >
                                    {seoTitleText.length}/60
                                  </span>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Mô tả SEO đa ngôn ngữ */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label
                                htmlFor="seoDescription"
                                className="text-sm font-semibold"
                              >
                                Mô tả SEO
                              </Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs px-2"
                                onClick={() => {
                                  if (formData.excerpt) {
                                    const excerptText =
                                      typeof formData.excerpt === "string"
                                        ? formData.excerpt
                                        : formData.excerpt?.vi || "";
                                    const autoDesc =
                                      excerptText.length > 160
                                        ? excerptText.substring(0, 157) + "..."
                                        : excerptText;
                                    const currentSeoDesc =
                                      !formData.seoDescription ||
                                      typeof formData.seoDescription === "string"
                                        ? { vi: "", en: "", ja: "" }
                                        : (formData.seoDescription as any);
                                    setFormData({
                                      ...formData,
                                      seoDescription: {
                                        ...currentSeoDesc,
                                        [globalLocale]: autoDesc,
                                      },
                                    });
                                  }
                                }}
                                disabled={!formData.excerpt}
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                Tự động
                              </Button>
                            </div>
                            <LocaleInput
                              value={getLocaleValue(formData, "seoDescription")}
                              onChange={(value) => {
                                const updated = setLocaleValue(
                                  formData,
                                  "seoDescription",
                                  value
                                );
                                setFormData(updated);
                              }}
                              label=""
                              placeholder={
                                (() => {
                                  const excerptText =
                                    typeof formData.excerpt === "string"
                                      ? formData.excerpt
                                      : formData.excerpt?.vi || "";
                                  return excerptText
                                    ? `Tự động: ${excerptText.substring(0, 60)}...`
                                    : "Nhập mô tả SEO...";
                                })()
                              }
                              multiline={true}
                              defaultLocale={globalLocale}
                              aiProvider={aiProvider}
                              className="text-sm"
                            />
                            {(() => {
                              const seoDescText =
                                typeof formData.seoDescription === "string"
                                  ? formData.seoDescription
                                  : getLocalizedText(
                                      formData.seoDescription as any,
                                      globalLocale
                                    );
                              return (
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-gray-500">
                                    Khuyến nghị: 150-160 ký tự
                                  </p>
                                  <span
                                    className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                                      seoDescText.length > 160
                                        ? "text-red-600 bg-red-50"
                                        : seoDescText.length >= 150 &&
                                          seoDescText.length <= 160
                                        ? "text-green-600 bg-green-50"
                                        : seoDescText.length > 0
                                        ? "text-yellow-600 bg-yellow-50"
                                        : "text-gray-400 bg-gray-50"
                                    }`}
                                  >
                                    {seoDescText.length}/160
                                  </span>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Từ khóa SEO đa ngôn ngữ */}
                          <div className="space-y-2">
                            <Label htmlFor="seoKeywords" className="text-sm font-semibold">
                              Từ khóa SEO
                            </Label>
                            <LocaleInput
                              value={getLocaleValue(formData, "seoKeywords")}
                              onChange={(value) => {
                                const updated = setLocaleValue(
                                  formData,
                                  "seoKeywords",
                                  value
                                );
                                setFormData(updated);
                              }}
                              label=""
                              placeholder="từ khóa 1, từ khóa 2..."
                              defaultLocale={globalLocale}
                              aiProvider={aiProvider}
                              className="text-sm"
                            />
                            <p className="text-xs text-gray-500">
                              Phân cách bằng dấu phẩy
                            </p>
                          </div>

                          {(formData.seoTitle || formData.seoDescription) && (
                            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <p className="text-xs font-semibold text-gray-700 mb-2">
                                Xem trước:
                              </p>
                              <div className="space-y-1">
                                <div className="text-xs text-blue-600 font-medium line-clamp-1">
                                  {(
                                    typeof formData.seoTitle === "string"
                                      ? formData.seoTitle
                                      : getLocalizedText(
                                          formData.seoTitle as any,
                                          globalLocale
                                        )
                                  ) ||
                                    (typeof formData.title === "string"
                                      ? formData.title
                                      : formData.title?.vi || "") ||
                                    "Tiêu đề bài viết"}
                                </div>
                                <div className="text-xs text-green-700">
                                  {formData.link || "/news/..."}
                                </div>
                                <div className="text-xs text-gray-600 line-clamp-2">
                                  {(
                                    typeof formData.seoDescription === "string"
                                      ? formData.seoDescription
                                      : getLocalizedText(
                                          formData.seoDescription as any,
                                          globalLocale
                                        )
                                  ) ||
                                    (typeof formData.excerpt === "string"
                                      ? formData.excerpt
                                      : formData.excerpt?.vi || "") ||
                                    "Mô tả bài viết..."}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                </section>
              </TabsContent>
            </div>
          </Tabs>
        </form>
      </div>

      {/* Image picker dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent
          className="w-full h-[80vh] flex flex-col"
          style={{ maxWidth: "72rem" }}
        >
          <DialogHeader>
            <DialogTitle>Chọn ảnh bìa cho bài viết</DialogTitle>
            <DialogDescription>
              Bạn có thể chọn ảnh từ thư viện Media hoặc tải ảnh mới từ máy tính.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex rounded-xl border bg-gray-100 p-1 gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={imageTab === "library" ? "default" : "ghost"}
                  className="px-4"
                  onClick={() => setImageTab("library")}
                >
                  Thư viện file
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={imageTab === "upload" ? "default" : "ghost"}
                  className="px-4"
                  onClick={() => setImageTab("upload")}
                >
                  Upload từ máy
                </Button>
              </div>
            </div>

            <div className="flex-1 flex flex-col mt-0 overflow-y-auto">
              {imageTab === "library" ? (
                <MediaLibraryPicker
                  onSelectImage={(url) => {
                    setFormData({
                      ...formData,
                      imageUrl: url,
                    });
                    setShowImageDialog(false);
                  }}
                />
              ) : (
                <div className="w-full">
                  <ImageUpload
                    currentImage={formData.imageUrl}
                    onImageSelect={(url) => {
                      setFormData((prev) => ({
                        ...prev,
                        imageUrl: url,
                      }));
                      // Không đóng popup để người dùng xem thông tin ảnh
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImageDialog(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
