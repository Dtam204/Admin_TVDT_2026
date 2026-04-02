const express = require('express');
const router = express.Router();
const controller = require('../../controllers/reader/transaction.controller');
const requireReaderAuth = require('../../middlewares/readerAuth.middleware');

/**
 * Reader Transaction Routes
 * Path prefix: /api/reader/transactions
 */

// Get current balance
router.get('/balance', requireReaderAuth, controller.getBalance);

// Get my transaction history
router.get('/me', requireReaderAuth, controller.getMyTransactions);

// Pay a pending fine
router.post('/pay-fine/:transactionId', requireReaderAuth, controller.payFine);

module.exports = router;
