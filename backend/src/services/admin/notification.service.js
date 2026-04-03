const { pool } = require('../../config/database');

/**
 * Notification Service (Synchronized Phase 2)
 * Hỗ trợ gửi thông báo cho cá nhân hội viên (Individual) và toàn hệ thống (All).
 */

class NotificationService {
  /**
   * Lấy lịch sử thông báo (Admin/Editor xem)
   */
  static async getNotificationHistory({ page = 1, limit = 20, target_type = null }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT n.*, u.name as sender_name, m.full_name as member_name
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      LEFT JOIN members m ON n.member_id = m.id
      WHERE 1=1
    `;
    const params = [limit, offset];

    if (target_type) {
      query += ` AND n.target_type = $3`;
      params.push(target_type);
    }

    query += ` ORDER BY n.created_at DESC LIMIT $1 OFFSET $2`;
    
    const { rows: notifications } = await pool.query(query, params);
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
   * Gửi thông báo (Lưu vào DB và sẵn sàng tích hợp Push Notification)
   */
  static async sendNotification(data) {
    const { 
      title, 
      message, 
      type = 'system', 
      target_type = 'individual', 
      member_id = null, 
      sender_id = null, 
      related_id = null, 
      related_type = null, 
      metadata = {} 
    } = data;
    
    // Chuẩn hóa JSON linh hoạt (hỗ trợ cả string thuần và JSON đa ngôn ngữ)
    const titleJson = typeof title === 'object' ? title : { vi: title };
    const messageJson = typeof message === 'object' ? message : { vi: message };

    const { rows } = await pool.query(
      `INSERT INTO notifications (
        title, message, type, target_type, member_id, sender_id, 
        related_id, related_type, metadata, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        JSON.stringify(titleJson), JSON.stringify(messageJson), type, target_type, 
        member_id, sender_id, related_id, related_type, JSON.stringify(metadata), 'sent'
      ]
    );

    return rows[0];
  }

  /**
   * Gửi thông báo hàng loạt cho toàn bộ Độc giả
   */
  static async broadcastToAll(data) {
    const { title, message, sender_id, metadata = {} } = data;
    return this.sendNotification({
      title,
      message,
      type: 'system',
      target_type: 'all',
      sender_id,
      metadata
    });
  }
}

module.exports = NotificationService;
