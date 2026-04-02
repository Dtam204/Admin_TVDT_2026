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
 *     summary: Xem lịch sử giao dịch toàn hệ thống
 *     tags: [Admin MemberActions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên hội viên, mã thẻ hoặc nội dung
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Danh sách giao dịch thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MemberTransaction'
 */
router.get('/all-transactions', requireAuth, controller.getAllTransactions);

/**
 * @swagger
 * /api/admin/member-actions/transactions:
 *   post:
 *     summary: Tạo giao dịch thủ công (Nạp/Rút/Phí)
 *     tags: [Admin MemberActions]
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
 *               member_id:
 *                 type: integer
 *                 example: 1
 *               amount:
 *                 type: number
 *                 example: 50000
 *               transaction_type:
 *                 type: string
 *                 enum: [deposit, withdrawal, fee, fine, refund, payment]
 *                 example: "deposit"
 *               description:
 *                 type: string
 *                 example: "Nạp tiền học phí"
 *               processed_by:
 *                 type: integer
 *                 description: ID của Admin thực hiện (tùy chọn)
 *     responses:
 *       201:
 *         description: Tạo giao dịch thành công
 */
router.post('/transactions', requireAuth, controller.createTransaction);

/**
 * @swagger
 * /api/admin/member-actions/fines:
 *   post:
 *     summary: Gửi phiếu phạt cho hội viên
 *     tags: [Admin MemberActions]
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
 *               memberId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Gửi phiếu phạt thành công
 */
router.post('/fines', requireAuth, controller.createFine);

/**
 * @swagger
 * /api/admin/member-actions/refunds:
 *   post:
 *     summary: Hoàn tiền vào ví hội viên
 *     tags: [Admin MemberActions]
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
 *               memberId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Hoàn tiền thành công
 */
router.post('/refunds', requireAuth, controller.createRefund);

/**
 * @swagger
 * /api/admin/member-actions/{id}/activities:
 *   get:
 *     summary: Xem nhật ký hoạt động của một hội viên
 *     tags: [Admin MemberActions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của hội viên
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách hoạt động
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MemberActivity'
 */
router.get('/:id/activities', requireAuth, controller.getActivities);

/**
 * @swagger
 * /api/admin/member-actions/{id}/transactions:
 *   get:
 *     summary: Xem lịch sử giao dịch của một hội viên cụ thể
 *     tags: [Admin MemberActions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách giao dịch
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MemberTransaction'
 */
router.get('/:id/transactions', requireAuth, controller.getTransactions);

/**
 * @swagger
 * /api/admin/member-actions/{id}/deposit:
 *   post:
 *     summary: Nạp tiền nhanh vào ví (Deposit)
 *     tags: [Admin MemberActions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 100000
 *               description:
 *                 type: string
 *                 example: "Nạp tiền qua quầy"
 *     responses:
 *       200:
 *         description: Nạp tiền thành công
 */
router.post('/:id/deposit', requireAuth, controller.deposit);

/**
 * @swagger
 * /api/admin/member-actions/{id}/reset-password:
 *   post:
 *     summary: Reset mật khẩu cho tài khoản hội viên
 *     tags: [Admin MemberActions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reset mật khẩu thành công
 */
router.post('/:id/reset-password', requireAuth, controller.resetPassword);

module.exports = router;
