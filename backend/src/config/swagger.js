const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Thư viện TN CMS API',
      version: '1.0.0',
      description: 'RESTful API cho Thư viện TN. Dùng Bearer JWT cho các endpoint /api/admin/* (đăng nhập để lấy token).',
    },
    servers: [{ url: 'http://localhost:5000', description: 'Local dev' }],
    tags: [
      { name: 'Admin Dashboard', description: 'API tổng quan hệ thống dành cho Quản trị viên' },
      { name: 'Admin News', description: 'Quản lý tin tức, bài viết và danh mục tin tức' },
      { name: 'Admin Books', description: 'Quản lý ấn phẩm, sách, tác giả và nhà xuất bản' },
      { name: 'Admin Loans', description: 'Quản lý mượn trả sách, gia hạn và đặt chỗ' },
      { name: 'Admin Members', description: 'Quản lý hội viên, nâng cấp gói và giao dịch nạp tiền' },
      { name: 'Admin Media', description: 'Quản lý thư viện hình ảnh và tệp tin' },
      { name: 'Admin System', description: 'Quản lý người dùng, vai trò, quyền và cài đặt hệ thống' },
      { name: 'Public Search', description: 'Tìm kiếm ấn phẩm công khai' },
      { name: 'Public News', description: 'Xem tin tức dành cho người đọc' },
      { name: 'Public Books', description: 'Xem chi tiết ấn phẩm dành cho người đọc' },
      { name: 'Public Membership', description: 'Thông tin gói hội viên và đăng ký' },
      { name: 'App Reader', description: 'API dành riêng cho ứng dụng di động người đọc' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        BaseResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Thao tác thành công' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Đã có lỗi xảy ra' },
            error_code: { type: 'string', example: 'INTERNAL_SERVER_ERROR' },
          },
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer', nullable: true },
            user_name: { type: 'string' },
            action: { type: 'string', example: 'UPDATE' },
            module: { type: 'string', example: 'COURSE' },
            entity_id: { type: 'string' },
            description: { type: 'string' },
            old_data: { type: 'object', nullable: true },
            new_data: { type: 'object', nullable: true },
            ip_address: { type: 'string' },
            user_agent: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        MembershipRequest: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            member_id: { type: 'integer' },
            member_name: { type: 'string' },
            plan_id: { type: 'integer' },
            plan_name: { type: 'string' },
            amount: { type: 'number' },
            request_note: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            admin_note: { type: 'string', nullable: true },
            processed_by: { type: 'integer', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            processed_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        BookLoan: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            member_id: { type: 'integer' },
            member_name: { type: 'string' },
            copy_id: { type: 'integer' },
            book_title: { type: 'string' },
            barcode: { type: 'string' },
            borrow_date: { type: 'string', format: 'date-time' },
            due_date: { type: 'string', format: 'date-time' },
            return_date: { type: 'string', format: 'date-time', nullable: true },
            status: { type: 'string', enum: ['borrowing', 'returned', 'overdue', 'lost'] },
            fine_amount: { type: 'number', default: 0 },
            notes: { type: 'string', nullable: true },
          },
        },
        BookReservation: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            member_id: { type: 'integer' },
            publication_id: { type: 'integer' },
            reserve_date: { type: 'string', format: 'date-time' },
            expiration_date: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['pending', 'notified', 'completed', 'cancelled', 'expired'] },
            notes: { type: 'string', nullable: true },
          },
        },
        Publication: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string', description: 'Mã quản lý nội bộ' },
            isbn: { type: 'string' },
            title: { type: 'string', description: 'Tiêu đề ấn phẩm' },
            author: { type: 'string' },
            authors_list: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } } },
            slug: { type: 'string' },
            publisher_id: { type: 'integer', nullable: true },
            publisher_name: { type: 'string', nullable: true },
            collection_id: { type: 'string', format: 'uuid', nullable: true },
            collection_name: { type: 'string', nullable: true },
            description: { type: 'string' },
            cover_image: { type: 'string', description: 'URL ảnh bìa' },
            thumbnail: { type: 'string', description: 'Alias của cover_image' },
            publication_year: { type: 'integer' },
            language: { type: 'string', default: 'vi' },
            pages: { type: 'integer', nullable: true },
            price: { type: 'number' },
            rental_price: { type: 'number' },
            status: { type: 'string', default: 'available' },
            cooperation_status: { type: 'string', default: 'cooperating' },
            media_type: { type: 'string', enum: ['Physical', 'Digital', 'Hybrid'] },
            access_policy: { type: 'string', enum: ['basic', 'premium', 'vip'] },
            edition: { type: 'string', nullable: true },
            volume: { type: 'string', nullable: true },
            dimensions: { type: 'string', nullable: true },
            keywords: { type: 'array', items: { type: 'string' } },
            toc: { type: 'array', items: { type: 'object' }, description: 'Mục lục ấn phẩm' },
            digital_content: { type: 'object', description: 'Nội dung số chi tiết' },
            digital_file_url: { type: 'string', nullable: true },
            is_digital: { type: 'boolean' },
            ai_summary: { type: 'string', nullable: true },
            dominant_color: { type: 'string', example: '#4f46e5' },
            metadata: { type: 'object' },
            rating_average: { type: 'number', description: 'Điểm đánh giá trung bình' },
            total_reviews: { type: 'integer', description: 'Tổng số lượt đánh giá' },
            total_borrowed: { type: 'integer', description: 'Tổng số lượt mượn' },
            view_count: { type: 'integer', description: 'Tổng lượt xem thực tế' },
            favorite_count: { type: 'integer', description: 'Tổng lượt yêu thích thực tế' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          },
        },
        PublicationDetail: {
          allOf: [
            { $ref: '#/components/schemas/Publication' },
            {
              type: 'object',
              properties: {
                copies: { 
                  type: 'array', 
                  items: { 
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      barcode: { type: 'string' },
                      copy_number: { type: 'string' },
                      status: { type: 'string' },
                      condition: { type: 'string' },
                      storage_name: { type: 'string', description: 'Tên kệ/kho' },
                      price: { type: 'number' }
                    }
                  }
                },
                relatedItems: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      title: { type: 'string' },
                      cover_image: { type: 'string' },
                      author: { type: 'string' },
                      media_type: { type: 'string' }
                    }
                  }
                }
              }
            }
          ]
        },
        Publisher: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            address: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            email: { type: 'string', nullable: true },
            website: { type: 'string', nullable: true },
            status: { type: 'string', default: 'active' },
          },
        },
        Author: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            slug: { type: 'string' },
            bio: { type: 'string', nullable: true },
            nationality: { type: 'string', nullable: true },
            status: { type: 'string', default: 'active' },
          },
        },
        News: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            slug: { type: 'string' },
            summary: { type: 'string' },
            content: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'published', 'archived'] },
            image_url: { type: 'string', nullable: true },
            author: { type: 'string', default: 'Admin' },
            read_time: { type: 'string', nullable: true },
            published_date: { type: 'string', format: 'date' },
            is_featured: { type: 'boolean', default: false },
            category_id: { type: 'integer', nullable: true },
          },
        },
        Member: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            card_number: { type: 'string' },
            full_name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            balance: { type: 'number', default: 0 },
            status: { type: 'string', default: 'active' },
            membership_expires: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        MediaFile: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            file_name: { type: 'string' },
            file_path: { type: 'string' },
            file_type: { type: 'string' },
            file_size: { type: 'integer' },
            folder_id: { type: 'integer', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            recipient_id: { type: 'integer' },
            title: { type: 'string' },
            message: { type: 'string' },
            type: { type: 'string' },
            is_read: { type: 'boolean', default: false },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
