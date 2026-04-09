const express = require('express');
const router = express.Router();
const controller = require('../controllers/membership_requests.controller');
const requireAuth = require('../middlewares/auth.middleware');

const { restrictToCMS, checkPermission } = require('../middlewares/rbac.middleware');

/**
 * @swagger
 * /api/admin/membership-requests:
 *   get:
 *     tags: [Admin Membership]
 *     summary: Danh sách yêu cầu gia hạn hội viên
 *     description: Lấy danh sách các yêu cầu nâng cấp hoặc gia hạn gói hội viên. Hỗ trợ lọc theo trạng thái và phân trang.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         description: Trạng thái yêu cầu (pending, approved, rejected)
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - in: query
 *         name: page
 *         schema: { type: 'integer', default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: 'integer', default: 10 }
 *     responses:
 *       200:
 *         description: Thành công
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
 *                         $ref: '#/components/schemas/MembershipRequest'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', requireAuth, restrictToCMS, checkPermission('membership_requests.manage'), controller.getAll);

/**
 * @swagger
 * /api/admin/membership-requests/{id}/approve:
 *   patch:
 *     tags: [Admin Membership]
 *     summary: Phê duyệt yêu cầu gia hạn
 *     description: Chấp nhận yêu cầu gia hạn và tự động cộng thêm ngày sử dụng cho hội viên.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               admin_note:
 *                 type: string
 *                 description: Ghi chú của Admin khi duyệt
 *               manual_days:
 *                 type: integer
 *                 description: Số ngày cộng thêm thủ công (nếu muốn ghi đè gói)
 *     responses:
 *       200:
 *         description: Phê duyệt thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MembershipRequest'
 */
router.patch('/:id/approve', requireAuth, restrictToCMS, checkPermission('membership_requests.manage'), controller.approve);

/**
 * @swagger
 * /api/admin/membership-requests/{id}/reject:
 *   patch:
 *     tags: [Admin Membership]
 *     summary: Từ chối yêu cầu gia hạn
 *     description: Không chấp nhận yêu cầu gia hạn và ghi lại lý do từ chối.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               admin_note:
 *                 type: string
 *                 description: Lý do từ chối
 *     responses:
 *       200:
 *         description: Từ chối thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MembershipRequest'
 */
router.patch('/:id/reject', requireAuth, restrictToCMS, checkPermission('membership_requests.manage'), controller.reject);

/**
 * @swagger
 * /api/admin/membership-requests/{id}/manual-activate:
 *   post:
 *     tags: [Admin Membership]
 *     summary: Kích hoạt thủ công (Giao dịch ngoài)
 *     description: "Cưỡng bức kích hoạt gói hội viên cho các trường hợp Admin đã nhận tiền mặt hoặc chuyển khoản trực tiếp (Manual Gate)."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200:
 *         description: Kích hoạt thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 */
router.post('/:id/manual-activate', requireAuth, restrictToCMS, checkPermission('membership_requests.manage'), controller.handleManualActivation);

module.exports = router;
