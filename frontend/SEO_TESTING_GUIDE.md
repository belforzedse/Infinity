# SEO Testing Guide - Local Development

This guide helps you test all SEO implementations locally before deploying.

## Prerequisites

1. Start your development server:
```bash
cd frontend
npm run dev
```

Your site should be available at `http://localhost:2888` (or your configured port)

## Testing Checklist

### 1. Structured Data (JSON-LD) Testing

#### Test Product Schema
1. Navigate to any product page: `http://localhost:2888/pdp/[product-slug]`
2. View page source (Right-click → View Page Source)
3. Search for `"@type": "Product"` - you should see the JSON-LD schema
4. Copy the JSON-LD and test it:
   - **Google Rich Results Test**: https://search.google.com/test/rich-results
   - Paste the JSON-LD or enter your local URL
   - **Note**: Google's tool may not work with localhost, so copy the JSON-LD manually

#### Test Organization Schema
1. Navigate to homepage: `http://localhost:2888`
2. View page source
3. Search for `"@type": "Organization"` - should be in the `<head>`

#### Test Breadcrumb Schema
1. Navigate to any product page
2. View page source
3. Search for `"@type": "BreadcrumbList"` - verify URLs use SITE_URL constant

#### Test Review Schema
1. Navigate to a product page with reviews
2. View page source
3. Search for `"@type": "Review"` or `"@type": "Product"` with review array

#### Manual JSON-LD Validation
```bash
# In browser console on any page:
const scripts = document.querySelectorAll('script[type="application/ld+json"]');
scripts.forEach(script => {
  try {
    const data = JSON.parse(script.textContent);
    console.log('Valid JSON-LD:', data);
  } catch (e) {
    console.error('Invalid JSON-LD:', e);
  }
});
```

### 2. Metadata Testing

#### Test Product Page Metadata
1. Navigate to: `http://localhost:2888/pdp/[product-slug]`
2. View page source
3. Check for:
   - `<title>` tag
   - `<meta name="description">`
   - `<meta property="og:title">`
   - `<meta property="og:type">` (should be "website" but with product properties)
   - `<meta property="product:price:amount">` (if price exists)
   - `<meta property="product:availability">` (if stock exists)
   - `<link rel="canonical">` (should be absolute URL)

#### Test Blog Post Metadata
1. Navigate to: `http://localhost:2888/[blog-slug]`
2. View page source
3. Check for:
   - `<meta property="og:type">` (should be "article")
   - `<meta property="article:published_time">`
   - `<meta property="article:author">`

#### Browser DevTools Method
1. Open DevTools (F12)
2. Go to Elements/Inspector tab
3. Check `<head>` section for all meta tags
4. Or use Console:
```javascript
// Check all meta tags
document.querySelectorAll('meta').forEach(meta => {
  console.log(meta.getAttribute('property') || meta.getAttribute('name'), meta.getAttribute('content'));
});
```

### 3. Sitemap Testing

#### Test Sitemap
1. Navigate to: `http://localhost:2888/sitemap.xml`
2. Should see XML with all URLs
3. Check:
   - Product URLs use slugs (not IDs)
   - Blog posts included
   - Categories included
   - All URLs are absolute (use SITE_URL)
   - No duplicate URLs

#### Validate Sitemap XML
- Use online validator: https://www.xml-sitemaps.com/validate-xml-sitemap.html
- Or check in browser - should render as XML tree

### 4. Robots.txt Testing

#### Test Robots.txt
1. Navigate to: `http://localhost:2888/robots.txt`
2. Should see:
   - Disallow rules for admin, cart, checkout, etc.
   - Sitemap reference
   - Proper formatting

### 5. OpenGraph & Twitter Cards Testing

#### Test OpenGraph Tags
1. Navigate to any product or blog page
2. View page source
3. Check for all `og:*` tags
4. **Online Validators** (won't work with localhost, but test after deploy):
   - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
   - LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
   - Twitter Card Validator: https://cards-dev.twitter.com/validator

#### Local OpenGraph Testing
Use browser console:
```javascript
// Get all OpenGraph tags
const ogTags = {};
document.querySelectorAll('meta[property^="og:"]').forEach(meta => {
  ogTags[meta.getAttribute('property')] = meta.getAttribute('content');
});
console.table(ogTags);
```

### 6. Canonical URLs Testing

#### Test Canonical URLs
1. Navigate to any page
2. View page source
3. Search for `<link rel="canonical">`
4. Verify:
   - All URLs are absolute (start with https://)
   - No relative URLs
   - Each page has exactly one canonical URL

```javascript
// Check canonical URLs
document.querySelectorAll('link[rel="canonical"]').forEach(link => {
  const url = link.getAttribute('href');
  console.log('Canonical:', url, url?.startsWith('http') ? '✓ Absolute' : '✗ Relative');
});
```

### 7. Security Headers Testing

#### Test Headers
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Click on the main document request
5. Check Response Headers for:
   - `X-Frame-Options: SAMEORIGIN`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`

#### Online Header Testing (after deploy)
- SecurityHeaders.com: https://securityheaders.com/
- Or use curl:
```bash
curl -I https://your-domain.com
```

### 8. Theme Color & PWA Meta Tags

#### Test PWA Meta Tags
1. View page source on homepage
2. Check for:
   - `<meta name="theme-color">` (in viewport config)
   - `<meta name="apple-mobile-web-app-capable">`
   - `<meta name="apple-mobile-web-app-status-bar-style">`
   - `<meta name="apple-mobile-web-app-title">`

### 9. Structured Data Validation Tools

#### Google Rich Results Test
1. Copy JSON-LD from page source
2. Go to: https://search.google.com/test/rich-results
3. Paste JSON-LD code
4. Should show no errors

#### Schema.org Validator
1. Go to: https://validator.schema.org/
2. Enter your localhost URL (may not work) OR paste JSON-LD
3. Check for validation errors

### 10. Performance Testing (SEO Impact)

#### Lighthouse SEO Audit
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "SEO" category
4. Run audit
5. Should score 90-100

#### Check Core Web Vitals
1. Open DevTools → Performance tab
2. Record page load
3. Check:
   - LCP (Largest Contentful Paint) < 2.5s
   - CLS (Cumulative Layout Shift) < 0.1
   - INP (Interaction to Next Paint) < 200ms

### 11. Quick Test Script

Run this in browser console on any page:

```javascript
// Comprehensive SEO Check
const seoCheck = {
  title: document.querySelector('title')?.textContent || 'MISSING',
  description: document.querySelector('meta[name="description"]')?.getAttribute('content') || 'MISSING',
  canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || 'MISSING',
  ogType: document.querySelector('meta[property="og:type"]')?.getAttribute('content') || 'MISSING',
  ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || 'MISSING',
  ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || 'MISSING',
  jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
  themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content') || 'MISSING',
};

console.table(seoCheck);

// Check if canonical is absolute
if (seoCheck.canonical && !seoCheck.canonical.startsWith('http')) {
  console.error('❌ Canonical URL is relative! Should be absolute.');
} else if (seoCheck.canonical) {
  console.log('✓ Canonical URL is absolute');
}

// Check JSON-LD validity
document.querySelectorAll('script[type="application/ld+json"]').forEach((script, i) => {
  try {
    const data = JSON.parse(script.textContent);
    console.log(`✓ JSON-LD #${i + 1} is valid:`, data['@type'] || 'Unknown type');
  } catch (e) {
    console.error(`❌ JSON-LD #${i + 1} is invalid:`, e);
  }
});
```

### 12. Testing After Deployment

Once deployed, test with these tools:

1. **Google Search Console**: Submit sitemap, check indexing
2. **Google Rich Results Test**: Test live URLs
3. **Facebook Sharing Debugger**: Test OpenGraph
4. **Twitter Card Validator**: Test Twitter cards
5. **Schema.org Validator**: Validate structured data
6. **Lighthouse**: Full SEO audit
7. **SecurityHeaders.com**: Check security headers

## Common Issues to Check

### ❌ Issues to Avoid
- Missing or empty meta descriptions
- Relative canonical URLs
- Invalid JSON-LD (syntax errors)
- Missing `@type` in structured data
- Hardcoded URLs instead of SITE_URL constant
- Missing `og:type` on product pages
- Undefined fields in JSON-LD (should be omitted, not `undefined`)

### ✅ What Should Work
- All canonical URLs are absolute
- JSON-LD validates without errors
- Product schema includes category, colors, sizes (if data exists)
- OpenGraph shows price and availability (if data exists)
- Sitemap includes all public pages
- Robots.txt blocks private pages
- Security headers are present

## Quick Local Test Commands

```bash
# Start dev server
cd frontend
npm run dev

# In another terminal, test sitemap
curl http://localhost:2888/sitemap.xml

# Test robots.txt
curl http://localhost:2888/robots.txt

# Test a product page (replace with actual slug)
curl http://localhost:2888/pdp/[slug] | grep -i "application/ld+json"
```

## Notes

- **Localhost limitations**: Some online tools (Google, Facebook) won't work with localhost
- **Test with real data**: Make sure you test pages that have actual product data, reviews, etc.
- **Check multiple pages**: Test homepage, product pages, blog posts, categories
- **Validate JSON-LD**: Always validate structured data - invalid JSON-LD can hurt SEO
- **Check console errors**: Make sure there are no JavaScript errors that might break SEO components


