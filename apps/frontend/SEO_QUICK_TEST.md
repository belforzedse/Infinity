# SEO Quick Test Checklist

## 🚀 Quick Start (5 minutes)

### 1. Start Your Dev Server
```bash
cd apps/frontend
npm run dev
```

### 2. Test These URLs

#### ✅ Homepage
- URL: `http://localhost:2888`
- Check: View page source → Search for `"@type": "Organization"`

#### ✅ Product Page
- URL: `http://localhost:2888/pdp/[any-product-slug]`
- Check: View page source → Search for `"@type": "Product"`

#### ✅ Sitemap
- URL: `http://localhost:2888/sitemap.xml`
- Check: Should see XML with all product/blog URLs

#### ✅ Robots.txt
- URL: `http://localhost:2888/robots.txt`
- Check: Should see sitemap reference and disallow rules

## 🔍 Browser Console Test

Open any page, press F12, paste this in console:

```javascript
// Quick SEO Check
const check = {
  title: document.querySelector('title')?.textContent || '❌ MISSING',
  description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '❌ MISSING',
  canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '❌ MISSING',
  jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
  ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '❌ MISSING',
};

console.table(check);

// Validate JSON-LD
document.querySelectorAll('script[type="application/ld+json"]').forEach((script, i) => {
  try {
    const data = JSON.parse(script.textContent);
    console.log(`✅ JSON-LD #${i + 1}:`, data['@type']);
  } catch (e) {
    console.error(`❌ JSON-LD #${i + 1} INVALID:`, e);
  }
});
```

## 📋 What to Verify

### On Product Pages:
- ✅ `<title>` tag exists and is descriptive
- ✅ `<meta name="description">` exists
- ✅ `<link rel="canonical">` is absolute URL (starts with `https://`)
- ✅ `"@type": "Product"` JSON-LD exists
- ✅ `"@type": "BreadcrumbList"` JSON-LD exists
- ✅ `og:image`, `og:title`, `og:description` exist
- ✅ `product:price:amount` exists (if product has price)
- ✅ `product:availability` exists

### On Homepage:
- ✅ `"@type": "Organization"` JSON-LD exists
- ✅ All meta tags present

### Sitemap:
- ✅ XML format is valid
- ✅ Product URLs use slugs (not IDs like `/pdp/123`)
- ✅ All URLs are absolute

## 🛠️ Advanced Testing

### Google Rich Results Test
1. Copy JSON-LD from page source
2. Go to: https://search.google.com/test/rich-results
3. Paste JSON-LD code
4. Should show no errors

### Lighthouse SEO Audit
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "SEO" only
4. Click "Analyze page load"
5. Should score 90-100

### Check Security Headers
1. DevTools → Network tab
2. Reload page
3. Click main document request
4. Check Response Headers for:
   - `X-Frame-Options`
   - `X-Content-Type-Options`
   - `Referrer-Policy`
   - `Permissions-Policy`

## ⚠️ Common Issues

- ❌ **Missing canonical**: Check if page has `<link rel="canonical">`
- ❌ **Relative canonical URL**: Should start with `https://`
- ❌ **Invalid JSON-LD**: Check browser console for parse errors
- ❌ **Missing meta description**: Should be 120-160 characters
- ❌ **Product URLs using IDs**: Should use slugs like `/pdp/سلام` not `/pdp/123`

## 📚 Full Testing Guide

For comprehensive testing, see: `apps/frontend/SEO_TESTING_GUIDE.md`


