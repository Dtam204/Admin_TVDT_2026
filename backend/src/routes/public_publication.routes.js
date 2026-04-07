const express = require('express');
const router = express.Router();
const publicPubController = require('../controllers/public_publication.controller');
const interactionController = require('../controllers/interaction.controller');
const requireAuth = require('../middlewares/auth.middleware');

/**
 * @openapi
 * /api/public/publications:
 *   get:
 *     tags: [Public Books]
 *     summary: "Tìm kiếm và lọc danh sách ấn phẩm"
 *     description: |
 *       API công khai để tìm kiếm ấn phẩm theo nhiều tiêu chí.
 *       Hỗ trợ **Tìm kiếm cơ bản** (từ khóa chung) và **Tìm kiếm nâng cao** (theo từng trường).
 *     security: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: "Từ khóa tìm kiếm chung (Nhan đề, tác giả, ISBN...)"
 *       - in: query
 *         name: title
 *         schema: { type: string }
 *         description: "Tìm theo nhan đề (Tìm kiếm nâng cao)"
 *       - in: query
 *         name: author
 *         schema: { type: string }
 *         description: "Tìm theo tác giả"
 *       - in: query
 *         name: year_from
 *         schema: { type: integer, default: 2005 }
 *         description: "Lọc từ năm xuất bản"
 *       - in: query
 *         name: year_to
 *         schema: { type: integer, default: 2026 }
 *         description: "Lọc đến năm xuất bản"
 *       - in: query
 *         name: publisher_id
 *         schema: { type: integer }
 *         description: "Lọc theo nhà xuất bản"
 *       - in: query
 *         name: media_type
 *         schema: { type: string, enum: [Physical, Digital, Hybrid] }
 *         description: "Dạng tài liệu"
 *       - in: query
 *         name: sort_by
 *         schema: { type: string, enum: [year, title, views, favorites] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [ASC, DESC], default: DESC }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: "Danh sách ấn phẩm khớp điều kiện lọc"
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
 *                         publications:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/Publication' }
 *                         pagination: { $ref: '#/components/schemas/Pagination' }
 *       500:
 *         description: "Lỗi hệ thống"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/', publicPubController.getPublications);

/**
 * @openapi
 * /api/public/publications/{id}:
 *   get:
 *     tags: [Public Books]
 *     summary: "Chi tiết ấn phẩm (Tự động tăng lượt xem)"
 *     description: |
 *       Lấy toàn bộ thông tin chi tiết một ấn phẩm bao gồm: metadata, danh sách copies, thông tin tác giả/nhà xuất bản.
 *       Mỗi lần gọi sẽ **tự động tăng view_count** của ấn phẩm.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: "ID hoặc slug của ấn phẩm"
 *     responses:
 *       200:
 *         description: "Thông tin chi tiết đầy đủ của ấn phẩm"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Publication' }
 *       404:
 *         description: "Không tìm thấy ấn phẩm"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/:id', publicPubController.getPublicationById);

/**
 * @openapi
 * /api/public/publications/{id}/copies:
 *   get:
 *     tags: [Public Books]
 *     summary: "Danh sách bản sao sách vật lý còn trong kho"
 *     description: "Trả về danh sách tất cả copies (bản sao) của ấn phẩm, bao gồm vị trí kệ và trạng thái."
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "Danh sách bản sao"
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
 *                           barcode: { type: string }
 *                           copy_number: { type: string }
 *                           price: { type: number }
 *                           status: { type: string }
 *                           condition: { type: string }
 *                           storage_name: { type: string, description: "Tên kệ/kho lưu trữ" }
 */
router.get('/:id/copies', publicPubController.getPublicationCopies);

/**
 * @openapi
 * /api/public/publications/{id}/summarize:
 *   post:
 *     tags: [Public Books]
 *     summary: "AI Tóm tắt nội dung ấn phẩm (Gemini AI)"
 *     description: |
 *       Sử dụng **Gemini AI** để tự động tóm tắt nội dung ấn phẩm dựa trên metadata.
 *       Kết quả được cache lại để tránh gọi API nhiều lần.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "Bản tóm tắt từ AI"
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
 *                         summary: { type: string, description: "Nội dung tóm tắt" }
 *                         cached: { type: boolean, description: "Lấy từ cache hay mới tạo" }
 */
router.post('/:id/summarize', publicPubController.summarizePublication);

/**
 * @openapi
 * /api/public/publications/{id}/reviews:
 *   get:
 *     tags: [Public Books]
 *     summary: "Danh sách đánh giá của ấn phẩm"
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "Danh sách đánh giá"
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
 *                           rating: { type: integer, minimum: 1, maximum: 5 }
 *                           comment: { type: string }
 *                           member_name: { type: string }
 *                           created_at: { type: string, format: date-time }
 */
router.get('/:id/reviews', interactionController.getBookReviews);

/**
 * @openapi
 * /api/public/publications/{id}/reviews:
 *   post:
 *     tags: [Public Books]
 *     summary: "Gửi đánh giá 1-5 sao"
 *     description: "Nếu không đăng nhập (vãng lai), member_id=null. Nếu đăng nhập, ghi nhận theo member_id (UPSERT)."
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5, example: 5 }
 *               comment: { type: string, example: "Sách rất hay!" }
 *               member_id: { type: integer, nullable: true }
 *     responses:
 *       200:
 *         description: "Đánh giá đã được ghi nhận"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 */
router.post('/:id/reviews', interactionController.submitReview);

/**
 * @openapi
 * /api/public/publications/{id}/favorite:
 *   post:
 *     tags: [Public Books]
 *     summary: "Yêu thích ấn phẩm (Yêu cầu đăng nhập)"
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "Đã thêm vào danh sách yêu thích"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *       401:
 *         description: "Chưa đăng nhập"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/:id/favorite', requireAuth, interactionController.addToWishlist);

/**
 * @openapi
 * /api/public/publications/{id}/favorite:
 *   delete:
 *     tags: [Public Books]
 *     summary: "Bỏ yêu thích ấn phẩm (Yêu cầu đăng nhập)"
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "Đã gỡ khỏi danh sách yêu thích"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 */
router.delete('/:id/favorite', requireAuth, interactionController.removeFromWishlist);

/**
 * @openapi
 * /api/public/publications/{id}/read:
 *   post:
 *     tags: [Public Books]
 *     summary: "Ghi nhận lượt ĐỌC (Tăng viewCount)"
 *     description: "Gọi API này khi người dùng nhấn nút 'Đọc ngay'. Tự động tăng view_count."
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "Ghi nhận thành công"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 */
router.post('/:id/read', interactionController.recordRead);

/**
 * @openapi
 * /api/public/publications/{id}/download:
 *   post:
 *     tags: [Public Books]
 *     summary: "Ghi nhận lượt TẢI ấn phẩm"
 *     description: "Gọi API này khi người dùng nhấn nút 'Tải và đọc'."
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "Ghi nhận thành công"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 */
router.post('/:id/download', interactionController.recordDownload);

module.exports = router;
