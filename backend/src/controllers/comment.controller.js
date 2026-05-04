const { pool } = require('../config/database');
const { sendApiResponse } = require('../utils/apiResponse');

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

const serializeComment = (row) => ({
  id: row.id,
  userId: row.user_id,
  user_name: row.user_name || null,
  userEmail: row.user_email || null,
  userRole: row.user_role || null,
  objectType: row.object_type,
  objectId: row.object_id,
  parentId: row.parent_id,
  replyToUserId: row.reply_to_user_id,
  content: row.content,
  rating: row.rating,
  status: row.status,
  likes_count: Number(row.likes_count || 0),
  dislikes_count: Number(row.dislikes_count || 0),
  is_featured: Boolean(row.is_featured),
  report_count: Number(row.report_count || 0),
  news_title: row.news_title || null,
  book_title: row.book_title || null,
  object_title: row.object_title || null,
  created_at: row.created_at,
  updated_at: row.updated_at,
  replies: row.replies || [],
});

// GET /api/comments/:objectType/:objectId
exports.getComments = async (req, res, next) => {
  try {
    const objectType = String(req.params.objectType || '').trim().toLowerCase();
    const objectId = Number.parseInt(req.params.objectId, 10);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(req.query.pageSize, 10) || 10, 1);
    const offset = (page - 1) * pageSize;

    if (!objectType || Number.isNaN(objectId)) {
      return sendApiResponse(res, {
        status: 400,
        success: false,
        message: 'Tham số bình luận không hợp lệ',
        data: null,
        errors: ['VALIDATION_ERROR'],
      });
    }

    const countQuery = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM comments c
       WHERE c.object_type = $1 AND c.object_id = $2 AND c.parent_id IS NULL AND c.status = 'approved'`,
      [objectType, objectId]
    );

    const { rows } = await pool.query(
      `SELECT c.id, c.user_id, c.object_id, c.object_type, c.parent_id, c.reply_to_user_id, c.content, c.rating, c.status, c.likes_count, c.dislikes_count, c.is_featured, c.created_at, c.updated_at,
              u.name as user_name,
              r.code as user_role
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE c.object_type = $1 AND c.object_id = $2 AND c.status = 'approved'
       ORDER BY c.created_at ASC`,
      [objectType, objectId]
    );

    const commentTree = buildCommentTree(rows).map(serializeComment);
    const pagedItems = commentTree.slice(offset, offset + pageSize);

    return sendApiResponse(res, {
      status: 200,
      success: true,
      message: 'Lấy danh sách bình luận thành công',
      data: {
        items: pagedItems,
        totalRecords: countQuery.rows[0]?.total || 0,
        pageIndex: page,
        pageSize,
      },
      errors: null,
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/comments/news/:newsId/replies/:parentId
exports.getCommentReplies = async (req, res, next) => {
  try {
    const { newsId, parentId } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(req.query.pageSize, 10) || 5, 1);
    const offset = (page - 1) * pageSize;

    const parentCheck = await pool.query(
      `SELECT id, object_id, object_type
       FROM comments
       WHERE id = $1 AND status = 'approved'
       LIMIT 1`,
      [parentId]
    );

    if (!parentCheck.rows.length) {
      return sendApiResponse(res, {
        status: 404,
        success: false,
        message: 'Không tìm thấy bình luận cha',
        data: null,
        errors: ['COMMENT_NOT_FOUND'],
      });
    }

    if (String(parentCheck.rows[0].object_id) !== String(newsId)) {
      return sendApiResponse(res, {
        status: 400,
        success: false,
        message: 'Bình luận cha không thuộc bài tin này',
        data: null,
        errors: ['COMMENT_PARENT_MISMATCH'],
      });
    }

    const countQuery = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM comments c
       WHERE c.parent_id = $1 AND c.status = 'approved'`,
      [parentId]
    );

    const { rows } = await pool.query(
      `SELECT c.id, c.user_id, c.object_id, c.object_type, c.parent_id, c.reply_to_user_id, c.content, c.rating, c.status, c.created_at, c.updated_at,
              u.name as user_name,
              r.code as user_role
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE c.parent_id = $1 AND c.status = 'approved'
       ORDER BY c.created_at ASC
       LIMIT $2 OFFSET $3`,
      [parentId, pageSize, offset]
    );

    const items = rows.map(serializeComment);

    return sendApiResponse(res, {
      status: 200,
      success: true,
      message: 'Lấy danh sách trả lời bình luận thành công',
      data: {
        items,
        totalRecords: countQuery.rows[0]?.total || 0,
        pageIndex: page,
        pageSize,
      },
      errors: null,
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/comments
exports.createComment = async (req, res, next) => {
  try {
    const { objectType, objectId, parentId, replyToUserId, content, rating } = req.body;

    if (!['news', 'book', 'course'].includes(objectType)) {
      return sendApiResponse(res, {
        status: 400,
        success: false,
        message: 'Loại đối tượng bình luận không hợp lệ',
        data: null,
        errors: ['INVALID_OBJECT_TYPE'],
      });
    }
    
    // Chỉ cho phép người dùng đã đăng nhập bình luận
    const userId = req.user ? (req.user.user_id || req.user.id || req.user.sub) : null;
    const userType = req.user ? req.user.type : null;
    const userRole = req.user ? req.user.role : null;

    if (!userId) {
      return sendApiResponse(res, {
        status: 401,
        success: false,
        message: 'Bạn cần đăng nhập để bình luận',
        data: null,
        errors: ['AUTH_REQUIRED'],
      });
    }

    if (userType !== 'reader') {
      return sendApiResponse(res, {
        status: 403,
        success: false,
        message: 'Chỉ tài khoản bạn đọc mới được bình luận trên App',
        data: null,
        errors: ['FORBIDDEN'],
      });
    }

    if (!content || !content.trim()) {
      return sendApiResponse(res, {
        status: 400,
        success: false,
        message: 'Nội dung bình luận không được để trống',
        data: null,
        errors: ['VALIDATION_ERROR'],
      });
    }

    if (objectType === 'news') {
      const { rows: newsRows } = await pool.query(
        `SELECT id, status FROM news WHERE id = $1 LIMIT 1`,
        [objectId],
      );

      if (!newsRows.length) {
        return sendApiResponse(res, {
          status: 404,
          success: false,
          message: 'Không tìm thấy tin tức để bình luận',
          data: null,
          errors: ['NEWS_NOT_FOUND'],
        });
      }

      if (newsRows[0].status !== 'published') {
        return sendApiResponse(res, {
          status: 403,
          success: false,
          message: 'Chỉ được bình luận trên bài viết đã xuất bản',
          data: null,
          errors: ['NEWS_NOT_PUBLISHED'],
        });
      }
    }

    let resolvedParentId = parentId || null;
    let resolvedReplyToUserId = replyToUserId || null;

    if (resolvedParentId) {
      const { rows: parentRows } = await pool.query(
        `SELECT id, user_id, object_id, object_type
         FROM comments
         WHERE id = $1
         LIMIT 1`,
        [resolvedParentId]
      );

      if (!parentRows.length) {
        return sendApiResponse(res, {
          status: 404,
          success: false,
          message: 'Không tìm thấy bình luận cha',
          data: null,
          errors: ['COMMENT_NOT_FOUND'],
        });
      }

      if (String(parentRows[0].object_id) !== String(objectId) || parentRows[0].object_type !== objectType) {
        return sendApiResponse(res, {
          status: 400,
          success: false,
          message: 'Bình luận trả lời không thuộc cùng bài viết',
          data: null,
          errors: ['COMMENT_PARENT_MISMATCH'],
        });
      }

      resolvedReplyToUserId = parentRows[0].user_id;
    }

    const { rows } = await pool.query(
      `INSERT INTO comments (user_id, object_id, object_type, parent_id, reply_to_user_id, content, status, rating)
       VALUES ($1, $2, $3, $4, $5, $6, 'approved', $7)
       RETURNING *`,
      [userId, objectId, objectType, resolvedParentId, resolvedReplyToUserId, content, rating || 0]
    );

    // Lấy thông tin đầy đủ để trả về kèm thông tin người dùng
    const { rows: fullRow } = await pool.query(
      `SELECT c.id, c.user_id, c.object_id, c.object_type, c.parent_id, c.reply_to_user_id, c.content, c.rating, c.status, c.likes_count, c.dislikes_count, c.is_featured, c.created_at, c.updated_at,
              u.name as user_name,
              r.code as user_role
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE c.id = $1`,
      [rows[0].id]
    );

    return sendApiResponse(res, {
      status: 201,
      success: true,
      message: 'Tạo bình luận thành công',
      data: fullRow[0],
      errors: null,
    });
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

    if (!content || !content.trim()) {
      return sendApiResponse(res, {
        status: 400,
        success: false,
        message: 'Nội dung bình luận không được để trống',
        data: null,
        errors: ['VALIDATION_ERROR'],
      });
    }

    const { rows: checkRows } = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [id]
    );

    if (!checkRows.length) {
      return sendApiResponse(res, {
        status: 404,
        success: false,
        message: 'Không tìm thấy bình luận',
        data: null,
        errors: ['COMMENT_NOT_FOUND'],
      });
    }

    if (checkRows[0].user_id !== userId && req.user.role !== 'admin') {
      return sendApiResponse(res, {
        status: 403,
        success: false,
        message: 'Bạn không có quyền sửa bình luận này',
        data: null,
        errors: ['FORBIDDEN'],
      });
    }

    const { rows } = await pool.query(
      `UPDATE comments SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [content, id]
    );

    const { rows: fullRow } = await pool.query(
      `SELECT c.id, c.user_id, c.object_id, c.object_type, c.parent_id, c.reply_to_user_id, c.content, c.rating, c.status, c.likes_count, c.dislikes_count, c.is_featured, c.created_at, c.updated_at,
              u.name as user_name,
              r.code as user_role
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE c.id = $1`,
      [rows[0].id]
    );

    return sendApiResponse(res, {
      status: 200,
      success: true,
      message: 'Cập nhật bình luận thành công',
      data: serializeComment(fullRow[0]),
      errors: null,
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/comments/react
exports.reactComment = async (req, res, next) => {
  try {
    const { commentId, loaiReact } = req.body;
    const userId = req.user ? (req.user.user_id || req.user.id || req.user.sub) : null;
    const reactionType = Number(loaiReact);

    if (!commentId || !userId) {
      return sendApiResponse(res, {
        status: 400,
        success: false,
        message: 'Thiếu commentId hoặc thông tin người dùng để phản ứng',
        data: null,
        errors: ['VALIDATION_ERROR'],
      });
    }

    if (![0, 1, 2].includes(reactionType)) {
      return sendApiResponse(res, {
        status: 400,
        success: false,
        message: 'loaiReact không hợp lệ',
        data: null,
        errors: ['VALIDATION_ERROR'],
      });
    }

    const { rows: commentRows } = await pool.query(
      'SELECT id FROM comments WHERE id = $1 LIMIT 1',
      [commentId]
    );

    if (!commentRows.length) {
      return sendApiResponse(res, {
        status: 404,
        success: false,
        message: 'Không tìm thấy bình luận để phản ứng',
        data: null,
        errors: ['COMMENT_NOT_FOUND'],
      });
    }

    const { rows: existing } = await pool.query(
      'SELECT id, reaction_type FROM comment_reactions WHERE comment_id = $1 AND user_id = $2 LIMIT 1',
      [commentId, userId]
    );

    let action = 'created';
    if (existing.length && reactionType === 0) {
      await pool.query('DELETE FROM comment_reactions WHERE id = $1', [existing[0].id]);
      action = 'removed';
    } else if (existing.length) {
      await pool.query(
        'UPDATE comment_reactions SET reaction_type = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [reactionType, existing[0].id]
      );
      action = 'updated';
    } else if (reactionType !== 0) {
      await pool.query(
        'INSERT INTO comment_reactions (comment_id, user_id, reaction_type) VALUES ($1, $2, $3)',
        [commentId, userId, reactionType]
      );
    }

    const { rows: countRows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE reaction_type = 1) AS likes_count,
         COUNT(*) FILTER (WHERE reaction_type = 2) AS dislikes_count
       FROM comment_reactions
       WHERE comment_id = $1`,
      [commentId]
    );

    const likesCount = Number(countRows[0]?.likes_count || 0);
    const dislikesCount = Number(countRows[0]?.dislikes_count || 0);

    await pool.query(
      'UPDATE comments SET likes_count = $1, dislikes_count = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [likesCount, dislikesCount, commentId]
    );

    return sendApiResponse(res, {
      status: 200,
      success: true,
      message: 'Cập nhật phản ứng bình luận thành công',
      data: {
        commentId: Number(commentId),
        loaiReact: reactionType,
        action,
        likes_count: likesCount,
        dislikes_count: dislikesCount,
      },
      errors: null,
    });
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
      return sendApiResponse(res, {
        status: 404,
        success: false,
        message: 'Không tìm thấy bình luận',
        data: null,
        errors: ['COMMENT_NOT_FOUND'],
      });
    }

    if (checkRows[0].user_id !== userId && req.user.role !== 'admin') {
      return sendApiResponse(res, {
        status: 403,
        success: false,
        message: 'Bạn không có quyền xóa bình luận này',
        data: null,
        errors: ['FORBIDDEN'],
      });
    }

    // Chuyển status thành deleted thay vì xóa cứng (hoặc tùy cấu hình)
    await pool.query('UPDATE comments SET status = $1 WHERE id = $2', ['deleted', id]);

    return sendApiResponse(res, {
      status: 200,
      success: true,
      message: 'Bình luận đã được xóa',
      data: { deleted: true, id },
      errors: null,
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/comments/:id/report
exports.reportComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reporterId = req.user ? (req.user.user_id || req.user.id || req.user.sub) : null;
    const { commentId, lyDo, moTa, reason, description, report_type } = req.body;
    const reportCommentId = commentId || id;
    const reportReasonText = String(reason || moTa || description || '').trim();
    const reportTypeValue = Number(lyDo || report_type || 4);

    if (!reportCommentId || !reporterId) {
      return sendApiResponse(res, {
        status: 400,
        success: false,
        message: 'Thiếu commentId hoặc người báo cáo',
        data: null,
        errors: ['VALIDATION_ERROR'],
      });
    }

    if (!reportReasonText) {
      return sendApiResponse(res, {
        status: 400,
        success: false,
        message: 'Vui lòng cung cấp lý do báo cáo',
        data: null,
        errors: ['VALIDATION_ERROR'],
      });
    }

    if (![1, 2, 3, 4].includes(reportTypeValue)) {
      return sendApiResponse(res, {
        status: 400,
        success: false,
        message: 'Loại báo cáo không hợp lệ',
        data: null,
        errors: ['VALIDATION_ERROR'],
      });
    }

    const { rows: commentRows } = await pool.query(
      'SELECT id FROM comments WHERE id = $1 LIMIT 1',
      [reportCommentId]
    );

    if (!commentRows.length) {
      return sendApiResponse(res, {
        status: 404,
        success: false,
        message: 'Không tìm thấy bình luận để báo cáo',
        data: null,
        errors: ['COMMENT_NOT_FOUND'],
      });
    }

    await pool.query(
      `INSERT INTO comment_reports (comment_id, reporter_id, reason, report_type)
       VALUES ($1, $2, $3, $4)`,
      [reportCommentId, reporterId, reportReasonText, reportTypeValue]
    );

    return sendApiResponse(res, {
      status: 200,
      success: true,
      message: 'Báo cáo đã được gửi thành công',
      data: { reported: true, commentId: Number(reportCommentId), lyDo: reportTypeValue },
      errors: null,
    });
  } catch (error) {
    return next(error);
  }
};

// --- ADMIN CONTROLLERS ---

// GET /api/admin/comments
exports.adminGetComments = async (req, res, next) => {
  try {
    const { status, objectType, objectId } = req.query;
    
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

    if (objectId) {
      params.push(parseInt(objectId, 10));
      query += ` AND c.object_id = $${params.length}`;
    }

    query += ` ORDER BY c.created_at DESC`;

    const { rows } = await pool.query(query, params);

    const data = rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      user_name: row.user_name || null,
      userEmail: row.user_email || null,
      userRole: row.user_role || null,
      objectType: row.object_type,
      objectId: row.object_id,
      parentId: row.parent_id,
      replyToUserId: row.reply_to_user_id,
      content: row.content,
      rating: row.rating,
      status: row.status,
      likes_count: Number(row.likes_count || 0),
      dislikes_count: Number(row.dislikes_count || 0),
      is_featured: Boolean(row.is_featured),
      report_count: Number(row.report_count || 0),
      news_title: row.news_title || null,
      book_title: row.book_title || null,
      object_title: row.news_title || row.book_title || `Đối tượng #${row.object_id}`,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return sendApiResponse(res, {
      status: 200,
      success: true,
      message: 'Lấy danh sách bình luận (admin) thành công',
      data,
      errors: null,
    });
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
      return sendApiResponse(res, {
        status: 400,
        success: false,
        message: 'Trạng thái không hợp lệ',
        data: null,
        errors: ['INVALID_STATUS'],
      });
    }

    const { rows } = await pool.query(
      `UPDATE comments SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    return sendApiResponse(res, {
      status: 200,
      success: true,
      message: 'Cập nhật trạng thái bình luận thành công',
      data: rows[0],
      errors: null,
    });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/admin/comments/:id
exports.adminDeleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: checkRows } = await pool.query(
      'SELECT id FROM comments WHERE id = $1',
      [id]
    );

    if (!checkRows.length) {
      return sendApiResponse(res, {
        status: 404,
        success: false,
        message: 'Không tìm thấy bình luận',
        data: null,
        errors: ['COMMENT_NOT_FOUND'],
      });
    }

    await pool.query(
      'UPDATE comments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['deleted', id]
    );

    return sendApiResponse(res, {
      status: 200,
      success: true,
      message: 'Bình luận đã được xóa',
      data: { deleted: true, id },
      errors: null,
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/admin/comments/:id/reply
exports.adminReplyComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return sendApiResponse(res, {
        status: 400,
        success: false,
        message: 'Nội dung phản hồi không được để trống',
        data: null,
        errors: ['VALIDATION_ERROR'],
      });
    }

    const { rows: parentRows } = await pool.query(
      'SELECT id, parent_id, object_id, object_type, user_id FROM comments WHERE id = $1 LIMIT 1',
      [id]
    );

    if (!parentRows.length) {
      return sendApiResponse(res, {
        status: 404,
        success: false,
        message: 'Không tìm thấy bình luận cần phản hồi',
        data: null,
        errors: ['COMMENT_NOT_FOUND'],
      });
    }

    const parent = parentRows[0];
    const parentId = parent.parent_id || parent.id;

    const { rows } = await pool.query(
      `INSERT INTO comments (user_id, object_id, object_type, parent_id, reply_to_user_id, content, status, rating)
       VALUES ($1, $2, $3, $4, $5, $6, 'approved', 0)
       RETURNING *`,
      [userId, parent.object_id, parent.object_type, parentId, parent.user_id, content]
    );

    const { rows: fullRow } = await pool.query(
      `SELECT c.id, c.user_id, c.object_id, c.object_type, c.parent_id, c.reply_to_user_id, c.content, c.rating, c.status, c.likes_count, c.dislikes_count, c.is_featured, c.created_at, c.updated_at,
              u.name as user_name,
              r.code as user_role
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE c.id = $1`,
      [rows[0].id]
    );

    return sendApiResponse(res, {
      status: 201,
      success: true,
      message: 'Tạo phản hồi bình luận thành công',
      data: serializeComment(fullRow[0]),
      errors: null,
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/admin/comment-reports
exports.adminGetReports = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT cr.*, c.content as comment_content, u.name as reporter_name, u.email as reporter_email
       FROM comment_reports cr
       JOIN comments c ON cr.comment_id = c.id
       JOIN users u ON cr.reporter_id = u.id
       ORDER BY cr.created_at DESC`
    );

    const data = rows.map((row) => ({
      id: row.id,
      commentId: row.comment_id,
      reporterId: row.reporter_id,
      reporterName: row.reporter_name || null,
      reporterEmail: row.reporter_email || null,
      reason: row.reason,
      description: row.description || null,
      reportType: row.report_type,
      status: row.status,
      resolvedBy: row.resolved_by || null,
      resolvedAt: row.resolved_at || null,
      commentContent: row.comment_content || null,
      created_at: row.created_at,
    }));

    return sendApiResponse(res, {
      status: 200,
      success: true,
      message: 'Lấy danh sách báo cáo bình luận thành công',
      data,
      errors: null,
    });
  } catch (error) {
    return next(error);
  }
};
