const { pool } = require('../../config/database');

/**
 * Reader Transaction Controller
 * Logic for members to manage their own wallet and payments
 */

/**
 * Get current member's balance and summary
 */
exports.getBalance = async (req, res) => {
  try {
    const { id: userId } = req.user;
    // Lấy member_id từ user_id
    const { rows: memberRows } = await pool.query('SELECT id, balance, full_name, card_number FROM members WHERE user_id = $1', [userId]);
    
    if (memberRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.json({ success: true, data: memberRows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get personal transaction history
 */
exports.getMyTransactions = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { rows: memberRows } = await pool.query('SELECT id FROM members WHERE user_id = $1', [userId]);
    if (memberRows.length === 0) return res.status(404).json({ success: false, message: 'Member not found' });
    
    const memberId = memberRows[0].id;
    const { limit = 10, page = 1 } = req.query;
    const offset = (page - 1) * parseInt(limit);

    const { rows } = await pool.query(
      'SELECT *, type as transaction_type, notes as description FROM payments WHERE member_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [memberId, parseInt(limit), offset]
    );

    const countRes = await pool.query(
      'SELECT COUNT(*) FROM payments WHERE member_id = $1',
      [memberId]
    );
    const total = parseInt(countRes.rows[0].count);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Thanh toán phí phạt qua ví (Reader standard)
 */
exports.payFine = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { id: userId } = req.user;
    const { rows: memberRowsInitial } = await client.query('SELECT id, balance FROM members WHERE user_id = $1', [userId]);
    if (memberRowsInitial.length === 0) return res.status(404).json({ success: false, message: 'Member not found' });
    
    const memberId = memberRowsInitial[0].id;

    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT * FROM payments WHERE id = $1 AND member_id = $2 AND status = $3',
      [id, memberId, 'pending']
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Giao dịch không hợp lệ hoặc đã hoàn tất' });
    }

    const fine = rows[0];
    const amount = parseFloat(fine.amount);
    const balance = parseFloat(memberRowsInitial[0].balance || 0);

    if (balance < amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Số dư ví không đủ để thanh toán' });
    }

    // Update balance (deduct)
    await client.query(
      'UPDATE members SET balance = balance - $1 WHERE id = $2',
      [amount, memberId]
    );

    // Update status (payments used 'notes' instead of 'description')
    await client.query(
      'UPDATE payments SET status = $1, notes = COALESCE(notes, \'\') || $2 WHERE id = $3',
      ['completed', ` (Đã thanh toán qua ví)`, id]
    );

    // Log activity
    await client.query(
      'INSERT INTO member_activities (member_id, activity_type, description) VALUES ($1, $2, $3)',
      [memberId, 'fine_payment', `Thanh toán phí phạt #${id} số tiền ${amount} VNĐ.`]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Thanh toán phí phạt thành công.' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};
