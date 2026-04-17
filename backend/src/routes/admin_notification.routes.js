const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin_notification.controller');
const { checkPermission } = require('../middlewares/rbac.middleware');

/**
 * @openapi
 * /api/admin/notifications/history:
 *   get:
 *     tags: [Admin Notifications]
 *     summary: Lấy lịch sử thông báo
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lịch sử thông báo
 *
 * /api/admin/notifications/send:
 *   post:
 *     tags: [Admin Notifications]
 *     summary: Gửi thông báo mới cho 1 người hoặc theo luồng hệ thống
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               message: { type: string }
 *               target_type: { type: string, enum: [individual, all], default: individual }
 *               member_id: { type: integer, nullable: true }
 *               type: { type: string, default: system }
 *               metadata: { type: object }
 *     responses:
 *       201:
 *         description: Gửi thông báo thành công
 */

router.get('/history', checkPermission('notifications.view'), controller.getHistory);
router.post('/send', checkPermission('notifications.manage'), controller.send);
router.post('/broadcast', checkPermission('notifications.manage'), controller.broadcast);

module.exports = router;
