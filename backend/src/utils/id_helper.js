/**
 * ID Helper - Sinh mã giao dịch và mã định danh duy nhất cho hệ thống Library
 * Tương thích với PostgreSQL và đảm bảo tính duy nhất
 */

const crypto = require('crypto');

/**
 * Sinh mã giao dịch cho bảng Payments
 * Định dạng: TXN-[TYPE]-[YYYYMMDD]-[RANDOM]
 * @param {string} type - Loại giao dịch (PENALTY, SUBSCRIPTION, DEPOSIT)
 * @returns {string} Mã giao dịch duy nhất
 */
exports.generateTransactionId = (type = 'PAY') => {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
  const prefix = type.toString().toUpperCase().substring(0, 3);
  return `TXN-${prefix}-${dateStr}-${randomStr}`;
};

/**
 * Sinh mã biên lai/hóa đơn
 * @returns {string}
 */
exports.generateInvoiceId = () => {
  const ts = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${ts}-${random}`;
};
