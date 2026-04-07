const { pool } = require('../../config/database');
const AuditService = require('./audit.service');

/**
 * Service xử lý nghiệp vụ Ấn phẩm (Publications)
 * CHUẨN HÓA 100%: Dữ liệu thực từ Database, cấu trúc phẳng chuyên nghiệp.
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
   * Helper: Giải mã JSON an toàn (Dùng chung cho toàn bộ Service)
   */
  static parseJson(val, key = 'vi', defaultVal = "") {
    if (!val) return defaultVal;
    try {
      const obj = typeof val === 'string' ? JSON.parse(val) : val;
      if (obj && typeof obj === 'object') {
        return obj[key] || obj.vi || obj.en || (typeof obj === 'object' && !Array.isArray(obj) ? "" : obj);
      }
      return obj || defaultVal;
    } catch (e) { 
      return val || defaultVal; 
    }
  }

  /**
   * Chi tiết ấn phẩm "Full Field" - Dữ liệu thực 100%
   * Hỗ trợ user_interaction nếu có readerId (từ token)
   */
  static async getPublicationDetail(id, readerId = null) {
    // 1. Lấy thông tin chính kèm Publisher và Collection
    // view_count: Tổng hợp của view, read, download cho chuyên nghiệp
    const { rows: pubRows } = await pool.query(`
      SELECT b.*, 
             p.name as publisher_name,
             c.name as collection_name,
             (SELECT count(*) FROM interaction_logs WHERE object_id = b.id AND action_type IN ('view', 'read', 'download')) as view_count,
             (SELECT count(*) FROM wishlists WHERE book_id = b.id) as favorite_count,
             (
               SELECT json_agg(json_build_object('id', a.id, 'name', a.name))
               FROM authors a
               JOIN book_authors ba ON a.id = ba.author_id
               WHERE ba.book_id = b.id
             ) as authors_list,
             -- Thông tin tương tác cá nhân (nếu có readerId)
             EXISTS(SELECT 1 FROM wishlists WHERE book_id = b.id AND member_id = $2) as is_favorited,
             EXISTS(SELECT 1 FROM interaction_logs WHERE object_id = b.id AND member_id = $2 AND action_type = 'download') as has_downloaded,
             (SELECT count(*) FROM interaction_logs WHERE object_id = b.id AND member_id = $2 AND action_type = 'read') as read_count
      FROM books b
      LEFT JOIN publishers p ON b.publisher_id = p.id
      LEFT JOIN collections c ON b.collection_id = c.id
      WHERE b.id = $1
    `, [id, readerId]);

    if (pubRows.length === 0) return null;
    let publication = pubRows[0];

    // 2. Chuẩn hóa dữ liệu JSON & Interaction
    const userInteraction = readerId ? {
      isFavorited: publication.is_favor_ited || publication.is_favorited,
      hasDownloaded: publication.has_downloaded,
      readCount: parseInt(publication.read_count || 0)
    } : null;

    publication = {
      ...publication,
      title: this.parseJson(publication.title),
      description: this.parseJson(publication.description),
      toc: (typeof publication.toc === 'string' && publication.toc.startsWith('[') ) ? JSON.parse(publication.toc) : [],
      keywords: (typeof publication.keywords === 'string' && publication.keywords.startsWith('[') ) ? JSON.parse(publication.keywords) : [],
      digital_content: (typeof publication.digital_content === 'string' ) ? JSON.parse(publication.digital_content) : (publication.digital_content || {}),
      metadata: (typeof publication.metadata === 'string' ) ? JSON.parse(publication.metadata) : (publication.metadata || {}),
      author_ids: publication.authors_list?.map(a => a.id) || [],
      user_interaction: userInteraction
    };

    // 3. Lấy danh sách Bản sao (Copies) thực tế
    const { rows: copies } = await pool.query(`
      SELECT pc.*, sl.name as storage_name
      FROM publication_copies pc
      LEFT JOIN storage_locations sl ON pc.storage_location_id = sl.id
      WHERE pc.publication_id = $1
      ORDER BY pc.copy_number ASC
    `, [id]);

    // 4. Lấy danh sách Ấn phẩm liên quan
    let relatedItems = [];
    if (publication.collection_id) {
      const { rows: related } = await pool.query(`
        SELECT id, title, cover_image, author, media_type
        FROM books
        WHERE collection_id = $1 AND id != $2
        ORDER BY created_at DESC
        LIMIT 6
      `, [publication.collection_id, id]);
      
      relatedItems = related.map(item => ({
        ...item,
        title: this.parseJson(item.title)
      }));
    }

    return { 
      ...publication, 
      copies, 
      relatedItems 
    };
  }

  /**
   * Lấy danh sách (Có phân trang & bộ lọc)
   */
  static async getAll(params = {}) {
    try {
      const { 
        page = 1, limit = 10, search = '', 
        collection_id, status, cooperation_status, media_type,
        title, author, publisher_id, year_from, year_to, language, subject,
        sort_by = 'id', order = 'DESC'
      } = params;
      
      const offset = (page - 1) * limit;
      
      let filter = ' WHERE 1=1';
      const values = [];
      let idx = 1;

      // 1. Bộ lọc cơ bản
      if (media_type && media_type !== 'all') { filter += ` AND b.media_type = $${idx++}`; values.push(media_type); }
      if (status && status !== 'all') { filter += ` AND b.status = $${idx++}`; values.push(status); }
      if (cooperation_status && cooperation_status !== 'all') { filter += ` AND b.cooperation_status = $${idx++}`; values.push(cooperation_status); }
      if (collection_id) { filter += ` AND b.collection_id = $${idx++}`; values.push(collection_id); }
      if (language) { filter += ` AND b.language = $${idx++}`; values.push(language); }

      // 2. Tìm kiếm nội dung (ILIKE)
      if (search) { 
        // Mở rộng search để bao trùm tất cả các trường: title, author, code, isbn, description, keywords
        filter += ` AND (b.title::text ILIKE $${idx} OR b.author ILIKE $${idx} OR b.code ILIKE $${idx} OR b.isbn ILIKE $${idx} OR b.description::text ILIKE $${idx} OR b.keywords::text ILIKE $${idx})`; 
        values.push(`%${search}%`); idx++; 
      }
      if (title) { filter += ` AND b.title::text ILIKE $${idx++}`; values.push(`%${title}%`); }
      if (author) { filter += ` AND b.author ILIKE $${idx++}`; values.push(`%${author}%`); }
      if (subject) { filter += ` AND (b.keywords::text ILIKE $${idx} OR b.description::text ILIKE $${idx})`; values.push(`%${subject}%`); idx++; }
      
      // 3. Lọc theo khoá ngoại & thuộc tính số
      if (publisher_id) { filter += ` AND b.publisher_id = $${idx++}`; values.push(publisher_id); }
      
      // Hỗ trợ chọn 1 năm hoặc NHIỀU NĂM rời rạc (Ví dụ: 2024, 2020)
      if (params.years || params.year) {
        const yearVal = params.years || params.year;
        const yearArray = yearVal.toString().split(',').map(y => parseInt(y.trim())).filter(y => !isNaN(y));
        if (yearArray.length > 1) {
          filter += ` AND b.publication_year = ANY($${idx++})`;
          values.push(yearArray);
        } else if (yearArray.length === 1) {
          filter += ` AND b.publication_year = $${idx++}`;
          values.push(yearArray[0]);
        }
      }

      if (year_from) { filter += ` AND b.publication_year >= $${idx++}`; values.push(parseInt(year_from)); }
      if (year_to) { filter += ` AND b.publication_year <= $${idx++}`; values.push(parseInt(year_to)); }

      // 4. Đếm tổng số bản ghi
      const countRes = await pool.query(`SELECT COUNT(*) FROM books b ${filter}`, values);
      const totalItems = parseInt(countRes.rows[0].count);

      // 5. Xử lý Sắp xếp (Sorting) - Nâng cấp đa tầng cho Mobile App
      let orderClause = '';
      if (sort_by === 'id' || !sort_by || sort_by === 'default') {
        // Mặc định: Giảm dần lượt xem -> Nhan đề A-Z -> ID mới nhất
        orderClause = 'ORDER BY view_count DESC, b.title::text ASC, b.id DESC';
      } else {
        const allowedSortFields = {
          'title': 'b.title::text',
          'year': 'b.publication_year',
          'views': 'view_count',
          'favorites': 'favorite_count'
        };
        const sortField = allowedSortFields[sort_by] || 'b.id';
        const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        orderClause = `ORDER BY ${sortField} ${sortOrder}`;
      }

      const dataQuery = `
        SELECT b.id, b.code, b.isbn, b.title, b.author, b.slug, b.cover_image, 
               b.publication_year, b.media_type, b.status, b.access_policy, b.language,
               p.name as publisher_name,
               (SELECT count(*) FROM publication_copies pc WHERE pc.publication_id = b.id) as total_copies,
               (SELECT count(*) FROM interaction_logs il WHERE il.object_id = b.id AND il.action_type = 'view') as view_count,
               (SELECT count(*) FROM wishlists WHERE book_id = b.id) as favorite_count
        FROM books b 
        LEFT JOIN publishers p ON b.publisher_id = p.id
        ${filter} 
        ${orderClause} 
        LIMIT $${idx++} OFFSET $${idx++}
      `;
      values.push(limit, offset);
      const { rows: publications } = await pool.query(dataQuery, values);

      return {
        publications: publications.map(p => ({
          id: p.id,
          code: p.code,
          isbn: p.isbn,
          title: this.parseJson(p.title),
          author: p.author,
          slug: p.slug,
          cover_image: p.cover_image,
          thumbnail: p.cover_image,
          publication_year: p.publication_year,
          media_type: p.media_type,
          status: p.status,
          access_policy: p.access_policy,
          publisher_name: this.parseJson(p.publisher_name),
          copy_count: parseInt(p.total_copies || 0),
          view_count: parseInt(p.view_count || 0),
          favorite_count: parseInt(p.favorite_count || 0)
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
        totalPublications: parseInt(pubCountRes[0]?.total || 0),
        totalCopies: parseInt(copyCountRes[0]?.total || 0),
        totalDigital: parseInt(digitalCountRes[0]?.total || 0)
      };
    } catch (error) {
      console.error("PublicationService.getStats Error:", error.message);
      throw error;
    }
  }
}

module.exports = PublicationService;
