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
        '### Cấu trúc Item ấn phẩm Mobile (7 trường)',
        '```json',
        '{',
        '  "id": 1,',
        '  "nhanDe": "Tên sách",',
        '  "tacGia": "Tác giả",',
        '  "anhDaiDien": "https://...",',
        '  "namXuatBan": 2023,',
        '  "nhaXuatBan": "NXB...",',
        '  "trang": 320',
        '}',
        '```',
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
          description: 'JWT Token nhận được từ POST /api/auth/login',
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
            digital_file_url: { type: 'string', nullable: true },
            file_url: { type: 'string', nullable: true },
            pdf_url: { type: 'string', nullable: true },
            cover_url: { type: 'string', nullable: true },
            thumbnail_url: { type: 'string', nullable: true },
            access_policy: { type: 'string', enum: ['basic', 'premium', 'vip'] },
            canRead: { type: 'boolean' },
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
          properties: {
            id:             { type: 'integer' },
            title:          { type: 'string' },
            slug:           { type: 'string' },
            summary:        { type: 'string' },
            status:         { type: 'string', enum: ['draft', 'published', 'archived'] },
            image_url:      { type: 'string', nullable: true },
            is_featured:    { type: 'boolean', default: false },
            published_date: { type: 'string', format: 'date' },
          },
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
