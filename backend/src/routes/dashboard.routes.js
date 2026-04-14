const express = require('express');
const { getSummary, getAlerts, getAIInsights } = require('../controllers/dashboard.controller');
const { checkPermission } = require('../middlewares/rbac.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/dashboard/summary:
 *   get:
 *     tags: [Admin Dashboard]
 *     summary: Tổng quan số liệu hệ thống
 *     description: Cung cấp các chỉ số quan trọng (phát triển bởi CMS) như tổng số người dùng, doanh thu, lượt mượn sách.
 *     security:
 *       - bearerAuth: []
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
 *                       type: object
 *                       properties:
 *                         totalUsers: { type: 'integer' }
 *                         activeUsers: { type: 'integer' }
 *                         newOrdersToday: { type: 'integer' }
 *                         revenueToday: { type: 'number' }
 */
router.get('/summary', checkPermission('dashboard.view'), getSummary);
router.get('/alerts', checkPermission('dashboard.view'), getAlerts);
router.get('/ai-insights', checkPermission('dashboard.view'), getAIInsights);

module.exports = router;
