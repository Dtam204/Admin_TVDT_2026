const express = require('express');
const router = express.Router();
const publicPubController = require('../controllers/public_publication.controller');

/**
 * @openapi
 * tags:
 *   name: Public API - Publications
 *   description: Các API công khai cho người dùng (Reader) và trang chủ (Không cần Login)
 */


/**
 * @openapi
 * /api/public/publications:
 *   get:
 *     tags: [Public API - Publications]
 *     summary: Tìm kiếm và lọc danh sách ấn phẩm
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: 'string' }
 *         description: Từ khóa tìm kiếm
 *       - in: query
 *         name: category
 *         schema: { type: 'string' }
 *         description: Lọc theo Collection ID
 *       - in: query
 *         name: is_digital
 *         schema: { type: 'boolean' }
 *       - in: query
 *         name: page
 *         schema: { type: 'integer', default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: 'integer', default: 10 }
 *     responses:
 *       200:
 *         description: Danh sách ấn phẩm
 */
router.get('/', publicPubController.getPublications);

/**
 * @openapi
 * /api/public/publications/barcode/{barcode}:
 *   get:
 *     tags: [Public API - Publications]
 *     summary: Tìm kiếm ấn phẩm/sách bằng mã vạch (Barcode của bản sao)
 *     parameters:
 *       - in: path
 *         name: barcode
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Chi tiết ấn phẩm và mã vạch
 *       404:
 *         description: Không tìm thấy
 */
router.get('/barcode/:barcode', publicPubController.getPublicationByBarcode);

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
 *         description: Danh sách bản sao
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

module.exports = router;
