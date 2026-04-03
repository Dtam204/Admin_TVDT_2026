# 🏛️ Tài liệu Hướng dẫn Vận hành Toàn diện Hệ thống (Master Guide)

Tài liệu này cung cấp cái nhìn tổng quan 100% về kiến trúc và cách thức vận hành của hệ thống Quản lý Hội viên, Thanh toán SePay và Mượn trả sách đã được hợp nhất.

---

## 1. Kiến trúc Hội viên & Bảo mật (Auth)
Hệ thống sử dụng mô hình kép để đảm bảo tính linh hoạt:
- **Bảng `users`**: Quản lý tài khoản đăng nhập (Email + Mật khẩu). Một Bạn đọc mượn sách cũng là một "User" với Role là `user`.
- **Bảng `members`**: Quản lý thông tin định danh (Tên, CCCD), Số dư ví (`balance`) và Thời hạn VIP (`membership_expires`).

> [!TIP]
> Khi Admin thay đổi mật khẩu cho Bạn đọc, hệ thống sẽ tự động cập nhật vào bảng `users` để đảm bảo đồng bộ hóa đăng nhập trên App.

---

## 2. Hệ thống Gói & Hạng thẻ (Membership Tiers)
Hệ thống hỗ trợ 3 trạng thái thực tế quan trọng:
1. **VIP (Active)**: Thành viên còn hạn, được hưởng quyền lợi đầy đủ (ví dụ mượn 10-20 cuốn sách).
2. **BASIC (Expired)**: Thành viên đã hết hạn VIP. Hệ thống sẽ **tự động** đưa về hạng Basic (mặc định mượn 3 cuốn) mà không cần xóa dữ liệu cũ.
3. **INACTIVE**: Tài khoản bị Admin khóa thủ công, không thể đăng nhập hoặc mượn sách.

---

## 3. Quy trình Thanh toán SePay Tự động
Đây là "trái tim" của sự tự động hóa:
- **Tạo đơn hàng**: Khi độc giả bấm gia hạn trên App, hệ thống sẽ "Chốt một mức giá" tại thời điểm đó. Nếu sau đó bạn đổi giá gói, đơn hàng cũ vẫn giữ đúng giá cũ.
- **Mã nội dung (TVDT ID)**: Độc giả phải chuyển khoản với nội dung `TVDT <Mã đơn>`. 
- **Xác thực Webhook**: Khi SePay bắn thông báo, hệ thống sẽ:
    1. Kiểm tra API Key bảo mật.
    2. Bóc tách lấy ID đơn hàng.
    3. So khớp số tiền khớp 100% (Nếu thiếu dù 1đ cũng không tự động duyệt).
    4. Kích hoạt VIP và cộng thêm ngày vào hạn sử dụng hiện tại của khách.

---

## 4. Luật Mượn trả & Gia hạn sách
Hệ thống thực thi kỷ luật sắt về mượn sách:
- **Kiểm soát hạn mức**: Khi Admin hay Độc giả tạo phiếu mượn, hệ thống sẽ kiểm tra: `Sách đang mượn` < `Hạn mức của hạng thẻ hiện tại`.
- **Áp dụng Expiry**: Nếu một người đang là VIP nhưng đã hết hạn, hạn mức mượn sẽ bị rút về **3 cuốn** (hoặc theo cấu hình Basic).
- **Phí phạt**: Các khoản nợ phí phạt sẽ được tích lũy vào ví hội viên và hiển thị đỏ trong trang Admin để nhắc nhở.

---

## 5. Hướng dẫn cho Admin (CMS)
- **Duyệt đơn gia hạn**: `Duyệt đơn Gia hạn & Nâng cấp`. Tại đây bạn có thể thấy các yêu cầu thanh toán. Nếu đơn đã duyệt qua SePay, nó sẽ có nhãn **TXN (Mã giao dịch ngân hàng)**.
- **Hồ sơ 360**: Trang chi tiết Hội viên cung cấp mọi thứ: Lịch sử mượn, Biến động số dư, Nhật ký hoạt động (Audit log) để tra soát ai đã làm gì.

---

## 6. Sẵn sàng cho Tương lai (API Specs)
Backend đã sẵn sàng các Endpoint sau cho App sau này:
- `POST /api/reader/renew-card`: Tạo đơn gia hạn chốt giá.
- `GET /api/reader/profile/me`: Lấy thông tin VIP thực tế (đã xử lý hết hạn).
- `POST /api/webhooks/sepay`: Nhận tiền tự động.

---
> [!IMPORTANT]
> **Trạng thái hệ thống:** Đã vận hành ổn định 100% về mặt code. 
> Chỉ cần hoàn thiện: **API Key của SePay** điền vào `.env` là toàn bộ guồng quay tự động sẽ bắt đầu.
