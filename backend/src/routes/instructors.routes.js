const express = require('express');
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require('../controllers/instructors.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/instructors:
 *   get:
 *     tags:
 *       - Admin Instructors
 *     summary: Lấy danh sách instructors
 */
router.get('/', requireAuth, getAll);

/**
 * @openapi
 * /api/admin/instructors/{id}:
 *   get:
 *     tags:
 *       - Admin Instructors
 *     summary: Lấy chi tiết instructors
 */
router.get('/:id', requireAuth, getById);

/**
 * @openapi
 * /api/admin/instructors:
 *   post:
 *     tags:
 *       - Admin Instructors
 *     summary: Tạo instructors mới
 */
router.post('/', requireAuth, create);

/**
 * @openapi
 * /api/admin/instructors/{id}:
 *   put:
 *     tags:
 *       - Admin Instructors
 *     summary: Cập nhật instructors
 */
router.put('/:id', requireAuth, update);

/**
 * @openapi
 * /api/admin/instructors/{id}:
 *   delete:
 *     tags:
 *       - Admin Instructors
 *     summary: Xóa instructors
 */
router.delete('/:id', requireAuth, remove);

module.exports = router;
