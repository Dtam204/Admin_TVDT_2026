const { pool } = require('../../config/database');
const AuditService = require('./audit.service');
const { toPlainText } = require('../../utils/locale');

/**
 * Service xử lý nghiệp vụ Tác giả (Authors) chuyên nghiệp
 * Standardized for Library Admin System (Single Language Optimization)
 */
class AuthorService {
  /**
   * Lấy danh sách tác giả với phân trang và tìm kiếm
   */
  static async getAll({ page = 1, limit = 10, search = '', status = null, featured = null }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT a.*, 
             (SELECT count(*) FROM book_authors WHERE author_id = a.id) as total_books
      FROM authors a 
      WHERE 1=1
    `;
    const params = [];
    let pIdx = 1;

    if (search) {
      query += ` AND (a.slug ILIKE $${pIdx} OR a.name::text ILIKE $${pIdx})`;
      params.push(`%${search}%`);
      pIdx++;
    }

    if (status) {
      query += ` AND a.status = $${pIdx}`;
      params.push(status);
      pIdx++;
    }

    if (featured !== null) {
      query += ` AND a.featured = $${pIdx}`;
      params.push(featured);
      pIdx++;
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${pIdx} OFFSET $${pIdx+1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);

    // Count total for pagination
    let countQuery = 'SELECT count(*) FROM authors WHERE 1=1';
    const countParams = [];
    let cpIdx = 1;
    if (search) { countQuery += ` AND (slug ILIKE $${cpIdx} OR name::text ILIKE $${cpIdx})`; countParams.push(`%${search}%`); cpIdx++; }
    if (status) { countQuery += ` AND status = $${cpIdx}`; countParams.push(status); cpIdx++; }
    if (featured !== null) { countQuery += ` AND featured = $${cpIdx}`; countParams.push(featured); cpIdx++; }

    const { rows: countRows } = await pool.query(countQuery, countParams);

    const data = rows.map(a => ({
      ...a,
      name: toPlainText(a.name, ''),
      bio: toPlainText(a.bio, '')
    }));

    return {
      data,
      total: parseInt(countRows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(parseInt(countRows[0].count) / limit)
    };
  }

  /**
   * Lấy chi tiết tác giả
   */
  static async getById(id) {
    const query = `
      SELECT a.*, 
             (SELECT count(*) FROM book_authors WHERE author_id = a.id) as book_count
      FROM authors a 
      WHERE a.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    if (!rows[0]) return null;
    
    return {
      ...rows[0],
      name: toPlainText(rows[0].name, ''),
      bio: toPlainText(rows[0].bio, '')
    };
  }

  /**
   * Tạo mới tác giả
   */
  static async create(data, adminId = null) {
    const { 
      name, slug: customSlug, pseudonyms, professional_title, gender, 
      bio, avatar, cover_image, birth_year, death_year, 
      nationality, birth_place, education, awards, career_highlights,
      website, social_links, featured, status 
    } = data;
    
    const nameStr = toPlainText(name, 'author');
    let slug = customSlug;
    if (!slug) {
      slug = nameStr.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const { rows: existing } = await pool.query('SELECT id FROM authors WHERE slug = $1', [slug]);
    if (existing.length > 0) {
      slug = `${slug}-${Math.random().toString(36).substr(2, 5)}`;
    }

    const query = `
      INSERT INTO authors (
        name, slug, pseudonyms, professional_title, gender, 
        bio, avatar, cover_image, birth_year, death_year, 
        nationality, birth_place, education, awards, career_highlights,
        website, social_links, featured, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `;

    const values = [
      nameStr,
      slug,
      JSON.stringify(pseudonyms || {}),
      professional_title || null,
      gender || null,
      toPlainText(bio, ''),
      avatar || null,
      cover_image || null,
      birth_year || null,
      death_year || null,
      nationality || null,
      birth_place || null,
      JSON.stringify(education || {}),
      JSON.stringify(awards || {}),
      JSON.stringify(career_highlights || {}),
      website || null,
      JSON.stringify(social_links || {}),
      featured || false,
      status || 'active'
    ];

    const { rows } = await pool.query(query, values);
    const newAuthor = rows[0];

    if (adminId) {
      await AuditService.log(adminId, 'CREATE', 'AUTHOR', newAuthor.id, null, newAuthor);
    }

    return newAuthor;
  }

  /**
   * Cập nhật tác giả
   */
  static async update(id, data, adminId = null) {
    const oldAuthor = await this.getById(id);
    if (!oldAuthor) throw new Error('Author not found');

    const fields = [];
    const values = [];
    let idx = 1;

    const allowedFields = [
      'avatar', 'cover_image', 'birth_year', 'death_year', 
      'nationality', 'birth_place', 'website', 
      'featured', 'status', 'professional_title', 'gender', 'slug'
    ];

    allowedFields.forEach(f => {
      if (data[f] !== undefined) {
        fields.push(`${f} = $${idx++}`);
        values.push(data[f]);
      }
    });

    if (data.name) {
      fields.push(`name = $${idx++}`);
      values.push(toPlainText(data.name, ''));
    }

    if (data.bio) {
      fields.push(`bio = $${idx++}`);
      values.push(toPlainText(data.bio, ''));
    }

    const jsonFields = ['pseudonyms', 'education', 'awards', 'career_highlights', 'social_links'];
    jsonFields.forEach(f => {
      if (data[f]) {
        fields.push(`${f} = $${idx++}`);
        values.push(JSON.stringify(data[f]));
      }
    });

    if (fields.length === 0) return oldAuthor;

    values.push(id);
    const query = `UPDATE authors SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *`;
    
    const { rows } = await pool.query(query, values);
    const updatedAuthor = rows[0];

    if (adminId) {
      await AuditService.log(adminId, 'UPDATE', 'AUTHOR', id, oldAuthor, updatedAuthor);
    }

    return updatedAuthor;
  }

  /**
   * Xóa tác giả
   */
  static async delete(id, adminId = null) {
    const oldAuthor = await this.getById(id);
    const { rowCount } = await pool.query('DELETE FROM authors WHERE id = $1', [id]);
    
    if (rowCount > 0 && adminId) {
      await AuditService.log(adminId, 'DELETE', 'AUTHOR', id, oldAuthor, null);
    }
    
    return rowCount > 0;
  }
}

module.exports = AuthorService;
