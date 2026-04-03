const OverdueService = require('../services/admin/overdue.service');

/**
 * Cron Utility (Synchronized Phase 2)
 * Giả lập Cron job để chạy các tác vụ định kỳ mà không cần thêm thư viện ngoài.
 */

class CronJobManager {
  static start() {
    console.log('⏰ Hệ thống Tác vụ Định kỳ đã khởi động.');
    
    // Kiểm tra mỗi giờ
    const ONE_HOUR = 60 * 60 * 1000;
    
    setInterval(async () => {
      const now = new Date();
      const hours = now.getHours();
      
      // Chạy vào lúc 8h sáng (8:00 - 8:59)
      // Để tránh chạy nhiều lần trong cùng 1 giờ, ta có thể dùng biến flag hoặc kiểm tra phút
      if (hours === 8) {
        console.log('[Cron] Đã đến 8:00 sáng. Bắt đầu quét sách quá hạn...');
        try {
          const result = await OverdueService.scanAndNotifyOverdue();
          console.log(`[Cron] Kết quả quét: ${result.notified} thông báo đã gửi.`);
        } catch (error) {
          console.error('[Cron] Lỗi khi chạy tác vụ quét quá hạn:', error);
        }
      }
    }, ONE_HOUR);

    // Chạy thử ngay khi khởi động (chỉ ở môi trường dev nếu cần)
    // if (process.env.NODE_ENV === 'development') {
    //   OverdueService.scanAndNotifyOverdue().catch(console.error);
    // }
  }
}

module.exports = CronJobManager;
