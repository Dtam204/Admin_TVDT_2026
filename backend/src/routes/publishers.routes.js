const express = require('express');
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require('../controllers/publishers.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/publishers:
 *   get:
 *     tags: [Admin Publishers]
 *     summary: Danh sách nhà xuất bản
 *     description: Lấy danh sách các nhà xuất bản có trong hệ thống. Hỗ trợ tìm kiếm theo tên và phân trang.
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
 *         description: Tìm kiếm theo tên nhà xuất bản
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
 *                         $ref: '#/components/schemas/Publisher'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', getAll);

/**
 * @openapi
 * /api/admin/publishers/{id}:
 *   get:
 *     tags: [Admin Publishers]
 *     summary: Chi tiết nhà xuất bản
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
 *                       $ref: '#/components/schemas/Publisher'
 */
router.get('/:id', getById);

/**
 * @openapi
 * /api/admin/publishers:
 *   post:
 *     tags: [Admin Publishers]
 *     summary: Thêm nhà xuất bản mới
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Publisher'
 *     responses:
 *       201:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 */
router.post('/', create);

/**
 * @openapi
 * /api/admin/publishers/{id}:
 *   put:
 *     tags: [Admin Publishers]
 *     summary: Cập nhật nhà xuất bản
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
 *             $ref: '#/components/schemas/Publisher'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 */
router.put('/:id', update);

/**
 * @openapi
 * /api/admin/publishers/{id}:
 *   delete:
 *     tags: [Admin Publishers]
 *     summary: Xóa nhà xuất bản
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
router.delete('/:id', remove);

module.exports = router;
