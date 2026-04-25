import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Haiphuc Shop API Documentation',
      version: '1.0.0',
      description: 'Hệ thống API quản lý cửa hàng Hải Phúc Shop (Admin & Client) - Senior Architect Edition',
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
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: 'Access token stored in HttpOnly cookie'
        },
        refreshCookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'Refresh token stored in HttpOnly cookie'
        }
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/models/*.ts'], 
};

export const swaggerSpec = swaggerJsdoc(options);
