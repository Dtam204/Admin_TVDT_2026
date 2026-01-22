/**
 * Books Controller - Phase 1 MVP
 * Quản lý sách với authors, categories, publishers
 */

const { pool } = require('../config/database');

// ============================================================================
// HELPERS
// ============================================================================

// Parse JSONB field cho multilang
const parseMultilang = (value, lang = 'vi') => {
  if (!value) return '';
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed[lang] || parsed.vi || '';
    } catch {
      return value;
    }
  }
  return value[lang] || value.vi || '';
};

// ============================================================================
// BOOKS CRUD
// ============================================================================

// GET /api/admin/books
exports.getBooks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, category_id, author_id, status, featured } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        b.*,
        p.name as publisher_name,
        COUNT(DISTINCT ba.author_id) as author_count,
        COUNT(DISTINCT bcb.category_id) as category_count
      FROM books b
      LEFT JOIN publishers p ON b.publisher_id = p.id
      LEFT JOIN book_authors ba ON b.id = ba.book_id
      LEFT JOIN book_category_books bcb ON b.id = bcb.book_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (b.title::text ILIKE $${paramIndex} OR b.isbn ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category_id) {
      query += ` AND EXISTS (
        SELECT 1 FROM book_category_books 
        WHERE book_id = b.id AND category_id = $${paramIndex}
      )`;
      params.push(category_id);
      paramIndex++;
    }

    if (author_id) {
      query += ` AND EXISTS (
        SELECT 1 FROM book_authors 
        WHERE book_id = b.id AND author_id = $${paramIndex}
      )`;
      params.push(author_id);
      paramIndex++;
    }

    if (status && status !== 'undefined') {
      query += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (featured !== undefined && featured !== 'undefined') {
      query += ` AND b.featured = $${paramIndex}`;
      params.push(featured === 'true');
      paramIndex++;
    }

    query += ` GROUP BY b.id, p.name ORDER BY b.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(query, params);

    // Get total count with same filters
    let countQuery = `
      SELECT COUNT(DISTINCT b.id) as total 
      FROM books b
      LEFT JOIN book_authors ba ON b.id = ba.book_id
      LEFT JOIN book_category_books bcb ON b.id = bcb.book_id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (b.title::text ILIKE $${countParamIndex} OR b.isbn ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (category_id) {
      countQuery += ` AND EXISTS (
        SELECT 1 FROM book_category_books 
        WHERE book_id = b.id AND category_id = $${countParamIndex}
      )`;
      countParams.push(category_id);
      countParamIndex++;
    }

    if (author_id) {
      countQuery += ` AND EXISTS (
        SELECT 1 FROM book_authors 
        WHERE book_id = b.id AND author_id = $${countParamIndex}
      )`;
      countParams.push(author_id);
      countParamIndex++;
    }

    if (status && status !== 'undefined') {
      countQuery += ` AND b.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (featured !== undefined && featured !== 'undefined') {
      countQuery += ` AND b.featured = $${countParamIndex}`;
      countParams.push(featured === 'true');
      countParamIndex++;
    }

    const { rows: countRows } = await pool.query(countQuery, countParams);

    return res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countRows[0].total),
        totalPages: Math.ceil(countRows[0].total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/admin/books/:id
exports.getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get book with publisher
    const { rows: bookRows } = await pool.query(
      `SELECT b.*, p.name as publisher_name 
       FROM books b
       LEFT JOIN publishers p ON b.publisher_id = p.id
       WHERE b.id = $1`,
      [id]
    );

    if (bookRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách',
      });
    }

    const book = bookRows[0];

    // Get authors
    const { rows: authors } = await pool.query(
      `SELECT a.* FROM authors a
       INNER JOIN book_authors ba ON a.id = ba.author_id
       WHERE ba.book_id = $1
       ORDER BY ba.sort_order`,
      [id]
    );

    // Get categories
    const { rows: categories } = await pool.query(
      `SELECT bc.* FROM book_categories bc
       INNER JOIN book_category_books bcb ON bc.id = bcb.category_id
       WHERE bcb.book_id = $1`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        ...book,
        authors,
        categories,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/admin/books
exports.createBook = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      isbn,
      title,
      slug,
      publisher_id,
      description,
      cover_image,
      publication_year,
      language,
      pages,
      format,
      quantity,
      price,
      rental_price,
      status,
      featured,
      location,
      author_ids = [],
      category_ids = [],
    } = req.body;

    // Insert book
    const { rows } = await client.query(
      `INSERT INTO books (
        isbn, title, slug, publisher_id, description, cover_image,
        publication_year, language, pages, format, quantity, available_quantity,
        price, rental_price, status, featured, location
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        isbn, title, slug, publisher_id, description, cover_image,
        publication_year, language, pages, format, quantity,
        price, rental_price, status || 'available', featured || false, location
      ]
    );

    const book = rows[0];

    // Link authors
    if (author_ids.length > 0) {
      for (let i = 0; i < author_ids.length; i++) {
        await client.query(
          'INSERT INTO book_authors (book_id, author_id, sort_order) VALUES ($1, $2, $3)',
          [book.id, author_ids[i], i]
        );
      }
    }

    // Link categories
    if (category_ids.length > 0) {
      for (const categoryId of category_ids) {
        await client.query(
          'INSERT INTO book_category_books (book_id, category_id) VALUES ($1, $2)',
          [book.id, categoryId]
        );
      }
    }

    // Update author counts
    if (author_ids.length > 0) {
      await client.query(
        `UPDATE authors SET total_books = (
          SELECT COUNT(*) FROM book_authors WHERE author_id = authors.id
        ) WHERE id = ANY($1)`,
        [author_ids]
      );
    }

    // Update category counts
    if (category_ids.length > 0) {
      await client.query(
        `UPDATE book_categories SET total_books = (
          SELECT COUNT(*) FROM book_category_books WHERE category_id = book_categories.id
        ) WHERE id = ANY($1)`,
        [category_ids]
      );
    }

    // Update publisher count
    if (publisher_id) {
      await client.query(
        `UPDATE publishers SET total_books = (
          SELECT COUNT(*) FROM books WHERE publisher_id = $1
        ) WHERE id = $1`,
        [publisher_id]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Đã tạo sách thành công',
      data: book,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

// PUT /api/admin/books/:id
exports.updateBook = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      isbn, title, slug, publisher_id, description, cover_image,
      publication_year, language, pages, format, quantity,
      price, rental_price, status, featured, location,
      author_ids, category_ids,
    } = req.body;

    // Check if book exists
    const { rows: existing } = await client.query('SELECT * FROM books WHERE id = $1', [id]);
    if (existing.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách',
      });
    }

    // Update book
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    if (isbn !== undefined) {
      updateFields.push(`isbn = $${paramIndex++}`);
      params.push(isbn);
    }
    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      params.push(title);
    }
    if (slug !== undefined) {
      updateFields.push(`slug = $${paramIndex++}`);
      params.push(slug);
    }
    if (publisher_id !== undefined) {
      updateFields.push(`publisher_id = $${paramIndex++}`);
      params.push(publisher_id);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      params.push(description);
    }
    if (cover_image !== undefined) {
      updateFields.push(`cover_image = $${paramIndex++}`);
      params.push(cover_image);
    }
    if (publication_year !== undefined) {
      updateFields.push(`publication_year = $${paramIndex++}`);
      params.push(publication_year);
    }
    if (language !== undefined) {
      updateFields.push(`language = $${paramIndex++}`);
      params.push(language);
    }
    if (pages !== undefined) {
      updateFields.push(`pages = $${paramIndex++}`);
      params.push(pages);
    }
    if (format !== undefined) {
      updateFields.push(`format = $${paramIndex++}`);
      params.push(format);
    }
    if (quantity !== undefined) {
      updateFields.push(`quantity = $${paramIndex++}`);
      params.push(quantity);
      // Update available_quantity proportionally
      const borrowed = existing[0].quantity - existing[0].available_quantity;
      updateFields.push(`available_quantity = $${paramIndex++}`);
      params.push(Math.max(0, quantity - borrowed));
    }
    if (price !== undefined) {
      updateFields.push(`price = $${paramIndex++}`);
      params.push(price);
    }
    if (rental_price !== undefined) {
      updateFields.push(`rental_price = $${paramIndex++}`);
      params.push(rental_price);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (featured !== undefined) {
      updateFields.push(`featured = $${paramIndex++}`);
      params.push(featured);
    }
    if (location !== undefined) {
      updateFields.push(`location = $${paramIndex++}`);
      params.push(location);
    }

    if (updateFields.length > 0) {
      params.push(id);
      await client.query(
        `UPDATE books SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        params
      );
    }

    // Update authors if provided
    if (author_ids !== undefined) {
      await client.query('DELETE FROM book_authors WHERE book_id = $1', [id]);
      if (author_ids.length > 0) {
        for (let i = 0; i < author_ids.length; i++) {
          await client.query(
            'INSERT INTO book_authors (book_id, author_id, sort_order) VALUES ($1, $2, $3)',
            [id, author_ids[i], i]
          );
        }
      }
    }

    // Update categories if provided
    if (category_ids !== undefined) {
      await client.query('DELETE FROM book_category_books WHERE book_id = $1', [id]);
      if (category_ids.length > 0) {
        for (const categoryId of category_ids) {
          await client.query(
            'INSERT INTO book_category_books (book_id, category_id) VALUES ($1, $2)',
            [id, categoryId]
          );
        }
      }
    }

    await client.query('COMMIT');

    // Get updated book
    const { rows } = await client.query('SELECT * FROM books WHERE id = $1', [id]);

    return res.json({
      success: true,
      message: 'Đã cập nhật sách thành công',
      data: rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

// DELETE /api/admin/books/:id
exports.deleteBook = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Check if book exists
    const { rows } = await client.query('SELECT * FROM books WHERE id = $1', [id]);
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách',
      });
    }

    // Check if book is currently borrowed
    const { rows: loans } = await client.query(
      `SELECT id FROM book_loans WHERE book_id = $1 AND status = 'borrowed'`,
      [id]
    );

    if (loans.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa sách đang được mượn',
      });
    }

    // Delete book (cascades to junction tables)
    await client.query('DELETE FROM books WHERE id = $1', [id]);

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Đã xóa sách thành công',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};
