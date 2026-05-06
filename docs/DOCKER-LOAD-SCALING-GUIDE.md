# Docker Load Scaling – Full Guide

This guide explains how to run **multiple frontend (Next.js) and backend (Strapi) containers** behind Nginx so your server can use more CPU cores and handle more traffic. It is accurate for the current Infinity Store setup (Docker Compose, Nginx on host, standalone Next.js, Strapi with Postgres and Redis).

**CI/CD:** The GitHub Actions workflows (`frontend-cicd.yml`, `backend-cicd.yml`) **upload and deploy using the scale override by default**. They copy both `docker-compose.yml` and `docker-compose.scale.yml` to the server and run `docker compose -f docker-compose.yml -f docker-compose.scale.yml up -d`, so production/staging/experimental all run with the extra replicas after each deploy. To run **without** scaling (single instance), you would need to run `docker compose up -d` manually on the server (without the scale file). **Nginx** must be updated separately to use the upstreams (see [Step 3](#step-3-nginx--load-balance-to-multiple-backends) and `docs/nginx-upstream-snippet.conf`).

---

## Quick start: 5 Next + 4 Strapi

1. **Backend** (from repo root or server backend dir):
   ```bash
   cd apps/backend
   docker compose -f docker-compose.yml -f docker-compose.scale.yml up -d
   ```
   Starts 1 Postgres, 1 Redis, and 4 Strapi containers (ports 1337, 1338, 1339, 1340).

2. **Frontend** (from repo root or server frontend dir):
   ```bash
   cd apps/frontend
   docker compose -f docker-compose.yml -f docker-compose.scale.yml up -d
   ```
   Starts 5 Next.js containers (ports 3000–3004).

3. **Nginx:** Copy the upstream blocks from `docs/nginx-upstream-snippet.conf` into your site config (before any `server { }`), then use `proxy_pass http://next_upstream;` and `proxy_pass http://strapi_upstream;` in the frontend and API location blocks. Test and reload:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. **Verify:** `docker ps` should show 5 frontend and 4 Strapi containers; site and API should respond.

---

## Will two Strapis mess up the data?

**No. Data is not duplicated or corrupted.**

- **One database:** All Strapi containers use the **same** Postgres (`infinity-postgres`) and the **same** Redis (`infinity-redis`). There is only one source of truth for content, users, and orders.
- **One uploads volume:** All Strapi containers mount the **same** volume (`backend_uploads-data:/app/public`). Uploaded files are shared; no split storage.
- **Stateless API:** Each Strapi process is a stateless API server. They all read and write to the same Postgres and Redis. Adding a second (or third) container only adds more workers; it does not create a second database or duplicate data.

**Admin sessions:** Strapi’s admin panel uses in-memory sessions by default. If you run two Strapi instances and Nginx sends one request to instance A and the next to instance B, the admin could appear logged out on B (session lives only in A’s memory). To avoid that, we use **sticky sessions** for the API upstream (e.g. `ip_hash`) so the same client (browser) is always sent to the same Strapi instance. Then admin sessions work as with a single instance.

---

## Prerequisites

- Docker and Docker Compose installed on the server.
- Nginx installed and already proxying to frontend (port 3000) and API (port 1337) as in [nginx-certbot-setup.md](nginx-certbot-setup.md).
- Existing volumes and env files in use (e.g. `main.env`, `db.env`).
- You have already created external volumes if your compose expects them (e.g. `backend_infinity-postgres-data`, `backend_infinity-redis-data`, `backend_uploads-data`).

---

## Step 1: Backend – add a second Strapi container

You keep one Postgres and one Redis; you only add another Strapi service that uses the same DB, Redis, and uploads volume.

### 1.1 Create a scale override file

Create **`apps/backend/docker-compose.scale.yml`** (or add the following to your existing override):

```yaml
# apps/backend/docker-compose.scale.yml
# Use with: docker compose -f docker-compose.yml -f docker-compose.scale.yml up -d

services:
  strapi:
    # Keep existing strapi as-is (port 1337)
    ports:
      - "127.0.0.1:1337:1337"

  strapi-2:
    image: ghcr.io/belforzedse/infinity-backend:${IMAGE_TAG:-main}
    container_name: infinity-strapi-2
    env_file:
      - ${ENV_FILE:-main.env}
    depends_on:
      infinity-postgres:
        condition: service_healthy
      infinity-redis:
        condition: service_healthy
    ports:
      - "127.0.0.1:1338:1337"
    restart: unless-stopped
    volumes:
      - backend_uploads-data:/app/public
    networks:
      - infinity-network

  strapi-3:
    image: ghcr.io/belforzedse/infinity-backend:${IMAGE_TAG:-main}
    container_name: infinity-strapi-3
    env_file:
      - ${ENV_FILE:-main.env}
    depends_on:
      infinity-postgres:
        condition: service_healthy
      infinity-redis:
        condition: service_healthy
    ports:
      - "127.0.0.1:1339:1337"
    restart: unless-stopped
    volumes:
      - backend_uploads-data:/app/public
    networks:
      - infinity-network

  strapi-4:
    image: ghcr.io/belforzedse/infinity-backend:${IMAGE_TAG:-main}
    container_name: infinity-strapi-4
    env_file:
      - ${ENV_FILE:-main.env}
    depends_on:
      infinity-postgres:
        condition: service_healthy
      infinity-redis:
        condition: service_healthy
    ports:
      - "127.0.0.1:1340:1337"
    restart: unless-stopped
    volumes:
      - backend_uploads-data:/app/public
    networks:
      - infinity-network
```

- **Same image and env_file** as the first Strapi.
- **Same volume** `backend_uploads-data` so uploads are shared.
- **Host ports 1338, 1339, 1340** so Nginx can send traffic to all four Strapis (1337–1340).
- No new database or Redis service; all Strapis use the existing ones.

### 1.2 Start the backend with the second Strapi

From the **backend** directory:

```bash
cd apps/backend
docker compose -f docker-compose.yml -f docker-compose.scale.yml up -d
```

Check that both containers are running:

```bash
docker compose -f docker-compose.yml -f docker-compose.scale.yml ps
```

You should see `infinity-strapi` and `infinity-strapi-2` running, and a single `infinity-postgres` and `infinity-redis`.

---

## Step 2: Frontend – add second (and optional third) Next.js container

Same idea: same image, same env, different host port so Nginx can load-balance.

### 2.1 Create a scale override file

Create **`apps/frontend/docker-compose.scale.yml`**:

```yaml
# apps/frontend/docker-compose.scale.yml
# Use with: docker compose -f docker-compose.yml -f docker-compose.scale.yml up -d

services:
  frontend:
    ports:
      - "127.0.0.1:3000:3000"

  frontend-2:
    image: ghcr.io/belforzedse/infinity-frontend:${IMAGE_TAG:-main}
    env_file:
      - ${ENV_FILE:-main.env}
    restart: unless-stopped
    ports:
      - "127.0.0.1:3001:3000"

  frontend-3:
    image: ghcr.io/belforzedse/infinity-frontend:${IMAGE_TAG:-main}
    env_file:
      - ${ENV_FILE:-main.env}
    restart: unless-stopped
    ports:
      - "127.0.0.1:3002:3000"

  frontend-4:
    image: ghcr.io/belforzedse/infinity-frontend:${IMAGE_TAG:-main}
    env_file:
      - ${ENV_FILE:-main.env}
    restart: unless-stopped
    ports:
      - "127.0.0.1:3003:3000"

  frontend-5:
    image: ghcr.io/belforzedse/infinity-frontend:${IMAGE_TAG:-main}
    env_file:
      - ${ENV_FILE:-main.env}
    restart: unless-stopped
    ports:
      - "127.0.0.1:3004:3000"
```

- Each container listens on **port 3000 inside** the container (Next.js standalone default). Host ports 3000–3004 map to each container’s 3000.
- The repo’s `apps/frontend/docker-compose.scale.yml` defines 5 Next instances by default; remove services or Nginx upstream lines to run fewer.

### 2.2 Start the frontend with extra replicas

From the **frontend** directory:

```bash
cd apps/frontend
docker compose -f docker-compose.yml -f docker-compose.scale.yml up -d
```

Verify:

```bash
docker compose -f docker-compose.yml -f docker-compose.scale.yml ps
```

---

## Step 3: Nginx – load balance to multiple backends

Nginx must send traffic to all frontend and all Strapi instances instead of a single address.

### 3.1 Edit your Nginx site config

Edit the file that defines your HTTPS servers (e.g. `/etc/nginx/sites-available/infinitycolor`). Add **upstream** blocks at the **top** of the file (before any `server { }`), then use those upstreams in `proxy_pass`.

**Add these upstream blocks** (right after any global directives, before the first `server`):

```nginx
# Upstream for Next.js (5 instances: 3000–3004)
upstream next_upstream {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
    server 127.0.0.1:3004;
    keepalive 32;
}

# Upstream for Strapi (4 instances). ip_hash so the same client always hits the same Strapi (preserves admin session).
upstream strapi_upstream {
    ip_hash;
    server 127.0.0.1:1337;
    server 127.0.0.1:1338;
    server 127.0.0.1:1339;
    server 127.0.0.1:1340;
    keepalive 32;
}
```

- **next_upstream:** Round-robin across 3000–3004. To run fewer frontends, remove the corresponding `server` lines and scale down the frontend compose.
- **strapi_upstream:** `ip_hash` ensures the same client IP always goes to the same Strapi so in-memory admin sessions work. All instances use the same Postgres and Redis.

### 3.2 Use the upstreams in proxy_pass

In the **frontend** server block (infinitycolor.co), replace every `proxy_pass http://127.0.0.1:3000` with:

```nginx
proxy_pass http://next_upstream;
```

And set connection reuse (recommended with `keepalive`):

```nginx
proxy_http_version 1.1;
proxy_set_header Connection "";
```

So for example the `location /` block becomes:

```nginx
location / {
    proxy_pass http://next_upstream;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

Use the same `proxy_pass http://next_upstream` (and `proxy_http_version 1.1; proxy_set_header Connection "";`) in the other frontend locations that currently use `http://127.0.0.1:3000` (e.g. `/_next/static/` and the font location).

In the **API** server block (api.infinitycolor.co), replace:

```nginx
proxy_pass http://127.0.0.1:1337;
```

with:

```nginx
proxy_pass http://strapi_upstream;
```

and add:

```nginx
proxy_http_version 1.1;
proxy_set_header Connection "";
```

(alongside your existing proxy headers and timeouts).

### 3.3 Test and reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

If you see errors, fix the config (e.g. duplicate `Connection` header). When using `keepalive`, you must use `proxy_http_version 1.1` and `proxy_set_header Connection ""` so Nginx can reuse connections; if another directive sets `Connection 'upgrade'`, use a map or `if` so only WebSocket requests get `Connection 'upgrade'` and normal HTTP gets `Connection ""`. A safe approach is to keep your existing `proxy_set_header Connection 'upgrade'` and `proxy_cache_bypass $http_upgrade` for WebSocket support and add `proxy_http_version 1.1`; for keepalive you’d typically set `Connection ""` only when not upgrading. If in doubt, you can omit `keepalive 32` and the `Connection ""` line; the upstreams and `proxy_pass` to them are what matter for load balancing.

---

## Step 4: Verify

1. **Backend:**  
   `curl -sI https://api.infinitycolor.co/` should return 200. Hit it several times; with two Strapis and `ip_hash`, the same client IP should always hit the same backend.

2. **Frontend:**  
   Open https://infinitycolor.co in a browser and use the site (navigate, add to cart, etc.). Check that pages load and API calls succeed.

3. **Admin:**  
   Log in to https://api.infinitycolor.co/admin. Use the admin panel; you should stay logged in because your browser’s IP is consistently sent to the same Strapi instance.

4. **Containers:**  
   `docker ps` should show multiple frontend and multiple Strapi containers, and `top` or `htop` should show more than one Node process using CPU when under load.

---

## Rollback

- **Backend:** Stop the extra Strapi and revert Nginx to a single backend:
  ```bash
  cd apps/backend
  docker compose -f docker-compose.yml -f docker-compose.scale.yml down strapi-2
  ```
  Then in Nginx change `proxy_pass http://strapi_upstream` back to `proxy_pass http://127.0.0.1:1337` and remove the `strapi_upstream` block (or leave it with one server). Reload Nginx.

- **Frontend:** Similarly stop `frontend-2` and `frontend-3`, and revert Nginx to `proxy_pass http://127.0.0.1:3000` (or a single-server upstream). Reload Nginx.

No database or volume changes are needed; the extra containers only added more workers.

---

## Optional: shared Redis cache for Next.js (when using 2+ frontends)

With multiple Next.js containers, each has its own in-memory ISR/cache. To share cache and avoid duplicate work:

1. Implement a custom cache handler (e.g. Redis) as in Next.js docs and set it in `next.config` (`cacheHandler`, `cacheMaxMemorySize: 0`).
2. Point the handler at your existing Redis (e.g. `REDIS_URL=redis://127.0.0.1:6379` or, from inside a shared Docker network, `redis://infinity-redis:6379`). Ensure the frontend container can reach Redis (network or host port).
3. Rebuild and redeploy the frontend image.

This is optional; load balancing works without it. See [.cursor/rules/frontend-server-capacity.mdc](../.cursor/rules/frontend-server-capacity.mdc) for references.

---

## Optional: health checks

You can add healthchecks to your services so you can later use `max_fails` and `fail_timeout` in Nginx to stop sending traffic to unhealthy containers. Example for Strapi:

```yaml
healthcheck:
  test: ["CMD", "wget", "-q", "--spider", "http://localhost:1337/_health" ]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 40s
```

(Use the correct path if Strapi exposes a health route.) For Next.js you can curl `/` or a known route. Then in the upstream you can add `max_fails=2 fail_timeout=30s` to each `server` line. This is optional for the initial setup.

---

## Summary

| Question | Answer |
|----------|--------|
| Will 2 Strapis mess up the data? | No. Same Postgres, same Redis, same uploads volume. Data is not duplicated or corrupted. |
| Why ip_hash for Strapi? | So the same browser (admin) always hits the same Strapi and in-memory admin sessions work. |
| Do I need two databases? | No. One Postgres and one Redis for all Strapi containers. |
| Do I need two upload volumes? | No. All Strapis mount the same `backend_uploads-data` volume. |
| How many apps/frontend/Strapi replicas? | Default scale is 5 Next (3000–3004) and 4 Strapi (1337–1340). Adjust by adding/removing services in the scale compose and Nginx upstream. |

Files to add or edit:

- **apps/backend/docker-compose.scale.yml** – second Strapi service.
- **apps/frontend/docker-compose.scale.yml** – second (and optional third) frontend service.
- **Nginx site config** – upstream blocks and `proxy_pass` to `next_upstream` and `strapi_upstream`.

After that, start the stack with the scale overrides and reload Nginx. No application code or database migration is required.
