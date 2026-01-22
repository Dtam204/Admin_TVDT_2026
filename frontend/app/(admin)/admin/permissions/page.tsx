"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Edit, Trash2, ShieldCheck, FolderTree } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { adminApiCall, AdminEndpoints, apiCall } from "@/lib/api/admin";

interface Permission {
  id: number;
  code: string;
  name: string;
  module?: string | null;
  description?: string | null;
  isActive: boolean;
}

type CmsUser = {
  permissions?: string[];
};

type PermissionFormState = {
  code: string;
  name: string;
  module: string;
  description: string;
  isActive: boolean;
};

const EMPTY_FORM: PermissionFormState = {
  code: "",
  name: "",
  module: "",
  description: "",
  isActive: true,
};

function getUserPermissionsFromCookie(): Set<string> {
  if (typeof document === "undefined") return new Set();
  try {
    const cookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith("cms_thuvien_tn_user="));
    if (!cookie) return new Set();
    const value = decodeURIComponent(cookie.split("=")[1] || "");
    const parsed = JSON.parse(value) as CmsUser;
    return new Set(parsed.permissions ?? []);
  } catch {
    return new Set();
  }
}

export default function AdminPermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState<PermissionFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const permissionsOfUser = useMemo(getUserPermissionsFromCookie, []);
  const canViewPermissions =
    permissionsOfUser.has("roles.manage") ||
    permissionsOfUser.has("permissions.manage") ||
    permissionsOfUser.has("admin");
  const canManagePermissions =
    permissionsOfUser.has("roles.manage") ||
    permissionsOfUser.has("permissions.manage") ||
    permissionsOfUser.has("admin");

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (moduleFilter !== "all" && moduleFilter) {
        params.set("module", moduleFilter);
      }
      if (search) {
        params.set("search", search);
      }

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const data = await apiCall<{ success: boolean; data?: Permission[] }>(
        `${AdminEndpoints.permissions.list}${queryString}`,
      );
      if (!data.success || !data.data) {
        throw new Error("Không tải được danh sách quyền");
      }
      setPermissions(
        data.data.map((p) => ({
          ...p,
          module: p.module ?? "",
          description: p.description ?? "",
        })),
      );
    } catch (error: any) {
      // Silently fail
      toast.error(error?.message || "Không tải được danh sách quyền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const modules = useMemo(
    () =>
      Array.from(
        new Set(
          permissions
            .map((p) => (p.module || "").trim())
            .filter((m) => m.length > 0),
        ),
      ).sort(),
    [permissions],
  );

  const router = useRouter();

  useEffect(() => {
    if (!canViewPermissions) {
      router.replace("/admin/forbidden");
    }
  }, [canViewPermissions, router]);

  const filteredPermissions = permissions.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q);

    const matchModule =
      moduleFilter === "all" ||
      moduleFilter === "" ||
      (p.module || "").toLowerCase() === moduleFilter.toLowerCase();

    return matchSearch && matchModule;
  });

  const openCreateDialog = () => {
    if (!canManagePermissions) {
      toast.error("Bạn không có quyền tạo quyền chi tiết (roles.manage).");
      return;
    }
    setEditingPermission(null);
    // Nếu đang lọc theo module cụ thể thì tự động set module đó cho form
    setFormData({
      ...EMPTY_FORM,
      module: moduleFilter !== "all" ? moduleFilter : "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (permission: Permission) => {
    if (!canManagePermissions) {
      toast.error("Bạn không có quyền chỉnh sửa quyền chi tiết (roles.manage).");
      return;
    }
    setEditingPermission(permission);
    setFormData({
      code: permission.code,
      name: permission.name,
      module: permission.module || "",
      description: permission.description || "",
      isActive: permission.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name) {
      toast.error("Vui lòng nhập đầy đủ mã quyền và tên quyền");
      return;
    }

    if (!canManagePermissions) {
      toast.error("Bạn không có quyền quản lý quyền chi tiết (roles.manage).");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        module: formData.module.trim() || null,
        description: formData.description.trim() || null,
        isActive: formData.isActive,
      };

      if (editingPermission) {
        const data = await apiCall<{ success: boolean; data?: Permission }>(
          AdminEndpoints.permissions.detail(editingPermission.id),
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );
        if (data.success && data.data) {
          setPermissions((prev) =>
            prev.map((p) =>
              p.id === editingPermission.id
                ? {
                    ...p,
                    code: data.data!.code,
                    name: data.data!.name,
                    module: data.data!.module ?? "",
                    description: data.data!.description ?? "",
                    isActive: data.data!.isActive,
                  }
                : p,
            ),
          );
          toast.success("Đã cập nhật quyền");
        }
      } else {
        const data = await apiCall<{ success: boolean; data?: Permission }>(
          AdminEndpoints.permissions.list,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );
        if (data.success && data.data) {
          setPermissions((prev) => [
            ...prev,
            {
              id: data.data!.id,
              code: data.data!.code,
              name: data.data!.name,
              module: data.data!.module ?? "",
              description: data.data!.description ?? "",
              isActive: data.data!.isActive,
            },
          ]);
          toast.success("Đã tạo quyền mới");
        }
      }

      setIsDialogOpen(false);
      setEditingPermission(null);
      setFormData(EMPTY_FORM);
    } catch (error: any) {
      // Silently fail
      toast.error(error?.message || "Lỗi hệ thống khi lưu quyền");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (permission: Permission) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa quyền "${permission.name}" (${permission.code})?`,
      )
    ) {
      return;
    }

    if (!canManagePermissions) {
      toast.error("Bạn không có quyền xóa quyền chi tiết (roles.manage).");
      return;
    }

    try {
      await adminApiCall(AdminEndpoints.permissions.detail(permission.id), { method: "DELETE" });
      setPermissions((prev) => prev.filter((p) => p.id !== permission.id));
      toast.success("Đã xóa quyền");
    } catch (error: any) {
      // Silently fail
      toast.error(error?.message || "Lỗi hệ thống khi xóa quyền");
    }
  };

  const toggleActive = async (permission: Permission) => {
    if (!canManagePermissions) {
      toast.error("Bạn không có quyền cập nhật trạng thái quyền (roles.manage).");
      return;
    }

    try {
      const data = await apiCall<{ success: boolean; data?: Permission }>(
        AdminEndpoints.permissions.detail(permission.id),
        {
          method: "PUT",
          body: JSON.stringify({ isActive: !permission.isActive }),
        },
      );
      if (data.success && data.data) {
        setPermissions((prev) =>
          prev.map((p) =>
            p.id === permission.id ? { ...p, isActive: !permission.isActive } : p,
          ),
        );
      }
    } catch (error: any) {
      // Silently fail
      toast.error(error?.message || "Lỗi hệ thống khi cập nhật trạng thái quyền");
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-gray-900">Quản lý quyền chi tiết</h1>
          <p className="text-gray-500 mt-1">
            Định nghĩa các quyền (permissions) cho từng module và sử dụng để gán cho
            roles.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={openCreateDialog}
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm quyền
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPermission ? "Chỉnh sửa quyền chi tiết" : "Thêm quyền chi tiết mới"}
              </DialogTitle>
              <DialogDescription>
                Đặt mã quyền theo cấu trúc <span className="font-semibold">module.action</span>{" "}
                (ví dụ: <code className="px-1 py-0.5 rounded bg-gray-100 text-xs">users.view</code>,{" "}
                <code className="px-1 py-0.5 rounded bg-gray-100 text-xs">news.publish</code>) để dễ quản lý.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Mã quyền (code)</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value
                          .trim()
                          .toLowerCase()
                          .replace(/\s+/g, "_"),
                      })
                    }
                    placeholder="users.view, users.manage, roles.view..."
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Nên dùng chữ thường, không dấu, cách nhau bởi dấu chấm{" "}
                    (<code className="px-1 rounded bg-gray-100 text-[11px]">
                      module.action
                    </code>
                    ).
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Tên hiển thị</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Xem danh sách người dùng"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Tên mô tả rõ chức năng của quyền này, sẽ hiển thị trong trang phân quyền.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="module">Module</Label>
                  <Input
                    id="module"
                    value={formData.module}
                    onChange={(e) =>
                      setFormData({ ...formData, module: e.target.value })
                    }
                    placeholder="users, roles, news... (tùy chọn)"
                  />
                  <p className="text-xs text-gray-500">
                    Dùng để nhóm các quyền theo chức năng (module). Có thể chọn nhanh từ các module đã có bên dưới.
                  </p>
                  {modules.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      <span className="text-[11px] text-gray-400 mr-1">
                        Module đã có:
                      </span>
                      {modules.map((m) => (
                        <button
                          key={m}
                          type="button"
                          className={`px-2 py-0.5 rounded-full border text-[11px] transition-colors ${
                            formData.module === m
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                          }`}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, module: m }))
                          }
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border rounded-lg p-3 bg-gray-50 mt-6 md:mt-0">
                  <div>
                    <p className="font-medium text-gray-900">Kích hoạt</p>
                    <p className="text-xs text-gray-500">
                      Quyền bị tắt sẽ không hiển thị khi gán cho roles.
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Mô tả chi tiết quyền này dùng để làm gì"
                />
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
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {saving
                    ? "Đang lưu..."
                    : editingPermission
                    ? "Cập nhật"
                    : "Tạo mới"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-lg w-full">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Danh sách quyền</CardTitle>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto md:items-center">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm theo mã hoặc tên quyền..."
                className="pl-9 bg-gray-50 border-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => void loadPermissions()}
              />
            </div>
            <Select
              value={moduleFilter}
              onValueChange={(value) => setModuleFilter(value)}
            >
              <SelectTrigger className="w-full md:w-52 bg-gray-50 border-0">
                <SelectValue placeholder="Lọc theo module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả module</SelectItem>
                {modules.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => void loadPermissions()}>
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-3 px-4 font-medium">Quyền</th>
                  <th className="py-3 px-4 font-medium">Module</th>
                  <th className="py-3 px-4 font-medium">Mô tả</th>
                  <th className="py-3 px-4 font-medium">Trạng thái</th>
                  <th className="py-3 px-4 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-gray-500 text-sm"
                    >
                      Đang tải danh sách quyền...
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredPermissions.map((permission) => (
                    <tr
                      key={permission.id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="bg-blue-50 border-blue-200 text-blue-700"
                            >
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              {permission.name}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {permission.code}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {permission.module ? (
                          <Badge
                            variant="outline"
                            className="bg-gray-50 border-gray-200 text-gray-700"
                          >
                            <FolderTree className="w-3 h-3 mr-1" />
                            {permission.module}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 italic">Chưa gán module</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-700 max-w-md">
                        {permission.description || (
                          <span className="text-gray-400 italic">
                            Chưa có mô tả chi tiết
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className={
                            permission.isActive
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-gray-200 bg-gray-50 text-gray-600"
                          }
                          onClick={() => void toggleActive(permission)}
                        >
                          <span
                            className={`w-2 h-2 rounded-full mr-2 ${
                              permission.isActive ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                          {permission.isActive ? "Đang hoạt động" : "Tạm khóa"}
                        </Button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(permission)}
                            className="h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void handleDelete(permission)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!loading && filteredPermissions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-500">
                      Không tìm thấy quyền phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


