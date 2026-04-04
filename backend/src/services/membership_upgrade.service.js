const { pool } = require('../config/database');
const { generateTransactionId } = require('../utils/id_helper');

/**
 * Membership Upgrade Service
 * Centralizes the logic for renewing/upgrading members
 */

/**
 * Process a membership upgrade/renewal
 * @param {Object} params - { memberId, planId, manualDays, amount, note, type, paymentMethod, status, external_txn_id, gateway, reference_id, sync_status, payment_content }
 * @param {Object} client - DB Client (optional, for transactions)
 */
async function processMembershipUpgrade({
  memberId,
  planId,
  manualDays = 0,
  amount = 0,
  note = '',
  type = 'membership',
  paymentMethod = 'bank_transfer',
  paymentStatus = 'completed',
  external_txn_id = null,
  gateway = null,
  reference_id = null,
  sync_status = 'manual',
  payment_content = null
}, client = null) {
  const db = client || pool;
  
  try {
    // 1. Get plan details
    const { rows: plans } = await db.query(
      'SELECT id, duration_days, price, name as plan_name FROM membership_plans WHERE id = $1',
      [planId]
    );
    
    if (plans.length === 0) throw new Error('Không tìm thấy gói hội viên');
    const plan = plans[0];

    // 2. Calculate new expiration date
    const daysToAdd = (plan.duration_days || 30) + (manualDays || 0);

    const { rows: members } = await db.query(
      'SELECT membership_expires FROM members WHERE id = $1',
      [memberId]
    );
    if (members.length === 0) throw new Error('Không tìm thấy hội viên');
    const member = members[0];

    let baseDate = new Date();
    if (member.membership_expires && new Date(member.membership_expires) > new Date()) {
      baseDate = new Date(member.membership_expires);
    }

    baseDate.setDate(baseDate.getDate() + daysToAdd);
    const newExpires = baseDate.toISOString().split('T')[0];

    // 3. Update Member & Subtract Balance if Wallet
    const finalAmount = amount || plan.price || 0;
    
    let updateQuery = `
      UPDATE members 
      SET membership_expires = $1, 
          membership_plan_id = $2, 
          status = 'active'
    `;
    const updateParams = [newExpires, planId];
    
    if (paymentMethod === 'wallet') {
      updateQuery += `, balance = COALESCE(balance, 0) - $3`;
      updateParams.push(finalAmount);
      updateParams.push(memberId);
      updateQuery += ` WHERE id = $4`;
    } else {
      updateParams.push(memberId);
      updateQuery += ` WHERE id = $3`;
    }
    
    await db.query(updateQuery, updateParams);

    // 4. Record Payment with Banking Metadata
    // finalAmount is already defined above
    const { rows: payRows } = await db.query(
      `INSERT INTO payments (
        transaction_id, member_id, type, amount, status, notes, payment_method, 
        paid_at, external_txn_id, gateway, reference_id, sync_status, payment_content
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        generateTransactionId('SUB'),
        memberId,
        'membership',
        finalAmount,
        paymentStatus,
        note || `Đăng ký/Gia hạn gói ${plan.plan_name} (${daysToAdd} ngày)`,
        paymentMethod,
        external_txn_id,
        gateway,
        reference_id,
        sync_status,
        payment_content
      ]
    );

    return {
      success: true,
      newExpires,
      daysAdded: daysToAdd,
      payment: payRows[0]
    };
  } catch (error) {
    console.error('Error in processMembershipUpgrade:', error);
    throw error;
  }
}

module.exports = {
  processMembershipUpgrade
};
