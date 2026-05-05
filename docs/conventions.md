# Backend Conventions

## 1. Naming Conventions
- **Folders**: lowercase, kebab-case (e.g., `user-profile`).
- **Files**: PascalCase with type suffix (e.g., `UsersService.ts`, `UsersController.ts`).
- **Classes**: PascalCase (e.g., `class UsersService`).
- **Variables/Methods**: camelCase (e.g., `getUserById`).

## 2. RESTful API
- Endpoints should use plural nouns (e.g., `/users`, `/products`).
- Use appropriate HTTP verbs: `GET`, `POST`, `PATCH`, `DELETE`.
- Versioning: `/api/v1/...` (optional but recommended).

## 3. Validation
- Use `class-validator` and `class-transformer` in DTOs.
- All incoming requests must be validated using `ValidationPipe`.

## 4. Error Handling
- Throw `HttpException` or its subclasses (e.g., `NotFoundException`).
- A global `ExceptionFilter` formats all errors consistently.
