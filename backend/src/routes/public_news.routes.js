const express = require('express');
const { getPublicNews, getPublicNewsDetail } = require('../controllers/public_news.controller');

const router = express.Router();

/**
 * @openapi
 * /api/public/news:
 *   get:
 *     tags: [Public News]
 *     summary: "Danh sách tin tức / bài viết cho người đọc"
 *     description: |
 *       Lấy danh sách tin tức đã xuất bản (status=published) dành cho Mobile App và Reader Portal.
 *       Hỗ trợ lọc theo từ khóa, danh mục và phân trang.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: "Từ khóa tìm kiếm trong tiêu đề và nội dung"
 *       - in: query
 *         name: category_id
 *         schema: { type: integer }
 *         description: "Lọc theo danh mục tin tức"
 *       - in: query
 *         name: featured
 *         schema: { type: boolean }
 *         description: "Chỉ lấy bài viết nổi bật (is_featured=true)"
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: "Danh sách tin tức đã xuất bản"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/News' }
 *                         totalRecords: { type: integer, example: 50 }
 *                         pageIndex: { type: integer, example: 1 }
 *                         pageSize: { type: integer, example: 10 }
 *       500:
 *         description: "Lỗi hệ thống"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/', getPublicNews);

/**
 * @openapi
 * /api/public/news/{slug}:
 *   get:
 *     tags: [Public News]
 *     summary: "Chi tiết bài viết theo slug"
 *     description: |
 *       Lấy toàn bộ nội dung chi tiết một bài viết tin tức dựa trên slug hoặc ID.
 *       Dùng cho màn hình **Chi tiết Tin tức** trên Mobile App.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *         description: "Slug hoặc ID của bài viết"
 *     responses:
 *       200:
 *         description: "Nội dung chi tiết bài viết"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/News'
 *                         - type: object
 *                           properties:
 *                             content: { type: string, description: "Nội dung HTML đầy đủ" }
 *                             author: { type: string }
 *                             category_name: { type: string }
 *       404:
 *         description: "Không tìm thấy bài viết"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/:slug', getPublicNewsDetail);

module.exports = router;
