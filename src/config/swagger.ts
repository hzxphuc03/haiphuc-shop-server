import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Haiphuc Shop API Documentation',
      version: '1.0.0',
      description: 'Hệ thống API quản lý cửa hàng Hải Phúc Shop (Admin & Client)',
      contact: {
        name: 'Hải Phúc Shop Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'https://haiphuc-shop-server.onrender.com',
        description: 'Production server',
      }
    ],
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
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Quét JSDoc từ routes và controllers
};

export const swaggerSpec = swaggerJsdoc(options);
