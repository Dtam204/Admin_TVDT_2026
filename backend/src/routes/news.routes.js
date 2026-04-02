const express = require('express');
const {
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  updateNewsStatus,
  toggleNewsFeatured,
} = require('../controllers/news.controller');
const { validate, schemas } = require('../middlewares/validation.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/news:
 *   get:
 *     tags: [Admin News]
 *     summary: Danh sách bài viết
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: 'integer', default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: 'integer', default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: 'string', enum: [draft, published] }
 *       - in: query
 *         name: category
 *         schema: { type: 'string' }
 *         description: Lọc theo categoryId
 *       - in: query
 *         name: search
 *         schema: { type: 'string' }
 *         description: Tìm theo tiêu đề
 *     responses:
 *       200:
 *         description: Danh sách bài viết
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: 'array', items: { $ref: '#/components/schemas/News' } }
 *                     pagination: { $ref: '#/components/schemas/Pagination' }
 *   post:
 *     tags: [Admin News]
 *     summary: Tạo bài viết mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/News' }
 *     responses:
 *       201:
 *         description: Created
 *
 * /api/admin/news/{id}:
 *   get:
 *     tags: [Admin News]
 *     summary: Chi tiết bài viết
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/News' }
 *   put:
 *     tags: [Admin News]
 *     summary: Cập nhật bài viết
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/News' }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags: [Admin News]
 *     summary: Xóa bài viết
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.get('/', getNews);
router.get('/:id', validate(schemas.id, 'params'), getNewsById);
router.post('/', validate(schemas.news, 'body'), createNews);
router.put('/:id', validate(schemas.id, 'params'), validate(schemas.news, 'body'), updateNews);
router.patch('/:id/status', validate(schemas.id, 'params'), updateNewsStatus);
router.patch('/:id/featured', validate(schemas.id, 'params'), toggleNewsFeatured);
router.delete('/:id', validate(schemas.id, 'params'), deleteNews);

module.exports = router;

