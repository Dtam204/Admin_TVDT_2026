const express = require('express');
const router = express.Router();
const publicHomeController = require('../controllers/public_home.controller');

/**
 * @openapi
 * /api/public/home/get-suggest-books:
 *   get:
 *     tags: [Public Home]
 *     summary: "Danh sách ấn phẩm đề xuất cho người dùng"
 *     description: |
 *       Lấy ngẫu nhiên các ấn phẩm đang hoạt động để đề xuất cho người đọc trên Trang chủ.
 *       Ưu tiên sách có màu bìa (dominant_color) để hiển thị đẹp hơn trên UI.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: "Danh sách ấn phẩm đề xuất"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer, example: 1 }
 *                           title: { type: string, example: "Lập trình Node.js" }
 *                           thumbnail: { type: string, example: "https://..." }
 *                           author: { type: string, example: "Nguyễn Văn A" }
 *                           publication_year: { type: integer, example: 2023 }
 *                           dominant_color: { type: string, example: "#4f46e5" }
 *                           is_digital: { type: boolean, example: false }
 *       500:
 *         description: "Lỗi hệ thống"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/get-suggest-books', publicHomeController.getSuggestBooks);

/**
 * @openapi
 * /api/public/home/get-updated-books:
 *   get:
 *     tags: [Public Home]
 *     summary: "Danh sách ấn phẩm mới cập nhật"
 *     description: |
 *       Lấy danh sách ấn phẩm được cập nhật gần nhất (ORDER BY created_at DESC).
 *       Dùng để hiển thị section "Mới cập nhật" trên Trang chủ Mobile.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: "Danh sách ấn phẩm mới cập nhật"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           title: { type: string }
 *                           thumbnail: { type: string }
 *                           author: { type: string }
 *                           publication_year: { type: integer }
 *                           dominant_color: { type: string }
 *                           is_digital: { type: boolean }
 *                           created_at: { type: string, format: date-time }
 */
router.get('/get-updated-books', publicHomeController.getUpdatedBooks);

/**
 * @openapi
 * /api/public/home/get-most-viewed-books-of-the-week:
 *   get:
 *     tags: [Public Home]
 *     summary: "Ấn phẩm được xem nhiều nhất trong tuần"
 *     description: |
 *       Truy vấn ấn phẩm có lượt xem (views) cao nhất. 
 *       Dùng cho section "Trending tuần này" trên Trang chủ Mobile.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: "Danh sách xem nhiều nhất"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           title: { type: string }
 *                           thumbnail: { type: string }
 *                           author: { type: string }
 *                           views: { type: integer, example: 150, description: "Lượt xem" }
 *                           dominant_color: { type: string }
 *                           is_digital: { type: boolean }
 */
router.get('/get-most-viewed-books-of-the-week', publicHomeController.getMostViewedBooksOfTheWeek);

/**
 * @openapi
 * /api/public/home/get-most-borrowed-documents:
 *   get:
 *     tags: [Public Home]
 *     summary: "Ấn phẩm IN được mượn nhiều nhất"
 *     description: |
 *       Chỉ trả về sách in (is_digital=false), sắp xếp theo số lượt mượn giảm dần.
 *       Dùng cho section "Mượn nhiều nhất" trên Trang chủ Mobile.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: "Danh sách mượn nhiều nhất"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           title: { type: string }
 *                           thumbnail: { type: string }
 *                           author: { type: string }
 *                           borrow_count: { type: integer, example: 48, description: "Số lượt mượn" }
 *                           is_digital: { type: boolean, example: false }
 */
router.get('/get-most-borrowed-documents', publicHomeController.getMostBorrowedDocuments);

/**
 * @openapi
 * /api/public/home/get-top-favorite:
 *   get:
 *     tags: [Public Home]
 *     summary: "Danh sách ấn phẩm nổi bật / Yêu thích"
 *     description: |
 *       Ưu tiên sách số (is_digital=true) và sách mới nhất.
 *       Dùng cho section "Nổi bật" hoặc "Yêu thích" trên Trang chủ Mobile.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: "Danh sách yêu thích"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           title: { type: string }
 *                           thumbnail: { type: string }
 *                           author: { type: string }
 *                           is_digital: { type: boolean }
 *                           dominant_color: { type: string }
 */
router.get('/get-top-favorite', publicHomeController.getTopFavorite);

/**
 * @openapi
 * /api/public/home/get-top-recommend:
 *   get:
 *     tags: [Public Home]
 *     summary: "Danh sách ấn phẩm đề cử (Banner đầu trang)"
 *     description: |
 *       Chỉ trả về sách có màu bìa (dominant_color IS NOT NULL), tối đa 5 items.
 *       Dùng cho **Slider / Carousel Banner** trên Trang chủ Mobile App.
 *     security: []
 *     responses:
 *       200:
 *         description: "Danh sách đề cử (Banner)"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       maxItems: 5
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           title: { type: string }
 *                           thumbnail: { type: string }
 *                           description: { type: string, description: "Mô tả ngắn cho Banner" }
 *                           dominant_color: { type: string, example: "#4f46e5" }
 *                           is_digital: { type: boolean }
 */
router.get('/get-top-recommend', publicHomeController.getTopRecommend);

/**
 * @openapi
 * /api/public/home/membership-plans:
 *   get:
 *     tags: [Public Home]
 *     summary: "Khối Gói Hội Viên (Trang Chủ Mobile)"
 *     description: |
 *       Trả về danh sách các Gói Hội Viên đang mở bán, **có phân trang**.
 *       Dùng để vẽ các thẻ (Card) nằm ngang trên Trang Chủ App.
 *
 *       Mỗi thẻ hiển thị: **Tên gói, Giá, Thời hạn** cùng 2 nút:
 *       - `[Nâng ngay]` → Chuyển sang luồng Thanh toán (truyền `id` + `price`)
 *       - `[Xem chi tiết]` → Gọi `GET /api/public/home/membership-plans/:id`
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: "Trang hiện tại"
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: "Số gói mỗi trang"
 *     responses:
 *       200:
 *         description: "Danh sách gói hội viên"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer, example: 1 }
 *                           name: { type: string, example: "Gói Premium" }
 *                           tier_code: { type: string, example: "premium", description: "Mã hạng — App dùng gán icon/màu" }
 *                           slug: { type: string, example: "premium-1month" }
 *                           price: { type: number, example: 50000 }
 *                           duration_days: { type: integer, example: 30, description: "Thời hạn (ngày)" }
 *                           description: { type: string }
 *                     pagination: { $ref: '#/components/schemas/Pagination' }
 */
router.get('/membership-plans', publicHomeController.getMembershipPlans);

/**
 * @openapi
 * /api/public/home/membership-plans/{id}:
 *   get:
 *     tags: [Public Home]
 *     summary: "Chi tiết Đặc Quyền gói hội viên"
 *     description: |
 *       Trả về **toàn bộ thông tin chi tiết và đặc quyền** của 1 gói hội viên.
 *       Phục vụ luồng khi người dùng bấm nút `[Xem chi tiết]`.
 *
 *       Bao gồm:
 *       - Mô tả gói, Danh sách đặc quyền (`features[]`)
 *       - Giới hạn mượn sách, gia hạn, đọc số, tải PDF
 *       - Chiết khấu, hỗ trợ ưu tiên
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: "Mã gói hội viên (lấy từ API danh sách)"
 *     responses:
 *       200:
 *         description: "Chi tiết gói hội viên"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         name: { type: string }
 *                         tier_code: { type: string }
 *                         description: { type: string }
 *                         price: { type: number }
 *                         duration_days: { type: integer }
 *                         features: { type: array, items: { type: string }, description: "Danh sách đặc quyền" }
 *                         max_books_borrowed: { type: integer, description: "Mượn sách tối đa" }
 *                         max_renewal_limit: { type: integer, description: "Số lần gia hạn tối đa" }
 *                         allow_digital_read: { type: boolean, description: "Đọc sách số online" }
 *                         allow_download: { type: boolean, description: "Tải PDF offline" }
 *                         discount_percentage: { type: number }
 *                         priority_support: { type: boolean }
 *                         late_fee_per_day: { type: number }
 *       404:
 *         description: "Gói không tồn tại hoặc đã bị vô hiệu hóa"
 */
router.get('/membership-plans/:id', publicHomeController.getMembershipPlanDetail);

/**
 * @openapi
 * /api/public/home:
 *   get:
 *     tags: [Public Home]
 *     summary: "Health check - Kiểm tra trạng thái Home API"
 *     description: "Dùng để kiểm tra các endpoint riêng lẻ có hoạt động không. Không dùng để lấy dữ liệu thực tế."
 *     security: []
 *     responses:
 *       200:
 *         description: "API đang hoạt động bình thường"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 */
router.get('/', publicHomeController.getHomeData);

module.exports = router;
