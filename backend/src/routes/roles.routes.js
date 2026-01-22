const express = require('express');
const {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  updateRolePermissions,
} = require('../controllers/roles.controller');

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         code:
 *           type: string
 *           example: admin
 *         name:
 *           type: string
 *           example: Quản trị viên
 *         description:
 *           type: string
 *           example: Toàn quyền hệ thống
 *         isActive:
 *           type: boolean
 *           example: true
 *         isDefault:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @openapi
 * /api/admin/roles:
 *   get:
 *     tags:
 *       - Roles
 *     summary: Danh sách roles
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái hoạt động
 *     responses:
 *       200:
 *         description: Danh sách roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
 */
router.get('/', getRoles);

/**
 * @openapi
 * /api/admin/roles/{id}:
 *   get:
 *     tags:
 *       - Roles
 *     summary: Chi tiết role
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thông tin role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       404:
 *         description: Không tìm thấy role
 */
router.get('/:id', getRoleById);

/**
 * @openapi
 * /api/admin/roles:
 *   post:
 *     tags:
 *       - Roles
 *     summary: Tạo role mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *                 example: editor
 *               name:
 *                 type: string
 *                 example: Biên tập viên
 *               description:
 *                 type: string
 *                 example: Quản lý nội dung
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               isDefault:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Tạo role thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Thiếu dữ liệu bắt buộc
 *       409:
 *         description: Mã role đã tồn tại
 */
router.post('/', createRole);

/**
 * @openapi
 * /api/admin/roles/{id}:
 *   put:
 *     tags:
 *       - Roles
 *     summary: Cập nhật role
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật role thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Không có dữ liệu để cập nhật
 *       404:
 *         description: Không tìm thấy role
 *       409:
 *         description: Mã role đã tồn tại
 */
router.put('/:id', updateRole);

/**
 * @openapi
 * /api/admin/roles/{id}:
 *   delete:
 *     tags:
 *       - Roles
 *     summary: Xoá role
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       400:
 *         description: Không thể xoá vì role đang được dùng
 *       404:
 *         description: Không tìm thấy role
 */
router.delete('/:id', deleteRole);

/**
 * @openapi
 * /api/admin/roles/{id}/permissions:
 *   get:
 *     tags:
 *       - Roles
 *     summary: Lấy danh sách quyền được gán cho role
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thông tin role và danh sách quyền
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
 *                     role:
 *                       $ref: '#/components/schemas/Role'
 *                     permissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Permission'
 *       404:
 *         description: Không tìm thấy role
 */
router.get('/:id/permissions', getRolePermissions);

/**
 * @openapi
 * /api/admin/roles/{id}/permissions:
 *   put:
 *     tags:
 *       - Roles
 *     summary: Cập nhật danh sách quyền cho role
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 description: Danh sách ID quyền sẽ được gán cho role (toàn bộ danh sách mới)
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Cập nhật quyền cho role thành công
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
 *                     role:
 *                       $ref: '#/components/schemas/Role'
 *                     permissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Permission'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy role
 */
router.put('/:id/permissions', updateRolePermissions);

module.exports = router;


