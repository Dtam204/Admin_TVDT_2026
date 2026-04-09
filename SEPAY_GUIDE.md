# TÀI LIỆU TÍCH HỢP GIAO DIỆN APP (WALLET-FIRST ARCHITECTURE)

Tài liệu này cung cấp toàn bộ hướng dẫn kỹ thuật, luồng logic và định nghĩa API dành cho Mobile App (Frontend) để tích hợp thành công nghiệp vụ "Ví nội bộ & Thanh toán thời gian thực". Code Backend đã được lập trình hoàn hảo để phản hồi các lệnh dưới.

## 1. Triết lý hệ thống (Quy trình chuẩn Wallet-First)

1. **Một đồng tiền duy nhất**: Các giao dịch nâng cấp tài khoản, đóng phạt thư viện **đều trừ tiền trực tiếp vào Số dư Ví (Balance)**, ngay trên App, không gọi ra ngân hàng.
2. **Ngân hàng chỉ lo Nạp Tiền**: Phía App sẽ sinh mã QR cho người dùng chuyển khoản vô với cú pháp cố định là `NAP {ID}`. Ngân hàng xử lý ➡️ Chuyển SePay Webhook ➡️ Backend xử lý cộng tiền ➡️ Bắn Websocket về thiết bị.
3. **Mượt mà không cần F5**: Socket thông báo tiền về là App tự nảy tiền, cực kỳ chuyên nghiệp như ứng dụng Fintech. Mọi thay đổi thao tác của Admin (nạp tiền tay, hoàn tiền, báo nợ) từ bảng điều khiển CMS cũng gọi Socket về thiết bị người dùng ngay lập tức.

---

## 2. Cấu hình Socket.io (Dành cho App Client)

App cần cài thư viện `socket.io-client` để nhận biến động số dư mượt mà.

```javascript
import { io } from "socket.io-client";

// Mở Kết nối
const socket = io("http://địa_chỉ_server:5000"); // Ví dụ localhost

// Ngay khi độc giả (Member) đăng nhập thành công vào App
// Gọi lệnh gia nhập phòng riêng của chính Member đó
socket.emit("join_room", "member_14"); // "14" là ID của Member hiện tại

// Lắng nghe sự kiện Tiền về Ví!
socket.on("wallet_balance_updated", (data) => {
    console.log("Tiền vô rồi!", data);
    // Cấu trúc Data Frontend nhận được:
    // data.amount (Số tiền nạp vào / Biến động)
    // data.new_balance (Tổng số dư chốt cuối cùng trong Ví)
    // data.message ("Nạp tiền thành công!" / "Thư viện vừa hoàn tiền")
    
    // [CODE APP]: Rung máy, tung hoa, cập nhật State Số dư.
});
```

---

## 3. Hệ sinh thái API Giao Dịch
*Tất cả API dưới đây đều yêu cầu gắn Bearer Token của người dùng ở Header. Cấu trúc Data trả về 100% tuân thủ 7 trường chuẩn `(success, message, data, errors, etc)`.*

### A. Màn hình Tổng quan Ví
Hiển thị tổng số tiền và lịch sử dòng tiền. Được dùng để Render tab "Giao dịch".

**1. Lấy Số Dư Hiện Tại**
- **Endpoint:** `GET /api/reader/wallet/balance`
- **Output Success (200):**
```json
{
  "code": 200, "success": true, "message": "Lấy số dư thành công",
  "data": { "balance": 500000 }
}
```

**2. Lịch sử Ví điện tử**
- **Endpoint:** `GET /api/reader/transactions?page=1&limit=20`
- **Output Success (200):**
```json
{
  "code": 200, "success": true,
  "data": [
    {
      "id": 1, "amount": 20000, "type": "wallet_deposit", 
      "status": "completed", "description": "Nạp tiền qua SePay", 
      "created_at": "2026-04-08"
    }
  ],
  "pagination": { "current_page": 1, "total_pages": 1, "total_items": 1 }
}
```

### B. Tab Mua thẻ Hội Viên / Đóng Phạt
> Khi lập trình Mua thẻ hoặc Đóng phạt, Backend tự trừ trực tiếp ví. Nếu Response báo `400` báo số dư không đủ, mã code App chỉ cần tung cái Alert nhắc nhở và chuyển Modal sang màn Nạp Tiền.

**0. Lấy danh sách Hạng thẻ / Gói hội viên**
- **Endpoint:** `GET /api/reader/membership-plans`
- **Chức năng:** Trả về list các hạng thẻ hiện có (Tên, Giá tiền, Số ngày sử dụng). App dùng list này để vẽ Menu chọn gói.
- **Output Success (200):** Trả về mảng `data` chứa các Object `{ id, plan_name, price, duration_days, description }`.

**3. Đăng ký & Gia hạn gói Thẻ (`100% Nội bộ`)**
- **Endpoint:** `POST /api/reader/wallet/membership-upgrade`
- **Body Input:**
```json
{ "planId": 2 } 
```
- **Output Success (200):** System trừ ví liền tay và tự đưa thẻ lên Active.
- **Output Failure (400 - Thiếu Tiền):**
```json
{ "success": false, "message": "Số dư trong ví không đủ để đăng ký gói này. Vui lòng nạp thêm tiền." }
```

**4. Đóng Phạt Thư Viện (`100% Nội bộ`)**
- Bước 1: Gọi API Lấy List Phiếu Phạt chờ nạp: `GET /api/reader/wallet/fines`
- Bước 2: Thanh toán Phiếu bằng Ví: `POST /api/reader/wallet/fines/{fineId}/pay` (Truyền ID Phiếu trên URL, ví dụ `/fines/15/pay`)
- Kết quả: Tương tự Mua Gói, thiếu tiền báo nạp thêm `400`. Đủ tiền thì trả `200` và hóa đơn bị xóa sổ trên hệ thống.

### C. Luồng Nạp Tiền từ Ngân hàng (Webhook Flow)
Được hiển thị khi Số dư thiếu ở Tab B hoặc khi người dùng bấm Nạp thủ công.

**5. Lấy Cú Pháp Nạp Tiền**
- **Endpoint:** `POST /api/reader/wallet/deposit`
- **Body Input (User nhập trong App):**
```json
{ "amount": 100000 } // Số tiền tối thiểu 10k đ
```
- **Output Success (200):**
```json
{
  "code": 200, "success": true,
  "data": {
    "amount": 100000,
    "transfer_code": "NAP 14",  // Cực kỳ quan trọng
    "message": "Vui lòng chuyển khoản với nội dung: NAP 14"
  }
}
```
*Hướng dẫn cho Frontend làm tính năng tạo QR Bank tự động:* 
App lấy data từ trên -> Mở API `vietqr.io` -> Gắn thông tin: Số tài khoản Thư viện, Giá Tiền là `amount` (100000), Nội dung chuyển tiền là `transfer_code` (NAP 14). Đặt hình QR lên app là xong! Khách quét mã xong thì chờ chừng 3 giây, tiền nảy xuống thông qua Socket ở Bước 2. Nạp tiền vô cùng thần tốc!
