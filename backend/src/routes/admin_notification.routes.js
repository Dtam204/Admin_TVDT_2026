const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin_notification.controller');
const { checkPermission } = require('../middlewares/rbac.middleware');

/**
 * @swagger
 * tags:
 *   name: Admin Notifications
 *   description: Quản lý thông báo đẩy từ hệ thống Admin tới App người dùng
 */

// Lấy lịch sử thông báo
router.get('/history', checkPermission('notifications.view'), controller.getHistory);

// Gửi thông báo mới
router.post('/send', checkPermission('notifications.manage'), controller.send);

module.exports = router;
