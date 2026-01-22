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
 *     tags:
 *       - CourseCategories
 *     summary: Lấy danh sách coursecategories
 */
router.get('/', requireAuth, getAll);

/**
 * @openapi
 * /api/admin/course-categories/:id:
 *   get:
 *     tags:
 *       - CourseCategories
 *     summary: Lấy chi tiết coursecategories
 */
router.get('/:id', requireAuth, getById);

/**
 * @openapi
 * /api/admin/course-categories:
 *   post:
 *     tags:
 *       - CourseCategories
 *     summary: Tạo coursecategories mới
 */
router.post('/', requireAuth, create);

/**
 * @openapi
 * /api/admin/course-categories/:id:
 *   put:
 *     tags:
 *       - CourseCategories
 *     summary: Cập nhật coursecategories
 */
router.put('/:id', requireAuth, update);

/**
 * @openapi
 * /api/admin/course-categories/:id:
 *   delete:
 *     tags:
 *       - CourseCategories
 *     summary: Xóa coursecategories
 */
router.delete('/:id', requireAuth, remove);

module.exports = router;
