const express = require('express');
const {
  adminGetComments,
  adminModerateComment,
  adminGetReports,
  adminDeleteComment,
  adminReplyComment,
} = require('../controllers/comment.controller');
const { checkPermission } = require('../middlewares/rbac.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/comments:
 *   get:
 *     tags: [Admin Comments]
 *     summary: Danh sách tất cả bình luận (kiểm duyệt)
 */
router.get('/', checkPermission('books.view'), adminGetComments);

/**
 * @openapi
 * /api/admin/comments/{id}/status:
 *   put:
 *     tags: [Admin Comments]
 *     summary: Duyệt/Ẩn bình luận
 */
router.put('/:id/status', checkPermission('books.manage'), adminModerateComment);

/**
 * @openapi
 * /api/admin/comments/{id}:
 *   delete:
 *     tags: [Admin Comments]
 *     summary: Xóa mềm bình luận
 */
router.delete('/:id', checkPermission('books.manage'), adminDeleteComment);

/**
 * @openapi
 * /api/admin/comments/{id}/reply:
 *   post:
 *     tags: [Admin Comments]
 *     summary: Phản hồi bình luận từ CMS
 */
router.post('/:id/reply', checkPermission('books.manage'), adminReplyComment);

/**
 * @openapi
 * /api/admin/comments/reports:
 *   get:
 *     tags: [Admin Comments]
 *     summary: Danh sách báo cáo vi phạm
 */
router.get('/reports', checkPermission('books.view'), adminGetReports);

module.exports = router;
