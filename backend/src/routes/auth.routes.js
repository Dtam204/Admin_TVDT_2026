const express = require('express');
const { login } = require('../controllers/auth.controller');

const router = express.Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Public Auth
 *     summary: Đăng nhập CMS Thư viện TN
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@gmail.com
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOi...
 *                 user:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Administrator
 *                     email:
 *                       type: string
 *                       example: admin@gmail.com
 *       401:
 *         description: Sai email hoặc mật khẩu
 */
// Note: Auth controller đã có validation riêng, không cần Joi validation ở route level
router.post('/login', login);

module.exports = router;




