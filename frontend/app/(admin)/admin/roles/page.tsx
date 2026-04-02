"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/components/ui/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { adminApiCall, AdminEndpoints, apiCall } from "@/lib/api/admin";

interface Role {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  isDefault: boolean;
}

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

type RoleFormState = {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
};

const EMPTY_FORM: RoleFormState = {
  code: "",
  name: "",
  description: "",
  isActive: true,
  isDefault: false,
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

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Permissions dialog state
  const [isPermDialogOpen, setIsPermDialogOpen] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissionIds, setRolePermissionIds] = useState<number[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [permSearch, setPermSearch] = useState("");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(
    {},
  );

  const permissionsOfUser = useMemo(getUserPermissionsFromCookie, []);
  const canViewRoles =
    permissionsOfUser.has("roles.view") ||
    permissionsOfUser.has("roles.manage") ||
    permissionsOfUser.has("admin");
  const canManageRoles =
    permissionsOfUser.has("roles.manage") || permissionsOfUser.has("admin");

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await adminApiCall<{ success: boolean; data?: Role[] }>(AdminEndpoints.roles.list);
      if (!data.success || !data.data) {
        throw new Error("Không tải được danh sách roles");
      }
      setRoles(
        data.data.map((r) => ({
          ...r,
          description: r.description ?? "",
        })),
      );
    } catch (error: any) {
      // Silently fail
      toast.error(error?.message || "Không tải được danh sách phân quyền");
    } finally {
      setLoading(false);
    }
  };

  const loadAllPermissions = async () => {
    const data = await apiCall<{ success: boolean; data?: Permission[] }>(
      `${AdminEndpoints.permissions.list}?active=true`,
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
  };

  useEffect(() => {
    void loadRoles();
  }, []);

  const router = useRouter();

  useEffect(() => {
    if (!canViewRoles) {
      router.replace("/admin/forbidden");
    }
  }, [canViewRoles, router]);

  const filteredRoles = roles.filter((role) => {
    const q = search.toLowerCase();
    return (
      role.code.toLowerCase().includes(q) ||
      role.name.toLowerCase().includes(q) ||
      role.description?.toLowerCase().includes(q)
    );
  });

  const permissionsByModule = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    for (const p of permissions) {
      const key = (p.module || "Khác").trim() || "Khác";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    Object.keys(groups).forEach((k) => {
      groups[k].sort((a, b) => a.code.localeCompare(b.code));
    });
    return groups;
  }, [permissions]);

  const allPermissionIds = useMemo(
    () => permissions.map((p) => p.id),
    [permissions],
  );

  const toggleModuleExpanded = (moduleName: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleName]: !prev[moduleName],
    }));
  };

  const openCreateDialog = () => {
    if (!canManageRoles) {
      toast.error("Bạn không có quyền tạo/cập nhật role (roles.manage).");
      return;
    }
    setEditingRole(null);
    setFormData(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const openEditDialog = (role: Role) => {
    if (!canManageRoles) {
      toast.error("Bạn không có quyền chỉnh sửa role (roles.manage).");
      return;
    }
    setEditingRole(role);
    setFormData({
      code: role.code,
      name: role.name,
      description: role.description ?? "",
      isActive: role.isActive,
      isDefault: role.isDefault,
    });
    setIsDialogOpen(true);
  };

  const openPermissionsDialog = async (role: Role) => {
    if (!canManageRoles) {
      toast.error("Bạn không có quyền gán quyền cho role (roles.manage).");
      return;
    }
    try {
      setSelectedRole(role);
      setIsPermDialogOpen(true);
      setLoadingPermissions(true);

      // load tất cả quyền một lần
      await loadAllPermissions();

      // load quyền đang gán cho role
      const data = await apiCall<{ success: boolean; data?: { permissions?: Permission[] } }>(
        AdminEndpoints.roles.permissions(role.id),
      );
      if (!data?.success) {
        throw new Error("Không tải được quyền của role");
      }
      const permissionIds =
        (data.data?.permissions as Permission[] | undefined)?.map(
          (p) => p.id,
        ) ?? [];
      setRolePermissionIds(permissionIds);
    } catch (error: any) {
      // Silently fail
      // Giữ popup mở để người dùng thấy thông báo, không tự đóng
      toast.error(error?.message || "Không tải được quyền của role. Vui lòng kiểm tra API backend.");
    } finally {
      setLoadingPermissions(false);
    }
  };

  const togglePermissionChecked = (permissionId: number) => {
    setRolePermissionIds((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      }
      return [...prev, permissionId];
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    if (!canManageRoles) {
      toast.error("Bạn không có quyền gán quyền cho role (roles.manage).");
      return;
    }

    try {
      setSavingPermissions(true);
      await adminApiCall(AdminEndpoints.roles.permissions(selectedRole.id), {
        method: "PUT",
        body: JSON.stringify({ permissionIds: rolePermissionIds }),
      });
      toast.success("Đã cập nhật quyền cho role");
      setIsPermDialogOpen(false);
      setSelectedRole(null);
      setRolePermissionIds([]);
    } catch (error: any) {
      // Silently fail
      toast.error(error?.message || "Lỗi hệ thống khi cập nhật quyền cho role");
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error("Vui lòng nhập đầy đủ mã role và tên role");
      return;
    }

    if (!canManageRoles) {
      toast.error("Bạn không có quyền quản lý role (roles.manage).");
      return;
    }

    try {
      setSaving(true);

      if (editingRole) {
        const data = await apiCall<{ success: boolean; data?: Role }>(
          AdminEndpoints.roles.detail(editingRole.id),
          {
            method: "PUT",
            body: JSON.stringify(formData),
          },
        );
        if (data.success && data.data) {
          setRoles((prev) =>
            prev.map((r) => (r.id === data.data!.id ? data.data! : r)),
          );
          toast.success("Đã cập nhật phân quyền");
        }
      } else {
        const data = await apiCall<{ success: boolean; data?: Role }>(
          AdminEndpoints.roles.list,
          {
            method: "POST",
            body: JSON.stringify(formData),
          },
        );
        if (data.success && data.data) {
          setRoles((prev) => [...prev, data.data!]);
          toast.success("Đã tạo phân quyền mới");
        }
      }

      setIsDialogOpen(false);
      setEditingRole(null);
      setFormData(EMPTY_FORM);
    } catch (error: any) {
      // Silently fail
      toast.error(error?.message || "Lỗi hệ thống khi lưu phân quyền");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa role "${role.name}"? Các cán bộ đang dùng role này sẽ bị ảnh hưởng.`,
      )
    ) {
      return;
    }

    if (!canManageRoles) {
      toast.error("Bạn không có quyền xóa role (roles.manage).");
      return;
    }

    try {
      await adminApiCall(AdminEndpoints.roles.detail(role.id), { method: "DELETE" });
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      toast.success("Đã xóa phân quyền");
    } catch (error: any) {
      // Silently fail
      toast.error(error?.message || "Lỗi hệ thống khi xóa phân quyền");
    }
  };

  const toggleActive = async (role: Role) => {
    try {
      const data = await apiCall<{ success: boolean; data?: Role }>(
        AdminEndpoints.roles.detail(role.id),
        {
          method: "PUT",
          body: JSON.stringify({ isActive: !role.isActive }),
        },
      );
      if (data.success && data.data) {
        setRoles((prev) =>
          prev.map((r) => (r.id === data.data!.id ? data.data! : r)),
        );
      }
    } catch (error: any) {
      // Silently fail
      toast.error(error?.message || "Lỗi hệ thống khi cập nhật trạng thái role");
    }
  };

  const setAsDefault = async (role: Role) => {
    try {
      const data = await apiCall<{ success: boolean; data?: Role }>(
        AdminEndpoints.roles.detail(role.id),
        {
          method: "PUT",
          body: JSON.stringify({ isDefault: true }),
        },
      );
      if (data.success && data.data) {
        // server đã tự reset is_default, load lại cho chắc chắn
        void loadRoles();
      }
    } catch (error: any) {
      // Silently fail
      toast.error(error?.message || "Lỗi hệ thống khi đặt role mặc định");
    }
  };

  return (
    <div className="w-full pb-8 space-y-0 text-slate-900 bg-slate-50/30 min-h-screen">
      {/* ── RICH COMPACT HEADER (SYNC WITH ALL ADMIN PAGES) ── */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-950 to-black px-6 py-5 md:px-10 md:py-6 2xl:py-10 shadow-xl relative overflow-hidden flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-white/10">
        {/* Subtle Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full -ml-24 -mb-24 blur-[80px]" />

        {/* LEFT SECTION: BRAND & ACTION */}
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl">
              <ShieldCheck className="w-8 h-8 lg:w-9 lg:h-9 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl 2xl:text-4xl font-black text-white tracking-tight">Phân quyền & Vai trò</h1>
              <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 mt-1 opacity-60">
                <KeyRound className="w-3.5 h-3.5 text-yellow-400" />
                QUẢN TRỊ ĐẶC QUYỀN HỆ THỐNG
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-white hover:bg-slate-100 text-indigo-950 font-black px-6 py-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-[11px] gap-2 h-10 w-fit border-none"
                onClick={openCreateDialog}
              >
                <Plus className="w-4 h-4 stroke-[3px]" />
                Thêm vai trò mới
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-none shadow-2xl bg-white p-0 overflow-hidden sm:max-w-[500px]">
              <DialogHeader className="bg-gradient-to-br from-indigo-700 to-black p-8 text-white text-left relative">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldCheck className="w-24 h-24" />
                 </div>
                 <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                   {editingRole ? "Cập nhật Vai trò" : "Khởi tạo Vai trò"}
                 </DialogTitle>
                 <DialogDescription className="text-indigo-100 text-xs font-medium mt-1 opacity-70 uppercase tracking-widest leading-relaxed">
                   Thiết lập mã định danh và mô tả quyền hạn
                 </DialogDescription>
              </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Mã role</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.trim().toLowerCase(),
                      })
                    }
                    placeholder="admin, editor, user..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Tên hiển thị</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Quản trị viên, Biên tập viên..."
                    required
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
                  placeholder="Mô tả ngắn về quyền hạn của role này"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between border rounded-lg p-3 bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">Kích hoạt</p>
                    <p className="text-xs text-gray-500">
                      Role bị tắt sẽ không thể gán cho người dùng mới.
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between border rounded-lg p-3 bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">Role mặc định</p>
                    <p className="text-xs text-gray-500">
                      Mặc định gán cho người dùng mới nếu không chọn role.
                    </p>
                  </div>
                  <Switch
                    checked={formData.isDefault}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isDefault: checked })
                    }
                  />
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
                    : editingRole
                    ? "Cập nhật"
                    : "Tạo mới"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

        {/* RIGHT SECTION: STATISTICS (COMPACT) */}
        <div className="relative z-10 flex flex-wrap xl:flex-nowrap items-center gap-3">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 transition-all hover:bg-white/10 min-w-[150px]">
             <div className="p-2 bg-yellow-500/20 rounded-lg">
                <KeyRound className="w-5 h-5 text-yellow-300" />
             </div>
             <div>
                <p className="text-[7px] text-yellow-300 uppercase font-black tracking-widest leading-none mb-1">TOTAL ROLES</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-lg lg:text-xl font-black text-white">{roles.length}</span>
                   <span className="text-[8px] text-yellow-500 font-bold uppercase">Nhóm</span>
                </div>
             </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 transition-all hover:bg-white/10 min-w-[150px]">
             <div className="p-2 bg-emerald-500/20 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
             </div>
             <div>
                <p className="text-[7px] text-emerald-300 uppercase font-black tracking-widest leading-none mb-1">DATA NODES</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-lg lg:text-xl font-black text-white">{roles.filter(r => r.isActive).length}</span>
                   <span className="text-[8px] text-emerald-500 font-bold uppercase">Units</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-4 pt-6">
        {/* Toolbar */}
        <div className="flex items-center gap-4 group">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <Input
              placeholder="Tìm kiếm vai trò theo tên, mã định danh hoặc mô tả..."
              className="pl-10 h-11 border-2 border-slate-100 bg-white focus:bg-white text-[11px] rounded-xl transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
          <Table className="border-collapse">
            <TableHeader className="bg-slate-50 border-b-2 border-slate-200">
              <TableRow className="hover:bg-transparent h-11">
                <TableHead className="px-6 font-black text-slate-800 uppercase text-[10px] tracking-wider w-[240px]">Nhóm vai trò</TableHead>
                <TableHead className="font-black text-slate-800 uppercase text-[10px] tracking-wider">Phạm vi & Mô tả</TableHead>
                <TableHead className="text-center font-black text-slate-800 uppercase text-[10px] tracking-wider">Trình trạng</TableHead>
                <TableHead className="text-center font-black text-slate-800 uppercase text-[10px] tracking-wider">Mặc định</TableHead>
                <TableHead className="text-right font-black text-slate-800 pr-8 uppercase text-[10px] tracking-wider">Nghiệp vụ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
                {loading ? (
                    <TableRow>
                    <TableCell colSpan={5} className="text-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Scanning Protocols...</span>
                        </div>
                    </TableCell>
                    </TableRow>
                ) : filteredRoles.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={5} className="text-center py-32">
                        <ShieldCheck className="w-16 h-16 mx-auto mb-3 text-slate-100" />
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">No Roles Configured</span>
                    </TableCell>
                    </TableRow>
                ) : filteredRoles.map((role) => (
                    <TableRow
                        key={role.id}
                        className="group hover:bg-slate-50/80 transition-all h-20 border-slate-100"
                    >
                        <TableCell className="px-6">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-indigo-50 border-indigo-200 text-indigo-700 font-black text-[10px] uppercase tracking-tighter shadow-sm">
                                        {role.name}
                                    </Badge>
                                </div>
                                <div className="text-[9px] text-slate-400 font-bold font-mono mt-1 uppercase tracking-widest">
                                    Code: {role.code}
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-slate-500 text-[11px] font-medium leading-relaxed max-w-[400px]">
                            {role.description || (
                                <span className="text-slate-300 italic">Chưa cấu bản mô tả nghiệp vụ cho vai trò này...</span>
                            )}
                        </TableCell>
                        <TableCell className="text-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "rounded-full h-8 px-4 text-[9px] font-black uppercase tracking-widest transition-all",
                                    role.isActive 
                                    ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" 
                                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                )}
                                onClick={() => void toggleActive(role)}
                            >
                                <div className={cn("w-1.5 h-1.5 rounded-full mr-2", role.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-400")} />
                                {role.isActive ? "Active" : "Disabled"}
                            </Button>
                        </TableCell>
                        <TableCell className="text-center">
                            {role.isDefault ? (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-lg text-[9px] font-black text-amber-600 border border-amber-200 uppercase tracking-widest">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Default
                                </div>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 font-black text-[9px] uppercase tracking-widest rounded-lg h-8"
                                    onClick={() => void setAsDefault(role)}
                                >
                                    Set Default
                                </Button>
                            )}
                        </TableCell>
                        <TableCell className="text-right pr-6 py-2">
                           <div className="flex justify-end gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center gap-2 h-8 px-3 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 transition-all font-black text-[9px] uppercase tracking-widest"
                                    onClick={() => void openPermissionsDialog(role)}
                                >
                                    <KeyRound className="w-3.5 h-3.5" />
                                    Gán quyền
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditDialog(role)}
                                    className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
                                >
                                    <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => void handleDelete(role)}
                                    className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                           </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog gán quyền cho role */}
      <Dialog
        open={isPermDialogOpen}
        onOpenChange={(open) => {
          setIsPermDialogOpen(open);
          if (!open) {
            setSelectedRole(null);
            setRolePermissionIds([]);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gán quyền cho role</DialogTitle>
            <DialogDescription>
              Chọn các quyền chi tiết sẽ được áp dụng cho role{" "}
              <span className="font-semibold text-gray-900">
                {selectedRole?.name} ({selectedRole?.code})
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          {/* Thanh công cụ: search + chọn/bỏ tất cả */}
          {!loadingPermissions && (
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên hoặc mã quyền..."
                  className="pl-9 bg-gray-50 border-0 h-9 text-sm"
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRolePermissionIds(allPermissionIds);
                  }}
                >
                  Chọn tất cả quyền
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRolePermissionIds([]);
                  }}
                >
                  Bỏ chọn tất cả
                </Button>
              </div>
            </div>
          )}

          {loadingPermissions ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              Đang tải danh sách quyền...
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {Object.keys(permissionsByModule).map((moduleName) => {
                const rawModulePermissions = permissionsByModule[moduleName];
                const q = permSearch.trim().toLowerCase();
                const modulePermissions = q
                  ? rawModulePermissions.filter(
                      (p) =>
                        p.name.toLowerCase().includes(q) ||
                        p.code.toLowerCase().includes(q),
                    )
                  : rawModulePermissions;

                // Nếu đang search mà module này không có quyền khớp thì ẩn luôn
                if (q && modulePermissions.length === 0) {
                  return null;
                }

                const allSelected = modulePermissions.every((p) =>
                  rolePermissionIds.includes(p.id),
                );
                const someSelected =
                  !allSelected &&
                  modulePermissions.some((p) => rolePermissionIds.includes(p.id));
                const expanded = expandedModules[moduleName] ?? true;

                const totalSelectedInModule = modulePermissions.filter((p) =>
                  rolePermissionIds.includes(p.id),
                ).length;

                return (
                  <div
                    key={moduleName}
                    className="border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                      <button
                        type="button"
                        className="flex items-center gap-2 text-sm font-medium text-gray-900"
                        onClick={() => toggleModuleExpanded(moduleName)}
                      >
                        {expanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        <span>{moduleName}</span>
                        <span className="text-xs text-gray-500">
                          ({modulePermissions.length} quyền, đã chọn{" "}
                          {totalSelectedInModule})
                        </span>
                      </button>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 text-xs text-gray-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => {
                              if (el) {
                                el.indeterminate = someSelected;
                              }
                            }}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const ids = modulePermissions.map((p) => p.id);
                              if (checked) {
                                setRolePermissionIds((prev) => [
                                  ...new Set([...prev, ...ids]),
                                ]);
                              } else {
                                const idsSet = new Set(ids);
                                setRolePermissionIds((prev) =>
                                  prev.filter((id) => !idsSet.has(id)),
                                );
                              }
                            }}
                          />
                          <span>
                            {allSelected
                              ? "Bỏ chọn module"
                              : "Chọn module này"}
                          </span>
                        </label>
                      </div>
                    </div>

                    {expanded && (
                      <div className="p-3 pl-6 space-y-2">
                        {modulePermissions.map((p) => {
                          const checked = rolePermissionIds.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className={`flex items-start gap-2 rounded-md border p-2 text-xs cursor-pointer transition-colors ${
                                checked
                                  ? "border-indigo-300 bg-indigo-50"
                                  : "border-gray-200 bg-white hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="mt-1 h-3 w-3"
                                checked={checked}
                                onChange={() => togglePermissionChecked(p.id)}
                              />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {p.name}
                                </div>
                                <div className="text-[11px] text-gray-500">
                                  {p.code}
                                </div>
                                {p.description && (
                                  <div className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">
                                    {p.description}
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {Object.keys(permissionsByModule).length === 0 && (
                <div className="py-6 text-center text-gray-500 text-sm">
                  Chưa có quyền nào để gán. Vui lòng tạo quyền tại trang{" "}
                  <span className="font-semibold">Quyền chi tiết</span>.
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <div className="text-xs text-gray-500">
              Đã chọn{" "}
              <span className="font-semibold text-gray-900">
                {rolePermissionIds.length}
              </span>{" "}
              quyền cho role này.
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPermDialogOpen(false)}
              >
                Đóng
              </Button>
              <Button
                type="button"
                disabled={savingPermissions}
                onClick={() => void handleSavePermissions()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {savingPermissions ? "Đang lưu..." : "Lưu quyền cho role"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

