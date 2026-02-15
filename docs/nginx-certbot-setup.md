# Nginx + Certbot Setup for Infinity Store

This guide covers setting up Nginx as a reverse proxy and securing it with Let's Encrypt (Certbot) for **infinitycolor.co** (frontend) and **api.infinitycolor.co** (backend).

## Prerequisites

- A server (VPS) with a public IP (Ubuntu 22.04 LTS or similar).
- Domain DNS: **infinitycolor.co** and **api.infinitycolor.co** A records pointing to your server’s IP.
- Frontend running on the server (e.g. `localhost:3000`).
- Backend (Strapi) running on the server (e.g. `localhost:1337`).

---

## Step 1: Install Nginx

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

Verify:

```bash
curl -I http://YOUR_SERVER_IP
# Should return "HTTP/1.1 200 OK" (default Nginx page)
```

---

## Step 2: Install Certbot

Using the recommended **snap** method (works well on Ubuntu):

```bash
sudo apt install -y snapd
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

Or with **apt** (Ubuntu 22.04):

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Verify:

```bash
certbot --version
```

---

## Step 3: Initial Nginx Config (HTTP only, for Certbot)

Create a minimal config so Certbot can do HTTP-01 challenge. Certbot will temporarily use port 80.

```bash
sudo nano /etc/nginx/sites-available/infinitycolor
```

Paste this (replace with your domains if different):

```nginx
# Temporary HTTP-only config for initial Certbot run
server {
    listen 80;
    listen [::]:80;
    server_name infinitycolor.co www.infinitycolor.co api.infinitycolor.co;
    root /var/www/html;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
        try_files $uri =404;
    }

    location / {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
```

Enable and test:

```bash
sudo ln -sf /etc/nginx/sites-available/infinitycolor /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 4: Obtain SSL Certificates with Certbot

**Option A – One certificate for all hostnames (recommended):**

```bash
sudo certbot certonly --webroot -w /var/www/html \
  -d infinitycolor.co \
  -d www.infinitycolor.co \
  -d api.infinitycolor.co \
  --email YOUR_EMAIL@example.com \
  --agree-tos \
  --no-eff-email
```

Certificates will be in:

- `/etc/letsencrypt/live/infinitycolor.co/fullchain.pem`
- `/etc/letsencrypt/live/infinitycolor.co/privkey.pem`

Use this **single** certificate for both frontend and API in Nginx (same SANs).

**Option B – Separate certificates per domain:**

```bash
# Frontend
sudo certbot certonly --webroot -w /var/www/html \
  -d infinitycolor.co -d www.infinitycolor.co \
  --email YOUR_EMAIL@example.com --agree-tos --no-eff-email

# API
sudo certbot certonly --webroot -w /var/www/html \
  -d api.infinitycolor.co \
  --email YOUR_EMAIL@example.com --agree-tos --no-eff-email
```

Then in Nginx you would use:

- Frontend: `ssl_certificate /etc/letsencrypt/live/infinitycolor.co/...`
- API: `ssl_certificate /etc/letsencrypt/live/api.infinitycolor.co/...`

---

## Step 5: Full Nginx Config (HTTPS + reverse proxy)

Replace the temporary config with the production one:

```bash
sudo nano /etc/nginx/sites-available/infinitycolor
```

Use this (with **one cert** for all three hostnames from Step 4 Option A):

```nginx
# HTTP → HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name infinitycolor.co www.infinitycolor.co api.infinitycolor.co;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
        try_files $uri =404;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# Frontend (Next.js) – infinitycolor.co
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name infinitycolor.co www.infinitycolor.co;

    ssl_certificate     /etc/letsencrypt/live/infinitycolor.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/infinitycolor.co/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss font/truetype font/opentype image/svg+xml;

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.(woff2|woff|ttf|eot)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
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
}

# Backend API (Strapi) – api.infinitycolor.co
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.infinitycolor.co;

    ssl_certificate     /etc/letsencrypt/live/infinitycolor.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/infinitycolor.co/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    client_max_body_size 500M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    location / {
        proxy_pass http://127.0.0.1:1337;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        proxy_request_buffering off;
        proxy_buffering off;
    }
}
```

If you used **Option B** (separate cert for API), change the second `server` block to:

```nginx
    ssl_certificate     /etc/letsencrypt/live/api.infinitycolor.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.infinitycolor.co/privkey.pem;
```

Test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 6: Auto-renewal (Certbot)

Test renewal:

```bash
sudo certbot renew --dry-run
```

Enable a systemd timer (default with snap/apt certbot):

```bash
sudo systemctl enable certbot.timer
sudo systemctl status certbot.timer
```

Or add a cron job (e.g. twice daily):

```bash
sudo crontab -e
# Add:
0 0,12 * * * certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

Renewal keeps using the same paths; Nginx already points to `/etc/letsencrypt/live/...`, so no config change is needed.

---

## Nginx tuning (worker_connections and timeouts)

If you see **"768 worker_connections are not enough"** or **"upstream timed out"** in `error.log`, apply the following.

### 1. Increase worker_connections (main Nginx config)

Each page load opens many connections (fonts, CSS, JS). The default 768 is too low.

Edit the main config:

```bash
sudo nano /etc/nginx/nginx.conf
```

Find the `events { }` block and set:

```nginx
events {
    worker_connections 4096;
    # use epoll;   # uncomment on Linux for better performance
}
```

If there is no `events { }` block, add it at the top level (e.g. after the `user` directive).

### 2. Increase proxy timeouts (site config)

So slow upstream responses (Next.js/Strapi) don’t cause 504s.

Edit your site config (e.g. `/etc/nginx/sites-available/infinitycolor.org` or `infinitycolor`):

Inside each `location /` that has `proxy_pass` to the frontend (3000) or API (1337), add or adjust:

```nginx
proxy_connect_timeout 90s;
proxy_send_timeout 90s;
proxy_read_timeout 90s;
```

(You can use 120s if the app is often slow.)

### 3. Test and reload

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Quick reference

| Item | Value |
|------|--------|
| Frontend app | `http://127.0.0.1:3000` |
| Backend (Strapi) | `http://127.0.0.1:1337` |
| Frontend domain | `https://infinitycolor.co` |
| API domain | `https://api.infinitycolor.co` |
| Cert path (single cert) | `/etc/letsencrypt/live/infinitycolor.co/` |
| Config file | `/etc/nginx/sites-available/infinitycolor` |

---

## Troubleshooting

- **Certbot "Connection refused"**  
  Ensure Nginx is running and listening on port 80, and that `server_name` and `/.well-known/acme-challenge/` are correct.

- **502 Bad Gateway**  
  Check that the Next.js and Strapi processes are running on 3000 and 1337 (e.g. `curl http://127.0.0.1:3000` and `curl http://127.0.0.1:1337`).

- **SSL certificate not found**  
  Run `sudo ls /etc/letsencrypt/live/infinitycolor.co/` and fix paths in Nginx to match your Certbot choice (one cert vs separate certs).

- **Test config**  
  `sudo nginx -t`  
  **Logs**  
  `sudo tail -f /var/log/nginx/error.log`

---

See also: [.cursor/rules/nginx-http2-setup.mdc](../.cursor/rules/nginx-http2-setup.mdc) for HTTP/2 and caching details.
