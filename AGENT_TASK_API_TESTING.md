# Backend Agent Task: API Contracts & Basic Testing

## Context
You are the Backend Agent. The System Architect has requested that you implement an OpenAPI specification generation strategy and basic testing for the NestJS backend template. This will serve as a launchpad for future applications.

## Objective
Automate OpenAPI specification generation to serve as a shared contract with the frontend, and implement foundational testing (E2E and Unit) for the Auth module.

## 1. OpenAPI Specification Generation (Code-First)
- **Configuration**: In `src/main.ts`, ensure `@nestjs/swagger` is fully configured using `DocumentBuilder`. Set the title, description, version, and enable bearer auth.
- **JSON Export Script**: We need a way to automatically export the `swagger-spec.json` file so the frontend can consume it.
  - Create a script (e.g., `scripts/generate-swagger.ts`) that initializes the Nest application context, builds the Swagger document, and writes it to `swagger-spec.json` at the project root using `fs.writeFileSync`.
  - Add a script in `package.json`: `"generate:api-spec": "ts-node scripts/generate-swagger.ts"`.
- **Decorate DTOs**: 
  - Ensure all DTOs in the Auth module (`RegisterDto`, `LoginDto`, `AuthResponseDto`, etc.) are heavily decorated with `@ApiProperty()`. Include types, requirements, and realistic examples.
- **Decorate Controllers**:
  - In `auth.controller.ts`, add `@ApiTags('Auth')`, `@ApiOperation()`, and `@ApiResponse()` decorators to clearly document the endpoints and their expected HTTP status codes.

## 2. Basic Testing Implementation
- **Unit Tests**:
  - File: `src/auth/auth.service.spec.ts`
  - Mock external dependencies like `PrismaService` and `JwtService`.
  - Test `register`: Ensure it handles successful registration and throws errors for duplicate users.
  - Test `login`: Ensure it handles successful token generation, invalid passwords, and non-existent users.
- **E2E Tests**:
  - File: `test/auth.e2e-spec.ts`
  - Setup a testing module.
  - Test the full `POST /auth/register` HTTP flow.
  - Test the full `POST /auth/login` HTTP flow and verify the JWT token return structure.
- **Configuration**: Ensure standard NestJS testing packages (`@nestjs/testing`, `jest`, `supertest`) are functional and scripts like `npm run test` and `npm run test:e2e` are present in `package.json`.

Please implement these specifications exactly as described.
