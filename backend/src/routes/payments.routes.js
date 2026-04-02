const express = require('express');
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require('../controllers/payments.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

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
router.get('/', requireAuth, getAll);
router.get('/:id', requireAuth, getById);
router.post('/', requireAuth, create);
router.put('/:id', requireAuth, update);
router.delete('/:id', requireAuth, remove);

module.exports = router;
