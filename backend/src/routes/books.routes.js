const express = require('express');
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/books.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/books:
 *   get:
 *     tags:
 *       - Books
 *     summary: Lấy danh sách sách
 *     security:
 *       - bearerAuth: []
 */
router.get('/', requireAuth, getBooks);

/**
 * @openapi
 * /api/admin/books/:id:
 *   get:
 *     tags:
 *       - Books
 *     summary: Lấy chi tiết sách
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', requireAuth, getBookById);

/**
 * @openapi
 * /api/admin/books:
 *   post:
 *     tags:
 *       - Books
 *     summary: Tạo sách mới
 *     security:
 *       - bearerAuth: []
 */
router.post('/', requireAuth, createBook);

/**
 * @openapi
 * /api/admin/books/:id:
 *   put:
 *     tags:
 *       - Books
 *     summary: Cập nhật sách
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', requireAuth, updateBook);

/**
 * @openapi
 * /api/admin/books/:id:
 *   delete:
 *     tags:
 *       - Books
 *     summary: Xóa sách
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', requireAuth, deleteBook);

module.exports = router;
