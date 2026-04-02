/**
 * RBAC (Role-Based Access Control) Middleware
 * Đảm bảo phân tách luồng truy cập giữa Admin CMS và Mobile App
 */

/**
 * Middleware: Chỉ cho phép các vai trò Quản trị (Admin, Editor) truy cập
 * Chặn hoàn toàn vai trò 'user' (Bạn đọc) khỏi các API Admin
 */
const restrictToCMS = (req, res, next) => {
  if (!req.user) {
    process.stderr.write(`\n[RBAC_FAIL] No req.user for path: ${req.url}\n`);
    return res.status(401).json({
      success: false,
      message: 'Yêu cầu xác thực.',
    });
  }

  const { pool } = require('../config/database');

  const { role } = req.user;

  // Nếu vai trò là 'user' (Bạn đọc), không cho phép vào CMS
  if (role === 'user') {
    return res.status(403).json({
      success: false,
      message: 'Cảnh báo: Tài khoản của bạn không có quyền truy cập vào hệ thống Quản trị. Vui lòng sử dụng App di động.',
    });
  }

  return next();
};

/**
 * Middleware: Kiểm tra quyền cụ thể (Permission)
 * @param {string} permissionCode - Mã quyền cần kiểm tra (VD: 'users.manage')
 */
const checkPermission = (permissionCode) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Yêu cầu xác thực.',
      });
    }

    const { role, permissions = [] } = req.user;

    // Admin luôn có mọi quyền
    if (role === 'admin') {
      return next();
    }

    // Kiểm tra xem user có mã quyền này trong danh sách permissions không
    if (permissions.includes(permissionCode)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Bạn không có quyền thực hiện hành động này (${permissionCode}).`,
    });
  };
};

module.exports = {
  restrictToCMS,
  checkPermission,
};
