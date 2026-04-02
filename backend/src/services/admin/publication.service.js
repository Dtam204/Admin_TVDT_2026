const { pool } = require('../../config/database');

/**
 * Service xử lý nghiệp vụ Ấn phẩm (Publications)
 * Khôi phục đầy đủ các trường dữ liệu để tương thích với Frontend
 */
class PublicationService {
  static async createPublicationWithCopies(pubData, copiesData = []) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const title = pubData.title || "Chưa có tiêu đề";
      let slug = (pubData.slug || title).toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const { rows: existingSlug } = await client.query('SELECT id FROM books WHERE slug = $1', [slug]);
      if (existingSlug.length > 0) slug = `${slug}-${Math.random().toString(36).substr(2, 5)}`;
      const code = pubData.code || `PUB-${Date.now()}`;
      const isbn = pubData.isbdContent || pubData.isbn || code; 
      const titleJson = typeof title === 'object' ? title : { vi: title };
      const descriptionJson = typeof pubData.description === 'object' ? pubData.description : { vi: pubData.description || "" };

      const mediaType = pubData.media_type || (pubData.is_digital ? 'Digital' : 'Physical');
      const isDigital = (mediaType === 'Digital' || mediaType === 'Hybrid');

      const { rows } = await client.query(`
        INSERT INTO books (
          code, isbn, title, author, slug, publisher_id, collection_id, 
          description, cover_image, publication_year, language, pages, 
          is_digital, digital_file_url, metadata, status, ai_summary, dominant_color,
          edition, volume, dimensions, keywords, digital_content, toc, access_policy,
          cooperation_status, media_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27) 
        RETURNING id
      `, [code, isbn, JSON.stringify(titleJson), pubData.author || "Nhiều tác giả", slug, pubData.publisher_id || null, pubData.collection_id || null, JSON.stringify(descriptionJson), pubData.thumbnail || pubData.cover_image || null, pubData.publicationYear || pubData.publication_year || new Date().getFullYear(), pubData.language || 'vi', pubData.pageCount || pubData.pages || 0, isDigital, pubData.digital_file_url || null, JSON.stringify(pubData.metadata || {}), pubData.status || 'available', pubData.aiSummary || pubData.ai_summary || null, pubData.dominantColor || pubData.dominant_color || '#4f46e5', pubData.edition || null, pubData.volume || null, pubData.dimensions || null, JSON.stringify(pubData.keywords || []), JSON.stringify(pubData.digitalContent || pubData.digital_content || {}), JSON.stringify(pubData.toc || []), pubData.access_policy || 'public', pubData.cooperation_status || 'cooperating', mediaType]);
      
      const publicationId = rows[0].id;

      if (pubData.author_ids?.length > 0) {
        for (const authorId of pubData.author_ids) {
          await client.query('INSERT INTO book_authors (book_id, author_id) VALUES ($1, $2)', [publicationId, authorId]);
        }
      }

      await client.query('COMMIT');
      return { id: publicationId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getPublicationDetail(id) {
    // Lấy thông tin ấn phẩm đầy đủ (bao gồm publisher, authors)
    const { rows: pubRows } = await pool.query(`
      SELECT b.*,
             json_build_object('id', p.id, 'name', p.name) as publisher,
             (
               SELECT json_agg(json_build_object('id', a.id, 'name', a.name))
               FROM authors a
               JOIN book_authors ba ON a.id = ba.author_id
               WHERE ba.book_id = b.id
             ) as authors_list
      FROM books b
      LEFT JOIN publishers p ON b.publisher_id = p.id
      WHERE b.id = $1
    `, [id]);

    if (pubRows.length === 0) return null;
    const publication = pubRows[0];

    // Lấy danh sách bản sao (quan trọng cho LoanForm và trang quản lý)
    const { rows: copies } = await pool.query(`
      SELECT pc.*,
             s.name as storage_name,
             s.description as storage_location
      FROM publication_copies pc
      LEFT JOIN storages s ON pc.storage_id = s.id
      WHERE pc.publication_id = $1
      ORDER BY pc.copy_number ASC
    `, [id]);

    return { publication, copies };
  }


  static async getAll(params = {}) {
    try {
      const { page = 1, limit = 10, search = '', collection_id, status, cooperation_status, media_type } = params;
      const offset = (page - 1) * limit;
      
      let filter = ' WHERE 1=1';
      const values = [];
      let idx = 1;

      if (media_type && media_type !== 'all') { filter += ` AND b.media_type = $${idx++}`; values.push(media_type); }
      if (status && status !== 'all') { filter += ` AND b.status = $${idx++}`; values.push(status); }
      if (cooperation_status && cooperation_status !== 'all') { filter += ` AND b.cooperation_status = $${idx++}`; values.push(cooperation_status); }
      if (collection_id) { filter += ` AND b.collection_id = $${idx++}`; values.push(collection_id); }
      if (search) { filter += ` AND (b.title::text ILIKE $${idx} OR b.author ILIKE $${idx} OR b.code ILIKE $${idx})`; values.push(`%${search}%`); idx++; }

      const countRes = await pool.query(`SELECT COUNT(*) FROM books b ${filter}`, values);
      const totalItems = parseInt(countRes.rows[0].count);

      const dataQuery = `
        SELECT b.*, p.name as publisher_name,
               (SELECT count(*) FROM publication_copies pc WHERE pc.publication_id = b.id) as total_copies
        FROM books b 
        LEFT JOIN publishers p ON b.publisher_id = p.id
        ${filter} ORDER BY b.id DESC LIMIT $${idx++} OFFSET $${idx++}
      `;
      values.push(limit, offset);
      const { rows: publications } = await pool.query(dataQuery, values);

      return {
        publications: publications.map(p => ({
          ...p,
          thumbnail: p.cover_image, // Khôi phục cho Frontend
          publisher: { name: p.publisher_name }, // Khôi phục cấu trúc Object
          copyCount: parseInt(p.total_copies || 0),
          viewCount: 0,
          trendingScore: 0
        })),
        pagination: {
          totalItems,
          totalCount: totalItems, 
          totalPages: Math.ceil(totalItems / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      console.error("SQL Error in getAll:", error.message);
      throw error;
    }
  }

  static async updatePublicationWithCopies(id, pubData, copies = []) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const mediaType = pubData.media_type || (pubData.is_digital ? 'Digital' : 'Physical');
      const isDigital = (mediaType === 'Digital' || mediaType === 'Hybrid');

      // 1. Cập nhật thông tin sách
      await client.query(`
        UPDATE books SET title = $1, description = $2, collection_id = $3, publisher_id = $4,
          publication_year = $5, language = $6, pages = $7, is_digital = $8, digital_file_url = $9,
          status = $10, ai_summary = $11, cover_image = $12, edition = $13, volume = $14,
          dimensions = $15, keywords = $16, digital_content = $17, toc = $18, 
          access_policy = $19, cooperation_status = $20, media_type = $21
        WHERE id = $22
      `, [JSON.stringify(typeof pubData.title === 'object' ? pubData.title : { vi: pubData.title }), JSON.stringify(typeof pubData.description === 'object' ? pubData.description : { vi: pubData.description }), pubData.collection_id || null, pubData.publisher_id || null, pubData.publicationYear || pubData.publication_year || new Date().getFullYear(), pubData.language || 'vi', pubData.pageCount || pubData.pages || 0, isDigital, pubData.digital_file_url || null, pubData.status || 'available', pubData.aiSummary || null, pubData.thumbnail || pubData.cover_image || null, pubData.edition || null, pubData.volume || null, pubData.dimensions || null, JSON.stringify(pubData.keywords || []), JSON.stringify(pubData.digitalContent || {}), JSON.stringify(pubData.toc || []), pubData.access_policy || 'public', pubData.cooperation_status || 'cooperating', mediaType, id]);

      // 2. Cập nhật Tác giả
      if (pubData.author_ids) {
        await client.query('DELETE FROM book_authors WHERE book_id = $1', [id]);
        for (const authorId of pubData.author_ids) {
          await client.query('INSERT INTO book_authors (book_id, author_id) VALUES ($1, $2)', [id, authorId]);
        }
      }

      // 3. QUAN TRỌNG: Cập nhật Bản sao (Copies)
      if (copies && Array.isArray(copies)) {
        await client.query('DELETE FROM publication_copies WHERE publication_id = $1', [id]);
        
        // Helper kiểm tra UUID hợp lệ
        const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

        for (const [idx, copy] of copies.entries()) {
          const finalBarcode = copy.barcode || `BC-${id}-${Date.now()}-${idx}`;
          // Nếu storage_id không phải UUID hợp lệ, để null để tránh lỗi SQL
          const finalStorageId = isValidUUID(copy.storage_id) ? copy.storage_id : null;
          
          await client.query(`
            INSERT INTO publication_copies (publication_id, barcode, storage_id, copy_number, price, status)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [id, finalBarcode, finalStorageId, copy.copy_number || (idx + 1).toString(), copy.price || 0, copy.status || 'available']);
        }
      }

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async deletePublication(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Xóa theo thứ tự đúng để tránh lỗi Foreign Key
      await client.query('DELETE FROM book_loans WHERE book_id = $1', [id]);
      await client.query('DELETE FROM publication_copies WHERE publication_id = $1', [id]);
      await client.query('DELETE FROM book_authors WHERE book_id = $1', [id]);
      const { rowCount } = await client.query('DELETE FROM books WHERE id = $1', [id]);
      await client.query('COMMIT');
      return rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getStats() {
    try {
      const { rows: pubCountRes } = await pool.query('SELECT COUNT(*) as total FROM books');
      const { rows: copyCountRes } = await pool.query('SELECT COUNT(*) as total FROM publication_copies');
      const { rows: digitalCountRes } = await pool.query("SELECT COUNT(*) as total FROM books WHERE media_type = 'Digital' OR is_digital = true");
      
      return {
        totalPublications: parseInt(pubCountRes[0].total || 0),
        totalCopies: parseInt(copyCountRes[0].total || 0),
        totalDigital: parseInt(digitalCountRes[0].total || 0)
      };
    } catch (error) {
      console.error("Error in getStats:", error.message);
      throw error;
    }
  }

}

module.exports = PublicationService;
