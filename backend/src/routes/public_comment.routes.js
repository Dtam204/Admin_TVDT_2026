const express = require('express');
const {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  reportComment
} = require('../controllers/comment.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/public/comments/{objectType}/{objectId}:
 *   get:
 *     tags: [Comments]
 *     summary: Lấy danh sách bình luận của một đối tượng (Sách, Tin tức,...)
 */
router.get('/:objectType/:objectId', getComments);

/**
 * Các route yêu cầu đăng nhập
 */
router.use(requireAuth);

/**
 * @openapi
 * /api/public/comments:
 *   post:
 *     tags: [Comments]
 *     summary: Tạo bình luận mới hoặc phản hồi
 */
router.post('/', createComment);

/**
 * @openapi
 * /api/public/comments/{id}:
 *   put:
 *     tags: [Comments]
 *     summary: Cập nhật nội dung bình luận (chỉ chủ sở hữu)
 *   delete:
 *     tags: [Comments]
 *     summary: Xóa bình luận (chỉ chủ sở hữu)
 */
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);

/**
 * @openapi
 * /api/public/comments/{id}/report:
 *   post:
 *     tags: [Comments]
 *     summary: Báo cáo vi phạm bình luận
 */
router.post('/:id/report', reportComment);

module.exports = router;
