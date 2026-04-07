/**
 * Public Resource Controller - Mobile Hub (FINAL RECOVERY - PHASE 8)
 * Khôi phục chính xác bộ 4 Endpoints chiến lược theo thiết kế của User.
 * Bổ sung mục "Tra cứu thông tin" vào Tree-view theo yêu cầu.
 * Tuân thủ POST method và cấu trúc 7 trường Item: id, nhanDe, tacGia, anhDaiDien, namXuatBan, nhaXuatBan, trang.
 */

const { pool } = require('../config/database');
const PublicationService = require('../services/admin/publication.service');

/**
 * Phản hồi thành công chuẩn hệ thống (7 trường Response Base)
 */
const sendSuccess = (res, data, message = "Thao tác thành công", status = 200) => res.status(status).json({
  code: 0,
  errorId: null,
  appId: null,
  success: true,
  message,
  data,
  errors: null
});

/**
 * Helper: Ánh xạ 7 trường Item chuẩn Mobile App
 */
const mapToMobileItem = (p) => ({
  id: p.id,
  nhanDe: p.title,
  tacGia: p.author,
  anhDaiDien: p.thumbnail,
  namXuatBan: p.publication_year,
  nhaXuatBan: p.publisher_name,
  trang: p.pages || 0
});

/**
 * @desc [ENDPOINT 1] POST /api/Resource/list
 * Lấy danh sách tài nguyên (Kèm mục Tra cứu thông tin chuyên sâu)
 */
exports.getResourceList = async (req, res, next) => {
  try {
    const resourceTree = [
      {
        label: "Tài liệu in", value: "print-hub", icon: "fa fa-book",
        children: [{ label: "Tất cả tài nguyên", value: "print-all", icon: "fa fa-folder" }]
      },
      {
        label: "Tài nguyên số", value: "digital-hub", icon: "fa fa-database",
        children: [{ label: "Tất cả tài nguyên", value: "e-all", icon: "fa fa-folder" }]
      },
      {
        label: "Phân loại theo chủ đề", value: "category-hub", icon: "fa fa-tags",
        children: [{ label: "Theo chủ đề", value: "category-all", icon: "fa fa-list" }]
      },
      {
        label: "Tra cứu thông tin",
        value: null,
        router: null,
        icon: "fa fa-search",
        children: [
          {
            label: "Tìm kiếm cơ bản",
            value: "search-basic",
            router: "search?type=basic",
            icon: "fa fa-search",
            children: null
          },
          {
            label: "Tìm kiếm nâng cao",
            value: "search-advance",
            router: "search?type=advance",
            icon: "fa fa-filter",
            children: null
          },
          {
            label: "Quét QR/ ISBN",
            value: "search-qr",
            router: "search?type=qr",
            icon: "fa fa-qr",
            children: null
          }
        ]
      }
    ];
    return sendSuccess(res, resourceTree, "Lấy danh sách tài nguyên thành công");
  } catch (error) { next(error); }
};

/**
 * @desc [ENDPOINT 2] POST /api/Resource/list-tab
 * Lấy danh sách tab header (Các biểu tượng/loại khám phá ở Dashboard)
 */
exports.getResourceListTab = async (req, res, next) => {
  try {
    const tabs = [
      { id: "trending", label: "Xu hướng", icon: "trending-up", type: "trending" },
      { id: "favorite", label: "Yêu thích", icon: "heart", type: "favorite" },
      { id: "views", label: "Xem nhiều", icon: "eye", type: "views" },
      { id: "rated", label: "Đánh giá cao", icon: "star", type: "rating" }
    ];
    return sendSuccess(res, tabs, "Lấy danh sách tab header thành công");
  } catch (error) { next(error); }
};

/**
 * @desc [ENDPOINT 3] POST /api/Resource/trending
 * Lấy danh sách tài nguyên theo top trending (ĐÚNG ĐỦ 7 TRƯỜNG ITEM)
 */
exports.getTrendingItems = async (req, res, next) => {
  try {
    const { type = 'trending', pageIndex = 1, pageSize = 10 } = req.body;
    const limit = parseInt(pageSize);

    const results = await PublicationService.getAll({
      page: parseInt(pageIndex),
      limit,
      sort_by: type === 'trending' ? 'interest' : (type === 'favorite' ? 'favorites' : (type === 'rating' ? 'rating' : 'views')),
      order: 'DESC'
    });

    const data = {
      items: (results.publications || []).map(mapToMobileItem),
      totalRecords: results.pagination.total,
      pageIndex: parseInt(pageIndex),
      pageSize: limit,
      totalPages: results.pagination.totalPages
    };

    return sendSuccess(res, data, `Lấy danh sách tài nguyên theo ${type} thành công`);
  } catch (error) { next(error); }
};

/**
 * @desc [ENDPOINT 4] POST /api/Resource/alias
 * Lấy danh sách tài nguyên theo alias (ĐÚNG ĐỦ 7 TRƯỜNG ITEM)
 */
exports.getDocumentsByAlias = async (req, res, next) => {
  try {
    const { alias, pageIndex = 1, pageSize = 10, orderBy } = req.body;
    const limit = parseInt(pageSize), offset = (parseInt(pageIndex) - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params = [];
    let pIdx = 1;

    if (alias === 'print-all') {
      whereClause += " AND (media_type = 'Physical' OR is_digital = false)";
    } else if (alias === 'e-all') {
      whereClause += " AND (media_type = 'Digital' OR is_digital = true)";
    } else if (alias && alias !== 'category-all') {
      params.push(alias);
      whereClause += ` AND (slug = $${pIdx++}::text)`; 
    }

    const sortMapping = { 'NhanDe': 'title', 'TacGia': 'author', 'NamSanXuat': 'publication_year', 'NhaXuatBan': 'publisher_name', 'Id': 'id' };
    const sortColumn = sortMapping[orderBy] || 'id';
    const orderSql = `ORDER BY ${sortColumn} DESC`;

    const { rows: countRows } = await pool.query(`SELECT COUNT(*) FROM books ${whereClause}`, params);
    const totalRecords = parseInt(countRows[0].count);

    const { rows } = await pool.query(`
      SELECT id, thumbnail as "anhDaiDien", title as "nhanDe", author as "tacGia", 
             publisher_name as "nhaXuatBan", pages as "trang", publication_year as "namXuatBan"
      FROM books ${whereClause} ${orderSql} LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `, [...params, limit, offset]);

    return sendSuccess(res, {
      items: rows, totalRecords, pageIndex: parseInt(pageIndex), pageSize: limit, 
      totalPages: Math.ceil(totalRecords / limit)
    }, "Lấy danh sách tài nguyên theo alias thành công");
  } catch (error) { next(error); }
};
