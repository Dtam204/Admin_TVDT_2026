const express = require('express');
const router = express.Router();
const { uploadPdf, handleUploadError } = require('../middlewares/upload.middleware');
const requireAuth = require('../middlewares/auth.middleware');

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

// Alias cho /pdf để tương thích với uploadFile client helper
router.post('/file', 
  uploadPdf.single('file'), 
  handleUploadError, 
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file để upload.' });
    }

    const fileUrl = `/uploads/pdfs/${req.file.filename}`;
    res.status(200).json({
      success: true,
      data: { url: fileUrl, filename: req.file.filename }
    });
});

// Route upload ảnh (Thumbnail/Cover)
const { uploadMedia } = require('../middlewares/upload.middleware');
router.post('/image',
  uploadMedia.single('file'),
  handleUploadError,
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh để upload.' });
    }

    const fileUrl = `/uploads/media/${req.file.filename}`;
    res.status(200).json({
      success: true,
      data: { url: fileUrl, filename: req.file.filename }
    });
});

module.exports = router;
