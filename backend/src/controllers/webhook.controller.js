const { pool } = require('../config/database');
const { processMembershipUpgrade } = require('../services/membership_upgrade.service');
const { logActivity } = require('./member_actions.controller');
require('dotenv').config();

/**
 * SePay Webhook Controller
 * Handles automated payment notifications from bank via SePay
 */

exports.handleSePayWebhook = async (req, res, next) => {
  const client = await pool.connect();
  try {
    // 1. API Key Verification (Security)
    const authHeader = req.headers['authorization'];
    const expectedKey = process.env.SEPAY_WEBHOOK_KEY;
    
    // SePay sends "Apikey YOUR_KEY"
    if (!authHeader || !authHeader.includes(expectedKey)) {
      console.error('[SePay Webhook] Unauthorized request attempt');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const payload = req.body;
    const { id: sepayId, content, transfer_amount, gateway, transaction_date } = payload;
    
    console.log(`[SePay Webhook] Received transaction ${sepayId}: "${content}" - ${transfer_amount}đ`);

    // 2. Extract Request ID from Content (Regex)
    // Matches "TVDT 123", "TVDT123", "Thanh toan TVDT 123", etc.
    const idMatch = content.match(/TVDT\s?(\d+)/i);
    if (!idMatch) {
      console.log('[SePay Webhook] No valid Request ID found in content');
      return res.status(200).json({ success: true, message: 'Ignored: No ID' });
    }
    
    const requestId = parseInt(idMatch[1]);

    await client.query('BEGIN');

    // 3. Find Pending Membership Request
    const { rows: requests } = await client.query(
      `SELECT r.*, mp.price as plan_price, mp.name->>'vi' as plan_name
       FROM membership_requests r
       JOIN membership_plans mp ON r.plan_id = mp.id
       WHERE r.id = $1 AND r.status = 'pending'`,
      [requestId]
    );

    if (requests.length === 0) {
      console.log(`[SePay Webhook] Request ${requestId} not found or already processed`);
      await client.query('ROLLBACK');
      return res.status(200).json({ success: true, message: 'Request non-existent or processed' });
    }

    const request = requests[0];
    
    // 4. Strict Amount Verification
    // amount in DB was added in Step 1 migration (if not yet populated, use plan_price)
    const expectedAmount = parseFloat(request.amount || request.plan_price);
    const receivedAmount = parseFloat(transfer_amount);

    if (receivedAmount < expectedAmount) {
      console.warn(`[SePay Webhook] Amount mismatch for request ${requestId}. Expected ${expectedAmount}, received ${receivedAmount}`);
      
      // We don't activate if amount is insufficient
      await logActivity(
        request.member_id, 
        'payment_insufficient', 
        `Phát hiện thanh toán thiếu (Yêu cầu: ${expectedAmount}, Nhận: ${receivedAmount}). Giao dịch: ${sepayId}`, 
        req.ip, req.headers['user-agent'], client
      );
      
      await client.query('COMMIT'); 
      return res.status(200).json({ success: true, message: 'Insufficient amount logged' });
    }

    // 5. Upgrade Membership (Official logic with Banking Metadata)
    const upgradeResult = await processMembershipUpgrade({
      memberId: request.member_id,
      planId: request.plan_id,
      note: `Tự động kích hoạt qua SePay (GD: ${sepayId})`,
      paymentMethod: 'bank_transfer',
      paymentStatus: 'completed',
      external_txn_id: sepayId,
      gateway: gateway,
      reference_id: requestId.toString(),
      sync_status: 'automated',
      payment_content: content
    }, client);

    // 6. Update Request status to approved
    await client.query(
      `UPDATE membership_requests 
       SET status = 'approved', 
           admin_note = $1,
           external_txn_id = $2,
           gateway = $3,
           processed_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [
        `Kích hoạt tự động qua SePay ngân hàng ${gateway}. Số tiền: ${receivedAmount}đ.`,
        sepayId,
        gateway,
        requestId
      ]
    );

    // 7. Log final success
    await logActivity(
      request.member_id, 
      'membership_automated_success', 
      `Kích hoạt gói ${request.plan_name} thành công qua SePay (${upgradeResult.daysAdded} ngày).`, 
      req.ip, req.headers['user-agent'], client
    );

    await client.query('COMMIT');
    console.log(`[SePay Webhook] Successfully processed request ${requestId}`);

    return res.status(200).json({ success: true });

  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('[SePay Webhook Error]:', error);
    next(error);
  } finally {
    client.release();
  }
};
