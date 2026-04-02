-- ============================================================================
-- COMMENT & REPLY SYSTEM - Migration
-- Support tiered comments, moderation, and reporting
-- ============================================================================

-- Bảng comments (lưu trữ bình luận và phản hồi)
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_id INTEGER NOT NULL, -- ID của sách, bài viết, hoặc khóa học
  object_type VARCHAR(50) NOT NULL, -- 'book', 'news', 'course'
  parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE, -- ID của bình luận cha (null nếu là bình luận gốc)
  reply_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- ID người dùng được phản hồi (để tag tên)
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden', 'deleted')),
  is_featured BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index để tối ưu tìm kiếm theo nội dung
CREATE INDEX IF NOT EXISTS idx_comments_object ON comments(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);

-- Trigger cập nhật updated_at
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Bảng comment_reports (lưu trữ báo cáo vi phạm)
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

CREATE INDEX IF NOT EXISTS idx_comment_reports_comment ON comment_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_status ON comment_reports(status);

-- Seed permissions cho việc quản lý bình luận (Admin)
INSERT INTO permissions (code, name, description, module) VALUES
  ('comments.view', 'Xem bình luận', 'Xem danh sách bình luận hệ thống', 'comments'),
  ('comments.manage', 'Quản lý bình luận', 'Phê duyệt, ẩn, xóa bình luận', 'comments'),
  ('comment_reports.manage', 'Quản lý báo cáo', 'Xử lý các báo cáo vi phạm bình luận', 'comments')
ON CONFLICT (code) DO NOTHING;
