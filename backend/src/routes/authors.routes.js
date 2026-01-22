const express = require('express');
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require('../controllers/authors.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/authors:
 *   get:
 *     tags:
 *       - Authors
 *     summary: Lấy danh sách authors
 */
router.get('/', requireAuth, getAll);

/**
 * @openapi
 * /api/admin/authors/:id:
 *   get:
 *     tags:
 *       - Authors
 *     summary: Lấy chi tiết authors
 */
router.get('/:id', requireAuth, getById);

/**
 * @openapi
 * /api/admin/authors:
 *   post:
 *     tags:
 *       - Authors
 *     summary: Tạo authors mới
 */
router.post('/', requireAuth, create);

/**
 * @openapi
 * /api/admin/authors/:id:
 *   put:
 *     tags:
 *       - Authors
 *     summary: Cập nhật authors
 */
router.put('/:id', requireAuth, update);

/**
 * @openapi
 * /api/admin/authors/:id:
 *   delete:
 *     tags:
 *       - Authors
 *     summary: Xóa authors
 */
router.delete('/:id', requireAuth, remove);

module.exports = router;
