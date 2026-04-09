const { pool } = require('../../config/database');
const bcrypt = require('bcrypt');
const { getEffectiveMembership } = require('../../utils/member_helper');
const mailService = require('../mail.service');

/**
 * Reader Service - Xử lý nghiệp vụ chuyên nghiệp cho Bạn đọc (Account Module)
 * Đảm bảo: Logic OTP, Validation và Profile 360 độ chuẩn xác.
 */
class ReaderService {
  /**
   * Lấy Profile 360 độ - Tích hợp đầy đủ thông tin hội viên & thống kê
   */
  async getProfile(readerId) {
    const { rows } = await pool.query(`
      SELECT 
        m.id, m.full_name, m.email, m.phone, m.card_number, 
        m.membership_expires, m.status, m.balance, m.avatar,
        m.date_of_birth, m.identity_number,
        m.gender, m.address,
        mp.name as plan_name, mp.tier_code, mp.max_books_borrowed as max_borrow_limit,
        (SELECT COUNT(*) FROM book_loans WHERE member_id = m.id AND status IN ('borrowing', 'overdue')) as current_loans_count,
        (SELECT COALESCE(SUM(late_fee), 0) FROM book_loans WHERE member_id = m.id) as total_fines
      FROM members m 
      LEFT JOIN membership_plans mp ON m.membership_plan_id = mp.id
      WHERE m.id = $1
    `, [readerId]);

    if (rows.length === 0) return null;

    const member = rows[0];
    
    // 1. Tính toán quyền lợi thực tế (Đồng bộ logic Expiry)
    const effective = getEffectiveMembership({
      membership_expires: member.membership_expires,
      tier_code: member.tier_code || 'basic',
      plan_name: member.plan_name || 'Cơ bản',
      max_books_borrowed: member.max_borrow_limit || 3
    });

    // 2. Tính tuổi (doTuoi) từ ngày sinh (date_of_birth)
    let age = 0;
    if (member.date_of_birth) {
      const birthDate = new Date(member.date_of_birth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // 3. Định dạng ngày tháng về YYYY-MM-DD để khớp Swagger
    const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : null;

    return {
      ...member,
      date_of_birth: formatDate(member.date_of_birth),
      membership_expires: formatDate(member.membership_expires),
      plan_name: effective.plan_name,
      tier_code: effective.tier_code,
      max_borrow_limit: effective.max_borrow_limit,
      is_expired: effective.is_expired,
      balance: parseFloat(member.balance || 0),
      total_fines: parseFloat(member.total_fines || 0),
      age: age
    };
  }

  /**
   * Cập nhật Profile kèm Validation tính duy nhất
   */
  async updateProfile(readerId, { fullName, phone, email, gender, birthday, address }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Kiểm tra tính duy nhất của Số điện thoại
      if (phone) {
        const { rows: existingPhone } = await client.query(
          'SELECT id FROM members WHERE phone = $1 AND id != $2', 
          [phone, readerId]
        );
        if (existingPhone.length > 0) {
          throw new Error("Số điện thoại này đã được sử dụng bởi một tài khoản khác");
        }
      }

      // 2. Kiểm tra tính duy nhất của Email (nếu có cập nhật)
      if (email) {
        const { rows: existingEmail } = await client.query(
          'SELECT id FROM members WHERE email = $1 AND id != $2', 
          [email.toLowerCase(), readerId]
        );
        if (existingEmail.length > 0) {
          throw new Error("Email này đã được sử dụng bởi một tài khoản khác");
        }
      }

      // 3. Cập nhật dữ liệu vào bảng members
      await client.query(`
        UPDATE members SET 
          full_name = COALESCE($1, full_name), 
          phone = COALESCE($2, phone),
          email = COALESCE($3, email),
          gender = COALESCE($4, gender),
          date_of_birth = COALESCE($5, date_of_birth),
          address = COALESCE($6, address),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
      `, [
        fullName || null, 
        phone || null, 
        email ? email.toLowerCase() : null, 
        gender || null, 
        birthday || null, 
        address || null, 
        readerId
      ]);

      // 4. Nếu có đổi email, cần đồng bộ sang bảng users (nếu user_id tồn tại)
      if (email) {
        await client.query(`
          UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE id = (SELECT user_id FROM members WHERE id = $2)
        `, [email.toLowerCase(), readerId]);
      }

      await client.query('COMMIT');
      
      // 5. Trả về Profile đầy đủ sau cập nhật
      return await this.getProfile(readerId);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Luồng Quên mật khẩu - Bước 1: Tạo OTP
   */
  async generateOTP(email) {
    // 1. Kiểm tra Email có tồn tại trong hệ thống hội viên không
    const { rows: member } = await pool.query('SELECT id FROM members WHERE email = $1', [email]);
    if (member.length === 0) throw new Error("Email không tồn tại trong hệ thống bạn đọc");

    // 2. Sinh mã OTP 6 số ngẫu nhiên
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Hết hạn sau 15 phút

    // 3. Lưu vào DB (Xóa các yêu cầu cũ của email này trước)
    await pool.query('DELETE FROM password_resets WHERE email = $1', [email]);
    await pool.query(
      'INSERT INTO password_resets (email, otp_code, expires_at) VALUES ($1, $2, $3)',
      [email, otpCode, expiresAt]
    );

    // 4. Gửi Mail thực tế
    console.log(`\n🔑 [TESTING] MÃ OTP CỦA BẠN LÀ: ${otpCode} (Dành cho email: ${email})\n`);
    
    await mailService.sendOTP(email, otpCode).catch(err => {
      console.error('Mail delivery deferred:', err.message);
      // Không chặn luồng nếu gửi mail lỗi, nhưng log lại
    });
    
    return { email, expires_in: '15 minutes' };
  }

  /**
   * Luồng Quên mật khẩu - Bước 2: Xác thực OTP
   */
  async verifyOTP(email, otpCode) {
    const { rows } = await pool.query(
      'SELECT * FROM password_resets WHERE email = $1 AND otp_code = $2 AND expires_at > CURRENT_TIMESTAMP AND is_verified = FALSE',
      [email, otpCode]
    );

    if (rows.length === 0) throw new Error("Mã OTP không hợp lệ hoặc đã hết hạn");

    await pool.query('UPDATE password_resets SET is_verified = TRUE WHERE id = $1', [rows[0].id]);
    
    return { 
      email: email,
      verified: true,
      verified_at: new Date().toISOString()
    };
  }

  /**
   * Luồng Quên mật khẩu - Bước 3: Đặt lại mật khẩu mới
   */
  async resetPassword(email, newPassword) {
    // 1. Kiểm tra OTP đã được verify chưa
    const { rows } = await pool.query(
      'SELECT * FROM password_resets WHERE email = $1 AND is_verified = TRUE AND expires_at > CURRENT_TIMESTAMP',
      [email]
    );
    if (rows.length === 0) throw new Error("Yêu cầu đặt lại mật khẩu đã hết hạn hoặc chưa được xác thực OTP");

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 2. Hash mật khẩu mới
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // 3. Cập nhật bảng users (link qua members.user_id)
      const { rows: member } = await client.query('SELECT user_id FROM members WHERE email = $1', [email]);
      if (member.length === 0) throw new Error("Không tìm thấy thông tin định danh người dùng");

      await client.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, member[0].user_id]);

      // 4. Xóa yêu cầu reset đã dùng
      await client.query('DELETE FROM password_resets WHERE email = $1', [email]);

      await client.query('COMMIT');
      return {
        email: email,
        reset: true
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Đổi mật khẩu ngay trong App (Yêu cầu mật khẩu cũ)
   */
  async changePassword(readerId, oldPassword, newPassword) {
    const { rows: member } = await pool.query(`
      SELECT m.user_id, u.password 
      FROM members m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = $1
    `, [readerId]);

    if (member.length === 0) throw new Error("Không tìm thấy tài khoản");

    const isMatch = await bcrypt.compare(oldPassword, member[0].password);
    if (!isMatch) throw new Error("Mật khẩu hiện tại không chính xác");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, member[0].user_id]);
    return true;
  }
}

module.exports = new ReaderService();
