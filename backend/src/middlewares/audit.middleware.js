const { pool } = require('../config/database');

/**
 * Middleware để tự động ghi Audit Log cho các tác vụ quan trọng trong Admin CMS
 * @param {string} moduleName - Tên module đang thực hiện thao tác (VD: 'books', 'users', 'roles')
 * @param {string} entityKey - Key trong req.params hoặc req.body để lấy entity_id, mặc định 'id'
 */
const auditLog = (moduleName, entityKey = 'id') => {
  return async (req, res, next) => {
    // Chỉ audit các method thay đổi dữ liệu
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      return next();
    }

    // Capture the original res.json to observe response body
    const originalJson = res.json;
    let responseBody = null;

    res.json = function (body) {
      responseBody = body;
      return originalJson.apply(this, arguments);
    };

    res.on('finish', async () => {
      // Chỉ lưu log nếu response thành công (200-299)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          // Trích xuất entity_id từ params, body, hoặc response data
          let entityId = 
            req.params[entityKey] || 
            req.body[entityKey] || 
            (responseBody?.data?.id) || 
            null;
            
          if (entityId) entityId = String(entityId);

          let action = 'UNKNOWN';
          if (req.method === 'POST') action = 'CREATE';
          if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';
          if (req.method === 'DELETE') action = 'DELETE';

          // Capture incoming payload, exclude sensitive fields
          const newData = { ...req.body };
          if (newData.password) delete newData.password;

          const description = `[${action}] Thao tác trên module ${moduleName.toUpperCase()} bởi ${req.user.name || req.user.email}`;

          const query = `
            INSERT INTO audit_logs 
              (user_id, action, module, entity_id, description, new_data, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `;
          
          await pool.query(query, [
            req.user.id,
            action,
            moduleName,
            entityId,
            description,
            Object.keys(newData).length > 0 ? JSON.stringify(newData) : null,
            req.ip || req.connection?.remoteAddress,
            req.headers['user-agent']
          ]);
        } catch (err) {
          console.error('[AUDIT_LOG_ERROR] Cannot save audit log:', err.message);
        }
      }
    });

    next();
  };
};

module.exports = { auditLog };
