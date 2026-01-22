const express = require('express');
const {
  getPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
} = require('../controllers/permissions.controller');

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Permission:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         code:
 *           type: string
 *           example: users.view
 *         name:
 *           type: string
 *           example: Xem danh sách người dùng
 *         module:
 *           type: string
 *           example: users
 *         description:
 *           type: string
 *           example: Cho phép xem danh sách tài khoản
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @openapi
 * /api/admin/permissions:
 *   get:
 *     tags:
 *       - Permissions
 *     summary: Danh sách quyền (permissions)
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *         description: Lọc theo module (users, roles, news, ...)
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái hoạt động
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo code hoặc name
 *     responses:
 *       200:
 *         description: Danh sách permissions
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
 *                     $ref: '#/components/schemas/Permission'
 */
router.get('/', getPermissions);

/**
 * @openapi
 * /api/admin/permissions/{id}:
 *   get:
 *     tags:
 *       - Permissions
 *     summary: Chi tiết quyền
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thông tin quyền
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Permission'
 *       404:
 *         description: Không tìm thấy quyền
 */
router.get('/:id', getPermissionById);

/**
 * @openapi
 * /api/admin/permissions:
 *   post:
 *     tags:
 *       - Permissions
 *     summary: Tạo quyền mới
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
 *                 example: users.view
 *               name:
 *                 type: string
 *                 example: Xem danh sách người dùng
 *               module:
 *                 type: string
 *                 example: users
 *               description:
 *                 type: string
 *                 example: Cho phép xem danh sách tài khoản
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Tạo quyền thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Permission'
 *       400:
 *         description: Thiếu dữ liệu bắt buộc
 *       409:
 *         description: Mã quyền đã tồn tại
 */
router.post('/', createPermission);

/**
 * @openapi
 * /api/admin/permissions/{id}:
 *   put:
 *     tags:
 *       - Permissions
 *     summary: Cập nhật quyền
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
 *               module:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật quyền thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Permission'
 *       400:
 *         description: Không có dữ liệu để cập nhật
 *       404:
 *         description: Không tìm thấy quyền
 *       409:
 *         description: Mã quyền đã tồn tại
 */
router.put('/:id', updatePermission);

/**
 * @openapi
 * /api/admin/permissions/{id}:
 *   delete:
 *     tags:
 *       - Permissions
 *     summary: Xoá quyền
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       404:
 *         description: Không tìm thấy quyền
 */
router.delete('/:id', deletePermission);

module.exports = router;


