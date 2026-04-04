const express = require('express');
const router = express.Router();
const readerController = require('../controllers/reader.controller');
const { authLimiter } = require('../middlewares/rateLimit.middleware');
const requireAuth = require('../middlewares/auth.middleware');
const interactionController = require('../controllers/interaction.controller');

/**
 * @openapi
 * components:
 *   schemas:
 *     ReaderLoginRequest:
 *       type: object
 *       required: [identifier, password]
 *       properties:
 *         identifier:
 *           type: string
 *           description: Mã thẻ thư viện hoặc Email đã đăng ký
 *         password:
 *           type: string
 *           description: Mật khẩu tài khoản
 *     
 *     ReaderProfile:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         fullName: { type: string }
 *         email: { type: string }
 *         phone: { type: string }
 *         gender: { type: string, enum: [male, female, other] }
 *         birthday: { type: string, format: date }
 *         address: { type: string }
 *         avatar: { type: string }
 *         cardNumber: { type: string }
 *         balance: { type: number }
 *         membershipExpires: { type: string, format: date }
 *         status: { type: string }
 *         planName: { type: string }
 *         tierCode: { type: string }
 *         maxBorrowLimit: { type: integer }
 *         isExpired: { type: boolean }
 *         currentLoansCount: { type: integer }
 *         totalFines: { type: number }
 *
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean }
 *         message: { type: string }
 *         data:
 *           type: object
 *           properties:
 *             accessToken: { type: string }
 *             refreshToken: { type: string }
 *             reader: { $ref: '#/components/schemas/ReaderProfile' }
 *         code: { type: integer }
 *
 *     Pagination:
 *       type: object
 *       properties:
 *         totalItems: { type: integer }
 *         totalPages: { type: integer }
 *         currentPage: { type: integer }
 *         limit: { type: integer }
 */

/**
 * @openapi
 * /api/reader/login:
 *   post:
 *     tags: [Reader Portal]
 *     summary: "Đăng nhập Bạn đọc (Thẻ/Email)"
 *     description: Xác thực bằng tài khoản do Admin cung cấp. Trả về AccessToken và RefreshToken.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReaderLoginRequest'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Sai thông tin đăng nhập
 */
router.post('/login', authLimiter, readerController.login);

/**
 * @openapi
 * /api/reader/logout:
 *   post:
 *     tags: [Reader Portal]
 *     summary: "Đăng xuất (Thu hồi Token)"
 *     description: Vô hiệu hóa Refresh Token trong database để chấm dứt phiên đăng nhập trên thiết bị.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string, description: "Mã Refresh Token được trả về khi login" }
 *     responses:
 *       200: { description: Đăng xuất thành công }
 */
router.post('/logout', readerController.logout);

/**
 * @openapi
 * /api/reader/logout-all:
 *   post:
 *     tags: [Reader Portal]
 *     summary: "Đăng xuất khỏi tất cả thiết bị"
 *     description: Thu hồi toàn bộ Refresh Token của người dùng hiện tại trong database.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Đã đăng xuất khỏi tất cả thiết bị }
 */
router.post('/logout-all', requireAuth, readerController.logoutAllDevices);

/**
 * @openapi
 * /api/reader/forgot-password:
 *   post:
 *     tags: [Reader Portal]
 *     summary: "Quên mật khẩu - Bước 1: Gửi mã OTP"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: OTP đã được gửi }
 */
router.post('/forgot-password', authLimiter, readerController.forgotPassword);

router.post('/verify-otp', authLimiter, readerController.verifyOTP);
router.post('/reset-password', authLimiter, readerController.resetPassword);

/**
 * @openapi
 * /api/reader/profile/me:
 *   get:
 *     tags: [Reader Portal]
 *     summary: "Lấy Profile 360 độ (Trang Tài khoản)"
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dữ liệu Profile đầy đủ nhất cho App
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/ReaderProfile' }
 *                 code: { type: integer }
 */
router.get('/profile/me', requireAuth, readerController.getProfile);

/**
 * @openapi
 * /api/reader/profile:
 *   put:
 *     tags: [Reader Portal]
 *     summary: "Cập nhật thông tin cá nhân (Đầy đủ trường)"
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               gender: { type: string, enum: [male, female, other] }
 *               birthday: { type: string, format: date }
 *               address: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công, trả về Profile mới nhất
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/ReaderProfile' }
 *                 code: { type: integer }
 */
router.put('/profile', requireAuth, readerController.updateProfile);

/**
 * @openapi
 * /api/reader/change-password:
 *   post:
 *     tags: [Reader Portal]
 *     summary: "Đổi mật khẩu trong App"
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword, confirmPassword]
 *             properties:
 *               oldPassword: { type: string, description: "Mật khẩu hiện tại" }
 *               newPassword: { type: string, description: "Mật khẩu mới (ít nhất 6 ký tự)" }
 *               confirmPassword: { type: string, description: "Nhập lại mật khẩu mới" }
 *     responses:
 *       200: { description: Đổi mật khẩu thành công }
 */
router.post('/change-password', requireAuth, readerController.changePassword);

/**
 * @openapi
 * /api/reader/borrow-history:
 *   get:
 *     tags: [Reader Portal]
 *     summary: "Lịch sử mượn trả Sách In (Phân trang 10)"
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Danh sách mượn trả
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 */
router.get('/borrow-history', requireAuth, readerController.getBorrowHistory);

/**
 * @openapi
 * /api/reader/transactions:
 *   get:
 *     tags: [Reader Portal]
 *     summary: "Lịch sử Tài chính (Phân trang 10)"
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Lịch sử nạp/thanh toán
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 */
router.get('/transactions', requireAuth, readerController.getTransactions);

/**
 * @openapi
 * /api/reader/membership-requests:
 *   get:
 *     tags: [Reader Portal]
 *     summary: "Lịch sử Gia hạn thẻ (Phân trang 10)"
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Trình trạng yêu cầu gia hạn
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 */
router.get('/membership-requests', requireAuth, readerController.getMembershipRequests);

// --- Tương tác (Review/Wishlist) ---
router.get('/books/:bookId/reviews', interactionController.getBookReviews);
router.post('/books/:bookId/reviews', requireAuth, interactionController.submitReview);
router.get('/wishlist', requireAuth, interactionController.getMyWishlist);
router.post('/books/:bookId/wishlist', requireAuth, interactionController.addToWishlist);
router.delete('/books/:bookId/wishlist', requireAuth, interactionController.removeFromWishlist);

module.exports = router;
