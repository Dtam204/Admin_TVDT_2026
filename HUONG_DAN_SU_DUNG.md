# 📘 Hướng dẫn Sử dụng Admin Panel (Thư viện Số)

Chào mừng bạn đến với phiên bản Admin Panel đã được tối ưu hóa cho **Ứng dụng Thư viện Di động**. Tài liệu này giúp bạn nắm vững các tính năng mới và quy trình vận hành hệ thống ổn định.

## ⚠️ Giải quyết sự cố "Mất dữ liệu / Connection Refused"
Nếu bạn thấy giao diện Admin trống rỗng hoặc báo lỗi `ERR_CONNECTION_REFUSED`: (Tôi đã FIX lỗi này)
- **Nguyên nhân**: Do file cấu hình `.env` bị hỏng định dạng (mã hóa lạ) và một lỗi sai đường dẫn (Relative Path) khi import module `notification.service.js`.
- **Cách xử lý**: Tôi đã chuẩn hóa tệp `.env` về mã hóa UTF-8 và sửa lỗi đường dẫn trong code. Hiện tại server đã chạy ổn định trên cổng **5000**.

---

## 🚀 1. Quản lý Thông báo App (Push Notifications)
Hệ thống này cho phép bạn gửi thông báo trực tiếp tới tất cả người dùng hoặc từng đối tượng cụ thể trên Mobile App.

- **Truy cập**: Menu **Truyền thông & App** > **Thông báo**.
- **Tính năng**:
    - **Gửi thông báo**: Nhập Tiêu đề và Nội dung (Hỗ trợ đa ngôn ngữ).
    - **Đối tượng**: Chọn gửi cho tất cả (All) hoặc theo Hạng thẻ (Basic/VIP).
    - **Lịch sử**: Xem lại danh sách các thông báo đã gửi và thời gian gửi.

## 📊 2. Dashboard Thông minh (Real-time Analytics)
Dashboard không còn sử dụng dữ liệu mẫu mà truy vấn trực tiếp từ cơ sở dữ liệu.

- **KPIs chính**: Tổng số sách, Thành viên, Doanh thu thực tế, Lượt mượn.
- **Biểu đồ Xu hướng (7 ngày)**: Giúp bạn theo dõi lưu lượng mượn trả sách theo từng ngày để có kế hoạch bổ sung sách hợp lý.
- **Hoạt động gần đây**: Danh sách 5 phiếu mượn và 5 đánh giá mới nhất từ độc giả.

## ⚙️ 3. Cấu hình Chính sách Thư viện (Settings)
Thiết lập các "luật chơi" cho thư viện số của bạn.

- **Truy cập**: **Cài đặt** > Tab **Chính sách Thư viện**.
- **Sửa đổi**:
    - **Tiền phạt quá hạn**: Số tiền người dùng phải trả cho mỗi ngày trả muộn (VNĐ).
    - **Thời hạn mượn**: Số ngày tối đa được mượn sách.
    - **Giới hạn mượn**: Số lượng sách tối đa một độc giả được cầm cùng lúc.

## 📁 4. Hợp nhất Thể loại & Bộ sưu tập
Để tinh gọn nghiệp vụ, tôi đã hợp nhất hai khái niệm này thành một.
- **Quản lý**: Bạn chỉ cần vào mục **Thể loại & BST** để quản lý toàn bộ phân loại sách.
- **Ứng dụng**: Các phân loại này sẽ hiển thị trực tiếp trên trang chủ và mục tìm kiếm của Mobile App.

---

## 🛡️ Cam kết Ổn định & Chuyên nghiệp
Hệ thống đã được lập trình với:
- **Xử lý lỗi tập trung**: Mọi lỗi phát sinh sẽ được trả về dưới dạng thông báo dễ hiểu (JSON), không bao giờ làm treo ứng dụng hoặc hiện lỗi 500 thô sơ.
- **Tự phục hồi**: Backend được thiết lập để tự động khởi động lại nếu gặp sự cố nhỏ.

> [!IMPORTANT]
>**Dữ liệu của bạn luôn an toàn.** Mọi thay đổi đều được tính toán để bảo toàn 100% dữ liệu trong Database. 

---
*Chúc bạn vận hành thư viện hiệu quả!*
