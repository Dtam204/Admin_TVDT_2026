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

// 5. Cấu hình upload cho Media Library (image/file)
const mediaDir = path.join(process.cwd(), 'uploads/media');
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
}

function getMediaDestination(req) {
  const folderId = req.body?.folder_id ? parseInt(req.body.folder_id, 10) : null;
  if (folderId && !Number.isNaN(folderId)) {
    const folderPath = path.join(mediaDir, `folder-${folderId}`);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    return folderPath;
  }
  return mediaDir;
}

const mediaStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    cb(null, getMediaDestination(req));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `media-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const imageFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file định dạng ảnh!'), false);
  }
};

const mediaFileFilter = (_req, file, cb) => {
  const allowedMimeGroups = [
    /^image\//,
    /^video\//,
    /^audio\//,
    /^application\/pdf$/,
    /^application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
    /^application\/(vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)$/,
    /^application\/(vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation)$/,
    /^text\//,
    /^application\/zip$/,
    /^application\/x-zip-compressed$/
  ];

  const isAllowed = allowedMimeGroups.some((rule) => rule.test(file.mimetype));
  if (isAllowed) {
    cb(null, true);
    return;
  }
  cb(new Error('Định dạng file chưa được hỗ trợ trong Media Library.'), false);
};

const uploadMediaImage = multer({
  storage: mediaStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

const uploadMediaAny = multer({
  storage: mediaStorage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

module.exports = {
  uploadPdf,
  uploadMediaImage,
  uploadMediaAny,
  handleUploadError
};
