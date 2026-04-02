const { pool } = require('../config/database');

/**
 * Controller xử lý hệ thống bình luận đa tầng
 */

// Helper: Chuyển danh sách phẳng thành cấu trúc cây (phân tầng)
const buildCommentTree = (comments) => {
  const map = {};
  const tree = [];

  comments.forEach(comment => {
    map[comment.id] = { ...comment, replies: [] };
  });

  comments.forEach(comment => {
    if (comment.parent_id && map[comment.parent_id]) {
      map[comment.parent_id].replies.push(map[comment.id]);
    } else if (!comment.parent_id) {
      tree.push(map[comment.id]);
    }
  });

  return tree;
};

// GET /api/comments/:objectType/:objectId
exports.getComments = async (req, res, next) => {
  try {
    const { objectType, objectId } = req.params;
    
    // Sử dụng LEFT JOIN để không mất bình luận của người dùng vãng lai (Guest)
    const { rows } = await pool.query(
      `SELECT c.*, 
              COALESCE(u.name, c.guest_name, 'Người dùng ẩn danh') as user_name, 
              u.email as user_email, 
              rt.name as reply_to_name
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN users rt ON c.reply_to_user_id = rt.id
       WHERE c.object_type = $1 AND c.object_id = $2 AND c.status = 'approved'
       ORDER BY c.created_at ASC`,
      [objectType, objectId]
    );

    const commentTree = buildCommentTree(rows);
    return res.json({ success: true, data: commentTree });
  } catch (error) {
    return next(error);
  }
};

// POST /api/comments
exports.createComment = async (req, res, next) => {
  try {
    const { objectType, objectId, parentId, replyToUserId, content, rating, guestName } = req.body;
    
    // Chỉ cho phép người dùng đã đăng nhập bình luận
    const userId = req.user ? req.user.id : null;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập để bình luận' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung bình luận không được để trống' });
    }

    const { rows } = await pool.query(
      `INSERT INTO comments (user_id, object_id, object_type, parent_id, reply_to_user_id, content, status, rating, guest_name)
       VALUES ($1, $2, $3, $4, $5, $6, 'approved', $7, $8)
       RETURNING *`,
      [userId, objectId, objectType, parentId || null, replyToUserId || null, content, rating || 0, guestName || null]
    );

    // Lấy thông tin đầy đủ để trả về kèm thông tin người dùng
    const { rows: fullRow } = await pool.query(
      `SELECT c.*, COALESCE(u.name, c.guest_name, 'Khách') as user_name, u.email as user_email, rt.name as reply_to_name
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN users rt ON c.reply_to_user_id = rt.id
       WHERE c.id = $1`,
      [rows[0].id]
    );

    return res.status(201).json({ success: true, data: fullRow[0] });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/comments/:id
exports.updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const { rows: checkRows } = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [id]
    );

    if (!checkRows.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    if (checkRows[0].user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa bình luận này' });
    }

    const { rows } = await pool.query(
      `UPDATE comments SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [content, id]
    );

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/comments/:id
exports.deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { rows: checkRows } = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [id]
    );

    if (!checkRows.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    if (checkRows[0].user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa bình luận này' });
    }

    // Chuyển status thành deleted thay vì xóa cứng (hoặc tùy cấu hình)
    await pool.query('UPDATE comments SET status = $1 WHERE id = $2', ['deleted', id]);

    return res.json({ success: true, message: 'Bình luận đã được xóa' });
  } catch (error) {
    return next(error);
  }
};

// POST /api/comments/:id/report
exports.reportComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const reporterId = req.user.id;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp lý do báo cáo' });
    }

    await pool.query(
      `INSERT INTO comment_reports (comment_id, reporter_id, reason) VALUES ($1, $2, $3)`,
      [id, reporterId, reason]
    );

    return res.json({ success: true, message: 'Báo cáo đã được gửi thành công' });
  } catch (error) {
    return next(error);
  }
};

// --- ADMIN CONTROLLERS ---

// GET /api/admin/comments
exports.adminGetComments = async (req, res, next) => {
  try {
    const { status, objectType } = req.query;
    
    // Đã loại bỏ bảng 'courses' vì chưa tồn tại trong Database
    let query = `
      SELECT 
        c.*, 
        u.name as user_name, 
        u.email as user_email,
        r.name as reply_to_name,
        n.title as news_title,
        b.title as book_title,
        (SELECT COUNT(*) FROM comment_reports cr WHERE cr.comment_id = c.id) as report_count
      FROM comments c 
      LEFT JOIN users u ON c.user_id = u.id 
      LEFT JOIN users r ON c.reply_to_user_id = r.id
      LEFT JOIN news n ON c.object_id = n.id AND c.object_type = 'news'
      LEFT JOIN books b ON c.object_id = b.id AND c.object_type = 'book'
      WHERE 1=1`;
    
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND c.status = $${params.length}`;
    }

    if (objectType) {
      params.push(objectType);
      query += ` AND c.object_type = $${params.length}`;
    }

    query += ` ORDER BY c.created_at DESC`;

    const { rows } = await pool.query(query, params);

    // Helper: Giải mã tiêu đề (Có thể là chuỗi JSON hoặc chuỗi thường)
    const parseTitle = (val) => {
      if (!val) return null;
      if (typeof val === 'string' && val.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(val);
          return parsed.vi || parsed.en || val;
        } catch (e) {
          return val;
        }
      }
      return val;
    };

    const data = rows.map(row => ({
      ...row,
      object_title: parseTitle(row.news_title || row.book_title) || `Đối tượng #${row.object_id}`
    }));

    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/admin/comments/:id/status
exports.adminModerateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'hidden'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const { rows } = await pool.query(
      `UPDATE comments SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    return next(error);
  }
};

// GET /api/admin/comment-reports
exports.adminGetReports = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT cr.*, c.content as comment_content, u.name as reporter_name
       FROM comment_reports cr
       JOIN comments c ON cr.comment_id = c.id
       JOIN users u ON cr.reporter_id = u.id
       ORDER BY cr.created_at DESC`
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
};
