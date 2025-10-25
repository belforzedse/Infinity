# Local Development Setup

This guide explains how to run Strapi locally with Docker for PostgreSQL and Redis.

## Quick Start

### Option 1: Full Docker (Recommended for consistency)
Use `docker-compose.local.yml` to run everything in Docker with npm:

```bash
docker-compose -f docker-compose.local.yml up
```

This will:
- Start PostgreSQL on `localhost:5434`
- Start Redis on `localhost:6379`
- Start Strapi on `localhost:1337` with hot-reload

**Advantages:**
- Same environment as production
- No local dependencies needed
- Easy to reset with `docker-compose down -v`

---

### Option 2: Docker Services + Local Strapi (Fastest for development)
Run only Postgres and Redis in Docker, Strapi locally:

```bash
# Terminal 1: Start services
docker-compose up postgres redis

# Terminal 2: In infinity-backend directory
npm install
npm run dev
```

This will:
- Start PostgreSQL on `localhost:5434`
- Start Redis on `localhost:6379`
- Start Strapi on `localhost:1337` with hot-reload

**Advantages:**
- Faster hot-reload
- Better IDE integration and debugging
- Closer to local development experience

---

## Environment Configuration

The `.env` file is already configured for Docker:
- `DATABASE_HOST=postgres` (Docker service name)
- `REDIS_URL=redis://redis:6379` (Docker service name)

### Important Notes:
- When using Docker Compose, services communicate via service names (`postgres`, `redis`)
- When running Strapi locally (Option 2), update `.env`:
  - `DATABASE_HOST=localhost`
  - `REDIS_URL=redis://localhost:6379`
  - Or just keep it as-is (Docker names won't hurt when services are on `localhost`)

---

## Useful Commands

```bash
# View logs
docker-compose -f docker-compose.local.yml logs -f strapi

# Stop everything
docker-compose -f docker-compose.local.yml down

# Reset database and volumes
docker-compose -f docker-compose.local.yml down -v

# Access Strapi admin
http://localhost:1337/admin

# Access Strapi API
http://localhost:1337/api
```

---

## Troubleshooting

### Port already in use?
Change the port mapping in `docker-compose.local.yml`:
```yaml
ports:
  - "1338:1337"  # Use 1338 instead
```

### Database connection failed?
1. Ensure PostgreSQL service is running: `docker ps`
2. Check `.env` has correct `DATABASE_HOST`
3. Verify credentials match in `.env`

### Hot-reload not working?
- Make sure you're using `docker-compose.local.yml` (not the original)
- If using Option 2, run `npm run dev` locally (not in Docker)

### Clear everything and start fresh?
```bash
docker-compose -f docker-compose.local.yml down -v
docker volume rm infinity-data infinity-redis
docker-compose -f docker-compose.local.yml up --build
```

---

## File Structure

- `docker-compose.yml` - Original production-like setup (uses `dev.Dockerfile`)
- `docker-compose.local.yml` - Local development setup (uses `local.Dockerfile`)
- `dev.Dockerfile` - Production-ready image (uses yarn)
- `local.Dockerfile` - Development image (uses npm with hot-reload)
