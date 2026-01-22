/**
 * Courses Controller - Phase 1 MVP
 * Quản lý khóa học với instructors, categories
 */

const { pool } = require('../config/database');

// ============================================================================
// COURSES CRUD
// ============================================================================

// GET /api/admin/courses
exports.getCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, category_id, level, status, featured } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        c.*,
        COUNT(DISTINCT ci.instructor_id) as instructor_count,
        COUNT(DISTINCT ccc.category_id) as category_count
      FROM courses c
      LEFT JOIN course_instructors ci ON c.id = ci.course_id
      LEFT JOIN course_category_courses ccc ON c.id = ccc.course_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND c.title::text ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category_id) {
      query += ` AND EXISTS (
        SELECT 1 FROM course_category_courses 
        WHERE course_id = c.id AND category_id = $${paramIndex}
      )`;
      params.push(category_id);
      paramIndex++;
    }

    if (level) {
      query += ` AND c.level = $${paramIndex}`;
      params.push(level);
      paramIndex++;
    }

    if (status && status !== 'undefined') {
      query += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (featured !== undefined && featured !== 'undefined') {
      query += ` AND c.featured = $${paramIndex}`;
      params.push(featured === 'true');
      paramIndex++;
    }

    query += ` GROUP BY c.id ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(query, params);

    // Get total count with same filters
    let countQuery = `
      SELECT COUNT(DISTINCT c.id) as total 
      FROM courses c
      LEFT JOIN course_instructors ci ON c.id = ci.course_id
      LEFT JOIN course_category_courses ccc ON c.id = ccc.course_id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND c.title::text ILIKE $${countParamIndex}`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (category_id) {
      countQuery += ` AND EXISTS (
        SELECT 1 FROM course_category_courses 
        WHERE course_id = c.id AND category_id = $${countParamIndex}
      )`;
      countParams.push(category_id);
      countParamIndex++;
    }

    if (level) {
      countQuery += ` AND c.level = $${countParamIndex}`;
      countParams.push(level);
      countParamIndex++;
    }

    if (status && status !== 'undefined') {
      countQuery += ` AND c.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (featured !== undefined && featured !== 'undefined') {
      countQuery += ` AND c.featured = $${countParamIndex}`;
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

// GET /api/admin/courses/:id
exports.getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: courseRows } = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);

    if (courseRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học',
      });
    }

    const course = courseRows[0];

    // Get instructors
    const { rows: instructors } = await pool.query(
      `SELECT i.* FROM instructors i
       INNER JOIN course_instructors ci ON i.id = ci.instructor_id
       WHERE ci.course_id = $1
       ORDER BY ci.sort_order`,
      [id]
    );

    // Get categories
    const { rows: categories } = await pool.query(
      `SELECT cc.* FROM course_categories cc
       INNER JOIN course_category_courses ccc ON cc.id = ccc.category_id
       WHERE ccc.course_id = $1`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        ...course,
        instructors,
        categories,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/admin/courses
exports.createCourse = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      title,
      slug,
      description,
      content,
      thumbnail,
      preview_video,
      level,
      language,
      duration_hours,
      price,
      discount_price,
      is_free,
      certificate,
      requirements,
      what_you_learn,
      target_audience,
      status,
      featured,
      instructor_ids = [],
      category_ids = [],
    } = req.body;

    // Insert course
    const { rows } = await client.query(
      `INSERT INTO courses (
        title, slug, description, content, thumbnail, preview_video,
        level, language, duration_hours, price, discount_price, is_free,
        certificate, requirements, what_you_learn, target_audience,
        status, featured
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        title, slug, description, content, thumbnail, preview_video,
        level || 'beginner', language || 'vi', duration_hours || 0,
        price || 0, discount_price || 0, is_free || false,
        certificate || false, requirements, what_you_learn, target_audience,
        status || 'draft', featured || false
      ]
    );

    const course = rows[0];

    // Link instructors
    if (instructor_ids.length > 0) {
      for (let i = 0; i < instructor_ids.length; i++) {
        await client.query(
          'INSERT INTO course_instructors (course_id, instructor_id, sort_order) VALUES ($1, $2, $3)',
          [course.id, instructor_ids[i], i]
        );
      }
      
      // Update instructor counts
      await client.query(
        `UPDATE instructors SET total_courses = (
          SELECT COUNT(*) FROM course_instructors WHERE instructor_id = instructors.id
        ) WHERE id = ANY($1)`,
        [instructor_ids]
      );
    }

    // Link categories
    if (category_ids.length > 0) {
      for (const categoryId of category_ids) {
        await client.query(
          'INSERT INTO course_category_courses (course_id, category_id) VALUES ($1, $2)',
          [course.id, categoryId]
        );
      }
      
      // Update category counts
      await client.query(
        `UPDATE course_categories SET total_courses = (
          SELECT COUNT(*) FROM course_category_courses WHERE category_id = course_categories.id
        ) WHERE id = ANY($1)`,
        [category_ids]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Đã tạo khóa học thành công',
      data: course,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

// PUT /api/admin/courses/:id
exports.updateCourse = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    
    // Check if exists
    const { rows: existing } = await client.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (existing.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học',
      });
    }

    const {
      title, slug, description, content, thumbnail, preview_video,
      level, language, duration_hours, price, discount_price, is_free,
      certificate, requirements, what_you_learn, target_audience,
      status, featured, instructor_ids, category_ids,
    } = req.body;

    // Build dynamic update query
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      params.push(title);
    }
    if (slug !== undefined) {
      updateFields.push(`slug = $${paramIndex++}`);
      params.push(slug);
    }
    // ... (add other fields similarly)

    if (updateFields.length > 0) {
      params.push(id);
      await client.query(
        `UPDATE courses SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        params
      );
    }

    // Update relationships if provided
    if (instructor_ids !== undefined) {
      await client.query('DELETE FROM course_instructors WHERE course_id = $1', [id]);
      if (instructor_ids.length > 0) {
        for (let i = 0; i < instructor_ids.length; i++) {
          await client.query(
            'INSERT INTO course_instructors (course_id, instructor_id, sort_order) VALUES ($1, $2, $3)',
            [id, instructor_ids[i], i]
          );
        }
      }
    }

    if (category_ids !== undefined) {
      await client.query('DELETE FROM course_category_courses WHERE course_id = $1', [id]);
      if (category_ids.length > 0) {
        for (const categoryId of category_ids) {
          await client.query(
            'INSERT INTO course_category_courses (course_id, category_id) VALUES ($1, $2)',
            [id, categoryId]
          );
        }
      }
    }

    await client.query('COMMIT');

    const { rows } = await client.query('SELECT * FROM courses WHERE id = $1', [id]);

    return res.json({
      success: true,
      message: 'Đã cập nhật khóa học thành công',
      data: rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

// DELETE /api/admin/courses/:id
exports.deleteCourse = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const { rows } = await client.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học',
      });
    }

    // Delete course (cascades to junction tables)
    await client.query('DELETE FROM courses WHERE id = $1', [id]);

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Đã xóa khóa học thành công',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};
