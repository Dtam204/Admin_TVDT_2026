const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SFB CMS API',
      version: '1.0.0',
      description:
        'RESTful API cho CMS SFB. Dùng Bearer JWT cho các endpoint /api/admin/* (đăng nhập để lấy token).',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Local dev',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // dùng JSDoc comments trong routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };


