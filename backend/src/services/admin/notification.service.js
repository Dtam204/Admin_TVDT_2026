const { pool } = require('../../config/database');

class NotificationService {
  /**
   * Lấy lịch sử thông báo đã gửi
   */
  static async getNotificationHistory({ page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const { rows: notifications } = await pool.query(
      'SELECT n.*, u.username as sender_name FROM notifications n LEFT JOIN users u ON n.sender_id = u.id ORDER BY n.created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    const { rows: countRes } = await pool.query('SELECT COUNT(*) FROM notifications');
    const totalCount = parseInt(countRes[0].count);

    return {
      notifications,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    };
  }

  /**
   * Lưu thông báo vào database (và sau này tích hợp gửi FCM)
   */
  static async sendNotification(data) {
    const { title, body, target_type = 'all', target_id = null, sender_id = null, metadata = {} } = data;
    
    const titleJson = typeof title === 'object' ? title : { vi: title };
    const bodyJson = typeof body === 'object' ? body : { vi: body };

    const { rows } = await pool.query(
      `INSERT INTO notifications (title, body, target_type, target_id, sender_id, metadata, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [JSON.stringify(titleJson), JSON.stringify(bodyJson), target_type, target_id, sender_id, JSON.stringify(metadata), 'sent']
    );

    // TODO: Tích hợp Firebase Cloud Messaging (FCM) ở đây
    // await FCMService.sendToTopic(target_type === 'all' ? 'all_users' : `tier_${target_id}`, titleJson.vi, bodyJson.vi);

    return rows[0];
  }
}

module.exports = NotificationService;
