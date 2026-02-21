# Nginx Proxy Cache for Public API Endpoints

Caching public Strapi API responses at the Nginx layer reduces backend load and improves response time for semi-static data (products, categories, blog posts).

## Prerequisites

- Nginx in front of Strapi (e.g. `api.infinitycolor.org` → `strapi_upstream`)
- Write access to Nginx config and ability to create cache directory

## 1. Cache path and zone

Add this in the **`http` block** of your main Nginx config (e.g. `/etc/nginx/nginx.conf`), **outside** any `server` block:

```nginx
proxy_cache_path /var/cache/nginx/api
    levels=1:2
    keys_zone=api_cache:100m
    max_size=1g
    inactive=60m
    use_temp_path=off;
```

Create the cache directory and set permissions:

```bash
sudo mkdir -p /var/cache/nginx/api
sudo chown -R www-data:www-data /var/cache/nginx/api
# Or the user nginx runs as: sudo chown -R nginx:nginx /var/cache/nginx/api
```

## 2. Cached API location (Strapi)

Inside the **server block** for your API (e.g. `server_name api.infinitycolor.org;`), add a location that uses the cache for public read-only endpoints. Adjust the regex if your API path structure differs.

```nginx
# Cache public API endpoints (GET only; Nginx caches by key including $request_method)
location ~ ^/api/(products|categories|blog-posts|product-categories) {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    add_header X-Cache-Status $upstream_cache_status;

    proxy_pass http://strapi_upstream;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 3. Non-cached locations

Do **not** cache authenticated or mutable endpoints. Either list them in a separate location or rely on a default location without `proxy_cache`:

```nginx
# Do not cache auth, cart, orders, admin
location ~ ^/api/(carts|orders|users|auth|admin) {
    proxy_pass http://strapi_upstream;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Default API location (no cache)
location / {
    proxy_pass http://strapi_upstream;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 4. Apply and test

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Check response headers; first request should be `X-Cache-Status: MISS`, subsequent requests within 5m should be `X-Cache-Status: HIT`.

## Optional snippet file

You can put the cached and non-cached location blocks in a snippet and include it in the API server block, for example:

```nginx
include /etc/nginx/snippets/proxy-cache-api.conf;
```

See `docs/nginx-proxy-cache-api-snippet.conf` for a ready-to-use snippet (create it on the server or copy from repo).

## References

- [Nginx proxy_cache](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache)
- Upstream config: `docs/nginx-upstream-snippet.conf`
