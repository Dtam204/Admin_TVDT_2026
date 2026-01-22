const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const securityMiddleware = require('./middlewares/security.middleware');
const { apiLimiter, authLimiter, uploadLimiter, translationLimiter } = require('./middlewares/rateLimit.middleware');
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
const translationRoutes = require('./routes/translation.routes');
const healthRoutes = require('./routes/health.routes');
// Phase 1 MVP Routes
const booksRoutes = require('./routes/books.routes');
const authorsRoutes = require('./routes/authors.routes');
const bookCategoriesRoutes = require('./routes/bookCategories.routes');
const publishersRoutes = require('./routes/publishers.routes');
const coursesRoutes = require('./routes/courses.routes');
const courseCategoriesRoutes = require('./routes/courseCategories.routes');
const instructorsRoutes = require('./routes/instructors.routes');
const membersRoutes = require('./routes/members.routes');
const membershipPlansRoutes = require('./routes/membershipPlans.routes');
const bookLoansRoutes = require('./routes/bookLoans.routes');
const paymentsRoutes = require('./routes/payments.routes');
const requireAuth = require('./middlewares/auth.middleware');
const logger = require('./middlewares/logger.middleware');
const notFound = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/error.middleware');
const { swaggerSpec } = require('./config/swagger');
const { testConnection, pool } = require('./config/database');
const { ensureTablesOnce } = require('./utils/ensureMediaTables');
const fs = require('fs');

const app = express();

// Security middleware (helmet) - phải đặt đầu tiên
app.use(securityMiddleware);

// Compression middleware - nén response
app.use(compression());

// CORS
app.use(cors());

// Body parser
app.use(express.json({ limit: '10mb' })); // Giới hạn body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger
app.use(logger);

// Rate limiting cho toàn bộ API
app.use('/api', apiLimiter);

// Serve static files from uploads directory
// Đảm bảo static files được serve trước các routes khác
const uploadsPath = path.join(__dirname, '../uploads');

// Serve static files với options tối ưu
app.use('/uploads', express.static(uploadsPath, {
  dotfiles: 'ignore',
  etag: true,
  index: false,
  maxAge: '1d',
  redirect: false,
  setHeaders: (res, filePath) => {
    // Set proper content-type headers
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (ext === '.png') {
      res.setHeader('Content-Type', 'image/png');
    } else if (ext === '.gif') {
      res.setHeader('Content-Type', 'image/gif');
    } else if (ext === '.webp') {
      res.setHeader('Content-Type', 'image/webp');
    } else if (ext === '.svg') {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
    // Enable CORS for images
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

// Auto-setup database on startup (only if not already initialized)
async function autoSetupDatabase() {
  try {
    // Test connection first
    await testConnection();
    
    // Check if database is already initialized (check for roles table)
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'roles'
      );
    `);
    
    if (!checkResult.rows[0].exists) {
      console.log('📦 Database not initialized. Running auto-setup...');
      console.log('   This will create all tables and seed data.\n');
      
      const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
      if (!fs.existsSync(schemaPath)) {
        console.error('⚠️  Schema file not found:', schemaPath);
        return;
      }
      
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schemaSQL);
      
      console.log('✅ Database auto-setup completed!');
      console.log('   All tables created and seed data inserted.\n');
    } else {
      // Database already initialized, just ensure media tables
      await ensureTablesOnce();
    }
  } catch (error) {
    console.error('⚠️  Database setup warning:', error.message);
    // Don't throw - allow server to start even if setup fails
  }
}

// Run auto-setup on startup (non-blocking)
autoSetupDatabase();

// Đảm bảo bảng media được tạo khi khởi động (fallback)
ensureTablesOnce().then(() => {
}).catch((err) => {
  console.error('⚠️  Media tables setup warning:', err.message);
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Thư viện TN API is running' });
});

// Health check route
app.use('/api', healthRoutes);

// Swagger UI - Chỉ bật trên development hoặc yêu cầu xác thực trên production
if (process.env.NODE_ENV !== 'production') {
  // Development: Swagger không cần auth
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} else {
  // Production: Swagger yêu cầu Bearer token (giống admin routes)
  app.use('/api-docs', requireAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// RESTful routes
// Auth routes with strict rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Admin protected routes
app.use('/api/admin/users', requireAuth, usersRoutes);
app.use('/api/admin/roles', requireAuth, rolesRoutes);
app.use('/api/admin/permissions', requireAuth, permissionsRoutes);
app.use('/api/admin/news', requireAuth, newsRoutes);
app.use('/api/admin/categories', requireAuth, newsCategoriesRoutes);
app.use('/api/admin/menus', requireAuth, menuRoutes);
// Upload routes with upload rate limiting
app.use('/api/admin/upload', uploadLimiter, uploadRoutes);
app.use('/api/admin/media/folders', requireAuth, mediaFoldersRoutes);
app.use('/api/admin/media/files', requireAuth, mediaFilesRoutes);
// Testimonials routes
app.use('/api/admin/testimonials', requireAuth, testimonialsRoutes);
// Homepage routes
app.use('/api/admin/homepage', requireAuth, homepageRoutes);
// Contact routes
app.use('/api/admin/contact', requireAuth, contactRoutes);
// SEO routes
app.use('/api/admin/seo', requireAuth, seoRoutes);
// Settings routes
app.use('/api/admin/settings', requireAuth, settingsRoutes);
// Translation routes with translation rate limiting (AI API costs)
app.use('/api/admin/translate', translationLimiter, translationRoutes);

// ============================================================================
// Phase 1 MVP Routes (Library & Courses System)
// ============================================================================
// Books Module
app.use('/api/admin/books', requireAuth, booksRoutes);
app.use('/api/admin/authors', requireAuth, authorsRoutes);
app.use('/api/admin/book-categories', requireAuth, bookCategoriesRoutes);
app.use('/api/admin/publishers', requireAuth, publishersRoutes);
app.use('/api/admin/book-loans', requireAuth, bookLoansRoutes);

// Courses Module
app.use('/api/admin/courses', requireAuth, coursesRoutes);
app.use('/api/admin/course-categories', requireAuth, courseCategoriesRoutes);
app.use('/api/admin/instructors', requireAuth, instructorsRoutes);

// Members Module
app.use('/api/admin/members', requireAuth, membersRoutes);
app.use('/api/admin/membership-plans', requireAuth, membershipPlansRoutes);

// Payments Module
app.use('/api/admin/payments', requireAuth, paymentsRoutes);

// 404 & error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;




