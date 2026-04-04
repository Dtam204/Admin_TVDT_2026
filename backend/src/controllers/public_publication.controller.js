/**
 * Controller xử lý các yêu cầu công khai liên quan đến Ấn phẩm (Sách, tài liệu số)
 * CHUẨN HÓA RESTFUL CHUYÊN NGHIỆP CHO MOBILE APP
 */

const PublicationService = require('../services/admin/publication.service');
const { pool } = require('../config/database');

/**
 * Lấy danh sách ấn phẩm (Tìm kiếm & Phân trang)
 */
exports.getPublications = async (req, res, next) => {
  try {
    const { 
      search, category, page = 1, limit = 10, is_digital,
      title, author, publisher_id, year_from, year_to, language, subject,
      sort_by, order, media_type
    } = req.query;
    
    const results = await PublicationService.getAll({ 
      page, limit, search, is_digital, 
      collection_id: category,
      status: 'available',
      cooperation_status: 'cooperating',
      title, author, publisher_id, year_from, year_to, language, subject,
      sort_by, order,
      media_type: media_type || (is_digital === 'true' ? 'Digital' : 'all')
    });

    return res.json({
      success: true,
      message: "Lấy danh sách ấn phẩm thành công",
      code: 0,
      data: results.publications,
      pagination: results.pagination
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Lấy chi tiết ấn phẩm và tăng view tự động
 */
exports.getPublicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userId = null;
    let readerTier = 'basic';

    // 1. Giải mã Token để lấy thông tin cá nhân hóa (nếu có)
    if (token) {
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        userId = decoded.sub || decoded.id;
        readerTier = decoded.tierCode || 'basic';
      } catch (e) {
        // Token không lệ -> Khách vãng lai
      }
    }

    // 2. Tự động ghi nhận lượt xem (view)
    try {
      await pool.query(
        'INSERT INTO interaction_logs (object_id, action_type, member_id, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
        [id, 'view', userId]
      );
    } catch (e) {
      console.warn("Lỗi ghi log lượt xem:", e.message);
    }

    // 3. Lấy chi tiết từ Service (Đã bao gồm tương tác cá nhân)
    const pub = await PublicationService.getPublicationDetail(id, userId);
    if (!pub) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy ấn phẩm trên hệ thống", 
        code: 404 
      });
    }

    // 4. Kiểm tra quyền truy cập Policy
    const tierRank = { basic: 1, premium: 2, vip: 3 };
    const reqRank = tierRank[pub.access_policy?.toLowerCase() || 'basic'] || 1;
    const userRank = tierRank[readerTier.toLowerCase() || 'basic'] || 1;
    const canRead = (pub.access_policy === 'basic') || (token && userRank >= reqRank);

    return res.json({ 
      success: true, 
      message: "Lấy thông tin chi tiết ấn phẩm thành công", 
      code: 0, 
      data: {
        ...pub,
        canRead
      } 
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Lấy các bản sao (copies) của ấn phẩm để mượn (Physical Books)
 */
exports.getPublicationCopies = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT pc.id, pc.barcode, pc.copy_number, pc.price, pc.status, pc.condition,
             sl.name as storage_name
      FROM publication_copies pc
      LEFT JOIN storage_locations sl ON pc.storage_location_id = sl.id
      WHERE pc.publication_id = $1 
      ORDER BY pc.copy_number ASC
    `;
    const { rows } = await pool.query(query, [id]);
    
    return res.json({ 
      success: true, 
      message: "Lấy danh sách các bản sao sách in thành công", 
      code: 0, 
      data: rows 
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Lấy tóm tắt AI cho ấn phẩm
 */
exports.summarizePublication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pub = await PublicationService.getPublicationDetail(id);
    if (!pub) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy nội dung để tóm tắt", 
        code: 404 
      });
    }

    const summary = pub.ai_summary || `Hệ thống AI đang phân tích nội dung cho ấn phẩm "${pub.title?.vi || pub.title}".`;
    
    return res.json({ 
      success: true, 
      message: "Cung cấp tóm tắt AI thành công",
      data: summary, 
      code: 0
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Lấy dữ liệu Trang chủ thực tế (Banner, Trending, Newest)
 */
exports.getHomePageData = async (req, res, next) => {
  try {
    // 1. Ấn phẩm mới nhất
    const newest = await PublicationService.getAll({ 
      page: 1, limit: 10, status: 'available', cooperation_status: 'cooperating' 
    });
    
    // 2. Ấn phẩm nổi bật / Trending
    const trending = await PublicationService.getAll({ 
      page: 1, limit: 10, status: 'available', cooperation_status: 'cooperating' 
    });

    const banners = trending.slice(0, 5).map(p => ({
      id: p.id,
      title: p.title?.vi || p.title,
      image: p.thumbnail,
      dominantColor: p.dominant_color || '#4f46e5'
    }));

    // 3. Danh mục nổi bật
    const categories = [
      { id: "col-01", name: "Công nghệ thông tin", icon: "laptop" },
      { id: "col-02", name: "Kinh tế", icon: "trending-up" },
      { id: "col-03", name: "Văn học", icon: "book-open" },
      { id: "col-04", name: "Kỹ năng sống", icon: "users" }
    ];

    return res.json({
      success: true,
      message: "Lấy dữ liệu trang chủ thành công",
      code: 0,
      data: {
        banners,
        trending,
        newest,
        categories
      }
    });
  } catch (error) {
    return next(error);
  }
};
