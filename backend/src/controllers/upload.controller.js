const path = require('path');
const pool = require('../config/database').pool;
const sizeOf = require('image-size'); // Cần cài: npm install image-size
const { ensureTablesOnce } = require('../utils/ensureMediaTables');

/**
 * Xác định loại file từ mime type
 */
function getFileType(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.includes('pdf') || mimetype.includes('document') || mimetype.includes('spreadsheet') || mimetype.includes('presentation')) return 'document';
  return 'other';
}

/**
 * POST /api/admin/upload/file
 * Upload một file và lưu vào database
 */
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có file được upload',
      });
    }

    const folderId = req.body.folder_id ? parseInt(req.body.folder_id) : null;
    const userId = req.user?.id || null;
    
    // Xác định đường dẫn file
    const relativePath = folderId 
      ? `uploads/media/folder-${folderId}/${req.file.filename}`
      : `uploads/media/${req.file.filename}`;
    
    // Tạo URL đầy đủ (đảm bảo bắt đầu bằng /uploads)
    const fileUrl = `/${relativePath}`;
    const fileType = getFileType(req.file.mimetype);
    
    // Lấy kích thước ảnh nếu là file ảnh
    let width = null;
    let height = null;
    
    if (fileType === 'image') {
      try {
        const filePath = path.join(__dirname, '../../', relativePath);
        const dimensions = sizeOf(filePath);
        width = dimensions.width;
        height = dimensions.height;
      } catch (err) {
        // Không thể đọc kích thước, bỏ qua
      }
    }
    
    // Lưu vào database
    const { rows } = await pool.query(
      `INSERT INTO media_files (
        folder_id, filename, original_name, file_path, file_url,
        file_type, mime_type, file_size, width, height, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        folderId,
        req.file.filename,
        req.file.originalname,
        relativePath,
        fileUrl,
        fileType,
        req.file.mimetype,
        req.file.size,
        width,
        height,
        userId,
      ]
    );
    
    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/admin/upload/files
 * Upload nhiều file cùng lúc
 */
exports.uploadFiles = async (req, res, next) => {
  try {
    // Đảm bảo bảng đã được tạo
    await ensureTablesOnce();
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có file được upload',
      });
    }

    const folderId = req.body.folder_id ? parseInt(req.body.folder_id) : null;
    const userId = req.user?.id || null;
    const uploadedFiles = [];

    for (const file of req.files) {
      const relativePath = folderId 
        ? `uploads/media/folder-${folderId}/${file.filename}`
        : `uploads/media/${file.filename}`;
      
      const fileUrl = `/${relativePath}`;
      const fileType = getFileType(file.mimetype);
      
      let width = null;
      let height = null;
      
      if (fileType === 'image') {
        try {
          const filePath = path.join(__dirname, '../../', relativePath);
          const dimensions = sizeOf(filePath);
          width = dimensions.width;
          height = dimensions.height;
        } catch (err) {
          // Bỏ qua
        }
      }
      
      const { rows } = await pool.query(
        `INSERT INTO media_files (
          folder_id, filename, original_name, file_path, file_url,
          file_type, mime_type, file_size, width, height, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          folderId,
          file.filename,
          file.originalname,
          relativePath,
          fileUrl,
          fileType,
          file.mimetype,
          file.size,
          width,
          height,
          userId,
        ]
      );
      
      uploadedFiles.push(rows[0]);
    }
    
    return res.status(200).json({
      success: true,
      data: uploadedFiles,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/admin/upload/image (backward compatibility)
 * Upload một file ảnh và trả về URL
 */
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có file được upload',
      });
    }

    // Tạo URL để truy cập file
    const fileUrl = `/uploads/news/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /api/admin/upload/image/:filename
 * Xóa file ảnh
 */
exports.deleteImage = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const fs = require('fs');
    const filePath = path.join(__dirname, '../../uploads/news', filename);

    // Kiểm tra file có tồn tại không
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.status(200).json({
        success: true,
        message: 'Đã xóa file thành công',
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'File không tồn tại',
      });
    }
  } catch (error) {
    return next(error);
  }
};
