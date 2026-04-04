const express = require('express');
const { login } = require('../controllers/auth.controller');

const router = express.Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Admin System]
 *     summary: Đăng nhập vào hệ thống quản trị
 *     description: Xác thực người dùng và trả về JWT token để truy cập các API bảo mật.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: 'string', example: 'admin@gmail.com' }
 *               password: { type: 'string', example: 'admin123' }
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     token: { type: 'string', example: 'eyJhbGciOi...' }
 *                     user: { type: 'object' }
 *       401:
 *         description: Sai thông tin đăng nhập
 */
router.post('/login', login);

module.exports = router;
