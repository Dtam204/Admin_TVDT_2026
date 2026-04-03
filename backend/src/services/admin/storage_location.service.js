const { pool } = require('../../config/database');

/**
 * StorageLocationService - Quản lý vị trí lưu trữ (Kệ sách)
 */
class StorageLocationService {
  static async getAll() {
    const { rows } = await pool.query('SELECT * FROM storage_locations ORDER BY name ASC');
    return rows;
  }

  static async create({ name, description }) {
    const { rows } = await pool.query(
      'INSERT INTO storage_locations (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    return rows[0];
  }

  static async update(id, { name, description }) {
     const { rows } = await pool.query(
        'UPDATE storage_locations SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [name, description, id]
     );
     return rows[0];
  }

  static async delete(id) {
     const { rowCount } = await pool.query('DELETE FROM storage_locations WHERE id = $1', [id]);
     return rowCount > 0;
  }
}

module.exports = StorageLocationService;
