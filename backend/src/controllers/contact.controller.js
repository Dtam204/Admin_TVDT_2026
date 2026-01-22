/**
 * Contact Controller - Consolidated
 * Quản lý tất cả các phần của trang Contact
 * - Hero section
 * - Info Cards section  
 * - Form section
 * - Map section
 * - Sidebar (offices, socials)
 * - Contact Requests management
 */

const { pool } = require('../config/database');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper function to get section by type (any status)
const getSectionAnyStatus = async (sectionType) => {
  const { rows } = await pool.query(
    'SELECT * FROM contact_sections WHERE section_type = $1',
    [sectionType]
  );
  return rows.length > 0 ? rows[0] : null;
};

// Helper function to get items by section_id and section_type
const getItems = async (sectionId, sectionType) => {
  const { rows } = await pool.query(
    'SELECT * FROM contact_section_items WHERE section_id = $1 AND section_type = $2 ORDER BY sort_order ASC',
    [sectionId, sectionType]
  );
  return rows;
};

// Helper function to parse locale field from JSON string
const parseLocaleField = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null && ('vi' in parsed || 'en' in parsed || 'ja' in parsed)) {
        return parsed;
      }
    } catch (e) {
      // Not JSON, return as string
    }
    return value;
  }
  if (typeof value === 'object' && value !== null && ('vi' in value || 'en' in value || 'ja' in value)) {
    return value;
  }
  return value;
};

// Helper function to process locale field for database storage
const processLocaleField = (value) => {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && ('vi' in value || 'en' in value || 'ja' in value)) {
    return JSON.stringify(value);
  }
  return typeof value === 'string' ? value : String(value);
};

// ============================================================================
// HERO SECTION
// ============================================================================

// GET /api/admin/contact/hero
exports.getHero = async (req, res, next) => {
  try {
    const section = await getSectionAnyStatus('hero');
    
    if (!section) {
      return res.json({
        success: true,
        data: null,
      });
    }

    const data = section.data || {};

    return res.json({
      success: true,
      data: {
        id: section.id,
        badge: data.badge || '',
        title: data.title || { prefix: '', highlight: '' },
        description: data.description || '',
        iconName: data.iconName || 'MessageCircle',
        image: data.image || '',
        isActive: section.is_active !== undefined ? section.is_active : true,
        createdAt: section.created_at,
        updatedAt: section.updated_at,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/admin/contact/hero
exports.updateHero = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      badge,
      title,
      description,
      iconName,
      image,
      isActive,
    } = req.body;

    const data = {
      badge: badge || '',
      title: title || { prefix: '', highlight: '' },
      description: description || '',
      iconName: iconName || 'MessageCircle',
      image: image || '',
    };

    const section = await getSectionAnyStatus('hero');

    if (section) {
      const existingData = section.data || {};
      const updateData = {
        badge: badge !== undefined && badge !== '' ? badge : (existingData.badge || ''),
        title: title || existingData.title || { prefix: '', highlight: '' },
        description: description !== undefined && description !== '' ? description : (existingData.description || ''),
        iconName: iconName || existingData.iconName || 'MessageCircle',
        image: image !== undefined ? image : (existingData.image || ''),
      };
      await client.query(
        'UPDATE contact_sections SET data = $1, is_active = $2 WHERE id = $3',
        [JSON.stringify(updateData), isActive !== undefined ? isActive : true, section.id]
      );
    } else {
      await client.query(
        'INSERT INTO contact_sections (section_type, data, is_active) VALUES ($1, $2, $3)',
        ['hero', JSON.stringify(data), isActive !== undefined ? isActive : true]
      );
    }

    await client.query('COMMIT');

    const updatedSection = await getSectionAnyStatus('hero');
    if (!updatedSection) {
      client.release();
      return res.status(500).json({
        success: false,
        message: 'Không thể lấy dữ liệu sau khi cập nhật',
      });
    }

    const updatedData = updatedSection.data || {};

    return res.json({
      success: true,
      message: 'Đã cập nhật hero thành công',
      data: {
        id: updatedSection.id,
        badge: updatedData.badge || '',
        title: updatedData.title || { prefix: '', highlight: '' },
        description: updatedData.description || '',
        iconName: updatedData.iconName || 'MessageCircle',
        image: updatedData.image || '',
        isActive: updatedSection.is_active !== undefined ? updatedSection.is_active : true,
        createdAt: updatedSection.created_at,
        updatedAt: updatedSection.updated_at,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

// ============================================================================
// INFO CARDS SECTION
// ============================================================================

// GET /api/admin/contact/info-cards
exports.getInfoCards = async (req, res, next) => {
  try {
    const section = await getSectionAnyStatus('info-cards');
    
    if (!section) {
      return res.json({
        success: true,
        data: {
          items: [],
        },
      });
    }

    const items = await getItems(section.id, 'info-cards');

    return res.json({
      success: true,
      data: {
        id: section.id,
        items: items.map(item => {
          const itemData = item.data || {};
          return {
            id: item.id,
            iconName: itemData.iconName || '',
            title: itemData.title || '',
            content: itemData.content || '',
            link: itemData.link || null,
            gradient: itemData.gradient || '',
            sortOrder: item.sort_order || 0,
            isActive: item.is_active !== undefined ? item.is_active : true,
          };
        }),
        isActive: section.is_active !== undefined ? section.is_active : true,
        createdAt: section.created_at,
        updatedAt: section.updated_at,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/admin/contact/info-cards
exports.updateInfoCards = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      items = [],
      isActive,
    } = req.body;

    const section = await getSectionAnyStatus('info-cards');
    let sectionId;

    if (section) {
      sectionId = section.id;
      await client.query(
        'UPDATE contact_sections SET is_active = $1 WHERE id = $2',
        [isActive !== undefined ? isActive : true, sectionId]
      );
      await client.query('DELETE FROM contact_section_items WHERE section_id = $1 AND section_type = $2', [sectionId, 'info-cards']);
    } else {
      const { rows: inserted } = await client.query(
        'INSERT INTO contact_sections (section_type, data, is_active) VALUES ($1, $2, $3) RETURNING id',
        ['info-cards', '{}', isActive !== undefined ? isActive : true]
      );
      sectionId = inserted[0].id;
    }

    // Insert items
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemData = {
          iconName: item.iconName || '',
          title: item.title || '',
          content: item.content || '',
          link: item.link || null,
          gradient: item.gradient || '',
        };
        await client.query(
          'INSERT INTO contact_section_items (section_id, section_type, data, sort_order, is_active) VALUES ($1, $2, $3, $4, $5)',
          [sectionId, 'info-cards', JSON.stringify(itemData), item.sortOrder !== undefined ? item.sortOrder : i, item.isActive !== undefined ? item.isActive : true]
        );
      }
    }

    await client.query('COMMIT');

    const updatedSection = await getSectionAnyStatus('info-cards');
    if (!updatedSection) {
      client.release();
      return res.status(500).json({
        success: false,
        message: 'Không thể lấy dữ liệu sau khi cập nhật',
      });
    }
    const updatedItems = await getItems(updatedSection.id, 'info-cards');

    return res.json({
      success: true,
      message: 'Đã cập nhật info cards thành công',
      data: {
        id: updatedSection.id,
        items: updatedItems.map(item => {
          const itemData = item.data || {};
          return {
            id: item.id,
            iconName: itemData.iconName || '',
            title: itemData.title || '',
            content: itemData.content || '',
            link: itemData.link || null,
            gradient: itemData.gradient || '',
            sortOrder: item.sort_order || 0,
            isActive: item.is_active !== undefined ? item.is_active : true,
          };
        }),
        isActive: updatedSection.is_active !== undefined ? updatedSection.is_active : true,
        createdAt: updatedSection.created_at,
        updatedAt: updatedSection.updated_at,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

// ============================================================================
// FORM SECTION
// ============================================================================

// GET /api/admin/contact/form
exports.getForm = async (req, res, next) => {
  try {
    const section = await getSectionAnyStatus('form');
    
    if (!section) {
      return res.json({
        success: true,
        data: null,
      });
    }

    const data = section.data || {};

    return res.json({
      success: true,
      data: {
        id: section.id,
        header: data.header || '',
        description: data.description || '',
        fields: data.fields || {},
        button: data.button || { submit: '', success: '' },
        services: data.services || [],
        isActive: section.is_active !== undefined ? section.is_active : true,
        createdAt: section.created_at,
        updatedAt: section.updated_at,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/admin/contact/form
exports.updateForm = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      header,
      description,
      fields,
      button,
      services,
      isActive,
    } = req.body;

    const data = {
      header: header || '',
      description: description || '',
      fields: fields || {},
      button: button || { submit: '', success: '' },
      services: services || [],
    };

    const section = await getSectionAnyStatus('form');

    if (section) {
      const existingData = section.data || {};
      const updateData = {
        header: header !== undefined && header !== '' ? header : (existingData.header || ''),
        description: description !== undefined && description !== '' ? description : (existingData.description || ''),
        fields: fields || existingData.fields || {},
        button: button || existingData.button || { submit: '', success: '' },
        services: services || existingData.services || [],
      };
      await client.query(
        'UPDATE contact_sections SET data = $1, is_active = $2 WHERE id = $3',
        [JSON.stringify(updateData), isActive !== undefined ? isActive : true, section.id]
      );
    } else {
      await client.query(
        'INSERT INTO contact_sections (section_type, data, is_active) VALUES ($1, $2, $3)',
        ['form', JSON.stringify(data), isActive !== undefined ? isActive : true]
      );
    }

    await client.query('COMMIT');

    const updatedSection = await getSectionAnyStatus('form');
    if (!updatedSection) {
      client.release();
      return res.status(500).json({
        success: false,
        message: 'Không thể lấy dữ liệu sau khi cập nhật',
      });
    }

    const updatedData = updatedSection.data || {};

    return res.json({
      success: true,
      message: 'Đã cập nhật form thành công',
      data: {
        id: updatedSection.id,
        header: updatedData.header || '',
        description: updatedData.description || '',
        fields: updatedData.fields || {},
        button: updatedData.button || { submit: '', success: '' },
        services: updatedData.services || [],
        isActive: updatedSection.is_active !== undefined ? updatedSection.is_active : true,
        createdAt: updatedSection.created_at,
        updatedAt: updatedSection.updated_at,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

// ============================================================================
// MAP SECTION
// ============================================================================

// GET /api/admin/contact/map
exports.getMap = async (req, res, next) => {
  try {
    const section = await getSectionAnyStatus('map');
    
    if (!section) {
      return res.json({
        success: true,
        data: null,
      });
    }

    const data = section.data || {};

    return res.json({
      success: true,
      data: {
        id: section.id,
        address: parseLocaleField(data.address || ''),
        iframeSrc: data.iframeSrc || '',
        isActive: section.is_active !== undefined ? section.is_active : true,
        createdAt: section.created_at,
        updatedAt: section.updated_at,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/admin/contact/map
exports.updateMap = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      address,
      iframeSrc,
      isActive,
    } = req.body;

    const data = {
      address: processLocaleField(address) || '',
      iframeSrc: iframeSrc || '',
    };

    const section = await getSectionAnyStatus('map');

    if (section) {
      const existingData = section.data || {};
      const updateData = {
        address: address !== undefined ? processLocaleField(address) : (existingData.address || ''),
        iframeSrc: iframeSrc !== undefined && iframeSrc !== '' ? iframeSrc : (existingData.iframeSrc || ''),
      };
      await client.query(
        'UPDATE contact_sections SET data = $1, is_active = $2 WHERE id = $3',
        [JSON.stringify(updateData), isActive !== undefined ? isActive : true, section.id]
      );
    } else {
      await client.query(
        'INSERT INTO contact_sections (section_type, data, is_active) VALUES ($1, $2, $3)',
        ['map', JSON.stringify(data), isActive !== undefined ? isActive : true]
      );
    }

    await client.query('COMMIT');

    const updatedSection = await getSectionAnyStatus('map');
    if (!updatedSection) {
      client.release();
      return res.status(500).json({
        success: false,
        message: 'Không thể lấy dữ liệu sau khi cập nhật',
      });
    }

    const updatedData = updatedSection.data || {};

    return res.json({
      success: true,
      message: 'Đã cập nhật map thành công',
      data: {
        id: updatedSection.id,
        address: parseLocaleField(updatedData.address || ''),
        iframeSrc: updatedData.iframeSrc || '',
        isActive: updatedSection.is_active !== undefined ? updatedSection.is_active : true,
        createdAt: updatedSection.created_at,
        updatedAt: updatedSection.updated_at,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

// ============================================================================
// SIDEBAR SECTION (Offices + Socials)
// ============================================================================

// GET /api/admin/contact/sidebar
exports.getSidebar = async (req, res, next) => {
  try {
    const section = await getSectionAnyStatus('sidebar');
    
    if (!section) {
      return res.json({
        success: true,
        data: {
          quickActions: {},
          offices: [],
          socials: [],
        },
      });
    }

    const data = section.data || {};
    const offices = await getItems(section.id, 'offices');
    const socials = await getItems(section.id, 'socials');

    return res.json({
      success: true,
      data: {
        id: section.id,
        quickActions: data.quickActions || {},
        offices: offices.map(item => {
          const itemData = item.data || {};
          return {
            id: item.id,
            title: itemData.title || '',
            city: itemData.city || '',
            address: itemData.address || '',
            phone: itemData.phone || '',
            email: itemData.email || '',
            sortOrder: item.sort_order || 0,
            isActive: item.is_active !== undefined ? item.is_active : true,
          };
        }),
        socials: socials.map(item => {
          const itemData = item.data || {};
          return {
            id: item.id,
            iconName: itemData.iconName || '',
            href: itemData.href || '',
            label: itemData.label || '',
            gradient: itemData.gradient || '',
            sortOrder: item.sort_order || 0,
            isActive: item.is_active !== undefined ? item.is_active : true,
          };
        }),
        isActive: section.is_active !== undefined ? section.is_active : true,
        createdAt: section.created_at,
        updatedAt: section.updated_at,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/admin/contact/sidebar
exports.updateSidebar = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      quickActions,
      offices = [],
      socials = [],
      isActive,
    } = req.body;

    const data = {
      quickActions: quickActions || {},
    };

    const section = await getSectionAnyStatus('sidebar');
    let sectionId;

    if (section) {
      sectionId = section.id;
      const existingData = section.data || {};
      const updateData = {
        quickActions: quickActions || existingData.quickActions || {},
      };
      await client.query(
        'UPDATE contact_sections SET data = $1, is_active = $2 WHERE id = $3',
        [JSON.stringify(updateData), isActive !== undefined ? isActive : true, sectionId]
      );
      await client.query('DELETE FROM contact_section_items WHERE section_id = $1 AND section_type IN ($2, $3)', [sectionId, 'offices', 'socials']);
    } else {
      const { rows: inserted } = await client.query(
        'INSERT INTO contact_sections (section_type, data, is_active) VALUES ($1, $2, $3) RETURNING id',
        ['sidebar', JSON.stringify(data), isActive !== undefined ? isActive : true]
      );
      sectionId = inserted[0].id;
    }

    // Insert offices
    if (offices && offices.length > 0) {
      for (let i = 0; i < offices.length; i++) {
        const office = offices[i];
        const itemData = {
          title: office.title || '',
          city: office.city || '',
          address: office.address || '',
          phone: office.phone || '',
          email: office.email || '',
        };
        await client.query(
          'INSERT INTO contact_section_items (section_id, section_type, data, sort_order, is_active) VALUES ($1, $2, $3, $4, $5)',
          [sectionId, 'offices', JSON.stringify(itemData), office.sortOrder !== undefined ? office.sortOrder : i, office.isActive !== undefined ? office.isActive : true]
        );
      }
    }

    // Insert socials
    if (socials && socials.length > 0) {
      for (let i = 0; i < socials.length; i++) {
        const social = socials[i];
        const itemData = {
          iconName: social.iconName || '',
          href: social.href || '',
          label: social.label || '',
          gradient: social.gradient || '',
        };
        await client.query(
          'INSERT INTO contact_section_items (section_id, section_type, data, sort_order, is_active) VALUES ($1, $2, $3, $4, $5)',
          [sectionId, 'socials', JSON.stringify(itemData), social.sortOrder !== undefined ? social.sortOrder : i, social.isActive !== undefined ? social.isActive : true]
        );
      }
    }

    await client.query('COMMIT');

    const updatedSection = await getSectionAnyStatus('sidebar');
    if (!updatedSection) {
      client.release();
      return res.status(500).json({
        success: false,
        message: 'Không thể lấy dữ liệu sau khi cập nhật',
      });
    }
    const updatedOffices = await getItems(updatedSection.id, 'offices');
    const updatedSocials = await getItems(updatedSection.id, 'socials');

    return res.json({
      success: true,
      message: 'Đã cập nhật sidebar thành công',
      data: {
        id: updatedSection.id,
        quickActions: updatedSection.data?.quickActions || {},
        offices: updatedOffices.map(item => {
          const itemData = item.data || {};
          return {
            id: item.id,
            title: itemData.title || '',
            city: itemData.city || '',
            address: itemData.address || '',
            phone: itemData.phone || '',
            email: itemData.email || '',
            sortOrder: item.sort_order || 0,
            isActive: item.is_active !== undefined ? item.is_active : true,
          };
        }),
        socials: updatedSocials.map(item => {
          const itemData = item.data || {};
          return {
            id: item.id,
            iconName: itemData.iconName || '',
            href: itemData.href || '',
            label: itemData.label || '',
            gradient: itemData.gradient || '',
            sortOrder: item.sort_order || 0,
            isActive: item.is_active !== undefined ? item.is_active : true,
          };
        }),
        isActive: updatedSection.is_active !== undefined ? updatedSection.is_active : true,
        createdAt: updatedSection.created_at,
        updatedAt: updatedSection.updated_at,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

// ============================================================================
// CONTACT REQUESTS MANAGEMENT
// ============================================================================

// POST /api/public/contact (submit form)
exports.submitRequest = async (req, res, next) => {
  try {
    const { name, email, phone, company, service, message } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !service || !message) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
      });
    }

    // Insert contact request
    const { rows } = await pool.query(
      `INSERT INTO contact_requests (name, email, phone, company, service, message, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [name, email, phone, company || null, service, message]
    );

    return res.json({
      success: true,
      message: 'Đã gửi yêu cầu tư vấn thành công',
      data: {
        id: rows[0].id,
        name: rows[0].name,
        email: rows[0].email,
        phone: rows[0].phone,
        company: rows[0].company,
        service: rows[0].service,
        message: rows[0].message,
        status: rows[0].status,
        createdAt: rows[0].created_at,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/admin/contact-requests
exports.getRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM contact_requests WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Filter by status
    if (status && status !== 'all') {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    // Search by name, email, phone, or service
    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone ILIKE $${paramCount} OR service ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const { rows: countRows } = await pool.query(countQuery, params);
    const total = parseInt(countRows[0].count);

    // Add pagination and ordering
    paramCount++;
    query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
    params.push(limit);
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const { rows } = await pool.query(query, params);

    return res.json({
      success: true,
      data: rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        company: row.company,
        service: row.service,
        message: row.message,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/admin/contact-requests/:id
exports.getRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM contact_requests WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu tư vấn',
      });
    }

    const row = rows[0];
    return res.json({
      success: true,
      data: {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        company: row.company,
        service: row.service,
        message: row.message,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/admin/contact-requests/:id
exports.updateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Check if request exists
    const { rows: existingRows } = await pool.query(
      'SELECT * FROM contact_requests WHERE id = $1',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu tư vấn',
      });
    }

    // Update request
    const updateFields = [];
    const params = [];
    let paramCount = 0;

    if (status !== undefined) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      params.push(status);
    }

    if (notes !== undefined) {
      paramCount++;
      updateFields.push(`notes = $${paramCount}`);
      params.push(notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật',
      });
    }

    paramCount++;
    params.push(id);

    await pool.query(
      `UPDATE contact_requests 
       SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount}`,
      params
    );

    // Get updated request
    const { rows: updatedRows } = await pool.query(
      'SELECT * FROM contact_requests WHERE id = $1',
      [id]
    );

    const row = updatedRows[0];
    return res.json({
      success: true,
      message: 'Đã cập nhật yêu cầu tư vấn thành công',
      data: {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        company: row.company,
        service: row.service,
        message: row.message,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/admin/contact-requests/:id
exports.deleteRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if request exists
    const { rows } = await pool.query(
      'SELECT * FROM contact_requests WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu tư vấn',
      });
    }

    // Delete request
    await pool.query('DELETE FROM contact_requests WHERE id = $1', [id]);

    return res.json({
      success: true,
      message: 'Đã xóa yêu cầu tư vấn thành công',
    });
  } catch (error) {
    return next(error);
  }
};
