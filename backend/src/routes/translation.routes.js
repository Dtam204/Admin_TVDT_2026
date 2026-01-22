const express = require('express');
const { translate, translateField } = require('../controllers/translation.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/translate:
 *   post:
 *     tags:
 *       - Translation
 *     summary: Dịch text hoặc object sang nhiều ngôn ngữ bằng AI
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string | object
 *                 description: Text hoặc object cần dịch
 *               sourceLang:
 *                 type: string
 *                 enum: [vi, en, ja]
 *                 default: vi
 *               targetLangs:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [vi, en, ja]
 *                 default: [en, ja]
 *     responses:
 *       200:
 *         description: Dịch thành công
 *       400:
 *         description: Lỗi validation
 *       401:
 *         description: Unauthorized
 */
router.post('/', requireAuth, translate);

/**
 * @openapi
 * /api/admin/translate/field:
 *   post:
 *     tags:
 *       - Translation
 *     summary: Dịch một field cụ thể
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - field
 *             properties:
 *               field:
 *                 type: string | object
 *               sourceLang:
 *                 type: string
 *                 enum: [vi, en, ja]
 *                 default: vi
 *               targetLangs:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [vi, en, ja]
 *                 default: [en, ja]
 *     responses:
 *       200:
 *         description: Dịch thành công
 */
router.post('/field', requireAuth, translateField);

module.exports = router;

