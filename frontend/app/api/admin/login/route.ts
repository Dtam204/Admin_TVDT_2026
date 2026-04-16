import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_THUVIEN_TN_URL ||
  process.env.API_THUVIEN_TN_URL ||
  "https://api.thuvientn.site";

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

    const jsonResponse = await res.json();
    
    // Backend chuẩn trả về dữ liệu lồng trong trường 'data'
    const data = jsonResponse.data || jsonResponse;

    if (!data || !data.token) {
      console.error('Invalid login response structure:', jsonResponse);
      return NextResponse.json(
        { success: false, message: "Phản hồi đăng nhập không hợp lệ từ hệ thống" },
        { status: 500 },
      );
    }

    // Xử lý maxAge từ expiresIn (nếu là chuỗi như '7d' hoặc số giây)
    let maxAge = 60 * 60 * 24 * 7; // Mặc định 7 ngày
    if (data.expiresIn) {
      if (typeof data.expiresIn === 'number') {
        maxAge = data.expiresIn;
      } else if (typeof data.expiresIn === 'string') {
        // Chuyển đổi đơn giản: '7d' -> 7 ngày, '24h' -> 24 giờ
        if (data.expiresIn.endsWith('d')) {
          maxAge = parseInt(data.expiresIn) * 24 * 60 * 60;
        } else if (data.expiresIn.endsWith('h')) {
          maxAge = parseInt(data.expiresIn) * 60 * 60;
        }
      }
    }

    // Trả về token trong response body để client lưu vào localStorage
    const response = NextResponse.json({ 
      success: true, 
      user: data.user,
      token: data.token,
    });

    // Xác định secure flag
    const isSecure = process.env.NODE_ENV === "production" && 
                     (requestUrl.startsWith("https://") || process.env.FORCE_SECURE_COOKIES === "true");

    // Lưu JWT vào cookie httpOnly
    response.cookies.set("cms_thuvien_tn_token", data.token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    // Lưu thông tin user để hiển thị UI
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


