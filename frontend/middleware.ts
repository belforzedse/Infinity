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
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/fonts/')
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }

  // Cache control for API routes (shorter cache)
  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
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
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

