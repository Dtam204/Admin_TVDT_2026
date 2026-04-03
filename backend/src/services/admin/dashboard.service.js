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
      totalRevenue: "SELECT SUM(ABS(amount)) FROM payments WHERE type IN ('wallet_deposit', 'plan_subscription', 'manual_payment', 'service_fee') AND status = 'completed'",
      totalFavorites: "SELECT COUNT(*) FROM interaction_logs WHERE action_type = 'favorite'",
      totalBorrows: "SELECT COUNT(*) FROM book_loans",
      totalOverdueLoans: "SELECT COUNT(*) FROM book_loans WHERE status = 'overdue' OR (status = 'borrowing' AND due_date < CURRENT_DATE)",
      totalPendingRequests: "SELECT COUNT(*) FROM membership_requests WHERE status = 'pending'",
      avgRating: "SELECT AVG(rating)::numeric(10,1) FROM comments WHERE rating > 0",
      totalRatings: "SELECT COUNT(*) FROM comments WHERE rating > 0",
      
      // Phân phối sao (1-5) để vẽ biểu đồ
      ratingDistribution: "SELECT rating, COUNT(*) as count FROM comments WHERE rating > 0 GROUP BY rating ORDER BY rating DESC",

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
      SELECT bl.*, m.full_name as member_name, b.title->>'vi' as book_title
      FROM book_loans bl
      JOIN members m ON bl.member_id = m.id
      JOIN books b ON bl.book_id = b.id
      ORDER BY bl.created_at DESC
      LIMIT 5
    `);
    
    // 5 bình luận/đánh giá mới nhất
    const { rows: reviews } = await pool.query(`
      SELECT c.*, u.name as user_name, b.title->>'vi' as book_title
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
}

module.exports = DashboardService;
