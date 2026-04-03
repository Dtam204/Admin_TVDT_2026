const express = require('express');
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require('../controllers/payments.controller');
const { getFinanceStats } = require('../controllers/finance.controller');
const requireAuth = require('../middlewares/auth.middleware');
const { restrictToCMS, checkPermission } = require('../middlewares/rbac.middleware');

const router = express.Router();

// Tất cả các route admin thanh toán đều yêu cầu đăng nhập và thuộc quyền CMS
router.use(requireAuth);
router.use(restrictToCMS);

/**
 * @openapi
 * /api/admin/payments:
 *   get:
 *     tags: [Admin Payments]
 *     summary: Lấy danh sách thanh toán (Lịch sử giao dịch)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: 'integer', default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: 'integer', default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: 'string' }
 *       - in: query
 *         name: status
 *         schema: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: 'array', items: { $ref: '#/components/schemas/Payment' } }
 *                     pagination: { $ref: '#/components/schemas/Pagination' }
 *   post:
 *     tags: [Admin Payments]
 *     summary: Tạo giao dịch thanh toán mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Payment' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *
 * /api/admin/payments/{id}:
 *   get:
 *     tags: [Admin Payments]
 *     summary: Lấy chi tiết giao dịch
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Payment' }
 *   put:
 *     tags: [Admin Payments]
 *     summary: Cập nhật giao dịch
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Payment' }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags: [Admin Payments]
 *     summary: Xóa giao dịch
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.get('/stats', checkPermission('payments.view'), getFinanceStats);
router.get('/', checkPermission('payments.view'), getAll);
router.get('/:id', checkPermission('payments.view'), getById);
router.post('/', checkPermission('payments.manage'), create);
router.put('/:id', checkPermission('payments.manage'), update);
router.delete('/:id', checkPermission('payments.manage'), remove);

module.exports = router;
