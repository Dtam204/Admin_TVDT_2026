const express = require('express');
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require('../controllers/bookCategories.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/book-categories:
 *   get:
 *     tags:
 *       - BookCategories
 *     summary: Lấy danh sách bookcategories
 */
router.get('/', requireAuth, getAll);

/**
 * @openapi
 * /api/admin/book-categories/:id:
 *   get:
 *     tags:
 *       - BookCategories
 *     summary: Lấy chi tiết bookcategories
 */
router.get('/:id', requireAuth, getById);

/**
 * @openapi
 * /api/admin/book-categories:
 *   post:
 *     tags:
 *       - BookCategories
 *     summary: Tạo bookcategories mới
 */
router.post('/', requireAuth, create);

/**
 * @openapi
 * /api/admin/book-categories/:id:
 *   put:
 *     tags:
 *       - BookCategories
 *     summary: Cập nhật bookcategories
 */
router.put('/:id', requireAuth, update);

/**
 * @openapi
 * /api/admin/book-categories/:id:
 *   delete:
 *     tags:
 *       - BookCategories
 *     summary: Xóa bookcategories
 */
router.delete('/:id', requireAuth, remove);

module.exports = router;
