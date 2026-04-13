const { pool } = require('../config/database');

class ReaderActionController {
  // Toggle yêu thích sách
  static async toggleFavorite(req, res) {
    try {
      const { bookId } = req.body;
      const userId = req.user.id;

      if (!bookId) return res.status(400).json({ success: false, message: "bookId is required" });

      // Kiểm tra xem đã yêu thích chưa
      const { rows: existing } = await pool.query(
        'SELECT id FROM user_favorites WHERE user_id = $1 AND book_id = $2',
        [userId, bookId]
      );

      if (existing.length > 0) {
        // Nếu đã có thì xóa (Unlike)
        await pool.query('DELETE FROM user_favorites WHERE id = $1', [existing[0].id]);
        return res.json({ success: true, message: "Đã xóa khỏi danh sách yêu thích", isFavorited: false });
      } else {
        // Nếu chưa có thì thêm (Like)
        await pool.query(
          'INSERT INTO user_favorites (user_id, book_id) VALUES ($1, $2)',
          [userId, bookId]
        );
        return res.json({ success: true, message: "Đã thêm vào danh sách yêu thích", isFavorited: true });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Cập nhật tiến độ đọc sách
  static async updateProgress(req, res) {
    try {
      const { bookId, lastPage, progressPercent, isFinished } = req.body;
      const userId = req.user.id;

      if (!bookId) {
        return res.status(400).json({ success: false, message: 'bookId là bắt buộc' });
      }

      const safeLastPage = Math.max(parseInt(lastPage, 10) || 1, 1);
      const safePercent = Math.min(Math.max(Number(progressPercent) || 0, 0), 100);
      const safeFinished = Boolean(isFinished) || safePercent >= 100;

      const query = `
        INSERT INTO user_reading_progress (user_id, book_id, last_page, progress_percent, is_finished, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (user_id, book_id) 
        DO UPDATE SET 
          last_page = EXCLUDED.last_page,
          progress_percent = EXCLUDED.progress_percent,
          is_finished = EXCLUDED.is_finished,
          last_read_at = NOW(),
          updated_at = NOW()
        RETURNING user_id, book_id, last_page, progress_percent, is_finished, last_read_at, updated_at
      `;

      const { rows } = await pool.query(query, [userId, bookId, safeLastPage, safePercent, safeFinished]);
      const progress = rows[0] || null;

      res.json({ success: true, message: 'Đã lưu tiến độ đọc', data: progress });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Lấy tiến độ đọc cho một ấn phẩm
  static async getProgress(req, res) {
    try {
      const userId = req.user.id;
      const { bookId } = req.params;

      if (!bookId) {
        return res.status(400).json({ success: false, message: 'bookId là bắt buộc' });
      }

      const { rows } = await pool.query(
        `SELECT user_id, book_id, last_page, progress_percent, is_finished, last_read_at, updated_at
         FROM user_reading_progress
         WHERE user_id = $1 AND book_id = $2
         LIMIT 1`,
        [userId, bookId]
      );

      if (rows.length === 0) {
        return res.json({
          success: true,
          message: 'Chưa có tiến độ đọc cho ấn phẩm này',
          data: {
            user_id: userId,
            book_id: Number(bookId),
            last_page: 1,
            progress_percent: 0,
            is_finished: false,
            last_read_at: null,
            updated_at: null,
          },
        });
      }

      return res.json({ success: true, data: rows[0] });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Lấy danh sách yêu thích của User
  static async getFavorites(req, res) {
    try {
      const userId = req.user.id;
      const query = `
        SELECT b.id, b.title, b.author, b.cover_image as thumbnail, b.slug
        FROM books b
        JOIN user_favorites uf ON b.id = uf.book_id
        WHERE uf.user_id = $1
        ORDER BY uf.created_at DESC
      `;
      const { rows } = await pool.query(query, [userId]);
      
      // Parse JSONB titles if needed (PublicationService usually does this, but for simplicity here)
      const data = rows.map(row => ({
        ...row,
        title: typeof row.title === 'string' ? JSON.parse(row.title) : row.title
      }));

      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = ReaderActionController;
