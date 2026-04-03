# 📘 Cẩm nang Quản trị Thư viện Toàn diện (Master Admin Handbook)

Chào mừng bạn đến với tài liệu hướng dẫn vận hành hệ thống **Library Admin Master Suite**. Tài liệu này được thiết kế để giúp bạn làm chủ mọi tính năng quản trị thư viện một cách chuyên nghiệp và hiệu quả nhất.

---

## 🏗️ 1. Quản lý Kho ấn phẩm (Publications)
Đây là nơi lưu trữ "linh hồn" của thư viện.

### 📚 Quản lý Đầu sách
- **Thêm mới**: Truy cập `Kho ấn phẩm > Danh sách sách`. Bạn có thể nhập tiêu đề đa ngôn ngữ (Việt/Anh), mô tả, và hình ảnh bìa.
- **Tình trạng hợp tác**: Lưu ý trường `Cooperation Status`. Nếu một cuốn sách hết hạn bản quyền, hãy chuyển sang `Ceased Cooperation` để hệ thống tự động ẩn khỏi App của độc giả.
- **Phân loại & Bộ sưu tập**: Gắn sách vào các `Collections` (Bộ sưu tập) để tăng tính gợi ý cho người dùng.

---

## 👥 2. Quản lý Bạn đọc & Hội viên (Readers)
Hệ thống quản lý vòng đời hội viên hoàn toàn tự động.

### 💳 Hạng thẻ & Quyền lợi
- **Gói VIP/PRO**: Mỗi hạng thẻ đi kèm với `Hạn mức mượn sách` và `Hạn mức gia hạn`.
- **Logic tự động**: Khi một hội viên hết hạn VIP, hệ thống sẽ **tự động** đưa về hạng **Basic** (mặc định mượn tối đa 3 cuốn). Bạn không cần phải làm gì cả!
- **Hồ sơ 360**: Xem chi tiết một Bạn đọc để thấy toàn bộ lịch sử: Mượn trả, Nạp tiền, và Nhật ký đăng nhập.

---

## 💰 3. Quản lý Tài chính & SePay (Finance)
Hệ thống thanh toán không tiền mặt, đối soát tự động 100%.

### 🏧 Thanh toán SePay
1. **Quy trình tự động**: Độc giả yêu cầu nâng cấp trên App > Chuyển khoản đúng nội dung `TVDT <Mã đơn>` > Hệ thống tự duyệt.
2. **Đối soát thủ công**: Nếu khách chuyển sai nội dung, bạn có thể vào `Tài chính > Yêu cầu Hội viên`, tìm mã đơn và nhấn **"Phê duyệt thủ công"** sau khi đã kiểm tra tài khoản ngân hàng.
3. **Ví Hội viên**: Admin có thể nạp tiền trực tiếp vào ví cho khách (ví dụ khách trả tiền mặt tại quầy).

---

## 📖 4. Quản lý Mượn/Trả sách
Quy trình thực thi kỷ luật thư viện chuyên nghiệp.

- **Tạo phiếu mượn**: Kiểm tra mã vạch (`Barcode`) của sách và `Mã thẻ` của khách.
- **Chặn mượn tự động**: Hệ thống sẽ chặn nếu:
    - Hội viên đã mượn quá hạn mức hạng thẻ.
    - Hội viên có sách đang quá hạn chưa trả.
    - Tài khoản hội viên bị khóa.
- **Xử lý Quá hạn**: Theo dõi thống kê `Overdue` tại Dashboard để liên hệ nhắc nhở khách hàng.

---

## ⚙️ 5. Quản trị hệ thống (System Admin)
Cấu hình và kiểm soát an ninh.

- **Quản lý Nhân sự**: Phân quyền cho Thủ thư, Kế toán, hoặc Admin Tổng.
- **Nhật ký hoạt động (Audit Logs)**: Mọi thao tác xóa sách, duyệt tiền, hay sửa thông tin đều được ghi lại với IP và thời gian cụ thể của người thực hiện.
- **SEO & Tin tức**: Cập nhật bài viết truyền thông và cấu hình Meta Tags để thư viện dễ dàng tìm thấy trên Google.

---

## 🆘 6. Xử lý sự cố thường gặp (FAQ)
- **Khách không đăng nhập được?**: Admin vào hồ sơ khách, dùng tính năng `Reset Password` để cấp mật khẩu mới.
- **Tiền không tự động cộng?**: Kiểm tra phần `SePay Webhook logs`. Đảm bảo số tiền khách chuyển khớp 100% với giá gói (Ví dụ: 199.000đ thay vì 199.100đ).
- **Hết hạn VIP vẫn mượn được sách?**: Đừng lo, hệ thống đã tự động giới hạn họ về mức **Basic** (chỉ 3 cuốn) thay vì chặn hoàn toàn để giữ chân người dùng.

---
> [!IMPORTANT]
> **Lời khuyên:** Hãy bắt đầu ngày làm việc bằng cách kiểm tra các chỉ số tại **Dashboard**. Các chỉ số màu đỏ (Pending/Overdue) là những việc cần ưu tiên xử lý ngay.
