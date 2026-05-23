# NestJS Backend Starter Template

A production-ready NestJS backend template with **JWT authentication**, **RBAC**, **SQLite**, and **CRUD patterns**.

Built for Flutter/Laravel/React developers who need a clean, modular, and secure REST API backend.

---

## Features

| Feature | Description |
|---------|-------------|
| **Authentication** | Register, login, JWT access + refresh tokens, logout |
| **Password Reset** | Token-based forgot/reset password flow |
| **Role-Based Access** | `USER` and `ADMIN` roles with `RolesGuard` |
| **User Management** | Profile CRUD, admin user list, FCM token storage |
| **Modular Structure** | Feature-based modules for easy extension |
| **Health Check** | Database connectivity endpoint |
| **SQLite Database** | Zero-config local database (Prisma ORM) |
| **API Documentation** | Swagger UI at `/docs` |
| **Unified Responses** | `{ success, data }` / `{ success, error }` format |
| **Validation** | `class-validator` + `class-transformer` on all DTOs |

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
├── main.ts                  # App bootstrap (pipes, filters, swagger, cors)
├── app.module.ts            # Root module
├── config/
│   ├── configuration.ts     # Env vars + Joi validation
│   └── swagger.config.ts    # Swagger UI setup
├── common/
│   ├── decorators/          # @Public(), @Roles(), @CurrentUser()
│   ├── dto/                 # Shared DTOs (pagination)
│   ├── filters/             # HttpExceptionFilter
│   ├── guards/              # JwtAuthGuard, RolesGuard
│   └── interceptors/        # TransformInterceptor
├── modules/
│   ├── auth/                # Authentication (JWT, register, login, refresh)
│   ├── users/               # User CRUD (profile, admin)
│   └── health/              # Database health check
└── shared/
    └── prisma/              # PrismaService (database client)
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

### Auth (`/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login |
| POST | `/auth/refresh` | Public | Refresh tokens |
| POST | `/auth/logout` | JWT | Invalidate refresh token |
| POST | `/auth/forgot-password` | Public | Request password reset |
| POST | `/auth/reset-password` | Public | Reset password with token |

### Users (`/users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me` | JWT | Get profile |
| PUT | `/users/me` | JWT | Update profile |
| DELETE | `/users/me` | JWT | Delete account |
| PATCH | `/users/fcm-token` | JWT | Update FCM token |
| GET | `/users` | Admin | List all users |
| GET | `/users/:id` | Admin | Get user by ID |
| PUT | `/users/:id` | Admin | Update any user |
| DELETE | `/users/:id` | Admin | Delete any user |

### Health (`/health`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | Database connectivity check |

---

## Scripts

```bash
npm run start:dev     # Watch mode development
npm run build         # Compile to dist/
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run lint          # Lint + fix
npm run prisma:studio # Prisma Studio (DB GUI)
npm run prisma:migrate # Create new migration
npm run prisma:seed   # Seed admin user
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
{ "success": false, "error": { "statusCode": 400, "message": "..." } }
```

---

## License

MIT
