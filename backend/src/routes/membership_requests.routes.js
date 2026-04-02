const express = require('express');
const router = express.Router();
const controller = require('../controllers/membership_requests.controller');
const requireAuth = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /api/admin/membership-requests:
 *   get:
 *     tags:
 *       - Admin Membership Requests
 *     summary: Lấy danh sách yêu cầu gia hạn/nâng cấp
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: Danh sách yêu cầu thành công
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
 *                     $ref: '#/components/schemas/MembershipRequest'
 */
router.get('/', requireAuth, controller.getAll);

/**
 * @swagger
 * /api/admin/membership-requests/{id}/approve:
 *   patch:
 *     tags:
 *       - Admin Membership Requests
 *     summary: Phê duyệt yêu cầu gia hạn
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               admin_note:
 *                 type: string
 *               manual_days:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Phê duyệt thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MembershipRequest'
 */
router.patch('/:id/approve', requireAuth, controller.approve);

/**
 * @swagger
 * /api/admin/membership-requests/{id}/reject:
 *   patch:
 *     tags:
 *       - Admin Membership Requests
 *     summary: Từ chối yêu cầu gia hạn
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               admin_note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Từ chối thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MembershipRequest'
 */
router.patch('/:id/reject', requireAuth, controller.reject);

module.exports = router;
