const { pool } = require('../config/database');

exports.getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Optional filters
    const moduleFilter = req.query.module ? String(req.query.module).trim() : null;
    const actionFilter = req.query.action ? String(req.query.action).trim() : null;
    const userIdFilter = req.query.userId ? parseInt(req.query.userId) : null;
    
    let baseQuery = `
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (moduleFilter) {
      baseQuery += ` AND a.module = $${paramIndex++}`;
      params.push(moduleFilter);
    }
    if (actionFilter) {
      baseQuery += ` AND a.action = $${paramIndex++}`;
      params.push(actionFilter);
    }
    if (userIdFilter) {
      baseQuery += ` AND a.user_id = $${paramIndex++}`;
      params.push(userIdFilter);
    }

    // Count Total
    const countQuery = `SELECT COUNT(*) ${baseQuery}`;
    const countResult = await pool.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch Data
    const dataQuery = `
      SELECT 
        a.id, 
        a.action, 
        a.module, 
        a.entity_id, 
        a.description, 
        a.new_data, 
        a.ip_address, 
        a.user_agent, 
        a.created_at,
        u.name AS user_name,
        u.email AS user_email
      ${baseQuery}
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    const dataParams = [...params, limit, offset];
    const { rows } = await pool.query(dataQuery, dataParams);

    return res.json({
      success: true,
      data: rows,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit
      }
    });

  } catch (error) {
    console.error('getAuditLogs Error:', error);
    return next(error);
  }
};
