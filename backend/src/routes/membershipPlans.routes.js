const express = require('express');
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require('../controllers/membershipPlans.controller');
const requireAuth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/rbac.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/membership-plans:
 *   get:
 *     tags:
 *       - Admin MembershipPlans
 *     summary: Lấy danh sách membershipplans
 */
router.get('/', requireAuth, checkPermission('membership_plans.view'), getAll);

/**
 * @openapi
 * /api/admin/membership-plans/:id:
 *   get:
 *     tags:
 *       - Admin MembershipPlans
 *     summary: Lấy chi tiết membershipplans
 */
router.get('/:id', requireAuth, checkPermission('membership_plans.view'), getById);

/**
 * @openapi
 * /api/admin/membership-plans:
 *   post:
 *     tags:
 *       - Admin MembershipPlans
 *     summary: Tạo gói hội viên mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, duration_days]
 *             properties:
 *               name: { type: string, example: "Gói VIP 1 Năm" }
 *               slug: { type: string, example: "goi-vip-1-nam" }
 *               tier_code: { type: string, enum: [basic, premium, vip], example: "vip" }
 *               price: { type: number, example: 500000 }
 *               duration_days: { type: integer, example: 365 }
 *               description: { type: string, example: "Gói đầy đủ quyền lợi cho bạn đọc thường xuyên" }
 *               features:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["Mượn tối đa 10 sách", "Gia hạn 3 lần", "Hỗ trợ ưu tiên"]
 *               max_books_borrowed: { type: integer, example: 10 }
 *               max_renewal_limit: { type: integer, example: 3 }
 *               late_fee_per_day: { type: number, example: 2000 }
 *               discount_percentage: { type: number, example: 10 }
 *               priority_support: { type: boolean, example: true }
 *               allow_digital_read: { type: boolean, example: true }
 *               allow_download: { type: boolean, example: true }
 *               sort_order: { type: integer, example: 1 }
 *               status: { type: string, enum: [active, inactive, draft], example: "active" }
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', requireAuth, checkPermission('membership_plans.manage'), create);

/**
 * @openapi
 * /api/admin/membership-plans/:id:
 *   put:
 *     tags:
 *       - Admin MembershipPlans
 *     summary: Cập nhật membershipplans
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *               tier_code: { type: string, enum: [basic, premium, vip] }
 *               price: { type: number }
 *               duration_days: { type: integer }
 *               description: { type: string }
 *               features:
 *                 type: array
 *                 items: { type: string }
 *               max_books_borrowed: { type: integer }
 *               max_renewal_limit: { type: integer }
 *               late_fee_per_day: { type: number }
 *               discount_percentage: { type: number }
 *               priority_support: { type: boolean }
 *               allow_digital_read: { type: boolean }
 *               allow_download: { type: boolean }
 *               sort_order: { type: integer }
 *               status: { type: string, enum: [active, inactive, draft] }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', requireAuth, checkPermission('membership_plans.manage'), update);

/**
 * @openapi
 * /api/admin/membership-plans/:id:
 *   delete:
 *     tags:
 *       - Admin MembershipPlans
 *     summary: Xóa membershipplans
 */
router.delete('/:id', requireAuth, checkPermission('membership_plans.manage'), remove);

module.exports = router;
