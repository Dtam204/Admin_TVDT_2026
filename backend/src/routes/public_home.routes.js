const express = require('express');
const router = express.Router();
const publicHomeController = require('../controllers/public_home.controller');

/**
 * @openapi
 * components:
 *   schemas:
 *     PublicBookItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID của sách
 *         title:
 *           type: string
 *           description: Tiêu đề sách (đã parse Tiếng Việt)
 *         thumbnail:
 *           type: string
 *           description: Ảnh bìa sách
 *         author:
 *           type: string
 *           description: Tên tác giả
 *         publication_year:
 *           type: integer
 *           description: Năm xuất bản
 *         dominant_color:
 *           type: string
 *           description: Màu chủ đạo (dành cho UI/Banner)
 *         is_digital:
 *           type: boolean
 *           description: Là sách điện tử hay sách giấy
 *         description:
 *           type: string
 *           description: Mô tả ngắn của sách (dành riêng cho Banner)
 *         borrow_count:
 *           type: integer
 *           description: Số lượt mượn (Dành riêng cho API mượn nhiều nhất)
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Ngày tạo (Dành riêng cho API mới cập nhật)
 */

/**
 * @openapi
 * /api/public/home/get-suggest-books:
 *   get:
 *     tags: [Home]
 *     summary: Lấy danh sách ấn phẩm được đề xuất cho người dùng
 *     responses:
 *       200:
 *         description: Trả về mảng array các ấn phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicBookItem'
 */
router.get('/get-suggest-books', publicHomeController.getSuggestBooks);

/**
 * @openapi
 * /api/public/home/get-updated-books:
 *   get:
 *     tags: [Home]
 *     summary: Lấy danh sách ấn phẩm mới cập nhật
 *     responses:
 *       200:
 *         description: Trả về danh sách sách mới nhất
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicBookItem'
 */
router.get('/get-updated-books', publicHomeController.getUpdatedBooks);

/**
 * @openapi
 * /api/public/home/get-most-viewed-books-of-the-week:
 *   get:
 *     tags: [Home]
 *     summary: Ấn phẩm được xem nhiều nhất trong tuần
 *     responses:
 *       200:
 *         description: Trả về danh sách sách xem nhiều
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicBookItem'
 */
router.get('/get-most-viewed-books-of-the-week', publicHomeController.getMostViewedBooksOfTheWeek);

/**
 * @openapi
 * /api/public/home/get-most-borrowed-documents:
 *   get:
 *     tags: [Home]
 *     summary: Ấn phẩm được mượn nhiều nhất
 *     responses:
 *       200:
 *         description: Trả về top mượn
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicBookItem'
 */
router.get('/get-most-borrowed-documents', publicHomeController.getMostBorrowedDocuments);

/**
 * @openapi
 * /api/public/home/get-top-favorite:
 *   get:
 *     tags: [Home]
 *     summary: Danh sách ấn phẩm nổi bật
 *     responses:
 *       200:
 *         description: Trả về top yêu thích
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicBookItem'
 */
router.get('/get-top-favorite', publicHomeController.getTopFavorite);

/**
 * @openapi
 * /api/public/home/get-top-recommend:
 *   get:
 *     tags: [Home]
 *     summary: Danh sách ấn phẩm đề cử (banner)
 *     responses:
 *       200:
 *         description: Banner list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicBookItem'
 */
router.get('/get-top-recommend', publicHomeController.getTopRecommend);

/**
 * Rerouted Aggregate /api/public/home data (kept for backward compatibility)
 */
router.get('/', publicHomeController.getHomeData);

module.exports = router;
