/**
 * Seed supplemental sample data for end-to-end admin/app flows.
 * Safe to run multiple times (idempotent).
 */

require('dotenv').config();
const { Pool } = require('pg');

const ADMIN_PASSWORD_HASH = '$2b$10$kZqoayUrOovBPrUi2/l7BeAbXwmDPZzpr2rMv9rBIPJkW./BYFpYy'; // admin123

async function seedSampleData() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'library_tn',
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id BIGSERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      INSERT INTO collections (name, description, order_index, is_active)
      SELECT * FROM (VALUES
        ('Công nghệ số', 'Bộ sưu tập tài liệu công nghệ và lập trình', 1, TRUE),
        ('Quản trị kinh doanh', 'Tài liệu quản trị và kỹ năng nghề nghiệp', 2, TRUE),
        ('Văn hóa đọc', 'Sách phổ thông và kỹ năng mềm', 3, TRUE)
      ) AS v(name, description, order_index, is_active)
      WHERE NOT EXISTS (
        SELECT 1 FROM collections c WHERE c.name = v.name
      );
    `);

    await client.query(`
      INSERT INTO publishers (name, slug, description, status)
      VALUES
        ('NXB Công Nghệ Trẻ', 'nxb-cong-nghe-tre', 'Chuyên sách CNTT và dữ liệu', 'active'),
        ('NXB Học Thuật Mở', 'nxb-hoc-thuat-mo', 'Sách học thuật và kỹ năng nghề', 'active'),
        ('NXB Tri Thức Việt', 'nxb-tri-thuc-viet', 'Sách văn hóa và kỹ năng sống', 'active')
      ON CONFLICT (slug) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO authors (name, slug, bio, nationality, featured, status)
      VALUES
        ('Nguyễn Minh Tâm', 'nguyen-minh-tam', 'Tác giả chuyên sâu về backend và dữ liệu.', 'Việt Nam', TRUE, 'active'),
        ('Lê Gia Hân', 'le-gia-han', 'Chuyên gia product, UX và vận hành số.', 'Việt Nam', FALSE, 'active'),
        ('Trần Quốc Anh', 'tran-quoc-anh', 'Giảng viên kỹ năng quản trị và tài chính cá nhân.', 'Việt Nam', TRUE, 'active')
      ON CONFLICT (slug) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO book_categories (code, name, slug, description, sort_order, status)
      VALUES
        ('CNTT', 'Công nghệ thông tin', 'cong-nghe-thong-tin', 'Tài liệu kỹ thuật số và phần mềm', 1, 'active'),
        ('QTKD', 'Quản trị kinh doanh', 'quan-tri-kinh-doanh', 'Quản trị, vận hành, chiến lược', 2, 'active'),
        ('KYNANG', 'Kỹ năng mềm', 'ky-nang-mem', 'Giao tiếp, học tập và phát triển bản thân', 3, 'active')
      ON CONFLICT (code) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO books (
        isbn, code, title, slug, author, publisher_id, collection_id, description,
        cover_image, publication_year, language, pages, format, quantity, available_quantity,
        price, rental_price, status, cooperation_status, media_type, access_policy, is_digital,
        digital_file_url, metadata, digital_content, toc, featured, dominant_color
      )
      SELECT
        v.isbn,
        v.code,
        v.title,
        v.slug,
        v.author,
        p.id,
        c.id,
        v.description,
        v.cover_image,
        v.publication_year,
        'vi',
        v.pages,
        v.format,
        v.quantity,
        v.available_quantity,
        v.price,
        v.rental_price,
        'available',
        'cooperating',
        v.media_type,
        v.access_policy,
        v.is_digital,
        v.digital_file_url,
        v.metadata::jsonb,
        v.digital_content::jsonb,
        v.toc::jsonb,
        v.featured,
        v.dominant_color
      FROM (
        VALUES
          (
            '9786040010011',
            'PUB-TECH-001',
            'Kiến trúc API thực chiến cho hệ thống thư viện',
            'kien-truc-api-thuc-chien-cho-he-thong-thu-vien',
            'Nguyễn Minh Tâm',
            'nxb-cong-nghe-tre',
            'Công nghệ số',
            'Tài liệu hướng dẫn thiết kế API, chuẩn dữ liệu và tích hợp app.',
            '/uploads/media/sample-book-api.jpg',
            2026,
            220,
            'ebook',
            12,
            8,
            189000,
            12000,
            'Hybrid',
            'premium',
            TRUE,
            '/uploads/pdfs/sample-api-library.pdf',
            '{"preview_pages":[1,2,3,4,5],"trailerInfo":{"url":"https://example.com/trailer/api","provider":"youtube"}}',
            '{"full_text_html":"<h1>Kiến trúc API</h1><p>Nội dung mẫu để test luồng đọc cuộn trên app.</p>"}',
            '[{"title":"Chương 1 - Tổng quan","start_page":1,"end_page":35},{"title":"Chương 2 - Thiết kế dữ liệu","start_page":36,"end_page":120},{"title":"Chương 3 - Triển khai","start_page":121,"end_page":220}]',
            TRUE,
            '#2563eb'
          ),
          (
            '9786040010012',
            'PUB-BIZ-001',
            'Quản trị vận hành thư viện hiện đại',
            'quan-tri-van-hanh-thu-vien-hien-dai',
            'Trần Quốc Anh',
            'nxb-hoc-thuat-mo',
            'Quản trị kinh doanh',
            'Sổ tay quản trị vận hành và KPI cho hệ thống thư viện số.',
            '/uploads/media/sample-book-ops.jpg',
            2025,
            180,
            'paperback',
            20,
            15,
            149000,
            9000,
            'Physical',
            'basic',
            FALSE,
            NULL,
            '{"preview_pages":[1,2,3]}',
            '{}',
            '[{"title":"Phần 1 - Quy trình","start_page":1,"end_page":60},{"title":"Phần 2 - Vận hành","start_page":61,"end_page":180}]',
            FALSE,
            '#16a34a'
          ),
          (
            '9786040010013',
            'PUB-SOFT-001',
            'Kỹ năng học tập số cho người bận rộn',
            'ky-nang-hoc-tap-so-cho-nguoi-ban-ron',
            'Lê Gia Hân',
            'nxb-tri-thuc-viet',
            'Văn hóa đọc',
            'Nội dung kỹ năng mềm phục vụ luồng public news/resource và gợi ý sách.',
            '/uploads/media/sample-book-softskill.jpg',
            2024,
            150,
            'ebook',
            10,
            10,
            99000,
            5000,
            'Digital',
            'basic',
            TRUE,
            '/uploads/pdfs/sample-softskill.pdf',
            '{"preview_pages":[1,2,3,4]}',
            '{"full_text_html":"<h1>Kỹ năng học tập</h1><p>Đây là dữ liệu fulltext mẫu cho app reader.</p>"}',
            '[{"title":"Mở đầu","start_page":1,"end_page":20},{"title":"Kỹ thuật ghi nhớ","start_page":21,"end_page":90},{"title":"Ứng dụng thực tế","start_page":91,"end_page":150}]',
            TRUE,
            '#f97316'
          )
      ) AS v(
        isbn, code, title, slug, author, publisher_slug, collection_name, description,
        cover_image, publication_year, pages, format, quantity, available_quantity,
        price, rental_price, media_type, access_policy, is_digital, digital_file_url,
        metadata, digital_content, toc, featured, dominant_color
      )
      JOIN publishers p ON p.slug = v.publisher_slug
      JOIN collections c ON c.name = v.collection_name
      ON CONFLICT (isbn) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO book_authors (book_id, author_id, sort_order)
      SELECT b.id, a.id, 0
      FROM books b
      JOIN authors a ON (
        (b.slug = 'kien-truc-api-thuc-chien-cho-he-thong-thu-vien' AND a.slug = 'nguyen-minh-tam') OR
        (b.slug = 'quan-tri-van-hanh-thu-vien-hien-dai' AND a.slug = 'tran-quoc-anh') OR
        (b.slug = 'ky-nang-hoc-tap-so-cho-nguoi-ban-ron' AND a.slug = 'le-gia-han')
      )
      ON CONFLICT (book_id, author_id) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO book_category_books (book_id, category_id)
      SELECT b.id, bc.id
      FROM books b
      JOIN book_categories bc ON (
        (b.slug = 'kien-truc-api-thuc-chien-cho-he-thong-thu-vien' AND bc.code = 'CNTT') OR
        (b.slug = 'quan-tri-van-hanh-thu-vien-hien-dai' AND bc.code = 'QTKD') OR
        (b.slug = 'ky-nang-hoc-tap-so-cho-nguoi-ban-ron' AND bc.code = 'KYNANG')
      )
      ON CONFLICT (book_id, category_id) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO publication_copies (
        publication_id, barcode, copy_number, price, status, condition, storage_location_id
      )
      SELECT b.id, v.barcode, v.copy_number, v.price, v.status, 'good',
             (SELECT id FROM storage_locations ORDER BY id LIMIT 1)
      FROM (
        VALUES
          ('kien-truc-api-thuc-chien-cho-he-thong-thu-vien', 'BC-API-001', '1', 189000, 'available'),
          ('kien-truc-api-thuc-chien-cho-he-thong-thu-vien', 'BC-API-002', '2', 189000, 'borrowed'),
          ('quan-tri-van-hanh-thu-vien-hien-dai', 'BC-OPS-001', '1', 149000, 'available'),
          ('quan-tri-van-hanh-thu-vien-hien-dai', 'BC-OPS-002', '2', 149000, 'available'),
          ('ky-nang-hoc-tap-so-cho-nguoi-ban-ron', 'BC-SOFT-001', '1', 99000, 'available')
      ) AS v(book_slug, barcode, copy_number, price, status)
      JOIN books b ON b.slug = v.book_slug
      ON CONFLICT (barcode) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO membership_plans (
        name, slug, tier_code, description, price, duration_days, late_fee_per_day,
        max_books_borrowed, max_concurrent_courses, discount_percentage, priority_support, sort_order, status
      )
      VALUES
        ('Gói Cơ bản', 'goi-co-ban', 'basic', 'Dành cho bạn đọc phổ thông', 0, 365, 5000, 3, 1, 0, FALSE, 1, 'active'),
        ('Gói Premium', 'goi-premium', 'premium', 'Nâng cao quyền đọc online và mượn sách', 199000, 365, 3000, 8, 3, 10, TRUE, 2, 'active'),
        ('Gói VIP', 'goi-vip', 'vip', 'Đầy đủ quyền ưu tiên và hỗ trợ', 399000, 365, 2000, 15, 5, 20, TRUE, 3, 'active')
      ON CONFLICT (slug) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO users (email, password, name, role_id, status)
      SELECT v.email, $1, v.name, r.id, 'active'
      FROM (VALUES
        ('reader.basic@example.com', 'Bạn đọc Cơ bản'),
        ('reader.premium@example.com', 'Bạn đọc Premium'),
        ('reader.vip@example.com', 'Bạn đọc VIP')
      ) AS v(email, name)
      JOIN roles r ON r.code = 'user'
      ON CONFLICT (email) DO NOTHING;
    `, [ADMIN_PASSWORD_HASH]);

    await client.query(`
      INSERT INTO members (
        user_id, full_name, email, phone, card_number, membership_plan_id, membership_expires,
        date_of_birth, gender, address, balance, is_verified, status
      )
      SELECT
        u.id,
        v.full_name,
        v.email,
        v.phone,
        v.card_number,
        mp.id,
        (CURRENT_DATE + (v.expire_days || ' days')::interval)::date,
        v.date_of_birth::date,
        v.gender,
        v.address,
        v.balance::numeric,
        TRUE,
        'active'
      FROM (
        VALUES
          ('reader.basic@example.com', 'Bạn đọc Cơ bản', '0911000001', 'TV0010001', 'goi-co-ban', '2026-01-15', 'female', 'Hà Nội', 120000, 180),
          ('reader.premium@example.com', 'Bạn đọc Premium', '0911000002', 'TV0010002', 'goi-premium', '1998-07-08', 'male', 'Đà Nẵng', 350000, 365),
          ('reader.vip@example.com', 'Bạn đọc VIP', '0911000003', 'TV0010003', 'goi-vip', '1995-11-22', 'other', 'TP. Hồ Chí Minh', 820000, 540)
      ) AS v(email, full_name, phone, card_number, plan_slug, date_of_birth, gender, address, balance, expire_days)
      JOIN users u ON u.email = v.email
      JOIN membership_plans mp ON mp.slug = v.plan_slug
      WHERE NOT EXISTS (SELECT 1 FROM members m WHERE m.email = v.email);
    `);

    await client.query(`
      INSERT INTO membership_requests (
        member_id, plan_id, status, amount, transaction_id, gateway,
        request_note, admin_note, manual_days_approved, processed_by, processed_at
      )
      SELECT
        m.id,
        mp.id,
        v.status,
        v.amount::numeric,
        v.txn_id,
        'SEPAY',
        v.request_note,
        v.admin_note,
        v.manual_days_approved,
        (SELECT id FROM users WHERE email = 'admin@gmail.com' LIMIT 1),
        CASE WHEN v.status = 'approved' THEN CURRENT_TIMESTAMP - interval '2 day' ELSE NULL END
      FROM (
        VALUES
          ('reader.premium@example.com', 'goi-vip', 'pending', 399000, 'SEPAY-MEM-0001', 'Xin nâng cấp lên VIP trong tháng này', NULL, NULL),
          ('reader.basic@example.com', 'goi-premium', 'approved', 199000, 'SEPAY-MEM-0002', 'Đăng ký gói Premium', 'Đã đối soát thành công', 365)
      ) AS v(member_email, plan_slug, status, amount, txn_id, request_note, admin_note, manual_days_approved)
      JOIN members m ON m.email = v.member_email
      JOIN membership_plans mp ON mp.slug = v.plan_slug
      WHERE NOT EXISTS (
        SELECT 1 FROM membership_requests mr WHERE mr.transaction_id = v.txn_id
      );
    `);

    await client.query(`
      INSERT INTO book_loans (
        member_id, book_id, copy_id, ma_dang_ky_ca_biet, loan_date, due_date, return_date,
        approved_at, status, late_fee, notes, staff_id
      )
      SELECT
        m.id,
        b.id,
        pc.id,
        pc.barcode,
        v.loan_date::date,
        v.due_date::date,
        v.return_date::date,
        CURRENT_TIMESTAMP - interval '3 day',
        v.status,
        v.late_fee::numeric,
        v.notes,
        (SELECT id FROM users WHERE email = 'admin@gmail.com' LIMIT 1)
      FROM (
        VALUES
          ('reader.basic@example.com', 'quan-tri-van-hanh-thu-vien-hien-dai', 'BC-OPS-001', CURRENT_DATE - 20, CURRENT_DATE - 5, NULL, 'overdue', 25000, 'seed-loan-overdue'),
          ('reader.premium@example.com', 'kien-truc-api-thuc-chien-cho-he-thong-thu-vien', 'BC-API-002', CURRENT_DATE - 8, CURRENT_DATE + 7, NULL, 'borrowing', 0, 'seed-loan-borrowing'),
          ('reader.vip@example.com', 'ky-nang-hoc-tap-so-cho-nguoi-ban-ron', 'BC-SOFT-001', CURRENT_DATE - 25, CURRENT_DATE - 10, CURRENT_DATE - 8, 'returned', 0, 'seed-loan-returned')
      ) AS v(member_email, book_slug, barcode, loan_date, due_date, return_date, status, late_fee, notes)
      JOIN members m ON m.email = v.member_email
      JOIN books b ON b.slug = v.book_slug
      LEFT JOIN publication_copies pc ON pc.barcode = v.barcode
      WHERE NOT EXISTS (SELECT 1 FROM book_loans bl WHERE bl.notes = v.notes);
    `);

    await client.query(`
      INSERT INTO payments (
        transaction_id, member_id, type, related_id, amount, currency, payment_method, status,
        payment_gateway, notes, paid_at, external_txn_id, gateway, payment_content, reference_id, sync_status
      )
      SELECT
        v.transaction_id,
        m.id,
        v.type,
        NULL,
        v.amount::numeric,
        'VND',
        'bank_transfer',
        v.status,
        'SEPAY',
        v.notes,
        CASE WHEN v.status = 'completed' THEN CURRENT_TIMESTAMP - interval '1 day' ELSE NULL END,
        v.external_txn_id,
        'SEPAY',
        v.payment_content,
        v.reference_id,
        v.sync_status
      FROM (
        VALUES
          ('PAY-WALLET-0001', 'reader.premium@example.com', 'wallet_deposit', 500000, 'completed', 'Nạp ví thành công', 'BANK-DEP-0001', 'NAPVI TV0010002', 'ORDER-WD-0001', 'automated'),
          ('PAY-MEMBER-0001', 'reader.basic@example.com', 'membership', 199000, 'completed', 'Thanh toán nâng cấp gói', 'BANK-MEM-0001', 'UPGRADE TV0010001', 'MEM-REQ-0002', 'automated'),
          ('PAY-PENALTY-0001', 'reader.basic@example.com', 'fee_penalty', 25000, 'pending', 'Thanh toán phí quá hạn', NULL, 'PHATQUAHAN TV0010001', 'LOAN-OVERDUE-0001', 'manual')
      ) AS v(transaction_id, member_email, type, amount, status, notes, external_txn_id, payment_content, reference_id, sync_status)
      JOIN members m ON m.email = v.member_email
      ON CONFLICT (transaction_id) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO wallet_deposit_orders (
        member_id, amount, client_reference, transfer_code, status, expires_at,
        matched_external_txn_id, credited_at, failure_reason, webhook_payload
      )
      SELECT
        m.id,
        v.amount::numeric,
        v.client_reference,
        v.transfer_code,
        v.status,
        CURRENT_TIMESTAMP + interval '1 day',
        v.matched_external_txn_id,
        CASE WHEN v.status = 'credited' THEN CURRENT_TIMESTAMP - interval '1 day' ELSE NULL END,
        NULL,
        '{"source":"seed-sample-data"}'::jsonb
      FROM (
        VALUES
          ('reader.premium@example.com', 500000, 'ORDER-WD-0001', 'NAPVI-TV0010002-0001', 'credited', 'BANK-DEP-0001'),
          ('reader.vip@example.com', 300000, 'ORDER-WD-0002', 'NAPVI-TV0010003-0002', 'pending', NULL)
      ) AS v(member_email, amount, client_reference, transfer_code, status, matched_external_txn_id)
      JOIN members m ON m.email = v.member_email
      ON CONFLICT (client_reference) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO webhook_events (
        provider, external_txn_id, event_type, signature_valid, received_payload,
        processing_status, error_message, processed_at
      )
      VALUES
        ('SEPAY', 'BANK-DEP-0001', 'BANK_INBOUND', TRUE, '{"amount":500000,"reference":"NAPVI TV0010002"}', 'processed', NULL, CURRENT_TIMESTAMP - interval '1 day'),
        ('SEPAY', 'BANK-MEM-0001', 'BANK_INBOUND', TRUE, '{"amount":199000,"reference":"UPGRADE TV0010001"}', 'processed', NULL, CURRENT_TIMESTAMP - interval '1 day')
      ON CONFLICT (provider, external_txn_id) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO news_categories (code, name, description, is_active)
      VALUES
        ('THONGBAO', 'Thông báo', 'Thông báo vận hành hệ thống thư viện', TRUE),
        ('SUKIEN', 'Sự kiện', 'Tin sự kiện và chương trình cộng đồng', TRUE),
        ('CHUYENDE', 'Chuyên đề', 'Bài viết chuyên sâu về học tập và công nghệ', TRUE)
      ON CONFLICT (code) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO news (
        category_code, author_id, title, slug, summary, content, author, read_time,
        thumbnail, image_url, gallery_images, gallery_position, show_author_box,
        views, is_featured, status, published_at, published_date
      )
      SELECT
        v.category_code,
        (SELECT id FROM users WHERE email = 'admin@gmail.com' LIMIT 1),
        v.title,
        v.slug,
        v.summary,
        v.content,
        'Ban quản trị Thư viện',
        v.read_time,
        v.thumbnail,
        v.image_url,
        v.gallery_images::jsonb,
        'after-content',
        TRUE,
        v.views,
        v.is_featured,
        'published',
        CURRENT_TIMESTAMP - interval '2 day',
        CURRENT_DATE - 2
      FROM (
        VALUES
          (
            'THONGBAO',
            'Hệ thống API và Swagger cho App đã sẵn sàng',
            'he-thong-api-va-swagger-cho-app-da-san-sang',
            'Đội phát triển đã hoàn thiện dữ liệu mẫu để FE app tích hợp nhanh.',
            '<p>Swagger đã có đủ endpoint cho luồng admin, app, reader và webhook.</p><p>Dữ liệu mẫu đã được seed để test end-to-end.</p>',
            '3 phút đọc',
            '/uploads/media/news-swagger-thumb.jpg',
            '/uploads/media/news-swagger-cover.jpg',
            '["/uploads/media/news-swagger-1.jpg"]',
            132,
            TRUE
          ),
          (
            'SUKIEN',
            'Ra mắt khu vực đọc số tại thư viện',
            'ra-mat-khu-vuc-doc-so-tai-thu-vien',
            'Không gian trải nghiệm đọc số được đưa vào vận hành thử nghiệm.',
            '<p>Khu đọc số cho phép truy cập tài liệu số trực tiếp từ app.</p>',
            '2 phút đọc',
            '/uploads/media/news-digital-zone-thumb.jpg',
            '/uploads/media/news-digital-zone-cover.jpg',
            '[]',
            98,
            FALSE
          )
      ) AS v(category_code, title, slug, summary, content, read_time, thumbnail, image_url, gallery_images, views, is_featured)
      ON CONFLICT (slug) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO homepage_sections (section_key, section_type, section_name, section_data, sort_order, is_active)
      VALUES
        ('hero-banner', 'banner', 'Hero Banner', '{"title":"Thư viện số Thừa Thiên","subtitle":"Dữ liệu mẫu sẵn sàng cho app","cta":{"label":"Khám phá ngay","url":"/app"}}'::jsonb, 1, TRUE),
        ('featured-publications', 'publication_list', 'Ấn phẩm nổi bật', '{"source":"featured","limit":6}'::jsonb, 2, TRUE),
        ('latest-news', 'news_list', 'Tin tức mới', '{"source":"published","limit":5}'::jsonb, 3, TRUE)
      ON CONFLICT (section_key) DO UPDATE
      SET section_data = EXCLUDED.section_data,
          is_active = EXCLUDED.is_active,
          updated_at = CURRENT_TIMESTAMP;
    `);

    await client.query(`
      INSERT INTO menus (code, name, location, is_active)
      VALUES
        ('MAIN_MENU', 'Menu chính', 'header', TRUE),
        ('FOOTER_MENU', 'Menu chân trang', 'footer', TRUE)
      ON CONFLICT (code) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO menu_items (menu_id, parent_id, label, url, target, icon, sort_order, is_active)
      SELECT m.id, NULL, v.label, v.url, '_self', v.icon, v.sort_order, TRUE
      FROM (
        VALUES
          ('MAIN_MENU', 'Trang chủ', '/', 'home', 1),
          ('MAIN_MENU', 'Tài nguyên số', '/resources', 'book-open', 2),
          ('MAIN_MENU', 'Tin tức', '/news', 'newspaper', 3),
          ('FOOTER_MENU', 'Giới thiệu', '/about', 'info', 1),
          ('FOOTER_MENU', 'Liên hệ', '/contact', 'phone', 2)
      ) AS v(menu_code, label, url, icon, sort_order)
      JOIN menus m ON m.code = v.menu_code
      WHERE NOT EXISTS (
        SELECT 1 FROM menu_items mi
        WHERE mi.menu_id = m.id AND mi.label = v.label AND COALESCE(mi.url, '') = COALESCE(v.url, '')
      );
    `);

    await client.query(`
      INSERT INTO media_folders (name, slug, description, is_active)
      VALUES
        ('sample-covers', 'sample-covers', 'Ảnh bìa dữ liệu mẫu', TRUE),
        ('sample-news', 'sample-news', 'Ảnh tin tức dữ liệu mẫu', TRUE)
      ON CONFLICT (slug) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO media_files (
        folder_id, original_name, filename, file_path, file_url, file_type, mime_type,
        file_size, title, description, uploaded_by
      )
      SELECT
        mf.id,
        v.original_name,
        v.filename,
        v.file_path,
        v.file_url,
        v.file_type,
        v.mime_type,
        v.file_size,
        v.title,
        v.description,
        (SELECT id FROM users WHERE email = 'admin@gmail.com' LIMIT 1)
      FROM (
        VALUES
          ('sample-covers', 'sample-book-api.jpg', 'sample-book-api.jpg', '/uploads/media/sample-book-api.jpg', '/uploads/media/sample-book-api.jpg', 'image', 'image/jpeg', 128000, 'Ảnh bìa API', 'Ảnh bìa dữ liệu mẫu cho ấn phẩm'),
          ('sample-news', 'news-swagger-cover.jpg', 'news-swagger-cover.jpg', '/uploads/media/news-swagger-cover.jpg', '/uploads/media/news-swagger-cover.jpg', 'image', 'image/jpeg', 98000, 'Ảnh tin Swagger', 'Ảnh minh họa bài viết mẫu')
      ) AS v(folder_slug, original_name, filename, file_path, file_url, file_type, mime_type, file_size, title, description)
      JOIN media_folders mf ON mf.slug = v.folder_slug
      ON CONFLICT (filename) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO contact_requests (name, email, phone, company, subject, message, status, notes)
      SELECT v.*
      FROM (
        VALUES
          ('Nguyễn Văn Bạn Đọc', 'contact.reader@example.com', '0909000001', 'Đại học TN', 'Hỗ trợ tài khoản app', 'Cần cấp lại mật khẩu tài khoản bạn đọc để đăng nhập app.', 'new', NULL),
          ('Phòng CNTT', 'it-support@example.com', '0909000002', 'Thư viện TN', 'Đối soát webhook', 'Kiểm tra trạng thái webhook nạp ví sau khi triển khai.', 'processing', 'Đã tiếp nhận')
      ) AS v(name, email, phone, company, subject, message, status, notes)
      WHERE NOT EXISTS (
        SELECT 1 FROM contact_requests c WHERE c.email = v.email AND c.subject = v.subject
      );
    `);

    await client.query(`
      INSERT INTO comments (user_id, object_id, object_type, content, rating, status, is_featured)
      SELECT
        (SELECT id FROM users WHERE email = 'admin@gmail.com' LIMIT 1),
        b.id,
        'book',
        'Dữ liệu mẫu: nội dung sách rõ ràng, phù hợp để test luồng comment trên app.',
        5,
        'approved',
        TRUE
      FROM books b
      WHERE b.slug = 'kien-truc-api-thuc-chien-cho-he-thong-thu-vien'
        AND NOT EXISTS (
          SELECT 1 FROM comments c
          WHERE c.object_type = 'book'
            AND c.object_id = b.id
            AND c.content LIKE 'Dữ liệu mẫu:%'
        );
    `);

    await client.query(`
      INSERT INTO book_reviews (book_id, member_id, rating, comment, status)
      SELECT
        b.id,
        m.id,
        5,
        'Sách mẫu hữu ích cho kiểm thử giao diện app và thống kê.',
        'published'
      FROM books b
      JOIN members m ON m.email = 'reader.premium@example.com'
      WHERE b.slug = 'kien-truc-api-thuc-chien-cho-he-thong-thu-vien'
      ON CONFLICT (book_id, member_id) DO UPDATE
      SET rating = EXCLUDED.rating,
          comment = EXCLUDED.comment,
          status = EXCLUDED.status,
          updated_at = CURRENT_TIMESTAMP;
    `);

    await client.query(`
      INSERT INTO wishlists (member_id, book_id)
      SELECT m.id, b.id
      FROM members m
      JOIN books b ON b.slug = 'kien-truc-api-thuc-chien-cho-he-thong-thu-vien'
      WHERE m.email = 'reader.vip@example.com'
      ON CONFLICT (member_id, book_id) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO notifications (
        member_id, sender_id, target_type, type, title, message, metadata, status, is_read, related_type
      )
      SELECT
        m.id,
        (SELECT id FROM users WHERE email = 'admin@gmail.com' LIMIT 1),
        'individual',
        'system',
        '{"vi":"Cập nhật dữ liệu mẫu","en":"Sample data updated"}'::jsonb,
        '{"vi":"Tài khoản của bạn đã sẵn sàng để test app.","en":"Your account is ready for app testing."}'::jsonb,
        jsonb_build_object('seed_key', v.seed_key),
        'sent',
        FALSE,
        'membership_request'
      FROM (
        VALUES
          ('reader.basic@example.com', 'sample-noti-basic'),
          ('reader.premium@example.com', 'sample-noti-premium')
      ) AS v(member_email, seed_key)
      JOIN members m ON m.email = v.member_email
      WHERE NOT EXISTS (
        SELECT 1 FROM notifications n WHERE n.metadata->>'seed_key' = v.seed_key
      );
    `);

    await client.query(`
      INSERT INTO interaction_logs (member_id, object_id, object_type, action_type, ip_address, user_agent)
      SELECT
        m.id,
        b.id,
        'book',
        v.action_type,
        '127.0.0.1',
        'seed-script'
      FROM (
        VALUES
          ('reader.basic@example.com', 'kien-truc-api-thuc-chien-cho-he-thong-thu-vien', 'view'),
          ('reader.premium@example.com', 'kien-truc-api-thuc-chien-cho-he-thong-thu-vien', 'download'),
          ('reader.vip@example.com', 'ky-nang-hoc-tap-so-cho-nguoi-ban-ron', 'read')
      ) AS v(member_email, book_slug, action_type)
      JOIN members m ON m.email = v.member_email
      JOIN books b ON b.slug = v.book_slug
      WHERE NOT EXISTS (
        SELECT 1 FROM interaction_logs il
        WHERE il.member_id = m.id
          AND il.object_id = b.id
          AND il.object_type = 'book'
          AND il.action_type = v.action_type
          AND il.user_agent = 'seed-script'
      );
    `);

    // -------------------------------------------------------------------------
    // Extended dataset for full-flow testing (admin/app/reader/webhook)
    // -------------------------------------------------------------------------
    await client.query(`
      INSERT INTO collections (name, description, order_index, is_active)
      SELECT * FROM (VALUES
        ('Khoa học dữ liệu', 'Kho tài liệu Data Science và AI ứng dụng', 4, TRUE),
        ('Ngoại ngữ', 'Tài liệu ngoại ngữ phục vụ học tập và nghiên cứu', 5, TRUE),
        ('Khởi nghiệp', 'Tài liệu chiến lược, vận hành và tăng trưởng startup', 6, TRUE)
      ) AS v(name, description, order_index, is_active)
      WHERE NOT EXISTS (SELECT 1 FROM collections c WHERE c.name = v.name);
    `);

    await client.query(`
      INSERT INTO publishers (name, slug, description, status)
      VALUES
        ('NXB Dữ Liệu Việt', 'nxb-du-lieu-viet', 'Chuyên đề dữ liệu và AI thực hành', 'active'),
        ('NXB Ngoại Ngữ Mở', 'nxb-ngoai-ngu-mo', 'Sách ngoại ngữ chuyên ngành', 'active'),
        ('NXB Khởi Nghiệp Số', 'nxb-khoi-nghiep-so', 'Tài liệu kinh doanh số và startup', 'active')
      ON CONFLICT (slug) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO authors (name, slug, bio, nationality, featured, status)
      VALUES
        ('Phạm Thuỳ Dương', 'pham-thuy-duong', 'Chuyên gia phân tích dữ liệu và trực quan hoá.', 'Việt Nam', TRUE, 'active'),
        ('Hoàng Đức Minh', 'hoang-duc-minh', 'Giảng viên ngoại ngữ ứng dụng trong môi trường số.', 'Việt Nam', FALSE, 'active'),
        ('Vũ Thành Long', 'vu-thanh-long', 'Cố vấn tăng trưởng và chiến lược startup.', 'Việt Nam', TRUE, 'active')
      ON CONFLICT (slug) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO books (
        isbn, code, title, slug, author, publisher_id, collection_id, description,
        cover_image, publication_year, language, pages, format, quantity, available_quantity,
        price, rental_price, status, cooperation_status, media_type, access_policy, is_digital,
        digital_file_url, metadata, digital_content, toc, featured, dominant_color
      )
      SELECT
        v.isbn, v.code, v.title, v.slug, v.author, p.id, c.id, v.description,
        v.cover_image, v.publication_year, v.language, v.pages, v.format, v.quantity, v.available_quantity,
        v.price, v.rental_price, v.status, v.cooperation_status, v.media_type, v.access_policy, v.is_digital,
        v.digital_file_url, v.metadata::jsonb, v.digital_content::jsonb, v.toc::jsonb, v.featured, v.dominant_color
      FROM (
        VALUES
          ('9786040010014', 'PUB-DATA-001', 'Phân tích dữ liệu cho quản trị thư viện', 'phan-tich-du-lieu-cho-quan-tri-thu-vien', 'Phạm Thuỳ Dương', 'nxb-du-lieu-viet', 'Khoa học dữ liệu', 'Ứng dụng dữ liệu vào vận hành thư viện và dashboard.', '/uploads/media/sample-data-1.jpg', 2026, 'vi', 260, 'ebook', 18, 14, 219000, 14000, 'available', 'cooperating', 'Digital', 'premium', TRUE, '/uploads/pdfs/sample-data-1.pdf', '{"preview_pages":[1,2,3,4,5,6]}', '{"full_text_html":"<h1>Data Analytics</h1><p>Dữ liệu mẫu mở rộng cho app reader.</p>"}', '[{"title":"Tổng quan","start_page":1,"end_page":40},{"title":"Kho dữ liệu","start_page":41,"end_page":140},{"title":"Ứng dụng KPI","start_page":141,"end_page":260}]', TRUE, '#0ea5e9'),
          ('9786040010015', 'PUB-ENG-001', 'English for Digital Library Services', 'english-for-digital-library-services', 'Hoàng Đức Minh', 'nxb-ngoai-ngu-mo', 'Ngoại ngữ', 'Tài liệu ngoại ngữ phục vụ nhân sự thư viện số.', '/uploads/media/sample-eng-1.jpg', 2025, 'en', 200, 'paperback', 16, 13, 179000, 11000, 'available', 'cooperating', 'Physical', 'basic', FALSE, NULL, '{"preview_pages":[1,2,3]}', '{}', '[{"title":"Unit 1","start_page":1,"end_page":60},{"title":"Unit 2","start_page":61,"end_page":130},{"title":"Unit 3","start_page":131,"end_page":200}]', FALSE, '#8b5cf6'),
          ('9786040010016', 'PUB-STARTUP-001', 'Khởi nghiệp sản phẩm số từ thư viện', 'khoi-nghiep-san-pham-so-tu-thu-vien', 'Vũ Thành Long', 'nxb-khoi-nghiep-so', 'Khởi nghiệp', 'Chiến lược phát triển sản phẩm số và mô hình dịch vụ tri thức.', '/uploads/media/sample-startup-1.jpg', 2026, 'vi', 240, 'hardcover', 12, 9, 249000, 16000, 'available', 'cooperating', 'Hybrid', 'vip', TRUE, '/uploads/pdfs/sample-startup-1.pdf', '{"preview_pages":[1,2,3,4,5]}', '{"full_text_html":"<h1>Startup Library</h1><p>Nội dung mẫu cho luồng hybrid + vip.</p>"}', '[{"title":"Mô hình dịch vụ","start_page":1,"end_page":90},{"title":"Vận hành","start_page":91,"end_page":170},{"title":"Tăng trưởng","start_page":171,"end_page":240}]', TRUE, '#f59e0b'),
          ('9786040010017', 'PUB-DATA-002', 'Machine Learning cho thư viện số', 'machine-learning-cho-thu-vien-so', 'Phạm Thuỳ Dương', 'nxb-du-lieu-viet', 'Khoa học dữ liệu', 'Nội dung ML thực hành cho nghiệp vụ gợi ý tài nguyên.', '/uploads/media/sample-ml-1.jpg', 2024, 'vi', 310, 'ebook', 10, 8, 269000, 17000, 'available', 'cooperating', 'Digital', 'vip', TRUE, '/uploads/pdfs/sample-ml-1.pdf', '{"preview_pages":[1,2,3,4]}', '{"full_text_html":"<p>ML content sample...</p>"}', '[{"title":"Dữ liệu huấn luyện","start_page":1,"end_page":120},{"title":"Mô hình gợi ý","start_page":121,"end_page":230},{"title":"Triển khai","start_page":231,"end_page":310}]', TRUE, '#14b8a6'),
          ('9786040010018', 'PUB-ENG-002', 'Speaking Skills for Service Desk', 'speaking-skills-for-service-desk', 'Hoàng Đức Minh', 'nxb-ngoai-ngu-mo', 'Ngoại ngữ', 'Kỹ năng giao tiếp cho quầy phục vụ bạn đọc.', '/uploads/media/sample-eng-2.jpg', 2023, 'en', 145, 'paperback', 14, 11, 129000, 7000, 'available', 'cooperating', 'Physical', 'basic', FALSE, NULL, '{"preview_pages":[1,2]}', '{}', '[{"title":"Warm-up","start_page":1,"end_page":45},{"title":"Conversation","start_page":46,"end_page":110},{"title":"Practice","start_page":111,"end_page":145}]', FALSE, '#22c55e'),
          ('9786040010019', 'PUB-LEGACY-001', 'Tài liệu ngưng hợp tác mẫu', 'tai-lieu-ngung-hop-tac-mau', 'Vũ Thành Long', 'nxb-khoi-nghiep-so', 'Khởi nghiệp', 'Ấn phẩm mẫu trạng thái ngưng hợp tác để kiểm tra bộ lọc quản trị.', '/uploads/media/sample-ceased-1.jpg', 2022, 'vi', 120, 'paperback', 6, 0, 99000, 5000, 'archived', 'ceased_cooperation', 'Physical', 'basic', FALSE, NULL, '{"preview_pages":[1]}', '{}', '[]', FALSE, '#6b7280')
      ) AS v(
        isbn, code, title, slug, author, publisher_slug, collection_name, description,
        cover_image, publication_year, language, pages, format, quantity, available_quantity,
        price, rental_price, status, cooperation_status, media_type, access_policy, is_digital,
        digital_file_url, metadata, digital_content, toc, featured, dominant_color
      )
      JOIN publishers p ON p.slug = v.publisher_slug
      JOIN collections c ON c.name = v.collection_name
      ON CONFLICT (isbn) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO book_authors (book_id, author_id, sort_order)
      SELECT b.id, a.id, 0
      FROM books b
      JOIN authors a ON (
        (b.slug = 'phan-tich-du-lieu-cho-quan-tri-thu-vien' AND a.slug = 'pham-thuy-duong') OR
        (b.slug = 'english-for-digital-library-services' AND a.slug = 'hoang-duc-minh') OR
        (b.slug = 'khoi-nghiep-san-pham-so-tu-thu-vien' AND a.slug = 'vu-thanh-long') OR
        (b.slug = 'machine-learning-cho-thu-vien-so' AND a.slug = 'pham-thuy-duong') OR
        (b.slug = 'speaking-skills-for-service-desk' AND a.slug = 'hoang-duc-minh') OR
        (b.slug = 'tai-lieu-ngung-hop-tac-mau' AND a.slug = 'vu-thanh-long')
      )
      ON CONFLICT (book_id, author_id) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO publication_copies (publication_id, barcode, copy_number, price, status, condition, storage_location_id)
      SELECT b.id, v.barcode, v.copy_number, v.price, v.status, v.condition,
             (SELECT id FROM storage_locations ORDER BY id LIMIT 1)
      FROM (
        VALUES
          ('phan-tich-du-lieu-cho-quan-tri-thu-vien', 'BC-DATA-001', '1', 219000, 'available', 'good'),
          ('phan-tich-du-lieu-cho-quan-tri-thu-vien', 'BC-DATA-002', '2', 219000, 'borrowed', 'good'),
          ('english-for-digital-library-services', 'BC-ENG-001', '1', 179000, 'available', 'good'),
          ('english-for-digital-library-services', 'BC-ENG-002', '2', 179000, 'maintenance', 'fair'),
          ('khoi-nghiep-san-pham-so-tu-thu-vien', 'BC-STUP-001', '1', 249000, 'available', 'good'),
          ('machine-learning-cho-thu-vien-so', 'BC-ML-001', '1', 269000, 'available', 'good'),
          ('speaking-skills-for-service-desk', 'BC-ENG2-001', '1', 129000, 'available', 'good'),
          ('tai-lieu-ngung-hop-tac-mau', 'BC-LEG-001', '1', 99000, 'lost', 'poor')
      ) AS v(book_slug, barcode, copy_number, price, status, condition)
      JOIN books b ON b.slug = v.book_slug
      ON CONFLICT (barcode) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO users (email, password, name, role_id, status)
      SELECT v.email, $1, v.name, r.id, 'active'
      FROM (VALUES
        ('reader.alpha@example.com', 'Bạn đọc Alpha'),
        ('reader.beta@example.com', 'Bạn đọc Beta'),
        ('reader.gamma@example.com', 'Bạn đọc Gamma'),
        ('reader.delta@example.com', 'Bạn đọc Delta'),
        ('reader.epsilon@example.com', 'Bạn đọc Epsilon')
      ) AS v(email, name)
      JOIN roles r ON r.code = 'user'
      ON CONFLICT (email) DO NOTHING;
    `, [ADMIN_PASSWORD_HASH]);

    await client.query(`
      INSERT INTO members (
        user_id, full_name, email, phone, card_number, membership_plan_id, membership_expires,
        date_of_birth, gender, address, balance, is_verified, status
      )
      SELECT
        u.id, v.full_name, v.email, v.phone, v.card_number, mp.id,
        (CURRENT_DATE + (v.expire_days || ' days')::interval)::date,
        v.date_of_birth::date, v.gender, v.address, v.balance::numeric, TRUE, v.status
      FROM (
        VALUES
          ('reader.alpha@example.com', 'Bạn đọc Alpha', '0912000001', 'TV0010011', 'goi-co-ban', '2000-03-10', 'female', 'Huế', 90000, 120, 'active'),
          ('reader.beta@example.com', 'Bạn đọc Beta', '0912000002', 'TV0010012', 'goi-premium', '1997-09-21', 'male', 'Quảng Trị', 540000, 400, 'active'),
          ('reader.gamma@example.com', 'Bạn đọc Gamma', '0912000003', 'TV0010013', 'goi-vip', '1994-01-11', 'female', 'Quảng Bình', 980000, 700, 'active'),
          ('reader.delta@example.com', 'Bạn đọc Delta', '0912000004', 'TV0010014', 'goi-co-ban', '2002-12-09', 'male', 'Đà Nẵng', 45000, -20, 'suspended'),
          ('reader.epsilon@example.com', 'Bạn đọc Epsilon', '0912000005', 'TV0010015', 'goi-premium', '1999-05-30', 'other', 'TP.HCM', 210000, 220, 'active')
      ) AS v(email, full_name, phone, card_number, plan_slug, date_of_birth, gender, address, balance, expire_days, status)
      JOIN users u ON u.email = v.email
      JOIN membership_plans mp ON mp.slug = v.plan_slug
      WHERE NOT EXISTS (SELECT 1 FROM members m WHERE m.email = v.email);
    `);

    await client.query(`
      INSERT INTO membership_requests (
        member_id, plan_id, status, amount, transaction_id, gateway, request_note, admin_note, processed_by, processed_at
      )
      SELECT
        m.id, mp.id, v.status, v.amount::numeric, v.txn_id, 'SEPAY', v.request_note, v.admin_note,
        (SELECT id FROM users WHERE email = 'admin@gmail.com' LIMIT 1),
        CASE WHEN v.status IN ('approved','rejected') THEN CURRENT_TIMESTAMP - interval '1 day' ELSE NULL END
      FROM (
        VALUES
          ('reader.alpha@example.com', 'goi-premium', 'pending', 199000, 'SEPAY-MEM-1001', 'Nâng cấp để đọc tài liệu số', NULL),
          ('reader.beta@example.com', 'goi-vip', 'approved', 399000, 'SEPAY-MEM-1002', 'Nâng cấp VIP', 'Đã duyệt tự động'),
          ('reader.delta@example.com', 'goi-premium', 'rejected', 199000, 'SEPAY-MEM-1003', 'Gia hạn khẩn', 'Thiếu thông tin thanh toán')
      ) AS v(member_email, plan_slug, status, amount, txn_id, request_note, admin_note)
      JOIN members m ON m.email = v.member_email
      JOIN membership_plans mp ON mp.slug = v.plan_slug
      WHERE NOT EXISTS (SELECT 1 FROM membership_requests r WHERE r.transaction_id = v.txn_id);
    `);

    await client.query(`
      INSERT INTO book_loans (
        member_id, book_id, copy_id, ma_dang_ky_ca_biet, loan_date, due_date, return_date,
        approved_at, status, late_fee, notes, staff_id
      )
      SELECT
        m.id, b.id, pc.id, pc.barcode, v.loan_date::date, v.due_date::date, v.return_date::date,
        CURRENT_TIMESTAMP - interval '2 day', v.status, v.late_fee::numeric, v.notes,
        (SELECT id FROM users WHERE email = 'admin@gmail.com' LIMIT 1)
      FROM (
        VALUES
          ('reader.alpha@example.com', 'english-for-digital-library-services', 'BC-ENG-001', CURRENT_DATE - 6, CURRENT_DATE + 8, NULL, 'borrowing', 0, 'seed-loan-borrowing-alpha'),
          ('reader.beta@example.com', 'phan-tich-du-lieu-cho-quan-tri-thu-vien', 'BC-DATA-002', CURRENT_DATE - 16, CURRENT_DATE - 1, NULL, 'overdue', 40000, 'seed-loan-overdue-beta'),
          ('reader.gamma@example.com', 'khoi-nghiep-san-pham-so-tu-thu-vien', 'BC-STUP-001', CURRENT_DATE - 5, CURRENT_DATE + 9, NULL, 'pending', 0, 'seed-loan-pending-gamma'),
          ('reader.epsilon@example.com', 'speaking-skills-for-service-desk', 'BC-ENG2-001', CURRENT_DATE - 28, CURRENT_DATE - 14, CURRENT_DATE - 12, 'returned', 0, 'seed-loan-returned-epsilon'),
          ('reader.delta@example.com', 'quan-tri-van-hanh-thu-vien-hien-dai', 'BC-OPS-002', CURRENT_DATE - 60, CURRENT_DATE - 40, NULL, 'lost', 180000, 'seed-loan-lost-delta'),
          ('reader.vip@example.com', 'machine-learning-cho-thu-vien-so', 'BC-ML-001', CURRENT_DATE - 3, CURRENT_DATE + 11, NULL, 'rejected', 0, 'seed-loan-rejected-vip')
      ) AS v(member_email, book_slug, barcode, loan_date, due_date, return_date, status, late_fee, notes)
      JOIN members m ON m.email = v.member_email
      JOIN books b ON b.slug = v.book_slug
      LEFT JOIN publication_copies pc ON pc.barcode = v.barcode
      WHERE NOT EXISTS (SELECT 1 FROM book_loans bl WHERE bl.notes = v.notes);
    `);

    await client.query(`
      INSERT INTO payments (
        transaction_id, member_id, type, amount, status, payment_method, notes, paid_at,
        external_txn_id, gateway, payment_content, reference_id, sync_status, created_at
      )
      SELECT
        v.transaction_id, m.id, v.type, v.amount::numeric, v.status, 'bank_transfer', v.notes,
        CASE WHEN v.status IN ('completed','refunded') THEN CURRENT_TIMESTAMP - interval '1 hour' ELSE NULL END,
        v.external_txn_id, 'SEPAY', v.payment_content, v.reference_id, v.sync_status,
        CURRENT_TIMESTAMP - (v.hours_ago || ' hour')::interval
      FROM (
        VALUES
          ('PAY-WALLET-1001', 'reader.alpha@example.com', 'wallet_deposit', 250000, 'completed', 'Nạp ví thử nghiệm Alpha', 'BANK-DEP-1001', 'NAPVI TV0010011', 'ORDER-WD-1001', 'automated', 3),
          ('PAY-WALLET-1002', 'reader.beta@example.com', 'wallet_deposit', 300000, 'pending', 'Nạp ví chờ xử lý', NULL, 'NAPVI TV0010012', 'ORDER-WD-1002', 'manual', 2),
          ('PAY-COURSE-1001', 'reader.gamma@example.com', 'course', 499000, 'failed', 'Thanh toán khoá học thất bại', 'BANK-CRS-1001', 'COURSE TV0010013', 'COURSE-REF-1001', 'automated', 1),
          ('PAY-MEMBERUP-1001', 'reader.epsilon@example.com', 'membership_upgrade', 199000, 'failed', 'Đơn nâng cấp đã hết hạn (mapped failed)', 'BANK-MUP-1001', 'UPGRADE TV0010015', 'MEM-UP-1001', 'automated', 1),
          ('PAY-MANUAL-1001', 'reader.delta@example.com', 'manual_payment', 120000, 'failed', 'Giao dịch thu quầy bị huỷ (mapped failed)', 'BANK-MAN-1001', 'MANUAL TV0010014', 'MAN-1001', 'manual', 1),
          ('PAY-REFUND-1001', 'reader.premium@example.com', 'refund', 50000, 'refunded', 'Hoàn tiền điều chỉnh', 'BANK-RFD-1001', 'REFUND TV0010002', 'REF-1001', 'automated', 4),
          ('PAY-PENALTY-1001', 'reader.beta@example.com', 'fee_penalty', 40000, 'pending', 'Phí phạt quá hạn #seed', NULL, 'PHAT TV0010012', 'LOAN-OVD-1001', 'manual', 2)
      ) AS v(transaction_id, member_email, type, amount, status, notes, external_txn_id, payment_content, reference_id, sync_status, hours_ago)
      JOIN members m ON m.email = v.member_email
      ON CONFLICT (transaction_id) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO wallet_deposit_orders (
        member_id, amount, client_reference, transfer_code, status, expires_at,
        matched_external_txn_id, credited_at, failure_reason, webhook_payload
      )
      SELECT
        m.id, v.amount::numeric, v.client_reference, v.transfer_code, v.status,
        CURRENT_TIMESTAMP + (v.expire_offset || ' minutes')::interval,
        v.matched_external_txn_id,
        CASE WHEN v.status = 'credited' THEN CURRENT_TIMESTAMP - interval '30 minutes' ELSE NULL END,
        v.failure_reason,
        jsonb_build_object('source','seed-sample-data-extended','case',v.client_reference)
      FROM (
        VALUES
          ('reader.alpha@example.com', 250000, 'ORDER-WD-1001', 'NAPVI-TV0010011-1001', 'credited', 60, 'BANK-DEP-1001', NULL),
          ('reader.beta@example.com', 300000, 'ORDER-WD-1002', 'NAPVI-TV0010012-1002', 'pending', 30, NULL, NULL),
          ('reader.gamma@example.com', 400000, 'ORDER-WD-1003', 'NAPVI-TV0010013-1003', 'failed', 15, NULL, 'Sai số tiền'),
          ('reader.delta@example.com', 150000, 'ORDER-WD-1004', 'NAPVI-TV0010014-1004', 'expired', -15, NULL, 'Quá hạn lệnh nạp'),
          ('reader.epsilon@example.com', 220000, 'ORDER-WD-1005', 'NAPVI-TV0010015-1005', 'cancelled', 20, NULL, 'Hủy theo yêu cầu người dùng')
      ) AS v(member_email, amount, client_reference, transfer_code, status, expire_offset, matched_external_txn_id, failure_reason)
      JOIN members m ON m.email = v.member_email
      ON CONFLICT (client_reference) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO webhook_events (
        provider, external_txn_id, event_type, signature_valid, received_payload,
        processing_status, error_message, processed_at
      )
      VALUES
        ('SEPAY', 'BANK-DEP-1001', 'BANK_INBOUND', TRUE, '{"amount":250000,"reference":"NAPVI TV0010011"}', 'processed', NULL, CURRENT_TIMESTAMP - interval '30 minutes'),
        ('SEPAY', 'BANK-DEP-1002', 'BANK_INBOUND', TRUE, '{"amount":300000,"reference":"NAPVI TV0010012"}', 'received', NULL, NULL),
        ('SEPAY', 'BANK-CRS-1001', 'BANK_INBOUND', TRUE, '{"amount":499000,"reference":"COURSE TV0010013"}', 'failed', 'Không khớp rule xử lý', CURRENT_TIMESTAMP - interval '50 minutes'),
        ('SEPAY', 'BANK-MUP-1001', 'BANK_INBOUND', TRUE, '{"amount":199000,"reference":"UPGRADE TV0010015"}', 'ignored', 'Nội dung không hợp lệ', CURRENT_TIMESTAMP - interval '45 minutes'),
        ('SEPAY', 'BANK-MAN-1001', 'BANK_INBOUND', FALSE, '{"amount":120000,"reference":"MANUAL TV0010014"}', 'duplicated', NULL, CURRENT_TIMESTAMP - interval '40 minutes')
      ON CONFLICT (provider, external_txn_id) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO news (
        category_code, author_id, title, slug, summary, content, author, read_time,
        thumbnail, image_url, gallery_images, gallery_position, show_author_box,
        views, is_featured, status, published_at, published_date
      )
      SELECT
        v.category_code, (SELECT id FROM users WHERE email = 'admin@gmail.com' LIMIT 1),
        v.title, v.slug, v.summary, v.content, 'Ban biên tập', v.read_time,
        v.thumbnail, v.image_url, v.gallery_images::jsonb, 'after-content', TRUE,
        v.views, v.is_featured, v.status,
        CURRENT_TIMESTAMP - (v.days_ago || ' days')::interval,
        (CURRENT_DATE - (v.days_ago || ' days')::interval)::date
      FROM (
        VALUES
          ('CHUYENDE', 'Dữ liệu mở trong thư viện đại học', 'du-lieu-mo-trong-thu-vien-dai-hoc', 'Bài viết chuyên đề dữ liệu mở.', '<p>Nội dung chuyên đề dữ liệu mở...</p>', '4 phút đọc', '/uploads/media/news-data-thumb.jpg', '/uploads/media/news-data-cover.jpg', '[]', 76, TRUE, 'published', 3),
          ('SUKIEN', 'Tuần lễ đọc sách số 2026', 'tuan-le-doc-sach-so-2026', 'Sự kiện dành cho sinh viên và bạn đọc.', '<p>Hoạt động workshop và trải nghiệm app.</p>', '2 phút đọc', '/uploads/media/news-event-thumb.jpg', '/uploads/media/news-event-cover.jpg', '[]', 54, FALSE, 'published', 4),
          ('THONGBAO', 'Lịch bảo trì hệ thống cuối tuần', 'lich-bao-tri-he-thong-cuoi-tuan', 'Thông báo bảo trì định kỳ.', '<p>Hệ thống bảo trì từ 23:00 đến 02:00.</p>', '1 phút đọc', '/uploads/media/news-maint-thumb.jpg', '/uploads/media/news-maint-cover.jpg', '[]', 20, FALSE, 'draft', 1)
      ) AS v(category_code, title, slug, summary, content, read_time, thumbnail, image_url, gallery_images, views, is_featured, status, days_ago)
      ON CONFLICT (slug) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO comments (user_id, object_id, object_type, parent_id, reply_to_user_id, content, rating, status, is_featured)
      SELECT
        u.id, obj2.object_id, obj2.object_type, NULL, NULL, obj.content, obj.rating, obj.status, obj.is_featured
      FROM (
        VALUES
          ('reader.alpha@example.com', 'book', 'phan-tich-du-lieu-cho-quan-tri-thu-vien', 'Sách có nội dung thực tế, dễ áp dụng cho dashboard.', 5, 'approved', TRUE),
          ('reader.beta@example.com', 'book', 'khoi-nghiep-san-pham-so-tu-thu-vien', 'Bài viết hay nhưng cần thêm ví dụ case study.', 4, 'pending', FALSE),
          ('reader.gamma@example.com', 'news', 'du-lieu-mo-trong-thu-vien-dai-hoc', 'Bài chuyên đề rất hữu ích cho cán bộ thư viện.', 0, 'approved', FALSE),
          ('reader.epsilon@example.com', 'course', 'react-nextjs-course', 'Khoá học phù hợp cho đội frontend.', 5, 'approved', FALSE)
      ) AS obj(user_email, object_type, object_ref, content, rating, status, is_featured)
      JOIN users u ON u.email = obj.user_email
      JOIN LATERAL (
        SELECT
          CASE
            WHEN obj.object_type = 'book' THEN (SELECT id FROM books WHERE slug = obj.object_ref LIMIT 1)
            WHEN obj.object_type = 'news' THEN (SELECT id FROM news WHERE slug = obj.object_ref LIMIT 1)
            WHEN obj.object_type = 'course' THEN (SELECT id FROM courses WHERE slug = obj.object_ref LIMIT 1)
            ELSE NULL
          END AS object_id,
          obj.object_type AS object_type
      ) AS obj2 ON obj2.object_id IS NOT NULL
      WHERE NOT EXISTS (
        SELECT 1 FROM comments c
        WHERE c.user_id = u.id AND c.object_type = obj2.object_type AND c.object_id = obj2.object_id
          AND c.content = obj.content
      );
    `);

    await client.query(`
      INSERT INTO comments (user_id, object_id, object_type, parent_id, reply_to_user_id, content, rating, status, is_featured)
      SELECT
        admin.id, c.object_id, c.object_type, c.id, c.user_id,
        'Cảm ơn bạn đã phản hồi. Đội vận hành sẽ cập nhật trong phiên bản tiếp theo.',
        0, 'approved', FALSE
      FROM comments c
      CROSS JOIN (SELECT id FROM users WHERE email = 'admin@gmail.com' LIMIT 1) AS admin
      WHERE c.content IN (
        'Bài viết hay nhưng cần thêm ví dụ case study.',
        'Bài chuyên đề rất hữu ích cho cán bộ thư viện.'
      )
      AND NOT EXISTS (
        SELECT 1 FROM comments r
        WHERE r.parent_id = c.id
          AND r.content = 'Cảm ơn bạn đã phản hồi. Đội vận hành sẽ cập nhật trong phiên bản tiếp theo.'
      );
    `);

    await client.query(`
      INSERT INTO comment_reports (comment_id, reporter_id, reason, description, report_type, status, resolved_by, resolved_at)
      SELECT
        c.id,
        reporter.id,
        'Nội dung cần kiểm duyệt thêm',
        'Report mẫu phục vụ luồng admin moderation',
        4,
        'processing',
        NULL,
        NULL
      FROM comments c
      CROSS JOIN (SELECT id FROM users WHERE email = 'reader.vip@example.com' LIMIT 1) AS reporter
      WHERE c.status = 'pending'
      AND c.content = 'Bài viết hay nhưng cần thêm ví dụ case study.'
      AND NOT EXISTS (
        SELECT 1 FROM comment_reports cr
        WHERE cr.comment_id = c.id AND cr.reporter_id = reporter.id
      );
    `);

    await client.query(`
      INSERT INTO comment_reactions (comment_id, user_id, reaction_type)
      SELECT c.id, u.id, v.reaction_type
      FROM (
        VALUES
          ('reader.alpha@example.com', 1),
          ('reader.beta@example.com', 1),
          ('reader.gamma@example.com', 2)
      ) AS v(user_email, reaction_type)
      JOIN users u ON u.email = v.user_email
      JOIN comments c ON c.content = 'Sách có nội dung thực tế, dễ áp dụng cho dashboard.'
      ON CONFLICT (comment_id, user_id) DO UPDATE
      SET reaction_type = EXCLUDED.reaction_type,
          updated_at = CURRENT_TIMESTAMP;
    `);

    await client.query(`
      INSERT INTO book_reviews (book_id, member_id, rating, comment, status)
      SELECT
        b.id, m.id, v.rating, v.comment, v.status
      FROM (
        VALUES
          ('reader.alpha@example.com', 'phan-tich-du-lieu-cho-quan-tri-thu-vien', 5, 'Rất đáng đọc cho đội vận hành.', 'published'),
          ('reader.beta@example.com', 'khoi-nghiep-san-pham-so-tu-thu-vien', 3, 'Nội dung ổn nhưng cần cập nhật thêm.', 'flagged'),
          ('reader.gamma@example.com', 'machine-learning-cho-thu-vien-so', 4, 'Phần mô hình gợi ý khá tốt.', 'published'),
          ('reader.epsilon@example.com', 'english-for-digital-library-services', 4, 'Hữu ích cho nhân viên quầy.', 'published')
      ) AS v(member_email, book_slug, rating, comment, status)
      JOIN members m ON m.email = v.member_email
      JOIN books b ON b.slug = v.book_slug
      ON CONFLICT (book_id, member_id) DO UPDATE
      SET rating = EXCLUDED.rating,
          comment = EXCLUDED.comment,
          status = EXCLUDED.status,
          updated_at = CURRENT_TIMESTAMP;
    `);

    await client.query(`
      INSERT INTO wishlists (member_id, book_id)
      SELECT m.id, b.id
      FROM (
        VALUES
          ('reader.alpha@example.com', 'machine-learning-cho-thu-vien-so'),
          ('reader.beta@example.com', 'phan-tich-du-lieu-cho-quan-tri-thu-vien'),
          ('reader.gamma@example.com', 'khoi-nghiep-san-pham-so-tu-thu-vien'),
          ('reader.epsilon@example.com', 'english-for-digital-library-services')
      ) AS v(member_email, book_slug)
      JOIN members m ON m.email = v.member_email
      JOIN books b ON b.slug = v.book_slug
      ON CONFLICT (member_id, book_id) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO notifications (
        member_id, sender_id, target_type, type, title, message, metadata, status, is_read, related_type
      )
      SELECT
        m.id,
        (SELECT id FROM users WHERE email = 'admin@gmail.com' LIMIT 1),
        v.target_type,
        v.type,
        v.title::jsonb,
        v.message::jsonb,
        jsonb_build_object('seed_key', v.seed_key),
        v.status,
        v.is_read,
        v.related_type
      FROM (
        VALUES
          ('reader.alpha@example.com', 'individual', 'system', '{"vi":"Thông báo hệ thống","en":"System notice"}', '{"vi":"Đã cập nhật dữ liệu mới cho tài khoản.","en":"Your account data is refreshed."}', 'seed-noti-1001', 'sent', FALSE, 'membership_request'),
          ('reader.beta@example.com', 'individual', 'payment', '{"vi":"Nhắc thanh toán","en":"Payment reminder"}', '{"vi":"Bạn còn giao dịch chờ xử lý.","en":"You have pending payments."}', 'seed-noti-1002', 'draft', FALSE, 'payment'),
          ('reader.gamma@example.com', 'individual', 'system', '{"vi":"Thông báo lỗi webhook","en":"Webhook issue"}', '{"vi":"Một giao dịch chưa xử lý thành công.","en":"A transaction is not fully processed."}', 'seed-noti-1003', 'failed', TRUE, 'payment'),
          ('reader.epsilon@example.com', 'individual', 'renewal', '{"vi":"Gia hạn hội viên","en":"Membership renewal"}', '{"vi":"Thẻ sắp hết hạn, vui lòng gia hạn.","en":"Your membership is near expiry."}', 'seed-noti-1004', 'archived', TRUE, 'membership_request')
      ) AS v(member_email, target_type, type, title, message, seed_key, status, is_read, related_type)
      JOIN members m ON m.email = v.member_email
      WHERE NOT EXISTS (SELECT 1 FROM notifications n WHERE n.metadata->>'seed_key' = v.seed_key);
    `);

    await client.query(`
      INSERT INTO notifications (
        member_id, sender_id, target_type, type, title, message, metadata, status, is_read, related_type
      )
      SELECT
        NULL,
        (SELECT id FROM users WHERE email = 'admin@gmail.com' LIMIT 1),
        'all',
        'system',
        '{"vi":"Thông báo toàn hệ thống","en":"System-wide announcement"}'::jsonb,
        '{"vi":"Đợt dữ liệu mẫu mở rộng đã hoàn tất.","en":"Extended sample dataset is ready."}'::jsonb,
        '{"seed_key":"seed-noti-all-1001"}'::jsonb,
        'sent',
        FALSE,
        'system'
      WHERE NOT EXISTS (
        SELECT 1 FROM notifications n WHERE n.metadata->>'seed_key' = 'seed-noti-all-1001'
      );
    `);

    await client.query(`
      INSERT INTO interaction_logs (member_id, object_id, object_type, action_type, ip_address, user_agent)
      SELECT
        m.id, obj.object_id, obj.object_type, v.action_type, '127.0.0.1', v.user_agent
      FROM (
        VALUES
          ('reader.alpha@example.com', 'book', 'phan-tich-du-lieu-cho-quan-tri-thu-vien', 'read', 'seed-script-ext-1'),
          ('reader.beta@example.com', 'book', 'khoi-nghiep-san-pham-so-tu-thu-vien', 'favorite', 'seed-script-ext-2'),
          ('reader.gamma@example.com', 'news', 'du-lieu-mo-trong-thu-vien-dai-hoc', 'view', 'seed-script-ext-3'),
          ('reader.epsilon@example.com', 'course', 'react-nextjs-course', 'download', 'seed-script-ext-4'),
          ('reader.vip@example.com', 'book', 'machine-learning-cho-thu-vien-so', 'view', 'seed-script-ext-5')
      ) AS v(member_email, object_type, object_ref, action_type, user_agent)
      JOIN members m ON m.email = v.member_email
      JOIN LATERAL (
        SELECT
          CASE
            WHEN v.object_type = 'book' THEN (SELECT id FROM books WHERE slug = v.object_ref LIMIT 1)
            WHEN v.object_type = 'news' THEN (SELECT id FROM news WHERE slug = v.object_ref LIMIT 1)
            WHEN v.object_type = 'course' THEN (SELECT id FROM courses WHERE slug = v.object_ref LIMIT 1)
            ELSE NULL
          END AS object_id,
          v.object_type AS object_type
      ) AS obj ON obj.object_id IS NOT NULL
      WHERE NOT EXISTS (
        SELECT 1 FROM interaction_logs il WHERE il.user_agent = v.user_agent
      );
    `);

    await client.query(`
      INSERT INTO member_activities (member_id, activity_type, description, ip_address, user_agent)
      SELECT
        m.id, v.activity_type, v.description, '127.0.0.1', 'seed-script-ext'
      FROM (
        VALUES
          ('reader.alpha@example.com', 'deposit', 'Nạp ví thành công qua webhook'),
          ('reader.beta@example.com', 'fine_issued', 'Phát sinh phí phạt quá hạn'),
          ('reader.gamma@example.com', 'membership_upgrade', 'Nâng cấp hội viên thành công'),
          ('reader.delta@example.com', 'account_warning', 'Tài khoản bị tạm ngưng do nợ quá hạn'),
          ('reader.epsilon@example.com', 'profile_update', 'Cập nhật thông tin hồ sơ')
      ) AS v(member_email, activity_type, description)
      JOIN members m ON m.email = v.member_email
      WHERE NOT EXISTS (
        SELECT 1 FROM member_activities a
        WHERE a.member_id = m.id AND a.activity_type = v.activity_type AND a.description = v.description
      );
    `);

    await client.query(`
      INSERT INTO member_transactions (member_id, amount, transaction_type, description, status, processed_by)
      SELECT
        m.id, v.amount::numeric, v.transaction_type, v.description, v.status,
        (SELECT id FROM users WHERE email = 'admin@gmail.com' LIMIT 1)
      FROM (
        VALUES
          ('reader.alpha@example.com', 250000, 'deposit', 'Giao dịch nạp ví mẫu', 'completed'),
          ('reader.beta@example.com', 40000, 'fine', 'Phạt quá hạn mẫu', 'pending'),
          ('reader.gamma@example.com', 199000, 'membership_fee', 'Đóng phí nâng cấp gói', 'completed'),
          ('reader.epsilon@example.com', 50000, 'refund', 'Hoàn tiền điều chỉnh giao dịch', 'completed')
      ) AS v(member_email, amount, transaction_type, description, status)
      JOIN members m ON m.email = v.member_email
      WHERE NOT EXISTS (
        SELECT 1 FROM member_transactions t
        WHERE t.member_id = m.id AND t.transaction_type = v.transaction_type AND t.description = v.description
      );
    `);

    await client.query(`
      INSERT INTO book_reservations (member_id, book_id, status, requested_at, notified_at, expires_at, notes)
      SELECT
        m.id, b.id, v.status,
        CURRENT_TIMESTAMP - interval '2 day',
        CASE WHEN v.status IN ('notified','fulfilled') THEN CURRENT_TIMESTAMP - interval '1 day' ELSE NULL END,
        CASE WHEN v.status IN ('pending','notified') THEN CURRENT_TIMESTAMP + interval '2 day' ELSE NULL END,
        v.notes
      FROM (
        VALUES
          ('reader.alpha@example.com', 'tai-lieu-ngung-hop-tac-mau', 'pending', 'Đặt chỗ khi chưa có bản sao'),
          ('reader.beta@example.com', 'english-for-digital-library-services', 'notified', 'Đã thông báo có bản sao sẵn'),
          ('reader.gamma@example.com', 'khoi-nghiep-san-pham-so-tu-thu-vien', 'fulfilled', 'Đã nhận sách theo reservation'),
          ('reader.delta@example.com', 'quan-tri-van-hanh-thu-vien-hien-dai', 'cancelled', 'Huỷ do quá hạn nhận')
      ) AS v(member_email, book_slug, status, notes)
      JOIN members m ON m.email = v.member_email
      JOIN books b ON b.slug = v.book_slug
      WHERE NOT EXISTS (
        SELECT 1 FROM book_reservations r
        WHERE r.member_id = m.id AND r.book_id = b.id AND r.notes = v.notes
      );
    `);

    await client.query(`
      INSERT INTO publication_pages (publication_id, page_number, content, image_url)
      SELECT b.id, v.page_number, v.content, v.image_url
      FROM (
        VALUES
          ('phan-tich-du-lieu-cho-quan-tri-thu-vien', 1, 'Nội dung trang 1 - Data analytics overview', '/uploads/media/page-data-1.jpg'),
          ('phan-tich-du-lieu-cho-quan-tri-thu-vien', 2, 'Nội dung trang 2 - KPI dashboard', '/uploads/media/page-data-2.jpg'),
          ('machine-learning-cho-thu-vien-so', 1, 'Nội dung trang 1 - ML recommendation', '/uploads/media/page-ml-1.jpg'),
          ('machine-learning-cho-thu-vien-so', 2, 'Nội dung trang 2 - Evaluation', '/uploads/media/page-ml-2.jpg')
      ) AS v(book_slug, page_number, content, image_url)
      JOIN books b ON b.slug = v.book_slug
      ON CONFLICT (publication_id, page_number) DO UPDATE
      SET content = EXCLUDED.content,
          image_url = EXCLUDED.image_url;
    `);

    await client.query(`
      INSERT INTO publication_bookmarks (publication_id, title, page_number, parent_id)
      SELECT
        b.id, v.title, v.page_number, NULL
      FROM (
        VALUES
          ('phan-tich-du-lieu-cho-quan-tri-thu-vien', 'Mục lục phân tích', 12),
          ('machine-learning-cho-thu-vien-so', 'Chương mô hình', 87),
          ('khoi-nghiep-san-pham-so-tu-thu-vien', 'Phần chiến lược', 45)
      ) AS v(book_slug, title, page_number)
      JOIN books b ON b.slug = v.book_slug
      WHERE NOT EXISTS (
        SELECT 1 FROM publication_bookmarks pb
        WHERE pb.publication_id = b.id AND pb.title = v.title AND pb.page_number = v.page_number
      );
    `);

    await client.query('COMMIT');

    console.log('✅ Sample data seeded successfully for admin/app flows.');
    console.log('🔐 Admin login : admin@gmail.com / admin123');
    console.log('📱 Reader login: reader.basic@example.com / admin123 (or card TV0010001)');
    console.log('📱 Reader login: reader.premium@example.com / admin123 (or card TV0010002)');
    console.log('📱 Reader login: reader.vip@example.com / admin123 (or card TV0010003)');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed sample data failed:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.detail) console.error('Detail:', error.detail);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedSampleData()
    .catch(() => process.exit(1));
}

module.exports = { seedSampleData };
