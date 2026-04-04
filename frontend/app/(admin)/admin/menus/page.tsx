"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, ListTree, Link2, Languages, Sparkles, Loader2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { adminApiCall, AdminEndpoints } from "@/lib/api/admin";
import { getCleanValue } from "@/lib/utils/locale-admin";

type Locale = 'vi' | 'en' | 'ja';

interface MenuItem {
  id: number;
  title: string;
  url: string;
  parentId?: number | null;
  parentTitle?: string | null;
  sortOrder: number;
  icon?: string;
  isActive: boolean;
}

interface MenuFormState {
  title: string;
  url: string;
  parentId: string; // store as string id or ""
  sortOrder: string;
  icon: string;
  isActive: boolean;
}

const EMPTY_FORM: MenuFormState = {
  title: "",
  url: "",
  parentId: "",
  sortOrder: "0",
  icon: "",
  isActive: true,
};

const PAGE_SIZE = 10;

export default function AdminMenusPage() {
  const router = useRouter();

  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [page, setPage] = useState(1);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuFormState>(EMPTY_FORM);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const data = await adminApiCall<{ success: boolean; data?: MenuItem[] }>(
        AdminEndpoints.menus.list,
      );
      // Normalize dữ liệu: chỉ lấy tiếng Việt hoặc chuỗi phẳng
      const normalizedMenus = (data?.data || []).map(menu => ({
        ...menu,
        title: getCleanValue(menu.title),
        parentTitle: menu.parentTitle ? getCleanValue(menu.parentTitle) : null
      }));
      setMenus(normalizedMenus as MenuItem[]);
    } catch (error: any) {
      toast.error(error?.message || "Không thể tải danh sách menu");
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMenus();
  }, []);

  const filteredMenus = useMemo(() => {
    const q = search.toLowerCase();
    return menus.filter((m) => {
      const title = m.title;
      const matchesSearch =
        !q ||
        title.toLowerCase().includes(q) ||
        m.url.toLowerCase().includes(q);

      const matchesActive = !onlyActive || m.isActive;

      return matchesSearch && matchesActive;
    });
  }, [menus, search, onlyActive]);

  const totalPages = Math.max(1, Math.ceil(filteredMenus.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedMenus = filteredMenus.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, onlyActive]);

  const handleOpenCreate = () => {
    setEditingMenu(null);
    setFormData(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (menu: MenuItem) => {
    setEditingMenu(menu);
    setFormData({
      title: menu.title,
      url: menu.url,
      parentId: menu.parentId ? String(menu.parentId) : "",
      sortOrder: String(menu.sortOrder ?? 0),
      icon: menu.icon || "",
      isActive: menu.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (menu: MenuItem) => {
    const menuTitle = menu.title;
    if (!window.confirm(`Bạn có chắc muốn xóa menu "${menuTitle}"?`)) return;
    try {
      await adminApiCall(AdminEndpoints.menus.detail(menu.id), {
        method: "DELETE",
      });
      toast.success("Đã xóa menu");
      void fetchMenus();
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi khi xóa menu");
      // Silently fail
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const titleValue = formData.title;
    if (!titleValue.trim()) {
      toast.error("Tiêu đề menu là bắt buộc");
      return;
    }
    if (!formData.url.trim()) {
      toast.error("Đường dẫn (URL) là bắt buộc");
      return;
    }

    const payload = {
      title: formData.title,
      url: formData.url.trim(),
      parentId: formData.parentId ? Number(formData.parentId) : null,
      sortOrder: Number(formData.sortOrder || 0),
      icon: formData.icon.trim() || null,
      isActive: formData.isActive,
    };

    try {
      setSaving(true);
      if (editingMenu) {
        await adminApiCall(AdminEndpoints.menus.detail(editingMenu.id), {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Đã cập nhật menu");
      } else {
        await adminApiCall(AdminEndpoints.menus.list, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Đã tạo menu mới");
      }
      setIsDialogOpen(false);
      setEditingMenu(null);
      setFormData(EMPTY_FORM);
      void fetchMenus();
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi khi lưu menu");
      // Silently fail
    } finally {
      setSaving(false);
    }
  };

  const parentOptions = useMemo(
    () => menus.filter((m) => !m.parentId && m.isActive),
    [menus],
  );



  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const handleDragStart = (id: number) => {
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const persistOrderForGroup = async (
    parentId: number | null,
    orderedMenus: MenuItem[],
  ) => {
    try {
      setSavingOrder(true);
      const items = orderedMenus.filter(
        (m) => ((m.parentId ?? null) === parentId),
      );
      await Promise.all(
        items.map((m, index) =>
          adminApiCall(AdminEndpoints.menus.detail(m.id), {
            method: "PUT",
            body: JSON.stringify({ sortOrder: index + 1 }),
          }),
        ),
      );
      toast.success("Đã cập nhật thứ tự menu");
    } catch (error: any) {
      // Silently fail
      toast.error(error?.message || "Không thể lưu thứ tự menu");
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDropOnRow = async (targetId: number) => {
    if (!draggingId || draggingId === targetId) return;

    setMenus((prev) => {
      const sourceIndex = prev.findIndex((m) => m.id === draggingId);
      const targetIndex = prev.findIndex((m) => m.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const sourceItem = prev[sourceIndex];
      const targetItem = prev[targetIndex];

      // Chỉ cho phép sắp xếp trong cùng menu cha
      const sourceParent = sourceItem.parentId ?? null;
      const targetParent = targetItem.parentId ?? null;
      if (sourceParent !== targetParent) {
        return prev;
      }

      const updated = [...prev];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);

      // cập nhật sortOrder trong state (tạm thời) cho nhóm cùng menu cha
      let order = 1;
      for (const item of updated.filter(
        (m) => ((m.parentId ?? null) === sourceParent),
      )) {
        item.sortOrder = order++;
      }

      // Gửi API lưu thứ tự (async, không block setState)
      void persistOrderForGroup(sourceParent, updated);

      return updated;
    });

    setDraggingId(null);
  };

  return (
    <div className="space-y-6 w-full">

      <div className="flex items-center justify-between gap-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={handleOpenCreate}
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm menu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editingMenu ? "Chỉnh sửa menu" : "Thêm menu mới"}
              </DialogTitle>
              <DialogDescription>
                Nhập thông tin menu để hiển thị trên website.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="menu-title">Tiêu đề</Label>
                  <Input
                    id="menu-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ví dụ: Trang chủ"
                    required
                  />
                </div>

              <div className="space-y-2">
                <Label htmlFor="menu-url">
                  <Link2 className="w-3 h-3 inline mr-1" />
                  Đường dẫn (URL)
                </Label>
                <Input
                  id="menu-url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="/news, https://..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="menu-parent">Menu cha (tuỳ chọn)</Label>
                  <Select
                    value={formData.parentId || "none"}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        parentId: v === "none" ? "" : v,
                      })
                    }
                  >
                    <SelectTrigger id="menu-parent">
                      <SelectValue placeholder="Không có" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Không có --</SelectItem>
                      {parentOptions
                        .filter((m) => !editingMenu || m.id !== editingMenu.id)
                        .map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="menu-sort">Thứ tự hiển thị</Label>
                  <Input
                    id="menu-sort"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-2">
                  <Label htmlFor="menu-icon">Icon (tuỳ chọn)</Label>
                  <Input
                    id="menu-icon"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    placeholder="heroicons-home, lucide:home..."
                  />
                </div>
                <div className="flex items-center gap-2 pt-5 sm:pt-7">
                  <Switch
                    id="menu-active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="menu-active">Kích hoạt</Label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
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
                    : editingMenu
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
          <CardTitle className="text-lg font-semibold">
            Danh sách menu
          </CardTitle>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <Input
              placeholder="Tìm theo tiêu đề hoặc URL..."
              className="w-full md:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex flex-wrap gap-3 items-center">
              <div className="inline-flex items-center gap-2">
                <Switch
                  id="onlyActive"
                  checked={onlyActive}
                  onCheckedChange={setOnlyActive}
                />
                <Label htmlFor="onlyActive" className="text-sm text-gray-600">
                  Chỉ hiển thị menu đang kích hoạt
                </Label>
              </div>

              <p className="text-[11px] text-gray-500">
                Kéo thả icon ở cột đầu tiên để thay đổi thứ tự menu.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[13px] text-gray-600 font-semibold bg-gray-50">
                  <th className="py-3 pl-5 pr-2 rounded-l-xl text-left">Thứ tự</th>
                  <th className="py-3 px-2 text-left">Tiêu đề</th>
                  <th className="py-3 px-2 text-left">Đường dẫn</th>
                  <th className="py-3 px-2 text-left">Menu cha</th>
                  <th className="py-3 px-4 text-center rounded-r-xl">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedMenus.length > 0 ? (
                  paginatedMenus.map((item, index) => (
                    <tr
                      key={item.id}
                      draggable
                      onDragStart={() => handleDragStart(item.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDropOnRow(item.id)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white shadow-sm border border-gray-100 rounded-lg hover:shadow-md transition-all ${
                        !item.isActive ? "opacity-70" : ""
                      }`}
                      style={{ borderRadius: 12 }}
                    >
                      <td className="py-3 px-2 md:pl-5 md:pr-2 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-gray-400 bg-gray-50 cursor-grab ${
                              draggingId === item.id ? "ring-2 ring-blue-300" : ""
                            }`}
                          >
                            <ListTree className="w-3 h-3" />
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {item.sortOrder ?? startIndex + index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {item.icon && (
                            <span className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs">
                              <ListTree className="w-3 h-3" />
                            </span>
                          )}
                          <div className="flex flex-col min-w-0 gap-0.5">
                            <span className="font-medium text-gray-900 truncate">
                              {item.title}
                            </span>
                            <div className="flex flex-wrap items-center gap-1 text-[11px] text-gray-500">
                              <span className="text-gray-400">ID: {item.id}</span>
                              {item.icon && (
                                <Badge
                                  variant="outline"
                                  className="border-blue-100 bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0"
                                >
                                  Icon: {item.icon}
                                </Badge>
                              )}
                              {!item.isActive && (
                                <Badge
                                  variant="destructive"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  Đang ẩn
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 align-middle">
                        <Badge
                          variant="outline"
                          className="bg-blue-50/60 border-blue-100 text-blue-700 text-[11px] font-normal max-w-xs truncate"
                          title={item.url}
                        >
                          {item.url}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 align-middle text-sm">
                        {item.parentTitle ? (
                          <Badge
                            variant="outline"
                            className="bg-gray-50 border-gray-200 text-gray-700 max-w-xs truncate"
                            title={item.parentTitle}
                          >
                            {item.parentTitle}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">Không có</span>
                        )}
                      </td>
                      <td className="py-3 px-4 align-middle text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full flex items-center justify-center text-primary hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            title="Chỉnh sửa"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="Xóa"
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-gray-400 text-sm bg-white rounded-xl shadow"
                    >
                      {loading
                        ? "Đang tải danh sách menu..."
                        : "Chưa có menu nào hoặc không tìm thấy theo điều kiện lọc."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {filteredMenus.length > 0 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-4 text-sm text-gray-700">
                <div>
                  Hiển thị{" "}
                  <span className="font-semibold text-primary">
                    {startIndex + 1}-
                    {Math.min(startIndex + PAGE_SIZE, filteredMenus.length)}
                  </span>{" "}
                  trên{" "}
                  <span className="font-semibold">{filteredMenus.length}</span>{" "}
                  menu phù hợp bộ lọc.
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg"
                  >
                    Trang trước
                  </Button>
                  <span>
                    <span className="font-semibold text-primary">{currentPage}</span>
                    /{totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setPage((p) => (p < totalPages ? p + 1 : p))
                    }
                    className="rounded-lg"
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


