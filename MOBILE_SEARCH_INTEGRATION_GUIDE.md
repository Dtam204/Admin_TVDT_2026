# TÀI LIỆU TÍCH HỢP HỆ THỐNG TÌM KIẾM (MOBILE APP)
*Cập nhật lần cuối: Tháng 4/2026*

Tài liệu này dành cho đội ngũ lập trình viên Mobile (Flutter/React Native) để tích hợp Hệ thống tìm kiếm Đa tầng của thư viện vào ứng dụng di động.

---

## 1. TỔNG QUAN KIẾN TRÚC TÌM KIẾM
Hệ thống cung cấp **4 API** xử lý riêng biệt cho 4 hành vi tra cứu của người dùng trên App. Toàn bộ các API cũ rườm rà dư thừa đã được gỡ bỏ khỏi hệ thống.

1. **AI Smart Search (`/ai-smart`)**: Xử lý thanh tìm kiếm tự do (Natural Language).
2. **Autocomplete (`/autocomplete`)**: Gợi ý siêu tốc khi người dùng đang gõ phím.
3. **Tra cứu tiêu chuẩn (`/publications`)**: Tìm sách truyền thống bằng bộ lọc (Filter).
4. **Quét Barcode/QR (`/barcode`)**: Tra nhanh bằng camera di động.

---

## 2. CHI TIẾT CÁC API

### 2.1. Tìm kiếm AI Thông minh (Omnibox)
Đây là API xịn nhất, đặt ở Thanh công cụ tìm kiếm trung tâm của App. Người dùng thả bất cứ câu từ gì vào, hệ thống cũng sẽ tự động rẽ nhánh.

- **Endpoint**: `POST /api/public/search/ai-smart`
- **Body**:
```json
{
  "query": "tìm sách lập trình xuất bản sau 2020",
  "pageIndex": 1,
  "pageSize": 10
}
```

**Cơ chế hoạt động ngầm (Backend xử lý):**
1. **Rẽ nhánh Sách / Tin tức**: Nếu người dùng gõ có chữ *"tin tức, sự kiện, mới nhất"*, API tự gọt bỏ từ gốc và chọc thẳng vào Database rinh về đúng danh sách Tin Tức mới nhất.
2. **Chọc lọc (Stop-Words)**: Backend tự động loại bỏ các từ vô nghĩa do AI/người dùng đẩy vào như *"tìm, sách, tôi, muốn, cho"* để lệnh SQL bám sát dữ liệu thực tế nhất.
3. **Miễn nhiễm sập (Immortal Fallback)**: Kể cả khi Google Gemini bị bảo trì hay sập mạng, bộ gọt từ khóa vẫn tự động chuyển thành Lệnh Tìm Kiếm Cơ Bản. Mobile App sẽ **KHÔNG BAO GIỜ** nhận lỗi 500.

**Response trả về (Cần chú ý trường `type`):**
```json
{
  "data": {
    "type": "books", // Hoặc "news" tuỳ vào câu hỏi! App dựa vào đây để vẽ giao diện (Draw UI)
    "items": [ ...danh sách object tuỳ type... ],
    "totalRecords": 2,
    "ai_interpreted": {
      "function": "searchBooks", // Để in debug cho vui
      "params": { "keywords": ["lập trình"] }
    }
  }
}
```

---

### 2.2. Gợi ý gõ phím nhanh (Autocomplete)
Khi user vừa chạm vào ô Search và gõ "Py...", gọi ngay API này thay vì gọi AI (để tiết kiệm tài nguyên và phản hồi tức thì dưới 50ms).

- **Endpoint**: `GET /api/public/search/autocomplete?q=python&limit=8`
- **Bản chất**: Hoàn toàn bằng SQL truyền thống (Không tốn tiền AI).
- **Response**: Trả về Array tinh gọn gồm `{ id, label, subtitle, thumbnail, type, year }`.

---

### 2.3. Tra Cứu Truyền Thống kèm Bộ Lọc
Sử dụng cho màn hình **Danh mục sách** nơi user muốn tự bấm chọn các nút lọc.

- **Endpoint**: `GET /api/public/search/publications`
- **Query Params hỗ trợ**:
  - `search`: Từ khóa chung.
  - `media_type`: `Physical` | `Digital`.
  - `year_from` / `year_to`: Lọc theo khoảng năm.
  - `sort_by` / `order`: Sắp xếp.

---

### 2.4. Quét mã QR / Barcode
Sử dụng khi user bấm vào nút [📷 Máy ảnh] trên App.

- **Endpoint**: `GET /api/public/search/barcode/:code`
- **Response**: Trả về trực tiếp JSON chi tiết của **duy nhất 1 cuốn sách** (Mô hình `Publication Detail`) để App đẩy thẳng sang màn hình Đọc Sách.

---

## 3. LƯU Ý KHI CODE GIAO DIỆN APP
> 1. Tại ô Input gõ chữ chung, lập trình viên hãy **cài bộ đếm giờ (Debounce 300ms)** để gọi hàm `/autocomplete`.
> 2. Khi user bấm nút [Kính lúp] hoặc [Enter] trên bàn phím điện thoại, hãy kết liễu hàm gõ phím và bắn cái chuỗi đó lên POST `/ai-smart`.
> 3. Tuyệt đối bắt khối `If/else` cho cái biến `data.type === "books" | "news"` để render component dạng thẻ sách đứng hình chữ nhật (Nhan đề, tác giả) hay Thẻ tin tức ngang (Ảnh thumbnail, mô tả).
