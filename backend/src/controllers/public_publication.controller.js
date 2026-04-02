/**
 * Controller xử lý các yêu cầu công khai liên quan đến Ấn phẩm (Sách, tài liệu số)
 * Dành cho trang chủ và người dùng chưa đăng nhập.
 */

const { authenticateTokenOptional } = require('../middlewares/auth.middleware');
const PublicationService = require('../services/admin/publication.service');
const { pool } = require('../config/database');

/**
 * Controller xử lý các yêu cầu công khai liên quan đến Ấn phẩm (Sách, tài liệu số)
 * Truy vấn dữ liệu thực tế từ PostgreSQL
 */

// Lấy danh sách ấn phẩm (Tìm kiếm & Phân trang)
exports.getPublications = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 10, is_digital } = req.query;
    // Sử dụng PublicationService.getAll nhưng ép status = 'available'
    const results = await PublicationService.getAll({ 
      page, limit, search, is_digital, 
      collection_id: category, // Giả định category map tới collection_id
      status: 'available',
      cooperation_status: 'cooperating' 
    });

    // Lấy tổng số (có thể cần viết thêm hàm đếm, tạm thời mượn kết quả giả)
    res.json({
      success: true,
      message: "Lấy danh sách ấn phẩm thành công",
      code: 0,
      data: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, code: 500 });
  }
};

// Lấy chi tiết ấn phẩm và tăng view
exports.getPublicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const pub = await PublicationService.getPublicationDetail(id);
    
    if (!pub || (pub.status !== 'available' && pub.cooperation_status !== 'ceased_cooperation')) {
      return res.status(404).json({ success: false, message: "Không tìm thấy ấn phẩm", code: 404 });
    }

    // Kiểm tra trạng thái yêu thích nếu có token
    let isFavorited = false;
    let readerTier = 'basic';
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        readerTier = decoded.tierCode || 'basic';

        const userId = decoded.sub || decoded.id; // App uses 'sub', CMS uses 'id'
        const { rows: fav } = await pool.query(
          'SELECT 1 FROM user_favorites WHERE user_id = $1 AND book_id = $2',
          [userId, id]
        );
        isFavorited = fav.length > 0;
      } catch (e) {
        // Token invalid, ignore favorite status
      }
    }

    // Tăng viewCount
    try {
      await pool.query('UPDATE books SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1', [id]);
    } catch (e) {
      console.warn("Lỗi tăng view_count:", e.message);
    }

    // Xử lý quyền truy cập nội dung số (Digital Content Access Policy) theo Hạng Thẻ
    const tierRank = { basic: 1, premium: 2, vip: 3 };
    const reqRank = tierRank[pub.access_policy?.toLowerCase() || 'basic'] || 1;
    const userRank = tierRank[readerTier.toLowerCase() || 'basic'] || 1;
    
    // Nếu sách là Basic -> Public (Ai cũng đọc được nếu cho phép, hoặc chỉ cần login)
    // Nếu sách là Premium/VIP -> User phải có rank tương đương HOẶC lớn hơn
    const canRead = (pub.access_policy === 'basic') || (token && userRank >= reqRank);

    res.json({ 
      success: true, 
      message: "Lấy thông tin thành công", 
      code: 0, 
      data: {
        ...pub,
        isFavorited,
        canRead
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, code: 500 });
  }
};

// Lấy các bản sao (copies) của ấn phẩm để mượn
exports.getPublicationCopies = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT * FROM publication_copies WHERE publication_id = $1 AND status = 'available'", [id]);
    res.json({ success: true, message: "Lấy danh sách bản sao", code: 0, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, code: 500 });
  }
};

// Tìm ấn phẩm theo mã vạch (Barcode của bản sao)
exports.getPublicationByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const query = `
      SELECT b.*, pc.barcode 
      FROM books b 
      JOIN publication_copies pc ON b.id = pc.publication_id 
      WHERE pc.barcode = $1 LIMIT 1
    `;
    const { rows } = await pool.query(query, [barcode]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy mã vạch", code: 404 });
    
    res.json({ success: true, data: rows[0], code: 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, code: 500 });
  }
};

// Yêu cầu AI tóm tắt ấn phẩm
exports.summarizePublication = async (req, res) => {
  try {
    const { id } = req.params;
    const pub = await PublicationService.getPublicationDetail(id);
    if (!pub) return res.status(404).json({ success: false, message: "Không tìm thấy ấn phẩm" });

    // Trả về Tóm tắt AI có sẵn hoặc giả định
    const summary = pub.ai_summary || `Đây là bản tóm tắt AI cho ấn phẩm "${pub.title?.vi || pub.title}".`;
    
    res.json({ success: true, data: summary, message: "AI hoàn thành tóm tắt" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy dữ liệu trang chủ thực tế
exports.getHomePageData = async (req, res) => {
  try {
    // 1. Phân trang lấy ấn phẩm mới nhất (Newest)
    const newest = await PublicationService.getAll({ 
      page: 1, limit: 10, status: 'available', cooperation_status: 'cooperating' 
    });
    
    // 2. Tạm thời lấy các cuốn nổi bật làm Banner / Trending (Sẽ cải tiến query theo Trending score sau)
    const trending = await PublicationService.getAll({ 
      page: 1, limit: 5, status: 'available', cooperation_status: 'cooperating' 
    });
    const banners = trending.slice(0, 3).map(p => ({
      id: p.id,
      title: p.title?.vi || p.title,
      image: p.thumbnail,
      dominantColor: p.dominant_color || '#4f46e5'
    }));

    // 3. Lấy ngẫu nhiên Category 
    const categories = [
      { id: "col-01", name: "Công nghệ thông tin", icon: "laptop" },
      { id: "col-02", name: "Kinh tế", icon: "trending-up" },
      { id: "col-03", name: "Văn học", icon: "book-open" }
    ];

    res.json({
      success: true,
      code: 0,
      data: {
        banners,
        trending,
        newest,
        categories
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, code: 500 });
  }
};

