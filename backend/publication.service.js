const { pool } = require('../../config/database');

/**
 * Service xử lý nghiệp vụ Ấn phẩm (Publications)
 */
class PublicationService {
  /**
   * Tạo Ấn phẩm mới cùng với danh sách Bản sao (Transaction)
   */
  static async createPublicationWithCopies(pubData, copiesData = []) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const pubQueries = `
        INSERT INTO books (
          code, title, author, slug, publisher_id, collection_id, 
          description, cover_image, publication_year, language, pages, 
          is_digital, digital_file_url, isbd_content, ai_summary, 
          dominant_color, metadata, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        ) RETURNING id
      `;
      const slug = (pubData.title.en || pubData.title.vi || pubData.title || "no-title")
        .toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const pubValues = [
        pubData.code, pubData.title, pubData.author, slug, 
        pubData.publisher_id, pubData.collection_id, pubData.description,
        pubData.thumbnail || pubData.cover_image, pubData.publicationYear || pubData.publication_year, 
        pubData.language, pubData.pageCount || pubData.pages,
        pubData.is_digital || false, pubData.digital_file_url, pubData.isbdContent,
        pubData.aiSummary, pubData.dominantColor, pubData.metadata || {},
        pubData.status || 'available'
      ];

      const { rows } = await client.query(pubQueries, pubValues);
      const publicationId = rows[0].id;

      if (copiesData && copiesData.length > 0) {
        for (const copy of copiesData) {
          await client.query(`
            INSERT INTO publication_copies (publication_id, storage_id, barcode, copy_number, price, status)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [publicationId, copy.storage_id, copy.barcode, copy.copy_number, copy.price, copy.status || 'available']);
        }
      }
      await client.query('COMMIT');
      return { id: publicationId, count: copiesData.length };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getPublicationDetail(id) {
    const { rows: pubRows } = await pool.query("SELECT * FROM books WHERE id = $1", [id]);
    if (pubRows.length === 0) return null;
    const { rows: copiesRows } = await pool.query("SELECT * FROM publication_copies WHERE publication_id = $1", [id]);
    return { ...pubRows[0], copies: copiesRows };
  }

  static async updatePublicationWithCopies(id, pubData, copiesData = []) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
        UPDATE books SET 
          code = $1, title = $2, author = $3, publisher_id = $4, 
          collection_id = $5, description = $6, cover_image = $7, 
          publication_year = $8, language = $9, pages = $10, 
          is_digital = $11, digital_file_url = $12, updated_at = NOW()
        WHERE id = $13
      `, [pubData.code, pubData.title, pubData.author, pubData.publisher_id, pubData.collection_id, 
          pubData.description, pubData.thumbnail || pubData.cover_image, 
          pubData.publicationYear || pubData.publication_year, pubData.language, 
          pubData.pageCount || pubData.pages, pubData.is_digital, pubData.digital_file_url, id]);

      await client.query('DELETE FROM publication_copies WHERE publication_id = $1', [id]);
      if (copiesData && copiesData.length > 0) {
        for (const copy of copiesData) {
          await client.query(`
            INSERT INTO publication_copies (publication_id, storage_id, barcode, copy_number, price, status)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [id, copy.storage_id, copy.barcode, copy.copy_number, copy.price, copy.status || 'available']);
        }
      }
      await client.query('COMMIT');
      return { id, success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async deletePublication(id) {
    await pool.query('DELETE FROM publication_copies WHERE publication_id = $1', [id]);
    const res = await pool.query('DELETE FROM books WHERE id = $1', [id]);
    return res.rowCount > 0;
  }
}

module.exports = PublicationService;
