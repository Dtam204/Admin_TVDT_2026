const { pool } = require('../../config/database');

/**
 * Interaction Service (Phase 2 Library)
 * Quản lý Đánh giá, Bình luận và Wishlist cho Admin/Editor.
 */

class InteractionService {
  /**
   * Lấy danh sách đánh giá của toàn hệ thống (Admin CMS)
   */
  static async getAllReviews({ page = 1, limit = 20, status = null, bookId = null }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        br.*, m.full_name as member_name, m.email as member_email,
        b.title->>'vi' as book_title, b.isbn
      FROM book_reviews br
      JOIN members m ON br.member_id = m.id
      JOIN books b ON br.book_id = b.id
      WHERE 1=1
    `;
    const params = [limit, offset];

    if (status) {
      query += ` AND br.status = $3`;
      params.push(status);
    }
    if (bookId) {
      query += ` AND br.book_id = $${params.length + 1}`;
      params.push(bookId);
    }

    query += ` ORDER BY br.created_at DESC LIMIT $1 OFFSET $2`;
    
    const { rows: reviews } = await pool.query(query, params);
    const { rows: countRes } = await pool.query('SELECT COUNT(*) FROM book_reviews');
    const totalCount = parseInt(countRes[0].count);

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
        b.id, b.title->>'vi' as title, b.isbn, b.cover_image,
        COUNT(w.id) as wishlist_count
      FROM wishlists w
      JOIN books b ON w.book_id = b.id
      GROUP BY b.id
      ORDER BY wishlist_count DESC
      LIMIT $1
    `, [limit]);

    return rows;
  }
}

module.exports = InteractionService;
