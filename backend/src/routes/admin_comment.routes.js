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
 *     description: Dùng cho màn quản lý bình luận, hỗ trợ lọc theo status/objectType/objectId.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected, hidden, deleted] }
 *         description: Lọc theo trạng thái bình luận
 *       - in: query
 *         name: objectType
 *         schema: { type: string, enum: [news, book, course] }
 *         description: Lọc theo loại đối tượng
 *       - in: query
 *         name: objectId
 *         schema: { type: integer }
 *         description: Lọc theo ID đối tượng
 *     responses:
 *       200:
 *         description: Danh sách bình luận CMS thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', checkPermission('books.view'), adminGetComments);

/**
 * @openapi
 * /api/admin/comments/{id}/status:
 *   put:
 *     tags: [Admin Comments]
 *     summary: Duyệt/Ẩn bình luận
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentModerateRequest'
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
 *                       $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put('/:id/status', checkPermission('books.manage'), adminModerateComment);

/**
 * @openapi
 * /api/admin/comments/{id}:
 *   delete:
 *     tags: [Admin Comments]
 *     summary: Xóa mềm bình luận
 *     security:
 *       - bearerAuth: []
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
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', checkPermission('books.manage'), adminDeleteComment);

/**
 * @openapi
 * /api/admin/comments/{id}/reply:
 *   post:
 *     tags: [Admin Comments]
 *     summary: Phản hồi bình luận từ CMS
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, example: 'Cảm ơn bạn đã góp ý.' }
 *     responses:
 *       201:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/:id/reply', checkPermission('books.manage'), adminReplyComment);

/**
 * @openapi
 * /api/admin/comments/reports:
 *   get:
 *     tags: [Admin Comments]
 *     summary: Danh sách báo cáo vi phạm
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách báo cáo vi phạm thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AdminCommentReport'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/reports', checkPermission('books.view'), adminGetReports);

module.exports = router;
