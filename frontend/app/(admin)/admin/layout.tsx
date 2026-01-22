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
  id:
    | "dashboard"
    | "news"
    | "category"
    | "system"
    | "users"
    | "roles"
    | "permissions"
    | "settings"
    | "news-group"
    | "media"
    | "menus"
    | "homepage"
    | "contact"
    | "contact-requests"
    | "contact-group"
    | "content-group"
    | "seo"
    // Phase 1 MVP
    | "books-group"
    | "books"
    | "authors"
    | "book-categories"
    | "publishers"
    | "book-loans"
    | "courses-group"
    | "courses"
    | "course-categories"
    | "instructors"
    | "members-group"
    | "members"
    | "membership-plans"
    | "payments";
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
  
  // ========================================================================
  // Phase 1 MVP - Library & Courses System
  // ========================================================================
  
  {
    id: "books-group",
    label: "Quản lý Sách",
    icon: Book,
    requiredPermissions: ["books.view", "books.manage", "admin"],
    children: [
      {
        id: "books",
        label: "Tất cả sách",
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
        id: "book-categories",
        label: "Thể loại sách",
        href: "/admin/book-categories",
        icon: FolderTree,
        requiredPermissions: ["book_categories.view", "book_categories.manage", "admin"],
      },
      {
        id: "publishers",
        label: "Nhà xuất bản",
        href: "/admin/publishers",
        icon: Briefcase,
        requiredPermissions: ["publishers.view", "publishers.manage", "admin"],
      },
      {
        id: "book-loans",
        label: "Mượn/Trả sách",
        href: "/admin/book-loans",
        icon: BookOpen,
        requiredPermissions: ["book_loans.view", "book_loans.manage", "admin"],
      },
    ],
  },
  
  {
    id: "courses-group",
    label: "Quản lý Khóa học",
    icon: GraduationCap,
    requiredPermissions: ["courses.view", "courses.manage", "admin"],
    children: [
      {
        id: "courses",
        label: "Tất cả khóa học",
        href: "/admin/courses",
        icon: GraduationCap,
        requiredPermissions: ["courses.view", "courses.manage", "admin"],
      },
      {
        id: "course-categories",
        label: "Danh mục khóa học",
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
    id: "members-group",
    label: "Quản lý Thành viên",
    icon: Users,
    requiredPermissions: ["members.view", "members.manage", "admin"],
    children: [
      {
        id: "members",
        label: "Tất cả thành viên",
        href: "/admin/members",
        icon: Users,
        requiredPermissions: ["members.view", "members.manage", "admin"],
      },
      {
        id: "membership-plans",
        label: "Gói thành viên",
        href: "/admin/membership-plans",
        icon: Package,
        requiredPermissions: ["membership_plans.view", "membership_plans.manage", "admin"],
      },
    ],
  },
  
  {
    id: "payments",
    label: "Thanh toán",
    href: "/admin/payments",
    icon: CreditCard,
    requiredPermissions: ["payments.view", "payments.manage", "admin"],
  },
  {
    id: "news-group",
    label: "Quản lý Tin tức",
    icon: Newspaper,
    requiredPermissions: ["news.view", "news.manage", "categories.view", "categories.manage", "admin"],
    children: [
      {
        id: "news",
        label: "Bài viết",
        href: "/admin/news",
        icon: Newspaper,
        requiredPermissions: ["news.view", "news.manage", "admin"],
      },
      {
        id: "category",
        label: "Danh mục",
        href: "/admin/categories",
        icon: FolderTree,
        requiredPermissions: ["categories.view", "categories.manage", "admin"],
      },
    ],
  },  
  {
    id: "homepage",
    label: "Trang chủ",
    href: "/admin/home",
    icon: Home,
    requiredPermissions: ["homepage.manage", "admin"],
  },
  {
    id: "contact-group",
    label: "Quản lý Liên hệ",
    icon: Phone,
    requiredPermissions: ["contact.view", "contact.manage", "contact_requests.view", "contact_requests.manage", "admin"],
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
        label: "Yêu cầu tư vấn",
        href: "/admin/contact-requests",
        icon: MessageSquare,
        requiredPermissions: ["contact_requests.view", "contact_requests.manage", "admin"],
      },
    ],
  },
  {
    id: "system",
    label: "Hệ thống",
    icon: Settings2,
    requiredPermissions: [
      "users.view",
      "users.manage",
      "roles.view",
      "roles.manage",
      "permissions.manage",
      "seo.view",
      "seo.manage",
      "admin",
    ],
    children: [
      {
        id: "users",
        label: "Người dùng",
        href: "/admin/users",
        icon: Users,
        requiredPermissions: ["users.view", "users.manage", "admin"],
      },
      {
        id: "roles",
        label: "Phân quyền",
        href: "/admin/roles",
        icon: ShieldCheck,
        requiredPermissions: ["roles.view", "roles.manage", "admin"],
      },
      {
        id: "permissions",
        label: "Quyền chi tiết",
        href: "/admin/permissions",
        icon: ShieldCheck,
        requiredPermissions: ["roles.manage", "permissions.manage", "admin"],
      },
      {
        id: "seo",
        label: "Cấu hình SEO",
        href: "/admin/seo",
        icon: Settings2,
        requiredPermissions: ["seo.view", "seo.manage", "admin"],
      },
    ],
  },
  {
    id: "media",
    label: "Quản lý Media",
    href: "/admin/media",
    icon: Image,
    requiredPermissions: ["media.view", "media.manage", "admin"],
  },
  {
    id: "menus",
    label: "Quản lý menu",
    href: "/admin/menus",
    icon: FolderTree,
    requiredPermissions: ["menus.view", "menus.manage", "admin"],
  },
  {
    id: "settings",
    label: "Cài đặt",
    href: "/admin/settings",
    icon: Settings,
    requiredPermissions: ["settings.view", "settings.manage", "admin"],
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
          } w-64 text-slate-100 shadow-2xl`}
        style={{
          background: "linear-gradient(73deg, #1D8FCF 32.85%, #2EABE2 82.8%)"
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800/60 backdrop-blur">
            <div className="w-10 h-10 flex items-center justify-center bg-white rounded-[20px]">
              <img
                src="/images/logo-2.png"
                alt="Thư viện TN Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="ml-3 text-xl text-slate-100 font-semibold">Thư viện TN Admin</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const hasSubmenu = item.children && item.children.length > 0;
              const isSubmenuOpen = openSubmenus.has(item.id);

              // Kiểm tra permission - ẩn item nếu không có quyền (sau khi đã mount)
              // Trên server hoặc chưa mount, hiển thị tất cả để tránh hydration mismatch
              const hasPermission = !mounted || userPermissions.size === 0
                ? true
                : !item.requiredPermissions ||
                item.requiredPermissions.length === 0 ||
                item.requiredPermissions.some((perm) => userPermissions.has(perm));

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
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all text-sm ${isActive
                        ? "bg-white/10 text-white shadow-lg shadow-blue-500/20 border border-white/10"
                        : "text-slate-200 hover:bg-white/5"
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
                          child.requiredPermissions.some((perm) => userPermissions.has(perm));

                        if (!childHasPermission) return null;

                        return (
                          <Link
                            key={child.id}
                            href={child.href || "#"}
                            className={`w-full flex items-center pl-10 pr-4 py-2.5 rounded-lg transition-all text-sm ${isChildActive
                              ? "bg-white/10 text-white font-medium border-l-2 border-cyan-400"
                              : "text-slate-200 hover:bg-white/5"
                              }`}
                          >
                            <ChildIcon className="w-4 h-4" />
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
                    ? "bg-white/10 text-white shadow-lg shadow-blue-500/20 border border-white/10"
                    : "text-slate-200 hover:bg-white/5"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="ml-3">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-white-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3">Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Header */}
        <header
          className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-0 z-30"
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
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
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
            <div className="p-6">{children}</div>
          </QueryClientProvider>
        </main>
      </div>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}


