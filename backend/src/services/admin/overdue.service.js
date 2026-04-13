const { pool } = require('../../config/database');
const NotificationService = require('./notification.service');
const { toPlainText } = require('../../utils/locale');

/**
 * Overdue Service (Synchronized Phase 2)
 * Chịu trách nhiệm quét và gửi thông báo cho các trường hợp mượn sách quá hạn.
 */

class OverdueService {
  /**
   * Quét toàn bộ sách đang mượn và gửi thông báo nếu quá hạn
   * Logic: Trạng thái là 'borrowed' và due_date < CURRENT_DATE
   */
  static async scanAndNotifyOverdue() {
    console.log('[OverdueService] Bắt đầu quét sách quá hạn...');

    // 1. Tìm các đơn mượn quá hạn chưa được trả
    const { rows: overdueLoans } = await pool.query(`
      SELECT 
        bl.id as loan_id, bl.due_date,
        m.id as member_id, m.full_name,
        b.id as book_id, b.title::text as book_title
      FROM book_loans bl
      JOIN members m ON bl.member_id = m.id
      JOIN books b ON bl.book_id = b.id
      WHERE bl.status = 'borrowed' 
      AND bl.due_date < CURRENT_DATE
    `);

    console.log(`[OverdueService] Tìm thấy ${overdueLoans.length} đơn quá hạn.`);

    const results = {
      total: overdueLoans.length,
      notified: 0,
      errors: []
    };

    // 2. Gửi thông báo cho từng hội viên
    for (const loan of overdueLoans) {
      try {
        await NotificationService.sendNotification({
          member_id: loan.member_id,
          type: 'overdue',
          target_type: 'individual',
          title: 'Nhắc nhở: Sách mượn đã quá hạn',
          message: `Cuốn sách "${toPlainText(loan.book_title, 'N/A')}" bạn mượn đã quá hạn từ ngày ${new Date(loan.due_date).toLocaleDateString()}. Vui lòng trả sách sớm để tránh phát sinh chi phí.`,
          related_id: loan.loan_id,
          related_type: 'book_loan',
          metadata: {
            book_id: loan.book_id,
            due_date: loan.due_date
          }
        });

        // Cập nhật trạng thái trong book_loans sang 'overdue' (nếu chưa cập nhật)
        await pool.query('UPDATE book_loans SET status = $1 WHERE id = $2', ['overdue', loan.loan_id]);
        
        results.notified++;
      } catch (error) {
        console.error(`[OverdueService] Lỗi khi thông báo đơn ${loan.loan_id}:`, error);
        results.errors.push({ loan_id: loan.loan_id, error: error.message });
      }
    }

    console.log('[OverdueService] Hoàn tất quét quá hạn.');
    return results;
  }
}

module.exports = OverdueService;
