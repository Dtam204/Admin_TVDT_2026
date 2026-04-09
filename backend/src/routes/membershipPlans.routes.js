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
 *               name:
 *                 type: string
 *                 example: "Gói VIP 1 Năm"
 *               price:
 *                 type: number
 *                 example: 500000
 *               duration_days:
 *                 type: integer
 *                 example: 365
 *               description:
 *                 type: string
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
