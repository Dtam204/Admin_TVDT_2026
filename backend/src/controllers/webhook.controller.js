const crypto = require('crypto');
const { pool } = require('../config/database');
const { processMembershipUpgrade } = require('../services/membership_upgrade.service');
const { processPenaltyPayment } = require('../services/penalty_payment.service');
const { generateTransactionId } = require('../utils/id_helper');
const NotificationService = require('../services/admin/notification.service');
require('dotenv').config();

function normalizeReference(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toUpperCase();
}

function parseDepositReference(content) {
  const normalized = normalizeReference(content);
  if (!normalized) return '';

  const strict = normalized.match(/NAP-R\d+-\d+/i);
  if (strict) return strict[0].toUpperCase();

  return '';
}

function verifyLegacyApiKey(req) {
  const expectedKey = String(process.env.SEPAY_WEBHOOK_KEY || '').trim();
  if (!expectedKey) return false;

  const authHeader = String(req.headers.authorization || '').trim();
  if (!authHeader) return false;
  if (authHeader === expectedKey) return true;
  return authHeader === `Bearer ${expectedKey}`;
}

function verifySignature(req) {
  const secret = String(process.env.SEPAY_WEBHOOK_SECRET || '').trim();
  if (!secret) {
    return { ok: verifyLegacyApiKey(req), mode: 'legacy_key' };
  }

  const signature = String(req.headers['x-sepay-signature'] || '').trim();
  if (!signature || !req.rawBody) {
    return { ok: false, mode: 'hmac' };
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(req.rawBody)
    .digest('hex');

  try {
    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length) return { ok: false, mode: 'hmac' };
    return { ok: crypto.timingSafeEqual(sigBuf, expBuf), mode: 'hmac' };
  } catch (_error) {
    return { ok: false, mode: 'hmac' };
  }
}

function parseMoney(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function moneyToCents(value) {
  return Math.round(parseMoney(value) * 100);
}

async function markWebhookEvent(client, eventId, status, errorMessage = null) {
  if (!eventId) return;
  await client.query(
    `UPDATE webhook_events
     SET processing_status = $2,
         error_message = $3,
         processed_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [eventId, status, errorMessage]
  );
}

async function processDepositOrder({
  client,
  referenceCode,
  externalTxnId,
  paidAmount,
  gateway,
  content,
  payload
}) {
  const { rows: orders } = await client.query(
    `SELECT *
     FROM wallet_deposit_orders
     WHERE status = 'pending'
       AND (transfer_code = $1 OR client_reference = $1)
     ORDER BY created_at DESC
     LIMIT 1
     FOR UPDATE`,
    [referenceCode]
  );

  if (orders.length === 0) {
    return { handled: false };
  }

  const order = orders[0];
  const orderAmountCents = moneyToCents(order.amount);
  const paidAmountCents = moneyToCents(paidAmount);
  const nowTs = Date.now();
  const expiresTs = new Date(order.expires_at).getTime();

  if (expiresTs < nowTs) {
    await client.query(
      `UPDATE wallet_deposit_orders
       SET status = 'expired',
           failure_reason = 'Webhook arrived after expiration',
           webhook_payload = $2::jsonb,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [order.id, JSON.stringify(payload)]
    );

    await client.query(
      `INSERT INTO payments (
         transaction_id, member_id, amount, type, status, notes, payment_method,
         external_txn_id, gateway, sync_status, payment_content, reference_id, paid_at
       )
       VALUES ($1, $2, $3, 'wallet_deposit', 'failed', $4, 'bank_transfer', $5, $6, 'automated', $7, $8, CURRENT_TIMESTAMP)`,
      [
        generateTransactionId('DEPX'),
        order.member_id,
        paidAmount,
        'Lệnh nạp đã hết hạn trước khi nhận webhook',
        externalTxnId,
        gateway,
        content,
        referenceCode
      ]
    );

    return { handled: true, status: 'expired_order', message: 'Order expired before webhook' };
  }

  if (orderAmountCents !== paidAmountCents) {
    await client.query(
      `UPDATE wallet_deposit_orders
       SET status = 'failed',
           failure_reason = 'Amount mismatch',
           webhook_payload = $2::jsonb,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [order.id, JSON.stringify(payload)]
    );

    await client.query(
      `INSERT INTO payments (
         transaction_id, member_id, amount, type, status, notes, payment_method,
         external_txn_id, gateway, sync_status, payment_content, reference_id, paid_at
       )
       VALUES ($1, $2, $3, 'wallet_deposit', 'failed', $4, 'bank_transfer', $5, $6, 'automated', $7, $8, CURRENT_TIMESTAMP)`,
      [
        generateTransactionId('DEPX'),
        order.member_id,
        paidAmount,
        'Số tiền chuyển khoản không khớp lệnh nạp',
        externalTxnId,
        gateway,
        content,
        referenceCode
      ]
    );

    return { handled: true, status: 'amount_mismatch', message: 'Amount mismatch with order' };
  }

  const { rows: memberRows } = await client.query(
    `UPDATE members
     SET balance = COALESCE(balance, 0) + $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING id, full_name, balance`,
    [order.member_id, paidAmount]
  );

  if (memberRows.length === 0) {
    throw new Error('Member not found while processing deposit order');
  }

  const paymentTxnId = generateTransactionId('DEP');
  await client.query(
    `INSERT INTO payments (
       transaction_id, member_id, amount, type, status, notes, payment_method,
       external_txn_id, gateway, sync_status, payment_content, reference_id, paid_at
     )
     VALUES ($1, $2, $3, 'wallet_deposit', 'completed', $4, 'bank_transfer', $5, $6, 'automated', $7, $8, CURRENT_TIMESTAMP)`,
    [
      paymentTxnId,
      order.member_id,
      paidAmount,
      'Nạp tiền tự động qua SePay theo lệnh nạp',
      externalTxnId,
      gateway,
      content,
      referenceCode
    ]
  );

  await client.query(
    `UPDATE wallet_deposit_orders
     SET status = 'credited',
         matched_external_txn_id = $2,
         credited_at = CURRENT_TIMESTAMP,
         webhook_payload = $3::jsonb,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [order.id, externalTxnId, JSON.stringify(payload)]
  );

  return {
    handled: true,
    status: 'processed',
    message: 'Deposit order processed',
    syncData: {
      memberId: memberRows[0].id,
      memberName: memberRows[0].full_name,
      type: 'DEPOSIT',
      amount: paidAmount,
      message: `Nạp thành công ${paidAmount.toLocaleString()}đ vào ví.`,
      internalId: paymentTxnId,
      newBalance: parseFloat(memberRows[0].balance || 0)
    }
  };
}

async function processLegacySyntax({
  client,
  normalizedContent,
  externalTxnId,
  amount,
  gateway,
  content
}) {
  const depositMatch = normalizedContent.match(/\bNAP\s+(\d+)\b/i);
  const upgradeMatch = normalizedContent.match(/\bGH\s?(\d+)(\s+\d+)?\b/i);
  const penaltyMatch = normalizedContent.match(/\bPHAT\s?(\d+)\s?(\d+)\b/i);

  if (depositMatch) {
    const memberId = parseInt(depositMatch[1], 10);
    const { rows: members } = await client.query(
      `UPDATE members
       SET balance = COALESCE(balance, 0) + $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, full_name, balance`,
      [memberId, amount]
    );

    if (members.length === 0) {
      return { handled: false };
    }

    const internalId = generateTransactionId('DEP');
    await client.query(
      `INSERT INTO payments (
         transaction_id, member_id, amount, type, status, notes, payment_method,
         external_txn_id, gateway, sync_status, payment_content, paid_at
       )
       VALUES ($1, $2, $3, 'wallet_deposit', 'completed', $4, 'bank_transfer', $5, $6, 'automated', $7, CURRENT_TIMESTAMP)`,
      [internalId, memberId, amount, `Nạp tiền tự động qua SePay (${gateway}) - ND: ${content}`, externalTxnId, gateway, content]
    );

    return {
      handled: true,
      message: `Legacy deposit processed for ${memberId}`,
      syncData: {
        memberId,
        memberName: members[0].full_name,
        type: 'DEPOSIT',
        amount,
        message: `Nạp thành công ${amount.toLocaleString()}đ vào ví.`,
        internalId,
        newBalance: parseFloat(members[0].balance || 0)
      }
    };
  }

  if (upgradeMatch) {
    const memberId = parseInt(upgradeMatch[1], 10);
    let planId = upgradeMatch[2] ? parseInt(upgradeMatch[2].trim(), 10) : null;

    const { rows: members } = await client.query(
      'SELECT full_name, membership_plan_id FROM members WHERE id = $1',
      [memberId]
    );

    if (members.length === 0) {
      return { handled: false };
    }

    if (!planId) {
      planId = members[0].membership_plan_id;
    }

    if (!planId) {
      return { handled: false };
    }

    const upgradeRes = await processMembershipUpgrade({
      memberId,
      planId,
      amount,
      note: `Gia hạn tự động qua SePay (Webhook) - GD: ${externalTxnId}`,
      external_txn_id: externalTxnId,
      gateway,
      sync_status: 'automated',
      payment_content: content
    }, client);

    return {
      handled: true,
      message: `Membership upgraded for ${memberId}`,
      syncData: {
        memberId,
        memberName: members[0].full_name,
        type: 'MEMBERSHIP',
        amount,
        message: `Gia hạn thành công gói hội viên mới đến ${upgradeRes.newExpires}.`,
        internalId: upgradeRes.payment.transaction_id
      }
    };
  }

  if (penaltyMatch) {
    const memberId = parseInt(penaltyMatch[1], 10);
    const borrowId = parseInt(penaltyMatch[2], 10);

    const { rows: members } = await client.query('SELECT full_name FROM members WHERE id = $1', [memberId]);
    if (members.length === 0) {
      return { handled: false };
    }

    const penaltyRes = await processPenaltyPayment({
      memberId,
      borrowId,
      amount,
      external_txn_id: externalTxnId,
      gateway,
      payment_content: content
    }, client);

    return {
      handled: true,
      message: `Penalty paid for ${memberId} - Loan #${borrowId}`,
      syncData: {
        memberId,
        memberName: members[0].full_name,
        type: 'PENALTY',
        amount,
        message: `Đã thanh toán nộp phạt thành công cho phiếu mượn #${borrowId}.`,
        internalId: penaltyRes.payment.transaction_id
      }
    };
  }

  return { handled: false };
}

exports.handleSePayWebhook = async (req, res, next) => {
  const authResult = verifySignature(req);
  if (!authResult.ok) {
    console.error('[SePay Webhook] Unauthorized request attempt');
    return res.status(401).json({ success: false, message: 'Unauthorized webhook request' });
  }

  const payload = req.body || {};
  const externalTxnId = String(
    payload.id || payload.transactionId || payload.transaction_id || payload.transId || ''
  ).trim();
  const content = String(payload.content || payload.transferContent || payload.description || '').trim();
  const gateway = String(payload.gateway || payload.bank || 'UNKNOWN').trim();
  const transferType = String(payload.transfer_type || payload.transferType || 'in').toLowerCase();
  const amount = parseMoney(payload.transfer_amount || payload.amount || payload.totalAmount);

  if (transferType && transferType !== 'in') {
    return res.status(200).json({ success: true, message: 'Ignored: Outbound transaction' });
  }

  if (!externalTxnId) {
    return res.status(400).json({ success: false, message: 'Missing external transaction id' });
  }

  if (amount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid transfer amount' });
  }

  const client = await pool.connect();
  let eventId = null;
  let syncData = null;

  try {
    await client.query('BEGIN');

    const eventInsert = await client.query(
      `INSERT INTO webhook_events (provider, external_txn_id, event_type, signature_valid, received_payload, processing_status)
       VALUES ('SEPAY', $1, 'BANK_INBOUND', $2, $3::jsonb, 'received')
       ON CONFLICT (provider, external_txn_id)
       DO NOTHING
       RETURNING id`,
      [externalTxnId, authResult.mode === 'hmac', JSON.stringify(payload)]
    );

    if (eventInsert.rowCount === 0) {
      await client.query('COMMIT');
      return res.status(200).json({ success: true, message: 'duplicated' });
    }

    eventId = eventInsert.rows[0].id;

    const existingPayment = await client.query(
      'SELECT id FROM payments WHERE external_txn_id = $1 LIMIT 1',
      [externalTxnId]
    );

    if (existingPayment.rowCount > 0) {
      await markWebhookEvent(client, eventId, 'duplicated', null);
      await client.query('COMMIT');
      return res.status(200).json({ success: true, message: 'duplicated' });
    }

    const depositReference = parseDepositReference(content);
    if (depositReference) {
      const depositResult = await processDepositOrder({
        client,
        referenceCode: depositReference,
        externalTxnId,
        paidAmount: amount,
        gateway,
        content,
        payload
      });

      if (depositResult.handled) {
        syncData = depositResult.syncData || null;
        await markWebhookEvent(client, eventId, 'processed', null);
        await client.query('COMMIT');

        if (syncData) {
          await triggerSync(
            syncData.memberId,
            syncData.memberName,
            syncData.type,
            syncData.amount,
            syncData.message,
            syncData.internalId,
            syncData.newBalance
          );
        }

        return res.status(200).json({ success: true, message: depositResult.status || 'processed' });
      }
    }

    const normalizedContent = normalizeReference(content);
    const legacyResult = await processLegacySyntax({
      client,
      normalizedContent,
      externalTxnId,
      amount,
      gateway,
      content
    });

    if (!legacyResult.handled) {
      await markWebhookEvent(client, eventId, 'ignored', 'No matching syntax/order');
      await client.query('COMMIT');
      return res.status(200).json({ success: true, message: 'Format unrecognized or member not found' });
    }

    syncData = legacyResult.syncData || null;
    await markWebhookEvent(client, eventId, 'processed', null);
    await client.query('COMMIT');

    if (syncData) {
      await triggerSync(
        syncData.memberId,
        syncData.memberName,
        syncData.type,
        syncData.amount,
        syncData.message,
        syncData.internalId,
        syncData.newBalance
      );
    }

    return res.status(200).json({ success: true, message: legacyResult.message || 'processed' });
  } catch (error) {
    await client.query('ROLLBACK');

    if (eventId) {
      try {
        await pool.query(
          `UPDATE webhook_events
           SET processing_status = 'failed',
               error_message = $2,
               processed_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [eventId, error.message]
        );
      } catch (_innerError) {
        // Ignore event-log update errors to preserve original exception.
      }
    }

    console.error('[SePay Webhook Fatal Error]:', error);
    return next(error);
  } finally {
    client.release();
  }
};

/**
 * Helper để đồng bộ thông báo và Socket.io cho cả Admin và User
 */
async function triggerSync(memberId, memberName, type, amount, message, internalId, newBalance = null) {
  try {
    const { getIO } = require('../socket');
    const io = getIO();
    if (!io) return;

    await NotificationService.sendNotification({
      member_id: memberId,
      title: 'Thông báo thanh toán',
      message,
      type: 'payment',
      related_id: internalId,
      related_type: 'payment'
    });

    io.to(`member_${memberId}`).emit('payment_success', {
      type,
      amount,
      message,
      transaction_id: internalId,
      new_balance: newBalance
    });

    io.to(`member_${memberId}`).emit('wallet_balance_updated', {
      amount,
      new_balance: newBalance,
      message
    });

    io.to('admins').emit('new_transaction', {
      type: 'BANK_AUTOMATION',
      member_name: memberName,
      amount,
      message: `[SePay] ${memberName} - ${message}`
    });
  } catch (err) {
    console.error('[Webhook Sync Error]', err.message);
  }
}
