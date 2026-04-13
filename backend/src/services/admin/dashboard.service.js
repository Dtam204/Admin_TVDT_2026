const { pool } = require('../../config/database');

/**
 * DashboardService - Xử lý nghiệp vụ thống kê toàn hệ thống
 * Đảm bảo số liệu "Chuẩn thật" truy vấn trực tiếp từ Database
 */
class DashboardService {
  /**
   * Lấy tổng hợp số liệu (Summary Stats)
   */
  static async getSummary() {
    const queries = {
      // 1. Thống kê cơ bản
      totalBooks: 'SELECT COUNT(*) FROM books',
      totalAuthors: 'SELECT COUNT(*) FROM authors',
      totalCollections: 'SELECT COUNT(*) FROM collections',
      totalMembers: 'SELECT COUNT(*) FROM members',
      totalCeasedCooperationBooks: "SELECT COUNT(*) FROM books WHERE cooperation_status = 'ceased_cooperation'",
      
      // 2. Thống kê nâng cao theo yêu cầu
      totalViews: "SELECT COUNT(*) FROM interaction_logs WHERE action_type IN ('read', 'view', 'download')",
      totalRevenue: "SELECT SUM(amount) FROM payments WHERE type IN ('wallet_deposit', 'course', 'manual_payment') AND status = 'completed'",
      totalFavorites: "SELECT COUNT(*) FROM wishlists",
      totalBorrows: "SELECT COUNT(*) FROM book_loans",
      totalOverdueLoans: "SELECT COUNT(*) FROM book_loans WHERE status = 'overdue' OR (status = 'borrowing' AND due_date < CURRENT_DATE)",
      totalPendingRequests: "SELECT COUNT(*) FROM membership_requests WHERE status = 'pending'",
      avgRating: "SELECT AVG(rating)::numeric(10,1) FROM book_reviews WHERE rating > 0 AND status = 'published'",
      totalRatings: "SELECT COUNT(*) FROM book_reviews WHERE rating > 0 AND status = 'published'",
      
      // Phân phối sao (1-5) để vẽ biểu đồ
      ratingDistribution: "SELECT rating, COUNT(*) as count FROM book_reviews WHERE rating > 0 AND status = 'published' GROUP BY rating ORDER BY rating DESC",

      // 3. Xu hướng mượn sách (7 ngày gần nhất)
      loanTrends: `
        SELECT 
          to_char(date_series, 'DD/MM') as date,
          (SELECT COUNT(*) FROM book_loans WHERE date_trunc('day', created_at) = date_series) as count
        FROM generate_series(
          date_trunc('day', CURRENT_DATE) - interval '6 days',
          date_trunc('day', CURRENT_DATE),
          interval '1 day'
        ) AS date_series
        ORDER BY date_series ASC
      `
    };

    const results = {};
    const keys = Object.keys(queries);
    
    // Chạy song song tất cả các câu lệnh COUNT/SUM để tối ưu tốc độ
    const promises = keys.map(key => pool.query(queries[key]));
    const queryResults = await Promise.all(promises);
    
    keys.forEach((key, index) => {
      if (key === 'ratingDistribution' || key === 'loanTrends') {
        results[key] = queryResults[index].rows;
      } else {
        const row = queryResults[index].rows[0];
        const val = row ? row[Object.keys(row)[0]] : 0;
        results[key] = parseFloat(val) || 0;
      }
    });

    return results;
  }

  /**
   * Lấy hoạt động gần đây (Recent Activities)
   */
  static async getRecentActivities() {
    // 5 phiếu mượn mới nhất
    const { rows: loans } = await pool.query(`
      SELECT bl.*, m.full_name as member_name, b.title as book_title
      FROM book_loans bl
      JOIN members m ON bl.member_id = m.id
      JOIN books b ON bl.book_id = b.id
      ORDER BY bl.created_at DESC
      LIMIT 5
    `);
    
    // 5 bình luận/đánh giá mới nhất
    const { rows: reviews } = await pool.query(`
      SELECT c.*, u.name as user_name, b.title as book_title
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      JOIN books b ON c.object_id = b.id
      WHERE c.object_type = 'book'
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    return {
      recentLoans: loans,
      recentReviews: reviews
    };
  }

  /**
   * Lấy cảnh báo hệ thống dành cho header admin
   */
  static async getSystemAlerts() {
    const safeQuery = async (query, params = []) => {
      try {
        const { rows } = await pool.query(query, params);
        return rows;
      } catch (error) {
        console.error('[DashboardService.getSystemAlerts] Query failed:', error.message);
        return [];
      }
    };

    const [
      pendingMembershipRes,
      overdueLoansRes,
      pendingCommentsRes,
      flaggedReviewsRes,
      paymentSignalsRes,
      pendingDepositRes,
    ] = await Promise.all([
      safeQuery("SELECT COUNT(*)::int AS count FROM membership_requests WHERE status = 'pending'"),
      safeQuery("SELECT COUNT(*)::int AS count FROM book_loans WHERE status = 'overdue' OR (status = 'borrowing' AND due_date < CURRENT_DATE)"),
      safeQuery("SELECT COUNT(*)::int AS count FROM comments WHERE status = 'pending'"),
      safeQuery("SELECT COUNT(*)::int AS count FROM book_reviews WHERE status = 'flagged'"),
      safeQuery(
        `SELECT status, COUNT(*)::int AS count, MAX(created_at) AS created_at
         FROM payments
         WHERE created_at >= NOW() - interval '3 days'
           AND status IN ('failed', 'expired', 'cancelled')
         GROUP BY status`
      ),
      safeQuery(
        `SELECT COUNT(*)::int AS count, MAX(created_at) AS created_at
         FROM payments
         WHERE created_at >= NOW() - interval '3 days'
           AND status = 'pending'
           AND type IN ('wallet_deposit', 'membership_upgrade', 'course', 'manual_payment', 'fee_penalty')`
      ),
    ]);

    const pendingMembership = pendingMembershipRes[0]?.count || 0;
    const overdueLoans = overdueLoansRes[0]?.count || 0;
    const pendingComments = pendingCommentsRes[0]?.count || 0;
    const flaggedReviews = flaggedReviewsRes[0]?.count || 0;
    const pendingDeposits = pendingDepositRes[0]?.count || 0;

    const alerts = [];

    if (pendingMembership > 0) {
      alerts.push({
        id: 'membership-requests-pending',
        type: 'membership',
        severity: 'high',
        title: `${pendingMembership} đơn gia hạn chờ duyệt`,
        message: 'Cần xử lý đơn gia hạn hội viên để tránh tồn đọng.',
        href: '/admin/membership-requests',
        count: pendingMembership,
        created_at: new Date().toISOString(),
      });
    }

    if (overdueLoans > 0) {
      alerts.push({
        id: 'book-loans-overdue',
        type: 'book-loan',
        severity: 'high',
        title: `${overdueLoans} phiếu mượn quá hạn`,
        message: 'Kiểm tra quá hạn và gửi nhắc nhở đến bạn đọc.',
        href: '/admin/book-loans?status=overdue',
        count: overdueLoans,
        created_at: new Date().toISOString(),
      });
    }

    if (pendingComments > 0) {
      alerts.push({
        id: 'comments-pending',
        type: 'comment',
        severity: 'medium',
        title: `${pendingComments} bình luận chờ duyệt`,
        message: 'Kiểm duyệt các bình luận mới từ bạn đọc.',
        href: '/admin/comments?status=pending',
        count: pendingComments,
        created_at: new Date().toISOString(),
      });
    }

    if (flaggedReviews > 0) {
      alerts.push({
        id: 'reviews-flagged',
        type: 'review',
        severity: 'medium',
        title: `${flaggedReviews} đánh giá cần kiểm tra`,
        message: 'Có đánh giá bị đánh dấu, vui lòng xem lại.',
        href: '/admin/reviews?status=flagged',
        count: flaggedReviews,
        created_at: new Date().toISOString(),
      });
    }

    if (pendingDeposits > 0) {
      alerts.push({
        id: 'payments-pending',
        type: 'payment',
        severity: 'medium',
        title: `${pendingDeposits} giao dịch chờ xử lý`,
        message: 'Có giao dịch đang pending trong 3 ngày gần đây, cần kiểm tra đối soát.',
        href: '/admin/payments',
        count: pendingDeposits,
        created_at: pendingDepositRes[0]?.created_at || new Date().toISOString(),
      });
    }

    for (const paymentSignal of paymentSignalsRes) {
      const status = paymentSignal.status;
      const count = Number(paymentSignal.count) || 0;
      if (count <= 0) continue;

      let statusLabel = 'bất thường';
      if (status === 'failed') statusLabel = 'thất bại';
      if (status === 'expired') statusLabel = 'hết hạn';
      if (status === 'cancelled') statusLabel = 'đã hủy';

      alerts.push({
        id: `payments-${status}`,
        type: 'payment',
        severity: 'high',
        title: `${count} giao dịch ${statusLabel}`,
        message: `Hệ thống phát hiện giao dịch trạng thái ${statusLabel} trong 3 ngày gần đây.`,
        href: '/admin/payments',
        count,
        created_at: paymentSignal.created_at || new Date().toISOString(),
      });
    }

    alerts.sort((a, b) => {
      const weight = { high: 3, medium: 2, info: 1 };
      const severityDiff = (weight[b.severity] || 0) - (weight[a.severity] || 0);
      if (severityDiff !== 0) return severityDiff;
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    const limitedAlerts = alerts.slice(0, 20);

    const unreadCount = limitedAlerts.reduce((sum, item) => sum + (Number(item.count) || 0), 0);

    return {
      unreadCount,
      alerts: limitedAlerts,
      generatedAt: new Date().toISOString(),
    };
  }
}

module.exports = DashboardService;
