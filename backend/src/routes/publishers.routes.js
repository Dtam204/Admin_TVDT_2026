const express = require('express');
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require('../controllers/publishers.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/publishers:
 *   get:
 *     tags:
 *       - Publishers
 *     summary: Lấy danh sách publishers
 */
router.get('/', requireAuth, getAll);

/**
 * @openapi
 * /api/admin/publishers/:id:
 *   get:
 *     tags:
 *       - Publishers
 *     summary: Lấy chi tiết publishers
 */
router.get('/:id', requireAuth, getById);

/**
 * @openapi
 * /api/admin/publishers:
 *   post:
 *     tags:
 *       - Publishers
 *     summary: Tạo publishers mới
 */
router.post('/', requireAuth, create);

/**
 * @openapi
 * /api/admin/publishers/:id:
 *   put:
 *     tags:
 *       - Publishers
 *     summary: Cập nhật publishers
 */
router.put('/:id', requireAuth, update);

/**
 * @openapi
 * /api/admin/publishers/:id:
 *   delete:
 *     tags:
 *       - Publishers
 *     summary: Xóa publishers
 */
router.delete('/:id', requireAuth, remove);

module.exports = router;
