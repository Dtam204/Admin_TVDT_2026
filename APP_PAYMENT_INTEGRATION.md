# Hướng dẫn Tích hợp Thanh toán & Hội viên (Dành cho Mobile App)

Tài liệu này hướng dẫn cách gọi API từ ứng dụng App (React Native/Flutter/...) để thực hiện luồng thanh toán giả lập và tự động kích hoạt gói hội viên.

## 1. Danh sách Gói Hội viên
Trước khi cho người dùng chọn gói, hãy lấy danh sách các gói hiện có.

- **Endpoint**: `GET /api/membership-plans` (Public) hoặc `GET /api/admin/membership-plans` (Admin)
- **Cấu trúc dữ liệu chính**:
  ```json
  {
    "id": 1,
    "name": { "vi": "Gói VIP 1 Tháng", "en": "VIP 1 Month" },
    "price": 50000,
    "duration_days": 30,
    "slug": "vip_1m"
  }
  ```

---

## 2. Luồng Nghiệp vụ (Giao diện App)

### Bước 1: Gửi yêu cầu Đăng ký/Gia hạn
Khi người dùng ấn "Đăng ký" trong app, hãy gọi API này để tạo một "Yêu cầu" (Request) trong hệ thống.

- **Endpoint**: `POST /api/reader/renew-request`
- **Body**:
  ```json
  {
    "member_id": 123,
    "plan_id": 1,
    "request_note": "Đăng ký qua App"
  }
  ```
- **Response**: Trả về `id` của yêu cầu vừa tạo (ví dụ: `456`).

---

### Bước 2: Hiển thị Mã QR Thanh toán (Giả lập)
Sau khi có `id` yêu cầu, bạn có thể tạo mã QR VietQR để người dùng quét (mặc dù là giả lập nhưng QR vẫn thật).

- **Thư viện QR**: Sử dụng `img.vietqr.io`
- **URL Mẫu**: `https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-compact.jpg?amount=<PRICE>&addInfo=PAYMENT <REQUEST_ID>`
- **Ví dụ**: `https://img.vietqr.io/image/970422-123456789-compact.jpg?amount=50000&addInfo=PAYMENT 456`

---

### Bước 3: Xác nhận Thanh toán (Nút "Tôi đã chuyển khoản")
Vì hệ thống chưa tích hợp ngân hàng thật, bạn cần một nút bấm trên App để báo cho Server biết người dùng đã chuyển tiền (Giả lập).

- **Endpoint**: `POST /api/admin/membership-requests/{id}/simulate-success`
- **Ghi chú**: Trong thực tế, API này sẽ được gọi bởi Webhook của Ngân hàng. Trong Demo, App sẽ tự gọi sau khi người dùng xác nhận.
- **Tác vụ**: Server sẽ tự động tính toán ngày hết hạn mới, cập nhật hạng hội viên và ghi log thanh toán.

---

## 3. Quy tắc Tính toán Ngày hết hạn (Business Logic)
Hệ thống sử dụng logic thông minh để đảm bảo quyền lợi độc giả:

1.  **Nếu Hội viên chưa hết hạn**: Hệ thống sẽ lấy `Ngày hết hạn cũ + Duration của Gói`.
2.  **Nếu Hội viên đã hết hạn**: Hệ thống sẽ lấy `Ngày hôm nay + Duration của Gói`.
3.  **Tự động hạ cấp**: Khi Độc giả đăng nhập, nếu `membership_expires < NOW`, hệ thống tự động trả về role `basic` (đã có sẵn trong `auth.service.js`).

## 4. Test trên Swagger
Bạn có thể mở giao diện Swagger của Backend (mặc định tại `/api-docs`) để test các endpoint:
- Nhóm: `Admin Membership Requests`
- Endpoint: `[POST] /simulate-success/{id}`
