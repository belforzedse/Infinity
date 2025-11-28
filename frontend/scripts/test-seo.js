#!/usr/bin/env node

/**
 * SEO Testing Script
 * 
 * Tests SEO implementation locally before deployment
 * 
 * Usage:
 *   npm run test:seo
 *   node scripts/test-seo.js http://localhost:2888
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE_URL = process.argv[2] || 'http://localhost:2888';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

function extractMetaTag(html, property) {
  const regex = new RegExp(`<meta[^>]*(?:property|name)="${property}"[^>]*content="([^"]*)"`, 'i');
  const match = html.match(regex);
  return match ? match[1] : null;
}

function extractAllMetaTags(html, prefix) {
  const regex = new RegExp(`<meta[^>]*(?:property|name)="${prefix}[^"]*"[^>]*content="([^"]*)"`, 'gi');
  const matches = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

function extractJSONLD(html) {
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
  const schemas = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      schemas.push(JSON.parse(match[1]));
    } catch (e) {
      // Invalid JSON, skip
    }
  }
  return schemas;
}

async function testPage(url, label) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Testing: ${label}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
  
  try {
    const { status, headers, body } = await fetch(url);
    
    if (status !== 200) {
      log(`✗ HTTP ${status}`, 'red');
      return false;
    }

    let allPassed = true;

    // Test 1: Title
    const titleMatch = body.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      if (title.length >= 10 && title.length <= 60) {
        log(`✓ Title: "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}"`, 'green');
      } else {
        log(`✗ Title length issue: ${title.length} chars`, 'red');
        allPassed = false;
      }
    } else {
      log(`✗ Missing title tag`, 'red');
      allPassed = false;
    }

    // Test 2: Meta Description
    const description = extractMetaTag(body, 'description');
    if (description) {
      if (description.length >= 50 && description.length <= 160) {
        log(`✓ Meta description: "${description.substring(0, 60)}..."`, 'green');
      } else {
        log(`✗ Meta description length: ${description.length} chars (should be 50-160)`, 'red');
        allPassed = false;
      }
    } else {
      log(`✗ Missing meta description`, 'red');
      allPassed = false;
    }

    // Test 3: Canonical URL
    const canonicalMatch = body.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
    if (canonicalMatch) {
      const canonical = canonicalMatch[1];
      if (canonical.startsWith('http')) {
        log(`✓ Canonical URL: ${canonical}`, 'green');
      } else {
        log(`✗ Canonical URL is relative: ${canonical}`, 'red');
        allPassed = false;
      }
    } else {
      log(`⚠ No canonical URL found`, 'yellow');
    }

    // Test 4: OpenGraph
    const ogTags = extractAllMetaTags(body, 'og:');
    if (ogTags.length > 0) {
      const required = ['og:title', 'og:description', 'og:type', 'og:url'];
      const found = ogTags.map(tag => {
        const match = body.match(new RegExp(`<meta[^>]*property=["']([^"']*)["'][^>]*content=["']([^"']*)["']`, 'i'));
        return match ? match[1] : null;
      }).filter(Boolean);
      
      const missing = required.filter(req => !found.some(f => f === req));
      if (missing.length === 0) {
        log(`✓ OpenGraph: All required tags present (${ogTags.length} total)`, 'green');
      } else {
        log(`✗ OpenGraph: Missing ${missing.join(', ')}`, 'red');
        allPassed = false;
      }
    } else {
      log(`✗ No OpenGraph tags found`, 'red');
      allPassed = false;
    }

    // Test 5: Twitter Cards
    const twitterTags = extractAllMetaTags(body, 'twitter:');
    if (twitterTags.length > 0) {
      log(`✓ Twitter Cards: ${twitterTags.length} tags found`, 'green');
    } else {
      log(`⚠ No Twitter Card tags found`, 'yellow');
    }

    // Test 6: JSON-LD
    const schemas = extractJSONLD(body);
    if (schemas.length > 0) {
      const types = schemas.map(s => s['@type']).filter(Boolean);
      log(`✓ JSON-LD: ${schemas.length} schema(s) found (${types.join(', ')})`, 'green');
      
      // Validate each schema
      schemas.forEach((schema, i) => {
        if (!schema['@type']) {
          log(`✗ JSON-LD #${i + 1}: Missing @type`, 'red');
          allPassed = false;
        }
      });
    } else {
      log(`⚠ No JSON-LD structured data found`, 'yellow');
    }

    // Test 7: Theme Color
    const themeColor = extractMetaTag(body, 'theme-color');
    if (themeColor) {
      log(`✓ Theme color: ${themeColor}`, 'green');
    } else {
      log(`⚠ No theme-color meta tag`, 'yellow');
    }

    // Test 8: Security Headers
    const securityHeaders = {
      'x-frame-options': headers['x-frame-options'],
      'x-content-type-options': headers['x-content-type-options'],
      'referrer-policy': headers['referrer-policy'],
      'permissions-policy': headers['permissions-policy'],
    };
    
    const foundHeaders = Object.entries(securityHeaders)
      .filter(([_, value]) => value)
      .map(([key]) => key);
    
    if (foundHeaders.length >= 3) {
      log(`✓ Security headers: ${foundHeaders.length}/4 found`, 'green');
    } else {
      log(`⚠ Security headers: Only ${foundHeaders.length}/4 found`, 'yellow');
    }

    return allPassed;
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    return false;
  }
}

async function testSitemap(url) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Testing: Sitemap`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
  
  try {
    const { status, body } = await fetch(`${url}/sitemap.xml`);
    
    if (status !== 200) {
      log(`✗ HTTP ${status}`, 'red');
      return false;
    }

    // Check if it's valid XML
    if (!body.includes('<?xml')) {
      log(`✗ Not valid XML`, 'red');
      return false;
    }

    // Count URLs
    const urlMatches = body.match(/<loc>(.*?)<\/loc>/g) || [];
    log(`✓ Sitemap contains ${urlMatches.length} URLs`, 'green');

    // Check for absolute URLs
    const relativeUrls = urlMatches.filter(match => {
      const url = match.replace(/<\/?loc>/g, '');
      return !url.startsWith('http');
    });

    if (relativeUrls.length > 0) {
      log(`✗ Found ${relativeUrls.length} relative URLs in sitemap`, 'red');
      return false;
    } else {
      log(`✓ All URLs are absolute`, 'green');
    }

    return true;
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    return false;
  }
}

async function testRobots(url) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Testing: Robots.txt`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
  
  try {
    const { status, body } = await fetch(`${url}/robots.txt`);
    
    if (status !== 200) {
      log(`✗ HTTP ${status}`, 'red');
      return false;
    }

    // Check for sitemap reference
    if (body.includes('Sitemap:')) {
      log(`✓ Contains sitemap reference`, 'green');
    } else {
      log(`⚠ No sitemap reference found`, 'yellow');
    }

    // Check for disallow rules
    if (body.includes('Disallow:')) {
      log(`✓ Contains disallow rules`, 'green');
    } else {
      log(`⚠ No disallow rules found`, 'yellow');
    }

    log(`\nRobots.txt content:`, 'blue');
    console.log(body);

    return true;
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`SEO Testing Tool - Infinity Store`, 'blue');
  log(`Testing: ${BASE_URL}`, 'blue');
  log(`${'='.repeat(60)}`, 'blue');

  const results = [];

  // Test homepage
  results.push(await testPage(`${BASE_URL}`, 'Homepage'));

  // Test sitemap
  results.push(await testSitemap(BASE_URL));

  // Test robots.txt
  results.push(await testRobots(BASE_URL));

  // Summary
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Summary`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  if (passed === total) {
    log(`✓ All tests passed (${passed}/${total})`, 'green');
  } else {
    log(`✗ Some tests failed (${passed}/${total} passed)`, 'red');
  }

  log(`\nFor more detailed testing, open: ${BASE_URL}/seo-test.html`, 'blue');
  log(`Or use the browser console script from SEO_TESTING_GUIDE.md`, 'blue');
}

main().catch(error => {
  log(`\n✗ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});



