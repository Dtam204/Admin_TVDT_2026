const swaggerJsdoc = require('swagger-jsdoc');

const TAG_DEFINITIONS = [
  // Core auth
  { name: 'Auth', description: 'Đăng nhập và xác thực JWT' },

  // Admin APIs
  { name: 'Admin Dashboard', description: 'API tổng quan hệ thống cho Quản trị viên' },
  { name: 'Admin Audit', description: 'Nhật ký thao tác và đối soát vận hành' },
  { name: 'Admin Authors', description: 'Quản lý tác giả' },
  { name: 'Admin BookCategories', description: 'Quản lý danh mục sách' },
  { name: 'Admin BookLoans', description: 'Quản lý luồng mượn - trả theo nghiệp vụ chi tiết' },
  { name: 'Admin Books', description: 'Quản lý ấn phẩm/sách trong kho' },
  { name: 'Admin Collections', description: 'Quản lý bộ sưu tập hiển thị' },
  { name: 'Admin Comments', description: 'Quản trị bình luận của người dùng' },
  { name: 'Admin CourseCategories', description: 'Quản lý danh mục khóa học' },
  { name: 'Admin Courses', description: 'Quản lý khóa học' },
  { name: 'Admin Loans', description: 'Quản lý mượn trả sách cấp admin' },
  { name: 'Admin Media', description: 'Quản lý tệp media và thư mục media' },
  { name: 'Admin MemberActions', description: 'Nghiệp vụ hội viên và lịch sử thao tác thủ công' },
  { name: 'Admin Members', description: 'Quản lý hội viên' },
  { name: 'Admin Membership', description: 'Quản lý yêu cầu gói hội viên' },
  { name: 'Admin Menus', description: 'Quản lý menu giao diện' },
  { name: 'Admin News', description: 'Quản lý tin tức' },
  { name: 'Admin Payments', description: 'Quản lý giao dịch tài chính và ví' },
  { name: 'Admin Publication', description: 'Nghiệp vụ quản lý ấn phẩm và luồng kho lưu trữ' },
  { name: 'Admin Publishers', description: 'Quản lý nhà xuất bản' },
  { name: 'Admin Upload', description: 'Upload tệp phục vụ CMS' },
  { name: 'Admin Storage', description: 'Quản lý vị trí lưu trữ/kho/kệ sách' },
  { name: 'Admin Notifications', description: 'Gửi và quản lý notification realtime cho app/admin' },
  { name: 'Admin MediaFiles', description: 'Quản lý file media đã upload' },
  { name: 'Admin MediaFolders', description: 'Quản lý thư mục media' },

  // Reader/App APIs
  { name: 'Reader Portal', description: 'API nghiệp vụ bạn đọc (đăng nhập và thao tác cá nhân)' },
  { name: 'Reader Wallet', description: 'API ví điện tử của bạn đọc' },
  { name: 'Reader Actions', description: 'API hành vi bạn đọc (mượn, thao tác cá nhân)' },
  { name: 'App Reader', description: 'API thông báo và tiện ích riêng cho Mobile App' },

  // Public APIs
  { name: 'Public Home', description: 'API dữ liệu trang chủ công khai' },
  { name: 'Public Books', description: 'API dữ liệu ấn phẩm công khai' },
  { name: 'Public Search', description: 'API tìm kiếm công khai' },
  { name: 'Public News', description: 'API tin tức công khai' },
  { name: 'Public Memberships', description: 'API thông tin gói hội viên công khai' },
  { name: 'Resource Hub', description: 'API cây điều hướng và tài nguyên công khai' },
  { name: 'Comments', description: 'API bình luận công khai' },

  // Integrations
  { name: 'Webhooks', description: 'Webhook tích hợp cổng thanh toán/ngân hàng' },
  { name: 'Admin Wallet', description: 'API nạp tiền ví và đồng bộ giao dịch ngân hàng' },
  { name: 'Admin Membership', description: 'API nâng cấp/gia hạn gói hội viên' },
];

function filterPaths(paths, matcher) {
  return Object.entries(paths || {}).reduce((acc, [path, operations]) => {
    if (matcher(path)) {
      acc[path] = operations;
    }
    return acc;
  }, {});
}

function collectUsedTags(paths) {
  const used = new Set();
  Object.values(paths || {}).forEach((operations) => {
    Object.values(operations || {}).forEach((operation) => {
      (operation.tags || []).forEach((tagName) => used.add(tagName));
    });
  });
  return used;
}

function createSubsetSpec(baseSpec, { title, description, matcher }) {
  const subsetPaths = filterPaths(baseSpec.paths, matcher);
  const usedTags = collectUsedTags(subsetPaths);

  return {
    ...baseSpec,
    info: {
      ...baseSpec.info,
      title,
      description,
    },
    tags: (baseSpec.tags || []).filter((tag) => usedTags.has(tag.name)),
    paths: subsetPaths,
  };
}

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Thư viện TN CMS API',
      version: '2026.1.0',
      description: [
        '## API Documentation - Thư viện TN Backend',
        '',
        'Hệ thống RESTful API phục vụ **CMS Quản trị** và **Mobile App 2026**.',
        '',
        '### Phân loại tài liệu Swagger (dễ theo dõi)',
        '- `/api-docs` : Toàn bộ endpoint',
        '- `/api-docs/admin` : Chỉ API khối Quản trị (CMS)',
        '- `/api-docs/app` : Chỉ API Mobile/Public/Reader',
        '- `/api-docs/integration` : Chỉ API tích hợp webhook',
        '',
        '### Xác thực',
        'Sử dụng **Bearer JWT Token** cho endpoint `/api/admin/*` và `/api/reader/*`.',
        'Lấy token tại `POST /api/auth/login`.',
        '',
        '### Swagger endpoints',
        '- `/api-docs` : toàn bộ API',
        '- `/api-docs/admin` : API Admin/CMS',
        '- `/api-docs/app` : API App/Reader/Public',
        '- `/api-docs/integration` : API webhook/tích hợp',
        '',
        '### Luồng realtime',
        '- Notification realtime cho Admin/App',
        '- SePay webhook tự động cập nhật ví / hội viên / nộp phạt',
        '- FE chỉ cần subscribe socket và gọi API theo Swagger',
        '',
        '### Cách đọc chuẩn cho Mobile App',
        '- Gọi `GET /api/public/publications/{id}` để lấy metadata và quyền truy cập',
        '- Gọi `GET /api/public/publications/{id}/reading-content` để xác định mode đọc',
        '- Nếu `page_mode.enabled = true`: dùng PDF và hiển thị theo trang/chương',
        '- Nếu `scroll_mode.enabled = true`: hiển thị toàn văn dạng cuộn',
        '- Nếu cả hai cùng có: UI cho phép chọn chế độ đọc',
        '',
        '### Cấu trúc Response chuẩn (7 trường)',
        '```json',
        '{',
        '  "code": 0,',
        '  "errorId": null,',
        '  "appId": null,',
        '  "success": true,',
        '  "message": "Thao tác thành công",',
        '  "data": { ... },',
        '  "errors": null',
        '}',
        '```',
        '',
        '### API App cần dùng cho luồng đọc ấn phẩm',
        '- `GET /api/public/publications/{id}`: lấy metadata chi tiết ấn phẩm, quyền đọc, đường dẫn đọc/tải',
        '- `GET /api/public/publications/{id}/reading-content`: lấy dữ liệu đọc theo mode `pdf` hoặc `fulltext`',
        '- `GET /api/public/publications/{id}/pdf-file`: tải/đọc file PDF thật, hỗ trợ `Range`',
        '',
        '### Phân biệt 2 dạng đọc',
        '- **PDF / trang / chương**: dùng `reading_content.page_mode` và `reading_content.chapter_mode`',
        '- **Toàn văn / cuộn**: dùng `reading_content.scroll_mode.full_text`',
        '',
        '### Quy tắc trả dữ liệu để FE dễ ẩn/hiện',
        '- Nếu không có PDF thì `page_mode = null` hoặc `page_mode.enabled = false`',
        '- Nếu không có toàn văn thì `scroll_mode = null` hoặc `scroll_mode.enabled = false`',
        '- Nếu không có chapter thì `chapter_mode = null` hoặc `chapter_mode.enabled = false`',
        '- FE chỉ cần check null/false để ẩn tab tương ứng',
        '',
        '### Gợi ý quy tắc FE',
        '- Nếu `actions.can_read_online = true` thì hiển thị nút Đọc',
        '- Nếu `actions.can_download_pdf = true` thì cho phép mở/tải PDF',
        '- Nếu `scroll_mode.enabled = true` thì hiển thị chế độ cuộn toàn văn',
        '- Nếu cả `page_mode` và `scroll_mode` cùng có thì render đủ 3 tab: Trang, Chương, Cuộn',
      ].join('\n'),
    },
    servers: [{ url: 'http://localhost:5000', description: 'Local Development Server' }],
    tags: TAG_DEFINITIONS,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Token nhận được từ endpoint đăng nhập phù hợp (`/api/auth/login` cho Admin, `/api/reader/login` cho App/Reader)',
        },
      },
      schemas: {
        // ── RESPONSE CƠ SỞ 7 TRƯỜNG ──────────────────────────────
        BaseResponse: {
          type: 'object',
          description: 'Response chuẩn 7 trường của toàn hệ thống',
          properties: {
            code:    { type: 'integer',  example: 0,    description: '0 = thành công, khác 0 = lỗi' },
            errorId: { type: 'string',   nullable: true, example: null, description: 'Mã lỗi (null nếu OK)' },
            appId:   { type: 'string',   nullable: true, example: null, description: 'App định danh' },
            success: { type: 'boolean',  example: true },
            message: { type: 'string',   example: 'Thao tác thành công' },
            data:    { description: 'Dữ liệu trả về' },
            errors:  { type: 'array',    nullable: true, example: null, description: 'Chi tiết lỗi' },
          },
        },
        ErrorResponse: {
          type: 'object',
          description: 'Response lỗi chuẩn 7 trường',
          properties: {
            code:    { type: 'integer', example: 500 },
            errorId: { type: 'string',  example: 'INTERNAL_SERVER_ERROR' },
            appId:   { type: 'string',  nullable: true, example: null },
            success: { type: 'boolean', example: false },
            message: { type: 'string',  example: 'Đã có lỗi hệ thống xảy ra' },
            data:    { nullable: true,  example: null },
            errors:  { type: 'array',  items: { type: 'string' }, example: ['ValidationError'] },
          },
        },

        // ── ITEM ẤN PHẨM MOBILE (7 TRƯỜNG) ──────────────────────
        MobileItem: {
          type: 'object',
          description: 'Item ấn phẩm chuẩn 7 trường dành cho Mobile App',
          properties: {
            id:         { type: 'integer', example: 1 },
            nhanDe:     { type: 'string',  example: 'Lập trình Node.js nâng cao', description: 'Nhãn đề / Tiêu đề' },
            tacGia:     { type: 'string',  example: 'Nguyễn Văn A',              description: 'Tác giả' },
            anhDaiDien: { type: 'string',  example: 'https://cdn.example.com/book.jpg', description: 'URL ảnh bìa' },
            namXuatBan: { type: 'integer', example: 2023,                        description: 'Năm xuất bản' },
            nhaXuatBan: { type: 'string',  example: 'NXB Khoa học Kỹ thuật',    description: 'Nhà xuất bản' },
            trang:      { type: 'integer', example: 320,                         description: 'Số trang' },
          },
        },

        // ── PHÂN TRANG CHUẨN ─────────────────────────────────────
        PaginatedResponse: {
          type: 'object',
          description: 'Wrapper phân trang cho danh sách Mobile App',
          properties: {
            items:        { type: 'array',   items: { $ref: '#/components/schemas/MobileItem' } },
            totalRecords: { type: 'integer', example: 100 },
            pageIndex:    { type: 'integer', example: 1 },
            pageSize:     { type: 'integer', example: 10 },
            totalPages:   { type: 'integer', example: 10 },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page:       { type: 'integer', example: 1, description: 'Trang hiện tại (chuẩn mới)' },
            currentPage:{ type: 'integer', example: 1, description: 'Trang hiện tại (tương thích ngược)' },
            limit:      { type: 'integer', example: 20 },
            total:      { type: 'integer', example: 100, description: 'Tổng bản ghi (chuẩn mới)' },
            totalItems: { type: 'integer', example: 100, description: 'Tổng bản ghi (tương thích ngược)' },
            totalPages: { type: 'integer', example: 5 },
          },
        },

        // ── RESOURCE HUB ─────────────────────────────────────────
        ResourceTreeNode: {
          type: 'object',
          description: 'Nút trong cây tài nguyên (Tree-view) của Resource Hub',
          properties: {
            label:    { type: 'string',  example: 'Tài liệu in',     description: 'Nhãn hiển thị' },
            value:    { type: 'string',  nullable: true, example: 'print-hub', description: 'Alias (dùng cho POST /alias)' },
            router:   { type: 'string',  nullable: true, example: 'search?type=basic' },
            icon:     { type: 'string',  example: 'fa fa-book' },
            children: { type: 'array',   nullable: true, items: { $ref: '#/components/schemas/ResourceTreeNode' } },
          },
        },
        ResourceTab: {
          type: 'object',
          description: 'Tab điều hướng trên Dashboard Resource Hub',
          properties: {
            id:    { type: 'string', example: 'trending' },
            label: { type: 'string', example: 'Xu hướng' },
            icon:  { type: 'string', example: 'trending-up' },
            type:  { type: 'string', enum: ['trending', 'favorite', 'views', 'rating'] },
          },
        },

        // ── SCHEMAS NGHIỆP VỤ ────────────────────────────────────
        AuditLog: {
          type: 'object',
          properties: {
            id:          { type: 'integer' },
            user_id:     { type: 'integer', nullable: true },
            user_name:   { type: 'string' },
            action:      { type: 'string', example: 'UPDATE' },
            module:      { type: 'string', example: 'MEMBER' },
            entity_id:   { type: 'string' },
            description: { type: 'string' },
            old_data:    { type: 'object', nullable: true },
            new_data:    { type: 'object', nullable: true },
            ip_address:  { type: 'string' },
            created_at:  { type: 'string', format: 'date-time' },
          },
        },
        MembershipRequest: {
          type: 'object',
          properties: {
            id:          { type: 'integer' },
            member_id:   { type: 'integer' },
            member_name: { type: 'string' },
            plan_id:     { type: 'integer' },
            plan_name:   { type: 'string' },
            amount:      { type: 'number' },
            status:      { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            external_txn_id: { type: 'string', description: 'Mã giao dịch ngân hàng (SePay)' },
            gateway:      { type: 'string', description: 'Cổng thanh toán (MBBank, etc.)' },
            created_at:  { type: 'string', format: 'date-time' },
          },
        },
        WalletDepositOrder: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            member_id: { type: 'integer' },
            amount: { type: 'number' },
            client_reference: { type: 'string' },
            transfer_code: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'credited', 'failed', 'expired', 'cancelled'] },
            expires_at: { type: 'string', format: 'date-time' },
            matched_external_txn_id: { type: 'string', nullable: true },
            credited_at: { type: 'string', format: 'date-time', nullable: true },
            failure_reason: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Payment: {
          type: 'object',
          description: 'Thông tin giao dịch tài chính',
          properties: {
            id:             { type: 'integer' },
            transaction_id: { type: 'string', example: 'DEP-123456' },
            member_id:      { type: 'integer' },
            member_name:    { type: 'string' },
            type:           { type: 'string', enum: ['wallet_deposit', 'membership', 'fee_penalty', 'book_rental'], description: 'Loại giao dịch' },
            amount:         { type: 'number' },
            status:         { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
            payment_method: { type: 'string', example: 'bank_transfer' },
            external_txn_id:{ type: 'string', nullable: true, description: 'Mã giao dịch từ SePay/Ngân hàng' },
            gateway:        { type: 'string', nullable: true },
            payment_content:{ type: 'string', nullable: true, description: 'Nội dung chuyển khoản gốc' },
            sync_status:    { type: 'string', enum: ['manual', 'automated'] },
            paid_at:        { type: 'string', format: 'date-time', nullable: true },
            created_at:     { type: 'string', format: 'date-time' },
          },
        },
        WalletDepositOrder: {
          type: 'object',
          description: 'Lệnh nạp tiền ví từ App để đồng bộ webhook',
          properties: {
            id: { type: 'integer' },
            member_id: { type: 'integer' },
            amount: { type: 'number' },
            client_reference: { type: 'string', example: 'NAP-R14-1712623400000' },
            transfer_code: { type: 'string', example: 'NAP-R14-1712623400000' },
            status: { type: 'string', enum: ['pending', 'credited', 'failed', 'expired', 'cancelled'] },
            expires_at: { type: 'string', format: 'date-time' },
            matched_external_txn_id: { type: 'string', nullable: true },
            credited_at: { type: 'string', format: 'date-time', nullable: true },
            failure_reason: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        WebhookEvent: {
          type: 'object',
          description: 'Nhật ký xử lý webhook để idempotency và audit',
          properties: {
            id: { type: 'integer' },
            provider: { type: 'string', example: 'SEPAY' },
            external_txn_id: { type: 'string' },
            processing_status: { type: 'string', enum: ['received', 'processed', 'ignored', 'duplicated', 'failed'] },
            signature_valid: { type: 'boolean' },
            error_message: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            processed_at: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        BookLoan: {
          type: 'object',
          properties: {
            id:          { type: 'integer' },
            member_id:   { type: 'integer' },
            member_name: { type: 'string' },
            book_title:  { type: 'string' },
            borrow_date: { type: 'string', format: 'date-time' },
            due_date:    { type: 'string', format: 'date-time' },
            return_date: { type: 'string', format: 'date-time', nullable: true },
            status:      { type: 'string', enum: ['borrowing', 'returned', 'overdue', 'lost'] },
            fine_amount: { type: 'number', default: 0 },
          },
        },
        Publication: {
          type: 'object',
          properties: {
            id:               { type: 'integer' },
            code:             { type: 'string' },
            isbn:             { type: 'string' },
            title:            { type: 'string' },
            author:           { type: 'string' },
            authors_list: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' }
                }
              }
            },
            slug:             { type: 'string' },
            publisher_name:   { type: 'string', nullable: true },
            description:      { type: 'string' },
            cover_image:      { type: 'string' },
            thumbnail:        { type: 'string' },
            publication_year: { type: 'integer' },
            pages:            { type: 'integer', nullable: true },
            status:           { type: 'string', default: 'available' },
            media_type:       { type: 'string', enum: ['Physical', 'Digital', 'Hybrid'] },
            is_digital:       { type: 'boolean' },
            format:           { type: 'string', enum: ['Physical', 'Digital', 'Hybrid'] },
            access_policy:    { type: 'string', enum: ['basic', 'premium', 'vip'] },
            cooperation_status: { type: 'string', nullable: true, example: 'cooperating' },
            storage_location_id: { type: 'integer', nullable: true, example: 1 },
            copy_count:       { type: 'integer', example: 12 },
            total_copies:     { type: 'integer', example: 12 },
            countCopies:      { type: 'integer', example: 12 },
            view_count:       { type: 'integer', example: 120 },
            favorite_count:   { type: 'integer', example: 45 },
            rating_average:   { type: 'number' },
            total_reviews:    { type: 'integer' },
            dominant_color:   { type: 'string', example: '#4f46e5' },
            created_at:       { type: 'string', format: 'date-time' },
          },
        },
        PublicationRelatedItem: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string', nullable: true },
            isbn: { type: 'string', nullable: true },
            title: { type: 'string' },
            author: { type: 'string' },
            authors_list: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' }
                }
              }
            },
            slug: { type: 'string', nullable: true },
            cover_image: { type: 'string', nullable: true },
            thumbnail: { type: 'string', nullable: true },
            publication_year: { type: 'integer', nullable: true },
            pages: { type: 'integer', nullable: true },
            status: { type: 'string', nullable: true },
            media_type: { type: 'string', enum: ['Physical', 'Digital', 'Hybrid'], nullable: true },
            is_digital: { type: 'boolean', nullable: true },
            format: { type: 'string', enum: ['Physical', 'Digital', 'Hybrid'], nullable: true },
            access_policy: { type: 'string', nullable: true },
            cooperation_status: { type: 'string', nullable: true },
            copy_count: { type: 'integer', nullable: true },
            total_copies: { type: 'integer', nullable: true },
            countCopies: { type: 'integer', nullable: true },
            related_score: { type: 'number', nullable: true },
            view_count: { type: 'integer', nullable: true },
            favorite_count: { type: 'integer', nullable: true },
            publisher_name: { type: 'string', nullable: true }
          }
        },
        PublicationDetail: {
          type: 'object',
          description: 'Metadata chi tiết ấn phẩm phục vụ trang chi tiết App',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string', nullable: true },
            isbn: { type: 'string', nullable: true },
            title: { type: 'string' },
            author: { type: 'string' },
            authors_list: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' }
                }
              }
            },
            slug: { type: 'string', nullable: true },
            publisher_name: { type: 'string', nullable: true },
            description: { type: 'string' },
            cover_image: { type: 'string', nullable: true },
            thumbnail: { type: 'string', nullable: true },
            dominant_color: { type: 'string', nullable: true, example: '#4f46e5' },
            publication_year: { type: 'integer', nullable: true },
            pages: { type: 'integer', nullable: true },
            status: { type: 'string' },
            media_type: { type: 'string', enum: ['Physical', 'Digital', 'Hybrid'] },
            is_digital: { type: 'boolean' },
            format: { type: 'string', enum: ['Physical', 'Digital', 'Hybrid'] },
            cooperation_status: { type: 'string', nullable: true },
            storage_location_id: { type: 'integer', nullable: true },
            view_count: { type: 'integer' },
            favorite_count: { type: 'integer' },
            copy_count: { type: 'integer' },
            content_url: { type: 'string', nullable: true },
            digital_file_url: { type: 'string', nullable: true, description: 'URL hoặc path PDF/nguồn số hóa' },
            file_url: { type: 'string', nullable: true },
            pdf_url: { type: 'string', nullable: true, description: 'Alias tương thích ngược của nguồn PDF' },
            cover_url: { type: 'string', nullable: true },
            thumbnail_url: { type: 'string', nullable: true },
            access_policy: { type: 'string', enum: ['basic', 'premium', 'vip'] },
            canRead: { type: 'boolean', description: 'Cờ quyền đọc online' },
            actions: { $ref: '#/components/schemas/PublicationReadingActions' },
            current_collection: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'integer' },
                name: { type: 'string', nullable: true }
              }
            },
            collection_list: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  publication_count: { type: 'integer' }
                }
              }
            },
            copies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  barcode: { type: 'string' },
                  copy_number: { type: 'string' },
                  price: { type: 'number' },
                  status: { type: 'string' },
                  storage_location_id: { type: 'integer', nullable: true },
                  storage_name: { type: 'string', nullable: true }
                }
              }
            },
            related_documents: {
              type: 'array',
              items: { $ref: '#/components/schemas/PublicationRelatedItem' }
            },
            information_fields: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  key: { type: 'string' },
                  label: { type: 'string' },
                  value: {
                    oneOf: [
                      { type: 'string' },
                      { type: 'number' },
                      { type: 'boolean' }
                    ]
                  }
                }
              }
            },
            preview_pages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  index: { type: 'integer' },
                  label: { type: 'string' },
                  value: { type: 'integer' }
                }
              }
            },
            digitized_files: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  type: { type: 'string' },
                  url: { type: 'string', nullable: true },
                  path: { type: 'string', nullable: true },
                  size: { type: 'integer', nullable: true }
                }
              }
            },
            reading_content: { $ref: '#/components/schemas/PublicationReadingContent' },
            user_interaction: {
              type: 'object',
              nullable: true,
              properties: {
                isFavorited: { type: 'boolean' },
                hasDownloaded: { type: 'boolean' },
                readCount: { type: 'integer' }
              }
            }
          }
        },
        PublicationReadingActions: {
          type: 'object',
          description: 'Quyền/hành động đọc sách cho App',
          properties: {
            can_read_online: { type: 'boolean' },
            can_download_pdf: { type: 'boolean' },
            can_borrow_request: { type: 'boolean' },
            required_action: { type: 'string', enum: ['read_now', 'borrow_request', 'none'] },
          }
        },
        PublicationReadingContent: {
          type: 'object',
          description: 'Dữ liệu đọc online chuẩn cho App: tách PDF/chương và toàn văn/cuộn',
          properties: {
            can_read: { type: 'boolean' },
            source_policy: {
              type: 'object',
              properties: {
                page: { type: 'string', example: 'pdf' },
                chapter: { type: 'string', example: 'pdf' },
                scroll: { type: 'string', example: 'fulltext' },
              }
            },
            available_modes: {
              type: 'array',
              items: { type: 'string', enum: ['page', 'chapter', 'scroll'] }
            },
            default_mode: { type: 'string', nullable: true, enum: ['page', 'chapter', 'scroll'] },
            page_mode: {
              type: 'object',
              nullable: true,
              properties: {
                enabled: { type: 'boolean' },
                pdf_url: { type: 'string', nullable: true },
                pdf_asset: { type: 'object', nullable: true },
                total_pages: { type: 'integer' },
                preview_pages: { type: 'array', items: { type: 'object' } },
                preview_source: { type: 'string', nullable: true },
                preview_images_ready: { type: 'boolean' },
              }
            },
            chapter_mode: {
              type: 'object',
              nullable: true,
              properties: {
                enabled: { type: 'boolean' },
                total_chapters: { type: 'integer' },
                chapters: { type: 'array', items: { type: 'object' } },
              }
            },
            scroll_mode: {
              type: 'object',
              nullable: true,
              properties: {
                enabled: { type: 'boolean' },
                full_text: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    enabled: { type: 'boolean' },
                    format: { type: 'string', nullable: true, enum: ['html', 'text'] },
                    content: { type: 'string', nullable: true },
                    word_count: { type: 'integer' },
                    excerpt: { type: 'string', nullable: true },
                  }
                }
              }
            }
          }
        },
        PublicationLookups: {
          type: 'object',
          properties: {
            authors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  publication_count: { type: 'integer' }
                }
              }
            },
            publishers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  publication_count: { type: 'integer' }
                }
              }
            },
            collections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  publication_count: { type: 'integer' }
                }
              }
            },
            years: {
              type: 'array',
              items: { type: 'integer' }
            },
            languages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  language: { type: 'string' },
                  publication_count: { type: 'integer' }
                }
              }
            },
            media_types: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  media_type: { type: 'string' },
                  publication_count: { type: 'integer' }
                }
              }
            }
          }
        },
        Publisher: {
          type: 'object',
          properties: {
            id:          { type: 'integer' },
            name:        { type: 'string' },
            slug:        { type: 'string' },
            description: { type: 'string', nullable: true },
            status:      { type: 'string', default: 'active' },
          },
        },
        Author: {
          type: 'object',
          properties: {
            id:          { type: 'integer' },
            name:        { type: 'string' },
            slug:        { type: 'string' },
            bio:         { type: 'string', nullable: true },
            nationality: { type: 'string', nullable: true },
            status:      { type: 'string', default: 'active' },
          },
        },
        News: {
          type: 'object',
          description: 'Bài viết/tin tức đã xuất bản cho App',
          properties: {
            id:             { type: 'integer' },
            title:          { type: 'string', description: 'Tiêu đề tin tức' },
            slug:           { type: 'string' },
            summary:        { type: 'string', description: 'Mô tả ngắn/bản tóm tắt' },
            excerpt:        { type: 'string', description: 'Alias tương thích ngược của summary' },
            content:        { type: 'string', nullable: true, description: 'Nội dung chi tiết tin tức' },
            author:         { type: 'string', nullable: true },
            readTime:       { type: 'string', nullable: true, description: 'Thời gian đọc ước tính' },
            read_time:      { type: 'string', nullable: true, description: 'Tên cũ tương thích ngược' },
            thumbnail:      { type: 'string', nullable: true, description: 'Ảnh đại diện hiển thị ngoài danh sách/app' },
            imageUrl:       { type: 'string', nullable: true, description: 'Ảnh chi tiết dùng trong nội dung bài viết' },
            image_url:      { type: 'string', nullable: true, description: 'Tên cũ tương thích ngược của imageUrl' },
            galleryImages:  { type: 'array', items: { type: 'string' } },
            isFeatured:     { type: 'boolean', default: false },
            is_featured:    { type: 'boolean', default: false, description: 'Tên cũ tương thích ngược' },
            status:         { type: 'string', enum: ['draft', 'published', 'archived'] },
            publishedDate:  { type: 'string', format: 'date' },
            published_date: { type: 'string', format: 'date', description: 'Tên cũ tương thích ngược' },
            createdAt:      { type: 'string', nullable: true },
            commentsCount:  { type: 'integer', default: 0 },
          },
        },
        NewsListResponse: {
          type: 'object',
          description: 'Response danh sách tin tức chuẩn cho App',
          properties: {
            items: { type: 'array', items: { $ref: '#/components/schemas/News' } },
            totalRecords: { type: 'integer', example: 50 },
            pageIndex: { type: 'integer', example: 1 },
            pageSize: { type: 'integer', example: 10 },
          },
          example: {
            items: [
              {
                id: 101,
                title: 'Thư viện ra mắt không gian đọc mới',
                slug: 'thu-vien-ra-mat-khong-gian-doc-moi',
                summary: 'Không gian đọc hiện đại dành cho bạn đọc.',
                excerpt: 'Không gian đọc hiện đại dành cho bạn đọc.',
                content: null,
                author: 'Ban Truyền thông',
                readTime: '3 phút đọc',
                thumbnail: '/uploads/news/news-101-thumb.jpg',
                imageUrl: '/uploads/news/news-101-cover.jpg',
                galleryImages: ['/uploads/news/news-101-1.jpg'],
                isFeatured: true,
                status: 'published',
                publishedDate: '2026-04-19',
                commentsCount: 12
              }
            ],
            totalRecords: 50,
            pageIndex: 1,
            pageSize: 10,
          }
        },
        NewsDetailResponse: {
          type: 'object',
          description: 'Response chi tiết bài viết chuẩn cho App',
          allOf: [
            { $ref: '#/components/schemas/News' },
            {
              type: 'object',
              properties: {
                content: { type: 'string', nullable: true },
                galleryTitle: { type: 'string', nullable: true },
                seoTitle: { type: 'string', nullable: true },
                seoDescription: { type: 'string', nullable: true },
                seoKeywords: { type: 'string', nullable: true },
                galleryImages: { type: 'array', items: { type: 'string' } },
              }
            }
          ],
          example: {
            id: 101,
            title: 'Thư viện ra mắt không gian đọc mới',
            slug: 'thu-vien-ra-mat-khong-gian-doc-moi',
            summary: 'Không gian đọc hiện đại dành cho bạn đọc.',
            excerpt: 'Không gian đọc hiện đại dành cho bạn đọc.',
            content: '<p>Nội dung chi tiết bài viết...</p>',
            author: 'Ban Truyền thông',
            readTime: '3 phút đọc',
            thumbnail: '/uploads/news/news-101-thumb.jpg',
            imageUrl: '/uploads/news/news-101-cover.jpg',
            galleryImages: ['/uploads/news/news-101-1.jpg'],
            isFeatured: true,
            status: 'published',
            publishedDate: '2026-04-19',
            commentsCount: 12,
            galleryTitle: 'Thư viện cập nhật',
            seoTitle: 'Thư viện ra mắt không gian đọc mới',
            seoDescription: 'Bài viết giới thiệu không gian đọc mới.',
            seoKeywords: 'thư viện, không gian đọc, app',
          }
        },
        Comment: {
          type: 'object',
          description: 'Bình luận chuẩn cho App và CMS, hỗ trợ cây reply đa tầng',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer', nullable: true },
            user_name: { type: 'string', nullable: true },
            userEmail: { type: 'string', nullable: true },
            userRole: { type: 'string', nullable: true },
            objectType: { type: 'string', enum: ['news', 'book', 'course'] },
            objectId: { type: 'integer' },
            parentId: { type: 'integer', nullable: true },
            replyToUserId: { type: 'integer', nullable: true },
            content: { type: 'string' },
            rating: { type: 'integer', nullable: true },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'hidden', 'deleted'] },
            likes_count: { type: 'integer', nullable: true },
            dislikes_count: { type: 'integer', nullable: true },
            is_featured: { type: 'boolean', nullable: true },
            report_count: { type: 'integer', nullable: true },
            news_title: { type: 'string', nullable: true },
            book_title: { type: 'string', nullable: true },
            object_title: { type: 'string', nullable: true },
            replies: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
            created_at: { type: 'string' },
            updated_at: { type: 'string', nullable: true },
          },
        },
        CommentListResponse: {
          type: 'object',
          description: 'Response danh sách comment theo bài tin cho App/CMS',
          properties: {
            items: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
            totalRecords: { type: 'integer', example: 25 },
            pageIndex: { type: 'integer', example: 1 },
            pageSize: { type: 'integer', example: 10 },
          },
          example: {
            items: [
              {
                id: 201,
                userId: 12,
                user_name: 'Nguyễn Văn A',
                userEmail: 'reader@example.com',
                userRole: 'reader',
                objectType: 'news',
                objectId: 101,
                parentId: null,
                replyToUserId: null,
                content: 'Bài viết rất hữu ích!',
                rating: null,
                status: 'approved',
                likes_count: 2,
                dislikes_count: 0,
                is_featured: false,
                report_count: 0,
                news_title: 'Tin bài mẫu',
                book_title: null,
                object_title: 'Tin bài mẫu',
                replies: [
                  {
                    id: 202,
                    userId: 15,
                    user_name: 'Trần Thị B',
                    userEmail: 'reader2@example.com',
                    userRole: 'reader',
                    objectType: 'news',
                    objectId: 101,
                    parentId: 201,
                    replyToUserId: 12,
                    content: 'Mình cũng thấy vậy.',
                    rating: null,
                    status: 'approved',
                    likes_count: 0,
                    dislikes_count: 0,
                    is_featured: false,
                    report_count: 0,
                    news_title: null,
                    book_title: null,
                    object_title: null,
                    replies: [],
                    created_at: '2026-04-19T10:15:00Z',
                    updated_at: null
                  }
                ],
                created_at: '2026-04-19T10:00:00Z',
                updated_at: null
              }
            ],
            totalRecords: 25,
            pageIndex: 1,
            pageSize: 10,
          }
        },
        CommentCreateResponse: {
          type: 'object',
          description: 'Response sau khi tạo bình luận/thả phản hồi',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            user_name: { type: 'string' },
            userEmail: { type: 'string', nullable: true },
            userRole: { type: 'string', nullable: true },
            content: { type: 'string' },
            objectType: { type: 'string', enum: ['news', 'book', 'course'] },
            objectId: { type: 'integer' },
            parentId: { type: 'integer', nullable: true },
            replyToUserId: { type: 'integer', nullable: true },
            rating: { type: 'integer', nullable: true },
            status: { type: 'string' },
            likes_count: { type: 'integer', nullable: true },
            dislikes_count: { type: 'integer', nullable: true },
            is_featured: { type: 'boolean', nullable: true },
            created_at: { type: 'string' },
            updated_at: { type: 'string', nullable: true },
            replies: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
          },
          example: {
            id: 301,
            userId: 12,
            user_name: 'Nguyễn Văn A',
            userEmail: 'reader@example.com',
            userRole: 'reader',
            content: 'Bài viết rất hữu ích!',
            objectType: 'news',
            objectId: 101,
            parentId: null,
            replyToUserId: null,
            rating: null,
            status: 'approved',
            likes_count: 0,
            dislikes_count: 0,
            is_featured: false,
            created_at: '2026-04-19T10:30:00Z',
            updated_at: null,
            replies: []
          }
        },
        CommentCreateRequest: {
          type: 'object',
          description: 'Request tạo bình luận hoặc phản hồi',
          required: ['objectType', 'objectId', 'content'],
          properties: {
            objectType: { type: 'string', enum: ['news', 'book', 'course'], example: 'news' },
            objectId: { type: 'integer', example: 101 },
            parentId: { type: 'integer', nullable: true, example: null },
            replyToUserId: { type: 'integer', nullable: true, example: null },
            content: { type: 'string', example: 'Bài viết rất hữu ích!' },
            rating: { type: 'integer', nullable: true, example: 5 },
          },
          example: {
            objectType: 'news',
            objectId: 101,
            parentId: null,
            replyToUserId: null,
            content: 'Bài viết rất hữu ích!',
            rating: null,
          }
        },
        CommentUpdateRequest: {
          type: 'object',
          description: 'Request cập nhật nội dung bình luận',
          required: ['content'],
          properties: {
            content: { type: 'string', example: 'Nội dung cmt đã cập nhật' },
          },
          example: {
            content: 'Nội dung cmt đã cập nhật'
          }
        },
        CommentUpdateResponse: {
          type: 'object',
          description: 'Response sau khi cập nhật bình luận',
          properties: {
            id: { type: 'integer' },
            content: { type: 'string' },
            updated_at: { type: 'string' },
          },
          example: {
            id: 301,
            content: 'Nội dung cmt đã cập nhật',
            updated_at: '2026-04-19T10:45:00Z'
          }
        },
        CommentDeleteResponse: {
          type: 'object',
          description: 'Response sau khi xóa bình luận',
          properties: {
            deleted: { type: 'boolean', example: true },
            id: { type: 'integer', example: 301 },
          },
          example: {
            deleted: true,
            id: 301
          }
        },
        CommentReportRequest: {
          type: 'object',
          description: 'Báo cáo comment không phù hợp',
          required: ['commentId', 'lyDo'],
          properties: {
            commentId: { type: 'integer', example: 301, description: 'id bình luận' },
            lyDo: { type: 'integer', enum: [1, 2, 3, 4], example: 4, description: '1=Spam | 2=Ngôn từ xúc phạm | 3=Thông tin sai | 4=Khác' },
            moTa: { type: 'string', nullable: true, example: 'Bình luận có nội dung không phù hợp' },
          },
          example: {
            commentId: 301,
            lyDo: 4,
            moTa: 'Bình luận có nội dung không phù hợp'
          }
        },
        CommentReportResponse: {
          type: 'object',
          description: 'Response sau khi báo cáo bình luận',
          properties: {
            reported: { type: 'boolean', example: true },
            commentId: { type: 'integer', example: 301 },
            lyDo: { type: 'integer', example: 4 },
          },
          example: {
            reported: true,
            commentId: 301,
            lyDo: 4
          }
        },
        AdminCommentReport: {
          type: 'object',
          description: 'Response báo cáo bình luận cho CMS',
          properties: {
            id: { type: 'integer' },
            commentId: { type: 'integer' },
            reporterId: { type: 'integer' },
            reporterName: { type: 'string' },
            reporterEmail: { type: 'string', nullable: true },
            reason: { type: 'string' },
            description: { type: 'string', nullable: true },
            reportType: { type: 'integer' },
            status: { type: 'string' },
            resolvedBy: { type: 'integer', nullable: true },
            resolvedAt: { type: 'string', nullable: true },
            commentContent: { type: 'string', nullable: true },
            created_at: { type: 'string' },
          },
        },
        CommentReactRequest: {
          type: 'object',
          description: 'Phản ứng với bình luận',
          required: ['commentId', 'loaiReact'],
          properties: {
            commentId: { type: 'integer', example: 301 },
            loaiReact: { type: 'integer', enum: [0, 1, 2], example: 2, description: '0 unlike/remove, 1 like, 2 dislike' },
          },
          example: {
            commentId: 301,
            loaiReact: 2
          }
        },
        CommentReactResponse: {
          type: 'object',
          description: 'Response sau khi phản ứng comment',
          properties: {
            commentId: { type: 'integer', example: 301 },
            loaiReact: { type: 'integer', example: 2 },
            action: { type: 'string', example: 'updated' },
            likes_count: { type: 'integer', example: 10 },
            dislikes_count: { type: 'integer', example: 2 },
          },
          example: {
            commentId: 301,
            loaiReact: 2,
            action: 'updated',
            likes_count: 10,
            dislikes_count: 2
          }
        },
        CommentModerateRequest: {
          type: 'object',
          description: 'Request duyệt/ẩn/từ chối comment',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['approved', 'rejected', 'hidden'], example: 'approved' },
          },
        },
        AdminCommentResponse: {
          type: 'object',
          description: 'Response comment cho CMS',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            user_name: { type: 'string', nullable: true },
            userEmail: { type: 'string', nullable: true },
            userRole: { type: 'string', nullable: true },
            objectType: { type: 'string' },
            objectId: { type: 'integer' },
            parentId: { type: 'integer', nullable: true },
            replyToUserId: { type: 'integer', nullable: true },
            content: { type: 'string' },
            rating: { type: 'integer', nullable: true },
            status: { type: 'string' },
            likes_count: { type: 'integer', nullable: true },
            dislikes_count: { type: 'integer', nullable: true },
            is_featured: { type: 'boolean', nullable: true },
            report_count: { type: 'integer', nullable: true },
            news_title: { type: 'string', nullable: true },
            book_title: { type: 'string', nullable: true },
            object_title: { type: 'string', nullable: true },
            created_at: { type: 'string' },
            updated_at: { type: 'string', nullable: true },
          },
        },
        AdminCommentReportList: {
          type: 'array',
          items: { $ref: '#/components/schemas/AdminCommentReport' },
        },
        DashboardSummaryResponse: {
          type: 'object',
          description: 'Tổng hợp số liệu dashboard',
          properties: {
            totalBooks: { type: 'integer', example: 1200 },
            totalAuthors: { type: 'integer', example: 140 },
            totalCollections: { type: 'integer', example: 32 },
            totalMembers: { type: 'integer', example: 850 },
            totalCeasedCooperationBooks: { type: 'integer', example: 8 },
            totalViews: { type: 'integer', example: 52000 },
            totalRevenue: { type: 'number', example: 125000000 },
            totalFavorites: { type: 'integer', example: 4300 },
            totalBorrows: { type: 'integer', example: 2800 },
            totalOverdueLoans: { type: 'integer', example: 45 },
            totalPendingRequests: { type: 'integer', example: 12 },
            avgRating: { type: 'number', example: 4.6 },
            totalRatings: { type: 'integer', example: 780 },
            ratingDistribution: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  rating: { type: 'integer' },
                  count: { type: 'integer' },
                }
              }
            },
            loanTrends: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  count: { type: 'integer' },
                }
              }
            },
            recentLoans: { type: 'array', items: { type: 'object' } },
            recentReviews: { type: 'array', items: { type: 'object' } },
            recentComments: { type: 'array', items: { type: 'object' } },
          }
        },
        DashboardAlertsResponse: {
          type: 'object',
          description: 'Cảnh báo hệ thống dashboard',
          properties: {
            unreadCount: { type: 'integer', example: 18 },
            alerts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  severity: { type: 'string' },
                  title: { type: 'string' },
                  message: { type: 'string' },
                  href: { type: 'string' },
                  count: { type: 'integer' },
                  created_at: { type: 'string' },
                }
              }
            },
            generatedAt: { type: 'string', format: 'date-time' },
          }
        },
        DashboardAIInsightsResponse: {
          type: 'object',
          description: 'Phân tích AI dashboard',
          properties: {
            source: { type: 'string', example: 'gemini' },
            overview: { type: 'string' },
            priorities: { type: 'array', items: { type: 'object' } },
            opportunities: { type: 'array', items: { type: 'object' } },
            risks: { type: 'array', items: { type: 'object' } },
            fallbackReason: { type: 'string', nullable: true },
            generatedAt: { type: 'string', format: 'date-time' },
          }
        },
        Member: {
          type: 'object',
          properties: {
            id:                   { type: 'integer' },
            card_number:          { type: 'string' },
            full_name:            { type: 'string' },
            email:                { type: 'string' },
            phone:                { type: 'string' },
            balance:              { type: 'number', default: 0 },
            status:               { type: 'string', default: 'active' },
            membership_expires:   { type: 'string', format: 'date-time', nullable: true },
            created_at:           { type: 'string', format: 'date-time' },
          },
        },
        MediaFile: {
          type: 'object',
          properties: {
            id:            { type: 'integer' },
            folder_id:      { type: 'integer', nullable: true },
            original_name:  { type: 'string' },
            filename:       { type: 'string' },
            file_path:      { type: 'string' },
            file_url:       { type: 'string' },
            file_type:      { type: 'string' },
            mime_type:      { type: 'string', nullable: true },
            file_size:      { type: 'integer', nullable: true },
            width:          { type: 'integer', nullable: true },
            height:         { type: 'integer', nullable: true },
            dimensions:     { type: 'string', nullable: true },
            alt_text:       { type: 'string', nullable: true },
            title:          { type: 'string', nullable: true },
            description:    { type: 'string', nullable: true },
            uploaded_by:    { type: 'integer', nullable: true },
            created_at:     { type: 'string', format: 'date-time' },
          },
        },
        StorageLocation: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id:            { type: 'integer' },
            member_id:     { type: 'integer', nullable: true },
            sender_id:     { type: 'integer', nullable: true },
            target_type:   { type: 'string', enum: ['individual', 'all'] },
            title:         { type: 'object', description: 'Tiêu đề đa ngôn ngữ (JSONB)' },
            message:       { type: 'object', description: 'Nội dung đa ngôn ngữ (JSONB)' },
            metadata:      { type: 'object', nullable: true },
            type:          { type: 'string', enum: ['overdue', 'renewal', 'system', 'payment'] },
            status:        { type: 'string', enum: ['draft', 'sent', 'failed', 'archived'] },
            is_read:       { type: 'boolean', default: false },
            related_id:    { type: 'string', nullable: true, description: 'ID liên quan (Transaction ID, etc.)' },
            related_type:  { type: 'string', nullable: true },
            created_at:    { type: 'string', format: 'date-time' },
            updated_at:    { type: 'string', format: 'date-time' },
          },
        },
        NotificationListResponse: {
          type: 'object',
          description: 'Danh sách thông báo cá nhân cho App',
          properties: {
            items: { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
            startupAnnouncement: { $ref: '#/components/schemas/Notification', nullable: true },
            unreadCount: { type: 'integer', example: 3 }
          },
          example: {
            items: [
              {
                id: 1,
                member_id: 12,
                sender_id: null,
                target_type: 'individual',
                title: { vi: 'Nhắc gia hạn', en: 'Renewal reminder' },
                message: { vi: 'Gói hội viên sắp hết hạn', en: 'Your membership is expiring soon' },
                metadata: { type: 'membership' },
                type: 'renewal',
                status: 'sent',
                is_read: false,
                related_id: 'MEM-12',
                related_type: 'membership',
                created_at: '2026-04-19T10:00:00Z',
                updated_at: '2026-04-19T10:00:00Z'
              }
            ],
            startupAnnouncement: {
              id: 2,
              member_id: null,
              sender_id: null,
              target_type: 'all',
              title: { vi: 'Thông báo hệ thống', en: 'System notice' },
              message: { vi: 'Thư viện mở cửa sớm hôm nay', en: 'Library opens early today' },
              metadata: { show_on_app_open: true },
              type: 'system',
              status: 'sent',
              is_read: false,
              related_id: null,
              related_type: 'system',
              created_at: '2026-04-19T08:00:00Z',
              updated_at: '2026-04-19T08:00:00Z'
            },
            unreadCount: 3
          }
        },
        ResourceItem: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Lập trình Node.js' },
            thumbnail: { type: 'string', nullable: true, example: '/uploads/books/nodejs.jpg' },
            author: { type: 'string', nullable: true, example: 'Nguyễn Văn A' },
            publication_year: { type: 'integer', nullable: true, example: 2023 },
            dominant_color: { type: 'string', nullable: true, example: '#4f46e5' },
            is_digital: { type: 'boolean', example: false },
            views: { type: 'integer', nullable: true, example: 120 },
            borrow_count: { type: 'integer', nullable: true, example: 48 },
            rating: { type: 'number', nullable: true, example: 4.8 },
          }
        },
        ResourceTabItem: {
          type: 'object',
          properties: {
            key: { type: 'string', example: 'trending' },
            label: { type: 'string', example: 'Xu hướng' },
            icon: { type: 'string', example: 'flame' }
          }
        },
        ResourceListResponse: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { $ref: '#/components/schemas/ResourceItem' } },
            totalRecords: { type: 'integer', example: 10 },
            pageIndex: { type: 'integer', example: 1 },
            pageSize: { type: 'integer', example: 10 }
          },
          example: {
            items: [
              {
                id: 1,
                title: 'Lập trình Node.js',
                thumbnail: '/uploads/books/nodejs.jpg',
                author: 'Nguyễn Văn A',
                publication_year: 2023,
                dominant_color: '#4f46e5',
                is_digital: false,
                views: 120,
                borrow_count: 48,
                rating: 4.8
              }
            ],
            totalRecords: 10,
            pageIndex: 1,
            pageSize: 10
          }
        },
        ResourceTabResponse: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { $ref: '#/components/schemas/ResourceTabItem' } }
          },
          example: {
            items: [
              { key: 'trending', label: 'Xu hướng', icon: 'flame' },
              { key: 'favorite', label: 'Yêu thích', icon: 'heart' }
            ]
          }
        },
        SearchAutocompleteItem: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 42 },
            label: { type: 'string', example: 'Python Crash Course' },
            subtitle: { type: 'string', example: 'Eric Matthes' },
            thumbnail: { type: 'string', nullable: true, example: 'https://...' },
            year: { type: 'integer', example: 2023 },
            type: { type: 'string', enum: ['Physical', 'Digital', 'Hybrid'] }
          },
          example: {
            id: 42,
            label: 'Python Crash Course',
            subtitle: 'Eric Matthes',
            thumbnail: 'https://cdn.example.com/python.jpg',
            year: 2023,
            type: 'Physical'
          }
        },
        SearchPublicationsResponse: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { $ref: '#/components/schemas/Publication' } },
            pagination: { $ref: '#/components/schemas/Pagination' }
          },
          example: {
            items: [
              {
                id: 11,
                code: 'BK-0011',
                isbn: '978-604-1-12345-6',
                title: 'Node.js nâng cao',
                author: 'Nguyễn Văn A',
                slug: 'nodejs-nang-cao',
                publisher_name: 'NXB Khoa học',
                description: 'Tài liệu tham khảo về Node.js',
                cover_image: '/uploads/books/nodejs.jpg',
                thumbnail: '/uploads/books/nodejs-thumb.jpg',
                publication_year: 2023,
                pages: 320,
                status: 'available',
                media_type: 'Physical',
                is_digital: false,
                format: 'Physical',
                access_policy: 'basic',
                cooperation_status: 'cooperating',
                copy_count: 12,
                total_copies: 12,
                countCopies: 12,
                view_count: 120,
                favorite_count: 45,
                dominant_color: '#4f46e5',
                created_at: '2026-04-19T10:00:00Z'
              }
            ],
            pagination: { pageIndex: 1, pageSize: 10, totalRecords: 1, totalPages: 1 }
          }
        },
        SearchNewsResponse: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { $ref: '#/components/schemas/News' } },
            pagination: { $ref: '#/components/schemas/Pagination' }
          },
          example: {
            items: [
              {
                id: 101,
                title: 'Thư viện ra mắt không gian đọc mới',
                slug: 'thu-vien-ra-mat-khong-gian-doc-moi',
                summary: 'Không gian đọc hiện đại dành cho bạn đọc.',
                excerpt: 'Không gian đọc hiện đại dành cho bạn đọc.',
                content: null,
                author: 'Ban Truyền thông',
                readTime: '3 phút đọc',
                thumbnail: '/uploads/news/news-101-thumb.jpg',
                imageUrl: '/uploads/news/news-101-cover.jpg',
                galleryImages: [],
                isFeatured: true,
                status: 'published',
                publishedDate: '2026-04-19',
                commentsCount: 12
              }
            ],
            pagination: { pageIndex: 1, pageSize: 10, totalRecords: 1, totalPages: 1 }
          }
        },
        StorageLocation: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        WalletDepositOrder: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            member_id: { type: 'integer' },
            amount: { type: 'number' },
            client_reference: { type: 'string' },
            transfer_code: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'credited', 'failed', 'expired', 'cancelled'] },
            expires_at: { type: 'string', format: 'date-time' },
            matched_external_txn_id: { type: 'string', nullable: true },
            credited_at: { type: 'string', format: 'date-time', nullable: true },
            failure_reason: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js', './src/routes/reader/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

const adminSwaggerSpec = createSubsetSpec(swaggerSpec, {
  title: 'Thư viện TN CMS API - Admin',
  description: [
    'Swagger chuyên biệt cho khối **Admin/CMS**.',
    '',
    'Bao gồm endpoint: `/api/admin/*` và `/api/auth/*` để vận hành đầy đủ luồng quản trị.',
  ].join('\n'),
  matcher: (path) => path.startsWith('/api/admin/') || path.startsWith('/api/auth/'),
});

const appSwaggerSpec = createSubsetSpec(swaggerSpec, {
  title: 'Thư viện TN CMS API - App/Reader/Public',
  description: [
    'Swagger chuyên biệt cho khối **Mobile App + Public API + Reader API**.',
    '',
    'Bao gồm endpoint: `/api/reader/*`, `/api/public/*` và `/api/auth/*` để frontend/mobile dễ theo dõi.',
  ].join('\n'),
  matcher: (path) => (
    path.startsWith('/api/reader/') ||
    path.startsWith('/api/public/') ||
    path.startsWith('/api/auth/')
  ),
});

const integrationSwaggerSpec = createSubsetSpec(swaggerSpec, {
  title: 'Thư viện TN CMS API - Integration/Webhooks',
  description: 'Swagger chuyên biệt cho khối tích hợp ngoài hệ thống: `/api/webhooks/*`.',
  matcher: (path) => path.startsWith('/api/webhooks/'),
});

module.exports = {
  swaggerSpec,
  adminSwaggerSpec,
  appSwaggerSpec,
  integrationSwaggerSpec,
};
