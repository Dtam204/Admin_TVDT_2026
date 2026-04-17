const { pool } = require('../../config/database');
const AuditService = require('./audit.service');
const { toPlainText } = require('../../utils/locale');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { PDFDocument } = require('pdf-lib');

/**
 * Service xử lý nghiệp vụ Ấn phẩm (Publications)
 * CHUẨN HÓA 100%: Dữ liệu thực từ Database, cấu trúc phẳng chuyên nghiệp.
 */
class PublicationService {
  static normalizeSlug(slug, publicationId, code, title) {
    const raw = typeof slug === 'string' ? slug.trim() : '';
    const isInvalid = !raw || raw === 'object-object' || raw === '[object object]';
    if (!isInvalid) return raw;

    const base = (code || title || `publication-${publicationId}`)
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    return base || `publication-${publicationId}`;
  }

  static resolveAuthorName(fallbackAuthor, authorsList = []) {
    if (Array.isArray(authorsList) && authorsList.length > 0) {
      const names = authorsList
        .map((a) => (a && typeof a.name === 'string' ? a.name.trim() : ''))
        .filter(Boolean);
      if (names.length > 0) return names.join(', ');
    }
    return fallbackAuthor || 'Nhiều tác giả';
  }

  static normalizePublicationInput(pubData = {}) {
    const normalizedKeywords = Array.isArray(pubData.keywords)
      ? pubData.keywords
      : typeof pubData.keywords === 'string'
      ? pubData.keywords.split(',').map((k) => k.trim()).filter(Boolean)
      : [];

    const metadata = {
      ...(pubData.metadata || {}),
    };
    if (metadata.fullText && !metadata.full_text_raw) {
      metadata.full_text_raw = metadata.fullText;
    }

    return {
      ...pubData,
      code: pubData.code || '',
      isbn: pubData.isbn ?? pubData.isbdContent ?? pubData.code ?? null,
      author: pubData.author || 'Nhiều tác giả',
      publisher_id: pubData.publisher_id || null,
      collection_id: pubData.collection_id || null,
      cover_image: pubData.cover_image ?? pubData.thumbnail ?? null,
      publication_year: pubData.publication_year ?? pubData.publicationYear ?? new Date().getFullYear(),
      language: pubData.language || 'vi',
      pages: pubData.pages ?? pubData.pageCount ?? 0,
      digital_file_url: pubData.digital_file_url || null,
      metadata,
      status: pubData.status || 'available',
      ai_summary: pubData.ai_summary ?? pubData.aiSummary ?? null,
      dominant_color: pubData.dominant_color ?? pubData.dominantColor ?? '#4f46e5',
      edition: pubData.edition || null,
      volume: pubData.volume || null,
      dimensions: pubData.dimensions || null,
      keywords: normalizedKeywords,
      digital_content: pubData.digital_content ?? pubData.digitalContent ?? {},
      toc: pubData.toc || [],
      access_policy: pubData.access_policy || 'basic',
      cooperation_status: pubData.cooperation_status || 'cooperating',
      media_type: pubData.media_type || (pubData.is_digital ? 'Digital' : 'Physical')
    };
  }

  static async resolvePdfBuffer(fileUrl) {
    if (!fileUrl || typeof fileUrl !== 'string') return null;

    const normalized = fileUrl.trim();
    if (!normalized) return null;

    // Trường hợp URL tĩnh nội bộ: /uploads/...
    if (normalized.startsWith('/uploads/') || normalized.startsWith('uploads/')) {
      const relativePath = normalized.replace(/^\//, '');
      const localPath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(localPath)) {
        return fs.promises.readFile(localPath);
      }
      return null;
    }

    // Trường hợp URL tuyệt đối từ CDN/host khác
    if (/^https?:\/\//i.test(normalized)) {
      const response = await axios.get(normalized, {
        responseType: 'arraybuffer',
        timeout: 8000,
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024,
      });
      return Buffer.from(response.data);
    }

    // Trường hợp path tuyệt đối hoặc tương đối trong server
    const localPath = path.isAbsolute(normalized)
      ? normalized
      : path.join(process.cwd(), normalized);

    if (!fs.existsSync(localPath)) return null;
    return fs.promises.readFile(localPath);
  }

  static async extractPdfPageCount(fileUrl) {
    try {
      const pdfBuffer = await this.resolvePdfBuffer(fileUrl);
      if (!pdfBuffer) return null;
      const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
      return pdfDoc.getPageCount();
    } catch (error) {
      console.warn('[PublicationService] Không thể đọc số trang PDF:', error.message);
      return null;
    }
  }

  /**
   * Tạo mới Ấn phẩm kèm Bản sao
   */
  static async createPublicationWithCopies(pubData, copiesData = [], adminId = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const input = this.normalizePublicationInput(pubData);
      
      const title = toPlainText(input.title, 'Chưa có tiêu đề');
      let slug = (input.slug || title).toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      const { rows: existingSlug } = await client.query('SELECT id FROM books WHERE slug = $1', [slug]);
      if (existingSlug.length > 0) slug = `${slug}-${Math.random().toString(36).substr(2, 5)}`;
      
      const code = input.code || `PUB-${Date.now()}`;
      const isbn = input.isbn || code; 
      
      const description = toPlainText(input.description, '');

      const mediaType = input.media_type || (input.is_digital ? 'Digital' : 'Physical');
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
        code, isbn, title, input.author || "Nhiều tác giả", slug, 
        input.publisher_id, input.collection_id, description, 
        input.cover_image, input.publication_year, 
        input.language, input.pages, isDigital, input.digital_file_url, 
        JSON.stringify(input.metadata || {}), input.status, input.ai_summary, 
        input.dominant_color, input.edition, input.volume, 
        input.dimensions, JSON.stringify(input.keywords || []), 
        JSON.stringify(input.digital_content || {}), JSON.stringify(input.toc || []), 
        input.access_policy, input.cooperation_status, mediaType
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

      if (input.author_ids?.length > 0) {
        for (const authorId of input.author_ids) {
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
      const createdPublication = await this.getPublicationDetail(publicationId);
      return createdPublication || { id: publicationId };
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
    return toPlainText(val, defaultVal);
  }

  static parseArraySafe(value, fallback = []) {
    if (Array.isArray(value)) return value;
    if (!value) return fallback;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : fallback;
      } catch (_e) {
        return fallback;
      }
    }
    return fallback;
  }

  static pickTrailerInfo(metadata = {}, digitalContent = {}) {
    return (
      metadata.trailerInfo ||
      metadata.trailer_info ||
      metadata.trailer ||
      digitalContent.trailerInfo ||
      digitalContent.trailer_info ||
      digitalContent.trailer ||
      null
    );
  }

  static pickPreviewPages(metadata = {}, digitalContent = {}, toc = []) {
    const pages = (
      metadata.preview_pages ||
      metadata.previewPages ||
      digitalContent.preview_pages ||
      digitalContent.previewPages ||
      []
    );
    const parsed = this.parseArraySafe(pages, []);
    if (parsed.length > 0) return parsed;

    // Fallback dùng mục lục làm danh sách trang xem trước tối thiểu
    return this.parseArraySafe(toc, []).slice(0, 10);
  }

  static pickDigitizedFiles(publication = {}, metadata = {}, digitalContent = {}) {
    const fromDigital = this.parseArraySafe(
      digitalContent.digitized_files || digitalContent.digitizedFiles || digitalContent.files,
      []
    );
    const fromMetadata = this.parseArraySafe(
      metadata.digitized_files || metadata.digitizedFiles || metadata.files,
      []
    );

    const merged = [...fromDigital, ...fromMetadata].filter(Boolean);
    if (publication.digital_file_url) {
      merged.push({
        name: 'Digital File',
        type: 'primary',
        url: publication.digital_file_url,
      });
    }

    const seen = new Set();
    return merged.filter((file) => {
      const key = typeof file === 'string' ? file : (file.url || file.path || file.name || JSON.stringify(file));
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((file) => {
      if (typeof file === 'string') {
        return { name: 'Digital File', type: 'asset', url: file };
      }
      return file;
    });
  }

  static buildInformationFields(publication = {}) {
    return [
      { key: 'code', label: 'Mã ấn phẩm', value: publication.code || null },
      { key: 'isbn', label: 'ISBN', value: publication.isbn || null },
      { key: 'author', label: 'Tác giả', value: publication.author || null },
      { key: 'publisher_name', label: 'Nhà xuất bản', value: publication.publisher_name || null },
      { key: 'collection_name', label: 'Bộ sưu tập', value: publication.collection_name || null },
      { key: 'publication_year', label: 'Năm xuất bản', value: publication.publication_year || null },
      { key: 'language', label: 'Ngôn ngữ', value: publication.language || null },
      { key: 'pages', label: 'Số trang', value: publication.pages || null },
      { key: 'media_type', label: 'Loại tài liệu', value: publication.media_type || null },
      { key: 'access_policy', label: 'Quyền truy cập', value: publication.access_policy || null },
    ].filter((f) => f.value !== null && f.value !== undefined && f.value !== '');
  }

  static normalizePublicFileUrl(value) {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/')) return trimmed;
    if (trimmed.startsWith('uploads/')) return `/${trimmed}`;
    return `/uploads/${trimmed.replace(/^\.\//, '')}`;
  }

  /**
   * Chi tiết ấn phẩm "Full Field" - Dữ liệu thực 100%
   * Hỗ trợ user_interaction nếu có readerId (từ token)
   */
  static async getPublicationDetail(id, readerId = null) {
    // 1. Lấy thông tin chính kèm Publisher và Collection
    // Hỗ trợ truy vấn bằng ID (số) hoặc SLUG (chuỗi)
    const isId = !isNaN(id);
    const whereClause = isId ? 'b.id = $1' : 'b.slug = $1';

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
             EXISTS(SELECT 1 FROM wishlists WHERE book_id = b.id AND member_id = $2) as is_favorited,
             (
               SELECT br.rating
               FROM book_reviews br
               WHERE br.book_id = b.id AND br.member_id = $2 AND br.status = 'published'
               ORDER BY br.updated_at DESC
               LIMIT 1
             ) as my_rating,
             (
               SELECT br.comment
               FROM book_reviews br
               WHERE br.book_id = b.id AND br.member_id = $2 AND br.status = 'published'
               ORDER BY br.updated_at DESC
               LIMIT 1
             ) as my_comment,
             EXISTS(SELECT 1 FROM interaction_logs WHERE object_id = b.id AND member_id = $2 AND action_type = 'download') as has_downloaded,
             (SELECT count(*) FROM interaction_logs WHERE object_id = b.id AND member_id = $2 AND action_type = 'read') as read_count
      FROM books b
      LEFT JOIN publishers p ON b.publisher_id = p.id
      LEFT JOIN collections c ON b.collection_id = c.id
      WHERE ${whereClause}
    `, [id, readerId]);

    if (pubRows.length === 0) return null;
    let publication = pubRows[0];

    const mediaType = (publication.media_type || '').toLowerCase();
    publication.digital_file_url = this.normalizePublicFileUrl(publication.digital_file_url);
    publication.cover_image = this.normalizePublicFileUrl(publication.cover_image);
    publication.thumbnail = this.normalizePublicFileUrl(publication.thumbnail);
    publication.content_url = this.normalizePublicFileUrl(publication.content_url);

    const shouldSyncPdfPages = (mediaType === 'digital' || mediaType === 'hybrid' || publication.is_digital === true)
      && publication.digital_file_url;

    if (shouldSyncPdfPages) {
      const pdfPageCount = await this.extractPdfPageCount(publication.digital_file_url);
      if (pdfPageCount && Number(pdfPageCount) > 0 && Number(publication.pages || 0) !== Number(pdfPageCount)) {
        try {
          await pool.query('UPDATE books SET pages = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [pdfPageCount, publication.id]);
          publication.pages = pdfPageCount;
        } catch (error) {
          console.warn('[PublicationService] Không thể cập nhật số trang tự động:', error.message);
        }
      }
    }

    // 2. Chuẩn hóa dữ liệu JSON & Interaction
    const userInteraction = readerId ? {
      isFavorited: publication.is_favor_ited || publication.is_favorited,
      rating: parseInt(publication.my_rating || 0),
      comment: publication.my_comment || '',
      hasDownloaded: publication.has_downloaded,
      readCount: parseInt(publication.read_count || 0)
    } : null;

    const normalizedAuthor = this.resolveAuthorName(publication.author, publication.authors_list || []);

    publication = {
      ...publication,
      title: this.parseJson(publication.title),
      description: this.parseJson(publication.description),
      publisher_name: this.parseJson(publication.publisher_name),
      collection_name: this.parseJson(publication.collection_name),
      slug: this.normalizeSlug(publication.slug, publication.id, publication.code, this.parseJson(publication.title)),
      toc: (typeof publication.toc === 'string' && publication.toc.startsWith('[') ) ? JSON.parse(publication.toc) : [],
      keywords: (typeof publication.keywords === 'string' && publication.keywords.startsWith('[') ) ? JSON.parse(publication.keywords) : [],
      digital_content: (typeof publication.digital_content === 'string' ) ? JSON.parse(publication.digital_content) : (publication.digital_content || {}),
      metadata: (typeof publication.metadata === 'string' ) ? JSON.parse(publication.metadata) : (publication.metadata || {}),
      author: normalizedAuthor,
      author_ids: publication.authors_list?.map(a => a.id) || [],
      user_interaction: userInteraction
    };

    // 3. Lấy danh sách Bản sao (Copies) thực tế
    const { rows: copies } = await pool.query(`
      SELECT pc.id, pc.barcode, pc.copy_number, pc.price, pc.status, pc.condition, pc.storage_location_id, sl.name as storage_name
      FROM publication_copies pc
      LEFT JOIN storage_locations sl ON pc.storage_location_id = sl.id
      WHERE pc.publication_id = $1
      ORDER BY pc.copy_number ASC
    `, [publication.id]);

    const normalizedCopies = copies.map((c) => ({
      id: c.id,
      barcode: c.barcode,
      copy_number: c.copy_number,
      price: Number(c.price || 0),
      status: c.status,
      condition: c.condition,
      storage_location_id: c.storage_location_id || null,
      storage_name: c.storage_name || null,
    }));

    // 4. Lấy danh sách Ấn phẩm liên quan
    let relatedItems = [];
    if (publication.collection_id) {
      const { rows: related } = await pool.query(`
        SELECT b.id, b.code, b.isbn, b.slug, b.title, b.cover_image, b.author, b.media_type,
               b.publication_year, b.pages, b.status, b.access_policy,
               p.name as publisher_name,
               (
                 SELECT json_agg(json_build_object('id', a.id, 'name', a.name))
                 FROM authors a
                 JOIN book_authors ba ON a.id = ba.author_id
                 WHERE ba.book_id = b.id
               ) as authors_list
        FROM books b
        LEFT JOIN publishers p ON p.id = b.publisher_id
        WHERE b.collection_id = $1
          AND b.id != $2
          AND b.cooperation_status = 'cooperating'
          AND b.status = 'available'
        ORDER BY b.created_at DESC
        LIMIT 6
      `, [publication.collection_id, publication.id]);
      
      relatedItems = related.map(item => ({
        ...item,
        title: this.parseJson(item.title),
        publisher_name: this.parseJson(item.publisher_name),
        author: this.resolveAuthorName(item.author, item.authors_list || []),
        authors_list: item.authors_list || []
      }));
    }

    if (relatedItems.length === 0) {
      relatedItems = await this.getRelatedPublications(publication.id, 6);
    }

    const { rows: collectionRows } = await pool.query(`
      SELECT c.id, c.name, COUNT(b.id)::int as publication_count
      FROM collections c
      LEFT JOIN books b ON b.collection_id = c.id
        AND b.cooperation_status = 'cooperating'
        AND b.status = 'available'
      GROUP BY c.id, c.name
      ORDER BY publication_count DESC, c.name ASC
    `);

    const collectionList = collectionRows.map((c) => ({
      id: c.id,
      name: this.parseJson(c.name),
      publication_count: c.publication_count,
    }));

    const trailerInfo = this.pickTrailerInfo(publication.metadata, publication.digital_content);
    const previewPages = this.pickPreviewPages(publication.metadata, publication.digital_content, publication.toc);
    const digitizedFiles = this.pickDigitizedFiles(publication, publication.metadata, publication.digital_content);
    const informationFields = this.buildInformationFields(publication);

    return {
      ...publication, 
      copies: normalizedCopies,
      relatedItems,
      related_documents: relatedItems,
      current_collection: publication.collection_id
        ? {
            id: publication.collection_id,
            name: publication.collection_name || null,
          }
        : null,
      collection_list: collectionList,
      information_fields: informationFields,
      trailerInfo,
      preview_pages: previewPages,
      digitized_files: digitizedFiles,
      file_url: publication.digital_file_url,
      pdf_url: publication.digital_file_url,
      cover_url: publication.cover_image,
      thumbnail_url: publication.thumbnail,
    };
  }

  /**
   * Lấy danh sách (Có phân trang & bộ lọc)
   */
  static async getAll(params = {}) {
    try {
      const { 
        page = 1, limit = 10, search = '', 
        collection, collection_id, status, cooperation_status, media_type,
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
      if (collection) {
        const collectionAsId = parseInt(collection, 10);
        if (!isNaN(collectionAsId)) {
          filter += ` AND b.collection_id = $${idx++}`;
          values.push(collectionAsId);
        } else {
          filter += ` AND EXISTS (
            SELECT 1
            FROM collections c
            WHERE c.id = b.collection_id
              AND c.name::text ILIKE $${idx}
          )`;
          values.push(`%${collection}%`);
          idx++;
        }
      }
      if (language) { filter += ` AND b.language = $${idx++}`; values.push(language); }

      // 2. Tìm kiếm nội dung (ILIKE)
      if (search) { 
        // Mở rộng search để bao trùm tất cả các trường: title, author, code, isbn, description, keywords
        filter += ` AND (
          b.title::text ILIKE $${idx}
          OR b.author ILIKE $${idx}
          OR EXISTS (
            SELECT 1 FROM book_authors ba
            JOIN authors a ON a.id = ba.author_id
            WHERE ba.book_id = b.id AND a.name ILIKE $${idx}
          )
          OR b.code ILIKE $${idx}
          OR b.isbn ILIKE $${idx}
          OR b.description::text ILIKE $${idx}
          OR b.keywords::text ILIKE $${idx}
        )`; 
        values.push(`%${search}%`); idx++; 
      }
      if (title) { filter += ` AND b.title::text ILIKE $${idx++}`; values.push(`%${title}%`); }
      if (author) {
        filter += ` AND (
          b.author ILIKE $${idx}
          OR EXISTS (
            SELECT 1 FROM book_authors ba
            JOIN authors a ON a.id = ba.author_id
            WHERE ba.book_id = b.id AND a.name ILIKE $${idx}
          )
        )`;
        values.push(`%${author}%`);
        idx++;
      }
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
               b.publication_year, b.media_type, b.status, b.access_policy, b.language, b.pages,
               p.name as publisher_name,
               (
                 SELECT json_agg(json_build_object('id', a.id, 'name', a.name))
                 FROM authors a
                 JOIN book_authors ba ON a.id = ba.author_id
                 WHERE ba.book_id = b.id
               ) as authors_list,
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
        publications: publications.map((p) => {
          const authorsList = p.authors_list || [];
          return {
          id: p.id,
          code: p.code,
          isbn: p.isbn,
          title: this.parseJson(p.title),
          author: this.resolveAuthorName(p.author, authorsList),
          authors_list: authorsList,
          slug: p.slug,
          cover_image: p.cover_image,
          thumbnail: p.cover_image,
          publication_year: p.publication_year,
          pages: p.pages,
          media_type: p.media_type,
          status: p.status,
          access_policy: p.access_policy,
          publisher_name: this.parseJson(p.publisher_name),
          copy_count: parseInt(p.total_copies || 0),
          total_copies: parseInt(p.total_copies || 0),
          countCopies: parseInt(p.total_copies || 0),
          view_count: parseInt(p.view_count || 0),
          favorite_count: parseInt(p.favorite_count || 0)
          };
        }),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalItems,
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: parseInt(page)
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
      const input = this.normalizePublicationInput(pubData);
      const mediaType = input.media_type || (input.is_digital ? 'Digital' : 'Physical');
      const isDigital = (mediaType === 'Digital' || mediaType === 'Hybrid');
      
      const title = toPlainText(input.title, 'Không rõ');
      const description = toPlainText(input.description, '');

      await client.query(`
        UPDATE books SET 
          code = $1,
          isbn = $2,
          title = $3,
          author = $4,
          description = $5,
          collection_id = $6,
          publisher_id = $7,
          publication_year = $8,
          language = $9,
          pages = $10,
          is_digital = $11,
          digital_file_url = $12,
          status = $13,
          ai_summary = $14,
          cover_image = $15,
          dominant_color = $16,
          edition = $17,
          volume = $18,
          dimensions = $19,
          metadata = $20,
          keywords = $21,
          digital_content = $22,
          toc = $23,
          access_policy = $24,
          cooperation_status = $25,
          media_type = $26,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $27
      `, [
        input.code || oldPub[0].code,
        input.isbn || oldPub[0].isbn,
        title,
        input.author || oldPub[0].author,
        description,
        input.collection_id,
        input.publisher_id,
        input.publication_year,
        input.language,
        input.pages,
        isDigital,
        input.digital_file_url,
        input.status,
        input.ai_summary,
        input.cover_image,
        input.dominant_color,
        input.edition,
        input.volume,
        input.dimensions,
        JSON.stringify(input.metadata || oldPub[0].metadata || {}),
        JSON.stringify(input.keywords || []),
        JSON.stringify(input.digital_content || {}),
        JSON.stringify(input.toc || []),
        input.access_policy,
        input.cooperation_status,
        mediaType,
        id
      ]);

      if (input.author_ids) {
        await client.query('DELETE FROM book_authors WHERE book_id = $1', [id]);
        for (const authorId of input.author_ids) {
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
      const updatedPublication = await this.getPublicationDetail(id);
      return updatedPublication || { id: Number(id), success: true };
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

  /**
   * Lấy toàn bộ danh sách ấn phẩm (Rút gọn)
   * Không phân trang, dùng cho Select/Dropdown trong Admin.
   */
  static async getAllSelect() {
    try {
      const query = `
        SELECT b.id, b.code, b.title, b.author, b.cover_image as thumbnail, b.media_type, b.status,
               (
                 SELECT json_agg(json_build_object('id', a.id, 'name', a.name))
                 FROM authors a
                 JOIN book_authors ba ON a.id = ba.author_id
                 WHERE ba.book_id = b.id
               ) as authors_list
        FROM books b
        ORDER BY b.title::text ASC, b.id DESC
      `;
      const { rows } = await pool.query(query);
      return rows.map(p => ({
        id: p.id,
        code: p.code,
        title: this.parseJson(p.title),
        author: this.resolveAuthorName(p.author, p.authors_list || []),
        authors_list: p.authors_list || [],
        thumbnail: p.thumbnail,
        media_type: p.media_type,
        status: p.status
      }));
    } catch (error) {
      console.error("PublicationService.getAllSelect Error:", error.message);
      throw error;
    }
  }

  static async getPublicationLookups() {
    const [authorsRes, publishersRes, collectionsRes, yearsRes, languagesRes, mediaTypesRes] = await Promise.all([
      pool.query(`
        SELECT a.id, a.name, COUNT(ba.book_id)::int as publication_count
        FROM authors a
        LEFT JOIN book_authors ba ON ba.author_id = a.id
        GROUP BY a.id, a.name
        ORDER BY publication_count DESC, a.name ASC
      `),
      pool.query(`
        SELECT p.id, p.name, COUNT(b.id)::int as publication_count
        FROM publishers p
        LEFT JOIN books b ON b.publisher_id = p.id
        GROUP BY p.id, p.name
        ORDER BY publication_count DESC, p.name ASC
      `),
      pool.query(`
        SELECT c.id, c.name, COUNT(b.id)::int as publication_count
        FROM collections c
        LEFT JOIN books b ON b.collection_id = c.id
        GROUP BY c.id, c.name
        ORDER BY publication_count DESC, c.name ASC
      `),
      pool.query(`
        SELECT DISTINCT publication_year
        FROM books
        WHERE publication_year IS NOT NULL
        ORDER BY publication_year DESC
      `),
      pool.query(`
        SELECT language, COUNT(*)::int as publication_count
        FROM books
        WHERE language IS NOT NULL AND language <> ''
        GROUP BY language
        ORDER BY publication_count DESC, language ASC
      `),
      pool.query(`
        SELECT media_type, COUNT(*)::int as publication_count
        FROM books
        WHERE media_type IS NOT NULL AND media_type <> ''
        GROUP BY media_type
        ORDER BY publication_count DESC, media_type ASC
      `)
    ]);

    return {
      authors: authorsRes.rows,
      publishers: publishersRes.rows,
      collections: collectionsRes.rows,
      years: yearsRes.rows.map((r) => r.publication_year),
      languages: languagesRes.rows,
      media_types: mediaTypesRes.rows
    };
  }

  static async getRelatedPublications(idOrSlug, limit = 12) {
    const isId = !isNaN(idOrSlug);
    const whereClause = isId ? 'id = $1' : 'slug = $1';
    const { rows: baseRows } = await pool.query(
      `SELECT id, collection_id, publisher_id, publication_year, language, media_type FROM books WHERE ${whereClause} LIMIT 1`,
      [idOrSlug]
    );

    if (baseRows.length === 0) return [];

    const base = baseRows[0];
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 24);
    const { rows } = await pool.query(`
      SELECT b.id, b.slug, b.code, b.title, b.author, b.cover_image, b.publication_year, b.media_type, b.access_policy,
             (
               SELECT json_agg(json_build_object('id', a.id, 'name', a.name))
               FROM authors a
               JOIN book_authors ba ON a.id = ba.author_id
               WHERE ba.book_id = b.id
             ) as authors_list,
             (
               CASE WHEN b.collection_id = $2 AND b.collection_id IS NOT NULL THEN 4 ELSE 0 END +
               CASE WHEN b.publisher_id = $3 AND b.publisher_id IS NOT NULL THEN 3 ELSE 0 END +
               CASE WHEN ABS(COALESCE(b.publication_year, 0) - COALESCE($4, 0)) <= 1 THEN 1 ELSE 0 END +
               CASE WHEN COALESCE(b.language, '') = COALESCE($5, '') AND b.language IS NOT NULL THEN 1 ELSE 0 END +
               CASE WHEN COALESCE(b.media_type, '') = COALESCE($6, '') AND b.media_type IS NOT NULL THEN 1 ELSE 0 END
             ) as related_score,
             (SELECT count(*) FROM interaction_logs il WHERE il.object_id = b.id AND il.action_type = 'view') as view_count
      FROM books b
      WHERE b.id != $1
        AND b.status = 'available'
        AND b.cooperation_status = 'cooperating'
      ORDER BY related_score DESC, view_count DESC, b.created_at DESC
      LIMIT $7
    `, [base.id, base.collection_id, base.publisher_id, base.publication_year, base.language, base.media_type, safeLimit]);

    return rows.map((item) => ({
      id: item.id,
      slug: item.slug,
      code: item.code,
      title: this.parseJson(item.title),
      author: this.resolveAuthorName(item.author, item.authors_list || []),
      authors_list: item.authors_list || [],
      cover_image: item.cover_image,
      thumbnail: item.cover_image,
      publication_year: item.publication_year,
      media_type: item.media_type,
      access_policy: item.access_policy,
      related_score: Number(item.related_score || 0),
      view_count: parseInt(item.view_count || 0, 10)
    }));
  }

  static async getStats() {
    const [pubCountRes, activeCountRes, digitalCountRes, copiesRes] = await Promise.all([
      pool.query('SELECT COUNT(*)::int as total FROM books'),
      pool.query("SELECT COUNT(*)::int as total FROM books WHERE cooperation_status = 'cooperating'"),
      pool.query("SELECT COUNT(*)::int as total FROM books WHERE media_type IN ('Digital', 'Hybrid') OR is_digital = true"),
      pool.query('SELECT COUNT(*)::int as total FROM publication_copies'),
    ]);

    const totalPublications = pubCountRes.rows[0]?.total || 0;
    const cooperatingPublications = activeCountRes.rows[0]?.total || 0;
    const digitalOrHybridPublications = digitalCountRes.rows[0]?.total || 0;
    const totalCopies = copiesRes.rows[0]?.total || 0;

    return {
      totalPublications,
      cooperatingPublications,
      digitalOrHybridPublications,
      totalCopies,
      total_publications: totalPublications,
      cooperating_publications: cooperatingPublications,
      digital_or_hybrid_publications: digitalOrHybridPublications,
      total_copies: totalCopies,
    };
  }
}

module.exports = PublicationService;
