const express = require('express');
const { getPublicPlans } = require('../controllers/membershipPlans.controller');

const router = express.Router();

/**
 * @openapi
 * /api/public/membership-plans:
 *   get:
 *     tags:
 *       - Public MembershipPlans
 *     summary: Lấy danh sách gói thẻ thư viện đang hoạt động (Public)
 *     description: Trả về danh sách các gói dịch vụ Thư viện Đang Mở Bán để Frontend hiển thị Pricing Table. Không yêu cầu Token.
 *     responses:
 *       200:
 *         description: Trả về danh sách mảng Gói Độc Giả
 */
router.get('/', getPublicPlans);

module.exports = router;
