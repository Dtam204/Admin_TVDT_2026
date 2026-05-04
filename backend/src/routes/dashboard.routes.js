const express = require('express');
const { getSummary, getAlerts, getAIInsights } = require('../controllers/dashboard.controller');
const { checkPermission } = require('../middlewares/rbac.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/admin/dashboard/summary:
 *   get:
 *     tags: [Admin Dashboard]
 *     summary: Tổng quan số liệu hệ thống
 *     description: Cung cấp các chỉ số quan trọng của thư viện, bao gồm thống kê sách, tác giả, hội viên, lượt xem, doanh thu, mượn trả, yêu thích và đánh giá.
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
 *                       $ref: '#/components/schemas/DashboardSummaryResponse'
 */
/**
 * @openapi
 * /api/admin/dashboard/alerts:
 *   get:
 *     tags: [Admin Dashboard]
 *     summary: Danh sách cảnh báo hệ thống
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
 *                       $ref: '#/components/schemas/DashboardAlertsResponse'
 *
 * /api/admin/dashboard/ai-insights:
 *   get:
 *     tags: [Admin Dashboard]
 *     summary: Phân tích AI cho dashboard
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
 *                       $ref: '#/components/schemas/DashboardAIInsightsResponse'
 */
router.get('/summary', checkPermission('dashboard.view'), getSummary);
router.get('/alerts', checkPermission('dashboard.view'), getAlerts);
router.get('/ai-insights', checkPermission('dashboard.view'), getAIInsights);

module.exports = router;
