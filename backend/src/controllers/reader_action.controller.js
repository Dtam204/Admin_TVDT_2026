const { pool } = require('../config/database');
const {
  getReadingProgressSchema,
  buildReadingProgressSelectClause,
  normalizeReadingProgressRow,
} = require('../utils/reading_progress_schema');

const SUPPORTED_READ_MODES = new Set(['page', 'chapter', 'scroll']);

const resolveUserIdFromReq = (req) => {
  const raw =
    req?.user?.id ??
    req?.user?.sub ??
    req?.user?.user_id ??
    req?.user?.userId ??
    req?.user?.member_id ??
    null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeReadMode = (value) => {
  const raw = String(value || 'page').toLowerCase().trim();
  if (raw === 'pdf' || raw === 'pages') return 'page';
  if (raw === 'fulltext' || raw === 'text' || raw === 'full_text') return 'scroll';
  return SUPPORTED_READ_MODES.has(raw) ? raw : 'page';
};

const ensureModeProgressTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_reading_progress_modes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      read_mode VARCHAR(20) NOT NULL,
      last_page INTEGER,
      progress_percent NUMERIC(5,2) DEFAULT 0,
      scroll_percent NUMERIC(5,2),
      scroll_offset INTEGER,
      is_finished BOOLEAN DEFAULT FALSE,
      last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, book_id, read_mode)
    )
  `);
};

const normalizeModeProgressRow = (row) => ({
  read_mode: normalizeReadMode(row?.read_mode),
  last_page: row?.last_page == null ? null : Math.max(Number(row.last_page) || 1, 1),
  progress_percent: Math.min(Math.max(Number(row?.progress_percent || 0), 0), 100),
  scroll_percent: row?.scroll_percent == null ? null : Math.min(Math.max(Number(row.scroll_percent || 0), 0), 100),
  scroll_offset: row?.scroll_offset == null ? null : Math.max(Number(row.scroll_offset || 0), 0),
  is_finished: Boolean(row?.is_finished),
  last_read_at: row?.last_read_at || null,
  updated_at: row?.updated_at || null,
});

const getPreferredProgress = (modeProgressMap, legacyProgress) => {
  return (
    modeProgressMap.page ||
    modeProgressMap.chapter ||
    legacyProgress ||
    modeProgressMap.scroll ||
    null
  );
};

class ReaderActionController {
  // Toggle yêu thích sách
  static async toggleFavorite(req, res) {
    try {
      const { bookId } = req.body;
      const userId = resolveUserIdFromReq(req);

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Token không hợp lệ: thiếu user id' });
      }

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
      const { bookId, lastPage, progressPercent, isFinished, readMode, scrollPercent, scrollOffset } = req.body;
      const userId = resolveUserIdFromReq(req);

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Token không hợp lệ: thiếu user id' });
      }

      if (!bookId) {
        return res.status(400).json({ success: false, message: 'bookId là bắt buộc' });
      }

      const mode = normalizeReadMode(readMode);
      const hasLastPage = lastPage !== undefined && lastPage !== null && String(lastPage).trim() !== '';
      const safeLastPage = hasLastPage ? Math.max(parseInt(lastPage, 10) || 1, 1) : null;
      const safePercent = Math.min(Math.max(Number(progressPercent) || 0, 0), 100);
      const safeScrollPercent = scrollPercent == null
        ? (mode === 'scroll' ? safePercent : null)
        : Math.min(Math.max(Number(scrollPercent) || 0, 0), 100);
      const safeScrollOffset = scrollOffset == null ? null : Math.max(Number(scrollOffset) || 0, 0);
      const safeFinished = Boolean(isFinished)
        || safePercent >= 100
        || (safeScrollPercent != null && safeScrollPercent >= 100);

      await ensureModeProgressTable();

      const { rows: modeRows } = await pool.query(
        `INSERT INTO user_reading_progress_modes
           (user_id, book_id, read_mode, last_page, progress_percent, scroll_percent, scroll_offset, is_finished, last_read_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         ON CONFLICT (user_id, book_id, read_mode)
         DO UPDATE SET
           last_page = EXCLUDED.last_page,
           progress_percent = EXCLUDED.progress_percent,
           scroll_percent = EXCLUDED.scroll_percent,
           scroll_offset = EXCLUDED.scroll_offset,
           is_finished = EXCLUDED.is_finished,
           last_read_at = NOW(),
           updated_at = NOW()
         RETURNING read_mode, last_page, progress_percent, scroll_percent, scroll_offset, is_finished, last_read_at, updated_at`,
        [userId, bookId, mode, safeLastPage, safePercent, safeScrollPercent, safeScrollOffset, safeFinished]
      );

      let progress = null;

      // Ưu tiên đồng bộ tiến độ PDF/chapter vào bảng legacy để resume theo số trang chính xác.
      if (mode !== 'scroll') {
        const effectivePage = safeLastPage == null ? 1 : safeLastPage;

        const schema = await getReadingProgressSchema(pool);
        if (!schema.hasTable || !schema.pageColumn) {
          return res.status(500).json({
            success: false,
            message: 'Bảng user_reading_progress chưa sẵn sàng. Vui lòng chạy migration.',
          });
        }

        const insertColumns = ['user_id', 'book_id', schema.pageColumn];
        const insertValues = ['$1', '$2', '$3'];
        const queryParams = [userId, bookId, effectivePage];

        if (schema.percentColumn) {
          insertColumns.push(schema.percentColumn);
          insertValues.push(`$${queryParams.length + 1}`);
          queryParams.push(safePercent);
        }

        if (schema.finishedColumn) {
          insertColumns.push(schema.finishedColumn);
          insertValues.push(`$${queryParams.length + 1}`);
          queryParams.push(safeFinished);
        }

        if (schema.lastReadAtColumn) {
          insertColumns.push(schema.lastReadAtColumn);
          insertValues.push('NOW()');
        }

        if (schema.updatedAtColumn) {
          insertColumns.push(schema.updatedAtColumn);
          insertValues.push('NOW()');
        }

        const updateSet = [`${schema.pageColumn} = EXCLUDED.${schema.pageColumn}`];
        if (schema.percentColumn) {
          updateSet.push(`${schema.percentColumn} = EXCLUDED.${schema.percentColumn}`);
        }
        if (schema.finishedColumn) {
          updateSet.push(`${schema.finishedColumn} = EXCLUDED.${schema.finishedColumn}`);
        }
        if (schema.lastReadAtColumn) {
          updateSet.push(`${schema.lastReadAtColumn} = NOW()`);
        }
        if (schema.updatedAtColumn) {
          updateSet.push(`${schema.updatedAtColumn} = NOW()`);
        }

        const selectClause = buildReadingProgressSelectClause(schema);

        const query = `
          INSERT INTO user_reading_progress (${insertColumns.join(', ')})
          VALUES (${insertValues.join(', ')})
          ON CONFLICT (user_id, book_id)
          DO UPDATE SET
            ${updateSet.join(', ')}
          RETURNING ${selectClause}
        `;

        const { rows } = await pool.query(query, queryParams);
        progress = rows[0] ? normalizeReadingProgressRow(rows[0]) : null;
      }

      const modeProgress = normalizeModeProgressRow(modeRows[0] || {});

      return res.json({
        success: true,
        message: 'Đã lưu tiến độ đọc',
        data: {
          ...(progress || {
            user_id: userId,
            book_id: Number(bookId),
            last_page: 1,
            progress_percent: 0,
            is_finished: false,
            last_read_at: modeProgress.last_read_at,
            updated_at: modeProgress.updated_at,
          }),
          read_mode: mode,
          mode_progress: modeProgress,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Lấy tiến độ đọc cho một ấn phẩm
  static async getProgress(req, res) {
    try {
      const userId = resolveUserIdFromReq(req);
      const { bookId } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Token không hợp lệ: thiếu user id' });
      }

      if (!bookId) {
        return res.status(400).json({ success: false, message: 'bookId là bắt buộc' });
      }

      await ensureModeProgressTable();

      const { rows: modeRows } = await pool.query(
        `SELECT read_mode, last_page, progress_percent, scroll_percent, scroll_offset, is_finished, last_read_at, updated_at
         FROM user_reading_progress_modes
         WHERE user_id = $1 AND book_id = $2
         ORDER BY updated_at DESC`,
        [userId, bookId]
      );

      const modeProgressMap = modeRows.reduce((acc, row) => {
        const normalized = normalizeModeProgressRow(row);
        acc[normalized.read_mode] = normalized;
        return acc;
      }, {});

      const schema = await getReadingProgressSchema(pool);
      if (!schema.hasTable || !schema.pageColumn) {
        const fallback = normalizeReadingProgressRow(null, {
          user_id: userId,
          book_id: Number(bookId),
          last_page: 1,
          progress_percent: 0,
          is_finished: false,
          last_read_at: null,
          updated_at: null,
        });

        const preferred = getPreferredProgress(modeProgressMap, fallback);
        return res.json({
          success: true,
          message: 'Chưa có tiến độ PDF, trả dữ liệu mode hiện có',
          data: {
            ...preferred,
            mode_progress: modeProgressMap,
            preferred_mode: modeProgressMap.page ? 'page' : (modeProgressMap.chapter ? 'chapter' : (modeProgressMap.scroll ? 'scroll' : 'page')),
          },
        });
      }

      const selectClause = buildReadingProgressSelectClause(schema);

      const { rows } = await pool.query(
        `SELECT ${selectClause}
         FROM user_reading_progress
         WHERE user_id = $1 AND book_id = $2
         LIMIT 1`,
        [userId, bookId]
      );

      if (rows.length === 0) {
        const fallback = normalizeReadingProgressRow(null, {
          user_id: userId,
          book_id: Number(bookId),
          last_page: 1,
          progress_percent: 0,
          is_finished: false,
          last_read_at: null,
          updated_at: null,
        });

        const preferred = getPreferredProgress(modeProgressMap, fallback);
        const preferredMode = modeProgressMap.page ? 'page' : (modeProgressMap.chapter ? 'chapter' : (modeProgressMap.scroll ? 'scroll' : 'page'));

        return res.json({
          success: true,
          message: 'Chưa có tiến độ đọc cho ấn phẩm này',
          data: {
            ...preferred,
            mode_progress: modeProgressMap,
            preferred_mode: preferredMode,
          },
        });
      }

      const legacy = normalizeReadingProgressRow(rows[0]);
      const preferred = getPreferredProgress(modeProgressMap, legacy);
      const preferredMode = modeProgressMap.page ? 'page' : (modeProgressMap.chapter ? 'chapter' : (modeProgressMap.scroll ? 'scroll' : 'page'));

      return res.json({
        success: true,
        data: {
          ...preferred,
          mode_progress: modeProgressMap,
          preferred_mode: preferredMode,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Lấy danh sách yêu thích của User
  static async getFavorites(req, res) {
    try {
      const userId = resolveUserIdFromReq(req);
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Token không hợp lệ: thiếu user id' });
      }
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
