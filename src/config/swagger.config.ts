import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('NestJS Backend Template API')
  .setDescription(
    `## Overview
A production-ready NestJS backend template with JWT authentication, RBAC, file uploads, email service, and more.

## Authentication
Use **Bearer Token** authentication. Obtain a token via \`POST /auth/login\`.

## Response Format
All responses follow a unified structure:
- **Success**: \`{ success: true, data: ... }\`
- **Error**: \`{ success: false, error: { statusCode, message } }\`

## Rate Limiting
- Max **5 requests/second** per IP
- Max **100 requests/minute** per IP
`,
  )
  .setVersion('1.0.0')
  .setContact('Support', 'https://yourapp.com', 'support@yourapp.com')
  .setLicense('MIT', 'https://opensource.org/licenses/MIT')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'Enter your JWT access token',
      in: 'header',
    },
    'JWT-auth',
  )
  .addTag('Auth', 'Authentication endpoints – register, login, token refresh, password management')
  .addTag('Users', 'User management – CRUD operations (Admin protected)')
  .addTag('Upload', 'File upload endpoints – single & multiple file uploads')
  .addTag('Health', 'System health checks – database, memory')
  .build();
