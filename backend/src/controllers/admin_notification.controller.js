const NotificationService = require('../services/admin/notification.service');

class AdminNotificationController {
  static async getHistory(req, res) {
    try {
      const { page, limit } = req.query;
      const result = await NotificationService.getNotificationHistory({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      });
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async send(req, res) {
    try {
      const { title, body, target_type, target_id, metadata } = req.body;
      const sender_id = req.user?.id;

      const result = await NotificationService.sendNotification({
        title,
        body,
        target_type,
        target_id,
        sender_id,
        metadata
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
}

module.exports = AdminNotificationController;
