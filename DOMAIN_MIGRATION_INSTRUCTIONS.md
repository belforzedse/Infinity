# Domain Migration Instructions: new.infinitycolor.co

## ✅ Completed Code Changes

All code changes have been completed to migrate from the old domains to the new ones:
- **Old Frontend**: `infinitycolor.org` → **New Frontend**: `new.infinitycolor.co`
- **Old Backend**: `api.infinitycolor.org` → **New Backend**: `api.new.infinitycolor.co`

### Files Updated

#### Backend Files (29 files)
- `backend/.env.example` - Updated SAMAN_CALLBACK_URL
- `backend/src/api/wallet-topup/controllers/wallet-topup.ts` - Updated FRONTEND_URL and API URL fallbacks
- `backend/src/api/payment-gateway/services/saman-kish.ts` - Updated callback URL
- `backend/src/api/payment-gateway/services/mellat-v3.ts` - Updated API URL fallback
- `backend/src/api/order/controllers/helpers/payment.ts` - Updated FRONTEND_URL fallback
- `backend/src/api/cart/controllers/handlers/finalizeToOrder.ts` - Updated API URL fallback
- `backend/src/api/blog-post/content-types/blog-post/lifecycles.ts` - Updated revalidation URLs
- Test files updated:
  - `backend/src/api/wallet-topup/__tests__/wallet-topup.spec.ts`
  - `backend/src/api/payment-gateway/__tests__/mellat-v3.spec.ts`
  - `backend/src/api/payment-gateway/__tests__/mellat-v3-improved.spec.ts`
  - `backend/src/api/payment-gateway/__tests__/callbacks.spec.ts`
  - `backend/src/__tests__/setup.ts`
  - `backend/src/__tests__/helpers/test-utils.ts`

#### Frontend Files (16 files)
- `frontend/src/utils/seo.ts` - Updated site URL
- `frontend/src/config/site.ts` - Updated SITE_URL constant
- `frontend/src/components/User/Orders/Tabs.tsx` - Updated image base URL
- `frontend/src/components/SuperAdmin/Blog/Sidebar/PermalinkPanel.tsx` - Updated base URL
- SEO component files:
  - `frontend/src/components/SEO/ProductSchema.tsx`
  - `frontend/src/components/SEO/OrganizationSchema.tsx`
  - `frontend/src/components/SEO/HowToSchema.tsx`
  - `frontend/src/components/SEO/CollectionPageSchema.tsx`
  - `frontend/src/components/SEO/BreadcrumbSchema.tsx`
- Page files:
  - `frontend/src/app/sitemap.ts`
  - `frontend/src/app/robots.ts`
  - `frontend/src/app/(product)/plp/page.tsx`
  - `frontend/src/app/(product)/pdp/[slug]/page.tsx`
  - `frontend/src/app/(product)/page.tsx`
- `frontend/src/components/RichTextEditor/ProductShortcodeModal.tsx` - Updated placeholder
- `frontend/src/utils/blogShortcodes.ts` - Updated comment

---

## 🔧 Required Manual Steps

The following steps **MUST** be performed manually by you or your infrastructure team:

### 1. DNS Configuration ⚠️ CRITICAL

You need to configure DNS records for your new domains:

#### For `new.infinitycolor.co` (Frontend)
```
Type: A or CNAME
Name: new.infinitycolor.co
Value: [Your frontend server IP or hostname]
TTL: 3600 (or your preferred value)
```

#### For `api.new.infinitycolor.co` (Backend API)
```
Type: A or CNAME
Name: api.new.infinitycolor.co
Value: [Your backend server IP or hostname]
TTL: 3600 (or your preferred value)
```

**Action Required**: Update DNS records in your DNS provider (e.g., Cloudflare, Route53, etc.)

---

### 2. SSL/TLS Certificates ⚠️ CRITICAL

Obtain and configure HTTPS certificates for both domains:

#### Option A: Using Certbot (Let's Encrypt)
```bash
# For frontend
sudo certbot certonly --nginx -d new.infinitycolor.co

# For backend
sudo certbot certonly --nginx -d api.new.infinitycolor.co
```

#### Option B: Using Cloudflare
- Enable "Proxied" for both DNS records in Cloudflare dashboard
- Cloudflare will automatically provide SSL

#### Option C: Using your cloud provider
- Configure SSL certificates in your hosting platform (Vercel, Netlify, AWS, etc.)

**Action Required**: Obtain and install SSL certificates for both domains

---

### 3. Nginx Configuration (if using nginx)

Update your nginx configuration to serve the new domains:

#### Frontend Config (`/etc/nginx/sites-available/infinity-frontend`)
```nginx
server {
    listen 80;
    server_name new.infinitycolor.co;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name new.infinitycolor.co;
    
    ssl_certificate /etc/letsencrypt/live/new.infinitycolor.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/new.infinitycolor.co/privkey.pem;
    
    # Your existing frontend proxy config
    location / {
        proxy_pass http://localhost:3000;  # or your frontend port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Backend Config (`/etc/nginx/sites-available/infinity-backend`)
```nginx
server {
    listen 80;
    server_name api.new.infinitycolor.co;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.new.infinitycolor.co;
    
    ssl_certificate /etc/letsencrypt/live/api.new.infinitycolor.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.new.infinitycolor.co/privkey.pem;
    
    # Your existing backend proxy config
    location / {
        proxy_pass http://localhost:1337;  # Strapi port
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

**After updating nginx config**:
```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

**Action Required**: Update nginx configuration files and reload nginx

---

### 4. Environment Variables

Update your **production environment variables** on your deployment platform:

#### Backend Environment Variables
Update these in your backend deployment (Docker, PM2, hosting platform, etc.):
```bash
# Backend API URL
URL=https://api.new.infinitycolor.co

# Frontend URL (for callbacks)
FRONTEND_URL=https://new.infinitycolor.co
FRONTEND_BASE_URL=https://new.infinitycolor.co

# Update payment callback URLs if explicitly set
SAMAN_CALLBACK_URL=https://api.new.infinitycolor.co/api/wallet/payment-callback
SNAPPAY_RETURN_URL=https://api.new.infinitycolor.co/api/orders/payment-callback
```

#### Frontend Environment Variables
Update these in your frontend deployment:
```bash
# Frontend site URL
NEXT_PUBLIC_SITE_URL=https://new.infinitycolor.co
NEXT_PUBLIC_SITE_BASE_URL=https://new.infinitycolor.co

# Backend API URL
NEXT_PUBLIC_API_BASE_URL=https://api.new.infinitycolor.co/api

# Image/Upload CDN URL
NEXT_PUBLIC_IMAGE_BASE_URL=https://api.new.infinitycolor.co/
```

**Action Required**: Update environment variables in your deployment platform

---

### 5. CORS Configuration

The backend CORS should already allow the new domain through environment variables, but verify:

Check `backend/config/middlewares.ts` - it should use `process.env.FRONTEND_URL`, which you'll set to `https://new.infinitycolor.co`.

If you have hardcoded CORS origins, update them:
```typescript
// In backend/config/middlewares.ts or similar
origin: [
  'https://new.infinitycolor.co',
  'https://staging.infinitycolor.org',  // Keep if still needed
  // Remove old production domain after migration is complete
]
```

**Action Required**: Verify CORS configuration allows new.infinitycolor.co

---

### 6. Cookie Domain Settings (if applicable)

If you're using cookies for authentication that need to be shared between frontend and backend:

Update cookie domain to `.infinitycolor.co` (note the leading dot) to allow cookies to be shared between `new.infinitycolor.co` and `api.new.infinitycolor.co`.

**Action Required**: Review and update cookie domain settings if needed

---

### 7. Third-Party Service Callbacks

Update callback URLs in any third-party services:

#### Payment Gateways
- **Mellat Bank**: Update callback URL to `https://api.new.infinitycolor.co/api/orders/payment-callback`
- **SnappPay**: Update return URL to `https://api.new.infinitycolor.co/api/orders/payment-callback`
- **Saman Kish (Wallet)**: Update callback URL to `https://api.new.infinitycolor.co/api/wallet/payment-callback`

#### Other Services (if applicable)
- **OAuth providers** (Google, Facebook, etc.): Update redirect URIs to use `new.infinitycolor.co`
- **Webhooks**: Update webhook URLs if any external services send data to your API
- **Email service**: Update any links in email templates to use `new.infinitycolor.co`

**Action Required**: Update all third-party service callback URLs

---

### 8. Redirects from Old Domains (Recommended for SEO)

To maintain SEO rankings and prevent broken links, set up 301 redirects from old domains to new:

#### Option A: Nginx redirects
```nginx
# Redirect old frontend domain
server {
    listen 80;
    listen 443 ssl http2;
    server_name infinitycolor.org www.infinitycolor.org;
    
    # SSL certs for old domain (if HTTPS)
    ssl_certificate /path/to/old/cert/fullchain.pem;
    ssl_certificate_key /path/to/old/cert/privkey.pem;
    
    return 301 https://new.infinitycolor.co$request_uri;
}

# Redirect old backend domain
server {
    listen 80;
    listen 443 ssl http2;
    server_name api.infinitycolor.org;
    
    # SSL certs for old domain (if HTTPS)
    ssl_certificate /path/to/old/api/cert/fullchain.pem;
    ssl_certificate_key /path/to/old/api/cert/privkey.pem;
    
    return 301 https://api.new.infinitycolor.co$request_uri;
}
```

#### Option B: Cloudflare Page Rules
- Create page rule: `infinitycolor.org/*` → Forward to `https://new.infinitycolor.co/$1` (301 redirect)
- Create page rule: `api.infinitycolor.org/*` → Forward to `https://api.new.infinitycolor.co/$1` (301 redirect)

**Action Required**: Configure 301 redirects from old domains (recommended)

---

### 9. Deployment & Testing

#### Step 1: Deploy to Staging First
1. Update staging environment variables
2. Deploy both frontend and backend
3. Test thoroughly:
   - ✅ Homepage loads
   - ✅ Product pages work
   - ✅ Search works
   - ✅ Cart functionality
   - ✅ Checkout flow
   - ✅ Payment (use test mode if available)
   - ✅ User authentication
   - ✅ Admin panel access

#### Step 2: Deploy to Production
1. Update production environment variables
2. Deploy backend first, then frontend
3. Monitor logs for any errors
4. Test critical flows immediately after deployment

#### Step 3: Monitoring
- Check server logs: `tail -f /var/log/nginx/error.log`
- Check application logs
- Monitor error tracking service (if you have one)
- Test from different devices/browsers

**Action Required**: Deploy and verify

---

## 📋 Deployment Checklist

Use this checklist to ensure you complete all steps:

- [ ] **DNS**: Configure DNS A/CNAME records for both domains
- [ ] **SSL**: Obtain and install SSL certificates
- [ ] **Nginx**: Update nginx configuration (if applicable)
- [ ] **Backend Env**: Update backend environment variables
- [ ] **Frontend Env**: Update frontend environment variables
- [ ] **CORS**: Verify CORS allows new.infinitycolor.co
- [ ] **Cookies**: Update cookie domain if needed
- [ ] **Payment Gateways**: Update callback URLs in Mellat, SnappPay, Saman
- [ ] **OAuth**: Update OAuth redirect URIs (if applicable)
- [ ] **Redirects**: Set up 301 redirects from old domains
- [ ] **Staging Test**: Deploy to staging and test thoroughly
- [ ] **Production Deploy**: Deploy to production
- [ ] **Production Test**: Verify all critical functionality
- [ ] **Monitoring**: Monitor logs for 24-48 hours

---

## 🆘 Troubleshooting

### Issue: CORS errors in browser console
**Solution**: Verify that `FRONTEND_URL` environment variable in backend is set to `https://new.infinitycolor.co` and backend is restarted.

### Issue: Payment callbacks fail
**Solution**: Verify that payment gateway callback URLs are updated in the gateway's admin panel.

### Issue: Images don't load
**Solution**: Verify `NEXT_PUBLIC_IMAGE_BASE_URL` is set to `https://api.new.infinitycolor.co/` in frontend environment.

### Issue: SSL certificate errors
**Solution**: Ensure SSL certificates are properly installed and nginx configuration points to correct cert paths.

### Issue: 404 errors for API calls
**Solution**: Verify `NEXT_PUBLIC_API_BASE_URL` is set to `https://api.new.infinitycolor.co/api` in frontend environment.

---

## 📞 Support

If you encounter issues during migration:
1. Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
2. Check application logs
3. Verify all environment variables are set correctly
4. Test DNS resolution: `nslookup new.infinitycolor.co`
5. Test SSL: `openssl s_client -connect new.infinitycolor.co:443`

---

## ✨ Summary

**Code changes are complete!** All hardcoded domain references in the codebase have been updated to use the new domains. The application code will use environment variables in production, which you need to set according to the instructions above.

The remaining steps are infrastructure-related and must be performed manually before deploying to production.

