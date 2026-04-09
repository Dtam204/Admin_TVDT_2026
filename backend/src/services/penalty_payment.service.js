const { pool } = require('../config/database');
const { generateTransactionId } = require('../utils/id_helper');

/**
 * Penalty Payment Service
 * Handles marking fines/penalties as paid via bank transfer (SePay) or Wallet
 */

/**
 * Process a penalty payment
 * @param {Object} params - { memberId, paymentId/borrowId, amount, paymentMethod, external_txn_id, gateway, payment_content }
 * @param {Object} client - DB Client (optional for transactions)
 */
async function processPenaltyPayment({
  memberId,
  paymentId = null, // ID in 'payments' table (type='fee_penalty')
  borrowId = null,  // ID in 'book_loans' table (if paymentId is missing)
  amount = 0,
  paymentMethod = 'bank_transfer',
  paymentStatus = 'completed',
  external_txn_id = null,
  gateway = null,
  payment_content = null
}, client = null) {
  const db = client || pool;
  
  try {
    let targetPaymentId = paymentId;

    // 1. If only borrowId is provided, find the pending 'fee_penalty' payment
    if (!targetPaymentId && borrowId) {
      const { rows: payments } = await db.query(
        "SELECT id FROM payments WHERE member_id = $1 AND type = 'fee_penalty' AND status = 'pending' AND (notes ILIKE $2 OR notes ILIKE $3) LIMIT 1",
        [memberId, `%#${borrowId}%`, `%Phiếu #${borrowId}%`]
      );
      if (payments.length > 0) {
        targetPaymentId = payments[0].id;
      }
    }

    // 2. If we found/have a payment record, update it
    if (targetPaymentId) {
      const { rows: payRows } = await db.query(
        `UPDATE payments 
         SET status = $1, 
             paid_at = CURRENT_TIMESTAMP, 
             external_txn_id = $2, 
             gateway = $3, 
             sync_status = 'automated',
             payment_content = $4,
             amount = $5
         WHERE id = $6 AND member_id = $7
         RETURNING *`,
        [paymentStatus, external_txn_id, gateway, payment_content, amount, targetPaymentId, memberId]
      );

      if (payRows.length === 0) throw new Error('Không tìm thấy bản ghi nộp phạt hợp lệ');
      
      return {
        success: true,
        type: 'existing_fine',
        payment: payRows[0]
      };
    } else {
      // 3. If no pending payment record exists, create a new completed one (e.g., immediate fine payment)
      const internalTxnId = generateTransactionId('PEN');
      const { rows: payRows } = await db.query(
        `INSERT INTO payments (
          transaction_id, member_id, type, amount, status, notes, payment_method, 
          paid_at, external_txn_id, gateway, sync_status, payment_content
        ) VALUES ($1, $2, 'fee_penalty', $3, $4, $5, $6, CURRENT_TIMESTAMP, $7, $8, 'automated', $9)
        RETURNING *`,
        [
          internalTxnId,
          memberId,
          amount,
          paymentStatus,
          `Nộp phạt tự động qua SePay ${borrowId ? `(Phiếu #${borrowId})` : ''}`,
          paymentMethod,
          external_txn_id,
          gateway,
          payment_content
        ]
      );

      return {
        success: true,
        type: 'new_fine_payment',
        payment: payRows[0]
      };
    }
  } catch (error) {
    console.error('Error in processPenaltyPayment service:', error.message);
    throw error;
  }
}

module.exports = {
  processPenaltyPayment
};
