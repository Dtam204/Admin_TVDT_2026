const express = require('express');
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require('../controllers/members.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/members:
 *   get:
 *     tags:
 *       - Members
 *     summary: Lấy danh sách members
 */
router.get('/', requireAuth, getAll);

/**
 * @openapi
 * /api/admin/members/:id:
 *   get:
 *     tags:
 *       - Members
 *     summary: Lấy chi tiết members
 */
router.get('/:id', requireAuth, getById);

/**
 * @openapi
 * /api/admin/members:
 *   post:
 *     tags:
 *       - Members
 *     summary: Tạo members mới
 */
router.post('/', requireAuth, create);

/**
 * @openapi
 * /api/admin/members/:id:
 *   put:
 *     tags:
 *       - Members
 *     summary: Cập nhật members
 */
router.put('/:id', requireAuth, update);

/**
 * @openapi
 * /api/admin/members/:id:
 *   delete:
 *     tags:
 *       - Members
 *     summary: Xóa members
 */
router.delete('/:id', requireAuth, remove);

module.exports = router;
