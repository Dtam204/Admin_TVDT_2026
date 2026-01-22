const express = require('express');
const { getSummary } = require('../controllers/dashboard.controller');

const router = express.Router();

/**
 * @openapi
 * /api/dashboard/summary:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Lấy số liệu tổng quan cho dashboard CMS
 *     responses:
 *       200:
 *         description: Số liệu tổng quan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                   example: 1280
 *                 activeUsers:
 *                   type: integer
 *                   example: 934
 *                 newOrdersToday:
 *                   type: integer
 *                   example: 37
 *                 revenueToday:
 *                   type: number
 *                   example: 12500000
 */
router.get('/summary', getSummary);

module.exports = router;




