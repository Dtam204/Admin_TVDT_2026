-- ============================================================================
-- LIBRARY & COURSES MANAGEMENT SYSTEM - Complete Database Schema
-- PostgreSQL 14+
-- ============================================================================
-- Modules:
-- 1. Core System (Roles, Users, Permissions)
-- 2. News Management
-- 3. Contact Management  
-- 4. Homepage Management
-- 5. Media Library
-- 6. Menu Management
-- 7. SEO Management
-- 8. Site Settings
-- 9. PHASE 1: Books Management (Books, Authors, Publishers, Categories)
-- 10. PHASE 1: Courses Management (Courses, Instructors, Categories)
-- 11. PHASE 1: Members Management
-- 12. PHASE 1: Book Loans
-- 13. PHASE 1: Payments
-- ============================================================================

-- Function để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Kích hoạt tiện ích sinh UUID (Dùng cho Phase Next Gen)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 0. NEXT GEN: LIBRARIES & COLLECTIONS (UUID Based)
-- ============================================================================

-- Bảng libraries (Thư viện/Kho tổng)
CREATE TABLE IF NOT EXISTS libraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng storages (Kho lưu trữ chi tiết)
CREATE TABLE IF NOT EXISTS storages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID REFERENCES libraries(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng collections (Bộ sưu tập/Thể loại cấp cao)
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES collections(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50), 
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 1. CORE SYSTEM: ROLES, USERS, PERMISSIONS
-- ============================================================================

-- Bảng roles (vai trò người dùng)
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active);

DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Bảng users (người dùng)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Bảng permissions (quyền chi tiết)
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  module VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_active ON permissions(is_active);

-- Bảng role_permissions (gán quyền cho vai trò)
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- ============================================================================
-- 2. NEWS MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS news_categories (
  code VARCHAR(100) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_code VARCHAR(100) REFERENCES news_categories(code) ON UPDATE CASCADE ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_categories_parent_code ON news_categories(parent_code);

CREATE TABLE IF NOT EXISTS news (
  id SERIAL PRIMARY KEY,
  category_code VARCHAR(100) REFERENCES news_categories(code) ON UPDATE CASCADE ON DELETE SET NULL,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  thumbnail VARCHAR(500),
  views INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
CREATE INDEX IF NOT EXISTS idx_news_category_code ON news(category_code);
CREATE INDEX IF NOT EXISTS idx_news_author_id ON news(author_id);
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at);
CREATE INDEX IF NOT EXISTS idx_news_is_featured ON news(is_featured) WHERE is_featured = TRUE;

DROP TRIGGER IF EXISTS update_news_updated_at ON news;
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. CONTACT MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS contact_requests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company VARCHAR(255),
  subject VARCHAR(500),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'processing', 'resolved', 'closed')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON contact_requests(created_at);

DROP TRIGGER IF EXISTS update_contact_requests_updated_at ON contact_requests;
CREATE TRIGGER update_contact_requests_updated_at BEFORE UPDATE ON contact_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. HOMEPAGE MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS homepage_sections (
  id SERIAL PRIMARY KEY,
  section_key VARCHAR(100) NOT NULL UNIQUE,
  section_type VARCHAR(50) NOT NULL,
  section_name TEXT NOT NULL,
  section_data JSONB,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_homepage_sections_key ON homepage_sections(section_key);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_type ON homepage_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_active ON homepage_sections(is_active);

DROP TRIGGER IF EXISTS update_homepage_sections_updated_at ON homepage_sections;
CREATE TRIGGER update_homepage_sections_updated_at BEFORE UPDATE ON homepage_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. MEDIA LIBRARY
-- ============================================================================

CREATE TABLE IF NOT EXISTS media_folders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  parent_id INTEGER REFERENCES media_folders(id) ON DELETE CASCADE,
  description TEXT,
  total_files INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_folders_parent_id ON media_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_media_folders_slug ON media_folders(slug);

DROP TRIGGER IF EXISTS update_media_folders_updated_at ON media_folders;
CREATE TRIGGER update_media_folders_updated_at BEFORE UPDATE ON media_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS media_files (
  id SERIAL PRIMARY KEY,
  folder_id INTEGER REFERENCES media_folders(id) ON DELETE SET NULL,
  original_name VARCHAR(500) NOT NULL,
  filename VARCHAR(500) NOT NULL UNIQUE,
  file_path VARCHAR(1000) NOT NULL,
  file_url VARCHAR(1000) NOT NULL,
  mime_type VARCHAR(100),
  file_size BIGINT,
  dimensions VARCHAR(50),
  alt_text VARCHAR(500),
  title VARCHAR(500),
  description TEXT,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_files_folder_id ON media_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_media_files_filename ON media_files(filename);
CREATE INDEX IF NOT EXISTS idx_media_files_mime_type ON media_files(mime_type);
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON media_files(uploaded_by);

DROP TRIGGER IF EXISTS update_media_files_updated_at ON media_files;
CREATE TRIGGER update_media_files_updated_at BEFORE UPDATE ON media_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. MENU MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS menus (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_menus_code ON menus(code);
CREATE INDEX IF NOT EXISTS idx_menus_location ON menus(location);

DROP TRIGGER IF EXISTS update_menus_updated_at ON menus;
CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url VARCHAR(500),
  target VARCHAR(20) DEFAULT '_self',
  icon VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id ON menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_parent_id ON menu_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort_order ON menu_items(sort_order);

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. SEO MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS seo_pages (
  id SERIAL PRIMARY KEY,
  page_path VARCHAR(500) NOT NULL UNIQUE,
  page_type VARCHAR(50),
  title TEXT,
  description TEXT,
  keywords TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image VARCHAR(500),
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image VARCHAR(500),
  canonical_url VARCHAR(500),
  robots VARCHAR(100) DEFAULT 'index,follow',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seo_pages_path ON seo_pages(page_path);
CREATE INDEX IF NOT EXISTS idx_seo_pages_type ON seo_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_seo_pages_active ON seo_pages(is_active);

DROP TRIGGER IF EXISTS update_seo_pages_updated_at ON seo_pages;
CREATE TRIGGER update_seo_pages_updated_at BEFORE UPDATE ON seo_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. SITE SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'text',
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_site_settings_category ON site_settings(category);

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. PHASE 1: BOOKS MANAGEMENT
-- ============================================================================

-- 9.1. Publishers (Nhà xuất bản)
CREATE TABLE IF NOT EXISTS publishers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo VARCHAR(500),
  description TEXT,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(500),
  total_books INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_publishers_slug ON publishers(slug);
CREATE INDEX IF NOT EXISTS idx_publishers_status ON publishers(status);

DROP TRIGGER IF EXISTS update_publishers_updated_at ON publishers;
CREATE TRIGGER update_publishers_updated_at BEFORE UPDATE ON publishers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9.2. Authors (Tác giả)
CREATE TABLE IF NOT EXISTS authors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  pseudonyms TEXT,
  professional_title VARCHAR(255),
  gender VARCHAR(20),
  bio TEXT,
  avatar VARCHAR(500),
  cover_image VARCHAR(500),
  birth_year INTEGER,
  death_year INTEGER,
  nationality VARCHAR(100),
  birth_place VARCHAR(255),
  education TEXT,
  awards TEXT,
  career_highlights TEXT,
  website VARCHAR(500),
  social_links JSONB,
  total_books INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_authors_slug ON authors(slug);
CREATE INDEX IF NOT EXISTS idx_authors_featured ON authors(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_authors_status ON authors(status);

DROP TRIGGER IF EXISTS update_authors_updated_at ON authors;
CREATE TRIGGER update_authors_updated_at BEFORE UPDATE ON authors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9.3. Book Categories (Thể loại sách)
CREATE TABLE IF NOT EXISTS book_categories (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  parent_id INTEGER REFERENCES book_categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  total_books INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_book_categories_slug ON book_categories(slug);
CREATE INDEX IF NOT EXISTS idx_book_categories_code ON book_categories(code);
CREATE INDEX IF NOT EXISTS idx_book_categories_parent ON book_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_book_categories_status ON book_categories(status);

DROP TRIGGER IF EXISTS update_book_categories_updated_at ON book_categories;
CREATE TRIGGER update_book_categories_updated_at BEFORE UPDATE ON book_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9.4. Books (Sách)
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  isbn VARCHAR(50) UNIQUE NOT NULL,
  code VARCHAR(50) UNIQUE, -- Mã quản lý nội bộ (Next Gen)
  title TEXT NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  author TEXT,
  publisher_id INTEGER REFERENCES publishers(id) ON DELETE SET NULL,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL, -- Liên kết Bộ sưu tập mới
  description TEXT,
  cover_image VARCHAR(500),
  publication_year INTEGER,
  language VARCHAR(10) DEFAULT 'vi',
  pages INTEGER,
  format VARCHAR(20) DEFAULT 'paperback' CHECK (format IN ('hardcover', 'paperback', 'ebook', 'audiobook')),
  quantity INTEGER DEFAULT 0,
  available_quantity INTEGER DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  rental_price DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'available',
  cooperation_status VARCHAR(50) DEFAULT 'cooperating', -- Trạng thái hợp tác
  media_type VARCHAR(50) DEFAULT 'Physical', -- Physical, Digital, Hybrid
  access_policy VARCHAR(50) DEFAULT 'public', -- Danh mục yêu cầu thẻ (basic, vip...)
  edition VARCHAR(100), -- Tái bản/Phiên bản
  volume VARCHAR(50), -- Tập
  dimensions VARCHAR(100), -- Kích thước
  keywords TEXT, -- Từ khóa tìm kiếm
  digital_content JSONB, -- Nội dung số chi tiết
  toc TEXT, -- Mục lục
  featured BOOLEAN DEFAULT false,
  rating_average DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_borrowed INTEGER DEFAULT 0,
  location VARCHAR(100),
  is_digital BOOLEAN DEFAULT false,
  digital_file_url TEXT,
  isbd_content TEXT,
  ai_summary TEXT,
  dominant_color VARCHAR(20),
  trending_score NUMERIC(5,2) DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_slug ON books(slug);
CREATE INDEX IF NOT EXISTS idx_books_publisher ON books(publisher_id);
CREATE INDEX IF NOT EXISTS idx_books_status_featured ON books(status, featured);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);

DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9.5. Book Authors Junction (Many-to-Many)
CREATE TABLE IF NOT EXISTS book_authors (
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  author_id INTEGER REFERENCES authors(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (book_id, author_id)
);

CREATE INDEX IF NOT EXISTS idx_book_authors_book ON book_authors(book_id);
CREATE INDEX IF NOT EXISTS idx_book_authors_author ON book_authors(author_id);

-- 9.6. Book Category Books Junction (Many-to-Many)
CREATE TABLE IF NOT EXISTS book_category_books (
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES book_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_book_category_books_book ON book_category_books(book_id);
CREATE INDEX IF NOT EXISTS idx_book_category_books_category ON book_category_books(category_id);

-- ============================================================================
-- 10. PHASE 1: COURSES MANAGEMENT
-- ============================================================================

-- 10.1. Course Categories (Danh mục khóa học)
CREATE TABLE IF NOT EXISTS course_categories (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  parent_id INTEGER REFERENCES course_categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  total_courses INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_course_categories_slug ON course_categories(slug);
CREATE INDEX IF NOT EXISTS idx_course_categories_code ON course_categories(code);
CREATE INDEX IF NOT EXISTS idx_course_categories_parent ON course_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_course_categories_status ON course_categories(status);

DROP TRIGGER IF EXISTS update_course_categories_updated_at ON course_categories;
CREATE TRIGGER update_course_categories_updated_at BEFORE UPDATE ON course_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10.2. Instructors (Giảng viên)
CREATE TABLE IF NOT EXISTS instructors (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255),
  bio TEXT,
  avatar VARCHAR(500),
  expertise TEXT,
  social_links JSONB,
  total_courses INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_instructors_slug ON instructors(slug);
CREATE INDEX IF NOT EXISTS idx_instructors_user ON instructors(user_id);
CREATE INDEX IF NOT EXISTS idx_instructors_featured ON instructors(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_instructors_status ON instructors(status);

DROP TRIGGER IF EXISTS update_instructors_updated_at ON instructors;
CREATE TRIGGER update_instructors_updated_at BEFORE UPDATE ON instructors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10.3. Courses (Khóa học)
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  thumbnail VARCHAR(500),
  preview_video VARCHAR(500),
  level VARCHAR(20) DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  language VARCHAR(10) DEFAULT 'vi',
  duration_hours DECIMAL(5,2) DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  discount_price DECIMAL(10,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  certificate BOOLEAN DEFAULT false,
  requirements TEXT,
  what_you_learn TEXT,
  target_audience TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured BOOLEAN DEFAULT false,
  rating_average DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_enrolled INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_status_featured ON courses(status, featured);
CREATE INDEX IF NOT EXISTS idx_courses_title ON courses(title);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10.4. Course Instructors Junction (Many-to-Many)
CREATE TABLE IF NOT EXISTS course_instructors (
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id INTEGER REFERENCES instructors(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (course_id, instructor_id)
);

CREATE INDEX IF NOT EXISTS idx_course_instructors_course ON course_instructors(course_id);
CREATE INDEX IF NOT EXISTS idx_course_instructors_instructor ON course_instructors(instructor_id);

-- 10.5. Course Category Courses Junction (Many-to-Many)
CREATE TABLE IF NOT EXISTS course_category_courses (
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES course_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_course_category_courses_course ON course_category_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_course_category_courses_category ON course_category_courses(category_id);

-- ============================================================================
-- 11. PHASE 1: MEMBERS MANAGEMENT
-- ============================================================================

-- 11.1. Membership Plans (Gói thành viên)
CREATE TABLE IF NOT EXISTS membership_plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  tier_code VARCHAR(50) DEFAULT 'basic', -- Cấp độ (basic, premium, vip,...)
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  duration_days INTEGER DEFAULT 30,
  late_fee_per_day DECIMAL(10,2) DEFAULT 5000, -- Phí phạt quá hạn mặc định
  features TEXT,
  max_books_borrowed INTEGER DEFAULT 3,
  max_concurrent_courses INTEGER DEFAULT 1,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  priority_support BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_membership_plans_slug ON membership_plans(slug);
CREATE INDEX IF NOT EXISTS idx_membership_plans_status ON membership_plans(status);

DROP TRIGGER IF EXISTS update_membership_plans_updated_at ON membership_plans;
CREATE TRIGGER update_membership_plans_updated_at BEFORE UPDATE ON membership_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11.2. Members (Độc giả/Học viên)
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  card_number VARCHAR(50) UNIQUE, -- Mã số thẻ thư viện
  identity_number VARCHAR(50), -- CCCD/CMND
  avatar VARCHAR(500),
  date_of_birth DATE,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  membership_plan_id INTEGER REFERENCES membership_plans(id) ON DELETE SET NULL,
  membership_expires DATE,
  card_type_id INTEGER, -- Liên kết loại thẻ
  issued_date DATE, -- Ngày cấp thẻ
  is_verified BOOLEAN DEFAULT false,
  total_books_borrowed INTEGER DEFAULT 0,
  total_courses_enrolled INTEGER DEFAULT 0,
  total_courses_completed INTEGER DEFAULT 0,
  balance DECIMAL(10,2) DEFAULT 0, -- Số dư ví (Đổi tên từ wallet_balance)
  points INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_plan ON members(membership_plan_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);

DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11.3. Membership Requests (Flow phê duyệt & SePay)
CREATE TABLE IF NOT EXISTS membership_requests (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES membership_plans(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    amount DECIMAL(15, 2), -- Số tiền chốt tại thời điểm đăng ký
    transaction_id VARCHAR(100), -- Mã giao dịch từ SePay/Ngân hàng
    gateway VARCHAR(50),
    request_note TEXT,
    admin_note TEXT,
    manual_days_approved INTEGER,
    processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_membership_requests_member ON membership_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_membership_requests_status ON membership_requests(status);
CREATE INDEX IF NOT EXISTS idx_membership_requests_txn ON membership_requests(transaction_id);

DROP TRIGGER IF EXISTS update_membership_requests_updated_at ON membership_requests;
CREATE TRIGGER update_membership_requests_updated_at BEFORE UPDATE ON membership_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11.4. Member Activity & Card Transactions
CREATE TABLE IF NOT EXISTS member_activities (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS member_transactions (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'deposit', 'membership_fee', 'fine', 'refund'
    description TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 16. PHASE 2: DIGITAL LIBRARY - REPOSITORIES & CONTENT
-- ============================================================================

-- Bảng Bản sao (publication_copies) - Kết nối Hybrid giữa SERIAL books và UUID storages
CREATE TABLE IF NOT EXISTS publication_copies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    storage_id UUID REFERENCES storages(id) ON DELETE SET NULL,
    barcode VARCHAR(100) UNIQUE,
    copy_number VARCHAR(100),
    price NUMERIC(15,2),
    status VARCHAR(50) DEFAULT 'available',
    added_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Bookmarks (Digital Reading)
CREATE TABLE IF NOT EXISTS publication_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    page_number INTEGER NOT NULL,
    parent_id UUID REFERENCES publication_bookmarks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Pages (Digital Content for SEARCH & AI)
CREATE TABLE IF NOT EXISTS publication_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    content TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(publication_id, page_number)
);

-- ============================================================================
-- 12. PHASE 1: BOOK LOANS
-- ============================================================================

CREATE TABLE IF NOT EXISTS book_loans (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  copy_id UUID REFERENCES publication_copies(id) ON DELETE SET NULL, -- Liên kết bản sao UUID
  ma_dang_ky_ca_biet VARCHAR(100), -- Barcode bản sao
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, 
  loan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  return_date DATE,
  approved_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'borrowed' CHECK (status IN ('pending', 'borrowing', 'borrowed', 'returned', 'overdue', 'lost', 'rejected')),
  late_fee DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  staff_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_book_loans_member ON book_loans(member_id);
CREATE INDEX IF NOT EXISTS idx_book_loans_book ON book_loans(book_id);
CREATE INDEX IF NOT EXISTS idx_book_loans_status_due ON book_loans(status, due_date);
CREATE INDEX IF NOT EXISTS idx_book_loans_staff ON book_loans(staff_id);

DROP TRIGGER IF EXISTS update_book_loans_updated_at ON book_loans;
CREATE TRIGGER update_book_loans_updated_at BEFORE UPDATE ON book_loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 13. PHASE 1: PAYMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL, -- 'course', 'membership', 'book_rental', 'fee_penalty', 'wallet_deposit', ...
  related_id INTEGER,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'VND',
  payment_method VARCHAR(50) DEFAULT 'bank_transfer',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_gateway VARCHAR(50),
  gateway_response JSONB,
  notes TEXT,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_member ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at);

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13.1. Payment Metadata Sync (Webhook + Reconcile)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS external_txn_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_content TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'manual';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payer_info JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_payments_external_txn ON payments(external_txn_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_external_txn_not_null
  ON payments(external_txn_id)
  WHERE external_txn_id IS NOT NULL;

-- 13.2. Wallet Deposit Orders (Order-based top-up)
CREATE TABLE IF NOT EXISTS wallet_deposit_orders (
  id BIGSERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  client_reference VARCHAR(80) NOT NULL UNIQUE,
  transfer_code VARCHAR(80) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'credited', 'failed', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  matched_external_txn_id VARCHAR(100),
  credited_at TIMESTAMPTZ,
  failure_reason TEXT,
  webhook_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_deposit_orders_member ON wallet_deposit_orders(member_id);
CREATE INDEX IF NOT EXISTS idx_wallet_deposit_orders_status ON wallet_deposit_orders(status);
CREATE INDEX IF NOT EXISTS idx_wallet_deposit_orders_expires ON wallet_deposit_orders(expires_at);

DROP TRIGGER IF EXISTS update_wallet_deposit_orders_updated_at ON wallet_deposit_orders;
CREATE TRIGGER update_wallet_deposit_orders_updated_at BEFORE UPDATE ON wallet_deposit_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13.3. Webhook Event Ledger (Idempotency + Audit)
CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(30) NOT NULL,
  external_txn_id VARCHAR(120) NOT NULL,
  event_type VARCHAR(50) NOT NULL DEFAULT 'BANK_INBOUND',
  signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
  received_payload JSONB NOT NULL,
  processing_status VARCHAR(20) NOT NULL DEFAULT 'received'
    CHECK (processing_status IN ('received', 'processed', 'ignored', 'duplicated', 'failed')),
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, external_txn_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(processing_status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at);

-- 13.5. Book Reservations (Đặt giữ chỗ)
CREATE TABLE IF NOT EXISTS book_reservations (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'fulfilled', 'cancelled', 'expired')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reservations_book_id ON book_reservations(book_id, status);

DROP TRIGGER IF EXISTS update_book_reservations_updated_at ON book_reservations;
CREATE TRIGGER update_book_reservations_updated_at BEFORE UPDATE ON book_reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 14. PHASE 2: INTERACTION & SOCIAL
-- ============================================================================

-- 14.1. Comments & Replies
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_id INTEGER NOT NULL, -- ID của sách, bài viết, hoặc khóa học
  object_type VARCHAR(50) NOT NULL, -- 'book', 'news', 'course'
  parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  reply_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  rating INTEGER DEFAULT 0, -- Đánh giá sao (Nếu có)
  status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden', 'deleted')),
  is_featured BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_object ON comments(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14.2. Comment Reports
CREATE TABLE IF NOT EXISTS comment_reports (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'processing', 'resolved', 'ignored')),
  resolved_by INTEGER REFERENCES users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14.3. Book Reviews (Đánh giá & Xếp hạng)
CREATE TABLE IF NOT EXISTS book_reviews (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(book_id, member_id)
);

DROP TRIGGER IF EXISTS update_book_reviews_updated_at ON book_reviews;
CREATE TRIGGER update_book_reviews_updated_at BEFORE UPDATE ON book_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14.4. Wishlists (Danh sách yêu thích)
CREATE TABLE IF NOT EXISTS wishlists (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(member_id, book_id)
);

-- ============================================================================
-- 15. PHASE 2: SYSTEM NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'overdue', 'renewal', 'system', 'payment'
    title JSONB NOT NULL,
    message JSONB NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_id INTEGER,
    related_type VARCHAR(50), -- 'book_loan', 'payment', 'membership_request'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_member_id ON notifications(member_id);

-- 14.5. Interaction Logs (Theo dõi hành động để thống kê Dashboard)
CREATE TABLE IF NOT EXISTS interaction_logs (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
    object_id INTEGER NOT NULL, -- ID cá»§a sÃ¡ch, bÃ i viáº¿t, hoáº·c khÃ³a há» c
    object_type VARCHAR(50) NOT NULL, -- 'book', 'news', 'course'
    action_type VARCHAR(50) NOT NULL, -- 'read', 'view', 'download', 'favorite'
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interaction_logs_object ON interaction_logs(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_member ON interaction_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_action ON interaction_logs(action_type);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default roles
INSERT INTO roles (code, name, description, is_default) VALUES
  ('admin', 'Administrator', 'Full system access', false),
  ('editor', 'Editor', 'Content management', false),
  ('user', 'User', 'Regular user', true)
ON CONFLICT (code) DO NOTHING;

-- Insert default admin user
-- Password: admin123 (hashed with bcrypt)
DO $$
DECLARE
  admin_role_id INTEGER;
  admin_user_exists INTEGER;
BEGIN
  -- Get admin role ID
  SELECT id INTO admin_role_id FROM roles WHERE code = 'admin' LIMIT 1;
  
  IF admin_role_id IS NULL THEN
    RAISE NOTICE 'Admin role not found! Skipping admin user creation.';
    RETURN;
  END IF;

  -- Check if admin user already exists
  SELECT COUNT(*) INTO admin_user_exists FROM users WHERE email = 'admin@gmail.com';
  
  IF admin_user_exists = 0 THEN
    -- Insert admin user with hashed password (bcrypt hash of 'admin123')
    INSERT INTO users (email, password, name, role_id, status)
    VALUES (
      'admin@gmail.com',
      '$2b$10$kZqoayUrOovBPrUi2/l7BeAbXwmDPZzpr2rMv9rBIPJkW./BYFpYy', -- admin123
      'Administrator',
      admin_role_id,
      'active'
    );
    RAISE NOTICE 'Admin user created: admin@gmail.com / admin123';
  ELSE
    RAISE NOTICE 'Admin user already exists: admin@gmail.com';
  END IF;
END $$;

-- Insert default permissions
INSERT INTO permissions (code, name, description, module) VALUES
  -- Core
  ('users.view', 'Xem người dùng', 'Xem danh sách người dùng', 'users'),
  ('users.manage', 'Quản lý người dùng', 'Thêm, sửa, xóa người dùng', 'users'),
  ('roles.view', 'Xem vai trò', 'Xem danh sách vai trò', 'roles'),
  ('roles.manage', 'Quản lý vai trò', 'Thêm, sửa, xóa vai trò', 'roles'),
  ('permissions.view', 'Xem quyền', 'Xem danh sách quyền', 'permissions'),
  ('permissions.manage', 'Quản lý quyền', 'Gán quyền cho vai trò', 'permissions'),
  -- News
  ('news.view', 'Xem tin tức', 'Xem danh sách tin tức', 'news'),
  ('news.manage', 'Quản lý tin tức', 'Thêm, sửa, xóa tin tức', 'news'),
  ('news_categories.view', 'Xem danh mục tin', 'Xem danh sách danh mục', 'news'),
  ('news_categories.manage', 'Quản lý danh mục tin', 'Thêm, sửa, xóa danh mục', 'news'),
  -- Contact
  ('contact.view', 'Xem liên hệ', 'Xem yêu cầu liên hệ', 'contact'),
  ('contact.manage', 'Quản lý liên hệ', 'Xử lý yêu cầu liên hệ', 'contact'),
  -- Media
  ('media.view', 'Xem media', 'Xem thư viện media', 'media'),
  ('media.manage', 'Quản lý media', 'Upload, xóa file media', 'media'),
  -- Menus
  ('menus.view', 'Xem menu', 'Xem cấu hình menu', 'menus'),
  ('menus.manage', 'Quản lý menu', 'Thêm, sửa, xóa menu', 'menus'),
  -- SEO
  ('seo.view', 'Xem SEO', 'Xem cấu hình SEO', 'seo'),
  ('seo.manage', 'Quản lý SEO', 'Cập nhật cấu hình SEO', 'seo'),
  -- Settings
  ('settings.view', 'Xem cài đặt', 'Xem cài đặt hệ thống', 'settings'),
  ('settings.manage', 'Quản lý cài đặt', 'Cập nhật cài đặt', 'settings'),
  -- Homepage
  ('homepage.view', 'Xem trang chủ', 'Xem nội dung trang chủ', 'homepage'),
  ('homepage.manage', 'Quản lý trang chủ', 'Cập nhật nội dung trang chủ', 'homepage'),
  -- Books Module
  ('books.view', 'Xem sách', 'Xem danh sách và chi tiết sách', 'books'),
  ('books.manage', 'Quản lý sách', 'Thêm, sửa, xóa sách', 'books'),
  ('authors.view', 'Xem tác giả', 'Xem danh sách tác giả', 'books'),
  ('authors.manage', 'Quản lý tác giả', 'Thêm, sửa, xóa tác giả', 'books'),
  ('book_categories.view', 'Xem thể loại sách', 'Xem danh sách thể loại', 'books'),
  ('book_categories.manage', 'Quản lý thể loại sách', 'Thêm, sửa, xóa thể loại', 'books'),
  ('publishers.view', 'Xem nhà xuất bản', 'Xem danh sách NXB', 'books'),
  ('publishers.manage', 'Quản lý nhà xuất bản', 'Thêm, sửa, xóa NXB', 'books'),
  ('book_loans.view', 'Xem mượn/trả sách', 'Xem lịch sử mượn trả', 'books'),
  ('book_loans.manage', 'Quản lý mượn/trả sách', 'Tạo, cập nhật phiếu mượn', 'books'),
  -- Courses Module
  ('courses.view', 'Xem khóa học', 'Xem danh sách và chi tiết khóa học', 'courses'),
  ('courses.manage', 'Quản lý khóa học', 'Thêm, sửa, xóa khóa học', 'courses'),
  ('course_categories.view', 'Xem danh mục khóa học', 'Xem danh sách danh mục', 'courses'),
  ('course_categories.manage', 'Quản lý danh mục khóa học', 'Thêm, sửa, xóa danh mục', 'courses'),
  ('instructors.view', 'Xem giảng viên', 'Xem danh sách giảng viên', 'courses'),
  ('instructors.manage', 'Quản lý giảng viên', 'Thêm, sửa, xóa giảng viên', 'courses'),
  -- Members Module
  ('members.view', 'Xem thành viên', 'Xem danh sách thành viên', 'members'),
  ('members.manage', 'Quản lý thành viên', 'Thêm, sửa, xóa thành viên', 'members'),
  ('membership_plans.view', 'Xem gói thành viên', 'Xem các gói thành viên', 'members'),
  ('membership_plans.manage', 'Quản lý gói thành viên', 'Thêm, sửa, xóa gói', 'members'),
  -- Payments Module
  ('payments.view', 'Xem thanh toán', 'Xem lịch sử thanh toán', 'payments'),
  ('payments.manage', 'Quản lý thanh toán', 'Xử lý, cập nhật thanh toán', 'payments'),
  -- Phase 2: Interaction & Social
  ('comments.view', 'Xem bình luận', 'Xem danh sách bình luận hệ thống', 'comments'),
  ('comments.manage', 'Quản lý bình luận', 'Phê duyệt, ẩn, xóa bình luận', 'comments'),
  ('comment_reports.manage', 'Quản lý báo cáo', 'Xử lý các báo cáo vi phạm bình luận', 'comments'),
  -- Phase 2: Notifications
  ('notifications.view', 'Xem thông báo', 'Xem thông báo hệ thống', 'notifications'),
  ('notifications.manage', 'Quản lý thông báo', 'Gửi, ẩn thộng báo', 'notifications')
ON CONFLICT (code) DO NOTHING;

-- Assign all permissions to admin role
DO $$
DECLARE
  admin_role_id INTEGER;
  perm RECORD;
BEGIN
  SELECT id INTO admin_role_id FROM roles WHERE code = 'admin' LIMIT 1;
  
  IF admin_role_id IS NULL THEN
    RAISE NOTICE 'Admin role not found!';
    RETURN;
  END IF;

  FOR perm IN SELECT id FROM permissions
  LOOP
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (admin_role_id, perm.id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Assigned all permissions to admin role';
END $$;

-- Insert sample course categories
INSERT INTO course_categories (code, name, slug, description, icon, sort_order, status) VALUES
  (
    'WEBDEV',
    '{"vi": "Lập trình Web", "en": "Web Development", "ja": "Webアプリケーション開発"}',
    'lap-trinh-web',
    '{"vi": "Khóa học về phát triển web", "en": "Web development courses", "ja": "Web開発コース"}',
    'globe',
    1,
    'active'
  ),
  (
    'MOBILE',
    '{"vi": "Lập trình Mobile", "en": "Mobile Development", "ja": "モバイル開発"}',
    'lap-trinh-mobile',
    '{"vi": "Khóa học phát triển ứng dụng di động", "en": "Mobile app development", "ja": "モバイルアプリ開発"}',
    'smartphone',
    2,
    'active'
  ),
  (
    'AI',
    '{"vi": "Trí tuệ nhân tạo", "en": "Artificial Intelligence", "ja": "人工知能"}',
    'tri-tue-nhan-tao',
    '{"vi": "Khóa học về AI và Machine Learning", "en": "AI and ML courses", "ja": "AIと機械学習コース"}',
    'brain',
    3,
    'active'
  ),
  (
    'DESIGN',
    '{"vi": "Thiết kế", "en": "Design", "ja": "デザイン"}',
    'thiet-ke',
    '{"vi": "Khóa học về UI/UX và đồ họa", "en": "UI/UX and graphics courses", "ja": "UI/UXとグラフィックスコース"}',
    'palette',
    4,
    'active'
  ),
  (
    'BUSINESS',
    '{"vi": "Kỹ năng kinh doanh", "en": "Business Skills", "ja": "ビジネススキル"}',
    'ky-nang-kinh-doanh',
    '{"vi": "Khóa học về quản trị và kinh doanh", "en": "Management and business", "ja": "マネジメントとビジネス"}',
    'trending-up',
    5,
    'active'
  )
ON CONFLICT (code) DO NOTHING;

-- Insert sample instructors
INSERT INTO instructors (name, slug, title, bio, expertise, featured, status) VALUES
  (
    '{"vi": "Trần Văn An", "en": "Tran Van An", "ja": "トラン・ヴァン・アン"}',
    'tran-van-an',
    'Senior Full-stack Developer',
    '{"vi": "10 năm kinh nghiệm phát triển web", "en": "10 years web development experience", "ja": "10年のWeb開発経験"}',
    '["React", "Node.js", "PostgreSQL", "AWS"]',
    true,
    'active'
  ),
  (
    '{"vi": "Nguyễn Thị Mai", "en": "Nguyen Thi Mai", "ja": "グエン・ティ・マイ"}',
    'nguyen-thi-mai',
    'UI/UX Design Lead',
    '{"vi": "Chuyên gia thiết kế giao diện", "en": "UI/UX design expert", "ja": "UI/UXデザインエキスパート"}',
    '["Figma", "Adobe XD", "User Research", "Design Systems"]',
    true,
    'active'
  ),
  (
    '{"vi": "Lê Minh Hoàng", "en": "Le Minh Hoang", "ja": "レ・ミン・ホアン"}',
    'le-minh-hoang',
    'AI/ML Engineer',
    '{"vi": "Tiến sĩ về Machine Learning", "en": "PhD in Machine Learning", "ja": "機械学習の博士"}',
    '["Python", "TensorFlow", "PyTorch", "Deep Learning"]',
    true,
    'active'
  )
ON CONFLICT (slug) DO NOTHING;

-- Insert sample courses
INSERT INTO courses (title, slug, description, level, duration_hours, price, discount_price, is_free, status, featured) VALUES
  (
    '{"vi": "React & Next.js - Từ cơ bản đến nâng cao", "en": "React & Next.js - Beginner to Advanced", "ja": "React & Next.js - 初級から上級まで"}',
    'react-nextjs-course',
    '{"vi": "Học React và Next.js từ cơ bản đến xây dựng ứng dụng thực tế", "en": "Learn React and Next.js from basics to real projects", "ja": "ReactとNext.jsを基礎から実際のプロジェクトまで学ぶ"}',
    'beginner',
    40.5,
    1990000,
    1490000,
    false,
    'published',
    true
  ),
  (
    '{"vi": "UI/UX Design Masterclass", "en": "UI/UX Design Masterclass", "ja": "UI/UXデザインマスタークラス"}',
    'uiux-masterclass',
    '{"vi": "Khóa học toàn diện về thiết kế giao diện", "en": "Comprehensive UI/UX design course", "ja": "包括的なUI/UXデザインコース"}',
    'intermediate',
    35.0,
    1790000,
    1290000,
    false,
    'published',
    true
  ),
  (
    '{"vi": "Machine Learning cơ bản", "en": "Machine Learning Basics", "ja": "機械学習の基礎"}',
    'ml-basics',
    '{"vi": "Nhập môn Machine Learning với Python", "en": "Introduction to ML with Python", "ja": "PythonによるML入門"}',
    'beginner',
    30.0,
    1590000,
    990000,
    false,
    'published',
    false
  )
ON CONFLICT (slug) DO NOTHING;

-- Link courses with instructors
INSERT INTO course_instructors (course_id, instructor_id, sort_order)
SELECT c.id, i.id, 0
FROM courses c, instructors i
WHERE c.slug = 'react-nextjs-course' AND i.slug = 'tran-van-an'
ON CONFLICT (course_id, instructor_id) DO NOTHING;

INSERT INTO course_instructors (course_id, instructor_id, sort_order)
SELECT c.id, i.id, 0
FROM courses c, instructors i
WHERE c.slug = 'uiux-masterclass' AND i.slug = 'nguyen-thi-mai'
ON CONFLICT (course_id, instructor_id) DO NOTHING;

INSERT INTO course_instructors (course_id, instructor_id, sort_order)
SELECT c.id, i.id, 0
FROM courses c, instructors i
WHERE c.slug = 'ml-basics' AND i.slug = 'le-minh-hoang'
ON CONFLICT (course_id, instructor_id) DO NOTHING;

-- Link courses with categories
INSERT INTO course_category_courses (course_id, category_id)
SELECT c.id, cc.id
FROM courses c, course_categories cc
WHERE c.slug = 'react-nextjs-course' AND cc.code = 'WEBDEV'
ON CONFLICT (course_id, category_id) DO NOTHING;

INSERT INTO course_category_courses (course_id, category_id)
SELECT c.id, cc.id
FROM courses c, course_categories cc
WHERE c.slug = 'uiux-masterclass' AND cc.code = 'DESIGN'
ON CONFLICT (course_id, category_id) DO NOTHING;

INSERT INTO course_category_courses (course_id, category_id)
SELECT c.id, cc.id
FROM courses c, course_categories cc
WHERE c.slug = 'ml-basics' AND cc.code = 'AI'
ON CONFLICT (course_id, category_id) DO NOTHING;


-- ============================================================================
-- DATABASE OPTIMIZATION - Performance Indexes & Functions
-- ============================================================================

-- ==================== NEWS MODULE OPTIMIZATION ====================

-- Optimize news listing by status and date
CREATE INDEX IF NOT EXISTS idx_news_published_at 
ON news(published_at DESC) WHERE status = 'published';

-- Composite index for status + date queries
CREATE INDEX IF NOT EXISTS idx_news_status_date 
ON news(status, published_at DESC);

-- Optimize slug lookup (already unique but improve performance)
CREATE INDEX IF NOT EXISTS idx_news_slug_status 
ON news(slug, status);

-- Category filter optimization
CREATE INDEX IF NOT EXISTS idx_news_category_status 
ON news(category_code, status, published_at DESC);

-- Full-text search indexes for Vietnamese content
CREATE INDEX IF NOT EXISTS idx_news_title_fts 
ON news USING gin(to_tsvector('simple', title));

CREATE INDEX IF NOT EXISTS idx_news_content_fts 
ON news USING gin(to_tsvector('simple', content));

-- ==================== MEDIA MODULE OPTIMIZATION ====================

-- Optimize media files search by folder and name
CREATE INDEX IF NOT EXISTS idx_media_files_folder_filename 
ON media_files(folder_id, filename);

-- Optimize by file type and date
CREATE INDEX IF NOT EXISTS idx_media_files_type_date 
ON media_files(mime_type, created_at DESC);

-- Optimize folder tree queries
CREATE INDEX IF NOT EXISTS idx_media_folders_parent 
ON media_folders(parent_id, name);

-- ==================== USER & AUTH OPTIMIZATION ====================

-- Composite index for user queries
CREATE INDEX IF NOT EXISTS idx_users_role_status 
ON users(role_id, status);

-- Email lookup (already unique but ensure performance)
CREATE INDEX IF NOT EXISTS idx_users_email_lower 
ON users(LOWER(email));

-- ==================== CONTACT MODULE OPTIMIZATION ====================

-- Optimize contact requests listing
CREATE INDEX IF NOT EXISTS idx_contact_requests_status_date 
ON contact_requests(status, created_at DESC);

-- ==================== SEO MODULE OPTIMIZATION ====================

-- Optimize SEO page lookup
CREATE INDEX IF NOT EXISTS idx_seo_pages_path_type 
ON seo_pages(page_path, page_type);

-- ==================== SETTINGS MODULE OPTIMIZATION ====================

-- Optimize settings lookup by category
CREATE INDEX IF NOT EXISTS idx_settings_category 
ON site_settings(category);

-- ==================== JSONB OPTIMIZATION ====================

-- GIN indexes for JSONB columns (for data field searches)
CREATE INDEX IF NOT EXISTS idx_homepage_sections_data_gin 
ON homepage_sections USING gin(section_data);

-- Note: contact_sections and contact_section_items tables removed
-- Only contact_requests table is used for contact management

-- ==================== PERFORMANCE VIEWS ====================

-- Materialized view for dashboard stats (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM news WHERE status = 'published') as published_news,
  (SELECT COUNT(*) FROM news WHERE status = 'draft') as draft_news,
  (SELECT COUNT(*) FROM contact_requests WHERE status = 'new') as pending_contacts,
  (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
  (SELECT COUNT(*) FROM media_files) as total_files,
  CURRENT_TIMESTAMP as last_updated;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_updated 
ON dashboard_stats(last_updated);

-- Function to refresh dashboard stats (call this periodically or after major updates)
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- ==================== QUERY OPTIMIZATION FUNCTIONS ====================

-- Function to get news with category info (avoid N+1 queries)
CREATE OR REPLACE FUNCTION get_news_with_category(
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0,
  p_status VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id INTEGER,
  title TEXT,
  slug VARCHAR,
  content TEXT,
  summary TEXT,
  category_code VARCHAR,
  category_name TEXT,
  status VARCHAR,
  published_at TIMESTAMP,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.slug,
    n.content,
    n.summary,
    nc.code as category_code,
    nc.name as category_name,
    n.status,
    n.published_at,
    n.created_at
  FROM news n
  LEFT JOIN news_categories nc ON n.category_code = nc.code
  WHERE (p_status IS NULL OR n.status = p_status)
  ORDER BY n.published_at DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ==================== MAINTENANCE ====================

-- Analyze tables to update statistics (run after major data changes)
ANALYZE news;
ANALYZE news_categories;
ANALYZE media_files;
ANALYZE media_folders;
ANALYZE users;
ANALYZE contact_requests;
ANALYZE homepage_sections;
ANALYZE seo_pages;
ANALYZE site_settings;
ANALYZE books;
ANALYZE courses;
ANALYZE members;
ANALYZE payments;
ANALYZE book_loans;

-- ============================================================================
-- COMPLETE!
-- ============================================================================
-- Database schema with all modules is ready!
-- Total tables: 30+
-- Total indexes: 120+
-- Total triggers: 20+
-- Total seed data: 50+ records
-- Performance optimizations: Included
-- ============================================================================
