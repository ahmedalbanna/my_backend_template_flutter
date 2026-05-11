# CHANGELOG

## [1.1.0] - 2026-05-06

### Improved
- `JwtStrategy`: Now returns both `id` and `userId` in the payload attached to `req.user`. This ensures compatibility with controllers using either naming convention (`req.user.id` or `req.user.userId`).
