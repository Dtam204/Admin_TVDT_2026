const express = require('express');
const router = express.Router();
const publicPubController = require('../controllers/public_publication.controller');
const interactionController = require('../controllers/interaction.controller');
const requireAuth = require('../middlewares/auth.middleware');
const { authenticateTokenOptional } = require('../middlewares/auth.middleware');
const { pool } = require('../config/database');

/**
 * @openapi
 * /api/public/publications/lookups:
 *   get:
 *     tags: [Public Books]
 *     summary: "Danh sách trường lọc ấn phẩm cho App"
 *     description: "Trả về danh sách tác giả, nhà xuất bản, bộ sưu tập, năm xuất bản, ngôn ngữ, media_type để map filter trên giao diện App."
 *     security: []
 *     responses:
 *       200:
 *         description: "Danh sách lookup/filter thành công"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PublicationLookups'
 */
router.get('/lookups', publicPubController.getPublicationLookups);

/**
 * @openapi
 * /api/public/publications/home-unified:
 *   get:
 *     tags: [Public Books]
 *     summary: "Dữ liệu Trang chủ tập trung (All-in-one)"
 *     description: "Trả về dữ liệu tổng hợp cho trang Home: Banners, Trending, Newest, Categories."
 *     security: []
 *     responses:
 *       200:
 *         description: "Dữ liệu trang chủ tích hợp"
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
 *                         banners: { type: array, items: { $ref: '#/components/schemas/Publication' } }
 *                         trending: { type: array, items: { $ref: '#/components/schemas/Publication' } }
 *                         newest: { type: array, items: { $ref: '#/components/schemas/Publication' } }
 *                         categories:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id: { type: string }
 *                               name: { type: string }
 *                               icon: { type: string }
 */
router.get('/home-unified', publicPubController.getHomePageData);
/**
 * @openapi
 * /api/public/publications/{id}:
 *   get:
 *     tags: [Public Books]
 *     summary: "Chi tiết ấn phẩm (Tự động tăng lượt xem)"
 *     description: |
 *       Lấy toàn bộ thông tin chi tiết một ấn phẩm bao gồm: metadata, danh sách copies, thông tin tác giả/nhà xuất bản.
 *       Kèm theo danh sách **tài liệu liên quan**, trailerInfo, trang xem trước và tệp số hóa phục vụ UI chi tiết của App.
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
 *                     data: { $ref: '#/components/schemas/PublicationDetail' }
 *       404:
 *         description: "Không tìm thấy ấn phẩm"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/:id', publicPubController.getPublicationById);

/**
 * @openapi
 * /api/public/publications/{id}/reading-content:
 *   get:
 *     tags: [Public Books]
 *     summary: "Dữ liệu đọc online chuẩn cho 3 chế độ"
 *     description: |
 *       Trả về payload đọc online đồng bộ cho giao diện Reader:
 *       - `page_mode`: đọc theo trang PDF
 *       - `chapter_mode`: đọc theo chương (map từ TOC của PDF)
 *       - `scroll_mode`: đọc cuộn fulltext
 *
 *       Quy ước nguồn dữ liệu:
 *       - Trang + Chương lấy theo PDF
 *       - Cuộn lấy theo fulltext
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: "ID hoặc slug của ấn phẩm"
 *     responses:
 *       200:
 *         description: "Dữ liệu đọc online"
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
 *                         publication:
 *                           type: object
 *                           properties:
 *                             id: { type: integer }
 *                             title: { type: string }
 *                             author: { type: string }
 *                             thumbnail: { type: string, nullable: true }
 *                             media_type: { type: string }
 *                             access_policy: { type: string }
 *                         reading_content:
 *                           type: object
 *                           properties:
 *                             can_read: { type: boolean }
 *                             source_policy:
 *                               type: object
 *                               properties:
 *                                 page: { type: string, example: "pdf" }
 *                                 chapter: { type: string, example: "pdf" }
 *                                 scroll: { type: string, example: "fulltext" }
 *                             available_modes:
 *                               type: array
 *                               items: { type: string, enum: [page, chapter, scroll] }
 *                             default_mode: { type: string, nullable: true, enum: [page, chapter, scroll] }
 *                             page_mode:
 *                               type: object
 *                               properties:
 *                                 enabled: { type: boolean }
 *                                 pdf_url: { type: string, nullable: true }
 *                                 total_pages: { type: integer }
 *                                 preview_pages:
 *                                   type: array
 *                                   items:
 *                                     type: object
 *                                     properties:
 *                                       index: { type: integer }
 *                                       label: { type: string }
 *                                       value: { type: string }
 *                             chapter_mode:
 *                               type: object
 *                               properties:
 *                                 enabled: { type: boolean }
 *                                 total_chapters: { type: integer }
 *                                 chapters:
 *                                   type: array
 *                                   items:
 *                                     type: object
 *                                     properties:
 *                                       id: { type: string }
 *                                       title: { type: string }
 *                                       order: { type: integer }
 *                                       start_page: { type: integer }
 *                                       end_page: { type: integer }
 *                                       page_range: { type: string }
 *                             scroll_mode:
 *                               type: object
 *                               properties:
 *                                 enabled: { type: boolean }
 *                                 full_text:
 *                                   type: object
 *                                   properties:
 *                                     enabled: { type: boolean }
 *                                     format: { type: string, nullable: true, enum: [html, text] }
 *                                     content: { type: string }
 *                                     word_count: { type: integer }
 *                                     excerpt: { type: string }
 */
router.get('/:id/reading-content', publicPubController.getPublicationReadingContent);

/**
 * @openapi
 * /api/public/publications/{id}/related:
 *   get:
 *     tags: [Public Books]
 *     summary: "Danh sách tài liệu liên quan"
 *     description: "Trả về danh sách ấn phẩm liên quan theo bộ sưu tập, NXB, năm, ngôn ngữ để map section 'Tài liệu liên quan'."
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: "ID hoặc slug của ấn phẩm"
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12, minimum: 1, maximum: 24 }
 *     responses:
 *       200:
 *         description: "Danh sách tài liệu liên quan"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/PublicationRelatedItem' }
 */
router.get('/:id/related', publicPubController.getRelatedPublications);

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
 *                           storage_location_id: { type: integer, nullable: true }
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
 *       404:
 *         description: "Không tìm thấy ấn phẩm để tóm tắt"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
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
 *                       type: object
 *                       properties:
 *                         reviews:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id: { type: integer }
 *                               memberId: { type: integer, nullable: true }
 *                               rating: { type: integer, minimum: 1, maximum: 5 }
 *                               comment: { type: string }
 *                               fullName: { type: string }
 *                               createdAt: { type: string, format: date-time }
 *                         stats:
 *                           type: object
 *                           properties:
 *                             avgRating: { type: number }
 *                             avg_rating: { type: number }
 *                             totalReviews: { type: integer }
 *                             total_reviews: { type: integer }
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
 *       201:
 *         description: "Đánh giá mới đã được ghi nhận"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 */
router.post('/:id/reviews', authenticateTokenOptional, interactionController.submitReview);

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
 *       201:
 *         description: "Đã thêm vào danh sách yêu thích"
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
 *                         isFavorited: { type: boolean }
 *                         is_favorited: { type: boolean }
 *                         favoriteCount: { type: integer }
 *                         favorite_count: { type: integer }
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
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         isFavorited: { type: boolean }
 *                         is_favorited: { type: boolean }
 *                         favoriteCount: { type: integer }
 *                         favorite_count: { type: integer }
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
 *       201:
 *         description: "Ghi nhận thành công"
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
 *                         viewCount: { type: integer }
 *                         view_count: { type: integer }
 *                         tracked: { type: boolean }
 */
router.post('/:id/read', authenticateTokenOptional, interactionController.recordRead);

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
 *       201:
 *         description: "Ghi nhận thành công"
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
 *                         viewCount: { type: integer }
 *                         view_count: { type: integer }
 *                         tracked: { type: boolean }
 */
router.post('/:id/download', authenticateTokenOptional, interactionController.recordDownload);

module.exports = router;
