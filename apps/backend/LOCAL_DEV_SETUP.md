# Local Development Setup

This guide explains how to run local development with Docker for PostgreSQL and Redis, and Strapi running locally.

## Quick Start (Recommended)

### Terminal 1: Start Docker Services (PostgreSQL + Redis)

```bash
docker-compose -f docker-compose.local.yml up
```

This will:
- Start PostgreSQL on `localhost:5434`
- Start Redis on `localhost:6379`

### Terminal 2: Install and Run Strapi Locally

```bash
npm install
npm run dev
```

Strapi will start on `localhost:1337` with **hot-reload enabled**

**Advantages:**
- ✅ Fastest hot-reload development
- ✅ Better IDE integration and debugging
- ✅ Easier to use with your code editor
- ✅ Docker for stateful services (databases)
- ✅ Close to production-like environment

---

## Environment Configuration

The `.env` file is already configured correctly for local development:
- `DATABASE_HOST=postgres` ← This refers to the Docker service name
- `DATABASE_NAME=infinity` ← Database will be created automatically
- `REDIS_URL=redis://redis:6379` ← Redis Docker service

These work because Strapi can reach Docker services via service names when they're on the same Docker network.

**No changes needed to `.env`** - it's already set up!

---

## Useful Commands

```bash
# View database and redis logs
docker-compose -f docker-compose.local.yml logs -f postgres redis

# Stop Docker services
docker-compose -f docker-compose.local.yml down

# Reset database and volumes completely
docker-compose -f docker-compose.local.yml down -v

# Access Strapi admin (after starting npm run dev)
http://localhost:1337/admin

# Access Strapi API
http://localhost:1337/api
```

---

## Troubleshooting

### Docker services not starting?
```bash
docker-compose -f docker-compose.local.yml up
```

### Strapi says it can't connect to database?
1. Make sure Docker services are running: `docker ps`
2. Check `.env` file has:
   - `DATABASE_HOST=postgres`
   - `DATABASE_NAME=infinity`
   - `DATABASE_USERNAME=infinity`
   - `DATABASE_PASSWORD=infinity`
3. Restart both Docker and npm dev server

### Port already in use?
Change the port mapping in `docker-compose.local.yml`:
```yaml
ports:
  - "5435:5432"  # Use 5435 instead of 5434
```

### Hot-reload not working?
- Make sure you're running `npm run dev` (not via Docker)
- Check that your file changes are being detected
- Restart the npm dev server if needed

### Clear everything and start fresh?
```bash
docker-compose -f docker-compose.local.yml down -v
npm install  # Fresh dependencies
npm run dev
```

---

## File Structure

- `docker-compose.yml` - Original setup (uses `dev.Dockerfile` with yarn)
- `docker-compose.local.yml` - Local dev setup (postgres + redis only, no Strapi)
- `dev.Dockerfile` - Production Docker image (archived, uses yarn)
- `local.Dockerfile` - Local npm development image (no longer used, Strapi runs directly)
