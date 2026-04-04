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
import { getCleanValue } from "@/lib/utils/locale-admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";



interface Category {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  parentCode?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminCategoriesPage() {
  // Đã loại bỏ translation controls

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    description: string;
    isActive: boolean;
    parentCode: string;
  }>({
    code: "",
    name: "",
    description: "",
    isActive: true,
    parentCode: "",
  });

  const resetForm = () =>
    setFormData({ code: "", name: "", description: "", isActive: true, parentCode: "" });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await adminApiCall<{ data: Category[] }>(
        AdminEndpoints.categories.list,
      );
      const normalizedCategories = (data?.data || []).map(category => ({
        ...category,
        name: getCleanValue(category.name),
        description: getCleanValue(category.description),
        code: category.code || '',
        parentCode: category.parentCode || null,
        isActive: category.isActive ?? true
      }));
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
      if (!formData.code.trim() || !formData.name.trim()) {
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
    if (formData.name && !editingCategory && !formData.code) {
      const generatedCode = formData.name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, code: generatedCode }));
    }
  }, [formData.name, editingCategory]);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      code: category.code,
      name: category.name,
      description: category.description,
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

  // Đã loại bỏ handler dịch thuật

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý danh mục</h1>
          <p className="text-gray-500 mt-1">Tổ chức nội dung theo danh mục</p>
        </div>
      </div>

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
                  <Label>Tên danh mục</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nhập tên danh mục"
                    required
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
                    {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  Chọn danh mục cha để tạo cấu trúc thư mục phân cấp.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả về danh mục"
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

              <h3 className="text-lg font-bold text-gray-900 mb-1">{category.name}</h3>
              <p className="text-xs text-gray-500 mb-2">Mã: {category.code}</p>
              {category.parentCode && (
                <p className="text-xs text-gray-500 mb-1">
                  Thuộc: {category.parentCode}
                </p>
              )}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {category.description || "Chưa có mô tả"}
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
