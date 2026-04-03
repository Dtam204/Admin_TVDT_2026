const { pool } = require('../config/database');

/**
 * Interaction Controller
 * Handles book reviews and wishlists for members
 */

// ============================================================================
// BOOK REVIEWS (Đánh giá & Bình luận)
// ============================================================================

// Lấy danh sách đánh giá của một cuốn sách
exports.getBookReviews = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        br.id, br.member_id as "memberId", br.rating, br.comment, 
        br.created_at as "createdAt", m.full_name as "fullName"
      FROM book_reviews br
      JOIN members m ON br.member_id = m.id
      WHERE br.book_id = $1 AND br.status = 'published'
      ORDER BY br.created_at DESC
    `, [bookId]);

    // Tính trung bình
    const { rows: stats } = await pool.query(
      'SELECT AVG(rating)::numeric(2,1) as "avgRating", COUNT(*) as "totalReviews" FROM book_reviews WHERE book_id = $1 AND status = \'published\'',
      [bookId]
    );

    return res.json({
      success: true,
      data: rows,
      stats: {
        avgRating: stats[0].avgRating || 0,
        totalReviews: stats[0].totalReviews || 0
      },
      code: 0
    });
  } catch (error) {
    return next(error);
  }
};

// Gửi hoặc cập nhật đánh giá sách
exports.submitReview = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { bookId } = req.params;
    const memberId = req.user.id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Đánh giá phải từ 1 đến 5 sao', code: 400 });
    }

    await client.query('BEGIN');

    // UPSERT: Thêm mới hoặc cập nhật đánh giá hiện tại
    const { rows } = await client.query(`
      INSERT INTO book_reviews (book_id, member_id, rating, comment, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (book_id, member_id) 
      DO UPDATE SET 
        rating = EXCLUDED.rating, 
        comment = EXCLUDED.comment, 
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, rating, comment, updated_at as "updatedAt"
    `, [bookId, memberId, rating, comment]);

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Cảm ơn bạn đã đánh giá!',
      data: rows[0],
      code: 0
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

// ============================================================================
// WISHLIST (Danh sách yêu thích)
// ============================================================================

// Lấy danh sách yêu thích của tôi
exports.getMyWishlist = async (req, res, next) => {
  try {
    const memberId = req.user.id;
    const { rows } = await pool.query(`
      SELECT 
        w.id as "wishlistId", w.created_at as "addedAt",
        b.id as "bookId", b.title->>'vi' as title, b.author, 
        b.is_digital as "isDigital", b.cover_image as thumbnail
      FROM wishlists w
      JOIN books b ON w.book_id = b.id
      WHERE w.member_id = $1
      ORDER BY w.created_at DESC
    `, [memberId]);

    return res.json({ success: true, data: rows, code: 0 });
  } catch (error) {
    return next(error);
  }
};

// Thêm/Xóa khỏi danh sách yêu thích (Toggle)
exports.toggleWishlist = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const memberId = req.user.id;

    // Check if exists
    const { rows: check } = await pool.query(
      'SELECT id FROM wishlists WHERE member_id = $1 AND book_id = $2',
      [memberId, bookId]
    );

    if (check.length > 0) {
      // Remove
      await pool.query('DELETE FROM wishlists WHERE member_id = $1 AND book_id = $2', [memberId, bookId]);
      return res.json({ success: true, message: 'Đã xóa khỏi danh sách yêu thích', action: 'removed', code: 0 });
    } else {
      // Add
      await pool.query(
        'INSERT INTO wishlists (member_id, book_id, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
        [memberId, bookId]
      );
      return res.json({ success: true, message: 'Đã thêm vào danh sách yêu thích', action: 'added', code: 0 });
    }
  } catch (error) {
    return next(error);
  }
};
