const express = require('express');
const { getPublicPlans, getPublicPlanDetail } = require('../controllers/membershipPlans.controller');

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     MembershipPlanCard:
 *       type: object
 *       description: "Thông tin gọn nhẹ của thẻ hội viên (dùng cho Trang Chủ)"
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Gói Kim Cương"
 *         tier_code:
 *           type: string
 *           example: "diamond"
 *           description: "Mã hạng thẻ — App lấy để gán icon/màu sắc"
 *         slug:
 *           type: string
 *           example: "goi-kim-cuong"
 *         price:
 *           type: number
 *           example: 199000
 *         duration_days:
 *           type: integer
 *           example: 365
 *           description: "Thời hạn thẻ (ngày)"
 *         description:
 *           type: string
 *           example: "Trải nghiệm đọc sách không giới hạn"
 *
 *     MembershipPlanDetail:
 *       allOf:
 *         - $ref: '#/components/schemas/MembershipPlanCard'
 *         - type: object
 *           properties:
 *             late_fee_per_day:
 *               type: number
 *               description: "Phí phạt trễ hạn (VNĐ/ngày)"
 *               example: 2000
 *             features:
 *               type: array
 *               items:
 *                 type: string
 *               description: "Danh sách đặc quyền dạng tick (✔️)"
 *               example: ["Đọc tất cả sách Premium", "Không quảng cáo", "Hỗ trợ ưu tiên 24/7"]
 *             max_books_borrowed:
 *               type: integer
 *               description: "Số sách giấy mượn tối đa cùng lúc"
 *               example: 10
 *             max_concurrent_courses:
 *               type: integer
 *               description: "Số khóa học đăng ký tối đa cùng lúc"
 *               example: 5
 *             max_renewal_limit:
 *               type: integer
 *               description: "Giới hạn số lần gia hạn mượn sách"
 *               example: 3
 *             discount_percentage:
 *               type: number
 *               description: "Chiết khấu hạng thẻ (%)"
 *               example: 10
 *             priority_support:
 *               type: boolean
 *               description: "Được hỗ trợ CSKH ưu tiên"
 *               example: true
 *             allow_digital_read:
 *               type: boolean
 *               description: "Cho phép đọc sách điện tử online"
 *               example: true
 *             allow_download:
 *               type: boolean
 *               description: "Cho phép tải PDF offline"
 *               example: true
 *             sort_order:
 *               type: integer
 *             status:
 *               type: string
 *               example: "active"
 */

/**
 * @openapi
 * /api/public/membership-plans:
 *   get:
 *     tags: [Public Memberships]
 *     summary: "Danh sách gói hội viên (Khối Trang Chủ Mobile)"
 *     description: |
 *       Trả về danh sách các Gói Hội Viên đang mở bán, **có phân trang**.
 *
 *       Dùng cho việc vẽ ra các thẻ (Card) nằm ngang trên Trang Chủ App.
 *       Mỗi thẻ hiển thị: **Tên gói, Giá, Thời hạn** cùng 2 nút:
 *       - `[Nâng ngay]` → Chuyển sang luồng Thanh toán (cần truyền `id` + `price`)
 *       - `[Xem chi tiết]` → Gọi API `GET /api/public/membership-plans/:id`
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "Trang hiện tại"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: "Số gói hiển thị mỗi trang"
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
 *                         $ref: '#/components/schemas/MembershipPlanCard'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', getPublicPlans);

/**
 * @openapi
 * /api/public/membership-plans/{id}:
 *   get:
 *     tags: [Public Memberships]
 *     summary: "Chi tiết Đặc Quyền gói hội viên"
 *     description: |
 *       Trả về **tất cả thông tin chi tiết và đặc quyền** của 1 gói hội viên.
 *
 *       Phục vụ luồng khi người dùng bấm nút `[Xem chi tiết]` trên Mobile App.
 *       Bao gồm:
 *       - Mô tả gói (`description`)
 *       - Danh sách đặc quyền (`features[]`)
 *       - Giới hạn mượn sách (`max_books_borrowed`)
 *       - Giới hạn gia hạn (`max_renewal_limit`)
 *       - Quyền đọc số/tải PDF (`allow_digital_read`, `allow_download`)
 *       - Chiết khấu (`discount_percentage`)
 *       - Hỗ trợ ưu tiên (`priority_support`)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *                       $ref: '#/components/schemas/MembershipPlanDetail'
 *       404:
 *         description: "Gói hội viên không tồn tại hoặc đã bị vô hiệu hóa"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', getPublicPlanDetail);

module.exports = router;
