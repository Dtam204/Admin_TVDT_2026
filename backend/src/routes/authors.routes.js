const express = require('express');
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require('../controllers/authors.controller');
const requireAuth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/rbac.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/authors:
 *   get:
 *     tags: [Admin Authors]
 *     summary: Danh sách tác giả
 *     description: Lấy danh sách các tác giả sách trong hệ thống. Hỗ trợ tìm kiếm theo tên và phân trang.
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
 *         name: search
 *         schema: { type: 'string' }
 *         description: Tìm kiếm theo tên tác giả
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
 *                         $ref: '#/components/schemas/Author'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', requireAuth, checkPermission('authors.view'), getAll);

/**
 * @openapi
 * /api/admin/authors/{id}:
 *   get:
 *     tags: [Admin Authors]
 *     summary: Chi tiết tác giả
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
 *                       $ref: '#/components/schemas/Author'
 */
router.get('/:id', requireAuth, checkPermission('authors.view'), getById);

/**
 * @openapi
 * /api/admin/authors:
 *   post:
 *     tags: [Admin Authors]
 *     summary: Thêm tác giả mới
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Author'
 *     responses:
 *       201:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 */
router.post('/', requireAuth, checkPermission('authors.manage'), create);

/**
 * @openapi
 * /api/admin/authors/{id}:
 *   put:
 *     tags: [Admin Authors]
 *     summary: Cập nhật tác giả
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
 *             $ref: '#/components/schemas/Author'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 */
router.put('/:id', requireAuth, checkPermission('authors.manage'), update);

/**
 * @openapi
 * /api/admin/authors/{id}:
 *   delete:
 *     tags: [Admin Authors]
 *     summary: Xóa tác giả
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
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 */
router.delete('/:id', requireAuth, checkPermission('authors.manage'), remove);

module.exports = router;
