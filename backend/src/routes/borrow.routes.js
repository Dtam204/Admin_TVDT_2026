const express = require('express');
const borrowController = require('../controllers/borrow.controller');
const requireAuth = require('../middlewares/auth.middleware');
const { restrictToCMS, checkPermission } = require('../middlewares/rbac.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/Borrow/register:
 *   post:
 *     tags: [Admin Borrow]
 *     summary: Đăng ký mượn sách
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               readerId: { type: 'string', example: '1' }
 *               copyId: { type: 'string', example: '1' }
 *               registerDate: { type: 'string', format: 'date-time' }
 *               barcode: { type: 'string' }
 *               notes: { type: 'string' }
 *               directBorrow: { type: 'boolean', description: 'Mượn trực tiếp (dành cho Admin)' }
 *     responses:
 *       200: { description: OK }
 *
 * /api/Borrow/approve:
 *   post:
 *     tags: [Admin Borrow]
 *     summary: Duyệt yêu cầu mượn
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requestId: { type: 'integer', example: 1 }
 *     responses:
 *       200: { description: OK }
 *
 * /api/Borrow/extend:
 *   post:
 *     tags: [Admin Borrow]
 *     summary: Gia hạn mượn sách
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loanId: { type: 'integer', example: 1 }
 *               extendDays: { type: 'integer', example: 7 }
 *     responses:
 *       200: { description: OK }
 *
 * /api/Borrow/return:
 *   post:
 *     tags: [Admin Borrow]
 *     summary: Trả sách
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loanId: { type: 'integer', example: 1 }
 *     responses:
 *       200: { description: OK }
 *
 * /api/Borrow/all:
 *   get:
 *     tags: [Admin Borrow]
 *     summary: Lấy danh sách phiếu mượn (Admin)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: 'integer', default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: 'integer', default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: 'string', enum: ['borrowing', 'returned', 'overdue'] }
 *     responses:
 *       200: { description: OK }
 *
 * /api/Borrow/reserve:
 *   post:
 *     tags: [Admin Borrow]
 *     summary: Đăng ký đặt giữ chỗ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               readerId: { type: 'string' }
 *               publicationId: { type: 'string' }
 *               notes: { type: 'string' }
 *     responses:
 *       200: { description: OK }
 *
 * /api/Borrow/reservations:
 *   get:
 *     tags: [Admin Borrow]
 *     summary: Lấy danh sách hàng đợi đặt chỗ
 *     responses:
 *       200: { description: OK }
 */
router.post('/register', checkPermission('book_loans.manage'), borrowController.register);
router.post('/approve', checkPermission('book_loans.manage'), borrowController.approve);
router.post('/extend', checkPermission('book_loans.manage'), borrowController.extend);
router.post('/return', checkPermission('book_loans.manage'), borrowController.returnBook);
router.get('/export', checkPermission('book_loans.view'), borrowController.exportExcel);
router.get('/all', checkPermission('book_loans.view'), borrowController.getAll);

// Đặt chỗ (Reservation)
router.post('/reserve', checkPermission('book_loans.manage'), borrowController.reserve);
router.get('/reservations', checkPermission('book_loans.view'), borrowController.getReservations);

module.exports = router;
