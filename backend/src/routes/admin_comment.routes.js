const express = require('express');
const {
  adminGetComments,
  adminModerateComment,
  adminGetReports
} = require('../controllers/comment.controller');

const router = express.Router();

/**
 * @openapi
 * /api/admin/comments:
 *   get:
 *     tags: [Admin Comments]
 *     summary: Danh sách tất cả bình luận (kiểm duyệt)
 */
router.get('/', adminGetComments);

/**
 * @openapi
 * /api/admin/comments/{id}/status:
 *   put:
 *     tags: [Admin Comments]
 *     summary: Duyệt/Ẩn bình luận
 */
router.put('/:id/status', adminModerateComment);

/**
 * @openapi
 * /api/admin/comments/reports:
 *   get:
 *     tags: [Admin Comments]
 *     summary: Danh sách báo cáo vi phạm
 */
router.get('/reports', adminGetReports);

module.exports = router;
