const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Cấu hình Multer để upload PDF chuẩn production
 */

// 1. Tự động tạo thư mục uploads/pdfs nếu chưa có
const uploadDir = path.join(process.cwd(), 'uploads/pdfs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Định nghĩa Disk Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Đặt tên file độc nhất: timestamp-random-extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `pdf-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// 3. Bộ lọc file (Chỉ PDF)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file định dạng PDF!'), false);
  }
};

// 4. Khởi tạo Multer instance
const uploadPdf = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // Giới hạn 100MB
  }
});

/**
 * Middleware xử lý lỗi từ Multer (như quá dung lượng, sai định dạng)
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn! Giới hạn tối đa là 100MB.'
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  } else if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

// 5. Cấu hình upload cho Media (Ảnh, Thumbnail)
const mediaDir = path.join(process.cwd(), 'uploads/media');
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
}

const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, mediaDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `img-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const mediaFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file định dạng ảnh!'), false);
  }
};

const uploadMedia = multer({
  storage: mediaStorage,
  fileFilter: mediaFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

module.exports = {
  uploadPdf,
  uploadMedia,
  handleUploadError
};
