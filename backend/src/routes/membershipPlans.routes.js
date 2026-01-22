const express = require('express');
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require('../controllers/membershipPlans.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/membership-plans:
 *   get:
 *     tags:
 *       - MembershipPlans
 *     summary: Lấy danh sách membershipplans
 */
router.get('/', requireAuth, getAll);

/**
 * @openapi
 * /api/admin/membership-plans/:id:
 *   get:
 *     tags:
 *       - MembershipPlans
 *     summary: Lấy chi tiết membershipplans
 */
router.get('/:id', requireAuth, getById);

/**
 * @openapi
 * /api/admin/membership-plans:
 *   post:
 *     tags:
 *       - MembershipPlans
 *     summary: Tạo membershipplans mới
 */
router.post('/', requireAuth, create);

/**
 * @openapi
 * /api/admin/membership-plans/:id:
 *   put:
 *     tags:
 *       - MembershipPlans
 *     summary: Cập nhật membershipplans
 */
router.put('/:id', requireAuth, update);

/**
 * @openapi
 * /api/admin/membership-plans/:id:
 *   delete:
 *     tags:
 *       - MembershipPlans
 *     summary: Xóa membershipplans
 */
router.delete('/:id', requireAuth, remove);

module.exports = router;
