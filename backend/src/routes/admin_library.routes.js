const express = require('express');
const router = express.Router();
const AdminNotificationController = require('../controllers/admin_notification.controller');
const AdminInteractionController = require('../controllers/admin_interaction.controller');
const OverdueService = require('../services/admin/overdue.service');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { restrictToCMS, checkPermission } = require('../middlewares/rbac.middleware');

/**
 * ROUTES: ADMIN LIBRARY PHASE 2 (Synchronized)
 * Quản lý Thông báo, Đánh giá và Tương tác Hội viên
 */

// Tất cả các route này yêu cầu quyền truy cập CMS (Admin/Editor)
router.use(authenticateToken);
router.use(restrictToCMS);

// --- 1. QUẢN LÝ THÔNG BÁO ---
router.get('/notifications/history', checkPermission('notifications.view'), AdminNotificationController.getHistory);
router.post('/notifications/send', checkPermission('notifications.manage'), AdminNotificationController.send);
router.post('/notifications/broadcast', checkPermission('notifications.manage'), AdminNotificationController.broadcast);

// --- 2. QUẢN LÝ ĐÁNH GIÁ (BOOK REVIEWS) ---
router.get('/reviews', checkPermission('books.view'), AdminInteractionController.getReviews);
router.patch('/reviews/:id/status', checkPermission('books.manage'), AdminInteractionController.updateStatus);
router.delete('/reviews/:id', checkPermission('books.manage'), AdminInteractionController.deleteReview);

// --- 3. THỐNG KÊ WISHLIST ---
router.get('/wishlist/top', checkPermission('books.view'), AdminInteractionController.getTopWishlisted);

// --- 4. TỰ ĐỘNG NHẮC NỢ (OVERDUE NOTIFIER) ---
// Có thể trigger thủ công từ Admin CMS hoặc qua Cron job
router.post('/overdue/scan', checkPermission('book_loans.manage'), async (req, res) => {
  try {
    const result = await OverdueService.scanAndNotifyOverdue();
    res.json({
      success: true,
      message: 'Đã hoàn tất quét và gửi thông báo quá hạn!',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
