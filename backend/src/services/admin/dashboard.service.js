const { pool } = require('../../config/database');
const GeminiService = require('../gemini.service');

/**
 * DashboardService - Xử lý nghiệp vụ thống kê toàn hệ thống
 * Đảm bảo số liệu "Chuẩn thật" truy vấn trực tiếp từ Database
 */
class DashboardService {
  static _stripMarkdownCodeFence(input = '') {
    const text = String(input || '').trim();
    const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (fenced) return fenced[1].trim();
    return text;
  }

  static _safeJsonParse(text = '') {
    const cleaned = this._stripMarkdownCodeFence(text);
    try {
      return JSON.parse(cleaned);
    } catch (_err) {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start > -1 && end > start) {
        try {
          return JSON.parse(cleaned.slice(start, end + 1));
        } catch (_nestedErr) {
          return null;
        }
      }
      return null;
    }
  }

  static _normalizeInsights(raw, source = 'fallback') {
    const insights = raw && typeof raw === 'object' ? raw : {};

    const normalizeItem = (item, index, prefix) => {
      if (!item || typeof item !== 'object') return null;
      const severity = String(item.severity || 'medium').toLowerCase();
      return {
        id: item.id || `${prefix}-${index + 1}`,
        title: String(item.title || '').trim(),
        reason: String(item.reason || '').trim(),
        action: String(item.action || '').trim(),
        severity: ['high', 'medium', 'low'].includes(severity) ? severity : 'medium',
      };
    };

    const priorities = Array.isArray(insights.priorities)
      ? insights.priorities.map((item, index) => normalizeItem(item, index, 'priority')).filter(Boolean).slice(0, 3)
      : [];

    const opportunities = Array.isArray(insights.opportunities)
      ? insights.opportunities.map((item, index) => normalizeItem(item, index, 'opportunity')).filter(Boolean).slice(0, 3)
      : [];

    const risks = Array.isArray(insights.risks)
      ? insights.risks.map((item, index) => normalizeItem(item, index, 'risk')).filter(Boolean).slice(0, 3)
      : [];

    return {
      source,
      overview: String(insights.overview || '').trim(),
      priorities,
      opportunities,
      risks,
      fallbackReason: source === 'fallback'
        ? (String(insights.fallbackReason || '').trim() || 'unknown_fallback')
        : null,
      generatedAt: new Date().toISOString(),
    };
  }

  static _buildFallbackInsights(summary = {}, alerts = {}, fallbackReason = null) {
    const fallback = {
      overview: 'AI đang dùng chế độ phân tích quy tắc nội bộ từ dữ liệu dashboard hiện tại.',
      priorities: [],
      opportunities: [],
      risks: [],
      fallbackReason,
    };

    if ((summary.totalPendingRequests || 0) > 0) {
      fallback.priorities.push({
        id: 'pending-membership',
        title: `${summary.totalPendingRequests} đơn gia hạn đang chờ`,
        reason: 'Tồn đọng duyệt đơn có thể ảnh hưởng trải nghiệm hội viên.',
        action: 'Ưu tiên xử lý hàng đợi membership requests theo SLA trong ngày.',
        severity: 'high',
      });
    }

    if ((summary.totalOverdueLoans || 0) > 0) {
      fallback.priorities.push({
        id: 'overdue-loans',
        title: `${summary.totalOverdueLoans} phiếu mượn quá hạn`,
        reason: 'Số lượng quá hạn cao làm giảm vòng quay tài nguyên.',
        action: 'Kích hoạt nhắc hạn tự động và ưu tiên xử lý nhóm quá hạn lâu ngày.',
        severity: 'high',
      });
    }

    if ((summary.avgRating || 0) < 4 && (summary.totalRatings || 0) >= 20) {
      fallback.risks.push({
        id: 'rating-risk',
        title: `Điểm trung bình ${summary.avgRating}/5 cần theo dõi`,
        reason: 'Điểm đánh giá thấp kéo dài có thể làm giảm mức độ hài lòng người đọc.',
        action: 'Rà soát top phản hồi tiêu cực và triển khai cải thiện theo chủ đề.',
        severity: 'medium',
      });
    }

    if ((summary.totalFavorites || 0) > 0 && (summary.totalBorrows || 0) > 0) {
      const ratio = summary.totalFavorites / Math.max(summary.totalBorrows, 1);
      if (ratio > 0.4) {
        fallback.opportunities.push({
          id: 'favorites-conversion',
          title: 'Tỷ lệ yêu thích cao so với lượt mượn',
          reason: 'Có nhu cầu quan tâm tốt, phù hợp để tăng chuyển đổi từ yêu thích sang mượn.',
          action: 'Thêm chiến dịch nhắc mượn cho sách trong wishlist và ưu đãi theo phân khúc.',
          severity: 'medium',
        });
      }
    }

    if ((alerts.unreadCount || 0) > 0) {
      fallback.risks.push({
        id: 'alert-pressure',
        title: `${alerts.unreadCount} tín hiệu cần xử lý`,
        reason: 'Mật độ cảnh báo cao có thể gây trễ phản ứng vận hành.',
        action: 'Thiết lập quy trình phân loại cảnh báo theo mức độ và người chịu trách nhiệm.',
        severity: 'medium',
      });
    }

    return this._normalizeInsights(fallback, 'fallback');
  }

  /**
   * Lấy tổng hợp số liệu (Summary Stats)
   */
  static async getSummary() {
    const safeQuery = async (query, fallback = null) => {
      try {
        const { rows } = await pool.query(query);
        return rows;
      } catch (error) {
        const missingTable = error?.code === '42P01';
        if (missingTable) return fallback;
        throw error;
      }
    };

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
      
      // 3. Thống kê cộng đồng thảo luận (tối giản, ổn định)
      totalComments: "SELECT COUNT(*) FROM comments WHERE status <> 'deleted'",
      totalApprovedComments: "SELECT COUNT(*) FROM comments WHERE status = 'approved'",
      totalPendingComments: "SELECT COUNT(*) FROM comments WHERE status = 'pending'",
      totalDeletedComments: "SELECT COUNT(*) FROM comments WHERE status = 'deleted'",
      totalCommentReports: "SELECT COUNT(*) FROM comment_reports",
      totalOpenCommentReports: "SELECT COUNT(*) FROM comment_reports WHERE status IN ('new', 'processing')",
      totalResolvedCommentReports: "SELECT COUNT(*) FROM comment_reports WHERE status = 'resolved'",
      
      // Phân phối sao (1-5) để vẽ biểu đồ
      ratingDistribution: "SELECT rating, COUNT(*) as count FROM book_reviews WHERE rating > 0 AND status = 'published' GROUP BY rating ORDER BY rating DESC",

      // 4. Xu hướng mượn sách (7 ngày gần nhất)
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
    
    const promises = keys.map(async (key) => {
      const rows = await safeQuery(queries[key], key === 'ratingDistribution' || key === 'loanTrends' ? [] : [{ count: 0 }]);
      return { key, rows: rows || [] };
    });
    const queryResults = await Promise.all(promises);
    
    queryResults.forEach(({ key, rows }) => {
      if (key === 'ratingDistribution' || key === 'loanTrends') {
        results[key] = rows;
      } else {
        const row = rows[0];
        const val = row ? row[Object.keys(row)[0]] : 0;
        results[key] = parseFloat(val) || 0;
      }
    });

    results.communityDiscussion = {
      totalComments: results.totalComments || 0,
      totalApprovedComments: results.totalApprovedComments || 0,
      totalPendingComments: results.totalPendingComments || 0,
      totalDeletedComments: results.totalDeletedComments || 0,
      totalCommentReports: results.totalCommentReports || 0,
      totalOpenCommentReports: results.totalOpenCommentReports || 0,
      totalResolvedCommentReports: results.totalResolvedCommentReports || 0,
    };

    return results;
  }

  /**
   * Lấy hoạt động gần đây (Recent Activities)
   */
  static async getRecentActivities() {
    const safeQuery = async (query, fallback = []) => {
      try {
        const { rows } = await pool.query(query);
        return rows;
      } catch (error) {
        if (error?.code === '42P01') return fallback;
        throw error;
      }
    };

    // 5 phiếu mượn mới nhất
    const loans = await safeQuery(`
      SELECT bl.*, m.full_name as member_name, b.title as book_title
      FROM book_loans bl
      JOIN members m ON bl.member_id = m.id
      JOIN books b ON bl.book_id = b.id
      ORDER BY bl.created_at DESC
      LIMIT 5
    `);
    
    // 5 bình luận/đánh giá mới nhất
    const reviews = await safeQuery(`
      SELECT c.*, u.name as user_name, b.title as book_title
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      JOIN books b ON c.object_id = b.id
      WHERE c.object_type = 'book'
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    // 5 bình luận cộng đồng mới nhất (news/book/course)
    const recentComments = await safeQuery(`
      SELECT c.*, u.name as user_name, u.email as user_email,
             COALESCE(n.title, b.title, 'Đối tượng không xác định') as object_title
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN news n ON c.object_type = 'news' AND c.object_id = n.id
      LEFT JOIN books b ON c.object_type = 'book' AND c.object_id = b.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    return {
      recentLoans: loans,
      recentReviews: reviews,
      recentComments,
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

  /**
   * Lấy phân tích AI cho Dashboard (không ảnh hưởng luồng thống kê hiện tại)
   */
  static async getAIInsights() {
    const [summary, alerts] = await Promise.all([
      this.getSummary(),
      this.getSystemAlerts(),
    ]);

    const fallbackInsights = this._buildFallbackInsights(summary, alerts);
    const buildFallback = (reason) => this._normalizeInsights(
      {
        ...fallbackInsights,
        fallbackReason: reason || fallbackInsights.fallbackReason || 'unknown_fallback',
      },
      'fallback'
    );

    if (!GeminiService?.model) {
      return buildFallback('missing_gemini_model');
    }

    const inputPayload = {
      kpi: {
        totalViews: summary.totalViews || 0,
        totalRevenue: summary.totalRevenue || 0,
        totalBorrows: summary.totalBorrows || 0,
        totalFavorites: summary.totalFavorites || 0,
        totalOverdueLoans: summary.totalOverdueLoans || 0,
        totalPendingRequests: summary.totalPendingRequests || 0,
        avgRating: summary.avgRating || 0,
        totalRatings: summary.totalRatings || 0,
      },
      loanTrends: Array.isArray(summary.loanTrends) ? summary.loanTrends.slice(-7) : [],
      ratingDistribution: Array.isArray(summary.ratingDistribution) ? summary.ratingDistribution : [],
      systemAlerts: Array.isArray(alerts.alerts)
        ? alerts.alerts.slice(0, 8).map((item) => ({
            type: item.type,
            severity: item.severity,
            title: item.title,
            count: item.count,
          }))
        : [],
    };

    const prompt = [
      'Bạn là AI Analyst cho hệ thống quản trị thư viện.',
      'Hãy phân tích dữ liệu dashboard và trả về JSON THUẦN (không markdown, không giải thích).',
      'Schema bắt buộc:',
      '{',
      '  "overview": "string",',
      '  "priorities": [{"id":"string","title":"string","reason":"string","action":"string","severity":"high|medium|low"}],',
      '  "opportunities": [{"id":"string","title":"string","reason":"string","action":"string","severity":"high|medium|low"}],',
      '  "risks": [{"id":"string","title":"string","reason":"string","action":"string","severity":"high|medium|low"}]',
      '}',
      'Giới hạn: tối đa 3 mục cho mỗi danh sách, ngắn gọn, tiếng Việt chuyên nghiệp, hướng hành động rõ ràng.',
      `Dữ liệu đầu vào: ${JSON.stringify(inputPayload)}`,
    ].join('\n');

    try {
      const result = await GeminiService.model.generateContent(prompt);
      const response = await result.response;
      const parsed = this._safeJsonParse(response.text());
      if (!parsed) return buildFallback('gemini_invalid_json');

      const normalized = this._normalizeInsights(parsed, 'gemini');
      const hasUsefulContent =
        normalized.overview ||
        normalized.priorities.length > 0 ||
        normalized.opportunities.length > 0 ||
        normalized.risks.length > 0;

      return hasUsefulContent ? normalized : buildFallback('gemini_empty_insights');
    } catch (error) {
      console.error('[DashboardService.getAIInsights] Gemini analyze failed:', error.message);
      return buildFallback('gemini_error');
    }
  }
}

module.exports = DashboardService;
