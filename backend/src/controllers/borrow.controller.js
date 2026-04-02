const borrowService = require('../services/admin/borrow.service');

/**
 * BorrowController - Xử lý các yêu cầu mượn trả từ API
 */
class BorrowController {
  /**
   * Đăng ký mượn sách
   * POST /api/Borrow/register
   */
  async register(req, res, next) {
    try {
      const data = req.body;
      const result = await borrowService.registerBorrow(data);
      
      return res.status(200).json({
        code: 0,
        success: true,
        message: 'Đăng ký mượn sách thành công',
        data: result,
        errors: []
      });
    } catch (error) {
      return res.status(400).json({
        code: 1,
        success: false,
        message: error.message || 'Có lỗi xảy ra khi đăng ký mượn',
        data: null,
        errors: [error.message]
      });
    }
  }

  /**
   * Duyệt yêu cầu mượn
   * POST /api/Borrow/approve
   */
  async approve(req, res, next) {
    try {
      const { requestId } = req.body;
      if (!requestId) {
        throw new Error('Thiếu ID yêu cầu mượn (requestId)');
      }
      
      const result = await borrowService.approveBorrow(requestId);
      
      return res.status(200).json({
        code: 0,
        success: true,
        message: 'Duyệt yêu cầu mượn thành công',
        data: result,
        errors: []
      });
    } catch (error) {
      return res.status(400).json({
        code: 1,
        success: false,
        message: error.message || 'Có lỗi xảy ra khi duyệt mượn',
        data: null,
        errors: [error.message]
      });
    }
  }

  /**
   * Gia hạn mượn sách
   * POST /api/admin/borrow/extend
   */
  async extend(req, res, next) {
    try {
      const { loanId, extendDays, newDueDate } = req.body;
      const result = await borrowService.extendBorrow(loanId, extendDays, newDueDate);
      return res.status(200).json({
        code: 0,
        success: true,
        message: 'Gia hạn thành công',
        data: result
      });
    } catch (error) {
      return res.status(400).json({
        code: 1,
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Trả sách
   * POST /api/Borrow/return
   */
  async returnBook(req, res, next) {
    try {
      const { loanId } = req.body;
      const result = await borrowService.returnBook(loanId);
      return res.status(200).json({
        code: 0,
        success: true,
        message: 'Trả sách thành công',
        data: result
      });
    } catch (error) {
      return res.status(400).json({
        code: 1,
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy danh sách phiếu mượn (Dùng cho Admin)
   * GET /api/Borrow/all
   */
  async getAll(req, res) {
    try {
      const result = await borrowService.getAllLoans(req.query);
      return res.status(200).json({
        code: 0,
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      return res.status(400).json({
        code: 1,
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Đặt chỗ (Reservation)
   * POST /api/Borrow/reserve
   */
  async reserve(req, res) {
    try {
      const { readerId, publicationId, notes } = req.body;
      const result = await borrowService.createReservation(readerId, publicationId, notes);
      return res.status(200).json({
        code: 0,
        success: true,
        message: 'Đăng ký đặt chỗ thành công',
        data: result
      });
    } catch (error) {
      return res.status(400).json({
        code: 1,
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy danh sách hàng đợi đặt chỗ
   * GET /api/Borrow/reservations
   */
  async getReservations(req, res) {
    try {
      const result = await borrowService.getReservations(req.query);
      return res.status(200).json({
        code: 0,
        success: true,
        data: result
      });
    } catch (error) {
      return res.status(400).json({
        code: 1,
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Xuất danh sách mượn sách ra file Excel
   * GET /api/Borrow/export
   */
  async exportExcel(req, res) {
    try {
      const buffer = await borrowService.exportLoansExcel(req.query);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=danh_sach_muon_tra.xlsx');
      
      return res.send(buffer);
    } catch (error) {
      return res.status(400).json({
        code: 1,
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new BorrowController();
