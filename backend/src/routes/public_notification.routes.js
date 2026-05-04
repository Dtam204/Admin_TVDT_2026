const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const requireAuth = require('../middlewares/auth.middleware');

/**
 * @openapi
 * /api/public/notifications:
 *   get:
 *     tags: [App Reader]
 *     summary: "Danh sách thông báo cá nhân (Yêu cầu đăng nhập)"
 *     description: |
 *       Lấy danh sách thông báo in-app của hội viên hiện tại.
 *       Hỗ trợ lọc theo trạng thái đã đọc/chưa đọc.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: "Số lượng thông báo tối đa"
 *       - in: query
 *         name: unreadOnly
 *         schema: { type: string, enum: [true, false], default: false }
 *         description: "Chỉ lấy thông báo chưa đọc"
 *     responses:
 *       200:
 *         description: "Danh sách thông báo"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/NotificationListResponse'
 *       401:
 *         description: "Chưa đăng nhập"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/', requireAuth, notificationController.getMyNotifications);

/**
 * @openapi
 * /api/public/notifications/{id}/read:
 *   post:
 *     tags: [App Reader]
 *     summary: "Đánh dấu một thông báo là đã đọc"
 *     description: Cập nhật trạng thái đọc của thông báo thuộc user hiện tại.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "Đã đánh dấu đã đọc"
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
 *                         is_read: { type: boolean, example: true }
 *       404:
 *         description: "Không tìm thấy thông báo"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/:id/read', requireAuth, notificationController.markAsRead);

/**
 * @openapi
 * /api/public/notifications/mark-all-read:
 *   post:
 *     tags: [App Reader]
 *     summary: "Đánh dấu tất cả thông báo là đã đọc"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Tất cả đã được đánh dấu đã đọc"
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
 *                         updated: { type: integer, example: 5 }
 */
router.post('/mark-all-read', requireAuth, notificationController.markAllAsRead);

/**
 * @openapi
 * /api/public/notifications/{id}:
 *   delete:
 *     tags: [App Reader]
 *     summary: "Xóa một thông báo cá nhân"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "Xóa thành công"
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
 *                         deleted: { type: boolean, example: true }
 *                         id: { type: integer }
 *       404:
 *         description: "Không tìm thấy thông báo"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.delete('/:id', requireAuth, notificationController.deleteNotification);

module.exports = router;
