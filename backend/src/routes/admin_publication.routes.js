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
 *     tags: [Admin Books]
 *     summary: Danh sách ấn phẩm (Admin)
 *     description: Lấy danh sách toàn bộ ấn phẩm với phân trang. Dùng cho trang quản lý sách.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: 'integer', default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: 'integer', default: 10 }
 *     responses:
 *       200:
 *         description: Thành công
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
 *     tags: [Admin Books]
 *     summary: Tạo ấn phẩm mới
 *     description: Thêm một đầu sách hoặc ấn phẩm mới vào hệ thống.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Publication' }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *
 * /api/admin/publication/summarize:
 *   post:
 *     tags: [Admin Books]
 *     summary: Tóm tắt nội dung bằng AI
 *     description: Sử dụng Gemini AI để tóm tắt nội dung ấn phẩm từ mô tả hoặc file đính kèm.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: { type: 'string', description: 'Nội dung cần tóm tắt' }
 *     responses:
 *       200:
 *         description: Tóm tắt thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *
 * /api/admin/publication/storage-locations:
 *   get:
 *     tags: [Admin Books]
 *     summary: Danh sách vị trí lưu trữ (Kho)
 *     description: Lấy danh sách các vị trí, kệ sách trong thư viện.
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *
 * /api/admin/publication/dashboard/stats:
 *   get:
 *     tags: [Admin Books]
 *     summary: Thống kê ấn phẩm cho Dashboard
 *     description: Lấy các số liệu tổng quan về sách (tổng số, đang mượn, quá hạn...)
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *
 * /api/admin/publication/{id}:
 *   get:
 *     tags: [Admin Books]
 *     summary: Chi tiết ấn phẩm
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/PublicationDetail' }
 *   put:
 *     tags: [Admin Books]
 *     summary: Cập nhật thông tin ấn phẩm
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
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *   delete:
 *     tags: [Admin Books]
 *     summary: Xóa ấn phẩm
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 */
router.post('/', checkPermission('books.manage'), adminPubController.create);
router.post('/summarize', checkPermission('books.manage'), AdminAIController.summarize);
router.get('/storage-locations', checkPermission('books.view'), adminPubController.getStorageLocations);
router.get('/dashboard/stats', checkPermission('books.view'), adminPubController.getStats);
router.get('/:id', checkPermission('books.view'), adminPubController.getDetail);
router.put('/:id', checkPermission('books.manage'), adminPubController.update);
router.delete('/:id', checkPermission('books.manage'), adminPubController.delete);
router.get('/', checkPermission('books.view'), adminPubController.getAll);

module.exports = router;
