const { pool } = require('../config/database');

/**
 * Finance Controller
 * Handles financial statistics and reporting
 */

/**
 * Get dashboard statistics for the payments page
 */
exports.getFinanceStats = async (req, res, next) => {
  try {
    // 1. Total Daily Revenue (Sum of all 'completed' payments today)
    const dailyRevenueRes = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM payments 
      WHERE status = 'completed' 
      AND created_at >= CURRENT_DATE
    `);
    
    // 2. Previous Daily Revenue (for calculating trend percentage)
    const prevDailyRevenueRes = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM payments 
      WHERE status = 'completed' 
      AND created_at >= CURRENT_DATE - INTERVAL '1 day' 
      AND created_at < CURRENT_DATE
    `);

    // 3. Automated Transaction Count
    const automatedCountRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM payments 
      WHERE sync_status = 'automated' 
      AND status = 'completed'
    `);

    // 4. Wallet Distribution (Total balance stored in the system)
    const totalWalletRes = await pool.query(`
      SELECT SUM(balance) as total FROM members
    `);

    const dailyRevenue = parseFloat(dailyRevenueRes.rows[0].total);
    const prevDailyRevenue = parseFloat(prevDailyRevenueRes.rows[0].total);
    const trendPercent = prevDailyRevenue === 0 
      ? (dailyRevenue > 0 ? 100 : 0) 
      : Math.round(((dailyRevenue - prevDailyRevenue) / prevDailyRevenue) * 100);

    return res.json({
      success: true,
      data: {
        dailyRevenue,
        trendPercent,
        automatedCount: parseInt(automatedCountRes.rows[0].count),
        totalWallet: parseFloat(totalWalletRes.rows[0].total || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};
