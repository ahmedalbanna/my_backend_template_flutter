import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('NestJS Backend Template API')
  .setDescription(
    `## Overview
A production-ready NestJS backend starter template with **JWT authentication**, **RBAC**, and **SQLite**.

---

## Authentication Flow

1. Register via \`POST /auth/register\` or login via \`POST /auth/login\`
2. Copy the \`accessToken\` from the response
3. Click the **Authorize** button at the top and paste: \`Bearer <your-token>\`
4. All protected endpoints now include your token automatically

> Access tokens expire in **15 minutes**. Use \`POST /auth/refresh\` with the \`refreshToken\` to get a new pair.

---

## Response Format

All responses follow a unified structure:

**Success (2xx):**
\`\`\`json
{
  "success": true,
  "data": { ... }
}
\`\`\`

**Error (4xx/5xx):**
\`\`\`json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Descriptive error message"
  }
}
\`\`\`

### HTTP Status Codes Used
| Code | Meaning |
|------|---------|
| 200 | Success (GET, PUT, PATCH) |
| 201 | Created (POST) |
| 400 | Bad Request — validation failed |
| 401 | Unauthorized — missing/invalid token |
| 403 | Forbidden — insufficient role |
| 404 | Not Found |
| 409 | Conflict — duplicate resource |
| 500 | Internal Server Error |

---

## Roles
Two roles are supported:
- **USER** — default role, can manage own profile
- **ADMIN** — can manage all users and perform admin operations

Endpoints requiring ADMIN role are marked with **[Admin]** in their summary.
`,
  )
  .setVersion('1.0.0')
  .setContact('API Support', '', '')
  .setLicense('MIT', 'https://opensource.org/licenses/MIT')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: `Paste your JWT access token here.

Example: Bearer eyJhbGciOiJIUzI1NiIs...
      `,
    },
    'JWT-auth',
  )
  .addTag(
    'Auth',
    '🔐 Authentication — register, login, token refresh, password management',
  )
  .addTag('Users', '👤 User management — profile CRUD, admin user management')
  .addTag('Health', '💚 System health — database connectivity check')
  .build();
