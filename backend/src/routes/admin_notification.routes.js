const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin_notification.controller');
const { checkPermission } = require('../middlewares/rbac.middleware');
const requireAuth = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Admin Notifications
 *   description: Quản lý thông báo đẩy từ hệ thống Admin tới App người dùng
 */

// Lấy lịch sử thông báo
router.get('/history', requireAuth, controller.getHistory);

// Gửi thông báo mới
router.post('/send', requireAuth, controller.send);

module.exports = router;
