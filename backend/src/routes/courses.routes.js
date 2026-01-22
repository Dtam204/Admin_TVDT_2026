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
 *     tags:
 *       - Courses
 *     summary: Lấy danh sách khóa học
 *     security:
 *       - bearerAuth: []
 */
router.get('/', requireAuth, getCourses);

/**
 * @openapi
 * /api/admin/courses/:id:
 *   get:
 *     tags:
 *       - Courses
 *     summary: Lấy chi tiết khóa học
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', requireAuth, getCourseById);

/**
 * @openapi
 * /api/admin/courses:
 *   post:
 *     tags:
 *       - Courses
 *     summary: Tạo khóa học mới
 *     security:
 *       - bearerAuth: []
 */
router.post('/', requireAuth, createCourse);

/**
 * @openapi
 * /api/admin/courses/:id:
 *   put:
 *     tags:
 *       - Courses
 *     summary: Cập nhật khóa học
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', requireAuth, updateCourse);

/**
 * @openapi
 * /api/admin/courses/:id:
 *   delete:
 *     tags:
 *       - Courses
 *     summary: Xóa khóa học
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', requireAuth, deleteCourse);

module.exports = router;
