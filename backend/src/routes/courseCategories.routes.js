const express = require('express');
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require('../controllers/courseCategories.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/course-categories:
 *   get:
 *     tags: [Admin CourseCategories]
 *     summary: Danh sách danh mục khóa học
 *     description: "Lấy danh sách các phân loại khóa học (VD: Lập trình, Ngoại ngữ...)"
 *     security:
 *       - bearerAuth: []
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
 *                         $ref: '#/components/schemas/CourseCategory'
 */
router.get('/', getAll);

/**
 * @openapi
 * /api/admin/course-categories/{id}:
 *   get:
 *     tags: [Admin CourseCategories]
 *     summary: Chi tiết danh mục
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200:
 *         description: Thông tin danh mục
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CourseCategory'
 */
router.get('/:id', getById);

/**
 * @openapi
 * /api/admin/course-categories:
 *   post:
 *     tags: [Admin CourseCategories]
 *     summary: Tạo danh mục mới
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseCategory'
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
 * /api/admin/course-categories/{id}:
 *   put:
 *     tags: [Admin CourseCategories]
 *     summary: Cập nhật danh mục
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
 *             $ref: '#/components/schemas/CourseCategory'
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
 * /api/admin/course-categories/{id}:
 *   delete:
 *     tags: [Admin CourseCategories]
 *     summary: Xóa danh mục
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
