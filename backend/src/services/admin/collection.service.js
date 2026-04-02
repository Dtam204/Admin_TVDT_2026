const { pool } = require('../../config/database');

/**
 * Service xử lý nghiệp vụ Bộ sưu tập (Collections) hoàn thiện
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
    return rows;
  }

  static async getCollectionById(id) {
    const query = `
      SELECT c.*, 
             (SELECT COUNT(*) FROM books WHERE collection_id = c.id) as item_count
      FROM collections c
      WHERE c.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  static async createCollection(data) {
    const query = `
      INSERT INTO collections (name, parent_id, icon, description, order_index, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [data.name, data.parent_id, data.icon, data.description, data.order_index || 0, data.is_active !== false];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async updateCollection(id, data) {
    const query = `
      UPDATE collections 
      SET name = $1, parent_id = $2, icon = $3, description = $4, 
          order_index = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;
    const values = [data.name, data.parent_id, data.icon, data.description, data.order_index, data.is_active, id];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async deleteCollection(id) {
    // Check if contains books
    const check = await pool.query('SELECT COUNT(*) FROM books WHERE collection_id = $1', [id]);
    if (parseInt(check.rows[0].count) > 0) {
      throw new Error('Cannot delete collection that contains publications');
    }
    const { rowCount } = await pool.query('DELETE FROM collections WHERE id = $1', [id]);
    return rowCount > 0;
  }
}

module.exports = CollectionService;
