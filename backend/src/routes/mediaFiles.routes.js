const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/media.controller');
const requireAuth = require('../middlewares/auth.middleware');

// GET /api/admin/media/files - Lấy danh sách files
router.get('/', requireAuth, mediaController.getFiles);

// GET /api/admin/media/files/:id - Lấy thông tin file theo ID
router.get('/:id', requireAuth, mediaController.getFileById);

// DELETE /api/admin/media/files/:id - Xóa file
router.delete('/:id', requireAuth, mediaController.deleteFile);

// PUT /api/admin/media/files/:id - Cập nhật thông tin file
router.put('/:id', requireAuth, mediaController.updateFile);

module.exports = router;
