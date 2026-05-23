# Nginx internal API for Docker frontend

The frontend runs in Docker, while host Nginx already owns the public reverse proxy and `strapi_upstream` load-balancer. Server-side Next.js requests should reach Strapi through an internal Nginx listener, not through the public API domain and not by calling `strapi_upstream` directly.

`strapi_upstream` is an Nginx-only name. Containers cannot resolve it with Docker DNS. The working path is:

```text
Next.js container
  -> http://host.docker.internal:8080/api
  -> Nginx internal server
  -> proxy_pass http://strapi_upstream
  -> Strapi containers on 127.0.0.1:1337-1342
```

## 1. Confirm the Docker host gateway

From a running frontend container:

```bash
docker exec -it <frontend-container> sh
getent hosts host.docker.internal
```

Use the returned IP as `<HOST_GATEWAY_IP>` below. The frontend Compose file maps `host.docker.internal` via `host-gateway`, so this alias is stable across Docker bridge gateway changes.

## 2. Add the internal Nginx server

Keep the existing public frontend/API server blocks unchanged. Add this internal-only server beside them:

```nginx
server {
    listen <HOST_GATEWAY_IP>:8080;
    server_name _;

    location / {
        proxy_pass http://strapi_upstream;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host api.infinitycolor.co;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
        proxy_read_timeout 90s;
    }
}
```

If you cannot bind to the gateway IP, `listen 8080;` also works, but firewall port `8080` so it is not publicly reachable.

Then reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 3. Set the frontend internal URL

In the frontend runtime env file on the server, for example `/opt/infinity/frontend/main.env`:

```env
STRAPI_INTERNAL_URL=http://host.docker.internal:8080/api
NEXT_PUBLIC_API_BASE_URL=https://api.infinitycolor.co/api
NEXT_PUBLIC_IMAGE_BASE_URL=https://api.infinitycolor.co
```

Do not set `STRAPI_INTERNAL_URL=http://strapi_upstream/api`; that name only exists inside Nginx.

Restart the frontend:

```bash
cd /opt/infinity/frontend
docker compose -f docker-compose.yml -f docker-compose.scale.yml up -d --remove-orphans
```

## 4. Verify from a frontend container

```bash
docker exec -it <frontend-container> sh
env | grep -E 'STRAPI|NEXT_PUBLIC_API_BASE_URL|NEXT_PUBLIC_IMAGE_BASE_URL'
getent hosts host.docker.internal
getent hosts strapi || true
wget -S -O- 'http://host.docker.internal:8080/api/_health'
wget -S -O- 'http://host.docker.internal:8080/api/products?pagination[page]=1&pagination[pageSize]=1'
```

Expected:

- `host.docker.internal` resolves to the Docker host gateway IP.
- `strapi` may fail because frontend and backend are in separate Compose networks.
- `host.docker.internal:8080` returns HTTP 200/JSON.

## Summary

| What | Value |
|------|-------|
| Frontend internal URL | `http://host.docker.internal:8080/api` |
| Internal Nginx proxy | `proxy_pass http://strapi_upstream` |
| Public API URL | `https://api.infinitycolor.co/api` |
| Flow | Frontend container -> host Nginx:8080 -> `strapi_upstream` -> Strapi |
