"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Check, X, FolderTree, Languages, Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { adminApiCall, AdminEndpoints } from "@/lib/api/admin";
import { LocaleInput } from "@/components/admin/LocaleInput";
import { getLocaleValue, setLocaleValue, migrateObjectToLocale } from "@/lib/utils/locale-admin";
import { getLocalizedText } from "@/lib/utils/i18n";
import { useTranslationControls } from "@/lib/hooks/useTranslationControls";
import { AIProviderSelector } from "@/components/admin/AIProviderSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Locale = 'vi' | 'en' | 'ja';

interface Category {
  code: string;
  name: string | Record<Locale, string>;
  description: string | Record<Locale, string>;
  isActive: boolean;
  parentCode?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminCategoriesPage() {
  // Use translation controls hook
  const {
    globalLocale,
    setGlobalLocale,
    aiProvider,
    setAiProvider,
    translatingAll,
    translateSourceLang,
    setTranslateSourceLang,
    translateData
  } = useTranslationControls();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState<{
    code: string;
    name: string | Record<Locale, string>;
    description: string | Record<Locale, string>;
    isActive: boolean;
    parentCode: string;
  }>({
    code: "",
    name: { vi: '', en: '', ja: '' },
    description: { vi: '', en: '', ja: '' },
    isActive: true,
    parentCode: "",
  });

  const resetForm = () =>
    setFormData({ code: "", name: { vi: '', en: '', ja: '' }, description: { vi: '', en: '', ja: '' }, isActive: true, parentCode: "" });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await adminApiCall<{ data: Category[] }>(
        AdminEndpoints.categories.list,
      );
      // Normalize dữ liệu để đảm bảo các field luôn là locale object
      const normalizedCategories = (data?.data || []).map(category => {
        const normalized = migrateObjectToLocale(category);
        // Đảm bảo code, parentCode không bị convert thành locale object
        return {
          ...normalized,
          code: category.code || '',
          parentCode: category.parentCode || null,
          isActive: category.isActive ?? true
        };
      });
      setCategories(normalizedCategories);
    } catch (error: any) {
      toast.error(error?.message || "Tải danh mục thất bại");
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nameValue = typeof formData.name === 'string' ? formData.name : (formData.name as any)?.vi || '';
      if (!formData.code.trim() || !nameValue.trim()) {
        toast.error("Mã và tên danh mục là bắt buộc");
        return;
      }

      const payload = {
        code: formData.code.trim(),
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
        parentCode: formData.parentCode || null,
      };

      const endpoint = editingCategory
        ? AdminEndpoints.categories.detail(editingCategory.code)
        : AdminEndpoints.categories.list;

      await adminApiCall(endpoint, {
        method: editingCategory ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      toast.success(editingCategory ? "Đã cập nhật danh mục" : "Đã tạo danh mục mới");
      setIsDialogOpen(false);
      setEditingCategory(null);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi khi lưu danh mục");
      // Silently fail
    }
  };

  // Auto-generate code from name
  useEffect(() => {
    const nameText = typeof formData.name === 'string' ? formData.name : (formData.name as any)?.vi || '';
    if (nameText && !editingCategory && !formData.code) {
      // Simple slugify for code
      const generatedCode = nameText.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, code: generatedCode }));
    }
  }, [formData.name, editingCategory]);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    // Normalize dữ liệu để đảm bảo các field luôn là locale object
    const normalizedCategory = migrateObjectToLocale(category);
    setFormData({
      code: category.code,
      name: normalizedCategory.name || { vi: '', en: '', ja: '' },
      description: normalizedCategory.description || { vi: '', en: '', ja: '' },
      isActive: category.isActive,
      parentCode: category.parentCode || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (code: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
    try {
      await adminApiCall(AdminEndpoints.categories.detail(code), { method: "DELETE" });
      toast.success("Đã xóa danh mục");
      fetchCategories();
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi khi xóa danh mục");
      // Silently fail
    }
  };

  const availableParentCategories = categories.filter((cat) =>
    editingCategory ? cat.code !== editingCategory.code : true,
  );

  // Translation handler
  const handleTranslateAll = async () => {
    const dataToTranslate = categories.map((category: any) => {
      const { code, parentCode, isActive, createdAt, updatedAt, ...categoryFields } = category;
      return categoryFields;
    });

    await translateData(
      { categories: dataToTranslate },
      (translated: any) => {
        const updatedCategories = translated.categories.map((category: any, index: number) => ({
          ...category,
          code: categories[index]?.code || '',
          parentCode: categories[index]?.parentCode || null,
          isActive: categories[index]?.isActive ?? true,
          createdAt: categories[index]?.createdAt,
          updatedAt: categories[index]?.updatedAt
        }));
        setCategories(updatedCategories);
      },
      'Danh mục tin tức'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">Quản lý danh mục</h1>
          <p className="text-gray-500 mt-1">Tổ chức nội dung theo danh mục</p>
        </div>
        <div className="flex items-center gap-4">
          {/* AI Provider Selector */}
          <AIProviderSelector
            value={aiProvider}
            onChange={setAiProvider}
          />
        </div>
      </div>

      {/* Translation Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Locale Selector */}
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-gray-500" />
                <Label className="text-sm text-gray-600 whitespace-nowrap">Hiển thị:</Label>
                <Select value={globalLocale} onValueChange={(value: 'vi' | 'en' | 'ja') => setGlobalLocale(value)}>
                  <SelectTrigger className="w-[150px]">
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

            {/* Translate Controls */}
            <div className="flex items-center gap-2">
              {/* Source Language Selector */}
              <div className="flex items-center gap-2">
                <Label className="text-sm text-gray-600 whitespace-nowrap">Dịch từ:</Label>
                <Select value={translateSourceLang} onValueChange={(value: 'vi' | 'en' | 'ja') => setTranslateSourceLang(value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
                    <SelectItem value="en">🇬🇧 English</SelectItem>
                    <SelectItem value="ja">🇯🇵 日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Translate Button */}
              <Button
                onClick={handleTranslateAll}
                disabled={translatingAll}
                variant="outline"
                className="gap-2"
              >
                {translatingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang dịch...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Dịch tất cả danh mục
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={() => {
                setEditingCategory(null);
                resetForm();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm danh mục
            </Button>
          </DialogTrigger>
          <DialogContent style={{ maxWidth: "1200px", width: "100vw", maxHeight: "98vh", overflowY: "auto" }}>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
              </DialogTitle>
              <DialogDescription>Tạo danh mục để phân loại bài viết</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
{/* 
                <div className="space-y-2">
                  <Label htmlFor="code">Mã danh mục</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="tech, product, company..."
                    required
                    disabled={!!editingCategory}
                  />
                </div>
*/}
                <div className="space-y-2">
                  <LocaleInput
                    label="Tên danh mục"
                    value={getLocaleValue(formData, 'name')}
                    onChange={(value) => {
                      const updated = setLocaleValue(formData, 'name', value);
                      setFormData(updated);
                    }}
                    placeholder="Nhập tên danh mục"
                    defaultLocale={globalLocale}
                    aiProvider={aiProvider}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentCode">Thư mục cha (tuỳ chọn)</Label>
                <select
                  id="parentCode"
                  className="border rounded-md px-3 py-2 text-sm w-full"
                  value={formData.parentCode}
                  onChange={(e) =>
                    setFormData({ ...formData, parentCode: e.target.value || "" })
                  }
                >
                  <option value="">-- Không có --</option>
                  {availableParentCategories.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {typeof cat.name === 'string' ? cat.name : getLocalizedText(cat.name, globalLocale)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  Chọn danh mục cha để tạo cấu trúc thư mục phân cấp.
                </p>
              </div>

              <div className="space-y-2">
                <LocaleInput
                  label="Mô tả"
                  value={getLocaleValue(formData, 'description')}
                  onChange={(value) => {
                    const updated = setLocaleValue(formData, 'description', value);
                    setFormData(updated);
                  }}
                  placeholder="Mô tả về danh mục"
                  multiline={true}
                  defaultLocale={globalLocale}
                  aiProvider={aiProvider}
                />
              </div>

              <div className="flex items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="isActive">Kích hoạt</Label>
                </div>
                {editingCategory && (
                  <p className="text-xs text-gray-500">
                    Mã danh mục: <span className="font-medium">{editingCategory.code}</span>
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={loading}
                >
                  {editingCategory ? "Cập nhật" : "Tạo mới"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card
            key={category.code}
            className="border border-gray-100 shadow hover:shadow-lg transition-all group"
          >
            <CardContent className="p-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-4 shadow-md">
                <FolderTree className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-lg text-gray-900 mb-1">{typeof category.name === 'string' ? category.name : getLocalizedText(category.name, globalLocale)}</h3>
              <p className="text-xs text-gray-500 mb-2">Mã: {category.code}</p>
              {category.parentCode && (
                <p className="text-xs text-gray-500 mb-1">
                  Thuộc: {category.parentCode}
                </p>
              )}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {typeof category.description === 'string' ? category.description : getLocalizedText(category.description, globalLocale) || "Chưa có mô tả"}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span
                  className={`flex items-center gap-1 text-xs ${category.isActive ? "text-green-600" : "text-gray-400"
                    }`}
                >
                  {category.isActive ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                  {category.isActive ? "Đang kích hoạt" : "Tạm tắt"}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(category)}
                    className="h-8 w-8"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.code)}
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
