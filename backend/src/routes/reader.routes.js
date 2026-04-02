const express = require('express');
const router = express.Router();
const readerController = require('../controllers/reader.controller');
const { authLimiter } = require('../middlewares/rateLimit.middleware');
const requireAuth = require('../middlewares/auth.middleware');

/**
 * @openapi
 * tags:
 *   name: Reader Portal
 *   description: Xử lý các chức năng của bạn đọc (Members) trên ứng dụng và website
 */

/**
 * @openapi
 * /api/reader/login:
 *   post:
 *     tags: [Reader Portal]
 *     summary: Đăng nhập Bạn đọc
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier: { type: 'string', description: 'Mã thẻ hoặc Email', example: 'LIB2026-0001' }
 *               password: { type: 'string', example: '123456' }
 *     responses:
 *       200: { description: Đăng nhập thành công }
 */
router.post('/login', authLimiter, readerController.login);

/**
 * @openapi
 * /api/reader/profile/me:
 *   get:
 *     tags: [Reader Portal]
 *     summary: Lấy thông tin cá nhân (Profile 360)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Thông tin bạn đọc chi tiết }
 */
router.get('/profile/me', requireAuth, readerController.getProfile);

/**
 * @openapi
 * /api/reader/borrow-history:
 *   get:
 *     tags: [Reader Portal]
 *     summary: Lấy lịch sử mượn trả của bạn đọc
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: 'string', enum: ['digital', 'physical'] }
 *         description: Lọc theo loại sách số hoặc vật lý
 *     responses:
 *       200: { description: Danh sách phiếu mượn trả }
 */
router.get('/borrow-history', requireAuth, readerController.getBorrowHistory);

/**
 * @openapi
 * /api/reader/renew-card:
 *   post:
 *     tags: [Reader Portal]
 *     summary: Gia hạn thẻ thư viện trực tuyến
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Gia hạn thành công }
 */
router.post('/renew-card', requireAuth, readerController.renewCard);

/**
 * @openapi
 * /api/reader/profile:
 *   put:
 *     tags: [Reader Portal]
 *     summary: Cập nhật thông tin cá nhân cơ bản
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: 'string' }
 *               phone: { type: 'string' }
 *     responses:
 *       200: { description: Cập nhật thành công }
 */
router.put('/profile', requireAuth, readerController.updateProfile);

/**
 * @openapi
 * /api/reader/forgot-password:
 *   post:
 *     tags: [Reader Portal]
 *     summary: Quên mật khẩu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: 'string' }
 *     responses:
 *       200: { description: Gửi email khôi phục thành công }
 */
router.post('/forgot-password', authLimiter, readerController.forgotPassword);

module.exports = router;
