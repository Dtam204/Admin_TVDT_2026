const express = require('express');
const router = express.Router();
const adminPubController = require('../controllers/admin_publication.controller');
const AdminAIController = require('../controllers/admin_ai.controller');
const fs = require('fs');
const { uploadPdf, handleUploadError } = require('../middlewares/upload.middleware');
const { checkPermission } = require('../middlewares/rbac.middleware');

// Sử dụng centralized middleware thay vì cấu hình ad-hoc

/**
 * @openapi
 * /api/admin/publication:
 *   get:
 *     tags: [Admin Publication]
 *     summary: Danh sách ấn phẩm (Admin)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: 'integer', default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: 'integer', default: 10 }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: 'array', items: { $ref: '#/components/schemas/Publication' } }
 *                     pagination: { $ref: '#/components/schemas/Pagination' }
 *   post:
 *     tags: [Admin Publication]
 *     summary: Tạo ấn phẩm mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Publication' }
 *     responses:
 *       201: { description: Created }
 *
 * /api/admin/publication/{id}:
 *   get:
 *     tags: [Admin Publication]
 *     summary: Chi tiết ấn phẩm
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200: { description: OK }
 *   put:
 *     tags: [Admin Publication]
 *     summary: Cập nhật ấn phẩm
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Publication' }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Admin Publication]
 *     summary: Xóa ấn phẩm
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200: { description: Deleted }
 */
router.post('/', checkPermission('books.manage'), adminPubController.create);
router.post('/summarize', checkPermission('books.manage'), AdminAIController.summarize);
router.get('/:id', checkPermission('books.view'), adminPubController.getDetail);
router.put('/:id', checkPermission('books.manage'), adminPubController.update);
router.delete('/:id', checkPermission('books.manage'), adminPubController.delete);
router.get('/dashboard/stats', checkPermission('books.view'), adminPubController.getStats);
router.get('/', checkPermission('books.view'), adminPubController.getAll);

module.exports = router;
