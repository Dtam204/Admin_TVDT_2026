const { pool } = require('../../config/database');
const { toPlainText } = require('../../utils/locale');
const { emitToRoom, emitToUser, DEFAULT_ROOMS } = require('../../socket');

/**
 * Notification Service (Synchronized Phase 2)
 * Đồng bộ thông báo giữa Admin và App thông qua DB + Socket.io.
 */

class NotificationService {
  static normalizeJson(value) {
    if (value && typeof value === 'object') return value;
    return { text: String(value || '') };
  }

  static buildWhereClause(target_type, member_id) {
    const clauses = ['1=1'];
    const params = [];
    let idx = 1;

    if (target_type) {
      clauses.push(`n.target_type = $${idx++}`);
      params.push(target_type);
    }

    if (member_id) {
      clauses.push(`(n.member_id = $${idx++} OR n.target_type = 'all')`);
      params.push(member_id);
    }

    return { where: clauses.join(' AND '), params };
  }

  static async getNotificationHistory({ page = 1, limit = 20, target_type = null }) {
    const offset = (page - 1) * limit;
    const { where, params } = this.buildWhereClause(target_type, null);
    const queryParams = [...params, limit, offset];

    const query = `
      SELECT n.*, u.name as sender_name, m.full_name as member_name
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      LEFT JOIN members m ON n.member_id = m.id
      WHERE ${where}
      ORDER BY n.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const { rows: notificationsRaw } = await pool.query(query, queryParams);
    const countQuery = `SELECT COUNT(*) FROM notifications n WHERE ${where}`;
    const { rows: countRes } = await pool.query(countQuery, params);
    const totalCount = parseInt(countRes[0].count, 10);

    const notifications = notificationsRaw.map((item) => ({
      ...item,
      title: toPlainText(item.title, 'N/A'),
      message: toPlainText(item.message, ''),
      body: toPlainText(item.message, ''),
    }));

    return {
      notifications,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    };
  }

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
      metadata = {},
      status = 'sent',
    } = data;

    const titleJson = this.normalizeJson(title);
    const messageJson = this.normalizeJson(message);
    const metadataJson = metadata && typeof metadata === 'object' ? metadata : { text: String(metadata || '') };

    const { rows } = await pool.query(
      `INSERT INTO notifications (
        title, message, type, target_type, member_id, sender_id,
        related_id, related_type, metadata, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
      RETURNING *`,
      [
        JSON.stringify(titleJson),
        JSON.stringify(messageJson),
        type,
        target_type,
        member_id,
        sender_id,
        related_id,
        related_type,
        JSON.stringify(metadataJson),
        status,
      ]
    );

    const notification = rows[0];

    try {
      if (target_type === 'all') {
        emitToRoom(DEFAULT_ROOMS.app, 'notification:new', notification);
        emitToRoom(DEFAULT_ROOMS.admin, 'notification:new', notification);
      } else if (member_id) {
        emitToUser(member_id, 'notification:new', notification);
      }
    } catch (socketError) {
      console.error('[NotificationService] Socket emit failed:', socketError.message);
    }

    return notification;
  }

  static async broadcastToAll(data) {
    const { title, message, sender_id, metadata = {} } = data;
    return this.sendNotification({
      title,
      message,
      type: 'system',
      target_type: 'all',
      sender_id,
      metadata,
      status: 'sent',
    });
  }
}

module.exports = NotificationService;
