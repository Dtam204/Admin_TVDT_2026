const nodemailer = require('nodemailer');
const { mail } = require('../config/env');

/**
 * Mail Service - Xử lý gửi email chuyên nghiệp (Nodemailer)
 */
class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: mail.user,
        pass: mail.pass,
      },
    });
  }

  /**
   * Kiểm tra kết nối SMTP
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection established successfully');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error.message);
      return false;
    }
  }

  /**
   * Gửi mã OTP xác thực quên mật khẩu
   * @param {string} toEmail 
   * @param {string} otpCode 
   */
  async sendOTP(toEmail, otpCode) {
    const mailOptions = {
      from: mail.from,
      to: toEmail,
      subject: `[Thư viện TN] Mã xác thực OTP: ${otpCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #2c3e50;">Thư viện TN</h2>
            <hr style="border: 0; border-top: 1px solid #eee;">
          </div>
          <p>Chào bạn,</p>
          <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản tại <strong>Thư viện TN</strong>. Dưới đây là mã xác thực OTP của bạn:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; padding: 15px 25px; font-size: 24px; font-weight: bold; color: #fff; background-color: #3498db; border-radius: 5px; letter-spacing: 5px;">
              ${otpCode}
            </span>
          </div>
          <p>Mã OTP này có hiệu lực trong vòng <strong>15 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
          <p>Nếu bạn không yêu cầu thay đổi này, hãy bỏ qua email này hoặc liên hệ với ban quản trị.</p>
          <div style="margin-top: 40px; text-align: center; color: #7f8c8d; font-size: 12px;">
            <p>&copy; 2026 Thư viện TN - Hệ thống Quản trị Thư viện Hiện đại</p>
          </div>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw new Error(`Không thể gửi email: ${error.message}`);
    }
  }
}

module.exports = new MailService();
