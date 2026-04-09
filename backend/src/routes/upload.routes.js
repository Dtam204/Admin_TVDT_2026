const express = require('express');
const router = express.Router();
const { uploadPdf, uploadMediaImage, uploadMediaAny, handleUploadError } = require('../middlewares/upload.middleware');
const uploadController = require('../controllers/upload.controller');
const { checkPermission } = require('../middlewares/rbac.middleware');

/**
 * @swagger
 * /api/admin/upload/pdf:
 *   post:
 *     summary: Upload file PDF lên server (Disk Storage)
 *     tags: [Admin Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
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
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     url: { type: string }
 *                     originalName: { type: string }
 *                     size: { type: number }
 */

router.post('/pdf', 
  checkPermission('media.manage'),
  uploadPdf.single('file'), 
  handleUploadError, 
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file PDF để upload.' });
    }

    const fileUrl = `/uploads/pdfs/${req.file.filename}`;
    res.status(200).json({
      success: true,
      data: { url: fileUrl, filename: req.file.filename }
    });
});

// Alias cho /pdf để tương thích với một số luồng cũ
router.post('/file', 
  checkPermission('media.manage'),
  uploadMediaAny.single('file'), 
  handleUploadError,
  uploadController.uploadFile
);

// Upload nhiều file vào Media Library
router.post('/files',
  checkPermission('media.manage'),
  uploadMediaAny.array('files', 10),
  handleUploadError,
  uploadController.uploadFiles
);

// Route upload ảnh (Thumbnail/Cover)
router.post('/image',
  checkPermission('media.manage'),
  uploadMediaImage.single('file'),
  handleUploadError,
  uploadController.uploadImage
);

module.exports = router;
