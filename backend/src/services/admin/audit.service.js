const { pool } = require('../../config/database');

/**
 * AuditService - Ghi lại nhật ký mọi hoạt động của Admin
 */
class AuditService {
  /**
   * Ghi log hành động (Hỗ trợ tham số vị trí cho thuận tiện)
   */
  static async log(userId, action, module, entityId, oldData = null, newData = null, description = null, ipAddress = 'unknown', userAgent = 'unknown') {
    try {
      // Nếu tham số đầu tiên là object, giả định là gọi theo kiểu destructured (legacy hoặc alternative)
      if (typeof userId === 'object' && userId !== null && !action) {
        const data = userId;
        return this.log(
          data.userId, data.action, data.module, data.entityId, 
          data.oldData, data.newData, data.description, data.ipAddress, data.userAgent
        );
      }

      await pool.query(`
        INSERT INTO audit_logs (
          user_id, action, module, entity_id, description, 
          old_data, new_data, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        userId, 
        action, 
        module, 
        entityId, 
        description || `${action} ${module} #${entityId}`, 
        oldData ? JSON.stringify(oldData) : null, 
        newData ? JSON.stringify(newData) : null, 
        ipAddress || 'unknown',
        userAgent || 'unknown'
      ]);
    } catch (error) {
      console.error('[AuditService Error]: Failed to log action', error.message);
    }
  }

  /**
   * Lấy danh sách log (Để hiển thị trên UI Admin History)
   */
  static async getLogs(params = {}) {
    // Logic này đã có ở audit.controller.js nhưng tôi bổ sung Service để chuẩn hóa
    // Tạm thời chưa viết thêm vì controller đã chạy tốt
  }
}

module.exports = AuditService;
