import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:jpg|jpeg|gif|png|webp|svg|ico)$).*)',
  ],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const rawHost = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const host = rawHost.split(':')[0].toLowerCase();
  const { pathname } = url;

  // Let API and internal routes pass through untouched
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // 1. Studio Subdomain: studio.ultrapie.com -> /studio
  if (host === 'studio.ultrapie.com' || host === 'studio.tajil.com' || host === 'studio.localhost') {
    if (pathname === '/') {
      url.pathname = '/studio';
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 2. Hosting Subdomain: hosting.ultrapie.com -> /hosting
  if (host === 'hosting.ultrapie.com' || host === 'hosting.tajil.com' || host === 'hosting.localhost') {
    if (pathname === '/') {
      url.pathname = '/hosting';
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 3. User Deployed Apps / Project Subdomains: <slug>.ultrapie.com -> /preview/<slug>
  const apexDomains = ['ultrapie.com', 'tajil.com'];
  for (const apex of apexDomains) {
    if (host.endsWith(`.${apex}`)) {
      const subdomain = host.replace(`.${apex}`, '');
      // Exclude system subdomains
      if (!['www', 'studio', 'hosting', 'media', 'assets', 'api', 'admin', 'status', 'coolify'].includes(subdomain)) {
        if (pathname === '/') {
          url.pathname = `/preview/${subdomain}`;
          return NextResponse.rewrite(url);
        }
      }
    }
  }

  return NextResponse.next();
}
