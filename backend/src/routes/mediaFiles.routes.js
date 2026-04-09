const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/media.controller');
const requireAuth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/rbac.middleware');

/**
 * @openapi
 * /api/admin/media/files:
 *   get:
 *     tags: [Admin Media]
 *     summary: Danh sách tệp tin
 *     description: Lấy danh sách toàn bộ tệp tin (hình ảnh, tài liệu) trong hệ thống media.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folderId
 *         schema: { type: 'integer' }
 *         description: Lọc tệp tin theo ID thư mục
 *       - in: query
 *         name: search
 *         schema: { type: 'string' }
 *         description: Tìm kiếm theo tên tệp
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
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/MediaFile' }
 */
router.get('/', requireAuth, checkPermission('media.view'), mediaController.getFiles);

/**
 * @openapi
 * /api/admin/media/files/{id}:
 *   get:
 *     tags: [Admin Media]
 *     summary: Chi tiết tệp tin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
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
 *                     data: { $ref: '#/components/schemas/MediaFile' }
 *
 *   put:
 *     tags: [Admin Media]
 *     summary: Cập nhật thông tin tệp tin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: 'string', description: 'Tên hiển thị mới' }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *
 *   delete:
 *     tags: [Admin Media]
 *     summary: Xóa tệp tin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 */
router.get('/:id', requireAuth, checkPermission('media.view'), mediaController.getFileById);
router.delete('/:id', requireAuth, checkPermission('media.manage'), mediaController.deleteFile);
router.put('/:id', requireAuth, checkPermission('media.manage'), mediaController.updateFile);

module.exports = router;
