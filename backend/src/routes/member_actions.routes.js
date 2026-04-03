const express = require('express');
const router = express.Router();
const controller = require('../controllers/member_actions.controller');
const requireAuth = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: MemberActions
 *   description: Các thao tác quản trị dành cho Hội viên (Giao dịch, Phạt, Nhật ký)
 */

/**
 * @swagger
 * /api/admin/member-actions/all-transactions:
 *   get:
 *     tags: [Admin MemberActions]
 *     summary: Lịch sử giao dịch hội viên (Toàn hệ thống)
 *     description: Truy xuất tất cả các giao dịch (nạp tiền, thanh toán, phí phạt...) của tất cả hội viên trong hệ thống.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: 'string' }
 *         description: Tìm theo tên, mã thẻ hoặc nội dung giao dịch
 *       - in: query
 *         name: page
 *         schema: { type: 'integer', default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: 'integer', default: 20 }
 *     responses:
 *       200:
 *         description: Thành công
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
 *                         $ref: '#/components/schemas/MemberTransaction'
 */
router.get('/all-transactions', requireAuth, controller.getAllTransactions);

/**
 * @swagger
 * /api/admin/member-actions/transactions:
 *   post:
 *     tags: [Admin MemberActions]
 *     summary: Tạo giao dịch thủ công
 *     description: Cho phép Admin thực hiện các giao dịch nạp/rút hoặc thu phí trực tiếp cho hội viên.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [member_id, amount, transaction_type]
 *             properties:
 *               member_id: { type: 'integer' }
 *               amount: { type: 'number' }
 *               transaction_type:
 *                 type: 'string'
 *                 enum: [deposit, withdrawal, fee, fine, refund, payment]
 *               description: { type: 'string' }
 *     responses:
 *       201:
 *         description: Giao dịch thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 */
router.post('/transactions', requireAuth, controller.createTransaction);

/**
 * @swagger
 * /api/admin/member-actions/fines:
 *   post:
 *     tags: [Admin MemberActions]
 *     summary: Tạo phiếu phạt
 *     description: Ghi nhận phiếu phạt cho hội viên (VD: Làm hỏng sách, Nội quy...).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [memberId, amount]
 *             properties:
 *               memberId: { type: 'integer' }
 *               amount: { type: 'number' }
 *               reason: { type: 'string' }
 *     responses:
 *       201:
 *         description: Tạo phạt thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 */
router.post('/fines', requireAuth, controller.createFine);

/**
 * @swagger
 * /api/admin/member-actions/refunds:
 *   post:
 *     tags: [Admin MemberActions]
 *     summary: Hoàn tiền (Refund)
 *     description: Hoàn trả số tiền vào ví của hội viên.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [memberId, amount]
 *             properties:
 *               memberId: { type: 'integer' }
 *               amount: { type: 'number' }
 *               reason: { type: 'string' }
 *     responses:
 *       201:
 *         description: Hoàn tiền thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 */
router.post('/refunds', requireAuth, controller.createRefund);

/**
 * @swagger
 * /api/admin/member-actions/{id}/activities:
 *   get:
 *     tags: [Admin MemberActions]
 *     summary: Nhật ký hoạt động hội viên
 *     description: Xem tất cả các hoạt động nghiệp vụ của một hội viên cụ thể.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200:
 *         description: Lấy nhật ký thành công
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
 *                         $ref: '#/components/schemas/MemberActivity'
 */
router.get('/:id/activities', requireAuth, controller.getActivities);

/**
 * @swagger
 * /api/admin/member-actions/{id}/transactions:
 *   get:
 *     tags: [Admin MemberActions]
 *     summary: Lịch sử giao dịch cá nhân
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200:
 *         description: Thành công
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
 *                         $ref: '#/components/schemas/MemberTransaction'
 */
router.get('/:id/transactions', requireAuth, controller.getTransactions);

/**
 * @swagger
 * /api/admin/member-actions/{id}/deposit:
 *   post:
 *     tags: [Admin MemberActions]
 *     summary: Nạp tiền nhanh (Tại quầy)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: 'number' }
 *               description: { type: 'string' }
 *     responses:
 *       200:
 *         description: Nạp tiền thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 */
router.post('/:id/deposit', requireAuth, controller.deposit);

/**
 * @swagger
 * /api/admin/member-actions/{id}/reset-password:
 *   post:
 *     tags: [Admin MemberActions]
 *     summary: Đặt lại mật khẩu hội viên
 *     description: Đặt mật khẩu hội viên về mặc định (hoặc tạo mật khẩu mới ngẫu nhiên).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200:
 *         description: Đặt lại thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 */
router.post('/:id/reset-password', requireAuth, controller.resetPassword);

module.exports = router;
