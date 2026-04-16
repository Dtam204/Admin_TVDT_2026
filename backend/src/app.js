const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const securityMiddleware = require('./middlewares/security.middleware');
const { apiLimiter, authLimiter, uploadLimiter } = require('./middlewares/rateLimit.middleware');
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const usersRoutes = require('./routes/users.routes');
const rolesRoutes = require('./routes/roles.routes');
const permissionsRoutes = require('./routes/permissions.routes');
const newsRoutes = require('./routes/news.routes');
const newsCategoriesRoutes = require('./routes/newsCategories.routes');
const menuRoutes = require('./routes/menu.routes');
const uploadRoutes = require('./routes/upload.routes');
const mediaFoldersRoutes = require('./routes/mediaFolders.routes');
const mediaFilesRoutes = require('./routes/mediaFiles.routes');
const testimonialsRoutes = require('./routes/testimonials.routes');
const homepageRoutes = require('./routes/homepage.routes');
const contactRoutes = require('./routes/contact.routes');
const seoRoutes = require('./routes/seo.routes');
const settingsRoutes = require('./routes/settings.routes');
const healthRoutes = require('./routes/health.routes');
const membersRoutes = require('./routes/members.routes');
const membershipPlansRoutes = require('./routes/membershipPlans.routes');
const membershipRequestsRoutes = require('./routes/membership_requests.routes');
const paymentsRoutes = require('./routes/payments.routes');
const readerRoutes = require('./routes/reader.routes');
const publicPublicationRoutes = require('./routes/public_publication.routes');
const publicHomeRoutes = require('./routes/public_home.routes');
const publicSearchRoutes = require('./routes/public_search.routes');
const adminPublicationRoutes = require('./routes/admin_publication.routes');
const collectionRoutes = require('./routes/collection.routes');
const authorRoutes = require('./routes/authors.routes');
const publisherRoutes = require('./routes/publishers.routes');
const courseRoutes = require('./routes/courses.routes');
const courseCategoryRoutes = require('./routes/courseCategories.routes');
const borrowRoutes = require('./routes/borrow.routes');
const bookLoansRoutes = require('./routes/bookLoans.routes');
const auditRoutes = require('./routes/audit.routes');
const publicCommentRoutes = require('./routes/public_comment.routes');
const publicResourceRoutes = require('./routes/public_resource.routes');
const publicNotificationRoutes = require('./routes/public_notification.routes');
const adminCommentRoutes = require('./routes/admin_comment.routes');
const publicNewsRoutes = require('./routes/public_news.routes');
const readerActionRoutes = require('./routes/reader_action.routes');
const memberActionsRoutes = require('./routes/member_actions.routes');
const notificationRoutes = require('./routes/admin_notification.routes');
const adminLibraryRoutes = require('./routes/admin_library.routes');
const webhookRoutes = require('./routes/webhook.routes');
const requireAuth = require('./middlewares/auth.middleware');
const { restrictToCMS } = require('./middlewares/rbac.middleware');
const logger = require('./middlewares/logger.middleware');
const { pool } = require('./config/database');
const fs = require('fs');

const app = express();
const configuredCorsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedCorsOrigins = configuredCorsOrigins.length > 0
  ? configuredCorsOrigins
  : [
      "https://thuvientn.site",
      "https://www.thuvientn.site",
      "http://thuvientn.site",
      "http://www.thuvientn.site",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001"
    ];

// Middleware cơ bản
app.use(cors({
  origin: function(origin, callback) {
    // Cho phép request không có origin (curl, postman)
    if (!origin) return callback(null, true);

    if (allowedCorsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options(/.*/, cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedCorsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({
  limit: '100mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(compression());
app.use(logger);

// Chuẩn hóa mọi field locale-like về text thường để tránh hiển thị dạng {"vi": "..."} ở frontend.
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);

  const isLocaleLikeObject = (obj) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    const keys = Object.keys(obj);
    if (keys.length === 0) return false;
    const localeKeys = ['vi', 'en', 'ja', 'text'];
    return keys.every((k) => localeKeys.includes(k));
  };

  const pickText = (obj) => {
    if (typeof obj.text === 'string' && obj.text.trim()) return obj.text;
    if (typeof obj.vi === 'string' && obj.vi.trim()) return obj.vi;
    if (typeof obj.en === 'string' && obj.en.trim()) return obj.en;
    if (typeof obj.ja === 'string' && obj.ja.trim()) return obj.ja;
    const firstString = Object.values(obj).find((v) => typeof v === 'string' && v.trim());
    return firstString || '';
  };

  const normalizePayload = (value) => {
    if (value === null || value === undefined) return value;

    if (value instanceof Date) {
      const time = value.getTime();
      return Number.isNaN(time) ? null : value.toISOString();
    }

    if (Array.isArray(value)) {
      return value.map((item) => normalizePayload(item));
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          const parsed = JSON.parse(trimmed);
          if (isLocaleLikeObject(parsed)) return pickText(parsed);
          return normalizePayload(parsed);
        } catch {
          return value;
        }
      }
      return value;
    }

    if (typeof value === 'object') {
      if (isLocaleLikeObject(value)) {
        return pickText(value);
      }

      const result = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = normalizePayload(val);
      }
      return result;
    }

    return value;
  };

  res.json = (payload) => originalJson(normalizePayload(payload));
  next();
});

app.use((req, res, next) => {
  const originalStatus = res.status;
  res.status = function(code) {
    if (code === 401) {
      console.log(`[401_DETECTED] Path: ${req.url} | Method: ${req.method}`);
      console.trace('401 Trace');
    }
    return originalStatus.apply(this, arguments);
  };
  next();
});

// Cấu hình static folder cho uploads
const uploadsRoot = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}
app.use('/uploads', express.static(uploadsRoot));

// Swagger Documentation (Lazy loaded to optimize startup)
const mountSwaggerDocs = (routePath, specSelector) => {
  app.use(routePath, (req, res, next) => {
    const specs = require('./config/swagger');
    req.swaggerSpec = specSelector(specs);
    next();
  }, swaggerUi.serve, (req, res) => {
    res.send(swaggerUi.generateHTML(req.swaggerSpec));
  });
};

// Đặt route chuyên biệt trước route tổng để tránh bị bắt nhầm bởi /api-docs
mountSwaggerDocs('/api-docs/admin', (specs) => specs.adminSwaggerSpec);
mountSwaggerDocs('/api-docs/app', (specs) => specs.appSwaggerSpec);
mountSwaggerDocs('/api-docs/integration', (specs) => specs.integrationSwaggerSpec);
mountSwaggerDocs('/api-docs', (specs) => specs.swaggerSpec);

/**
 * Middleware: RE-ROUTING VÀ PATCH CHO FRONTEND
 * Giải quyết triệt để 404 cho các endpoint cũ/sai casing
 */
app.use((req, res, next) => {
  const oldUrl = req.url;
  
  // 1. Phân biệt Case cho Publication -> /api/public/publications/
  if (req.url.match(/\/api\/publication/i)) {
    req.url = req.url.replace(/\/api\/publication/i, '/api/public/publications');
  }
  
  // 2. Patch cho Collections trong Publications (nếu frontend vẫn gọi đường dẫn cũ)
  if (req.url === '/api/admin/publications/collections') {
    req.url = '/api/admin/collections';
  }

  // 3. Patch cho upload-pdf cũ
  if (req.url.includes('/publications/upload-pdf')) {
    req.url = '/api/admin/upload/pdf'; 
  }

  // 4. Patch cho /api/Home cũ của .NET sang /api/public/home
  if (req.url.match(/^\/api\/Home\//i)) {
    req.url = req.url.replace(/^\/api\/Home\//i, '/api/public/home/');
  }

  // 5. Patch cho Media (Folders/Files) từ /media/folders sang /media-folders
  if (req.url.match(/\/api\/admin\/media\/folders/i)) {
    req.url = req.url.replace(/\/api\/admin\/media\/folders/i, '/api/admin/media-folders');
  }
  if (req.url.match(/\/api\/admin\/media\/files/i)) {
    req.url = req.url.replace(/\/api\/admin\/media\/files/i, '/api/admin/media-files');
  }

  if (oldUrl !== req.url) {
    console.log(`[Reroute] ${oldUrl} -> ${req.url}`);
  }
  next();
});

// Public Routes
app.use('/api/auth', authRoutes);
app.use('/api/public/publications', publicPublicationRoutes);
app.use('/api/public/home', publicHomeRoutes);
app.use('/api/public/search', publicSearchRoutes);
app.use('/api/public/comments', publicCommentRoutes);
app.use('/api/public/resource', publicResourceRoutes);
app.use('/api/public/notifications', publicNotificationRoutes);
app.use('/api/public/news', publicNewsRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api', healthRoutes);

// Protected Admin Routes Group
const adminRouter = express.Router();

// Middleware bảo mật cho toàn bộ group admin
adminRouter.use(requireAuth);
adminRouter.use(restrictToCMS);

// Gắn các route chức năng
adminRouter.use('/publications', adminPublicationRoutes);
adminRouter.use('/dashboard', dashboardRoutes);
adminRouter.use('/users', usersRoutes);
adminRouter.use('/roles', rolesRoutes);
adminRouter.use('/permissions', permissionsRoutes);
adminRouter.use('/news', newsRoutes);
adminRouter.use('/news-categories', newsCategoriesRoutes);
adminRouter.use('/menu', menuRoutes);
adminRouter.use('/menus', menuRoutes);
adminRouter.use('/upload', uploadRoutes); 
adminRouter.use('/collections', collectionRoutes);
adminRouter.use('/media-folders', mediaFoldersRoutes);
adminRouter.use('/media-files', mediaFilesRoutes);
adminRouter.use('/testimonials', testimonialsRoutes);
adminRouter.use('/homepage', homepageRoutes);
adminRouter.use('/contact', contactRoutes);
adminRouter.use('/seo', seoRoutes);
adminRouter.use('/settings', settingsRoutes);
adminRouter.use('/members', membersRoutes);
adminRouter.use('/membership-plans', membershipPlansRoutes);
adminRouter.use('/membership-requests', membershipRequestsRoutes);
adminRouter.use('/payments', paymentsRoutes);
adminRouter.use('/authors', authorRoutes);
adminRouter.use('/publishers', publisherRoutes);
adminRouter.use('/courses', courseRoutes);
adminRouter.use('/course-categories', courseCategoryRoutes);
adminRouter.use('/audit-logs', auditRoutes);
adminRouter.use('/comments', adminCommentRoutes);
adminRouter.use('/member-actions', memberActionsRoutes);
adminRouter.use('/borrow', borrowRoutes);
adminRouter.use('/book-loans', bookLoansRoutes);
adminRouter.use('/notifications', notificationRoutes);
adminRouter.use('/library', adminLibraryRoutes);

// Mount Admin Router
app.use('/api/admin', adminRouter);
console.log('✅ Admin Router mounted at /api/admin');
app.use('/api/reader', readerRoutes);
app.use('/api/reader/actions', readerActionRoutes);

// Error handling middlware
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  const isDev = process.env.NODE_ENV === 'development';

  console.error(`[Global Error] ${req.method} ${req.url}`);
  console.error('Message:', err.message);
  if (isDev) {
    console.error('Stack:', err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: isDev ? err.message : 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau hoặc liên hệ bộ phận kỹ thuật.',
    code: err.code || statusCode || 500,
    data: null,
    status: statusCode,
    timestamp: new Date().toISOString(),
    path: req.url,
    stack: isDev ? err.stack : undefined
  });
});

module.exports = app;
