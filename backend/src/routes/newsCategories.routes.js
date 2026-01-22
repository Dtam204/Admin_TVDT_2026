const express = require('express');
const {
  getCategories,
  getCategoryByCode,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/newsCategories.controller');

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     NewsCategory:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           example: tech
 *         name:
 *           type: string
 *           example: Tin công nghệ
 *         description:
 *           type: string
 *           example: Tin tức về công nghệ, xu hướng
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
 * /api/admin/categories:
 *   get:
 *     tags:
 *       - News Categories
 *     summary: Danh sách danh mục tin tức
 *     responses:
 *       200:
 *         description: OK
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
 *                     $ref: '#/components/schemas/NewsCategory'
 */
router.get('/', getCategories);

/**
 * @openapi
 * /api/admin/categories/{code}:
 *   get:
 *     tags:
 *       - News Categories
 *     summary: Chi tiết danh mục
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Không tìm thấy danh mục
 */
router.get('/:code', getCategoryByCode);

/**
 * @openapi
 * /api/admin/categories:
 *   post:
 *     tags:
 *       - News Categories
 *     summary: Tạo danh mục tin tức
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewsCategory'
 *     responses:
 *       201:
 *         description: Đã tạo
 *       409:
 *         description: Trùng mã code
 */
router.post('/', createCategory);

/**
 * @openapi
 * /api/admin/categories/{code}:
 *   put:
 *     tags:
 *       - News Categories
 *     summary: Cập nhật danh mục tin tức
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewsCategory'
 *     responses:
 *       200:
 *         description: Đã cập nhật
 *       404:
 *         description: Không tìm thấy danh mục
 */
router.put('/:code', updateCategory);

/**
 * @openapi
 * /api/admin/categories/{code}:
 *   delete:
 *     tags:
 *       - News Categories
 *     summary: Xóa danh mục tin tức
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã xóa
 *       404:
 *         description: Không tìm thấy danh mục
 */
router.delete('/:code', deleteCategory);

module.exports = router;

