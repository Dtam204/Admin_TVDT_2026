const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục uploads tồn tại
const baseUploadsDir = path.join(__dirname, '../../uploads');

// Thư mục cho media library (có folder)
const mediaUploadsDir = path.join(baseUploadsDir, 'media');
if (!fs.existsSync(mediaUploadsDir)) {
  fs.mkdirSync(mediaUploadsDir, { recursive: true });
}

// Thư mục riêng cho ảnh tin tức (backward compatibility)
const newsUploadsDir = path.join(baseUploadsDir, 'news');
if (!fs.existsSync(newsUploadsDir)) {
  fs.mkdirSync(newsUploadsDir, { recursive: true });
}

// Cấu hình storage với hỗ trợ folder cho media library
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const folderId = req.body.folder_id || req.query.folder_id;
      let uploadDir = mediaUploadsDir;
      
      // Nếu có folder_id, tạo thư mục con
      if (folderId) {
        uploadDir = path.join(mediaUploadsDir, `folder-${folderId}`);
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
      }
      
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Tạo tên file unique: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Filter cho phép nhiều loại file
const fileFilter = (req, file, cb) => {
  // Cho phép: images, documents (pdf, doc, docx), videos, audio
  const allowedImageTypes = /jpeg|jpg|png|gif|webp|svg/;
  const allowedDocTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
  const allowedVideoTypes = /mp4|webm|ogg/;
  const allowedAudioTypes = /mp3|wav|ogg/;
  
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const isImage = allowedImageTypes.test(ext) || file.mimetype.startsWith('image/');
  const isDoc = allowedDocTypes.test(ext) || file.mimetype.includes('pdf') || file.mimetype.includes('document') || file.mimetype.includes('spreadsheet') || file.mimetype.includes('presentation');
  const isVideo = allowedVideoTypes.test(ext) || file.mimetype.startsWith('video/');
  const isAudio = allowedAudioTypes.test(ext) || file.mimetype.startsWith('audio/');

  if (isImage || isDoc || isVideo || isAudio) {
    return cb(null, true);
  } else {
    cb(new Error('Loại file không được hỗ trợ. Chỉ cho phép: ảnh, tài liệu, video, audio'));
  }
};

// Cấu hình multer cho media library
// Giới hạn 50MB để hỗ trợ video (ảnh và audio vẫn có thể upload nhỏ hơn)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB (để hỗ trợ video)
  },
  fileFilter: fileFilter,
});

// Cấu hình storage riêng cho ảnh news (không phân folder)
const newsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, newsUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const newsUpload = multer({
  storage: newsStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: fileFilter,
});

// Middleware upload cho media library
const uploadSingle = upload.single('file'); // Đổi từ 'image' thành 'file' để hỗ trợ nhiều loại
const uploadMultiple = upload.array('files', 10); // Upload nhiều file cùng lúc

// Middleware upload riêng cho ảnh news (API /upload/image)
const uploadNewsSingle = newsUpload.single('file');

// Middleware xử lý lỗi upload
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      // Kiểm tra loại file để hiển thị thông báo phù hợp
      const file = req.file || (req.files && req.files[0]);
      const isVideo = file && (file.mimetype?.startsWith('video/') || /mp4|webm|ogg/i.test(file.originalname));
      
      return res.status(400).json({
        success: false,
        message: isVideo 
          ? 'File video quá lớn. Kích thước tối đa là 50MB'
          : 'File quá lớn. Kích thước tối đa là 50MB',
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Có lỗi xảy ra khi upload file',
    });
  }
  next();
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadNewsSingle,
  handleUploadError,
};
