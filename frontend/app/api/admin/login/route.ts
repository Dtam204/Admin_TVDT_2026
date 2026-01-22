import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_THUVIEN_TN_URL ||
  "http://localhost:5000";

export async function POST(req: Request) {
  try {
    const requestUrl = req.url || "";
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Thiếu email hoặc mật khẩu" },
        { status: 400 },
      );
    }

    // Gửi thông tin lên API backend để xác thực JWT
    const loginUrl = `${API_BASE_URL}/api/auth/login`;
    
    let res: Response;
    try {
      res = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch (fetchError: any) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json(
        { 
          success: false, 
          message: `Không thể kết nối đến backend. Vui lòng kiểm tra backend đang chạy tại ${API_BASE_URL}` 
        },
        { status: 500 },
      );
    }

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const message =
        data?.message || data?.error || `Đăng nhập thất bại (${res.status}). Vui lòng thử lại.`;
      return NextResponse.json(
        { success: false, message },
        { status: res.status },
      );
    }

    const data = (await res.json()) as {
      token: string;
      user?: { 
        name?: string; 
        email?: string;
        permissions?: string[];
        [key: string]: any;
      };
      expiresIn?: number;
    };

    if (!data.token) {
      return NextResponse.json(
        { success: false, message: "Phản hồi đăng nhập không hợp lệ" },
        { status: 500 },
      );
    }

    const maxAge = data.expiresIn && Number.isFinite(data.expiresIn)
      ? data.expiresIn
      : 60 * 60 * 24 * 7; // 7 ngày

    // Trả về token trong response body để client lưu vào localStorage
    const response = NextResponse.json({ 
      success: true, 
      user: data.user,
      token: data.token, // Trả về token để client lưu vào localStorage
    });

    // Xác định secure flag: chỉ dùng secure khi có HTTPS
    // Trên server với IP address thường dùng HTTP, không nên set secure=true
    const isSecure = process.env.NODE_ENV === "production" && 
                     (requestUrl.startsWith("https://") || process.env.FORCE_SECURE_COOKIES === "true");

    // Lưu JWT vào cookie httpOnly (chỉ server / middleware đọc được)
    response.cookies.set("cms_thuvien_tn_token", data.token, {
      httpOnly: true,
      secure: isSecure, // Chỉ secure khi có HTTPS
      sameSite: "lax", // Cho phép cross-site requests nhưng bảo mật
      path: "/",
      maxAge,
      // Không set domain để cookie hoạt động với cả localhost và IP address
    });

    // Lưu thông tin user (không nhạy cảm) để client hiển thị UI
  if (data.user) {
    response.cookies.set("cms_thuvien_tn_user", JSON.stringify(data.user), {
      httpOnly: false,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge,
    });
  }

  return response;
  } catch (error: any) {
    console.error('Login route error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error?.message || "Lỗi hệ thống, vui lòng thử lại sau.",
        error: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 },
    );
  }
}


