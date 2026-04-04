const express = require('express');
const router = express.Router();
const publicPubController = require('../controllers/public_publication.controller');
const interactionController = require('../controllers/interaction.controller');
const requireAuth = require('../middlewares/auth.middleware');

/**
 * @openapi
 * tags:
 *   name: Public API - Publications
 *   description: Các API công khai cho người dùng (Reader) và trang chủ (Không cần Login)
 */

// ============================================================================
// 1. TÌM KIẾM & DANH SÁCH
// ============================================================================


/**
 * @openapi
 * /api/public/publications:
 *   get:
 *     tags: [Public API - Publications]
 *     summary: Tìm kiếm và lọc danh sách ấn phẩm (Cơ bản & Nâng cao)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: 'string' }
 *         description: Từ khóa tìm kiếm chung (Nhan đề, tác giả, mã...)
 *       - in: query
 *         name: title
 *         schema: { type: 'string' }
 *         description: Tìm theo nhan đề (Nâng cao)
 *       - in: query
 *         name: author
 *         schema: { type: 'string' }
 *         description: Tìm theo tác giả (Nâng cao)
 *       - in: query
 *         name: year_from
 *         schema: { type: 'integer', default: 2005 }
 *         description: Lọc từ năm xuất bản
 *       - in: query
 *         name: year_to
 *         schema: { type: 'integer', default: 2026 }
 *         description: Lọc đến năm xuất bản
 *       - in: query
 *         name: publisher_id
 *         schema: { type: 'integer' }
 *         description: Lọc theo nhà xuất bản
 *       - in: query
 *         name: media_type
 *         schema: { type: 'string' }
 *         description: Dạng tài liệu (Sách, Tạp chí, Sách số...)
 *       - in: query
 *         name: sort_by
 *         schema: { type: 'string', enum: [year, title, views, favorites] }
 *         description: Sắp xếp theo trường dữ liệu
 *       - in: query
 *         name: order
 *         schema: { type: 'string', enum: [ASC, DESC], default: DESC }
 *         description: Thứ tự sắp xếp
 *       - in: query
 *         name: page
 *         schema: { type: 'integer', default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: 'integer', default: 10 }
 *     responses:
 *       200:
 *         description: Danh sách ấn phẩm khớp điều kiện lọc
 */
router.get('/', publicPubController.getPublications);


/**
 * @openapi
 * /api/public/publications/{id}:
 *   get:
 *     tags: [Public API - Publications]
 *     summary: Lấy chi tiết một ấn phẩm (Tự động tăng lượt xem)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Thông tin chi tiết ấn phẩm
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/PublicationDetail' }
 *       404:
 *         description: Không tìm thấy ấn phẩm
 */
router.get('/:id', publicPubController.getPublicationById);

/**
 * @openapi
 * /api/public/publications/{id}/copies:
 *   get:
 *     tags: [Public API - Publications]
 *     summary: Lấy danh sách các bản sao sách vật lý (Copies) còn tồn trong kho
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Danh sách bản sao của ấn phẩm
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: 'array'
 *                       items:
 *                         type: 'object'
 *                         properties:
 *                           id: { type: 'integer' }
 *                           barcode: { type: 'string' }
 *                           copy_number: { type: 'string' }
 *                           price: { type: 'number' }
 *                           status: { type: 'string' }
 *                           condition: { type: 'string' }
 *                           storage_name: { type: 'string', description: 'Tên kệ/kho lưu trữ' }
 */
router.get('/:id/copies', publicPubController.getPublicationCopies);

/**
 * @openapi
 * /api/public/publications/{id}/summarize:
 *   post:
 *     tags: [Public API - Publications]
 *     summary: AI Tóm tắt nội dung ấn phẩm (Dành cho Mobile App)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Bản tóm tắt của AI
 */
router.post('/:id/summarize', publicPubController.summarizePublication);

// ============================================================================
// 2. TƯƠNG TÁC (ĐỌC / TẢI / ĐÁNH GIÁ / YÊU THÍCH)
// ============================================================================

/**
 * @openapi
 * /api/public/publications/{id}/reviews:
 *   get:
 *     tags: [Public API - Publications]
 *     summary: "Lấy danh sách đánh giá của ấn phẩm"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Danh sách đánh giá }
 */
router.get('/:id/reviews', interactionController.getBookReviews);

/**
 * @openapi
 * /api/public/publications/{id}/reviews:
 *   post:
 *     tags: [Public API - Publications]
 *     summary: "Gửi đánh giá 1-5 sao (Guest/Member)"
 *     description: Nếu k đăng nhập (vãng lai), member_id = null. Nếu đăng nhập, ghi nhận theo member_id (UPSERT).
 */
router.post('/:id/reviews', interactionController.submitReview);

/**
 * @openapi
 * /api/public/publications/{id}/favorite:
 *   post:
 *     tags: [Public API - Publications]
 *     summary: "Yêu thích ấn phẩm (Bắt buộc Login)"
 *     security: [{ bearerAuth: [] }]
 */
router.post('/:id/favorite', requireAuth, interactionController.addToWishlist);

/**
 * @openapi
 * /api/public/publications/{id}/favorite:
 *   delete:
 *     tags: [Public API - Publications]
 *     summary: "Bỏ yêu thích ấn phẩm (Bắt buộc Login)"
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/:id/favorite', requireAuth, interactionController.removeFromWishlist);

/**
 * @openapi
 * /api/public/publications/{id}/read:
 *   post:
 *     tags: [Public API - Publications]
 *     summary: "Ghi nhận lượt ĐỌC (Tự động tăng viewCount)"
 *     description: Gọi API này khi người dùng nhấn nút 'Đọc ngay'.
 */
router.post('/:id/read', interactionController.recordRead);

/**
 * @openapi
 * /api/public/publications/{id}/download:
 *   post:
 *     tags: [Public API - Publications]
 *     summary: "Ghi nhận lượt TẢI (Tải ấn phẩm lần đầu)"
 *     description: Gọi API này khi người dùng nhấn nút 'Tải và đọc'.
 */
router.post('/:id/download', interactionController.recordDownload);

module.exports = router;
