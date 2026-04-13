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

const parseAuthor = (value) => {
  if (!value) return '';
  if (typeof value === 'object') {
    return value.vi || value.en || value.name || '';
  }
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) return '';
    try {
      const parsed = JSON.parse(normalized);
      if (parsed && typeof parsed === 'object') {
        return parsed.vi || parsed.en || parsed.name || normalized;
      }
    } catch (_) {
      // Non-JSON plain text author name
    }
    return normalized;
  }
  return String(value);
};

const parseText = (value, fallback = '') => {
  if (value == null) return fallback;
  if (typeof value === 'object') {
    return value.vi || value.en || value.name || fallback;
  }
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) return fallback;
    try {
      const parsed = JSON.parse(normalized);
      if (parsed && typeof parsed === 'object') {
        return parsed.vi || parsed.en || parsed.name || normalized;
      }
    } catch (_) {
      // plain string
    }
    return normalized;
  }
  return String(value);
};

const parseFeatures = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => parseText(item)).filter(Boolean);
  if (typeof value === 'object') return Object.values(value).map((item) => parseText(item)).filter(Boolean);
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) return [];
    try {
      const parsed = JSON.parse(normalized);
      if (Array.isArray(parsed)) return parsed.map((item) => parseText(item)).filter(Boolean);
      if (parsed && typeof parsed === 'object') return Object.values(parsed).map((item) => parseText(item)).filter(Boolean);
    } catch (_) {
      // fallback split by line/comma
    }
    return normalized.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const formatVnd = (amount) => {
  const n = Number(amount) || 0;
  return `${n.toLocaleString('vi-VN')}đ`;
};

const getPageParams = (req, defaultPageSize = 10, maxPageSize = 50) => {
  const pageIndex = Math.max(parseInt(req.query.pageIndex, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || defaultPageSize, 1), maxPageSize);
  const offset = (pageIndex - 1) * pageSize;
  return { pageIndex, pageSize, offset };
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
    const { pageSize, offset } = getPageParams(req, 10, 30);
    if (!(await isSectionActive('SUGGEST'))) {
      return sendResponse(res, 200, "Section disabled by admin", []);
    }
    const query = `
      SELECT b.id, b.title, b.cover_image as thumbnail,
             COALESCE(
               CASE
                 WHEN b.author IS NULL THEN NULL
                 WHEN TRIM(b.author) = '' THEN NULL
                 WHEN LOWER(TRIM(b.author)) IN ('nhiều tác giả', 'nhieu tac gia') THEN NULL
                 ELSE b.author
               END,
               (
                 SELECT a.name
                 FROM book_authors ba
                 JOIN authors a ON a.id = ba.author_id
                 WHERE ba.book_id = b.id
                 ORDER BY a.id ASC
                 LIMIT 1
               )
             ) as author,
             b.publication_year, b.pages, b.dominant_color, b.is_digital
      FROM books b
      WHERE b.status = 'available'
      ORDER BY (b.dominant_color IS NOT NULL) DESC, RANDOM()
      LIMIT $1 OFFSET $2
    `;
    const { rows } = await pool.query(query, [pageSize, offset]);
    return sendResponse(res, 200, "Lấy danh sách ấn phẩm đề xuất thành công", rows.map(r => ({ ...r, pages: Number(r.pages) || 0, title: parseTitle(r), author: parseAuthor(r.author) })));
  } catch (error) { next(error); }
};

/**
 * 2. GET /api/public/home/get-updated-books
 * Lấy danh sách ấn phẩm mới cập nhật
 */
exports.getUpdatedBooks = async (req, res, next) => {
  try {
    const { pageSize, offset } = getPageParams(req, 10, 30);
    if (!(await isSectionActive('UPDATED'))) {
      return sendResponse(res, 200, "Section disabled by admin", []);
    }
    const query = `
      SELECT b.id, b.title, b.cover_image as thumbnail,
             COALESCE(
               CASE
                 WHEN b.author IS NULL THEN NULL
                 WHEN TRIM(b.author) = '' THEN NULL
                 WHEN LOWER(TRIM(b.author)) IN ('nhiều tác giả', 'nhieu tac gia') THEN NULL
                 ELSE b.author
               END,
               (
                 SELECT a.name
                 FROM book_authors ba
                 JOIN authors a ON a.id = ba.author_id
                 WHERE ba.book_id = b.id
                 ORDER BY a.id ASC
                 LIMIT 1
               )
             ) as author,
             b.publication_year, b.dominant_color, b.is_digital, b.created_at
      FROM books b
      WHERE b.status = 'available'
      ORDER BY b.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const { rows } = await pool.query(query, [pageSize, offset]);
    return sendResponse(res, 200, "Lấy danh sách ấn phẩm mới nhất thành công", rows.map(r => ({ ...r, title: parseTitle(r), author: parseAuthor(r.author) })));
  } catch (error) { next(error); }
};

/**
 * 3. GET /api/public/home/get-most-viewed-books-of-the-week
 * Ấn phẩm được xem nhiều nhất trong tuần
 * (Tạm thời map với recent books hoặc random nếu chưa có tracking 'views')
 */
exports.getMostViewedBooksOfTheWeek = async (req, res, next) => {
  try {
    const { pageSize, offset } = getPageParams(req, 10, 30);
    if (!(await isSectionActive('MOST_VIEWED'))) {
      return sendResponse(res, 200, "Section disabled by admin", []);
    }
    const query = `
      SELECT b.id, b.title, b.cover_image as thumbnail,
             COALESCE(
               CASE
                 WHEN b.author IS NULL THEN NULL
                 WHEN TRIM(b.author) = '' THEN NULL
                 WHEN LOWER(TRIM(b.author)) IN ('nhiều tác giả', 'nhieu tac gia') THEN NULL
                 ELSE b.author
               END,
               (
                 SELECT a.name
                 FROM book_authors ba
                 JOIN authors a ON a.id = ba.author_id
                 WHERE ba.book_id = b.id
                 ORDER BY a.id ASC
                 LIMIT 1
               )
             ) as author,
             b.publication_year, b.dominant_color, b.is_digital,
             (
               SELECT COUNT(*)
               FROM interaction_logs il
               WHERE il.object_id = b.id AND il.action_type = 'view'
             )::int as views
      FROM books b
      WHERE b.status = 'available'
      ORDER BY views DESC, b.id DESC
      LIMIT $1 OFFSET $2
    `;
    const { rows } = await pool.query(query, [pageSize, offset]);
    return sendResponse(res, 200, "Lấy danh sách xem nhiều nhất tuần thành công", rows.map(r => ({ ...r, title: parseTitle(r), author: parseAuthor(r.author) })));
  } catch (error) { next(error); }
};

/**
 * 4. GET /api/public/home/get-most-borrowed-documents
 * Ấn phẩm được mượn nhiều nhất
 */
exports.getMostBorrowedDocuments = async (req, res, next) => {
  try {
    const { pageSize, offset } = getPageParams(req, 10, 30);
    if (!(await isSectionActive('MOST_BORROWED'))) {
      return sendResponse(res, 200, "Section disabled by admin", []);
    }
    const query = `
      SELECT b.id, b.title, b.cover_image as thumbnail,
             COALESCE(
               CASE
                 WHEN b.author IS NULL THEN NULL
                 WHEN TRIM(b.author) = '' THEN NULL
                 WHEN LOWER(TRIM(b.author)) IN ('nhiều tác giả', 'nhieu tac gia') THEN NULL
                 ELSE b.author
               END,
               (
                 SELECT a.name
                 FROM book_authors ba
                 JOIN authors a ON a.id = ba.author_id
                 WHERE ba.book_id = b.id
                 ORDER BY a.id ASC
                 LIMIT 1
               )
             ) as author,
             b.publication_year, b.dominant_color, b.is_digital,
             COUNT(bl.id) as borrow_count
      FROM books b
      LEFT JOIN book_loans bl ON b.id = bl.book_id
      WHERE b.status = 'available'
      GROUP BY b.id, b.title, b.cover_image, b.author, b.publication_year, b.dominant_color, b.is_digital
      ORDER BY borrow_count DESC
      LIMIT $1 OFFSET $2
    `;
    const { rows } = await pool.query(query, [pageSize, offset]);
    return sendResponse(res, 200, "Lấy danh sách mượn nhiều nhất thành công", rows.map(r => ({ ...r, title: parseTitle(r), author: parseAuthor(r.author) })));
  } catch (error) { next(error); }
};

/**
 * 5. GET /api/public/home/get-top-favorite
 * Danh sách ấn phẩm nổi bật
 */
exports.getTopFavorite = async (req, res, next) => {
  try {
    const { pageSize, offset } = getPageParams(req, 10, 30);
    if (!(await isSectionActive('FAVORITE'))) {
      return sendResponse(res, 200, "Section disabled by admin", []);
    }
    // Ưu tiên sách số (is_digital) và sách mới nhất
    const query = `
      SELECT b.id, b.title, b.cover_image as thumbnail,
             COALESCE(
               CASE
                 WHEN b.author IS NULL THEN NULL
                 WHEN TRIM(b.author) = '' THEN NULL
                 WHEN LOWER(TRIM(b.author)) IN ('nhiều tác giả', 'nhieu tac gia') THEN NULL
                 ELSE b.author
               END,
               (
                 SELECT a.name
                 FROM book_authors ba
                 JOIN authors a ON a.id = ba.author_id
                 WHERE ba.book_id = b.id
                 ORDER BY a.id ASC
                 LIMIT 1
               )
             ) as author,
             b.publication_year, b.dominant_color, b.is_digital
      FROM books b
      WHERE b.status = 'available'
      ORDER BY b.is_digital DESC, b.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const { rows } = await pool.query(query, [pageSize, offset]);
    return sendResponse(res, 200, "Lấy danh sách yêu thích/nổi bật thành công", rows.map(r => ({ ...r, title: parseTitle(r), author: parseAuthor(r.author) })));
  } catch (error) { next(error); }
};

/**
 * 6. GET /api/public/home/get-top-recommend
 * Danh sách ấn phẩm đề cử (banner)
 */
exports.getTopRecommend = async (req, res, next) => {
  try {
    const { pageSize, offset } = getPageParams(req, 5, 20);
    if (!(await isSectionActive('RECOMMEND'))) {
      return sendResponse(res, 200, "Section disabled by admin", []);
    }
    const query = `
      SELECT b.id, b.title, b.cover_image as thumbnail,
             COALESCE(
               CASE
                 WHEN b.author IS NULL THEN NULL
                 WHEN TRIM(b.author) = '' THEN NULL
                 WHEN LOWER(TRIM(b.author)) IN ('nhiều tác giả', 'nhieu tac gia') THEN NULL
                 ELSE b.author
               END,
               (
                 SELECT a.name
                 FROM book_authors ba
                 JOIN authors a ON a.id = ba.author_id
                 WHERE ba.book_id = b.id
                 ORDER BY a.id ASC
                 LIMIT 1
               )
             ) as author,
             b.publication_year, b.dominant_color, b.is_digital, b.description
      FROM books b
      WHERE b.status = 'available' AND b.dominant_color IS NOT NULL
      ORDER BY b.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const { rows } = await pool.query(query, [pageSize, offset]);
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
        author: parseAuthor(r.author),
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

    const plan = rows[0];
    const rawFeatures = parseFeatures(plan.features);
    const price = Number(plan.price) || 0;
    const durationDays = Number(plan.duration_days) || 30;
    const pricePerDay = durationDays > 0 ? Math.round(price / durationDays) : price;

    const benefitCards = [
      {
        key: 'borrow_limit',
        label: 'Sách mượn',
        value: Number(plan.max_books_borrowed) || 0,
        unit: 'quyển',
        icon: 'books',
        highlight: true,
      },
      {
        key: 'renewal_limit',
        label: 'Lần gia hạn',
        value: Number(plan.max_renewal_limit) || 0,
        unit: 'lần',
        icon: 'refresh',
        highlight: true,
      },
      {
        key: 'digital_read',
        label: 'Đọc tài liệu số',
        value: plan.allow_digital_read ? 'Có' : 'Không',
        unit: null,
        icon: 'read',
        highlight: !!plan.allow_digital_read,
      },
      {
        key: 'download',
        label: 'Tải offline',
        value: plan.allow_download ? 'Có' : 'Không',
        unit: null,
        icon: 'download',
        highlight: !!plan.allow_download,
      },
      {
        key: 'priority_support',
        label: 'Hỗ trợ ưu tiên',
        value: plan.priority_support ? 'Có' : 'Không',
        unit: null,
        icon: 'support',
        highlight: !!plan.priority_support,
      },
      {
        key: 'discount',
        label: 'Ưu đãi phí',
        value: Number(plan.discount_percentage) || 0,
        unit: '%',
        icon: 'discount',
        highlight: (Number(plan.discount_percentage) || 0) > 0,
      },
      {
        key: 'late_fee',
        label: 'Phí trễ hạn',
        value: Number(plan.late_fee_per_day) || 0,
        unit: 'đ/ngày',
        icon: 'warning',
        highlight: false,
      },
    ];

    const synthesizedFeatures = [
      `Mượn tối đa ${Number(plan.max_books_borrowed) || 0} sách cùng lúc`,
      `Gia hạn tối đa ${Number(plan.max_renewal_limit) || 0} lần`,
      plan.allow_digital_read ? 'Được đọc tài liệu số trực tuyến' : null,
      plan.allow_download ? 'Được tải tài liệu để đọc offline' : null,
      plan.priority_support ? 'Ưu tiên hỗ trợ khi cần trợ giúp' : null,
      (Number(plan.discount_percentage) || 0) > 0 ? `Giảm ${Number(plan.discount_percentage)}% một số dịch vụ` : null,
    ].filter(Boolean);

    const features = rawFeatures.length > 0 ? rawFeatures : synthesizedFeatures;

    const designedPayload = {
      ...plan,
      name: parseText(plan.name, 'Gói hội viên'),
      description: parseText(plan.description, ''),
      features,
      summary: {
        title: parseText(plan.name, 'Gói hội viên'),
        subtitle: parseText(plan.description, 'Nâng cấp để mở rộng quyền lợi đọc và mượn tài liệu.'),
        tier_code: plan.tier_code,
      },
      pricing: {
        amount: price,
        currency: 'VND',
        duration_days: durationDays,
        formatted_price: formatVnd(price),
        formatted_period: `${durationDays} ngày`,
        price_per_day: pricePerDay,
        formatted_price_per_day: `${formatVnd(pricePerDay)}/ngày`,
      },
      benefit_cards: benefitCards,
      highlight_features: features.slice(0, 6),
      cta: {
        primary_text: 'Nâng cấp ngay',
        secondary_text: 'Xem thêm quyền lợi',
        note: 'Quyền lợi được kích hoạt ngay sau khi thanh toán thành công.',
      },
    };

    return sendResponse(res, 200, 'Chi tiết gói hội viên', designedPayload);
  } catch (error) { next(error); }
};

/**
 * Tổng hợp Data Hub (API gộp như trước, dành cho trường hợp dùng ít request)
 */
exports.getHomeData = async (req, res, next) => {
  return sendResponse(res, 200, "Dữ liệu API Home", {
    total_endpoints: 9,
    endpoints: [
      "/",
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
