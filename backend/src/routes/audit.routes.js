const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { checkPermission } = require('../middlewares/rbac.middleware');

/**
 * @openapi
 * /api/admin/audit-logs:
 *   get:
 *     tags: [Admin Audit Logs]
 *     summary: Danh sách logs hệ thống (System Audit Logs)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: 'integer', default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: 'integer', default: 20 }
 *       - in: query
 *         name: module
 *         schema: { type: 'string' }
 *       - in: query
 *         name: action
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Trả về danh sách nhật ký hệ thống
 */
router.get('/', checkPermission('settings.view'), auditController.getAuditLogs);

module.exports = router;
