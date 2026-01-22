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
 *     tags:
 *       - Media Folders
 *     summary: Lấy danh sách thư mục
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parent_id
 *         schema:
 *           type: integer
 *           nullable: true
 *         description: Lọc theo thư mục cha (null = root)
 *     responses:
 *       200:
 *         description: Danh sách thư mục
 */
router.get('/', requireAuth, getFolders);

/**
 * @openapi
 * /api/admin/media/folders/tree:
 *   get:
 *     tags:
 *       - Media Folders
 *     summary: Lấy cây thư mục (hierarchical)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cây thư mục
 */
router.get('/tree', requireAuth, getFolderTree);

/**
 * @openapi
 * /api/admin/media/folders/:id:
 *   get:
 *     tags:
 *       - Media Folders
 *     summary: Lấy thông tin thư mục theo ID
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', requireAuth, getFolderById);

/**
 * @openapi
 * /api/admin/media/folders:
 *   post:
 *     tags:
 *       - Media Folders
 *     summary: Tạo thư mục mới
 *     security:
 *       - bearerAuth: []
 */
router.post('/', requireAuth, createFolder);

/**
 * @openapi
 * /api/admin/media/folders/:id:
 *   put:
 *     tags:
 *       - Media Folders
 *     summary: Cập nhật thư mục
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', requireAuth, updateFolder);

/**
 * @openapi
 * /api/admin/media/folders/:id:
 *   delete:
 *     tags:
 *       - Media Folders
 *     summary: Xóa thư mục
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', requireAuth, deleteFolder);

module.exports = router;
