const express = require('express');
const { login } = require('../controllers/auth.controller');

const router = express.Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: "Đăng nhập hệ thống quản trị"
 *     description: |
 *       Xác thực tài khoản Admin và trả về **JWT Bearer Token** để truy cập các API bảo mật.
 *       Token có thời hạn 24 giờ. Sau khi nhận token, truyền vào header: `Authorization: Bearer <token>`
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: 'admin@gmail.com', description: 'Email tài khoản quản trị' }
 *               password: { type: string, example: 'admin123', description: 'Mật khẩu' }
 *     responses:
 *       200:
 *         description: "Đăng nhập thành công - Lưu lại token để dùng cho các API khác"
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
 *                         token: { type: string, example: 'eyJhbGciOiJIUzI1NiIs...' }
 *                         expiresIn: { type: string, example: '24h' }
 *                         user:
 *                           type: object
 *                           properties:
 *                             id: { type: integer }
 *                             name: { type: string }
 *                             email: { type: string }
 *                             role: { type: string }
 *       400:
 *         description: "Thiếu thông tin đăng nhập"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: "Sai email hoặc mật khẩu"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/login', login);

module.exports = router;
