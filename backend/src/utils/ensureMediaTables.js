const fs = require('fs');
const path = require('path');

/**
 * Utility để đảm bảo bảng media đã được tạo
 * Tự động tạo bảng nếu chưa tồn tại
 */

const { pool } = require('../config/database');
const mediaUploadsDir = path.join(__dirname, '../../uploads/media');

function ensureMediaFolderDir(id) {
  const folderPath = path.join(mediaUploadsDir, `folder-${id}`);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

async function ensureMediaTables() {
  const client = await pool.connect();
  try {
    // Kiểm tra bảng media_folders
    const checkFolders = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'media_folders'
      );
    `);
    
    if (!checkFolders.rows[0].exists) {
      console.log('Creating media_folders table...');
      await client.query(`
        CREATE TABLE media_folders (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL UNIQUE,
          parent_id INTEGER REFERENCES media_folders(id) ON DELETE CASCADE,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      await client.query('CREATE INDEX idx_media_folders_parent_id ON media_folders(parent_id);');
      await client.query('CREATE INDEX idx_media_folders_slug ON media_folders(slug);');
      
      await client.query(`
        DROP TRIGGER IF EXISTS update_media_folders_updated_at ON media_folders;
        CREATE TRIGGER update_media_folders_updated_at
          BEFORE UPDATE ON media_folders
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);
      
      console.log('✓ media_folders table created');
    } else {
      // Kiểm tra và thêm cột description nếu chưa có
      const checkDescription = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'media_folders'
          AND column_name = 'description'
        );
      `);
      
      if (!checkDescription.rows[0].exists) {
        console.log('Adding description column to media_folders table...');
        await client.query(`
          ALTER TABLE media_folders 
          ADD COLUMN description TEXT;
        `);
        console.log('✓ description column added to media_folders');
      }

      // Đảm bảo có UNIQUE constraint trên slug cho ON CONFLICT
      try {
        await client.query('ALTER TABLE media_folders ADD CONSTRAINT media_folders_slug_key UNIQUE (slug);');
      } catch (e) {
        // Ignored if already exists
      }
    }
    
    // Kiểm tra bảng media_files
    const checkFiles = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'media_files'
      );
    `);
    
    if (!checkFiles.rows[0].exists) {
      console.log('Creating media_files table...');
      await client.query(`
        CREATE TABLE media_files (
          id SERIAL PRIMARY KEY,
          folder_id INTEGER REFERENCES media_folders(id) ON DELETE SET NULL,
          filename VARCHAR(255) NOT NULL,
          original_name VARCHAR(255) NOT NULL,
          file_path VARCHAR(500) NOT NULL,
          file_url VARCHAR(500) NOT NULL,
          file_type VARCHAR(50) NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          file_size BIGINT NOT NULL,
          width INTEGER,
          height INTEGER,
          alt_text TEXT,
          description TEXT,
          uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      await client.query('CREATE INDEX idx_media_files_folder_id ON media_files(folder_id);');
      await client.query('CREATE INDEX idx_media_files_file_type ON media_files(file_type);');
      await client.query('CREATE INDEX idx_media_files_uploaded_by ON media_files(uploaded_by);');
      await client.query('CREATE INDEX idx_media_files_created_at ON media_files(created_at);');
      
      await client.query(`
        DROP TRIGGER IF EXISTS update_media_files_updated_at ON media_files;
        CREATE TRIGGER update_media_files_updated_at
          BEFORE UPDATE ON media_files
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);
      
      console.log('✓ media_files table created');
    }
    
    // Insert thư mục mặc định nếu chưa có
    await client.query(`
      INSERT INTO media_folders (name, slug, parent_id, description)
      VALUES
        ('Root', 'root', NULL, 'Thư mục gốc'),
        ('Images', 'images', NULL, 'Thư mục chứa hình ảnh'),
        ('Documents', 'documents', NULL, 'Thư mục chứa tài liệu'),
        ('Icons', 'icons', NULL, 'Thư mục chứa icons'),
        ('Projects', 'projects', NULL, 'Thư mục dự án')
      ON CONFLICT (slug) DO NOTHING;
    `);
    
    // Ensure directory exists for each folder
    // Optimization: Only check first 100 folders OR just root folders
    const foldersResult = await client.query('SELECT id FROM media_folders LIMIT 50');
    foldersResult.rows.forEach((row) => {
      ensureMediaFolderDir(row.id);
    });

    console.log('✓ Media folders check completed');
    return true;
  } catch (error) {
    console.error('Error ensuring media tables:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Cache để tránh check nhiều lần
let tablesEnsured = false;
let ensuringPromise = null;

async function ensureTablesOnce() {
  if (tablesEnsured) {
    return true;
  }
  
  if (ensuringPromise) {
    return ensuringPromise;
  }
  
  ensuringPromise = ensureMediaTables().then(() => {
    tablesEnsured = true;
    ensuringPromise = null;
    return true;
  }).catch((err) => {
    ensuringPromise = null;
    throw err;
  });
  
  return ensuringPromise;
}

module.exports = {
  ensureMediaTables,
  ensureTablesOnce,
};
