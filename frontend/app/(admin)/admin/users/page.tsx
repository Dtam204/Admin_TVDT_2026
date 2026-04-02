"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Edit, Trash2, ShieldCheck } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { adminApiCall, AdminEndpoints } from "@/lib/api/admin";

type UserStatus = "active" | "inactive";

type CmsUser = {
  permissions?: string[];
};

interface Role {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  isDefault: boolean;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleCode: string;
  roleName: string;
  status: UserStatus;
}

type UserFormState = {
  name: string;
  email: string;
  password: string;
  roleId: number | null;
  status: UserStatus;
};

const EMPTY_FORM: UserFormState = {
  name: "",
  email: "",
  password: "",
  roleId: null,
  status: "active",
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState<UserFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const permissions = useMemo(getUserPermissionsFromCookie, []);
  const canViewUsers =
    permissions.has("users.view") ||
    permissions.has("users.manage") ||
    permissions.has("admin");
  const canManageUsers =
    permissions.has("users.manage") || permissions.has("admin");

  const defaultRoleId = useMemo(
    () => {
      // Ưu tiên role Thủ thư (Editor/Librarian) làm mặc định cho CMS
      const librarianRole = roles.find(r => r.code?.toLowerCase() === 'editor' || r.code?.toLowerCase() === 'librarian');
      if (librarianRole) return librarianRole.id;
      // Fallback: Lấy role đầu tiên không phải Admin/User
      return roles.find(r => r.code?.toLowerCase() !== 'admin' && r.code?.toLowerCase() !== 'user')?.id ?? null;
    },
    [roles],
  );

  const loadData = async () => {
    try {
      setLoading(true);

      const [rolesData, usersData] = await Promise.all([
        adminApiCall<{ success: boolean; data?: Role[] }>(AdminEndpoints.roles.list),
        adminApiCall<{ success: boolean; data?: any[] }>(AdminEndpoints.users.list),
      ]);

      if (!rolesData.success || !rolesData.data) {
        throw new Error("Không tải được danh sách roles");
      }
      if (!usersData.success || !usersData.data) {
        throw new Error("Không tải được danh sách users");
      }

      setRoles(
        rolesData.data.map((r) => ({
          ...r,
          description: r.description ?? null,
        })),
      );

      setUsers(
        usersData.data.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          roleId: u.roleId ?? u.role_id,
          roleCode: u.roleCode ?? u.role_code,
          roleName: u.roleName ?? u.role_name ?? u.roleCode ?? u.role,
          status: u.status as UserStatus,
        })),
      );
    } catch (error: any) {
      // Silently fail
      toast.error(error?.message || "Không tải được dữ liệu người dùng / roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const router = useRouter();

  useEffect(() => {
    if (!canViewUsers) {
      router.replace("/admin/forbidden");
    }
  }, [canViewUsers, router]);

  const filteredUsers = users.filter((user) => {
    const query = search.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.roleName.toLowerCase().includes(query)
    );
  });

  const openCreateDialog = () => {
    if (!canManageUsers) {
      toast.error("Bạn không có quyền tạo người dùng (users.manage).");
      return;
    }
    setEditingUser(null);
    setFormData({
      ...EMPTY_FORM,
      roleId: defaultRoleId,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) {
      toast.error("Bạn không có quyền quản lý người dùng (users.manage).");
      return;
    }
    if (!formData.roleId) {
      toast.error("Vui lòng chọn vai trò cho người dùng");
      return;
    }
    // Password bắt buộc khi tạo mới
    if (!editingUser && !formData.password) {
      toast.error("Vui lòng nhập mật khẩu cho người dùng");
      return;
    }

    try {
      setSaving(true);

      if (editingUser) {
        // Khi cập nhật, chỉ gửi password nếu có nhập
        const updateBody: any = {
          email: formData.email,
          name: formData.name,
          status: formData.status,
          roleId: formData.roleId,
        };
        if (formData.password && formData.password.trim() !== "") {
          updateBody.password = formData.password;
        }

        const data = await adminApiCall<{ success: boolean; data?: any }>(
          AdminEndpoints.users.detail(editingUser.id),
          {
            method: "PUT",
            body: JSON.stringify(updateBody),
          },
        );
        if (data.success && data.data) {
          const updated = {
            id: data.data.id,
            name: data.data.name,
            email: data.data.email,
            roleId: data.data.roleId ?? data.data.role_id,
            roleCode: data.data.roleCode ?? data.data.role_code,
            roleName:
              data.data.roleName ?? data.data.role_name ?? data.data.roleCode,
            status: data.data.status as UserStatus,
          };
          setUsers((prev) =>
            prev.map((u) => (u.id === updated.id ? updated : u)),
          );
          toast.success("Đã cập nhật người dùng");
        }
      } else {
        const data = await adminApiCall<{ success: boolean; data?: any }>(
          AdminEndpoints.users.list,
          {
            method: "POST",
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
              name: formData.name,
              status: formData.status,
              roleId: formData.roleId,
            }),
          },
        );
        if (data.success && data.data) {
          const created = {
            id: data.data.id,
            name: data.data.name,
            email: data.data.email,
            roleId: data.data.roleId ?? data.data.role_id,
            roleCode: data.data.roleCode ?? data.data.role_code,
            roleName:
              data.data.roleName ?? data.data.role_name ?? data.data.roleCode,
            status: data.data.status as UserStatus,
          };
          setUsers((prev) => [...prev, created]);
          toast.success("Đã tạo người dùng mới");
        }
      }

      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({
        ...EMPTY_FORM,
        roleId: defaultRoleId,
      });
    } catch (error: any) {
      // Silently fail
      toast.error(error?.message || "Lỗi hệ thống khi lưu người dùng");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Không hiển thị password cũ, để trống để user nhập mới nếu muốn
      roleId: user.roleId,
      status: user.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!canManageUsers) {
      toast.error("Bạn không có quyền xóa người dùng (users.manage).");
      return;
    }
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      return;
    }

    try {
      await adminApiCall(AdminEndpoints.users.detail(id), { method: "DELETE" });
      setUsers((prev) => prev.filter((user) => user.id !== id));
      toast.success("Đã xóa người dùng");
    } catch (error: any) {
      // Silently fail
      toast.error(error?.message || "Lỗi hệ thống khi xóa người dùng");
    }
  };

  const toggleStatus = async (id: number) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    const newStatus: UserStatus =
      user.status === "active" ? "inactive" : "active";

    if (!canManageUsers) {
      toast.error("Bạn không có quyền cập nhật trạng thái (users.manage).");
      return;
    }

    try {
      await adminApiCall(AdminEndpoints.users.detail(id), {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)),
      );
    } catch (error: any) {
      // Silently fail
      toast.error(error?.message || "Lỗi hệ thống khi cập nhật trạng thái");
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-gray-900 font-bold">Danh sách Cán bộ / Nhân sự</h1>
          <p className="text-gray-500 mt-1">
            Quản trị các tài khoản Thủ thư, Biên tập viên và Giám đốc của hệ thống CMS.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={openCreateDialog}
              disabled={!canManageUsers}
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm Nhân Sự
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Chỉnh sửa tài khoản nhân sự" : "Thêm nhân sự mới"}
              </DialogTitle>
              <DialogDescription>
                Thiết lập thông tin và cấp vai trò (role) cho nhân sự.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nhập họ tên"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email đăng nhập</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="nhanvien@thuvien-tn.vn"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Mật khẩu
                  {!editingUser && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={
                    editingUser
                      ? "Để trống nếu không đổi mật khẩu"
                      : "Nhập mật khẩu"
                  }
                  required={!editingUser}
                  minLength={editingUser ? 0 : 6}
                />
                {editingUser && (
                  <p className="text-xs text-gray-500">
                    Chỉ nhập mật khẩu mới nếu muốn thay đổi
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vai trò</Label>
                  <Select
                    value={formData.roleId ? String(formData.roleId) : ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, roleId: Number(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="-- Chọn vai trò --" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles
                        .filter((r) => {
                          if (!r.isActive || r.code?.toLowerCase() === "user") return false;
                          // Nếu đang tạo mới, ẩn Admin để tránh tạo nhiều Admin
                          if (!editingUser && r.code?.toLowerCase() === "admin") return false;
                          return true;
                        })
                        .map((role) => (
                          <SelectItem key={role.id} value={String(role.id)}>
                            {role.name}
                            {role.isDefault ? " (mặc định)" : ""}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: AdminUser["status"]) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Đang hoạt động</SelectItem>
                      <SelectItem value="inactive">Tạm khóa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                    : editingUser
                    ? "Cập nhật"
                    : "Tạo mới"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-lg w-full">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Danh sách tài khoản nhân sự CMS</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm theo tên hiển thị hoặc email..."
              className="pl-9 bg-gray-50 border-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-3 px-4 font-medium">Nhân sự</th>
                  <th className="py-3 px-4 font-medium">Email</th>
                  <th className="py-3 px-4 font-medium">Vai trò</th>
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
                      Đang tải danh sách nhân sự...
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-medium">
                          {user.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-gray-700">{user.email}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className={`w-fit ${
                          user.roleCode === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          user.roleCode === 'editor' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          {user.roleName}
                        </Badge>
                        <span className="text-[10px] text-gray-400 font-medium ml-1">
                          {user.roleCode === 'user' ? '📱 Mobile App' : '💻 Admin CMS'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className={
                          user.status === "active"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-gray-200 bg-gray-50 text-gray-600"
                        }
                        onClick={() => toggleStatus(user.id)}
                      >
                        <span
                          className={`w-2 h-2 rounded-full mr-2 ${
                            user.status === "active"
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        />
                        {user.status === "active" ? "Đang hoạt động" : "Tạm khóa"}
                      </Button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                          className="h-8 w-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(user.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && filteredUsers.length === 0 && (
              <div className="py-10 text-center text-gray-500">
                Không tìm thấy người dùng phù hợp
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
