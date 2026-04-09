/**
 * Controller chuyên biệt xử lý Tra cứu tài liệu cho Mobile App
 * CHUẨN HÓA: Phân tách luồng Tìm kiếm và Quét mã chuyên nghiệp.
 */

const PublicationService = require('../services/admin/publication.service');
const { pool } = require('../config/database');

// Helper để tạo response chuẩn 7 trường
const sendResponse = (res, status, message, data = null, errors = null, pagination = null) => {
  const response = {
    code: status >= 200 && status < 300 ? 0 : status,
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
 * Tìm kiếm Cơ bản & Nâng cao
 * GET /api/public/search/publications
 */
exports.searchPublications = async (req, res, next) => {
  try {
    const { 
      search, title, author, year, years, year_from, year_to,
      publisher_id, media_type, sort_by = 'default', order = 'DESC',
      page = 1, limit = 10 
    } = req.query;

    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const results = await PublicationService.getAll({
      page: safePage, limit: safeLimit, search,
      title, author, year, years, year_from, year_to,
      publisher_id, media_type,
      sort_by, order,
      status: 'available',
      cooperation_status: 'cooperating'
    });

    return sendResponse(res, 200, "Tìm kiếm ấn phẩm thành công", results.publications, null, results.pagination);
  } catch (error) {
    return next(error);
  }
};

/**
 * Tìm kiếm theo mã (Barcode/QR Code)
 * GET /api/public/search/barcode/:barcode
 */
exports.searchByBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.params;
    
    // 1. Tìm publicationId từ barcode
    const q = `SELECT publication_id FROM publication_copies WHERE barcode = $1 LIMIT 1`;
    const { rows } = await pool.query(q, [barcode]);
    
    if (rows.length === 0) {
      return sendResponse(res, 404, "Mã vạch không tồn tại hoặc chưa được cập nhật", null, ["Barcode not found"]);
    }
    
    // 2. Lấy Full Detail để App hiển thị ngay màn hình chi tiết
    const publicationId = rows[0].publication_id;
    const pub = await PublicationService.getPublicationDetail(publicationId);

    return sendResponse(res, 200, "Đã tìm thấy ấn phẩm theo mã định danh", pub);
  } catch (error) {
    return next(error);
  }
};
