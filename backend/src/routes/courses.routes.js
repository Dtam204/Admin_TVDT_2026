const express = require('express');
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courses.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/courses:
 *   get:
 *     tags: [Admin Courses]
 *     summary: Danh sách toàn bộ khóa học
 *     description: Lấy danh sách khóa học hiện có trong thư viện. Hỗ trợ tìm kiếm và phân trang.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: 'integer', default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: 'integer', default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Danh sách khóa học thành công
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
 *                         $ref: '#/components/schemas/Course'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', getCourses);

/**
 * @openapi
 * /api/admin/courses/{id}:
 *   get:
 *     tags: [Admin Courses]
 *     summary: Chi tiết một khóa học
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200:
 *         description: Thông tin chi tiết khóa học
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
 */
router.get('/:id', getCourseById);

/**
 * @openapi
 * /api/admin/courses:
 *   post:
 *     tags: [Admin Courses]
 *     summary: Tạo khóa học mới
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Course'
 *     responses:
 *       201:
 *         description: Tạo khóa học thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 */
router.post('/', createCourse);

/**
 * @openapi
 * /api/admin/courses/{id}:
 *   put:
 *     tags: [Admin Courses]
 *     summary: Cập nhật khóa học
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
 *             $ref: '#/components/schemas/Course'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 */
router.put('/:id', updateCourse);

/**
 * @openapi
 * /api/admin/courses/{id}:
 *   delete:
 *     tags: [Admin Courses]
 *     summary: Xóa khóa học
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
router.delete('/:id', deleteCourse);

module.exports = router;
