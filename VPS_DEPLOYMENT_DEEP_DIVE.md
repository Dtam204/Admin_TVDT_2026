# 🚀 Cẩm nang Triển khai Hệ thống & Kết nối SePay (Deep Dive)

Tài liệu này giúp bạn hiểu tường tận về hạ tầng "Thư viện Thông minh" đang chạy trên VPS, từ cách mạng internet tìm thấy server của bạn đến cách tiền tự động cộng vào tài khoản khách hàng.

---

## 🏗️ PHẦN 1: VPS & DOCKER - NỀN TẢNG HỆ THỐNG

### 1. VPS là gì?
VPS (Virtual Private Server) là một lát cắt ảo từ một máy chủ vật lý cực mạnh. Bạn có toàn quyền **Root** (quyền cao nhất) để cài đặt bất cứ thứ gì.
*   **Ubuntu 22.04 LTS:** Là hệ điều hành Linux phổ biến nhất cho server, "LTS" nghĩa là được hỗ trợ bảo mật lâu dài (5-10 năm).

### 2. Tại sao lại dùng Docker?
Hãy tưởng tượng mã nguồn của bạn là một loại thực phẩm nhạy cảm.
*   Nếu bạn để trần, nó có thể bị hỏng nếu môi trường (VPS) thiếu thư viện.
*   **Docker** là những chiếc "Công-ten-nơ" (Container) kín. Nó chứa sẵn Node.js, thư viện, biến môi trường... Bạn chỉ cần bê container này từ máy Local đặt lên VPS là nó chạy y hệt, không cần cài đặt rườm rà.

---

## 🌐 PHẦN 2: DOMAIN (TÊN MIỀN) & KẾT NỐI MẠNG

Khi bạn gõ `thuvien.com` trên trình duyệt:
1.  **DNS (Hệ thống phân giải tên miền):** Sẽ hỏi: "Ai cầm tên miền này?".
2.  **A-Record:** Bạn cần cấu hình một bản ghi **A** trỏ về IP `160.187.247.41`. Đây là "biển chỉ đường" để khách hàng tìm thấy VPS của bạn.
3.  **Nginx (Reverse Proxy):** Là người "đứng ở cửa" server. 
    *   Nếu yêu cầu từ domain, nó gửi vào **Frontend (Cổng 3000)**.
    *   Nếu yêu cầu từ `/api`, nó gửi vào **Backend (Cổng 5000)**.
4.  **SSL (HTTPS):** Là "vòng bảo vệ". SePay bắt buộc bạn phải có HTTPS để đảm bảo dữ liệu thanh toán không bị hacker đánh cắp trên đường truyền.

---

## 💳 PHẦN 3: KẾT NỐI SEPAY (AUTOPAY FLOW)

Đây là quy trình "ma thuật" giúp bạn không cần thức đêm duyệt đơn:

1.  **Request:** Hội viên nhấn "Nâng cấp" trên App > Backend tạo một đơn hàng mã số `TVDT 123` (Note: mã này duy nhất).
2.  **Payment:** Hội viên quét mã QR và chuyển khoản 199.000đ với nội dung `TVDT 123`.
3.  **Bank -> SePay:** Ngân hàng nhận tiền và báo cho SePay (mất 2-5 giây).
4.  **SePay -> VPS (Webhook):** SePay gửi một gói tin (POST Request) đến URL: `https://domain.com/api/webhooks/sepay`. Gói tin này chứa: số tiền, mã đơn `TVDT 123`.
5.  **VPS Logic:**
    *   Kiểm tra `API Key` để xác thực đây đúng là SePay gửi.
    *   Tìm trong Database xem đơn `123` có đúng là giá 199.000đ không.
    *   Nếu khớp: Kích hoạt VIP + Cộng ngày hết hạn + Báo cho Admin.

---

## 🛠️ PHẦN 4: THỰC HÀNH CẤU HÌNH (SÁNG MAI)

Khi có Domain và SePay Key, bạn sẽ làm 3 việc cụ thể:

### 1. Trỏ tên miền
Vào trang quản trị Domain (Pavietnam, Matbao...), tạo bản ghi:
*   **Type**: `A`
*   **Host**: `@` (hoặc tên miền chính)
*   **Value**: `160.187.247.41`

### 2. Cấu hình file `.env` trên VPS
```bash
# Sửa file cấu hình trên VPS
DB_PASSWORD=Mật mã cực mạnh
SEPAY_WEBHOOK_KEY=Mã từ SePay Dashboard
NEXT_PUBLIC_API_URL=https://domain-cua-ban.com
```

### 3. Kích hoạt SSL (HTTPS)
Dùng lệnh này trên VPS để lấy chứng chỉ miễn phí:
```bash
sudo certbot --nginx -d domain-cua-ban.com
```

---
> [!IMPORTANT]
> **Hiểu sâu:** VPS không đáng sợ, nó chỉ là một máy tính không có màn hình. Docker giúp bạn không phải lo lắng về việc cài đặt môi trường. SePay giúp bạn rảnh tay. Kết hợp 3 thứ này lại, bạn có một hệ thống thư viện chuẩn "Công nghệ 4.0".

**Chúc bạn học được nhiều điều từ tài liệu này! Hẹn gặp lại vào sáng mai!**
