const { pool } = require('../config/database');

/**
 * Notification Controller
 * Quản lý thông báo cho hội viên (In-app)
 */

// Lấy danh sách thông báo của tôi (Hội viên hiện tại)
exports.getMyNotifications = async (req, res, next) => {
  try {
    const memberId = req.user.id; // Từ authMiddleware
    const { limit = 20, unreadOnly = false } = req.query;

    let query = `
      SELECT id, type, title, message, is_read as "isRead", related_id as "relatedId", 
             related_type as "relatedType", created_at as "createdAt"
      FROM notifications
      WHERE member_id = $1
    `;
    const params = [memberId];

    if (unreadOnly === 'true') {
      query += ` AND is_read = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT $2`;
    params.push(parseInt(limit));

    const { rows } = await pool.query(query, params);

    // Lấy số lượng chưa đọc
    const { rows: countRows } = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE member_id = $1 AND is_read = false',
      [memberId]
    );

    return res.json({
      success: true,
      data: rows,
      unreadCount: parseInt(countRows[0].count),
      code: 0
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return next(error);
  }
};

// Đánh dấu 1 thông báo là đã đọc
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const memberId = req.user.id;

    const { rowCount } = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND member_id = $2',
      [id, memberId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo', code: 404 });
    }

    return res.json({ success: true, message: 'Đã đánh dấu đã đọc', code: 0 });
  } catch (error) {
    return next(error);
  }
};

// Đánh dấu tất cả là đã đọc
exports.markAllAsRead = async (req, res, next) => {
  try {
    const memberId = req.user.id;

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE member_id = $1 AND is_read = false',
      [memberId]
    );

    return res.json({ success: true, message: 'Tất cả thông báo đã được đánh dấu đã đọc', code: 0 });
  } catch (error) {
    return next(error);
  }
};

// Xóa thông báo (Tùy chọn)
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const memberId = req.user.id;

    const { rowCount } = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND member_id = $2',
      [id, memberId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo', code: 404 });
    }

    return res.json({ success: true, message: 'Đã xóa thông báo', code: 0 });
  } catch (error) {
    return next(error);
  }
};
