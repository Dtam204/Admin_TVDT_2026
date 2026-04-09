const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

/**
 * @openapi
 * /api/webhooks/sepay:
 *   post:
 *     tags: [Webhooks]
 *     summary: "Xử lý thông báo chuyển khoản từ SePay (Ngân hàng)"
 *     description: |
 *       Endpoint nhận dữ liệu từ SePay Webhook. Hệ thống ưu tiên match lệnh nạp theo `wallet_deposit_orders`
 *       để cộng ví an toàn, idempotent và có thể đối soát. Với payload cũ, hệ thống vẫn fallback xử lý cú pháp NAP/GH/PHAT.
 *       
 *       **Cấu trúc nội dung chuyển khoản hỗ trợ:**
 *       - `NAP-R{MemberID}-{timestamp}`: Nạp tiền theo lệnh nạp đã tạo trên App (khuyến nghị).
 *       - `NAP {MemberID}`: Nạp tiền theo cú pháp legacy (fallback).
 *       - `GH {MemberID} [PlanID]`: Gia hạn gói hội viên.
 *       - `PHAT {MemberID} {BorrowID}`: Nộp phạt cho phiếu mượn.
 *
 *       **Security:**
 *       - Khuyến nghị truyền chữ ký tại header `x-sepay-signature` (HMAC SHA256 raw body).
 *       - Tương thích ngược với `Authorization: Bearer <SEPAY_WEBHOOK_KEY>` nếu hệ thống chưa bật chữ ký.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id: { type: string, description: "Mã giao dịch SePay" }
 *               content: { type: string, description: "Nội dung chuyển khoản" }
 *               transfer_amount: { type: number, description: "Số tiền nhận được" }
 *               gateway: { type: string, description: "Ngân hàng nhận" }
 *               transfer_type: { type: string, enum: [in, out] }
 *     parameters:
 *       - in: header
 *         name: x-sepay-signature
 *         schema: { type: string }
 *         required: false
 *         description: Chữ ký HMAC SHA256 (hex) của raw body webhook.
 *       - in: header
 *         name: Authorization
 *         schema: { type: string }
 *         required: false
 *         description: Chế độ tương thích ngược, format Bearer {SEPAY_WEBHOOK_KEY}.
 *     responses:
 *       200:
 *         description: Xử lý thành công (hoặc bỏ qua nếu sai cú pháp)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 *       401:
 *         description: Lỗi xác thực (Sai chữ ký hoặc Webhook Key)
 */

// POST /api/webhooks/sepay
router.post('/sepay', webhookController.handleSePayWebhook);

module.exports = router;
