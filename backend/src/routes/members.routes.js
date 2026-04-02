const express = require('express');
const {
  getAll,
  getById,
  create,
  update,
  remove,
  getStats,
  manualUpgrade,
} = require('../controllers/members.controller');
const requireAuth = require('../middlewares/auth.middleware');
const { restrictToCMS, checkPermission } = require('../middlewares/rbac.middleware');
const { auditLog } = require('../middlewares/audit.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/members/dashboard-stats:
 *   get:
 *     tags:
 *       - Admin Members
 *     summary: Lấy thống kê số lượng hội viên (Tổng số & VIP)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalMembers:
 *                       type: integer
 *                     vipMembers:
 *                       type: integer
 *                     totalUsers:
 *                       type: integer
 * */
router.get('/dashboard-stats', requireAuth, restrictToCMS, checkPermission('members.view'), getStats);

/**
 * @openapi
 * /api/admin/members/stats:
 *   get:
 *     tags:
 *       - Admin Members
 *     summary: Lấy thống kê số lượng hội viên (Alias cho /dashboard-stats)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê thành công
 */
router.get('/stats', requireAuth, restrictToCMS, checkPermission('members.view'), getStats);


/**
 * @openapi
 * /api/admin/members:
 *   get:
 *     tags:
 *       - Admin Members
 *     summary: Lấy danh sách bạn đọc (Phân trang & Tìm kiếm)
 *     description: Hỗ trợ tìm kiếm theo tên, email hoặc mã số thẻ.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên, email hoặc mã số thẻ
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, all]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Danh sách bạn đọc
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
 *                         $ref: '#/components/schemas/Member'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', requireAuth, restrictToCMS, checkPermission('members.view'), getAll);

/**
 * @openapi
 * /api/admin/members/{id}:
 *   get:
 *     tags:
 *       - Admin Members
 *     summary: Chi tiết bạn đọc
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thông tin chi tiết bạn đọc
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Member'
 */
router.get('/:id', requireAuth, restrictToCMS, checkPermission('members.view'), getById);

/**
 * @openapi
 * /api/admin/members:
 *   post:
 *     tags:
 *       - Admin Members
 *     summary: Tạo bạn đọc mới (Admin)
 *     description: Tự động tạo cả tài khoản đăng nhập (User) và thực thể Bạn đọc (Member).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - full_name
 *               - card_number
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 default: "123456"
 *               full_name:
 *                 type: string
 *               card_number:
 *                 type: string
 *               membership_plan_id:
 *                 type: integer
 *               balance:
 *                 type: number
 *                 description: Số dư nạp khởi tạo
 *               issued_date:
 *                 type: string
 *                 format: date
 *               membership_expires:
 *                 type: string
 *                 format: date
 *               identity_number:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Trùng email hoặc mã thẻ
 */
router.post('/', requireAuth, restrictToCMS, checkPermission('members.manage'), auditLog('members'), create);

/**
 * @openapi
 * /api/admin/members/{id}:
 *   put:
 *     tags:
 *       - Admin Members
 *     summary: Cập nhật thông tin bạn đọc
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Member'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', requireAuth, restrictToCMS, checkPermission('members.manage'), auditLog('members'), update);

/**
 * @openapi
 * /api/admin/members/{id}:
 *   delete:
 *     tags:
 *       - Admin Members
 *     summary: Xóa bạn đọc
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/:id', requireAuth, restrictToCMS, checkPermission('members.manage'), auditLog('members'), remove);

/**
 * @openapi
 * /api/admin/members/{id}/upgrade:
 *   post:
 *     tags:
 *       - Admin Members
 *     summary: Nâng cấp VIP/Gia hạn hội viên thủ công
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Nâng cấp thành công
 */
router.post('/:id/upgrade', requireAuth, restrictToCMS, checkPermission('members.manage'), auditLog('members'), manualUpgrade);

module.exports = router;
