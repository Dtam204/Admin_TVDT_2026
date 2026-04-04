const { auth } = require('../services/admin');

/**
 * Auth Controller - Admin System
 * Chuẩn hóa phản hồi RESTful: success, message, data, code
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ email và mật khẩu',
        code: 400
      });
    }

    const result = await auth.authenticateAdmin({ email, password });

    if (result) {
      return res.json({
        success: true,
        message: 'Đăng nhập hệ thống quản trị thành công',
        data: result,
        code: 0
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Email hoặc mật khẩu không chính xác hoặc tài khoản đã bị khoá',
      code: 401
    });
  } catch (error) {
    console.error('Admin Login error:', error);
    return next(error);
  }
};
