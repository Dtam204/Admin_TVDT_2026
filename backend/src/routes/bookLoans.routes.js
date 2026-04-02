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
 *     tags: [Admin BookLoans]
 *     summary: Lấy danh sách phiếu mượn trả
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: 'integer', default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: 'integer', default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: 'string', enum: ['borrowed', 'returned', 'overdue', 'lost', 'all'] }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: 'array', items: { $ref: '#/components/schemas/BookLoan' } }
 *                     pagination: { $ref: '#/components/schemas/Pagination' }
 *   post:
 *     tags: [Admin BookLoans]
 *     summary: Tạo phiếu mượn mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/BookLoan' }
 *     responses:
 *       201:
 *         description: Created
 */
router.get('/', requireAuth, getAll);

/**
 * @openapi
 * /api/admin/book-loans/{id}:
 *   get:
 *     tags: [Admin BookLoans]
 *     summary: Lấy chi tiết phiếu mượn
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/BookLoan' }
 *   put:
 *     tags: [Admin BookLoans]
 *     summary: Cập nhật phiếu mượn
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/BookLoan' }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags: [Admin BookLoans]
 *     summary: Xóa phiếu mượn
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.get('/:id', requireAuth, getById);
router.post('/', requireAuth, create);
router.put('/:id', requireAuth, update);
router.delete('/:id', requireAuth, remove);

module.exports = router;
