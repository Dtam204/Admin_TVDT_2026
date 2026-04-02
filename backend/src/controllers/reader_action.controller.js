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

      const query = `
        INSERT INTO user_reading_progress (user_id, book_id, last_page, progress_percent, is_finished, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (user_id, book_id) 
        DO UPDATE SET 
          last_page = EXCLUDED.last_page,
          progress_percent = EXCLUDED.progress_percent,
          is_finished = EXCLUDED.is_finished,
          updated_at = NOW()
      `;

      await pool.query(query, [userId, bookId, lastPage || 1, progressPercent || 0, isFinished || false]);
      res.json({ success: true, message: "Đã lưu tiến độ đọc" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
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
