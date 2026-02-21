# Nginx Brotli Compression Setup

Brotli typically provides 15–25% better compression than gzip for text assets (HTML, CSS, JS, JSON). This document describes how to enable Brotli in Nginx for the Infinity Store.

## Prerequisites

- Nginx installed (e.g. on the same server as `/etc/nginx/sites-available/infinitycolor.org`)
- Root or sudo access to install packages or load modules

## Option A: Pre-built package (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install nginx-module-brotli
```

If the package is not available in your distro, use Option B.

## Option B: Compile Nginx with Brotli module

1. Install build dependencies and clone the Brotli module:

```bash
sudo apt install -y build-essential libpcre3 libpcre3-dev zlib1g zlib1g-dev libssl-dev
cd /usr/local/src
git clone --recursive https://github.com/google/ngx_brotli.git
```

2. When building Nginx, add:

```bash
./configure ... --add-module=/usr/local/src/ngx_brotli
make && sudo make install
```

(Use your existing Nginx configure line and append the `--add-module` path.)

## Loading the module

In the **top-level** `nginx.conf` (usually `/etc/nginx/nginx.conf`), inside the main context (not inside `http` or `server`), add **before** the `events { }` block if your Nginx was built with dynamic module support:

```nginx
load_module modules/ngx_http_brotli_filter_module.so;
load_module modules/ngx_http_brotli_static_module.so;
```

If you compiled Brotli statically, skip the `load_module` lines.

## Brotli configuration snippet

Use the snippet below inside your `http` block or in each `server` block where you want Brotli. Prefer `http` block so it applies to all servers.

**Include in site config:** Copy the contents of `docs/nginx-brotli-snippet.conf` into your server block, or use `include /path/to/nginx-brotli-snippet.conf;` if you place that file on the server.

- **Frontend (Next.js):** Enable in the server block for `infinitycolor.org` / `www.infinitycolor.org`.
- **Backend (Strapi API):** Enable in the server block for `api.infinitycolor.org` if you want Brotli for API JSON responses.

```nginx
# Brotli (add alongside existing gzip config)
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css text/xml text/javascript
               application/json application/javascript
               application/xml+rss application/rss+xml
               font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

# Keep gzip as fallback for older clients
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript
           application/json application/javascript
           application/xml+rss application/rss+xml
           font/truetype font/opentype
           application/vnd.ms-fontobject image/svg+xml;
```

## Apply and test

1. Place or include the Brotli snippet in your Nginx config.
2. Test configuration:
   ```bash
   sudo nginx -t
   ```
3. Reload Nginx:
   ```bash
   sudo systemctl reload nginx
   ```
4. Verify Brotli is used (browser DevTools → Network → check response headers for `Content-Encoding: br`, or use curl):
   ```bash
   curl -H "Accept-Encoding: br" -I https://infinitycolor.org/
   ```

## References

- [ngx_brotli](https://github.com/google/ngx_brotli) – Nginx Brotli module
- [Nginx HTTP/2 setup](.cursor/rules/nginx-http2-setup.mdc) – HTTP/2 and gzip configuration for this project
