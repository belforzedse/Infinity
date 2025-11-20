# 🚀 Local Development Quick Start

## Prerequisites

- **Docker Desktop** installed and running
- **Node.js** (v18 or higher) and npm installed
- **PostgreSQL client** (optional, for database access)

## Setup Steps

### 1. Start Database & Redis Services

Open **Terminal 1** and run:

```bash
docker-compose -f docker-compose.local.yml up -d
```

This will start:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

Verify they're running:
```bash
docker-compose -f docker-compose.local.yml ps
```

You should see both services as "healthy" after ~10 seconds.

### 2. Install Dependencies & Run Strapi

Open **Terminal 2** and run:

```bash
npm install
npm run develop
```

Strapi will start on `http://localhost:1337` with hot-reload enabled.

**First time setup:**
- Access admin panel: `http://localhost:1337/admin`
- Create your admin user account
- The app will auto-create database schema and seed initial data

## Environment Files

### `.env` - Strapi Configuration
Already configured for local dev:
- Database: `localhost:5432` (PostgreSQL)
- Redis: `localhost:6379` (with password)
- Server: `http://localhost:1337`

### `db.env` - Docker Services Credentials
Contains database and Redis passwords for Docker containers:
- `POSTGRES_USER=infinity`
- `POSTGRES_PASSWORD=infinity123`
- `POSTGRES_DB=infinity_local`
- `REDIS_PASSWORD=2768fwZiUEEfAJXfeo0lM5do2Ly3BPQccK36PfMQf5w=`

## Common Commands

### Start/Stop Services

```bash
# Start PostgreSQL and Redis
docker-compose -f docker-compose.local.yml up -d

# Stop services
docker-compose -f docker-compose.local.yml down

# Stop and remove all data (fresh start)
docker-compose -f docker-compose.local.yml down -v

# View logs
docker-compose -f docker-compose.local.yml logs -f
```

### Strapi Development

```bash
# Run in development mode (with hot-reload)
npm run develop

# Type check only
npm run type-check

# Build for production
npm run build

# Run production build
npm run start
```

### Database Access

```bash
# Connect to PostgreSQL (if psql is installed)
psql -h localhost -U infinity -d infinity_local

# Or use Docker
docker-compose -f docker-compose.local.yml exec infinity-postgres psql -U infinity -d infinity_local

# Connect to Redis (if redis-cli is installed)
redis-cli -h localhost -p 6379 -a 2768fwZiUEEfAJXfeo0lM5do2Ly3BPQccK36PfMQf5w=

# Or use Docker
docker-compose -f docker-compose.local.yml exec infinity-redis redis-cli -a 2768fwZiUEEfAJXfeo0lM5do2Ly3BPQccK36PfMQf5w=
```

## Troubleshooting

### Port Already in Use

If port 5432 or 6379 is already in use:

**Option 1: Stop existing services**
```bash
# Find what's using the port
netstat -ano | findstr :5432
netstat -ano | findstr :6379

# Or use Docker
docker ps | findstr 5432
docker ps | findstr 6379
```

**Option 2: Change ports in docker-compose.local.yml**
```yaml
ports:
  - "127.0.0.1:5433:5432"  # Use 5433 instead
  - "127.0.0.1:6380:6379"  # Use 6380 instead
```

Then update `.env`:
```env
DATABASE_PORT=5433
REDIS_URL=redis://127.0.0.1:6380
```

### Database Connection Error

1. **Check Docker services are running:**
   ```bash
   docker-compose -f docker-compose.local.yml ps
   ```

2. **Check database is healthy:**
   ```bash
   docker-compose -f docker-compose.local.yml logs infinity-postgres
   ```

3. **Verify `.env` settings:**
   ```env
   DATABASE_HOST=127.0.0.1
   DATABASE_PORT=5432
   DATABASE_NAME=infinity_local
   DATABASE_USERNAME=infinity
   DATABASE_PASSWORD=infinity123
   ```

### Redis Connection Error

1. **Check Redis is running:**
   ```bash
   docker-compose -f docker-compose.local.yml ps infinity-redis
   ```

2. **Verify Redis password in `.env`:**
   ```env
   REDIS_PASSWORD=2768fwZiUEEfAJXfeo0lM5do2Ly3BPQccK36PfMQf5w=
   ```

3. **Test Redis connection:**
   ```bash
   docker-compose -f docker-compose.local.yml exec infinity-redis redis-cli -a 2768fwZiUEEfAJXfeo0lM5do2Ly3BPQccK36PfMQf5w= ping
   ```
   Should return: `PONG`

### Migration Errors

If you see migration errors:

1. **Check database schema:**
   ```bash
   docker-compose -f docker-compose.local.yml exec infinity-postgres psql -U infinity -d infinity_local -c "\dt"
   ```

2. **Reset database (⚠️ deletes all data):**
   ```bash
   docker-compose -f docker-compose.local.yml down -v
   docker-compose -f docker-compose.local.yml up -d
   npm run develop
   ```

### TypeScript Errors

```bash
# Check for type errors
npm run type-check

# Fix auto-fixable issues
npm run lint -- --fix
```

## Development Workflow

### Typical Development Session

1. **Start services:**
   ```bash
   # Terminal 1
   docker-compose -f docker-compose.local.yml up -d
   ```

2. **Start Strapi:**
   ```bash
   # Terminal 2
   npm run develop
   ```

3. **Make code changes** - Strapi will auto-reload

4. **Check types:**
   ```bash
   npm run type-check
   ```

5. **Test your changes** via API or admin panel

6. **Stop when done:**
   ```bash
   # Stop Strapi (Ctrl+C in Terminal 2)
   # Stop Docker services
   docker-compose -f docker-compose.local.yml down
   ```

### Running Migrations

Migrations run automatically on startup. To run manually:

```bash
npm run strapi migrate
```

### Testing Changes

After making code changes:
1. TypeScript will check types on save
2. Strapi will auto-reload
3. Check browser console for errors
4. Test API endpoints

## URLs

- **Strapi Admin:** http://localhost:1337/admin
- **Strapi API:** http://localhost:1337/api
- **API Documentation:** http://localhost:1337/documentation

## Next Steps

- Create admin user account
- Configure payment gateways (optional for local dev)
- Test API endpoints
- Run tests: `npm test`

## Need Help?

- Check `LOCAL_DEV_SETUP.md` for more detailed information
- Check `CLAUDE.md` for architecture overview
- Check Docker logs: `docker-compose -f docker-compose.local.yml logs`


