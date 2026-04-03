# 📘 Hướng dẫn Vận hành Hệ thống Thanh toán & Hội viên (SePay)

Tài liệu này hướng dẫn bạn cách cấu hình và vận hành hệ thống thanh toán tự động đã được tích hợp chuyên nghiệp cho Thư viện của bạn.

---

## 1. Cấu hình ban đầu (Setup)

Để hệ thống bắt đầu nhận tiền và kích hoạt VIP tự động, bạn cần thực hiện 2 bước sau:

### Bước 1: Lấy API Key từ SePay
1. Đăng nhập vào [Dashboard SePay](https://my.sepay.vn/).
2. Vào mục **Webhooks** -> **Thêm Webhook mới**.
3. **Webhook URL**: Điền đường dẫn Server của bạn (Ví dụ: `https://api.yourdomain.com/api/webhooks/sepay`).
4. **Kiểu xác thực**: Chọn **API Key**.
5. Nhập một chuỗi ký tự bất kỳ làm API Key (Ví dụ: `ThuvienApp_Secret_2026`).
6. Copy chuỗi này và dán vào file `.env` ở Backend:
   ```env
   SEPAY_WEBHOOK_KEY=ThuvienApp_Secret_2026
   ```

### Bước 2: Cài đặt Biến động số dư
Tải App SePay hoặc cài đặt để SePay nhận được thông báo biến động số dư từ Ngân hàng của bạn. Khi có tiền vào, SePay sẽ bắn tin về hệ thống Thư viện.

---

## 2. Quy trình Hoạt động (Workflow)

Hệ thống hoạt động theo luồng khép kín và an toàn:

### Luồng Tự động (Khuyên dùng)
1. **Độc giả:** Chọn gói hội viên trên App và bấm **Gia hạn**.
2. **Hệ thống:** Tạo một đơn hàng "Chờ thanh toán" với mã số duy nhất (Ví dụ: Đơn số **123**).
3. **Thanh toán:** Độc giả quét mã QR hoặc chuyển khoản thủ công.
   > [!IMPORTANT]
   > Nội dung chuyển khoản phải ghi đúng: **`TVDT 123`** (Trong đó 123 là ID đơn hàng).
4. **Xử lý:** SePay nhận tin ngân hàng -> Gửi về Server Thư viện. 
   - Hệ thống bóc tách lấy số `123`.
   - Kiểm tra số tiền khớp 100%.
   - Tự động cộng ngày hết hạn và nâng hạng VIP.

### Luồng Thủ công (Đối soát)
Nếu khách quên ghi nội dung hoặc chuyển sai tiền, Admin có thể xử lý tại:
- **Trang Quản trị:** `Quản lý Hội viên` -> `Duyệt đơn Gia hạn`.
- Tại đây sẽ hiển thị danh sách các đơn đang chờ. Admin có thể bấm **Duyệt** bằng tay sau khi kiểm tra tài khoản ngân hàng.

---

## 3. Các quy tắc "Tuân thủ Giá gói"

Dựa trên yêu cầu của bạn, hệ thống đã được thiết thiết lập các quy tắc cứng:
- **Giá chốt đơn:** Khi khách bấm đặt đơn, hệ thống lưu lại giá tại thời điểm đó. Nếu sau đó bạn tăng giá gói, khách cũ vẫn được hưởng giá cũ đã chốt.
- **Đối soát chặt chẽ:** Nếu đơn hàng là 50.000đ nhưng khách chỉ chuyển 49.999đ, hệ thống sẽ **không kích hoạt tự động** mà báo đỏ để Admin kiểm tra.

---

## 4. Hướng dẫn Tra soát (Audit)

Để kiểm tra lịch sử, bạn có thể xem tại:
1. **Mã giao dịch (TXN):** Được hiển thị ngay trên danh sách đơn đã duyệt (Lấy từ mã giao dịch thật của Ngân hàng).
2. **Nhật ký hoạt động:** Mỗi lần kích hoạt thành công (dù là tự động hay tay), hệ thống đều ghi lại log: "Kích hoạt tự động qua SePay ngân hàng VCB...".

---

## 5. Giải đáp thắc mắc (FAQ)

**Q: Tại sao khách chuyển tiền rồi mà chưa lên VIP?**
- **A:** Kiểm tra xem khách có ghi đúng nội dung `TVDT <Mã-đơn>` không? Nếu sai nội dung, hệ thống không biết đơn của ai để kích hoạt. Admin hãy vào duyệt tay.

**Q: Tôi có thể thay đổi tiền tố "TVDT" không?**
- **A:** Bạn có thể yêu cầu tôi đổi trong code. Hiện tại `TVDT` (Thư Viện Đào Tạo) là mặc định.

---
> [!TIP]
> Bạn nên in mã QR có sẵn nội dung chuyển khoản trên App để độc giả chỉ việc quét, tránh sai sót khi nhập tay nội dung.
