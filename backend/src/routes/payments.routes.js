const express = require('express');
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require('../controllers/payments.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/payments:
 *   get:
 *     tags:
 *       - Payments
 *     summary: Lấy danh sách payments
 */
router.get('/', requireAuth, getAll);

/**
 * @openapi
 * /api/admin/payments/:id:
 *   get:
 *     tags:
 *       - Payments
 *     summary: Lấy chi tiết payments
 */
router.get('/:id', requireAuth, getById);

/**
 * @openapi
 * /api/admin/payments:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Tạo payments mới
 */
router.post('/', requireAuth, create);

/**
 * @openapi
 * /api/admin/payments/:id:
 *   put:
 *     tags:
 *       - Payments
 *     summary: Cập nhật payments
 */
router.put('/:id', requireAuth, update);

/**
 * @openapi
 * /api/admin/payments/:id:
 *   delete:
 *     tags:
 *       - Payments
 *     summary: Xóa payments
 */
router.delete('/:id', requireAuth, remove);

module.exports = router;
