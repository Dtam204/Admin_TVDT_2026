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
import NextImage from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { removeAuthToken } from "@/lib/auth/token";
import { adminApiCall } from "@/lib/api/admin/client";
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
        requiredPermissions: ["notifications.view", "notifications.manage", "admin"],
      },
      {
        id: "internal-notifications",
        label: "Thông báo nội bộ",
        href: "/admin/internal-notifications",
        icon: Bell,
        requiredPermissions: ["dashboard.view", "admin"],
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
        requiredPermissions: ["books.view", "books.manage", "admin"],
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

type SystemAlert = {
  id: string;
  type: string;
  severity: "high" | "medium" | "info";
  title: string;
  message: string;
  href?: string;
  count?: number;
  created_at?: string;
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
  const [headerVisible, setHeaderVisible] = useState(true);
  const [headerElevated, setHeaderElevated] = useState(false);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [seenAlertIds, setSeenAlertIds] = useState<Set<string>>(new Set());
  const [bellMenuOpen, setBellMenuOpen] = useState(false);

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

  // Khôi phục trạng thái "đã xem" của notification center
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("admin_seen_alert_ids");
      if (!raw) return;
      const ids = JSON.parse(raw);
      if (Array.isArray(ids)) {
        setSeenAlertIds(new Set(ids.filter((id) => typeof id === "string")));
      }
    } catch {
      // ignore parse error
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    window.localStorage.setItem("admin_seen_alert_ids", JSON.stringify(Array.from(seenAlertIds)));
  }, [seenAlertIds, mounted]);

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

  useEffect(() => {
    if (!mounted) return;

    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;
      setHeaderElevated(currentY > 8);

      if (currentY <= 20) {
        setHeaderVisible(true);
        lastScrollY = currentY;
        return;
      }

      if (currentY > lastScrollY + 4) {
        setHeaderVisible(false);
      } else if (currentY < lastScrollY - 4) {
        setHeaderVisible(true);
      }

      lastScrollY = currentY;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    let active = true;
    const fetchAlerts = async () => {
      try {
        setAlertsLoading(true);
        const response = await adminApiCall<{ success: boolean; data?: { alerts?: SystemAlert[] } }>("/api/admin/dashboard/alerts");
        if (!active) return;
        const alerts = Array.isArray(response?.data?.alerts) ? response.data.alerts : [];
        setSystemAlerts(alerts);
      } catch {
        if (active) {
          setSystemAlerts([]);
        }
      } finally {
        if (active) {
          setAlertsLoading(false);
        }
      }
    };

    fetchAlerts();
    const timer = window.setInterval(fetchAlerts, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [mounted]);

  useEffect(() => {
    if (!bellMenuOpen || systemAlerts.length === 0) return;
    setSeenAlertIds((prev) => {
      const next = new Set(prev);
      for (const alert of systemAlerts) {
        next.add(alert.id);
      }
      return next;
    });
  }, [bellMenuOpen, systemAlerts]);

  const unreadAlertCount = systemAlerts.reduce((sum, alert) => {
    if (seenAlertIds.has(alert.id)) return sum;
    return sum + (Number(alert.count) || 1);
  }, 0);

  const formatTimeAgo = (value?: string) => {
    if (!value) return "";
    const createdAt = new Date(value).getTime();
    if (Number.isNaN(createdAt)) return "";
    const diff = Date.now() - createdAt;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))} phút trước`;
    if (diff < day) return `${Math.floor(diff / hour)} giờ trước`;
    return `${Math.floor(diff / day)} ngày trước`;
  };

  const getAlertTone = (severity: SystemAlert["severity"]) => {
    if (severity === "high") {
      return {
        badge: "bg-rose-50 text-rose-700 border-rose-200",
        dot: "bg-rose-500",
        label: "Khẩn cấp",
      };
    }
    if (severity === "medium") {
      return {
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
        label: "Cần xử lý",
      };
    }
    return {
      badge: "bg-sky-50 text-sky-700 border-sky-200",
      dot: "bg-sky-500",
      label: "Thông tin",
    };
  };

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

  const mainTopPadding = headerVisible ? 104 : 76;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } w-64 text-slate-100 shadow-2xl border-r border-white/10 overflow-hidden`}
        style={{
          background: "linear-gradient(180deg, #020617 0%, #0f172a 100%)"
        }}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Logo Section */}
          <div className="h-14 flex items-center px-6 border-b border-white/10 backdrop-blur-md">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/20 bg-white/95 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <NextImage
                src="/images/admin-logo.png"
                alt="Digital Library TN"
                width={36}
                height={36}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <div className="ml-3 flex flex-col">
              <span className="text-[12px] font-black text-white leading-tight tracking-tight uppercase">Digital Library</span>
              <span className="text-[8px] text-cyan-300 font-black opacity-90 uppercase tracking-[1.4px]">TN Admin Panel</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 min-h-0 overflow-y-auto scroll-smooth px-4 py-6 space-y-2 pr-2 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.45)_transparent]">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const hasSubmenu = item.children && item.children.length > 0;
              const isSubmenuOpen = openSubmenus.has(item.id);
              const isSectionStart = item.id === "system";

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
                  <div
                    key={item.id}
                    className={isSectionStart ? "mt-3 pt-3 border-t border-white/10" : ""}
                  >
                    <Collapsible
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
                          const isSystemFeaturedItem =
                            item.id === "system" &&
                            ["users", "permissions", "settings"].includes(child.id);

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
                              className={`w-full flex items-center rounded-xl transition-all text-[11px] font-bold ${isSystemFeaturedItem
                                ? isChildActive
                                  ? "pl-4 pr-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white border border-indigo-200/25 shadow-lg shadow-indigo-900/35"
                                  : "pl-4 pr-4 py-2.5 bg-white/[0.03] text-slate-200 border border-white/10 hover:bg-white/10 hover:border-indigo-300/25 hover:text-white"
                                : isChildActive
                                  ? "pl-10 pr-4 py-2 bg-white/10 text-white border-l-4 border-indigo-400"
                                  : "pl-10 pr-4 py-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                }`}
                            >
                              <span
                                className={`inline-flex items-center justify-center rounded-lg ${isSystemFeaturedItem
                                  ? isChildActive
                                    ? "w-6 h-6 bg-white/20"
                                    : "w-6 h-6 bg-white/5 border border-white/10"
                                  : ""
                                  }`}
                              >
                                <ChildIcon className="w-3.5 h-3.5" />
                              </span>
                              <span className="ml-3 tracking-wide">{child.label}</span>
                            </Link>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className={isSectionStart ? "mt-3 pt-3 border-t border-white/10" : ""}
                >
                  <Link
                    href={item.href || "#"}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-all text-sm ${isActive
                      ? "bg-indigo-600/20 text-white shadow-xl shadow-black/20 border border-white/10"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="ml-3">{item.label}</span>
                  </Link>
                </div>
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
          className={`h-14 bg-white/90 backdrop-blur-xl border-b border-slate-200 fixed top-0 right-0 left-0 z-30 transition-all duration-300 ${
            headerVisible ? "translate-y-0" : "-translate-y-full"
          } ${headerElevated ? "shadow-lg shadow-slate-900/10" : "shadow-none"}`}
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

              <div className="hidden lg:flex items-center gap-2.5 pr-1">
                <div className="w-8 h-8 rounded-lg border border-slate-200 overflow-hidden bg-white">
                  <NextImage
                    src="/images/admin-logo.png"
                    alt="Digital Library TN"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Digital Library TN</span>
              </div>

              <div className="relative w-96 hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm..."
                  className="pl-10 bg-gray-50 border-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <DropdownMenu open={bellMenuOpen} onOpenChange={setBellMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadAlertCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                        {unreadAlertCount > 99 ? "99+" : unreadAlertCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[390px] p-0 rounded-2xl border-slate-200 overflow-hidden shadow-2xl shadow-slate-900/15">
                  <div className="px-4 py-4 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-sky-50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Thông báo nội bộ</p>
                      <p className="text-xs text-slate-500">Các cảnh báo vận hành cần xử lý trên hệ thống quản trị</p>
                    </div>
                    {unreadAlertCount > 0 && (
                      <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full border border-rose-200">
                        {unreadAlertCount} mới
                      </span>
                    )}
                  </div>

                  <div className="max-h-[420px] overflow-y-auto p-2.5 space-y-2 bg-white">
                    {alertsLoading && (
                      <div className="px-3 py-8 text-center text-xs text-slate-500">Đang tải danh sách thông báo...</div>
                    )}

                    {!alertsLoading && systemAlerts.length === 0 && (
                      <div className="px-3 py-8 text-center text-sm text-slate-500">Không có cảnh báo cần xử lý.</div>
                    )}

                    {!alertsLoading &&
                      systemAlerts.map((alert) => {
                        const tone = getAlertTone(alert.severity);
                        return (
                          <button
                            key={alert.id}
                            type="button"
                            onClick={() => {
                              if (alert.href) {
                                setBellMenuOpen(false);
                                router.push(alert.href);
                              }
                            }}
                            className="w-full text-left px-3.5 py-3 rounded-xl bg-slate-50/70 hover:bg-white transition-all border border-slate-200 hover:border-slate-300 hover:shadow-md"
                          >
                            <div className="flex items-start gap-2">
                              <span className={`mt-1.5 w-2.5 h-2.5 rounded-full ${tone.dot} shadow-sm`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[13px] font-bold text-slate-900 truncate">{alert.title}</p>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${tone.badge}`}>
                                      {tone.label}
                                    </span>
                                    {Number(alert.count) > 0 && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-300 bg-white text-slate-700">
                                        {alert.count}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-[12px] text-slate-600 leading-relaxed mt-1 line-clamp-2">{alert.message}</p>
                                {alert.created_at && (
                                  <p className="text-[10px] text-slate-400 mt-1.5">{formatTimeAgo(alert.created_at)}</p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>

                  <div className="px-3 py-2.5 border-t border-slate-100 bg-slate-50">
                    <Button
                      variant="ghost"
                      className="w-full justify-center text-xs font-bold text-slate-700 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200"
                      onClick={() => {
                        setBellMenuOpen(false);
                        router.push('/admin/internal-notifications');
                      }}
                    >
                      Mở trang thông báo nội bộ
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

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
        <main className="min-h-screen transition-all duration-300" style={{ paddingTop: `${mainTopPadding}px` }}>
          <QueryClientProvider client={queryClient}>
            <div className="px-4 md:px-6 lg:px-8 pb-8">
              {children}
            </div>
          </QueryClientProvider>
        </main>
      </div>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}


