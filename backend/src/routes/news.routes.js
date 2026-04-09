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
const { checkPermission } = require('../middlewares/rbac.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/news:
 *   get:
 *     tags: [Admin News]
 *     summary: Danh sách bài viết
 *     description: Lấy danh sách các bài viết, tin tức trong hệ thống. Hỗ trợ lọc theo trạng thái và tìm kiếm.
 *     security:
 *       - bearerAuth: []
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
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/News'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', checkPermission('news.view'), getNews);

/**
 * @openapi
 * /api/admin/news/{id}:
 *   get:
 *     tags: [Admin News]
 *     summary: Chi tiết bài viết
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/News'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/:id', checkPermission('news.view'), validate(schemas.id, 'params'), getNewsById);

/**
 * @openapi
 * /api/admin/news:
 *   post:
 *     tags: [Admin News]
 *     summary: Tạo bài viết mới
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/News'
 *     responses:
 *       201:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', checkPermission('news.manage'), validate(schemas.news, 'body'), createNews);

/**
 * @openapi
 * /api/admin/news/{id}:
 *   put:
 *     tags: [Admin News]
 *     summary: Cập nhật bài viết
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/News'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put('/:id', checkPermission('news.manage'), validate(schemas.id, 'params'), validate(schemas.news, 'body'), updateNews);

/**
 * @openapi
 * /api/admin/news/{id}/status:
 *   patch:
 *     tags: [Admin News]
 *     summary: Thay đổi trạng thái bài viết
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: 'string', enum: ['draft', 'published', 'archived'] }
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch('/:id/status', checkPermission('news.manage'), validate(schemas.id, 'params'), updateNewsStatus);

/**
 * @openapi
 * /api/admin/news/{id}/featured:
 *   patch:
 *     tags: [Admin News]
 *     summary: Bật/tắt trạng thái nổi bật
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch('/:id/featured', checkPermission('news.manage'), validate(schemas.id, 'params'), toggleNewsFeatured);

/**
 * @openapi
 * /api/admin/news/{id}:
 *   delete:
 *     tags: [Admin News]
 *     summary: Xóa bài viết
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', checkPermission('news.manage'), validate(schemas.id, 'params'), deleteNews);

module.exports = router;
