const express = require('express');
const router = express.Router();
const readerActionController = require('../controllers/reader_action.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Reader Actions
 *   description: Các hành động của người đọc (Yêu cầu đăng nhập)
 */

router.use(authenticateToken); // Áp dụng bảo mật cho toàn bộ route này

/**
 * @swagger
 * /api/reader/favorites/toggle:
 *   post:
 *     summary: Thêm/Xóa sách khỏi danh sách yêu thích
 *     tags: [Reader Actions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookId: { type: 'integer' }
 *     responses:
 *       200: { description: OK }
 */
router.post('/favorites/toggle', readerActionController.toggleFavorite);

/**
 * @swagger
 * /api/reader/favorites:
 *   get:
 *     summary: Lấy danh sách sách yêu thích của tôi
 *     tags: [Reader Actions]
 *     responses:
 *       200: { description: OK }
 */
router.get('/favorites', readerActionController.getFavorites);

/**
 * @swagger
 * /api/reader/progress:
 *   post:
 *     summary: Lưu tiến độ đọc sách
 *     tags: [Reader Actions]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookId]
 *             properties:
 *               bookId: { type: 'integer' }
 *               lastPage: { type: 'integer' }
 *               progressPercent: { type: 'number' }
 *               isFinished: { type: 'boolean' }
 *     responses:
 *       200:
 *         description: Đã lưu tiến độ đọc
 *       400:
 *         description: Thiếu bookId
 */
router.post('/progress', readerActionController.updateProgress);

/**
 * @swagger
 * /api/reader/progress/{bookId}:
 *   get:
 *     summary: Lấy tiến độ đọc hiện tại của tôi theo ấn phẩm
 *     tags: [Reader Actions]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Trả tiến độ đọc (hoặc mặc định nếu chưa có)
 */
router.get('/progress/:bookId', readerActionController.getProgress);

module.exports = router;
