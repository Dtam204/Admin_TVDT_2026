const InteractionService = require('../services/admin/interaction.service');

/**
 * Admin Interaction Controller (Phase 2 Library)
 * Quản lý Đánh giá, Bình luận và Thống kê Wishlist.
 */

class AdminInteractionController {
  /**
   * Lấy danh sách đánh giá (Admin/Editor)
   */
  static async getReviews(req, res) {
    try {
      const { page, limit, status, bookId, search } = req.query;
      const result = await InteractionService.getAllReviews({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status,
        bookId,
        search
      });
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Cập nhật trạng thái đánh giá (Duyệt/Ẩn)
   */
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const review = await InteractionService.updateReviewStatus(id, status);
      res.json({
        success: true,
        message: 'Cập nhật trạng thái đánh giá thành công!',
        data: review
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Xóa đánh giá (Admin/Editor)
   */
  static async deleteReview(req, res) {
    try {
      const { id } = req.params;
      const deleted = await InteractionService.deleteReview(id);
      if (deleted) {
        res.json({ success: true, message: 'Đã xóa đánh giá thành công!' });
      } else {
        res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá.' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Lấy thống kê sách được yêu thích nhất
   */
  static async getTopWishlisted(req, res) {
    try {
      const { limit } = req.query;
      const stats = await InteractionService.getWishlistStats({
        limit: parseInt(limit) || 10
      });
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = AdminInteractionController;
