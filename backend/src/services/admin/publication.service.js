const { pool } = require('../../config/database');
const AuditService = require('./audit.service');

/**
 * Service xử lý nghiệp vụ Ấn phẩm (Publications)
 * CHUẨN HÓA 100%: Loại bỏ đa ngôn ngữ phức tạp, dùng Vị trí kho (ID) và ghi Log Admin.
 */
class PublicationService {
  /**
   * Tạo mới Ấn phẩm kèm Bản sao
   */
  static async createPublicationWithCopies(pubData, copiesData = [], adminId = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const title = typeof pubData.title === 'string' ? pubData.title : (pubData.title?.vi || pubData.title?.en || "Chưa có tiêu đề");
      let slug = (pubData.slug || title).toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      const { rows: existingSlug } = await client.query('SELECT id FROM books WHERE slug = $1', [slug]);
      if (existingSlug.length > 0) slug = `${slug}-${Math.random().toString(36).substr(2, 5)}`;
      
      const code = pubData.code || `PUB-${Date.now()}`;
      const isbn = pubData.isbn || code; 
      
      // Chuẩn hóa JSON - Chỉ lưu trữ nội dung Tiếng Việt đơn giản để Mobile App dễ đọc
      const titleJson = { vi: title };
      const description = typeof pubData.description === 'string' ? pubData.description : (pubData.description?.vi || "");
      const descriptionJson = { vi: description };

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
      `, [
        code, isbn, JSON.stringify(titleJson), pubData.author || "Nhiều tác giả", slug, 
        pubData.publisher_id || null, pubData.collection_id || null, JSON.stringify(descriptionJson), 
        pubData.thumbnail || pubData.cover_image || null, pubData.publication_year || new Date().getFullYear(), 
        pubData.language || 'vi', pubData.pages || 0, isDigital, pubData.digital_file_url || null, 
        JSON.stringify(pubData.metadata || {}), pubData.status || 'available', pubData.ai_summary || null, 
        pubData.dominant_color || '#4f46e5', pubData.edition || null, pubData.volume || null, 
        pubData.dimensions || null, JSON.stringify(pubData.keywords || []), 
        JSON.stringify(pubData.digital_content || {}), JSON.stringify(pubData.toc || []), 
        pubData.access_policy || 'basic', pubData.cooperation_status || 'cooperating', mediaType
      ]);
      
      const publicationId = rows[0].id;

      // 2. Thêm bản sao (Copies) - Sử dụng storage_location_id chuẩn hóa
      if (copiesData && Array.isArray(copiesData)) {
        for (const [idx, copy] of copiesData.entries()) {
          const finalBarcode = copy.barcode || `BC-${publicationId}-${Date.now()}-${idx}`;
          await client.query(`
            INSERT INTO publication_copies (publication_id, barcode, copy_number, price, status, condition, storage_location_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [publicationId, finalBarcode, 
              copy.copy_number || (idx + 1).toString(), 
              copy.price || 0, 
              copy.status || 'available', 
              copy.condition || 'good', 
              copy.storage_location_id || null
          ]);
        }
      }

      if (pubData.author_ids?.length > 0) {
        for (const authorId of pubData.author_ids) {
          await client.query('INSERT INTO book_authors (book_id, author_id) VALUES ($1, $2)', [publicationId, authorId]);
        }
      }

      // 3. Ghi nhật ký Admin
      await AuditService.log({
        userId: adminId,
        action: 'CREATE',
        module: 'Ấn phẩm',
        entityId: publicationId,
        description: `Đã thêm ấn phẩm mới: ${title}`,
        newData: { title, code, isbn }
      });

      await client.query('COMMIT');
      return { id: publicationId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Chi tiết ấn phẩm (Dùng cho Edit/View)
   */
  static async getPublicationDetail(id) {
    const { rows: pubRows } = await pool.query(`
      SELECT b.*, sl.name as storage_location_name,
             json_build_object('id', p.id, 'name', p.name) as publisher,
             (
               SELECT json_agg(json_build_object('id', a.id, 'name', a.name))
               FROM authors a
               JOIN book_authors ba ON a.id = ba.author_id
               WHERE ba.book_id = b.id
             ) as authors_list
      FROM books b
      LEFT JOIN publishers p ON b.publisher_id = p.id
      LEFT JOIN publication_copies pc ON b.id = pc.publication_id
      LEFT JOIN storage_locations sl ON pc.storage_location_id = sl.id
      WHERE b.id = $1
    `, [id]);

    if (pubRows.length === 0) return null;
    const publication = pubRows[0];

    const { rows: copies } = await pool.query(`
      SELECT pc.*, sl.name as storage_name
      FROM publication_copies pc
      LEFT JOIN storage_locations sl ON pc.storage_location_id = sl.id
      WHERE pc.publication_id = $1
      ORDER BY pc.copy_number ASC
    `, [id]);

    return { publication, copies };
  }

  /**
   * Lấy danh sách (Có phân trang & bộ lọc)
   */
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
               (SELECT count(*) FROM publication_copies pc WHERE pc.publication_id = b.id) as total_copies,
               (SELECT count(*) FROM interaction_logs il WHERE il.object_id = b.id AND il.action_type = 'view') as real_views
        FROM books b 
        LEFT JOIN publishers p ON b.publisher_id = p.id
        ${filter} ORDER BY b.id DESC LIMIT $${idx++} OFFSET $${idx++}
      `;
      values.push(limit, offset);
      const { rows: publications } = await pool.query(dataQuery, values);

      return {
        publications: publications.map(p => ({
          ...p,
          thumbnail: p.cover_image,
          publisher: { name: p.publisher_name },
          copyCount: parseInt(p.total_copies || 0),
          viewCount: parseInt(p.real_views || 0), // Lấy view thật từ log
          trendingScore: parseInt(p.real_views || 0) * 1.5 // Tính điểm trending tạm tính
        })),
        pagination: {
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      console.error("PublicationService.getAll Error:", error.message);
      throw error;
    }
  }

  /**
   * Cập nhật Ấn phẩm
   */
  static async updatePublicationWithCopies(id, pubData, copies = [], adminId = null) {
    const client = await pool.connect();
    try {
      const { rows: oldPub } = await client.query('SELECT * FROM books WHERE id = $1', [id]);
      if (oldPub.length === 0) throw new Error("Publication not found");

      await client.query('BEGIN');
      const mediaType = pubData.media_type || (pubData.is_digital ? 'Digital' : 'Physical');
      const isDigital = (mediaType === 'Digital' || mediaType === 'Hybrid');
      
      const title = typeof pubData.title === 'string' ? pubData.title : (pubData.title?.vi || pubData.title?.en || "Không rõ");

      await client.query(`
        UPDATE books SET 
          title = $1, description = $2, collection_id = $3, publisher_id = $4,
          publication_year = $5, language = $6, pages = $7, is_digital = $8, digital_file_url = $9,
          status = $10, ai_summary = $11, cover_image = $12, edition = $13, volume = $14,
          dimensions = $15, keywords = $16, digital_content = $17, toc = $18, 
          access_policy = $19, cooperation_status = $20, media_type = $21, updated_at = CURRENT_TIMESTAMP
        WHERE id = $22
      `, [
        JSON.stringify({ vi: title }), 
        JSON.stringify({ vi: typeof pubData.description === 'string' ? pubData.description : (pubData.description?.vi || "") }), 
        pubData.collection_id || null, pubData.publisher_id || null, 
        pubData.publication_year || new Date().getFullYear(), pubData.language || 'vi', 
        pubData.pages || 0, isDigital, pubData.digital_file_url || null, 
        pubData.status || 'available', pubData.ai_summary || null, 
        pubData.thumbnail || pubData.cover_image || null, pubData.edition || null, 
        pubData.volume || null, pubData.dimensions || null, 
        JSON.stringify(pubData.keywords || []), JSON.stringify(pubData.digital_content || {}), 
        JSON.stringify(pubData.toc || []), pubData.access_policy || 'basic', 
        pubData.cooperation_status || 'cooperating', mediaType, id
      ]);

      if (pubData.author_ids) {
        await client.query('DELETE FROM book_authors WHERE book_id = $1', [id]);
        for (const authorId of pubData.author_ids) {
          await client.query('INSERT INTO book_authors (book_id, author_id) VALUES ($1, $2)', [id, authorId]);
        }
      }

      if (copies && Array.isArray(copies)) {
        await client.query('DELETE FROM publication_copies WHERE publication_id = $1', [id]);
        for (const [idx, copy] of copies.entries()) {
          const finalBarcode = copy.barcode || `BC-${id}-${Date.now()}-${idx}`;
          await client.query(`
            INSERT INTO publication_copies (publication_id, barcode, copy_number, price, status, condition, storage_location_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [id, finalBarcode, copy.copy_number || (idx + 1).toString(), copy.price || 0, copy.status || 'available', copy.condition || 'good', copy.storage_location_id || null]);
        }
      }

      await AuditService.log({
        userId: adminId,
        action: 'UPDATE',
        module: 'Ấn phẩm',
        entityId: id,
        description: `Đã cập nhật thông tin ấn phẩm: ${title}`,
        oldData: oldPub[0],
        newData: pubData
      });

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Xóa Ấn phẩm
   */
  static async deletePublication(id, adminId = null) {
    const client = await pool.connect();
    try {
      const { rows: oldPub } = await client.query('SELECT title FROM books WHERE id = $1', [id]);
      if (oldPub.length === 0) return false;

      await client.query('BEGIN');
      await client.query('DELETE FROM book_loans WHERE book_id = $1', [id]);
      await client.query('DELETE FROM publication_copies WHERE publication_id = $1', [id]);
      await client.query('DELETE FROM book_authors WHERE book_id = $1', [id]);
      const { rowCount } = await client.query('DELETE FROM books WHERE id = $1', [id]);
      
      if (rowCount > 0) {
        await AuditService.log({
          userId: adminId,
          action: 'DELETE',
          module: 'Ấn phẩm',
          entityId: id,
          description: `Đã xóa ấn phẩm: ${JSON.stringify(oldPub[0].title)}`,
          oldData: oldPub[0]
        });
      }

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
      console.error("PublicationService.getStats Error:", error.message);
      throw error;
    }
  }
}

module.exports = PublicationService;
