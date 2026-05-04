const express = require('express');
const {
  getComments,
  getCommentReplies,
  createComment,
  updateComment,
  deleteComment,
  reportComment,
  reactComment
} = require('../controllers/comment.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

const requireReaderAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Bạn cần đăng nhập bằng tài khoản bạn đọc để thực hiện thao tác này.',
      code: 401,
    });
  }

  if (req.user.type !== 'reader') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ tài khoản bạn đọc mới được thao tác trên bình luận của App.',
      code: 403,
    });
  }

  return next();
};

/**
 * @openapi
 * /api/public/comments/news/{newsId}:
 *   get:
 *     tags: [Comments]
 *     summary: Lấy danh sách comment của bài tin
 *     description: Trả về danh sách comment cấp 1 theo trang, chỉ áp dụng cho news.
 *     parameters:
 *       - in: path
 *         name: newsId
 *         required: true
 *         schema: { type: integer }
 *         description: Id bài tin
 *       - in: query
 *         name: page
 *         required: false
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         required: false
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Danh sách comment thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CommentListResponse'
 */
router.get('/news/:newsId', (req, res, next) => {
  req.params.objectType = 'news';
  req.params.objectId = req.params.newsId;
  return getComments(req, res, next);
});

/**
 * @openapi
 * /api/public/comments/news/{newsId}/replies/{parentId}:
 *   get:
 *     tags: [Comments]
 *     summary: Lấy danh sách trả lời cho một bình luận
 *     description: Trả về danh sách reply theo parent comment, có phân trang.
 *     parameters:
 *       - in: path
 *         name: newsId
 *         required: true
 *         schema: { type: integer }
 *         description: Id bài tin
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema: { type: integer }
 *         description: id comment cha
 *       - in: query
 *         name: page
 *         required: false
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         required: false
 *         schema: { type: integer, default: 5 }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CommentListResponse'
 */
router.get('/news/:newsId/replies/:parentId', getCommentReplies);

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
 *     description: Yêu cầu đăng nhập. Chỉ tài khoản bạn đọc (reader) được comment trên App; news chỉ cho bài đã published.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentCreateRequest'
 *     responses:
 *       201:
 *         description: Tạo comment thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CommentCreateResponse'
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized - Token không hợp lệ hoặc đã hết hạn
 *       403:
 *         description: Forbidden - Không có quyền truy cập tài nguyên này
 */
router.post('/', requireReaderAuth, createComment);

/**
 * @openapi
 * /api/public/comments/{id}:
 *   put:
 *     tags: [Comments]
 *     summary: Cập nhật nội dung bình luận (chỉ chủ sở hữu)
 *     description: Chỉ chủ sở hữu mới được cập nhật comment. 
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: id bình luận
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentUpdateRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CommentUpdateResponse'
 *       401:
 *         description: Unauthorized - Token không hợp lệ hoặc đã hết hạn
 *       403:
 *         description: Forbidden - Không có quyền truy cập tài nguyên này
 */
router.put('/:id', updateComment);

/**
 * @openapi
 * /api/public/comments/{id}:
 *   delete:
 *     tags: [Comments]
 *     summary: Xóa bình luận (chỉ chủ sở hữu)
 *     description: Xóa mềm comment.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: id bình luận
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CommentDeleteResponse'
 *       401:
 *         description: Unauthorized - Token không hợp lệ hoặc đã hết hạn
 *       403:
 *         description: Forbidden - Không có quyền truy cập tài nguyên này
 */
router.delete('/:id', deleteComment);

/**
 * @openapi
 * /api/public/comments/react:
 *   post:
 *     tags: [Comments]
 *     summary: Phản ứng với bình luận
 *     description: Comment reaction theo loaiReact 0 unlike/remove, 1 like, 2 dislike.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentReactRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CommentReactResponse'
 *       401:
 *         description: Unauthorized - Token không hợp lệ hoặc đã hết hạn
 *       403:
 *         description: Forbidden - Không có quyền truy cập tài nguyên này
 */
router.post('/react', requireReaderAuth, reactComment);

/**
 * @openapi
 * /api/public/comments/{id}/report:
 *   post:
 *     tags: [Comments]
 *     summary: Báo cáo vi phạm bình luận
 *     description: Báo cáo comment không phù hợp.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentReportRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CommentReportResponse'
 *       401:
 *         description: Unauthorized - Token không hợp lệ hoặc đã hết hạn
 *       403:
 *         description: Forbidden - Không có quyền truy cập tài nguyên này
 */
router.post('/:id/report', requireReaderAuth, reportComment);

module.exports = router;
