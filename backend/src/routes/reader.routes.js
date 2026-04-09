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
 *         full_name: { type: string }
 *         email: { type: string }
 *         phone: { type: string }
 *         gender: { type: string, enum: [male, female, other] }
 *         date_of_birth: { type: string, format: date }
 *         identity_number: { type: string }
 *         address: { type: string }
 *         avatar: { type: string }
 *         card_number: { type: string }
 *         balance: { type: number }
 *         membership_expires: { type: string, format: date }
 *         status: { type: string }
 *         plan_name: { type: string }
 *         tier_code: { type: string }
 *         max_borrow_limit: { type: integer }
 *         is_expired: { type: boolean }
 *         current_loans_count: { type: integer }
 *         total_fines: { type: number }
 *         age: { type: integer }
 *
 *     LoginResponse:
 *       type: object
 *       properties:
 *         code: { type: integer }
 *         errorId: { type: string, nullable: true }
 *         appId: { type: string, nullable: true }
 *         success: { type: boolean }
 *         message: { type: string }
 *         data:
 *           type: object
 *           properties:
 *             access_token: { type: string }
 *             refresh_token: { type: string }
 *             access_token_expiry: { type: string, format: date-time }
 *             refresh_token_expiry: { type: string, format: date-time }
 *             reader: { $ref: '#/components/schemas/ReaderProfile' }
 *         errors: { type: array, items: { type: string }, nullable: true }
 *
 *     Pagination:
 *       type: object
 *       properties:
 *         total_items: { type: integer }
 *         total_pages: { type: integer }
 *         current_page: { type: integer }
 *         limit: { type: integer }
 *
 *     BaseResponse:
 *       type: object
 *       properties:
 *         code: { type: integer }
 *         success: { type: boolean }
 *         message: { type: string }
 *         data: { type: object, nullable: true }
 *         errorId: { type: string, nullable: true }
 *         appId: { type: string, nullable: true }
 *         errors: { type: array, items: { type: string }, nullable: true }
 */

/**
 * @openapi
 * /api/reader/login:
 *   post:
 *     tags: [Reader Portal]
 *     summary: "Đăng nhập Bạn đọc (Thẻ/Email)"
 *     description: Xác thực bằng tài khoản do Admin cung cấp. Trả về tokens và thông tin bạn đọc.
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
 * /api/reader/refresh-token:
 *   post:
 *     tags: [Reader Portal]
 *     summary: "Làm mới Access Token"
 *     description: Sử dụng Refresh Token để nhận bộ Token mới.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Cấp token mới thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 */
router.post('/refresh-token', readerController.refreshToken);

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
 *       200:
 *         description: Đăng xuất thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
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
 *       200:
 *         description: Đã đăng xuất khỏi tất cả thiết bị
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
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
 *       200:
 *         description: OTP đã được gửi
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 */
router.post('/forgot-password', authLimiter, readerController.forgotPassword);

/**
 * @openapi
 * /api/reader/verify-otp:
 *   post:
 *     tags: [Reader Portal]
 *     summary: "Quên mật khẩu - Bước 2: Xác thực mã OTP"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otpCode]
 *             properties:
 *               email: { type: string }
 *               otpCode: { type: string, description: "Mã OTP 6 số nhận được qua email" }
 *     responses:
 *       200:
 *         description: Xác thực thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *       400:
 *         description: Mã OTP không hợp lệ hoặc hết hạn
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 */
router.post('/verify-otp', authLimiter, readerController.verifyOTP);

/**
 * @openapi
 * /api/reader/reset-password:
 *   post:
 *     tags: [Reader Portal]
 *     summary: "Quên mật khẩu - Bước 3: Đặt lại mật khẩu mới"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, newPassword, confirmPassword]
 *             properties:
 *               email: { type: string }
 *               newPassword: { type: string }
 *               confirmPassword: { type: string }
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *       400:
 *         description: Mật khẩu không khớp hoặc yêu cầu hết hạn
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 */
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
 *         description: Dữ liệu Profile đầy đủ nhất định dạng snake_case
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/ReaderProfile' }
 */
router.get('/profile/me', requireAuth, readerController.getProfile);

/**
 * @openapi
 * /api/reader/profile:
 *   put:
 *     tags: [Reader Portal]
 *     summary: "Cập nhật thông tin cá nhân"
 *     description: Cập nhật hồ sơ bằng camelCase (Yêu cầu giữ nguyên) nhưng trả về định dạng snake_case đồng bộ database.
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
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/ReaderProfile' }
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
 *       200:
 *         description: Đổi mật khẩu thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *       400:
 *         description: Lỗi logic
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 */
router.post('/change-password', requireAuth, readerController.changePassword);

/**
 * @openapi
 * /api/reader/borrow-history:
 *   get:
 *     tags: [Reader Portal]
 *     summary: "Lịch sử mượn trả Sách In"
 *     description: Danh sách lượt mượn trả sách vật lý, có đầy đủ trạng thái (borrowing, returned, overdue).
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Trả về danh sách mượn trả kèm phân trang chuyên nghiệp
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           borrow_date: { type: string, format: date }
 *                           return_date: { type: string, format: date, nullable: true }
 *                           due_date: { type: string, format: date }
 *                           status: { type: string, enum: [borrowing, returned, overdue, lost] }
 *                           late_fee: { type: number }
 *                           title: { type: string }
 *                           author: { type: string }
 *                           thumbnail: { type: string }
 *                           barcode: { type: string }
 *                     pagination: { $ref: '#/components/schemas/Pagination' }
 */
router.get('/borrow-history', requireAuth, readerController.getBorrowHistory);

/**
 * @openapi
 * /api/reader/transactions:
 *   get:
 *     tags: [Reader Portal]
 *     summary: "Lịch sử Tài chính"
 *     description: Chi tiết giao dịch nạp tiền, thanh toán và hoàn tiền qua SePay/Ví.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Danh sách giao dịch chuyên nghiệp
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           amount: { type: number }
 *                           type: { type: string, description: "wallet_deposit, payment, refund, membership, manual_payment" }
 *                           status: { type: string, description: "completed, pending, failed" }
 *                           description: { type: string }
 *                           transaction_id: { type: string }
 *                           payment_method: { type: string }
 *                           created_at: { type: string, format: date }
 *                     pagination: { $ref: '#/components/schemas/Pagination' }
 */
router.get('/transactions', requireAuth, readerController.getTransactions);

/**
 * @openapi
 * /api/reader/membership-requests:
 *   get:
 *     tags: [Reader Portal]
 *     summary: "Lịch sử Gia hạn thẻ (Hội viên)"
 *     description: Danh sách các yêu cầu đăng ký/gia hạn gói hội viên.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Lịch sử gia hạn thẻ chi tiết
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           status: { type: string, description: "pending, approved, rejected" }
 *                           amount: { type: number }
 *                           note: { type: string }
 *                           plan_name: { type: string }
 *                           transaction_id: { type: string }
 *                           created_at: { type: string, format: date }
 *                     pagination: { $ref: '#/components/schemas/Pagination' }
 */
router.get('/membership-requests', requireAuth, readerController.getMembershipRequests);

// --- Tương tác (Review/Wishlist) ---
router.get('/books/:bookId/reviews', interactionController.getBookReviews);
router.post('/books/:bookId/reviews', requireAuth, interactionController.submitReview);
router.get('/wishlist', requireAuth, interactionController.getMyWishlist);
router.post('/books/:bookId/wishlist', requireAuth, interactionController.addToWishlist);
router.delete('/books/:bookId/wishlist', requireAuth, interactionController.removeFromWishlist);

// ============================================================================
// WALLET & PAYMENT API (VÍ ĐIỆN TỬ TRUNG TÂM)
// ============================================================================

/**
 * @openapi
 * /api/reader/wallet/balance:
 *   get:
 *     tags: [Reader Wallet]
 *     summary: "Lấy tổng số dư hiện có trong Ví"
 *     description: Trả về số dư khả dụng dùng để mua gói hoặc đóng phạt.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lấy số dư thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         balance: { type: number }
 */
router.get('/wallet/balance', requireAuth, readerController.getWalletBalance);

/**
 * @openapi
 * /api/reader/wallet/deposit:
 *   post:
 *     tags: [Reader Wallet]
 *     summary: "Tạo lệnh nạp tiền vào Ví"
 *     description: Tạo lệnh nạp với mã tham chiếu duy nhất (VD NAP-R14-1712623400000) để đảm bảo đồng bộ và chống nhầm lẫn giao dịch.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: integer }
 *     responses:
 *       200:
 *         description: Request thành công, trả về cú pháp chuyển khoản
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         deposit_id: { type: integer }
 *                         amount: { type: number }
 *                         client_reference: { type: string }
 *                         transfer_code: { type: string }
 *                         status: { type: string, enum: [pending, credited, failed, expired, cancelled] }
 *                         expires_at: { type: string, format: date-time }
 *                         created_at: { type: string, format: date-time }
 *                         message: { type: string }
 */
router.post('/wallet/deposit', requireAuth, readerController.requestDeposit);

/**
 * @openapi
 * /api/reader/wallet/deposit/orders/{depositId}:
 *   get:
 *     tags: [Reader Wallet]
 *     summary: "Kiểm tra trạng thái lệnh nạp tiền"
 *     description: Chỉ cho phép bạn đọc truy vấn lệnh nạp của chính tài khoản mình.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: depositId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Trạng thái lệnh nạp
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         deposit_id: { type: integer }
 *                         amount: { type: number }
 *                         transfer_code: { type: string }
 *                         status: { type: string, enum: [pending, credited, failed, expired, cancelled] }
 *                         matched_external_txn_id: { type: string, nullable: true }
 *                         failure_reason: { type: string, nullable: true }
 *                         credited_at: { type: string, format: date-time, nullable: true }
 *                         expires_at: { type: string, format: date-time }
 *                         current_wallet_balance: { type: number }
 */
router.get('/wallet/deposit/orders/:depositId', requireAuth, readerController.getDepositOrderStatus);

/**
 * @openapi
 * /api/reader/wallet/fines:
 *   get:
 *     tags: [Reader Wallet]
 *     summary: "Lấy danh sách phiếu phạt đang chờ đóng"
 *     description: Liệt kê các phiếu phạt bị thư viện viên áp dụng cho tài khoản này (chưa thanh toán).
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Danh sách phiếu phạt
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           amount: { type: number }
 *                           description: { type: string }
 *                           created_at: { type: string, format: date }
 *                           transaction_id: { type: string }
 */
router.get('/wallet/fines', requireAuth, readerController.getPendingFines);

/**
 * @openapi
 * /api/reader/wallet/fines/{fineId}/pay:
 *   post:
 *     tags: [Reader Wallet]
 *     summary: "Đóng phạt ngay lập tức bằng Số dư Ví"
 *     description: Kiểm tra số dư và trừ trực tiếp tiền trong ví để xóa nợ phạt.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: fineId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Đóng phạt hoàn tất
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *       400:
 *         description: Số dư ví không đủ
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 */
router.post('/wallet/fines/:fineId/pay', requireAuth, readerController.payFine);

/**
 * @openapi
 * /api/reader/wallet/membership-upgrade:
 *   post:
 *     tags: [Reader Wallet]
 *     summary: "Nâng/Gia hạn gói Thẻ bằng Số dư Ví"
 *     description: Giao dịch nội bộ trừ thẳng vào số dư ví và kích hoạt thẻ tự động tức thì.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planId: { type: integer }
 *     responses:
 *       200: 
 *         description: Gia hạn thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *       400:
 *         description: Số dư ví không đủ
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 */
router.post('/wallet/membership-upgrade', requireAuth, readerController.upgradeMembership);

/**
 * @openapi
 * /api/reader/membership-plans:
 *   get:
 *     tags: [Reader Wallet]
 *     summary: "Lấy danh sách các Hạng thẻ / Gói hội viên"
 *     description: Trả về danh sách các gói có sẵn để người dùng chọn nâng cấp bằng ví.
 *     security: [{ bearerAuth: [] }]
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
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           plan_name: { type: string }
 *                           price: { type: number }
 *                           duration_days: { type: integer }
 *                           description: { type: string }
 */
router.get('/membership-plans', requireAuth, readerController.getMembershipPlans);

module.exports = router;
