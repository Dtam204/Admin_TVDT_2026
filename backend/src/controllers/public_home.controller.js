const { pool } = require('../config/database');

/**
 * Helper để parse jsonb title cho Frontend (thường Frontend cần chuỗi hoặc object)
 */
const parseTitle = (row) => {
  if (typeof row.title === 'string') {
    try {
      const parsed = JSON.parse(row.title);
      return parsed.vi || parsed.en || row.title;
    } catch {
      return row.title;
    }
  }
  return row.title?.vi || row.title?.en || "Chưa có tiêu đề";
};

/**
 * Helper để kiểm tra section có đang hoạt động (is_active) không
 */
const isSectionActive = async (sectionType) => {
  try {
    const { rows } = await pool.query(
      'SELECT is_active FROM homepage_sections WHERE section_type = $1',
      [sectionType]
    );
    if (rows.length === 0) return true; // Mặc định bật nếu chưa cấu hình
    return rows[0].is_active !== false;
  } catch (err) {
    console.error(`Check section ${sectionType} error:`, err);
    return true;
  }
};

/**
 * 1. GET /api/public/home/get-suggest-books
 * Lấy danh sách ấn phẩm được đề xuất cho người dùng
 */
exports.getSuggestBooks = async (req, res, next) => {
  try {
    if (!(await isSectionActive('SUGGEST'))) {
      return res.json({ success: true, data: [], message: "Section disabled by admin" });
    }
    const query = `
      SELECT id, title, cover_image as thumbnail, author, publication_year, dominant_color, is_digital
      FROM books
      WHERE status = 'available'
      ORDER BY (dominant_color IS NOT NULL) DESC, RANDOM()
      LIMIT 10
    `;
    const { rows } = await pool.query(query);
    res.json({ success: true, data: rows.map(r => ({ ...r, title: parseTitle(r) })) });
  } catch (error) { next(error); }
};

/**
 * 2. GET /api/public/home/get-updated-books
 * Lấy danh sách ấn phẩm mới cập nhật
 */
exports.getUpdatedBooks = async (req, res, next) => {
  try {
    if (!(await isSectionActive('UPDATED'))) {
      return res.json({ success: true, data: [], message: "Section disabled by admin" });
    }
    const query = `
      SELECT id, title, cover_image as thumbnail, author, publication_year, dominant_color, is_digital, created_at
      FROM books
      WHERE status = 'available'
      ORDER BY created_at DESC
      LIMIT 10
    `;
    const { rows } = await pool.query(query);
    res.json({ success: true, data: rows.map(r => ({ ...r, title: parseTitle(r) })) });
  } catch (error) { next(error); }
};

/**
 * 3. GET /api/public/home/get-most-viewed-books-of-the-week
 * Ấn phẩm được xem nhiều nhất trong tuần
 * (Tạm thời map với recent books hoặc random nếu chưa có tracking 'views')
 */
exports.getMostViewedBooksOfTheWeek = async (req, res, next) => {
  try {
    if (!(await isSectionActive('MOST_VIEWED'))) {
      return res.json({ success: true, data: [], message: "Section disabled by admin" });
    }
    // Nếu db có cột view_count (hoặc views) thì order by DESC.
    const query = `
      SELECT id, title, cover_image as thumbnail, author, publication_year, dominant_color, is_digital, views
      FROM books
      WHERE status = 'available'
      ORDER BY views DESC, RANDOM()
      LIMIT 10
    `;
    const { rows } = await pool.query(query);
    res.json({ success: true, data: rows.map(r => ({ ...r, title: parseTitle(r) })) });
  } catch (error) { next(error); }
};

/**
 * 4. GET /api/public/home/get-most-borrowed-documents
 * Ấn phẩm được mượn nhiều nhất
 */
exports.getMostBorrowedDocuments = async (req, res, next) => {
  try {
    if (!(await isSectionActive('MOST_BORROWED'))) {
      return res.json({ success: true, data: [], message: "Section disabled by admin" });
    }
    const query = `
      SELECT b.id, b.title, b.cover_image as thumbnail, b.author, b.publication_year, b.dominant_color, b.is_digital,
             COUNT(bl.id) as borrow_count
      FROM books b
      LEFT JOIN book_loans bl ON b.id = bl.book_id
      WHERE b.status = 'available'
      GROUP BY b.id, b.title, b.cover_image, b.author, b.publication_year, b.dominant_color, b.is_digital
      ORDER BY borrow_count DESC
      LIMIT 10
    `;
    const { rows } = await pool.query(query);
    res.json({ success: true, data: rows.map(r => ({ ...r, title: parseTitle(r) })) });
  } catch (error) { next(error); }
};

/**
 * 5. GET /api/public/home/get-top-favorite
 * Danh sách ấn phẩm nổi bật
 */
exports.getTopFavorite = async (req, res, next) => {
  try {
    if (!(await isSectionActive('FAVORITE'))) {
      return res.json({ success: true, data: [], message: "Section disabled by admin" });
    }
    // Ưu tiên sách số (is_digital) và sách mới nhất
    const query = `
      SELECT id, title, cover_image as thumbnail, author, publication_year, dominant_color, is_digital
      FROM books
      WHERE status = 'available'
      ORDER BY is_digital DESC, created_at DESC
      LIMIT 10
    `;
    const { rows } = await pool.query(query);
    res.json({ success: true, data: rows.map(r => ({ ...r, title: parseTitle(r) })) });
  } catch (error) { next(error); }
};

/**
 * 6. GET /api/public/home/get-top-recommend
 * Danh sách ấn phẩm đề cử (banner)
 */
exports.getTopRecommend = async (req, res, next) => {
  try {
    if (!(await isSectionActive('RECOMMEND'))) {
      return res.json({ success: true, data: [], message: "Section disabled by admin" });
    }
    const query = `
      SELECT id, title, cover_image as thumbnail, author, publication_year, dominant_color, is_digital, description
      FROM books
      WHERE status = 'available' AND dominant_color IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 5
    `;
    const { rows } = await pool.query(query);
    res.json({ 
      success: true, 
      data: rows.map(r => {
        let parsedDesc = r.description;
        if (typeof parsedDesc === 'string') {
          try {
            const temp = JSON.parse(parsedDesc);
            parsedDesc = temp.vi || temp.en || parsedDesc;
          } catch(e){}
        } else if (parsedDesc && parsedDesc.vi) {
           parsedDesc = parsedDesc.vi;
        }

        return { 
          ...r, 
          title: parseTitle(r),
          description: parsedDesc
        };
      }) 
    });
  } catch (error) { next(error); }
};

/**
 * Tổng hợp Data Hub (API gộp như trước, dành cho trường hợp dùng ít request)
 */
exports.getHomeData = async (req, res, next) => {
  // Logic cũ vẫn giữ để backward compatible
  return res.json({ success: true, message: "Use the singular endpoints for exact MS .NET matching: /get-suggest-books, /get-updated-books, etc." });
};
