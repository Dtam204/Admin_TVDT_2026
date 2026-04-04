const express = require('express');
const { getSummary } = require('../controllers/dashboard.controller');

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
router.get('/summary', getSummary);

module.exports = router;
