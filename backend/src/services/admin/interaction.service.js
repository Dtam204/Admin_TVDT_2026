const { pool } = require('../../config/database');
const { toPlainText } = require('../../utils/locale');

/**
 * Interaction Service (Phase 2 Library)
 * Quản lý Đánh giá, Bình luận và Wishlist cho Admin/Editor.
 */

class InteractionService {
  /**
   * Lấy danh sách đánh giá của toàn hệ thống (Admin CMS)
   */
  static async getAllReviews({ page = 1, limit = 20, status = null, bookId = null, search = '' }) {
    const offset = (page - 1) * limit;
    let baseQuery = `
      SELECT 
        br.*, 
        COALESCE(m.full_name, 'Bạn đọc vãng lai') as member_name,
        COALESCE(m.email, 'guest@local') as member_email,
        b.title::text as book_title,
        b.isbn
      FROM book_reviews br
      LEFT JOIN members m ON br.member_id = m.id
      JOIN books b ON br.book_id = b.id
      WHERE 1=1
    `;
    const dataParams = [];

    if (status) {
      dataParams.push(status);
      baseQuery += ` AND br.status = $${dataParams.length}`;
    }
    if (bookId) {
      dataParams.push(bookId);
      baseQuery += ` AND br.book_id = $${dataParams.length}`;
    }
    if (search && String(search).trim()) {
      const keyword = `%${String(search).trim()}%`;
      dataParams.push(keyword);
      baseQuery += ` AND (
        COALESCE(m.full_name, '') ILIKE $${dataParams.length}
        OR COALESCE(m.email, '') ILIKE $${dataParams.length}
        OR COALESCE(b.title::text, '') ILIKE $${dataParams.length}
        OR COALESCE(br.comment, '') ILIKE $${dataParams.length}
      )`;
    }

    const query = `${baseQuery} ORDER BY br.created_at DESC LIMIT $${dataParams.length + 1} OFFSET $${dataParams.length + 2}`;
    const params = [...dataParams, limit, offset];
    
    const { rows: reviewsRaw } = await pool.query(query, params);
    const { rows: countRes } = await pool.query(`SELECT COUNT(*) FROM (${baseQuery}) AS filtered_reviews`, dataParams);
    const totalCount = parseInt(countRes[0].count);
    const reviews = reviewsRaw.map((item) => ({
      ...item,
      book_title: toPlainText(item.book_title, 'N/A'),
      comment: toPlainText(item.comment, ''),
      member_name: toPlainText(item.member_name, 'Bạn đọc vãng lai'),
      member_email: toPlainText(item.member_email, 'guest@local'),
    }));

    return {
      reviews,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    };
  }

  /**
   * Cập nhật trạng thái đánh giá (Duyệt/Ẩn)
   * Cho phép Admin/Editor quản lý
   */
  static async updateReviewStatus(id, status) {
    const validStatus = ['published', 'hidden', 'flagged'];
    if (!validStatus.includes(status)) {
      throw new Error('Trạng thái không hợp lệ');
    }

    const { rows } = await pool.query(
      'UPDATE book_reviews SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (rows.length === 0) throw new Error('Không tìm thấy đánh giá');
    return rows[0];
  }

  /**
   * Xóa đánh giá (Admin/Editor)
   */
  static async deleteReview(id) {
    const { rowCount } = await pool.query('DELETE FROM book_reviews WHERE id = $1', [id]);
    return rowCount > 0;
  }

  /**
   * Thống kê Wishlist: Những cuốn sách được yêu thích nhất
   */
  static async getWishlistStats({ limit = 10 }) {
    const { rows } = await pool.query(`
      SELECT 
        b.id, b.title::text as title, b.isbn, b.cover_image,
        COUNT(w.id) as wishlist_count
      FROM wishlists w
      JOIN books b ON w.book_id = b.id
      GROUP BY b.id
      ORDER BY wishlist_count DESC
      LIMIT $1
    `, [limit]);

    return rows.map((item) => ({
      ...item,
      title: toPlainText(item.title, 'N/A'),
    }));
  }
}

module.exports = InteractionService;
