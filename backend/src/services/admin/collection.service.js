const { pool } = require('../../config/database');
const AuditService = require('./audit.service');
const { toPlainText } = require('../../utils/locale');

/**
 * Service xử lý nghiệp vụ Bộ sưu tập (Collections) hoàn thiện
 * Standardized for Library Admin System (Single Language Optimization)
 */
class CollectionService {
  static async getAllCollections() {
    const query = `
      SELECT c.*, 
             (SELECT COUNT(*) FROM books WHERE collection_id = c.id) as item_count
      FROM collections c
      ORDER BY order_index ASC
    `;
    const { rows } = await pool.query(query);
    
    return rows.map(c => ({
      ...c,
      name: toPlainText(c.name, ''),
      description: toPlainText(c.description, '')
    }));
  }

  static async getCollectionById(id) {
    const query = `
      SELECT c.*, 
             (SELECT COUNT(*) FROM books WHERE collection_id = c.id) as item_count
      FROM collections c
      WHERE c.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    if (!rows[0]) return null;

    return {
      ...rows[0],
      name: toPlainText(rows[0].name, ''),
      description: toPlainText(rows[0].description, '')
    };
  }

  static async createCollection(data, adminId = null) {
    const query = `
      INSERT INTO collections (name, parent_id, icon, description, order_index, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const nameStr = toPlainText(data.name, '');
    const descStr = toPlainText(data.description, '');

    const values = [
      nameStr, 
      data.parent_id, 
      data.icon, 
      descStr, 
      data.order_index || 0, 
      data.is_active !== false
    ];
    
    const { rows } = await pool.query(query, values);
    const newColl = rows[0];

    if (adminId) {
      await AuditService.log(adminId, 'CREATE', 'COLLECTION', newColl.id, null, newColl);
    }

    return newColl;
  }

  static async updateCollection(id, data, adminId = null) {
    const oldColl = await this.getCollectionById(id);
    if (!oldColl) throw new Error('Collection not found');

    const query = `
      UPDATE collections 
      SET name = $1, parent_id = $2, icon = $3, description = $4, 
          order_index = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;
    const nameStr = toPlainText(data.name, '');
    const descStr = toPlainText(data.description, '');

    const values = [
      nameStr, 
      data.parent_id, 
      data.icon, 
      descStr, 
      data.order_index, 
      data.is_active, 
      id
    ];
    
    const { rows } = await pool.query(query, values);
    const updatedColl = rows[0];

    if (adminId) {
      await AuditService.log(adminId, 'UPDATE', 'COLLECTION', id, oldColl, updatedColl);
    }

    return updatedColl;
  }

  static async deleteCollection(id, adminId = null) {
    const oldColl = await this.getCollectionById(id);
    // Check if contains books
    const check = await pool.query('SELECT COUNT(*) FROM books WHERE collection_id = $1', [id]);
    if (parseInt(check.rows[0].count) > 0) {
      throw new Error('Cannot delete collection that contains publications');
    }
    const { rowCount } = await pool.query('DELETE FROM collections WHERE id = $1', [id]);
    
    if (rowCount > 0 && adminId) {
      await AuditService.log(adminId, 'DELETE', 'COLLECTION', id, oldColl, null);
    }

    return rowCount > 0;
  }
}

module.exports = CollectionService;
