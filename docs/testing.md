# Testing Strategy

## Unit Tests
Tests are written using Jest and located next to each service/module:
- `src/**/*.spec.ts` — Unit tests for services, controllers, and guards

Run with:
```bash
npm run test        # Run all unit tests
npm run test:watch  # Watch mode
npm run test:cov    # With coverage report
```

### Mocking
- Services are tested with mocked repositories (jest mocks)
- External services (EmailService, FirebaseService) are mocked
- Prisma calls are mocked at the repository layer

## E2E Tests
Integration tests live in `test/` and use supertest:
```bash
npm run test:e2e    # Run all e2e tests
```

### E2E Test Setup
- Uses the full AppModule with an actual database connection
- EmailService is overridden with a mock to prevent actual email sending
- Each test cleans up after itself (test users/entities are deleted)

## Test Coverage Goals
- Services: 90%+ coverage
- Controllers: 80%+ coverage (via e2e)
- Guards: 100% coverage
