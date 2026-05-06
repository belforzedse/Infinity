# Performance Fixes Deployment Guide

## Overview

This document describes the performance optimizations implemented based on the performance audit plan. These changes significantly improve frontend-to-backend communication by eliminating connection overhead, enabling compression, and optimizing data fetching patterns.

**Expected Impact:**
- 50-200ms TTFB improvement per server-side fetch
- 70-90% payload reduction for JSON responses
- Major throughput gains under load
- 4x better cache hit rate (with Redis)

---

## Changes Implemented

### ✅ Frontend Changes (Already Deployed in Code)

#### 1. Internal Strapi URL for Server-Side Fetches (B1, B2)
**Impact:** Eliminates DNS lookup + TLS handshake + double Nginx proxy for server-side calls

**Files Modified:**
- `apps/frontend/src/constants/api.ts` - Added `STRAPI_INTERNAL_URL` constant
- `apps/frontend/src/services/product/homepage.ts` - Updated all server-side fetches
- `apps/frontend/src/services/product/categories.ts` - Updated server-side fetches
- `apps/frontend/src/services/super-admin/settings/public.ts` - Updated server-side fetches
- `apps/frontend/middleware.ts` - Updated PDP redirect fetch

**Code changes:** All server-side `fetch()` calls now check `typeof window === "undefined"` and use `STRAPI_INTERNAL_URL` instead of `API_BASE_URL`.

#### 2. Parallelized Homepage Data Fetching (C1)
**Impact:** Reduces homepage load time by 100-300ms

**Files Modified:**
- `apps/frontend/src/services/product/homepage.ts` - Settings fetch now runs in parallel with batch fetch

**Code change:** Settings and batch fetch now start simultaneously instead of sequentially.

#### 3. Accept-Encoding Header
**Files Modified:** All server-side fetches now include `"Accept-Encoding": "gzip"` header to ensure compression.

---

### ✅ Backend Changes (Already Deployed in Code)

#### 1. Redis REST Cache (C4)
**Impact:** 4x better cache hit rate across Strapi instances

**Files Modified:**
- `apps/backend/config/plugins.ts` - Switched from memory to Redis provider in production

**Code change:** `REST_CACHE_PROVIDER` now defaults to `"redis"` in production, `"memory"` in development.

#### 2. Increased Database Connection Pool (D2)
**Impact:** Prevents connection starvation under load

**Files Modified:**
- `apps/backend/config/database.ts` - Increased pool max from 10 to 25 per instance

**Code change:** All database clients (mysql, mysql2, postgres) now use `DATABASE_POOL_MAX=25` (was 10).

**Note:** Ensure PostgreSQL `max_connections` is increased to 150+ to handle 100 total connections (25 × 4 instances).

#### 3. Reduced Body Parser Limits (D3)
**Impact:** Memory safety and DoS prevention

**Files Modified:**
- `apps/backend/config/middlewares.ts` - Reduced limits from 500MB to reasonable values

**Code change:**
- `jsonLimit`: 500mb → 10mb
- `formLimit`: 500mb → 50mb
- `maxFileSize`: 500MB → 50MB

---

## Required Server Configuration Changes

### 🔧 Nginx Configuration Changes (P0 - Critical)

**Documentation:** See `.cursor/rules/nginx-performance-fixes.mdc` for complete details.

#### A1. Fix Next.js Keepalive
**File:** `/etc/nginx/sites-enabled/infinitycolor.org`

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

location / {
    proxy_pass http://next_upstream;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;  # Fixed
    # ... other headers
    proxy_buffering on;
    proxy_buffers 16 16k;
    proxy_buffer_size 16k;
}
```

#### A2. Fix Strapi Keepalive
**File:** `/etc/nginx/sites-enabled/infinitycolor.org`

```nginx
location / {
    proxy_pass http://strapi_upstream;
    proxy_http_version 1.1;  # Added
    proxy_set_header Connection "";  # Added
    # ... other headers
    proxy_buffering on;
    proxy_buffers 16 16k;
    proxy_buffer_size 16k;
}
```

#### A3. Enable Gzip for JSON
**File:** `/etc/nginx/nginx.conf`

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 5;
gzip_min_length 256;
gzip_types
    text/plain
    text/css
    application/json
    application/javascript
    # ... other types
```

#### A5. Update SSL Protocols
**File:** `/etc/nginx/nginx.conf`

```nginx
ssl_protocols TLSv1.2 TLSv1.3;  # Removed TLSv1 TLSv1.1
```

#### B1. Internal Nginx Server Block
**File:** `/etc/nginx/sites-enabled/infinitycolor.org` (or new file)

```nginx
# Internal-only server block for Next.js -> Strapi (no TLS)
server {
    listen 127.0.0.1:8080;
    server_name localhost;

    location / {
        proxy_pass http://strapi_upstream;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host api.infinitycolor.co;
        proxy_set_header X-Forwarded-Proto https;
        proxy_buffering on;
        proxy_buffers 16 16k;
        proxy_buffer_size 16k;
    }
}
```

---

## Environment Variables

### Frontend Production Environment

Add to Next.js production environment (`.env` or GitHub Actions secrets):

```bash
# Internal Strapi URL for server-side fetches (bypasses TLS/DNS)
STRAPI_INTERNAL_URL=http://127.0.0.1:8080/api
```

**Note:** This should point to the internal Nginx server block (port 8080) that proxies to Strapi without TLS.

### Backend Production Environment

```bash
# Use Redis for REST cache in production
REST_CACHE_PROVIDER=redis

# Increased database pool size (per instance)
DATABASE_POOL_MAX=25

# Ensure PostgreSQL can handle 100+ connections (4 instances × 25)
# Set in PostgreSQL config: max_connections = 150
```

---

## Deployment Steps

### 1. Code Deployment (Already Done)
All frontend and backend code changes are committed and ready for deployment.

### 2. Nginx Configuration (Server Admin)

```bash
# Backup current configs
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
sudo cp /etc/nginx/sites-enabled/infinitycolor.org /etc/nginx/sites-enabled/infinitycolor.org.backup

# Apply A1-A5 and B1 fixes (see nginx-performance-fixes.mdc)

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 3. PostgreSQL Configuration (DBA)

```sql
-- Check current max_connections
SHOW max_connections;

-- If less than 150, increase it
ALTER SYSTEM SET max_connections = 150;

-- Reload PostgreSQL
SELECT pg_reload_conf();
```

### 4. Environment Variables (DevOps)

**Frontend (Next.js):**
```bash
# Add to production environment
STRAPI_INTERNAL_URL=http://127.0.0.1:8080/api
```

**Backend (Strapi):**
```bash
# Add to production environment
REST_CACHE_PROVIDER=redis
DATABASE_POOL_MAX=25
```

### 5. Restart Services

```bash
# Restart Strapi instances
docker-compose restart infinity-strapi

# Restart Next.js instances
# (Depends on your deployment setup)
```

---

## Validation

### 1. Check Nginx Keepalive

Add to Nginx log format:
```nginx
log_format perf '$remote_addr - $request_time $upstream_connect_time $upstream_response_time $status "$request"';
access_log /var/log/nginx/perf.log perf;
```

Expected: `$upstream_connect_time` should drop from ~1-3ms to ~0ms.

### 2. Verify Gzip Compression

```bash
curl -H "Accept-Encoding: gzip" https://api.infinitycolor.co/api/products -I | grep Content-Encoding
```

Expected: `Content-Encoding: gzip`

### 3. Check Internal URL Usage

Monitor Next.js logs - should see requests to `127.0.0.1:8080` instead of `api.infinitycolor.co:443`.

### 4. Verify Redis Cache

```bash
# Connect to Redis
redis-cli

# Monitor cache hits
MONITOR
```

Expected: See cache keys being set/retrieved across Strapi instances.

### 5. Run Lighthouse

Before/after comparison on homepage, PLP, PDP:
- TTFB: 50-200ms reduction
- Payload size: 70-90% reduction for JSON
- Performance score: +5-15 points

---

## Rollback Plan

If issues occur:

```bash
# Restore Nginx configs
sudo cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf
sudo cp /etc/nginx/sites-enabled/infinitycolor.org.backup /etc/nginx/sites-enabled/infinitycolor.org
sudo nginx -t
sudo systemctl reload nginx

# Remove environment variables
unset STRAPI_INTERNAL_URL
# Set REST_CACHE_PROVIDER=memory

# Restart services
docker-compose restart
```

---

## Monitoring

After deployment, monitor for 24-48 hours:

1. **Response Times:** Check TTFB in production logs
2. **Error Rates:** Monitor Nginx error logs: `tail -f /var/log/nginx/error.log`
3. **Cache Hit Rate:** Monitor Redis metrics
4. **Database Connections:** Check PostgreSQL connection count: `SELECT count(*) FROM pg_stat_activity;`
5. **Application Logs:** Check Strapi and Next.js logs for errors

---

## Expected Results

### Before
- Homepage TTFB: ~800-1200ms
- API JSON payloads: 50-200KB uncompressed
- Cache hit rate: ~25% (per-instance memory cache)
- Connection overhead: 1-3ms per request

### After
- Homepage TTFB: ~400-800ms
- API JSON payloads: 5-20KB gzipped (70-90% reduction)
- Cache hit rate: ~95% (shared Redis cache)
- Connection overhead: ~0ms (keepalive working)

---

## Contact

For questions or issues during deployment:
- Frontend changes: Check `.cursor/rules/nginx-performance-fixes.mdc`
- Backend changes: Check this document
- Nginx configuration: Refer to nginx-performance-fixes.mdc

---

## Related Documentation

- `.cursor/rules/nginx-performance-fixes.mdc` - Complete Nginx configuration guide
- `performance_audit_plan_*.plan.md` - Original performance audit
- Frontend CLAUDE.md - Frontend architecture
- Backend CLAUDE.md - Backend architecture
