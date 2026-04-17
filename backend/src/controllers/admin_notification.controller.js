const NotificationService = require('../services/admin/notification.service');

/**
 * Admin Notification Controller (Synchronized Phase 2)
 * Quản lý gửi thông báo Hệ thống và Cá nhân.
 */

class AdminNotificationController {
  /**
   * Lấy lịch sử thông báo
   */
  static async getHistory(req, res) {
    try {
      const { page, limit, target_type } = req.query;
      const result = await NotificationService.getNotificationHistory({
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
        target_type
      });
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Gửi thông báo từ Admin/Editor
   */
  static async send(req, res) {
    try {
      const { title, message, target_type, member_id, metadata, type, related_id, related_type } = req.body;
      const sender_id = req.user?.id;

      const result = await NotificationService.sendNotification({
        title,
        message,
        target_type: target_type || 'individual',
        member_id,
        sender_id,
        metadata,
        related_id,
        related_type,
        type: type || 'system'
      });

      res.status(201).json({
        success: true,
        message: 'Gửi thông báo thành công!',
        data: result
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Gửi thông báo quảng bá (Broadcast) cho tất cả
   */
  static async broadcast(req, res) {
    try {
      const { title, message, metadata } = req.body;
      const sender_id = req.user?.id;

      const result = await NotificationService.broadcastToAll({
        title,
        message,
        sender_id,
        metadata
      });

      res.status(201).json({
        success: true,
        message: 'Gửi thông báo toàn hệ thống thành công!',
        data: result
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = AdminNotificationController;
