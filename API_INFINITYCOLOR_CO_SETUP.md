# api.infinitycolor.co Setup Guide

Production backend API is served at `https://api.infinitycolor.co`. This document covers DNS, SSL, Nginx, environment variables, and deployment steps.

---

## 1. DNS Configuration

Add an A or CNAME record for the backend domain:

```
Type: A or CNAME
Name: api.infinitycolor.co
Value: [Backend server IP or hostname]
TTL: 3600
```

Verify:

```bash
nslookup api.infinitycolor.co
```

---

## 2. SSL Certificate (Let's Encrypt)

Ensure Nginx is running and serving `api.infinitycolor.co`, then:

```bash
sudo certbot certonly --nginx -d api.infinitycolor.co
```

Or use Cloudflare SSL if DNS is proxied through Cloudflare.

---

## 3. Nginx Configuration

Create or update `/etc/nginx/sites-available/infinity-backend`:

```nginx
server {
    listen 80;
    server_name api.infinitycolor.co;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.infinitycolor.co;
    
    ssl_certificate /etc/letsencrypt/live/api.infinitycolor.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.infinitycolor.co/privkey.pem;
    
    location / {
        proxy_pass http://localhost:1337;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and reload Nginx:

```bash
sudo ln -sf /etc/nginx/sites-available/infinity-backend /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 4. Optional: Redirect from Old Domain

If `api.infinitycolor.co` was previously used, add a redirect block:

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name api.infinitycolor.co;
    return 301 https://api.infinitycolor.co$request_uri;
}
```

---

## 5. Environment Variables

### Backend (production .env)

```bash
URL=https://api.infinitycolor.co
FRONTEND_URL=https://infinitycolor.co
FRONTEND_BASE_URL=https://infinitycolor.co

# Payment callbacks
SAMAN_CALLBACK_URL=https://api.infinitycolor.co/api/wallet/payment-callback
SNAPPAY_RETURN_URL=https://api.infinitycolor.co/api/orders/payment-callback
```

### Frontend (production .env)

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.infinitycolor.co/api
NEXT_PUBLIC_IMAGE_BASE_URL=https://api.infinitycolor.co/
NEXT_PUBLIC_SITE_URL=https://infinitycolor.co
NEXT_PUBLIC_SITE_BASE_URL=https://infinitycolor.co
```

Environment variables take precedence over code fallbacks. Set these on the server before deploying.

---

## 6. Third-Party Services

Update callback URLs in each provider's dashboard:

| Service | Update |
|---------|--------|
| **Mellat Bank** | Callback URL → `https://api.infinitycolor.co/api/orders/payment-callback` |
| **SnappPay** | Return URL → `https://api.infinitycolor.co/api/orders/payment-callback` |
| **Saman Kish (Wallet top-ups)** | Callback URL → `https://api.infinitycolor.co/api/wallet/payment-callback` |
| **OAuth providers** (if any) | Update redirect URIs |
| **Webhooks** (if any) | Update target URLs |

---

## 7. Deployment Order

1. Add DNS for `api.infinitycolor.co`
2. Obtain SSL certificate and configure Nginx
3. Update backend env vars and third-party callback URLs
4. Deploy backend
5. Update frontend env vars
6. Deploy frontend
7. Run smoke tests (API, images, auth, checkout, payments)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Verify `FRONTEND_URL` in backend is `https://infinitycolor.co` and restart backend |
| Payment callbacks fail | Verify Mellat, SnappPay, Saman callback URLs in their admin panels |
| Images don't load | Verify `NEXT_PUBLIC_IMAGE_BASE_URL` is `https://api.infinitycolor.co/` in frontend env |
| 404 for API calls | Verify `NEXT_PUBLIC_API_BASE_URL` is `https://api.infinitycolor.co/api` in frontend env |
| SSL errors | Ensure cert paths in Nginx match Let's Encrypt output |
