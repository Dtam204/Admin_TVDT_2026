const express = require('express');
const borrowController = require('../controllers/borrow.controller');
const requireAuth = require('../middlewares/auth.middleware');
const { restrictToCMS, checkPermission } = require('../middlewares/rbac.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/borrow/register:
 *   post:
 *     tags: [Admin Loans]
 *     summary: Đăng ký mượn sách mới
 *     description: Tạo phiếu mượn sách mới cho độc giả. Có thể mượn trực tiếp (tại quầy) hoặc đăng ký trước.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               readerId: { type: 'string', example: '1', description: 'ID người đọc' }
 *               copyId: { type: 'string', example: '1', description: 'ID bản sao sách (tùy chọn if barcode is provided)' }
 *               registerDate: { type: 'string', format: 'date-time' }
 *               barcode: { type: 'string', description: 'Mã vạch cuốn sách' }
 *               notes: { type: 'string' }
 *               directBorrow: { type: 'boolean', description: 'Mượn trực tiếp không cần đăng ký trước' }
 *     responses:
 *       200:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *
 * /api/admin/borrow/approve:
 *   post:
 *     tags: [Admin Loans]
 *     summary: Duyệt yêu cầu mượn sách
 *     description: Phê duyệt yêu cầu mượn sách đã được đăng ký trước bởi độc giả.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requestId: { type: 'integer', example: 1 }
 *     responses:
 *       200:
 *         description: Duyệt thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *
 * /api/admin/borrow/extend:
 *   post:
 *     tags: [Admin Loans]
 *     summary: Gia hạn thời gian mượn
 *     description: Gia hạn thêm số ngày mượn cho một phiếu mượn đang hoạt động.
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
 *       200:
 *         description: Gia hạn thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *
 * /api/admin/borrow/return:
 *   post:
 *     tags: [Admin Loans]
 *     summary: Xử lý trả sách
 *     description: Ghi nhận việc trả sách, cập nhật trạng thái bản sao và tính toán quá hạn nếu có.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loanId: { type: 'integer', example: 1 }
 *     responses:
 *       200:
 *         description: Trả sách thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *
 * /api/admin/borrow/all:
 *   get:
 *     tags: [Admin Loans]
 *     summary: Danh sách phiếu mượn
 *     description: Lấy danh sách toàn bộ phiếu mượn trong hệ thống với khả năng lọc theo trạng thái.
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
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: 'array', items: { $ref: '#/components/schemas/BookLoan' } }
 *                     pagination: { $ref: '#/components/schemas/Pagination' }
 *
 * /api/admin/borrow/export:
 *   get:
 *     tags: [Admin Loans]
 *     summary: Xuất dữ liệu mượn trả ra Excel
 *     responses:
 *       200:
 *         description: Trả về file Excel binary
 *
 * /api/admin/borrow/reserve:
 *   post:
 *     tags: [Admin Loans]
 *     summary: Đăng ký giữ chỗ (Reservation)
 *     description: Đăng ký giữ chỗ cho một ấn phẩm khi không còn bản sao nào sẵn có.
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
 *       200:
 *         description: Đặt chỗ thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *
 * /api/admin/borrow/reservations:
 *   get:
 *     tags: [Admin Loans]
 *     summary: Danh sách hàng đợi đặt chỗ
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: 'array', items: { $ref: '#/components/schemas/BookReservation' } }
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
