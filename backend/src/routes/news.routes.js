const express = require('express');
const {
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
} = require('../controllers/news.controller');
const { validate, schemas } = require('../middlewares/validation.middleware');

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     News:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: Ra mắt nền tảng SFB Cloud mới
 *         excerpt:
 *           type: string
 *           example: Nền tảng SFB Cloud được nâng cấp với nhiều tính năng mới
 *         category:
 *           type: string
 *           example: Công nghệ
 *         categoryId:
 *           type: string
 *           example: tech
 *         categoryName:
 *           type: string
 *           example: Tin công nghệ
 *         status:
 *           type: string
 *           enum: [draft, published]
 *           example: draft
 *         imageUrl:
 *           type: string
 *           example: https://example.com/image.jpg
 *         author:
 *           type: string
 *           example: SFB Technology
 *         readTime:
 *           type: string
 *           example: 5 phút đọc
 *         gradient:
 *           type: string
 *           example: from-blue-600 to-cyan-600
 *         isFeatured:
 *           type: boolean
 *           example: true
 *         seoTitle:
 *           type: string
 *           example: Tiêu đề SEO cho bài viết
 *         seoDescription:
 *           type: string
 *           example: Mô tả SEO ngắn gọn về nội dung
 *         seoKeywords:
 *           type: string
 *           example: tu khoa 1, tu khoa 2
 *         link:
 *           type: string
 *           example: /news-detail
 *         publishedDate:
 *           type: string
 *           format: date
 *         content:
 *           type: string
 *           example: <p>Nội dung bài viết...</p>
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @openapi
 * /api/admin/news:
 *   get:
 *     tags:
 *       - News
 *     summary: Danh sách bài viết
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Lọc theo categoryId
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tiêu đề
 *     responses:
 *       200:
 *         description: Danh sách bài viết
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/News'
 */
router.get('/', getNews);

/**
 * @openapi
 * /api/admin/news/{id}:
 *   get:
 *     tags:
 *       - News
 *     summary: Chi tiết bài viết
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thông tin bài viết
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/News'
 *       404:
 *         description: Không tìm thấy bài viết
 */
router.get('/:id', validate(schemas.id, 'params'), getNewsById);

/**
 * @openapi
 * /api/admin/news:
 *   post:
 *     tags:
 *       - News
 *     summary: Tạo bài viết mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/News'
 *     responses:
 *       201:
 *         description: Đã tạo bài viết
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/News'
 */
router.post('/', validate(schemas.news, 'body'), createNews);

/**
 * @openapi
 * /api/admin/news/{id}:
 *   put:
 *     tags:
 *       - News
 *     summary: Cập nhật bài viết
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/News'
 *     responses:
 *       200:
 *         description: Đã cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/News'
 *       404:
 *         description: Không tìm thấy bài viết
 */
router.put('/:id', validate(schemas.id, 'params'), validate(schemas.news, 'body'), updateNews);

/**
 * @openapi
 * /api/admin/news/{id}:
 *   delete:
 *     tags:
 *       - News
 *     summary: Xóa bài viết
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Đã xóa
 *       404:
 *         description: Không tìm thấy bài viết
 */
router.delete('/:id', validate(schemas.id, 'params'), deleteNews);

module.exports = router;

