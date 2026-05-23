# NestJS Backend Starter Template

A production-ready NestJS backend template with **multi-provider authentication** (email + phone OTP), **RBAC with granular permissions**, **SQLite**, and **CRUD patterns**.

Built for Flutter/Laravel/React developers who need a clean, modular, and secure REST API backend.

---

## Features

| Feature | Description |
|---------|-------------|
| **Email Authentication** | Register, login, JWT access + refresh tokens, logout |
| **Phone OTP Authentication** | Register/login via phone number with simulated 6-digit OTP |
| **Password Reset** | Token-based forgot/reset password flow (SHA-256 hashed tokens) |
| **Role-Based Access (RBAC)** | `USER` and `ADMIN` roles with granular permissions (`users:read`, `users:write`, `users:delete`, `users:manage`) |
| **User Management** | Profile CRUD, admin user list, FCM token storage |
| **API Versioning** | All routes under `/api/v1/` |
| **Modular Structure** | Feature-based modules (Auth, Users, Health) |
| **Health Check** | Database connectivity endpoint |
| **SQLite Database** | Zero-config local database (Prisma 7 ORM with indexes) |
| **API Documentation** | Swagger UI at `/docs` with accurate `$ref` response schemas |
| **Unified Responses** | `{ success, data }` / `{ success, error }` format |
| **Validation** | `class-validator` + `class-transformer` on all DTOs (with `@MaxLength`) |
| **Error Handling** | 3-layer filter system (generic, HTTP, Prisma) with production-safe messages |
| **Security Headers** | Helmet middleware with CSP (strict in production) |
| **Rate Limiting** | Global + per-endpoint throttling (3–10 req/60s) |
| **Request Logging** | Interceptor logs all HTTP requests with duration, status, IP |
| **Database Indexes** | Optimized indexes on `role`, `otpHash + otpExpiresAt`, `isActive`, `passwordResetExpires` |
| **Graceful Shutdown** | SIGTERM/SIGINT handlers + `uncaughtException` / `unhandledRejection` |
| **Cross-Platform** | Windows, Linux, macOS — LF line endings, native modules compile everywhere |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create SQLite database and run migrations
npx prisma migrate dev --name init

# 3. (Optional) Seed with admin user
npm run prisma:seed

# 4. Start development server
npm run start:dev
```

Server runs at **http://localhost:3000** — Swagger docs at **http://localhost:3000/docs**

> **API Versioning**: All API routes are prefixed with `/api/v1/`. For example: `GET /api/v1/users/me`, `POST /api/v1/auth/login`.

> **Default seed admin**: `admin@example.com` / `admin123`

---

## Cross-Platform Support

This template runs on **Windows**, **Linux**, and **macOS**.

| Concern | Status |
|---------|--------|
| **Line endings** | `.gitattributes` enforces LF in repo, auto-converts on checkout |
| **Native modules** | `bcrypt` and `better-sqlite3` compile on all platforms |
| **Docker (Alpine)** | Build tools (`python3`, `make`, `g++`) pre-installed in Dockerfile |
| **Node.js version** | `.nvmrc` / `.node-version` pin to Node 20 |
| **Path separators** | All scripts use forward slashes (Node.js handles cross-platform) |

> **Windows users**: Run commands in **Git Bash**, **WSL**, or **PowerShell**. If you encounter native module build errors, ensure you have [windows-build-tools](https://github.com/felixrieseberg/windows-build-tools) installed:
> ```bash
> npm install --global windows-build-tools
> ```

---

## Project Structure

```
src/
├── main.ts                  # App bootstrap (pipes, filters, helmet, cors, rate limiting, graceful shutdown)
├── app.module.ts            # Root module (ThrottlerModule, ConfigModule, feature modules)
├── config/
│   ├── configuration.ts     # Env vars + Joi validation (JWT secrets min 32 chars)
│   └── swagger.config.ts    # Swagger UI setup at /docs
├── common/
│   ├── decorators/          # @Public(), @Roles(), @Permissions(), @CurrentUser()
│   ├── dto/                 # Shared DTOs (pagination, api-response, paginated-response)
│   ├── filters/             # AllExceptionsFilter, HttpExceptionFilter, PrismaExceptionFilter
│   ├── guards/              # JwtAuthGuard, RolesGuard (with permission checking)
│   ├── interceptors/        # TransformInterceptor, LoggingInterceptor
│   └── permissions/         # Permission constants, role-permission mapping
├── modules/
│   ├── auth/                # Authentication (JWT, email + phone OTP, password reset)
│   │   └── dto/             # Request + response DTOs with Swagger $ref schemas
│   ├── users/               # User CRUD (self profile, admin management)
│   │   └── dto/             # Request + response DTOs with Swagger $ref schemas
│   └── health/              # Database health check
│       └── dto/             # Health response DTO
└── shared/
    └── prisma/              # PrismaService, pagination.helper.ts
```

Each feature module follows the pattern:

```
<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── <feature>.repository.ts
└── dto/
    ├── create-<feature>.dto.ts
    └── update-<feature>.dto.ts
```

---

## Authentication

### Email / Password Flow

| Step | Endpoint | Description |
|------|----------|-------------|
| 1 | `POST /api/v1/auth/register` | Create account with email + password |
| 2 | `POST /api/v1/auth/login` | Get JWT access + refresh tokens |
| 3 | Use `Authorization: Bearer <accessToken>` header for protected endpoints |
| 4 | `POST /api/v1/auth/refresh` | Get new token pair when access token expires |
| 5 | `POST /api/v1/auth/logout` | Invalidate the refresh token |

### Phone OTP Flow

OTP is verified using **timing-safe comparison** (`crypto.timingSafeEqual`). In development mode (simulated), the OTP can be viewed in server logs; it is **never returned** in the API response.

| Step | Endpoint | Description |
|------|----------|-------------|
| 1 | `POST /api/v1/auth/phone/send-otp` | Send phone → 6-digit OTP generated and hashed (SHA-256) |
| 2 | `POST /api/v1/auth/phone/verify-otp` | Send phone + otp → receive JWT tokens |

- Phone format: international (`+201234567890`)
- OTP expires after 5 minutes
- First-time phone creates a new inactive user; verification activates it
- Existing users can login by requesting a new OTP

### Password Reset

Tokens are **SHA-256 hashed** before storage (never stored in plaintext) and looked up via direct indexed query (O(1), no linear scan).

| Step | Endpoint | Description |
|------|----------|-------------|
| 1 | `POST /api/v1/auth/forgot-password` | Request reset (returns same message whether email exists or not) |
| 2 | `POST /api/v1/auth/reset-password` | Submit token + new password |

### JWT Token Payload

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "phone": "+201234567890"
}
```

---

## Role-Based Access Control (RBAC)

### Roles

| Role | Description |
|------|-------------|
| `USER` | Default role for new registrations |
| `ADMIN` | Elevated role with full system access |

### Permissions

Granular permissions are defined in `src/common/permissions/permission.constants.ts`:

```typescript
Permission = {
  USERS_READ:   'users:read',
  USERS_WRITE:  'users:write',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE: 'users:manage',   // update role, deactivate
  AUTH_LOGOUT:  'auth:logout',
  SYSTEM_HEALTH:'system:health',
}
```

### Role → Permission Mapping

| Permission | USER | ADMIN |
|------------|:----:|:-----:|
| `users:read` | ✅ (self) | ✅ |
| `users:write` | ✅ (self) | ✅ |
| `users:delete` | ✅ (self) | ✅ |
| `users:manage` | ❌ | ✅ |
| `auth:logout` | ✅ | ✅ |

### Usage in Code

```typescript
@Roles('ADMIN')
@Permissions(Permission.USERS_READ)
@Get()
findAll() { ... }
```

- `@Roles()` checks the user's role field
- `@Permissions()` checks the role-permission mapping
- Both decorators can be used together or separately
- Throws `ForbiddenException` with a descriptive message on failure

---

## Error Handling

The template uses a 3-layer exception filter system:

| Filter | Priority | Catches | Info Leakage Protection |
|--------|----------|---------|------------------------|
| `AllExceptionsFilter` | 1st | Any unhandled exception | Returns generic `"Internal server error"` in production |
| `HttpExceptionFilter` | 2nd | `HttpException` subclasses | Structured error format, no stack traces |
| `PrismaClientExceptionFilter` | 3rd | Prisma-specific errors | P2002 → 409, P2025 → 404 |

### Prisma Error Codes

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| P2002 | Unique constraint violation | 409 Conflict |
| P2025 | Record not found | 404 Not Found |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./dev.db` | SQLite database file path |
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment (affects Helmet CSP, error verbosity) |
| `JWT_SECRET` | — | JWT signing secret (min **32** chars) |
| `JWT_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_SECRET` | — | Refresh token secret (min **32** chars) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |
| `FRONTEND_URL` | `http://localhost:4200` | Allowed CORS origin (required in production) |

Copy `.env.example` to `.env` and update values.

---

## API Endpoints

### Auth (`/api/v1/auth`)

| Method | Path | Auth | Permission | Rate Limit | Description |
|--------|------|:----:|:----------:|:----------:|-------------|
| POST | `/api/v1/auth/register` | Public | — | 5 req/60s | Register with email + password |
| POST | `/api/v1/auth/login` | Public | — | 3 req/60s | Login with email + password |
| POST | `/api/v1/auth/refresh` | Public | — | 10 req/60s | Refresh JWT tokens |
| POST | `/api/v1/auth/logout` | JWT | `auth:logout` | 10 req/60s | Invalidate refresh token |
| POST | `/api/v1/auth/forgot-password` | Public | — | 3 req/60s | Request password reset |
| POST | `/api/v1/auth/reset-password` | Public | — | 10 req/60s | Reset password with token |
| POST | `/api/v1/auth/phone/send-otp` | Public | — | 3 req/60s | Send OTP to phone |
| POST | `/api/v1/auth/phone/verify-otp` | Public | — | 5 req/60s | Verify OTP and get tokens |

### Users (`/api/v1/users`)

| Method | Path | Auth | Permission | Description |
|--------|------|:----:|:----------:|-------------|
| GET | `/api/v1/users/me` | JWT | `users:read` | Get own profile |
| PUT | `/api/v1/users/me` | JWT | `users:write` | Update own profile |
| DELETE | `/api/v1/users/me` | JWT | `users:delete` | Delete own account |
| PATCH | `/api/v1/users/fcm-token` | JWT | `users:write` | Update FCM push token |
| GET | `/api/v1/users` | Admin | `users:read` | List all users (paginated) |
| GET | `/api/v1/users/:id` | Admin | `users:read` | Get user by ID |
| PUT | `/api/v1/users/:id` | Admin | `users:manage` | Update any user (including role) |
| DELETE | `/api/v1/users/:id` | Admin | `users:delete` | Delete any user |

### Health (`/api/v1/health`)

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/health` | Public | Database connectivity check (200=up, 503=down) |

---

## Scripts

```bash
npm run start:dev     # Watch mode development on http://localhost:3000
npm run build         # Compile to dist/
npm run test          # Unit tests (38 tests)
npm run test:e2e      # End-to-end tests (40 tests)
npm run lint          # Lint + fix
npm run prisma:studio # Prisma Studio (DB GUI at http://localhost:5555)
npm run prisma:migrate # Create new migration
npm run prisma:seed   # Seed admin user (admin@example.com / admin123)
```

---

## Adding a New Feature Module

```bash
# 1. Generate scaffolding
nest generate resource modules/<name>

# 2. Create request DTOs with class-validator decorators (@MaxLength, @IsString, etc.)
# 3. Create response DTOs extending ApiSuccessResponse in src/common/dto/api-response.dto.ts
# 4. Add Swagger decorators using @ApiWrappedResponse() from common decorators
# 5. Create <name>.repository.ts for Prisma operations with proper select projections
# 6. Register module in app.module.ts
# 7. Add permissions to src/common/permissions/permission.constants.ts
# 8. Grant permissions in src/common/permissions/role-permissions.ts
# 9. Add @Throttle() decorators for rate limiting on auth endpoints
```

---

## Docker

```bash
# Build and run
docker compose up -d

# The API will be at http://localhost:3000
# SQLite database is persisted via a Docker volume
```

---

## Response Format

**Success (200):**
```json
{ "success": true, "data": { ... } }
```

**Success (paginated — 200):**
```json
{
  "success": true,
  "data": {
    "data": [ ... ],
    "meta": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
  }
}
```

**Error (400/401/403/404):**
```json
{
  "success": false,
  "error": { "statusCode": 400, "message": "..." }
}
```

**Server Error (500 — production):**
```json
{
  "success": false,
  "error": { "statusCode": 500, "message": "Internal server error" }
}
```

---

## Tests

| Suite | Type | File | Tests |
|-------|------|------|:----:|
| AuthService | Unit | `src/modules/auth/auth.service.spec.ts` | 33 |
| UsersService | Unit | `src/modules/users/users.service.spec.ts` | 5 |
| Auth | E2E | `test/auth.e2e-spec.ts` | 26 |
| Users | E2E | `test/users.e2e-spec.ts` | 14 |
| **Total** | | | **78** |

```bash
# Run all tests
npm run test && npm run test:e2e

# Watch mode
npm run test -- --watch
npm run test:e2e -- --watch
```

---

## Security

| Measure | Implementation |
|---------|---------------|
| **Password hashing** | `bcrypt` with salt rounds = 10 |
| **OTP comparison** | `crypto.timingSafeEqual()` — constant-time, no timing leakage |
| **OTP hashing** | SHA-256, expires after 5 minutes |
| **Reset token hashing** | SHA-256 (not plaintext), direct indexed lookup O(1) |
| **JWT secrets** | Min **32 characters** — validated by Joi on startup |
| **JWT signing** | HS256 via `@nestjs/jwt` with separate access/refresh secrets |
| **Refresh tokens** | Hashed with `bcrypt` before storage, single-use rotation |
| **Rate limiting** | `@nestjs/throttler` — 10 req/60s global, 3–5 req/60s on auth endpoints |
| **Security headers** | `helmet()` middleware with CSP (strict in production, relaxed in dev for Swagger) |
| **Request body limit** | 1 MB (JSON + URL-encoded) |
| **CORS** | Explicit allow-list via `FRONTEND_URL` (never `true` in production) |
| **Input validation** | `class-validator` on all DTOs; `@MaxLength` on every string field; `ValidationPipe` globally with `whitelist` + `forbidNonWhitelisted` |
| **Mass assignment protection** | Self-update strips `role` and `isActive` fields |
| **Error info leakage** | Generic `"Internal server error"` in production (no stack traces) |
| **Audit logging** | `LoggingInterceptor` — logs method, URL, status, duration, IP, user agent (4xx=WARN, 5xx=ERROR) |
| **Graceful shutdown** | `enableShutdownHooks`, `uncaughtException`, `unhandledRejection` handlers |

---

## Performance

### Database Indexes

`prisma/schema.prisma` includes 4 custom indexes beyond the default PK + unique constraints:

| Index | Fields | Purpose |
|-------|--------|---------|
| `@@index([role])` | `role` | Admin user listing (filters by role) |
| `@@index([otpHash, otpExpiresAt])` | `otpHash`, `otpExpiresAt` | OTP verification queries |
| `@@index([isActive])` | `isActive` | Active/deactivated user filtering |
| `@@index([passwordResetExpires])` | `passwordResetExpires` | Reset token expiry checks |

### Query Optimization

All repository queries use **projected `select`** clauses — only the required fields are fetched from the database:

- Write operations (`update`, `delete`) select only `{ id: true }`
- Read operations select exactly the fields needed by the caller
- `findAll` excludes `password` and `refreshToken` at the database level

### Pagination Helper

`src/shared/prisma/pagination.helper.ts` provides reusable utilities:

```typescript
calculatePagination(page, limit)  // → { skip, take } with bounds clamping
createPaginationMeta(total, page, limit)  // → { total, page, limit, totalPages }
paginateResult(data, total, input)  // → { data, meta }
```

All paginated endpoints clamp page to ≥1 and limit to 1–100.

---

## Response DTOs

The project uses **typed Response DTOs** for accurate Swagger `$ref` schema generation:

- `ApiSuccessResponse<T>` — wraps `data` in `{ success: true, data: ... }`
- `ApiErrorResponse` — wraps errors in `{ success: false, error: ... }`
- `PaginatedResponseDto<T>` — wraps `data[]` + `PaginationMetaDto`
- `MessageResponseDto` — for endpoints returning `{ message: "..." }`

Custom reusable decorators simplify Swagger setup:

```typescript
@ApiWrappedResponse(UserResponseDto, { status: 200, description: 'User found' })
@ApiPaginatedResponse(UserResponseDto, { description: 'Paginated list' })
@ApiMessageResponse({ status: 200, description: 'Operation successful' })
```

---

## License

MIT
