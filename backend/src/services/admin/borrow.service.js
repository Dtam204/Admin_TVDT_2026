const { pool } = require('../../config/database');
const ExcelJS = require('exceljs');
const { generateTransactionId } = require('../../utils/id_helper');

/**
 * BorrowService - Xử lý nghiệp vụ Mượn/Trả sách Vật lý
 * (Tài liệu số truy cập trực tiếp từ app — không qua quầy thủ thư)
 */
class BorrowService {
  /**
   * Đăng ký mượn sách — CHỈ cho bản sao Vật lý
   */
  async registerBorrow(data) {
    const { readerId, copyId, barcode, notes, directBorrow = false } = data;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Kiểm tra Thành viên & Gói Hội Viên của họ
      const { rows: members } = await client.query(`
        SELECT m.*, mp.tier_code, mp.max_books_borrowed, mp.late_fee_per_day
        FROM members m
        LEFT JOIN membership_plans mp ON m.membership_plan_id = mp.id
        WHERE m.id = $1
      `, [readerId]);
      if (members.length === 0) throw new Error('Không tìm thấy thành viên');
      const member = members[0];
      
      // A. Kiểm tra hết hạn thẻ
      if (member.membership_expires && new Date(member.membership_expires) < new Date()) {
        throw new Error(`Khóa Mượn Sách: Thẻ Hội Viên của Bạn Đọc này đã quá hạn vào ngày ${new Date(member.membership_expires).toLocaleDateString('vi-VN')}. Yêu cầu Đóng phí / Gia hạn thẻ để tiếp tục mượn sách.`);
      }

      // B. Kiểm tra Hạn mức mượn (Quota)
      const { rows: currentLoansCount } = await client.query(
        "SELECT COUNT(*) as count FROM book_loans WHERE member_id = $1 AND status = 'borrowing'",
        [readerId]
      );
      const activeCount = parseInt(currentLoansCount[0].count);
      const limit = member.max_books_borrowed || 3; // Mặc định 3 nếu gói không định nghĩa
      
      if (activeCount >= limit) {
        throw new Error(`Từ chối mượn: Bạn đọc đã mượn ${activeCount}/${limit} cuốn (đạt giới hạn tối đa của Gói ${member.tier_code || 'Basic'}). Vui lòng trả sách cũ trước khi mượn mới.`);
      }

      // C. Kiểm tra Sách Quá Hạn chưa trả
      const { rows: overdueLoans } = await client.query(
        "SELECT id FROM book_loans WHERE member_id = $1 AND status = 'borrowing' AND due_date < CURRENT_TIMESTAMP",
        [readerId]
      );
      if (overdueLoans.length > 0) {
        throw new Error(`Khóa hệ thống: Bạn đọc đang giữ ${overdueLoans.length} cuốn sách QUÁ HẠN chưa trả. Yêu cầu xử lý trả sách và đóng phí phạt trước khi mượn mới.`);
      }

      // D. Kiểm tra Nợ phí phạt (Phễu Tài chính)
      const { rows: pendingFines } = await client.query(
        "SELECT SUM(amount) as total FROM payments WHERE member_id = $1 AND status = 'pending' AND type = 'fee_penalty'",
        [readerId]
      );
      if (pendingFines[0].total && parseFloat(pendingFines[0].total) > 0) {
        throw new Error(`Khóa tài chính: Bạn đọc đang có khoản nợ phí phạt chưa thanh toán (${parseFloat(pendingFines[0].total).toLocaleString('vi-VN')}đ). Yêu cầu nộp phạt tại quầy trước khi tiếp tục.`);
      }

      // 2. Tìm Bản sao — qua copyId hoặc barcode (hỗ trợ máy quét tại quầy)
      let copyQuery = `
        SELECT c.*,
               b.title->>'vi' as book_title,
               b.author,
               b.media_type,
               b.cooperation_status,
               b.access_policy
        FROM publication_copies c
        JOIN books b ON c.publication_id = b.id
        WHERE `;
      const copyParams = [];

      if (copyId && String(copyId) !== '') {
        copyQuery += `c.id = $1`;
        copyParams.push(copyId);
      } else if (barcode && String(barcode) !== '') {
        copyQuery += `c.barcode = $1`;
        copyParams.push(barcode);
      } else {
        throw new Error('Cần cung cấp ID bản sao hoặc mã barcode để tạo phiếu mượn');
      }

      const { rows: copies } = await client.query(copyQuery, copyParams);
      if (copies.length === 0) throw new Error('Không tìm thấy bản sao. Kiểm tra lại barcode.');
      const copy = copies[0];

      // 3. Kiểm tra nghiệp vụ
      if (copy.cooperation_status === 'ceased_cooperation') {
        throw new Error('Ấn phẩm đang Ngưng hợp tác — không thể tạo phiếu mượn mới.');
      }

      const tierRank = { basic: 1, premium: 2, vip: 3 };
      const reqRank = tierRank[copy.access_policy?.toLowerCase() || 'basic'] || 1;
      
      const memberTier = (member.tier_code || 'basic').toLowerCase();
      const userRank = tierRank[memberTier] || 1;

      if (userRank < reqRank) {
         throw new Error(`Đặc quyền không đủ: Ấn phẩm yêu cầu thẻ hạng [${copy.access_policy?.toUpperCase() || 'BASIC'}]. Gói hiện tại của Bạn đọc là [${memberTier.toUpperCase()}]. Vui lòng nâng cấp thẻ.`);
      }

      if (copy.status !== 'available' && copy.status !== 'tại kho') {
        throw new Error(`Bản sao đang ở trạng thái "${copy.status}" — không thể mượn lúc này.`);
      }

      // 4. Tính ngày hạn trả
      const status = directBorrow ? 'borrowing' : 'pending';
      let loanDate = null, dueDate = null, approvedAt = null;
      if (directBorrow) {
        loanDate = new Date();
        dueDate  = new Date();
        dueDate.setDate(loanDate.getDate() + 14);
        approvedAt = new Date();
        await client.query(
          'UPDATE publication_copies SET status = $1 WHERE id = $2',
          ['borrowed', copy.id]
        );
      }

      // 5. Tạo phiếu mượn
      const { rows: loan } = await client.query(`
        INSERT INTO book_loans (
          member_id, copy_id, book_id, ma_dang_ky_ca_biet,
          status, notes, registration_date, loan_date, due_date, approved_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7, $8, $9)
        RETURNING *
      `, [readerId, copy.id, copy.publication_id, copy.barcode,
          status, notes, loanDate, dueDate, approvedAt]);

      await client.query('COMMIT');

      return {
        id:              loan[0].id,
        readerId:        member.id,
        readerName:      member.full_name,
        cardNumber:      member.card_number || member.id.toString(),
        copyId:          copy.id,
        barcode:         copy.barcode,
        publicationName: copy.book_title,
        author:          copy.author,
        mediaType:       copy.media_type,
        registerDate:    loan[0].registration_date,
        borrowDate:      loan[0].loan_date,
        dueDate:         loan[0].due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status:          loan[0].status,
        statusName:      loan[0].status === 'borrowing' ? 'Đang mượn' : 'Chờ duyệt'
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Duyệt yêu cầu mượn (Chuyển sang trạng thái đang mượn)
   */
  async approveBorrow(requestId) {
     const client = await pool.connect();
     try {
       await client.query('BEGIN');
       
       // 1. Lấy thông tin phiếu mượn và chi tiết liên quan
       const { rows: loans } = await client.query(`
         SELECT bl.*, m.full_name, m.email, m.phone, m.card_number,
                b.title->>'vi' as book_title, b.author as book_author
         FROM book_loans bl
         JOIN members m ON bl.member_id = m.id
         JOIN books b ON bl.book_id = b.id
         WHERE bl.id = $1
       `, [requestId]);
       
       if (loans.length === 0) throw new Error('Phiếu mượn không tồn tại');
       const loan = loans[0];
       
       if (loan.status !== 'pending') throw new Error('Phiếu mượn này đã được xử lý hoặc không ở trạng thái chờ');
       
       // 2. Cập nhật trạng thái bản sao sang 'borrowed'
       await client.query('UPDATE publication_copies SET status = $1 WHERE id = $2', ['borrowed', loan.copy_id]);
       
       // 3. Cập nhật ngày mượn và hạn trả
       const loanDate = new Date();
       const dueDate = new Date();
       dueDate.setDate(loanDate.getDate() + 14);
       
       const { rows: updatedLoanResult } = await client.query(`
         UPDATE book_loans 
         SET status = 'borrowing', 
             approved_at = CURRENT_TIMESTAMP, 
             loan_date = $2, 
             due_date = $3
         WHERE id = $1
         RETURNING *
       `, [requestId, loanDate, dueDate]);
       
       const updatedLoan = updatedLoanResult[0];

       await client.query('COMMIT');
       
       return {
         id: updatedLoan.id,
         loanId: updatedLoan.id,
         readerId: loan.member_id,
         readerName: loan.full_name,
         cardNumber: loan.card_number,
         email: loan.email,
         phone: loan.phone,
         dueDate: dueDate,
         publicationId: loan.book_id,
         publicationName: loan.book_title,
         author: loan.book_author,
         barcode: loan.ma_dang_ky_ca_biet,
         registerDate: loan.registration_date,
         borrowDate: updatedLoan.loan_date,
         returnDate: null,
         lateFee: updatedLoan.late_fee || 0,
         status: 'borrowing',
         statusName: 'Đang mượn',
         isOverdue: false,
         copyId: loan.copy_id,
         notes: updatedLoan.notes
       };
     } catch (e) {
       await client.query('ROLLBACK');
       throw e;
     } finally {
       client.release();
     }
  }

  /**
   * Gia hạn mượn sách
   */
  async extendBorrow(loanId, days = 7, newDueDate = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { rows: loans } = await client.query('SELECT * FROM book_loans WHERE id = $1', [loanId]);
      if (loans.length === 0) throw new Error('Không tìm thấy phiếu mượn');
      const loan = loans[0];
      
      if (loan.status !== 'borrowing' && loan.status !== 'overdue') {
        throw new Error('Chỉ có thể gia hạn sách đang mượn hoặc quá hạn');
      }

      let finalDueDate;
      if (newDueDate) {
        finalDueDate = new Date(newDueDate);
      } else {
        finalDueDate = new Date(loan.due_date);
        finalDueDate.setDate(finalDueDate.getDate() + (days || 7));
      }

      const { rows: updated } = await client.query(`
        UPDATE book_loans 
        SET due_date = $1, status = 'borrowing' 
        WHERE id = $2 
        RETURNING *
      `, [finalDueDate, loanId]);

      await client.query('COMMIT');
      return updated[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Trả sách và tính phí phạt + Xử lý Đặt chỗ (Reservation)
   */
  async returnBook(loanId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { rows: loans } = await client.query('SELECT * FROM book_loans WHERE id = $1', [loanId]);
      if (loans.length === 0) throw new Error('Không tìm thấy phiếu mượn');
      const loan = loans[0];
      
      if (loan.status === 'returned') throw new Error('Sách này đã được trả trước đó');

      const returnDate = new Date();
      const dueDate = new Date(loan.due_date);
      
      // Tính phí phạt động dựa trên Gói Hội Viên
      const { rows: memberPlans } = await client.query(`
        SELECT mp.late_fee_per_day 
        FROM members m
        JOIN membership_plans mp ON m.membership_plan_id = mp.id
        WHERE m.id = $1
      `, [loan.member_id]);
      
      const feePerDay = memberPlans[0]?.late_fee_per_day || 5000; // Mặc định 5k/ngày nếu không định nghĩa
      
      let lateFee = 0;
      if (returnDate > dueDate) {
        const diffTime = Math.abs(returnDate.getTime() - dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        lateFee = diffDays * feePerDay;
      }

      // 1. Kiểm tra hàng đợi ĐẶT CHỖ cho đầu sách này
      const { rows: reservations } = await client.query(`
        SELECT * FROM book_reservations 
        WHERE book_id = $1 AND status = 'pending' 
        ORDER BY requested_at ASC LIMIT 1
      `, [loan.book_id]);

      let nextCopyStatus = 'available';
      if (reservations.length > 0) {
        const nextInLine = reservations[0];
        nextCopyStatus = 'reserved';
        
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);
        
        await client.query(`
          UPDATE book_reservations 
          SET status = 'notified', notified_at = CURRENT_TIMESTAMP, expires_at = $1 
          WHERE id = $2
        `, [expiresAt, nextInLine.id]);
        
        console.log(`[Reservation] Sách ${loan.book_id} đã được giữ cho member ${nextInLine.member_id}`);
      }

      // 2. Cập nhật trạng thái bản sao
      await client.query('UPDATE publication_copies SET status = $1 WHERE id = $2', [nextCopyStatus, loan.copy_id]);

      // 3. Cập nhật phiếu mượn
      const { rows: updated } = await client.query(`
        UPDATE book_loans 
        SET return_date = $1, late_fee = $2, status = 'returned' 
        WHERE id = $3 
        RETURNING *
      `, [returnDate, lateFee, loanId]);

      // 4. Nếu có phí phạt, tự động tạo Giao dịch Phạt (Transaction)
      if (lateFee > 0) {
        await client.query(`
          INSERT INTO payments (
            member_id, amount, type, status, notes, transaction_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        `, [
          loan.member_id, 
          lateFee, 
          'fee_penalty', 
          'pending', 
          `Phí phạt trả sách trễ hạn (Phiếu #${loanId}): ${loan.book_title || 'Ấn phẩm'}`,
          generateTransactionId('PEN')
        ]);
        
        // Đồng thời cập nhật tổng nợ/phạt tích lũy của Member (thuộc bảng members nếu có cột đó, hoặc tính toán sau)
        // Hiện tại chỉ cần log vào bảng payments là đủ để Admin theo dõi.
      }

      await client.query('COMMIT');
      return { 
        ...updated[0], 
        diffDays: lateFee > 0 ? Math.ceil((returnDate.getTime() - dueDate.getTime())/(1000*60*60*24)) : 0,
        hasReservation: reservations.length > 0
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Tạo lượt đặt chỗ mới
   */
  async createReservation(memberId, bookId, notes) {
    const { rows: result } = await pool.query(`
      INSERT INTO book_reservations (member_id, book_id, notes, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
    `, [memberId, bookId, notes]);
    return result[0];
  }

  /**
   * Lấy danh sách đặt chỗ
   */
  async getReservations(params = {}) {
    const { status, bookId, memberId } = params;
    let query = `
      SELECT r.*, 
             m.full_name as member_name, 
             b.title->>'vi' as book_title
      FROM book_reservations r
      JOIN members m ON r.member_id = m.id
      JOIN books b ON r.book_id = b.id
      WHERE 1=1
    `;
    const queryParams = [];
    let idx = 1;

    if (status) { query += ` AND r.status = $${idx++}`; queryParams.push(status); }
    if (bookId) { query += ` AND r.book_id = $${idx++}`; queryParams.push(bookId); }
    if (memberId) { query += ` AND r.member_id = $${idx++}`; queryParams.push(memberId); }

    query += ` ORDER BY r.requested_at ASC`;
    const { rows } = await pool.query(query, queryParams);
    return rows;
  }

  /**
   * Lấy danh sách phiếu mượn với đầy đủ thông tin và bộ lọc
   */
  async getAllLoans(params = {}) {
    const { status, search, page = 1, limit = 20, bookId, memberId } = params;
    const offset = (page - 1) * limit;
    
    // Tự động cập nhật các phiếu đã quá hạn - "Lazy update"
    await pool.query(`
      UPDATE book_loans 
      SET status = 'overdue' 
      WHERE status = 'borrowing' AND due_date < CURRENT_TIMESTAMP
    `);

    let queryConditions = ' WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (status && status !== 'all' && status !== 'reservations') {
      queryConditions += ` AND bl.status = $${paramIndex++}`;
      queryParams.push(status);
    }

    if (bookId) {
      queryConditions += ` AND bl.book_id = $${paramIndex++}`;
      queryParams.push(bookId);
    }

    if (memberId) {
      queryConditions += ` AND bl.member_id = $${paramIndex++}`;
      queryParams.push(memberId);
    }

    if (search) {
      queryConditions += ` AND (m.full_name ILIKE $${paramIndex} OR b.title->>'vi' ILIKE $${paramIndex} OR c.barcode ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }


    const countSql = `
      SELECT COUNT(*) 
      FROM book_loans bl
      JOIN members m ON bl.member_id = m.id
      JOIN books b ON bl.book_id = b.id
      LEFT JOIN publication_copies c ON bl.copy_id = c.id
      ${queryConditions}
    `;
    const { rows: countResult } = await pool.query(countSql, queryParams);
    const totalItems = parseInt(countResult[0].count);

    const dataSql = `
      SELECT bl.*, 
             m.full_name as member_name, m.card_number as member_card,
             mp.tier_code as member_tier,
             b.title->>'vi' as book_title,
             b.media_type,
             b.cover_image,
             b.access_policy,
             c.barcode as copy_barcode
      FROM book_loans bl
      JOIN members m ON bl.member_id = m.id
      LEFT JOIN membership_plans mp ON m.membership_plan_id = mp.id
      JOIN books b ON bl.book_id = b.id
      LEFT JOIN publication_copies c ON bl.copy_id = c.id
      ${queryConditions}
      ORDER BY bl.created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    queryParams.push(limit, offset);
    const { rows: data } = await pool.query(dataSql, queryParams);

    return {
      data,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    };
  }

  /**
   * Xuất danh sách phiếu mượn ra file Excel
   */
  async exportLoansExcel(params = {}) {
    const { status, search } = params;
    
    await pool.query(`
      UPDATE book_loans 
      SET status = 'overdue' 
      WHERE status = 'borrowing' AND due_date < CURRENT_TIMESTAMP
    `);

    let queryConditions = ' WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (status && status !== 'all' && status !== 'reservations') {
      queryConditions += ` AND bl.status = $${paramIndex++}`;
      queryParams.push(status);
    }

    if (search) {
      queryConditions += ` AND (m.full_name ILIKE $${paramIndex} OR b.title->>'vi' ILIKE $${paramIndex} OR c.barcode ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const dataSql = `
      SELECT bl.*, 
             m.full_name as member_name, m.card_number as member_card,
             b.title->>'vi' as book_title,
             c.barcode as copy_barcode
      FROM book_loans bl
      JOIN members m ON bl.member_id = m.id
      JOIN books b ON bl.book_id = b.id
      LEFT JOIN publication_copies c ON bl.copy_id = c.id
      ${queryConditions}
      ORDER BY bl.created_at DESC 
    `;
    
    const { rows: data } = await pool.query(dataSql, queryParams);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Admin System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Danh Sách Mượn Trả');

    sheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'ID Phiếu', key: 'id', width: 10 },
      { header: 'Người mượn', key: 'member_name', width: 25 },
      { header: 'Mã thẻ', key: 'member_card', width: 15 },
      { header: 'Tên Ấn phẩm', key: 'book_title', width: 45 },
      { header: 'Mã vạch (Barcode)', key: 'copy_barcode', width: 20 },
      { header: 'Ngày mượn', key: 'loan_date', width: 20 },
      { header: 'Hạn trả', key: 'due_date', width: 20 },
      { header: 'Ngày trả thực tế', key: 'return_date', width: 20 },
      { header: 'Trạng thái', key: 'status_text', width: 15 },
      { header: 'Phí phạt (VNĐ)', key: 'late_fee', width: 15 },
      { header: 'Ghi chú', key: 'notes', width: 30 }
    ];

    const statusMap = {
      'pending': 'Chờ duyệt',
      'borrowing': 'Đang mượn',
      'overdue': 'Quá hạn',
      'returned': 'Đã trả',
      'rejected': 'Từ chối'
    };

    data.forEach((item, index) => {
      sheet.addRow({
        stt: index + 1,
        id: item.id,
        member_name: item.member_name,
        member_card: item.member_card,
        book_title: item.book_title,
        copy_barcode: item.copy_barcode || 'N/A',
        loan_date: item.loan_date ? new Date(item.loan_date).toLocaleDateString('vi-VN') : 'Chưa lấy',
        due_date: item.due_date ? new Date(item.due_date).toLocaleDateString('vi-VN') : '',
        return_date: item.return_date ? new Date(item.return_date).toLocaleDateString('vi-VN') : '-',
        status_text: statusMap[item.status] || item.status,
        late_fee: item.late_fee || 0,
        notes: item.notes || ''
      });
    });

    // Định dạng tiêu đề
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' } // Indigo 600
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Thêm border cho toàn bộ dữ liệu
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          if (cell.col === 1 || cell.col === 2 || cell.col === 10 || cell.col === 11) {
            cell.alignment = { horizontal: 'center' };
          }
        });
      }
    });

    return await workbook.xlsx.writeBuffer();
  }
}

module.exports = new BorrowService();
