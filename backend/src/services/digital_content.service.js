const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/database');

class DigitalContentService {
  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'publications');
    this.ensureDirectory();
  }

  async ensureDirectory() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (err) {
      console.error("Lỗi tạo thư mục upload:", err);
    }
  }

  /**
   * Truy xuất nội dung kỹ thuật số của một ấn phẩm
   */
  async getContent(publicationId) {
    const result = await pool.query(
      'SELECT is_digital, digital_file_url, metadata FROM books WHERE id = $1',
      [publicationId]
    );

    if (result.rows.length === 0) return null;
    const book = result.rows[0];

    // Trả về metadata và url
    return {
      isDigital: book.is_digital,
      url: book.digital_file_url,
      metadata: book.metadata || {}
    };
  }

  /**
   * Cập nhật nội dung số
   * @param {string} id 
   * @param {object} data { type: 'pdf' | 'text', value: string | file_info }
   */
  async updateContent(id, { type, value }) {
    let updateQuery = '';
    let params = [];

    if (type === 'pdf') {
      updateQuery = 'UPDATE books SET is_digital = true, digital_file_url = $1 WHERE id = $2';
      params = [value, id];
    } else if (type === 'text') {
      // Lưu vào metadata hoặc một cột content riêng (giả sử dùng metadata cho linh hoạt)
      updateQuery = "UPDATE books SET is_digital = true, metadata = jsonb_set(COALESCE(metadata, '{}'), '{fullText}', $1) WHERE id = $2";
      params = [JSON.stringify(value), id];
    }

    return pool.query(updateQuery, params);
  }
}

module.exports = new DigitalContentService();
