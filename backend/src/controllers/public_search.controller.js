/**
 * Controller chuyên biệt xử lý Tra cứu tài liệu cho Mobile App
 * CHUẨN HÓA: Phân tách luồng Tìm kiếm và Quét mã chuyên nghiệp.
 */

const PublicationService = require('../services/admin/publication.service');
const { pool } = require('../config/database');

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

    const results = await PublicationService.getAll({
      page, limit, search,
      title, author, year, years, year_from, year_to,
      publisher_id, media_type,
      sort_by, order,
      status: 'available',
      cooperation_status: 'cooperating'
    });

    return res.json({
      success: true,
      message: "Tìm kiếm ấn phẩm thành công",
      code: 0,
      data: results.publications,
      pagination: results.pagination
    });
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
      return res.status(404).json({ 
        success: false, 
        message: "Mã vạch không tồn tại hoặc chưa được cập nhật", 
        code: 404 
      });
    }
    
    // 2. Lấy Full Detail để App hiển thị ngay màn hình chi tiết
    const publicationId = rows[0].publication_id;
    const pub = await PublicationService.getPublicationDetail(publicationId);

    return res.json({ 
      success: true, 
      message: "Đã tìm thấy ấn phẩm theo mã định danh",
      data: pub, 
      code: 0 
    });
  } catch (error) {
    return next(error);
  }
};
