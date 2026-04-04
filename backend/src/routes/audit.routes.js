const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { checkPermission } = require('../middlewares/rbac.middleware');

/**
 * @openapi
 * /api/admin/audit-logs:
 *   get:
 *     tags: [Admin Audit]
 *     summary: Truy vấn nhật ký hoạt động của hệ thống
 *     description: Lấy danh sách lịch sử các thao tác của Admin trên hệ thống (Tạo, Sửa, Xóa, Phê duyệt...). Hỗ trợ phân trang và lọc theo module/hành động.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         description: Số trang hiện tại
 *         schema: { type: 'integer', default: 1 }
 *       - in: query
 *         name: limit
 *         description: Số bản ghi trên mỗi trang
 *         schema: { type: 'integer', default: 20 }
 *       - in: query
 *         name: module
 *         description: "Lọc theo module (ví dụ: COURSE, NEWS, PUBLISHER...)"
 *         schema: { type: 'string' }
 *       - in: query
 *         name: action
 *         description: "Lọc theo hành động (ví dụ: CREATE, UPDATE, DELETE...)"
 *         schema: { type: 'string' }
 *       - in: query
 *         name: search
 *         description: Tìm kiếm theo mô tả hoặc mã thực thể
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Danh sách nhật ký hoạt động
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
 *                         $ref: '#/components/schemas/AuditLog'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', checkPermission('settings.view'), auditController.getAuditLogs);

module.exports = router;
