const express = require('express');
const {
  getFolders,
  getFolderTree,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
} = require('../controllers/media.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/media/folders:
 *   get:
 *     tags: [Admin Media]
 *     summary: Danh sách thư mục
 *     description: Lấy danh sách các thư mục media (phẳng hoặc theo cấp cha).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parent_id
 *         schema:
 *           type: integer
 *           nullable: true
 *         description: Lọc theo thư mục cha (null = thư mục gốc)
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *
 *   post:
 *     tags: [Admin Media]
 *     summary: Tạo thư mục mới
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: 'string', description: 'Tên thư mục' }
 *               parent_id: { type: 'integer', nullable: true, description: 'ID thư mục cha' }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *
 * /api/admin/media/folders/tree:
 *   get:
 *     tags: [Admin Media]
 *     summary: Cây thư mục hệ thống
 *     description: Lấy toàn bộ cấu trúc thư mục dưới dạng hình cây (hierarchical).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *
 * /api/admin/media/folders/{id}:
 *   get:
 *     tags: [Admin Media]
 *     summary: Thông tin thư mục
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
 *             schema: { $ref: '#/components/schemas/BaseResponse' }
 *
 *   put:
 *     tags: [Admin Media]
 *     summary: Cập nhật thư mục
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
 *               name: { type: 'string' }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *
 *   delete:
 *     tags: [Admin Media]
 *     summary: Xóa thư mục
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
 */
router.get('/', requireAuth, getFolders);
router.get('/tree', requireAuth, getFolderTree);
router.get('/:id', requireAuth, getFolderById);
router.post('/', requireAuth, createFolder);
router.put('/:id', requireAuth, updateFolder);
router.delete('/:id', requireAuth, deleteFolder);

module.exports = router;
