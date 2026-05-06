# Local Development with Docker Compose

This guide explains how to set up the backend development environment using Docker Compose.

## Quick Start

### 1. Prerequisites
- Docker and Docker Compose installed
- `.env` file configured (copy from `.env.example` and update values)

### 2. Start Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 3. Configure Your `.env` File

Make sure your `.env` has these settings for local Docker development:

```env
# Database (matches docker-compose)
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=infinity_db
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=strapi_password

# Redis (matches docker-compose)
REDIS_URL=redis://:redis_password@localhost:6379
REDIS_PASSWORD=redis_password
```

### 4. Start Backend (in a separate terminal)

```bash
# From backend directory
npm run develop
# or
npm run dev
```

The backend will connect to:
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

## Docker Compose Services

### PostgreSQL
- **Container**: `infinity-postgres`
- **Port**: `5432` (mapped to `5432`)
- **Volume**: `infinity-postgres-data` (persists between restarts)
- **Health Check**: Built-in postgres health check

### Redis
- **Container**: `infinity-redis`
- **Port**: `6379` (mapped to `6379`)
- **Password**: `redis_password` (configurable via env)
- **Volume**: `infinity-redis-data` (persists between restarts)
- **Health Check**: Redis PING health check

## Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f postgres    # PostgreSQL logs
docker-compose logs -f redis       # Redis logs

# Restart services
docker-compose restart

# Remove volumes (WARNING: Deletes data!)
docker-compose down -v

# Clean up everything
docker-compose down -v
```

## Accessing the Databases

### PostgreSQL
```bash
# Connect with psql
psql -h localhost -p 5432 -U strapi_user -d infinity_db

# Or use Docker
docker-compose exec postgres psql -U strapi_user -d infinity_db
```

### Redis
```bash
# Connect with redis-cli
redis-cli -h localhost -p 6379
# Enter password when prompted: redis_password

# Or use Docker
docker-compose exec redis redis-cli
```

## Troubleshooting

### Services won't start
```bash
# Check if ports are already in use
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Check Docker logs
docker-compose logs
```

### Database connection errors
- Ensure `.env` matches docker-compose settings
- Wait for health checks to pass (10-20 seconds)
- Restart: `docker-compose restart`

### Redis connection errors
- Verify `REDIS_PASSWORD` in `.env` matches docker-compose
- Check Redis is running: `docker-compose ps redis`

### Reset everything
```bash
# Stop and remove all data
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Development Workflow

1. **Terminal 1 - Start Docker services**
   ```bash
   docker-compose up -d
   ```

2. **Terminal 2 - Run Strapi**
   ```bash
   npm run develop
   ```

3. **Terminal 3 - Frontend (optional)**
   ```bash
   cd ../frontend
   npm run dev
   ```

Now:
- Strapi admin: http://localhost:1337/admin
- Frontend: http://localhost:2888
- Database: Direct connection available on `localhost:5432`
- Redis: Direct connection available on `localhost:6379`

## Notes

- Docker Compose uses **Alpine images** for smaller size and faster startup
- Both services have **health checks** enabled (10s intervals, 5s timeout)
- Data is **persisted** in named volumes (survives container restarts)
- Services are on a **private network** for isolation
- All environment variables are loaded from `.env` file
