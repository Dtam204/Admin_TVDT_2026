"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { setAuthToken } from "@/lib/auth/token";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Đảm bảo gửi và nhận cookies
      });

      const data = (await res.json().catch(() => null)) as
        | { success?: boolean; message?: string; token?: string }
        | null;

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Đăng nhập thất bại");
      }

      // Lưu JWT token vào localStorage để sử dụng cho API calls
      if (data.token) {
        setAuthToken(data.token);
      }

      // Cookie JWT & user đã được set httpOnly ở API route
      // Kiểm tra cookie đã được set chưa (kiểm tra cms_sfb_user vì không httpOnly)
      let cookieSet = false;
      let attempts = 0;
      const maxAttempts = 20; // Tối đa 2 giây
      
      while (!cookieSet && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        cookieSet = document.cookie.includes("cms_thuvien_tn_user=");
        attempts++;
      }
      
      // Dùng window.location để force full page reload (đảm bảo cookie được gửi)
      // Không cần đợi thêm vì đã kiểm tra cookie ở trên
      window.location.href = "/admin";
    } catch (err: any) {
      setError(err?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-[#E6F4FF] to-[#D6EEFF] overflow-hidden">
      {/* Background pattern + blobs giống public */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="absolute -top-24 -left-10 h-64 w-64 rounded-full bg-[#006FB3]/18 blur-3xl animate-blob" />
        <div className="absolute -bottom-24 -right-10 h-64 w-64 rounded-full bg-[#0088D9]/18 blur-3xl animate-blob animation-delay-2000" />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-4 sm:px-0">
        <div className="grid gap-10 md:grid-cols-[1.2fr,1fr] items-center">
          {/* Left content */}
          <div className="hidden md:block">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full border border-[#006FB3]/30 shadow">
              <span className="w-2 h-2 rounded-full bg-[#006FB3] animate-pulse" />
              <span className="text-[11px] font-semibold text-[#006FB3] tracking-wide uppercase">
                Khu vực quản trị Thư viện TN
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-900 leading-snug">
              Đăng nhập{" "}
              <span className="bg-gradient-to-r from-[#006FB3] to-[#0088D9] bg-clip-text text-transparent">
                Admin Thư viện TN
              </span>
            </h1>
            <p className="mt-3 text-sm text-slate-600 max-w-md">
              Quản lý nội dung website, số liệu dashboard và các cấu hình hệ
              thống từ một giao diện trực quan, hiện đại.
            </p>
          </div>

          {/* Form card */}
          <div className="w-full max-w-md ml-auto rounded-2xl border border-slate-200 bg-white/95 shadow-2xl shadow-slate-200/90 p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#006FB3] to-[#0088D9] shadow-lg">
                <span className="text-sm font-bold tracking-wide text-white">
                  TVTN
                </span>
              </div>
              <div className="leading-tight">
                <h2 className="text-base font-semibold text-slate-900">
                  Đăng nhập Admin
                </h2>
                <p className="text-[11px] text-slate-500">
                  Nhập thông tin để truy cập khu vực quản trị
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#006FB3] focus:ring-1 focus:ring-[#006FB3]/40"
                  placeholder="Nhập Email đăng nhập"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#006FB3] focus:ring-1 focus:ring-[#006FB3]/40"
                  placeholder="Nhập mật khẩu"
                  required
                />
              </div>

              {error && (
                <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-[#006FB3] to-[#0088D9] text-white text-sm font-semibold py-2.5 hover:shadow-lg hover:shadow-[#006FB3]/40 transition-all disabled:opacity-60"
              >
                {loading ? "Đang xử lý..." : "Đăng nhập"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}


