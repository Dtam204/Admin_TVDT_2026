const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

/**
 * Webhook Routes
 * Processes automated bank notifications from SePay
 * Endpoint: /api/webhooks
 */

// POST /api/webhooks/sepay
router.post('/sepay', webhookController.handleSePayWebhook);

module.exports = router;
