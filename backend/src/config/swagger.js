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
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        BaseResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            code: { type: 'integer' },
            data: { type: 'object' },
          },
        },
        Publication: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            maSoBieuGhi: { type: 'string' },
            title: { type: 'string' },
            author: { type: 'string' },
            thumbnail: { type: 'string' },
            category: { type: 'string' },
            format: { type: 'string' },
            language: { type: 'string' },
            publisher: { type: 'string' },
            publicationYear: { type: 'string' },
            pageCount: { type: 'string' },
            description: { type: 'string' },
            isbdContent: { type: 'string' },
            isDigital: { type: 'boolean' },
            readOnlineUrl: { type: 'string' },
            viewCount: { type: 'integer' },
            downloadCount: { type: 'integer' },
            likeCount: { type: 'integer' },
            ratingScore: { type: 'number' },
            status: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            metadata: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nhan: { type: 'string' },
                  ma: { type: 'string' },
                  giaTri: { type: 'string' },
                },
              },
            },
            aiSummary: { type: 'string' },
            dominantColor: { type: 'string' },
            trendingScore: { type: 'number' },
          },
        },
        Book: {
          $ref: '#/components/schemas/Publication',
        },
        BookCategory: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string', example: 'FICTION' },
            name: { type: 'object', properties: { vi: { type: 'string' }, en: { type: 'string' } }, example: { vi: 'Văn học', en: 'Fiction' } },
            slug: { type: 'string', example: 'van-hoc' },
            description: { type: 'object', properties: { vi: { type: 'string' }, en: { type: 'string' } } },
            icon: { type: 'string', example: 'book' },
            parent_id: { type: 'integer', nullable: true },
            sort_order: { type: 'integer', example: 0 },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
          },
        },
        Publisher: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string', example: 'NXB Trẻ' },
            slug: { type: 'string', example: 'nxb-tre' },
            description: { type: 'string' },
            address: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email' },
            website: { type: 'string', format: 'uri' },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
          },
        },
        Author: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'object', properties: { vi: { type: 'string' }, en: { type: 'string' } }, example: { vi: 'Nguyễn Nhật Ánh', en: 'Nguyen Nhat Anh' } },
            slug: { type: 'string', example: 'nguyen-nhat-anh' },
            bio: { type: 'object', properties: { vi: { type: 'string' }, en: { type: 'string' } } },
            nationality: { type: 'string', example: 'Vietnam' },
            birth_year: { type: 'integer', example: 1955 },
            featured: { type: 'boolean', example: true },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
          },
        },
        BookLoan: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            member_id: { type: 'integer' },
            book_id: { type: 'integer' },
            loan_date: { type: 'string', format: 'date' },
            due_date: { type: 'string', format: 'date' },
            return_date: { type: 'string', format: 'date', nullable: true },
            status: { type: 'string', enum: ['borrowed', 'returned', 'overdue', 'lost'], example: 'borrowed' },
            late_fee: { type: 'number', example: 0 },
            notes: { type: 'string' },
          },
        },
        BookReservation: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            member_id: { type: 'integer' },
            book_id: { type: 'integer' },
            status: { type: 'string', enum: ['pending', 'notified', 'fulfilled', 'cancelled', 'expired'], example: 'pending' },
            requested_at: { type: 'string', format: 'date-time' },
            notified_at: { type: 'string', format: 'date-time', nullable: true },
            expires_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        News: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'object', properties: { vi: { type: 'string' }, en: { type: 'string' } } },
            slug: { type: 'string' },
            content: { type: 'object', properties: { vi: { type: 'string' }, en: { type: 'string' } } },
            category_id: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'published', 'archived'] },
            image_url: { type: 'string' },
            is_featured: { type: 'boolean' },
          },
        },
        Collection: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string', example: 'Sách mới nhập 2024' },
            description: { type: 'string' },
            icon: { type: 'string' },
            order_index: { type: 'integer' },
            is_active: { type: 'boolean' },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            transaction_id: { type: 'string' },
            member_id: { type: 'integer' },
            type: { type: 'string', enum: ['membership', 'book_rental', 'late_fee', 'deposit'] },
            amount: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
            payment_method: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Member: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            card_number: { type: 'string' },
            full_name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            identity_number: { type: 'string' },
            membership_plan_id: { type: 'integer' },
            balance: { type: 'number' },
            status: { type: 'string', enum: ['active', 'inactive', 'locked'] },
            date_of_birth: { type: 'string', format: 'date' },
            gender: { type: 'string', enum: ['male', 'female', 'other'] },
            membership_expires: { type: 'string', format: 'date-time' },
          },
        },
        NewsCategory: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'NEWS' },
            name: { type: 'string', example: 'Tin tức chung' },
            description: { type: 'string' },
            parent_code: { type: 'string', nullable: true },
            is_active: { type: 'boolean', example: true },
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
