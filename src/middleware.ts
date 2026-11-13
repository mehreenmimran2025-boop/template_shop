import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = 'ts_session';

async function readSession(token?: string) {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || 'dev-only-insecure-secret-change-me',
    );
    const { payload } = await jwtVerify(token, secret);
    return payload as { uid?: string; role?: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await readSession(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      if (session?.role === 'ADMIN') return NextResponse.redirect(new URL('/admin', req.url));
      return NextResponse.next();
    }
    if (!session) return NextResponse.redirect(new URL('/admin/login', req.url));
    if (session.role !== 'ADMIN') return NextResponse.redirect(new URL('/', req.url));
    return NextResponse.next();
  }

  if (pathname.startsWith('/library') || pathname.startsWith('/wishlist') || pathname.startsWith('/checkout')) {
    if (!session) {
      const url = new URL('/login', req.url);
      url.searchParams.set('next', pathname + search);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/library/:path*', '/wishlist/:path*', '/checkout/:path*'],
};
