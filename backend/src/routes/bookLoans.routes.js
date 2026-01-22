const express = require('express');
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require('../controllers/bookLoans.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/book-loans:
 *   get:
 *     tags:
 *       - BookLoans
 *     summary: Lấy danh sách bookloans
 */
router.get('/', requireAuth, getAll);

/**
 * @openapi
 * /api/admin/book-loans/:id:
 *   get:
 *     tags:
 *       - BookLoans
 *     summary: Lấy chi tiết bookloans
 */
router.get('/:id', requireAuth, getById);

/**
 * @openapi
 * /api/admin/book-loans:
 *   post:
 *     tags:
 *       - BookLoans
 *     summary: Tạo bookloans mới
 */
router.post('/', requireAuth, create);

/**
 * @openapi
 * /api/admin/book-loans/:id:
 *   put:
 *     tags:
 *       - BookLoans
 *     summary: Cập nhật bookloans
 */
router.put('/:id', requireAuth, update);

/**
 * @openapi
 * /api/admin/book-loans/:id:
 *   delete:
 *     tags:
 *       - BookLoans
 *     summary: Xóa bookloans
 */
router.delete('/:id', requireAuth, remove);

module.exports = router;
