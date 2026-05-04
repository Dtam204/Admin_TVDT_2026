const express = require('express');
const {
  getCategories,
  getCategoryByCode,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/newsCategories.controller');
const { checkPermission } = require('../middlewares/rbac.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/news-categories:
 *   get:
 *     tags:
 *       - Admin News Categories
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
router.get('/', checkPermission('news_categories.view'), getCategories);

/**
 * @openapi
 * /api/admin/news-categories/{code}:
 *   get:
 *     tags:
 *       - Admin News Categories
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
router.get('/:code', checkPermission('news_categories.view'), getCategoryByCode);

/**
 * @openapi
 * /api/admin/news-categories:
 *   post:
 *     tags:
 *       - Admin News Categories
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
router.post('/', checkPermission('news_categories.manage'), createCategory);

/**
 * @openapi
 * /api/admin/news-categories/{code}:
 *   put:
 *     tags:
 *       - Admin News Categories
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
router.put('/:code', checkPermission('news_categories.manage'), updateCategory);

/**
 * @openapi
 * /api/admin/news-categories/{code}:
 *   delete:
 *     tags:
 *       - Admin News Categories
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
router.delete('/:code', checkPermission('news_categories.manage'), deleteCategory);

module.exports = router;

