# Deployment Guide

## Docker
```bash
# Build the image
docker build -t my-backend .

# Run with PostgreSQL
docker-compose up -d
```

## Environment Variables
Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — 16+ char random string
- `JWT_REFRESH_SECRET` — 16+ char random string
- `FRONTEND_URL` — Frontend origin for CORS
- `SMTP_*` — Email configuration (optional)
- `REDIS_*` — Redis for Bull queues (optional)

## Production Checklist
1. Set `NODE_ENV=production`
2. Run `npx prisma migrate deploy` (not `dev`)
3. CORS `origin` should point to the actual frontend URL
4. Remove any `'super-secret'` fallback values
5. Enable rate limiting via ThrottlerModule (already configured)
6. Set up monitoring with Terminus health checks at `/health`

## Database Migrations
```bash
# Development
npx prisma migrate dev --name <migration-name>

# Production
npx prisma migrate deploy
```
