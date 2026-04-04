const { pool } = require('../config/database');

/**
 * Interaction Controller - CHUẨN HÓA RESTFUL CHUYÊN NGHIỆP
 * Xử lý: Đánh giá, Yêu thích, Ghi nhận lượt Đọc/Tải
 */

// ============================================================================
// 1. BOOK REVIEWS (Đánh giá & Bình luận)
// ============================================================================

/**
 * Lấy danh sách đánh giá của một ấn phẩm
 */
exports.getBookReviews = async (req, res, next) => {
  try {
    const { id: bookId } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        br.id, br.member_id as "memberId", br.rating, br.comment, 
        br.created_at as "createdAt", 
        COALESCE(m.full_name, 'Bạn đọc vãng lai') as "fullName"
      FROM book_reviews br
      LEFT JOIN members m ON br.member_id = m.id
      WHERE br.book_id = $1 AND br.status = 'published'
      ORDER BY br.created_at DESC
    `, [bookId]);

    const { rows: stats } = await pool.query(
      'SELECT AVG(rating)::numeric(2,1) as "avgRating", COUNT(*) as "totalReviews" FROM book_reviews WHERE book_id = $1 AND status = \'published\'',
      [bookId]
    );

    return res.json({
      success: true,
      message: "Lấy danh sách đánh giá thành công",
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

/**
 * Gửi hoặc cập nhật đánh giá sách
 * Trả về 201 cho bản ghi mới, 200 cho cập nhật
 */
exports.submitReview = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id: bookId } = req.params;
    const memberId = (req.user && (req.user.sub || req.user.id)) ? (req.user.sub || req.user.id) : null;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Đánh giá phải từ 1 đến 5 sao', code: 400 });
    }

    await client.query('BEGIN');

    let result;
    let isNew = false;

    if (memberId) {
      const { rows: check } = await client.query('SELECT id FROM book_reviews WHERE book_id = $1 AND member_id = $2', [bookId, memberId]);
      isNew = check.length === 0;

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
      result = rows[0];
    } else {
      isNew = true;
      const { rows } = await client.query(`
        INSERT INTO book_reviews (book_id, member_id, rating, comment, status, created_at, updated_at)
        VALUES ($1, NULL, $2, $3, 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, rating, comment, created_at as "createdAt"
      `, [bookId, rating, comment]);
      result = rows[0];
    }

    await client.query('COMMIT');

    return res.status(isNew ? 201 : 200).json({
      success: true,
      message: 'Cảm ơn bạn đã đóng góp đánh giá cho ấn phẩm này',
      data: result,
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
// 2. WISHLIST (Danh sách yêu thích)
// ============================================================================

exports.getMyWishlist = async (req, res, next) => {
  try {
    const memberId = req.user.sub || req.user.id;
    const { rows } = await pool.query(`
      SELECT 
        w.id as "wishlistId", w.created_at as "addedAt",
        b.id as "bookId", b.title, b.author, 
        b.is_digital as "isDigital", b.cover_image as thumbnail
      FROM wishlists w
      JOIN books b ON w.book_id = b.id
      WHERE w.member_id = $1
      ORDER BY w.created_at DESC
    `, [memberId]);

    return res.json({ 
      success: true, 
      message: "Lấy danh sách yêu thích thành công",
      data: rows, 
      code: 0 
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Thêm vào danh sách yêu thích (POST) -> 201 Created
 */
exports.addToWishlist = async (req, res, next) => {
  try {
    const bookId = req.params.id || req.params.bookId;
    const memberId = req.user.sub || req.user.id;

    await pool.query(
      'INSERT INTO wishlists (member_id, book_id, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (member_id, book_id) DO NOTHING',
      [memberId, bookId]
    );

    const { rows: countRes } = await pool.query('SELECT count(*) FROM wishlists WHERE book_id = $1', [bookId]);
    
    return res.status(201).json({ 
      success: true, 
      message: 'Đã thêm ấn phẩm vào danh sách yêu thích', 
      isFavorited: true,
      favoriteCount: parseInt(countRes[0].count),
      code: 0 
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Xóa khỏi danh sách yêu thích (DELETE) -> 200 (Vì có trả về data favoriteCount)
 */
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const bookId = req.params.id || req.params.bookId;
    const memberId = req.user.sub || req.user.id;

    await pool.query('DELETE FROM wishlists WHERE member_id = $1 AND book_id = $2', [memberId, bookId]);

    const { rows: countRes } = await pool.query('SELECT count(*) FROM wishlists WHERE book_id = $1', [bookId]);
    
    return res.json({ 
      success: true, 
      message: 'Đã xóa ấn phẩm khỏi danh sách yêu thích', 
      isFavorited: false,
      favoriteCount: parseInt(countRes[0].count),
      code: 0 
    });
  } catch (error) {
    return next(error);
  }
};

// ============================================================================
// 3. LOGGING (Đọc & Tải) -> 201 Created
// ============================================================================

/**
 * Ghi nhận hành động Đọc (Read)
 */
exports.recordRead = async (req, res, next) => {
  try {
    const { id: bookId } = req.params;
    const memberId = (req.user && (req.user.sub || req.user.id)) ? (req.user.sub || req.user.id) : null;

    await pool.query(
      'INSERT INTO interaction_logs (object_id, action_type, member_id, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [bookId, 'read', memberId]
    );

    const { rows: countRes } = await pool.query(
      "SELECT count(*) FROM interaction_logs WHERE object_id = $1 AND action_type IN ('view', 'read', 'download')",
      [bookId]
    );

    return res.status(201).json({ 
      success: true, 
      viewCount: parseInt(countRes[0].count), 
      code: 0 
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Ghi nhận hành động Tải (Download)
 */
exports.recordDownload = async (req, res, next) => {
  try {
    const { id: bookId } = req.params;
    const memberId = (req.user && (req.user.sub || req.user.id)) ? (req.user.sub || req.user.id) : null;

    await pool.query(
      'INSERT INTO interaction_logs (object_id, action_type, member_id, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [bookId, 'download', memberId]
    );

    const { rows: countRes } = await pool.query(
      "SELECT count(*) FROM interaction_logs WHERE object_id = $1 AND action_type IN ('view', 'read', 'download')",
      [bookId]
    );

    return res.status(201).json({ 
      success: true, 
      viewCount: parseInt(countRes[0].count), 
      code: 0 
    });
  } catch (error) {
    return next(error);
  }
};
