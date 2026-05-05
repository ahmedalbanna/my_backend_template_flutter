# Backend Architecture

The backend is built using **NestJS** following a **Modular and Layered Architecture**.

## 1. Modular Design
Each feature is encapsulated in a dedicated module. A module typically contains:
- `controller`: Handles HTTP requests.
- `service`: Contains business logic.
- `repository`: Handles data persistence (Prisma).
- `dto`: Data Transfer Objects for validation.
- `entities`: Domain models.

## 2. Layers
- **Presentation Layer**: Controllers and DTOs.
- **Application Layer**: Services (Business logic).
- **Infrastructure Layer**: Repositories, Database (Prisma), External APIs.

## 3. Dependency Injection
NestJS's built-in DI system is used to manage dependencies between layers. Services are injected into controllers, and repositories are injected into services.
