import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security headers for SEO and performance
  const response = NextResponse.next();

  // Add security and performance headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy (formerly Feature-Policy) - safe security improvement
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Cache control for static assets
  // Note: /_next/static and /api/ are excluded by matcher, so cache-control for those paths is handled by Next.js
  if (
    pathname.startsWith('/images/') ||
    pathname.startsWith('/fonts/')
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }

  // Handle trailing slashes - redirect to non-trailing slash for SEO
  if (pathname !== '/' && pathname.endsWith('/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url, 301);
  }

  // Redirect www to non-www (or vice versa) if needed
  // Uncomment and adjust if you have a preference
  // const hostname = request.headers.get('host') || '';
  // if (hostname.startsWith('www.')) {
  //   const url = request.nextUrl.clone();
  //   url.hostname = hostname.replace('www.', '');
  //   return NextResponse.redirect(url, 301);
  // }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - excluded because Next.js handles API route caching
     * - _next/static (static files) - excluded because Next.js handles static file caching
     * - _next/image (image optimization files) - excluded for performance
     * - favicon.ico (favicon file) - excluded for performance
     *
     * Cache-control headers for excluded paths are handled by Next.js automatically.
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

