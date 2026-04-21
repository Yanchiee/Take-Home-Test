import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, verifyAdminCookie } from './lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPath = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isAdminApi = pathname.startsWith('/api/admin') && pathname !== '/api/admin/login';

  if (!isAdminPath && !isAdminApi) return NextResponse.next();

  const cookie = req.cookies.get(COOKIE_NAME)?.value ?? '';
  const secret = process.env.ADMIN_COOKIE_SECRET ?? '';
  if (!(await verifyAdminCookie(cookie, secret))) {
    if (isAdminApi) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const loginUrl = new URL('/admin/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
