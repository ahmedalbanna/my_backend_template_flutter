# NestJS Backend Starter Template

A production-ready NestJS backend template with **multi-provider authentication** (email + phone OTP), **RBAC with granular permissions**, **SQLite**, and **CRUD patterns**.

Built for Flutter/Laravel/React developers who need a clean, modular, and secure REST API backend.

---

## Features

| Feature | Description |
|---------|-------------|
| **Email Authentication** | Register, login, JWT access + refresh tokens, logout |
| **Phone OTP Authentication** | Register/login via phone number with simulated 6-digit OTP |
| **Password Reset** | Token-based forgot/reset password flow |
| **Role-Based Access (RBAC)** | `USER` and `ADMIN` roles with granular permissions (`users:read`, `users:write`, `users:delete`, `users:manage`) |
| **User Management** | Profile CRUD, admin user list, FCM token storage |
| **Modular Structure** | Feature-based modules (Auth, Users, Health) |
| **Health Check** | Database connectivity endpoint |
| **SQLite Database** | Zero-config local database (Prisma 7 ORM) |
| **API Documentation** | Swagger UI at `/docs` with response examples |
| **Unified Responses** | `{ success, data }` / `{ success, error }` format |
| **Validation** | `class-validator` + `class-transformer` on all DTOs |
| **Error Handling** | Catches all exceptions (generic, HTTP, Prisma) with structured error responses |
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
├── main.ts                  # App bootstrap (pipes, filters, swagger, cors, graceful shutdown)
├── app.module.ts            # Root module
├── config/
│   ├── configuration.ts     # Env vars + Joi validation
│   └── swagger.config.ts    # Swagger UI setup
├── common/
│   ├── decorators/          # @Public(), @Roles(), @Permissions(), @CurrentUser()
│   ├── dto/                 # Shared DTOs (pagination)
│   ├── filters/             # AllExceptionsFilter, HttpExceptionFilter, PrismaExceptionFilter
│   ├── guards/              # JwtAuthGuard, RolesGuard
│   ├── interceptors/        # TransformInterceptor
│   └── permissions/         # Permission constants, role-permission mapping
├── modules/
│   ├── auth/                # Authentication (JWT, email + phone OTP, password reset)
│   ├── users/               # User CRUD (self profile, admin management)
│   └── health/              # Database health check
└── shared/
    └── prisma/              # PrismaService (database client, Prisma 7 adapter)
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

The OTP is **simulated** — the code is returned in the response for testing.

| Step | Endpoint | Description |
|------|----------|-------------|
| 1 | `POST /api/v1/auth/phone/send-otp` | Send phone → receive `{ otp: "123456" }` (6 digits) |
| 2 | `POST /api/v1/auth/phone/verify-otp` | Send phone + otp → receive JWT tokens |

- Phone format: international (`+201234567890`)
- OTP expires after 5 minutes
- First-time phone creates a new inactive user; verification activates it
- Existing users can login by requesting a new OTP

### Password Reset

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

The template uses a layered exception filter system:

| Filter | Priority | Catches |
|--------|----------|---------|
| `AllExceptionsFilter` | 1st | Any unhandled exception (logs + returns 500) |
| `HttpExceptionFilter` | 2nd | `HttpException` subclasses (structured error format) |
| `PrismaClientExceptionFilter` | 3rd | Prisma-specific errors (P2002 → 409, P2025 → 404) |

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
| `NODE_ENV` | `development` | Environment |
| `JWT_SECRET` | — | JWT signing secret (min 16 chars) |
| `JWT_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_SECRET` | — | Refresh token secret (min 16 chars) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |

Copy `.env.example` to `.env` and update values.

---

## API Endpoints

### Auth (`/api/v1/auth`)

| Method | Path | Auth | Permission | Description |
|--------|------|:----:|:----------:|-------------|
| POST | `/api/v1/auth/register` | Public | — | Register with email + password |
| POST | `/api/v1/auth/login` | Public | — | Login with email + password |
| POST | `/api/v1/auth/refresh` | Public | — | Refresh JWT tokens |
| POST | `/api/v1/auth/logout` | JWT | `auth:logout` | Invalidate refresh token |
| POST | `/api/v1/auth/forgot-password` | Public | — | Request password reset |
| POST | `/api/v1/auth/reset-password` | Public | — | Reset password with token |
| POST | `/api/v1/auth/phone/send-otp` | Public | — | Send OTP to phone (simulated) |
| POST | `/api/v1/auth/phone/verify-otp` | Public | — | Verify OTP and get tokens |

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
npm run test          # Unit tests (37 tests)
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

# 2. Create DTOs with class-validator decorators
# 3. Create <name>.repository.ts for Prisma operations
# 4. Register module in app.module.ts
# 5. Add Swagger decorators to controller and DTOs
# 6. Add permissions to src/common/permissions/permission.constants.ts
# 7. Grant permissions in src/common/permissions/role-permissions.ts
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

**Success:**
```json
{ "success": true, "data": { ... } }
```

**Error:**
```json
{
  "success": false,
  "error": { "statusCode": 400, "message": "..." }
}
```

---

## Tests

| Suite | Type | File | Tests |
|-------|------|------|:----:|
| AuthService | Unit | `src/modules/auth/auth.service.spec.ts` | 33 |
| UsersService | Unit | `src/modules/users/users.service.spec.ts` | 37 |
| Auth | E2E | `test/auth.e2e-spec.ts` | 26 |
| Users | E2E | `test/users.e2e-spec.ts` | 40 |

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
| Password hashing | `bcrypt` with salt rounds = 10 |
| OTP storage | SHA-256 hash, expires after 5 minutes |
| JWT signing | RS256 via `@nestjs/jwt` with separate access/refresh secrets |
| Refresh tokens | Hashed with `bcrypt` before storage |
| Input validation | `class-validator` on all DTOs; `ValidationPipe` globally with `whitelist` + `forbidNonWhitelisted` |
| CORS | Configurable via `FRONTEND_URL` env var |
| Graceful shutdown | `enableShutdownHooks`, `uncaughtException`, `unhandledRejection` handlers |

---

## License

MIT
