const { pool } = require('../config/database');

// Helper để tạo response chuẩn 7 trường
const sendResponse = (res, status, message, data = null, errors = null, pagination = null) => {
  const response = {
    code: status,
    success: status >= 200 && status < 300,
    message: message,
    data: data,
    errorId: null,
    appId: null,
    errors: errors
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(status).json(response);
};

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
      return sendResponse(res, 200, "Section disabled by admin", []);
    }
    const query = `
      SELECT id, title, cover_image as thumbnail, author, publication_year, dominant_color, is_digital
      FROM books
      WHERE status = 'available'
      ORDER BY (dominant_color IS NOT NULL) DESC, RANDOM()
      LIMIT 10
    `;
    const { rows } = await pool.query(query);
    return sendResponse(res, 200, "Lấy danh sách ấn phẩm đề xuất thành công", rows.map(r => ({ ...r, title: parseTitle(r) })));
  } catch (error) { next(error); }
};

/**
 * 2. GET /api/public/home/get-updated-books
 * Lấy danh sách ấn phẩm mới cập nhật
 */
exports.getUpdatedBooks = async (req, res, next) => {
  try {
    if (!(await isSectionActive('UPDATED'))) {
      return sendResponse(res, 200, "Section disabled by admin", []);
    }
    const query = `
      SELECT id, title, cover_image as thumbnail, author, publication_year, dominant_color, is_digital, created_at
      FROM books
      WHERE status = 'available'
      ORDER BY created_at DESC
      LIMIT 10
    `;
    const { rows } = await pool.query(query);
    return sendResponse(res, 200, "Lấy danh sách ấn phẩm mới nhất thành công", rows.map(r => ({ ...r, title: parseTitle(r) })));
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
      return sendResponse(res, 200, "Section disabled by admin", []);
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
    return sendResponse(res, 200, "Lấy danh sách xem nhiều nhất tuần thành công", rows.map(r => ({ ...r, title: parseTitle(r) })));
  } catch (error) { next(error); }
};

/**
 * 4. GET /api/public/home/get-most-borrowed-documents
 * Ấn phẩm được mượn nhiều nhất
 */
exports.getMostBorrowedDocuments = async (req, res, next) => {
  try {
    if (!(await isSectionActive('MOST_BORROWED'))) {
      return sendResponse(res, 200, "Section disabled by admin", []);
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
    return sendResponse(res, 200, "Lấy danh sách mượn nhiều nhất thành công", rows.map(r => ({ ...r, title: parseTitle(r) })));
  } catch (error) { next(error); }
};

/**
 * 5. GET /api/public/home/get-top-favorite
 * Danh sách ấn phẩm nổi bật
 */
exports.getTopFavorite = async (req, res, next) => {
  try {
    if (!(await isSectionActive('FAVORITE'))) {
      return sendResponse(res, 200, "Section disabled by admin", []);
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
    return sendResponse(res, 200, "Lấy danh sách yêu thích/nổi bật thành công", rows.map(r => ({ ...r, title: parseTitle(r) })));
  } catch (error) { next(error); }
};

/**
 * 6. GET /api/public/home/get-top-recommend
 * Danh sách ấn phẩm đề cử (banner)
 */
exports.getTopRecommend = async (req, res, next) => {
  try {
    if (!(await isSectionActive('RECOMMEND'))) {
      return sendResponse(res, 200, "Section disabled by admin", []);
    }
    const query = `
      SELECT id, title, cover_image as thumbnail, author, publication_year, dominant_color, is_digital, description
      FROM books
      WHERE status = 'available' AND dominant_color IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 5
    `;
    const { rows } = await pool.query(query);
    return sendResponse(res, 200, "Lấy danh sách đề cử (Banner) thành công", rows.map(r => {
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
    }));
  } catch (error) { next(error); }
};

/**
 * 7. GET /api/public/home/membership-plans
 * Khối Gói Hội Viên trên Trang Chủ — Trả danh sách gọn nhẹ, có phân trang
 */
exports.getMembershipPlans = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { rows } = await pool.query(`
      SELECT id, name, tier_code, slug, price, duration_days, description
      FROM membership_plans
      WHERE status = 'active'
      ORDER BY sort_order ASC, price ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*) FROM membership_plans WHERE status = 'active'"
    );
    const total = parseInt(countRows[0].count, 10);

    return sendResponse(res, 200, 'Danh sách gói hội viên', rows, null, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

/**
 * 8. GET /api/public/home/membership-plans/:id
 * Chi tiết Đặc Quyền gói hội viên — Chứa features[], max_books_borrowed, v.v.
 */
exports.getMembershipPlanDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        id, name, slug, tier_code, description, price, duration_days,
        late_fee_per_day, features, 
        max_books_borrowed, max_concurrent_courses, max_renewal_limit,
        discount_percentage, priority_support,
        allow_digital_read, allow_download,
        sort_order, status
      FROM membership_plans
      WHERE id = $1 AND status = 'active'
    `, [parseInt(id, 10)]);

    if (rows.length === 0) {
      return res.status(404).json({
        code: 404, success: false,
        message: 'Không tìm thấy gói hội viên hoặc gói đã bị vô hiệu hóa',
        data: null, errors: null
      });
    }

    return sendResponse(res, 200, 'Chi tiết gói hội viên', rows[0]);
  } catch (error) { next(error); }
};

/**
 * Tổng hợp Data Hub (API gộp như trước, dành cho trường hợp dùng ít request)
 */
exports.getHomeData = async (req, res, next) => {
  return sendResponse(res, 200, "Dữ liệu API Home", {
    endpoints: [
      "/get-suggest-books", 
      "/get-updated-books", 
      "/get-most-viewed-books-of-the-week", 
      "/get-most-borrowed-documents", 
      "/get-top-favorite", 
      "/get-top-recommend", 
      "/membership-plans", 
      "/membership-plans/:id"
    ]
  });
};
