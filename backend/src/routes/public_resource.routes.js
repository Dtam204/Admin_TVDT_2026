const express = require('express');
const router = express.Router();
const publicResourceController = require('../controllers/public_resource.controller');

/**
 * ROUTES: RESOURCE HUB (FINAL RECOVERY - PHASE 8) 
 * Cung cấp bộ 4 API chiến lược phục vụ giao diện Khám phá và Tài nguyên thư viện.
 * Tuân thủ phương thức POST và định nghĩa nghiệp vụ chuẩn xác của User.
 */

/**
 * @openapi
 * /api/public/resource/list:
 *   post:
 *     tags: [Resource Hub]
 *     summary: "Lấy danh sách tài nguyên"
 *     description: Truy vấn cấu trúc danh mục tài nguyên thư viện (Sách in, Sách số, Tra cứu) phục vụ hiển thị Tree-view hoặc danh sách Hub.
 *     responses:
 *       200:
 *         description: "Thành công"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 */
router.post('/list', publicResourceController.getResourceList);

/**
 * @openapi
 * /api/public/resource/list-tab:
 *   post:
 *     tags: [Resource Hub]
 *     summary: "Lấy danh sách tab header"
 *     description: Lấy danh sách các tab điều hướng trên Dashboard (các biểu tượng yêu thích, trending v.v ở dashboard).
 *     responses:
 *       200:
 *         description: "Thành công"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 */
router.post('/list-tab', publicResourceController.getResourceListTab);

/**
 * @openapi
 * /api/public/resource/trending:
 *   post:
 *     tags: [Resource Hub]
 *     summary: "Lấy danh sách tài nguyên theo top trending"
 *     description: Truy vấn danh sách tài nguyên (ấn phẩm) dựa trên tiêu chí top trending được lựa chọn trong api/resource/list-tab.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type: { type: string, enum: [trending, favorite, views, rating], description: "Loại tab xu hướng: trending, favorite, views, rating" }
 *               pageIndex: { type: integer, default: 1 }
 *               pageSize: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: "Thành công"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 */
router.post('/trending', publicResourceController.getTrendingItems);

/**
 * @openapi
 * /api/public/resource/alias:
 *   post:
 *     tags: [Resource Hub]
 *     summary: "Lấy danh sách tài nguyên theo alias"
 *     description: Truy vấn danh sách tài nguyên dựa trên định danh rút gọn (alias) được lấy từ api/list/resource.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [alias]
 *             properties:
 *               alias: { type: string, description: "Alias của chuyên mục hoặc bộ sưu tập" }
 *               pageIndex: { type: integer, default: 1 }
 *               pageSize: { type: integer, default: 10 }
 *               orderBy: { type: string, enum: [Id, NhanDe, TacGia, NamSanXuat, NhaXuatBan] }
 *     responses:
 *       200:
 *         description: "Thành công"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 */
router.post('/alias', publicResourceController.getDocumentsByAlias);

module.exports = router;
