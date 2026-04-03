"use client";

import "../../../styles/styles_admin.css";

import type { ComponentType, ReactNode } from "react";
import {
  LayoutDashboard,
  Newspaper,
  FolderTree,
  Settings,
  LogOut,
  Menu,
  Bell,
  Search,
  User,
  Users,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Settings2,
  Image,
  Package,
  Star,
  Phone,
  MessageSquare,
  Briefcase,
  Info,
  Home,
  Book,
  BookOpen,
  GraduationCap,
  UserCircle,
  CreditCard,
  Globe,
  Monitor,
  MenuSquare,
  UsersRound,
  Shield,
  Key,
  BadgeCent,
  History as HistoryIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { removeAuthToken } from "@/lib/auth/token";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type AdminNavItem = {
  id: string;
  label: string;
  href?: string;
  icon: ComponentType<{ className?: string }>;
  requiredPermissions?: string[]; // Array of permission codes (user needs at least one)
  children?: AdminNavItem[]; // Submenu items
};

const menuItems: AdminNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    requiredPermissions: ["dashboard.view", "admin"],
  },

  {
    id: "books-group",
    label: "Kho Ấn Phẩm",
    icon: Book,
    requiredPermissions: ["books.view", "books.manage", "admin"],
    children: [
      {
        id: "books",
        label: "Tất cả Sách",
        href: "/admin/books",
        icon: Book,
        requiredPermissions: ["books.view", "books.manage", "admin"],
      },
      {
        id: "authors",
        label: "Tác giả",
        href: "/admin/authors",
        icon: UserCircle,
        requiredPermissions: ["authors.view", "authors.manage", "admin"],
      },
      {
        id: "collections",
        label: "Thể loại & Bộ sưu tập",
        href: "/admin/collections",
        icon: FolderTree,
        requiredPermissions: ["books.view", "books.manage", "admin"],
      },
      {
        id: "publishers",
        label: "Nhà xuất bản",
        href: "/admin/publishers",
        icon: Briefcase,
        requiredPermissions: ["publishers.view", "publishers.manage", "admin"],
      },
    ],
  },
  
  {
    id: "readers-services",
    label: "Bạn Đọc & Dịch vụ",
    icon: UsersRound,
    requiredPermissions: ["members.view", "members.manage", "book_loans.view", "payments.view", "admin"],
    children: [
      {
        id: "members",
        label: "Hồ sơ Bạn Đọc",
        href: "/admin/members",
        icon: UsersRound,
        requiredPermissions: ["members.view", "members.manage", "admin"],
      },
      {
        id: "membership-plans",
        label: "Hạng Thẻ (Gói KQ)",
        href: "/admin/membership-plans",
        icon: Star,
        requiredPermissions: ["membership_plans.view", "membership_plans.manage", "admin"],
      },
      {
        id: "membership-requests",
        label: "Duyệt Đơn Gia Hạn",
        href: "/admin/membership-requests",
        icon: Bell,
        requiredPermissions: ["membership_requests.view", "membership_requests.manage", "admin"],
      },
      {
        id: "book-loans",
        label: "Lịch sử Mượn/Trả",
        href: "/admin/book-loans",
        icon: BookOpen,
        requiredPermissions: ["book_loans.view", "book_loans.manage", "admin"],
      },
      {
        id: "payments",
        label: "Tài chính & Giao dịch",
        href: "/admin/payments",
        icon: BadgeCent,
        requiredPermissions: ["payments.view", "payments.manage", "admin"],
      },
    ],
  },

  {
    id: "courses-group",
    label: "Học liệu E-Learning",
    icon: GraduationCap,
    requiredPermissions: ["courses.view", "courses.manage", "admin"],
    children: [
      {
        id: "courses",
        label: "Danh sách Khóa học",
        href: "/admin/courses",
        icon: GraduationCap,
        requiredPermissions: ["courses.view", "courses.manage", "admin"],
      },
      {
        id: "course-categories",
        label: "Danh mục",
        href: "/admin/course-categories",
        icon: FolderTree,
        requiredPermissions: ["course_categories.view", "course_categories.manage", "admin"],
      },
      {
        id: "instructors",
        label: "Giảng viên",
        href: "/admin/instructors",
        icon: UserCircle,
        requiredPermissions: ["instructors.view", "instructors.manage", "admin"],
      },
    ],
  },

  {
    id: "portal-group",
    label: "Truyền thông & App",
    icon: Globe,
    requiredPermissions: ["news.view", "homepage.manage", "notifications.view", "books.view", "admin"],
    children: [
/* 
      {
        id: "homepage",
        label: "Trang chủ CMS",
        href: "/admin/home",
        icon: Home,
        requiredPermissions: ["homepage.manage", "admin"],
      },
*/
      {
        id: "news",
        label: "Tin tức & Sự kiện",
        href: "/admin/news",
        icon: Newspaper,
        requiredPermissions: ["news.view", "news.manage", "admin"],
      },
      {
        id: "app-notifications",
        label: "Thông báo App",
        href: "/admin/notifications",
        icon: Bell,
        requiredPermissions: [],
      },
      {
        id: "reviews",
        label: "Đánh giá & Phản hồi",
        href: "/admin/reviews",
        icon: Star,
        requiredPermissions: ["books.view", "books.manage", "admin"],
      },
      {
        id: "comments",
        label: "Quản lý bình luận",
        href: "/admin/comments",
        icon: MessageSquare,
        requiredPermissions: [], // Để trống để tạm thời mọi người có quyền quan sát đều thấy được
      },
      {
        id: "category",
        label: "Danh mục Tin",
        href: "/admin/categories",
        icon: FolderTree,
        requiredPermissions: ["categories.view", "categories.manage", "admin"],
      },
      {
        id: "media",
        label: "Quản lý Media",
        href: "/admin/media",
        icon: Image,
        requiredPermissions: ["media.view", "media.manage", "admin"],
      },
/*
      {
        id: "menus",
        label: "Cấu hình Menu",
        href: "/admin/menus",
        icon: Menu,
        requiredPermissions: ["menus.view", "menus.manage", "admin"],
      },
      {
        id: "seo",
        label: "Cấu hình SEO",
        href: "/admin/seo",
        icon: Search,
        requiredPermissions: ["seo.view", "seo.manage", "admin"],
      },
*/
    ],
  },

/*
  {
    id: "contact-group",
    label: "Tương tác Liên hệ",
    icon: MessageSquare,
    requiredPermissions: ["contact.view", "contact_requests.view", "admin"],
    children: [
      {
        id: "contact",
        label: "Trang liên hệ",
        href: "/admin/contact",
        icon: Phone,
        requiredPermissions: ["contact.view", "contact.manage", "admin"],
      },
      {
        id: "contact-requests",
        label: "Hộp thư Yêu cầu",
        href: "/admin/contact-requests",
        icon: MessageSquare,
        requiredPermissions: ["contact_requests.view", "contact_requests.manage", "admin"],
      },
    ],
  },
*/

  {
    id: "system",
    label: "Quản trị Hệ Thống",
    icon: Settings2,
    requiredPermissions: ["users.view", "roles.view", "settings.view", "admin"],
    children: [
      {
        id: "users",
        label: "Cán Bộ / Nhân Sự",
        href: "/admin/users",
        icon: ShieldCheck,
        requiredPermissions: ["users.view", "users.manage", "admin"],
      },
      {
        id: "roles",
        label: "Các Cấp Phân Quyền",
        href: "/admin/roles",
        icon: Key,
        requiredPermissions: ["roles.view", "roles.manage", "admin"],
      },
      {
        id: "permissions",
        label: "Cấu hình Đặc quyền",
        href: "/admin/permissions",
        icon: Shield,
        requiredPermissions: ["roles.manage", "permissions.manage", "admin"],
      },
      {
        id: "audit-logs",
        label: "Nhật ký hoạt động",
        href: "/admin/audit-logs",
        icon: HistoryIcon,
        requiredPermissions: ["admin"],
      },
      {
        id: "settings",
        label: "Cài đặt Tổng Cục",
        href: "/admin/settings",
        icon: Settings,
        requiredPermissions: ["settings.view", "settings.manage", "admin"],
      },
    ],
  },
];

type CmsUser = {
  name?: string;
  email?: string;
  permissions?: string[];
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

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState("Admin Thư viện TN");
  const [userEmail, setUserEmail] = useState("admin@gmail.com");
  const [userPermissions, setUserPermissions] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname() || "/admin";
  const router = useRouter();

  // State để quản lý submenu mở/đóng
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());

  // Đọc permissions từ cookie chỉ ở client-side sau khi mount
  useEffect(() => {
    setMounted(true);
    const permissions = getUserPermissionsFromCookie();
    setUserPermissions(permissions);
  }, []);

  // Không filter menu items trong useMemo để tránh hydration mismatch
  // Filter sẽ được thực hiện trong quá trình render dựa trên mounted state
  // Điều này đảm bảo server và client render giống nhau ban đầu

  // Auto-expand submenu nếu đang ở trang con
  useEffect(() => {
    if (!mounted) return;
    const currentSubmenu = menuItems.find((item) =>
      item.children?.some((child) => {
        const childHasPermission = !child.requiredPermissions ||
          child.requiredPermissions.length === 0 ||
          child.requiredPermissions.some((perm) => userPermissions.has(perm));
        if (!childHasPermission) return false;
        return pathname === child.href || (child.href && pathname.startsWith(child.href));
      })
    );
    if (currentSubmenu) {
      setOpenSubmenus((prev) => new Set(prev).add(currentSubmenu.id));
    }
  }, [pathname, userPermissions, mounted]);

  // Đọc thông tin user từ cookie (được set khi login) ở client
  useEffect(() => {
    try {
      const cookie = document.cookie
        .split("; ")
        .find((c) => c.startsWith("cms_thuvien_tn_user="));
      if (cookie) {
        const value = decodeURIComponent(cookie.split("=")[1] || "");
        const parsed = JSON.parse(value) as CmsUser;
        if (parsed.name) setUserName(parsed.name);
        if (parsed.email) setUserEmail(parsed.email);
      }
    } catch {
      // ignore parse error
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore network errors, vẫn redirect
    }
    // Xóa token khỏi localStorage
    removeAuthToken();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } w-64 text-slate-100 shadow-2xl border-r border-white/10`}
        style={{
          background: "linear-gradient(180deg, #020617 0%, #0f172a 100%)"
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="h-14 flex items-center px-6 border-b border-white/10 backdrop-blur-md">
            <div className="w-8 h-8 flex items-center justify-center bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20 border border-white/20">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="ml-3 flex flex-col">
              <span className="text-[12px] font-black text-white leading-tight tracking-tight uppercase">Library Admin</span>
              <span className="text-[8px] text-indigo-400 font-black opacity-80 uppercase tracking-[1.5px]">Master Suite</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const hasSubmenu = item.children && item.children.length > 0;
              const isSubmenuOpen = openSubmenus.has(item.id);

              // Kiểm tra permission - ẩn item nếu không có quyền (sau khi đã mount)
              // Dashboard luôn hiện cho Admin
              const hasPermission = !mounted || userPermissions.size === 0
                ? true
                : item.id === "dashboard" || 
                !item.requiredPermissions ||
                item.requiredPermissions.length === 0 ||
                item.requiredPermissions.some((perm) => userPermissions.has(perm)) ||
                userPermissions.has("admin");

              if (!hasPermission) return null;

              const isActive =
                pathname === item.href ||
                (item.href && item.href !== "/admin" && pathname.startsWith(item.href)) ||
                (hasSubmenu &&
                  item.children?.some(
                    (child) =>
                      pathname === child.href ||
                      (child.href && pathname.startsWith(child.href))
                  ));

              if (hasSubmenu) {
                return (
                  <Collapsible
                    key={item.id}
                    open={isSubmenuOpen}
                    onOpenChange={(open) => {
                      setOpenSubmenus((prev) => {
                        const next = new Set(prev);
                        if (open) {
                          next.add(item.id);
                        } else {
                          next.delete(item.id);
                        }
                        return next;
                      });
                    }}
                    suppressHydrationWarning
                  >
                    <CollapsibleTrigger
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all text-[11px] font-bold uppercase tracking-wider ${isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/50 border border-white/10"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                        }`}
                      suppressHydrationWarning
                    >
                      <div className="flex items-center">
                        <Icon className="w-5 h-5" />
                        <span className="ml-3">{item.label}</span>
                      </div>
                      {isSubmenuOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1 space-y-1" suppressHydrationWarning>
                      {item.children?.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive =
                          pathname === child.href ||
                          (child.href && pathname.startsWith(child.href));

                        // Kiểm tra permission cho child - ẩn nếu không có quyền (sau khi đã mount)
                        // Trên server hoặc chưa mount, hiển thị tất cả để tránh hydration mismatch
                        const childHasPermission = !mounted || userPermissions.size === 0
                          ? true
                          : !child.requiredPermissions ||
                          child.requiredPermissions.length === 0 ||
                          child.requiredPermissions.some((perm) => userPermissions.has(perm)) ||
                          userPermissions.has("admin");

                        if (!childHasPermission) return null;

                        return (
                          <Link
                            key={child.id}
                            href={child.href || "#"}
                            className={`w-full flex items-center pl-10 pr-4 py-2 rounded-xl transition-all text-[11px] font-bold ${isChildActive
                              ? "bg-white/10 text-white border-l-4 border-indigo-400"
                              : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                              }`}
                          >
                            <ChildIcon className="w-3.5 h-3.5" />
                            <span className="ml-3">{child.label}</span>
                          </Link>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href || "#"}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-all text-sm ${isActive
                    ? "bg-indigo-600/20 text-white shadow-xl shadow-black/20 border border-white/10"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="ml-3">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Section */}
          <div className="p-4 border-t border-white/10 mt-auto">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all font-black text-[11px] uppercase tracking-widest gap-3"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất hệ thống</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Top Header Section */}
        <header
          className="h-14 bg-white/80 backdrop-blur-xl border-b border-slate-200 fixed top-0 right-0 left-0 z-30 transition-all duration-300"
          style={{ marginLeft: sidebarOpen ? "16rem" : "0" }}
        >
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen((open) => !open)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              <div className="relative w-96 hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm..."
                  className="pl-10 bg-gray-50 border-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors">
                    <Avatar>
                      <AvatarFallback className="bg-slate-900 text-white border border-white/10 shadow-lg font-bold">
                        {userName
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden sm:block">
                      <div className="text-sm text-gray-800">{userName}</div>
                      <div className="text-xs text-gray-500">{userEmail}</div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 w-4 h-4" />
                    Hồ sơ
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      router.push("/admin/settings");
                    }}
                  >
                    <Settings className="mr-2 w-4 h-4" />
                    Cài đặt
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600"
                  >
                    <LogOut className="mr-2 w-4 h-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="pt-16 min-h-screen">
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </main>
      </div>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}


