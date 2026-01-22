const express = require('express');
const { uploadImage, uploadFile, uploadFiles, deleteImage } = require('../controllers/upload.controller');
const { uploadSingle, uploadMultiple, uploadNewsSingle, handleUploadError } = require('../middlewares/upload.middleware');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/upload/image:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Upload một file ảnh
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: /uploads/news/image-1234567890.jpg
 *                     filename:
 *                       type: string
 *                     originalName:
 *                       type: string
 *                     size:
 *                       type: integer
 *                     mimetype:
 *                       type: string
 *       400:
 *         description: Lỗi upload
 */
router.post(
  '/image',
  requireAuth,
  uploadNewsSingle,
  handleUploadError,
  uploadImage
);

/**
 * @openapi
 * /api/admin/upload/image/:filename:
 *   delete:
 *     tags:
 *       - Upload
 *     summary: Xóa file ảnh
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: File không tồn tại
 */
router.delete('/image/:filename', requireAuth, deleteImage);

/**
 * POST /api/admin/upload/file
 * Upload một file (hỗ trợ nhiều loại: image, document, video, audio)
 */
router.post(
  '/file',
  requireAuth,
  uploadSingle,
  handleUploadError,
  uploadFile
);

/**
 * POST /api/admin/upload/files
 * Upload nhiều file cùng lúc
 */
router.post(
  '/files',
  requireAuth,
  uploadMultiple,
  handleUploadError,
  uploadFiles
);

module.exports = router;
