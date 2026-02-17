# Nginx internal API (port 8080) for Docker frontend

The frontend runs in Docker. To use an **internal** Strapi URL (through Nginx, no TLS, load-balanced) the containers must reach Nginx on the host. Nginx’s internal server must listen on an address the containers can use (Docker bridge), not only `127.0.0.1`.

## 1. Change the internal server to listen on the Docker bridge

Edit your Nginx site config (e.g. `/etc/nginx/sites-enabled/infinitycolor.org`) and update the **internal-only** server block.

**Current (containers cannot reach it):**

```nginx
# Internal-only server block for Next.js -> Strapi (no TLS)
server {
    listen 127.0.0.1:8080;
    server_name localhost;
    # ...
}
```

**Change to (containers can reach via host gateway IP):**

Use one of these:

- **Option A – Listen on Docker bridge only** (recommended; only Docker network can connect):

  ```nginx
  # Internal-only: Next.js (in Docker) -> Nginx -> strapi_upstream (no TLS)
  server {
      listen 172.17.0.1:8080;
      server_name localhost;

      location / {
          proxy_pass http://strapi_upstream;
          proxy_http_version 1.1;
          proxy_set_header Connection "";
          proxy_set_header Host api.infinitycolor.co;
          proxy_set_header X-Forwarded-Proto https;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_buffering on;
          proxy_buffers 16 16k;
          proxy_buffer_size 16k;
          proxy_read_timeout 600s;
          proxy_connect_timeout 600s;
          proxy_send_timeout 600s;
      }
  }
  ```

  If your Docker bridge is not `172.17.0.1`, get the gateway from a container:

  ```bash
  docker run --rm alpine ip route | grep default
  ```
  Use that gateway IP instead of `172.17.0.1`.

- **Option B – Listen on all interfaces** (simpler; restrict with firewall if needed):

  ```nginx
  server {
      listen 8080;
      server_name localhost;
      # ... same location / { ... } as above
  }
  ```

Then:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 2. Set the frontend internal URL

In `main.env` on the server (e.g. `/opt/infinity/frontend/main.env`):

- If you used **Option A** (listen on `172.17.0.1:8080`):

  ```bash
  STRAPI_INTERNAL_URL=http://172.17.0.1:8080/api
  ```

- If you used **Option B** (listen on `8080`) and the host gateway from containers is `172.17.0.1`:

  ```bash
  STRAPI_INTERNAL_URL=http://172.17.0.1:8080/api
  ```

Restart the frontend so it picks up the env:

```bash
cd /opt/infinity/frontend
docker compose -f docker-compose.yml -f docker-compose.scale.yml restart
```

## 3. Verify from a frontend container

```bash
docker exec frontend-frontend-1 wget -qO- --timeout=5 'http://172.17.0.1:8080/api/products?pagination[page]=1&pagination[pageSize]=2&filters[Status][$eq]=Active' 2>&1 | head -c 400
```

You should see JSON with `"data":[...]`. If you get “Connection refused” or timeout, Nginx is not listening on that address or the host firewall is blocking it.

## Summary

| What | Value |
|------|--------|
| Nginx internal server | Listen on `172.17.0.1:8080` (or `8080`) and `proxy_pass http://strapi_upstream` |
| `STRAPI_INTERNAL_URL` in main.env | `http://172.17.0.1:8080/api` |
| Flow | Frontend container → host:8080 (Nginx) → strapi_upstream (1337–1340) |

Traffic stays on the host and goes through Nginx (load-balanced, no TLS) instead of leaving to the public API.
