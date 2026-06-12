import { NextRequest, NextResponse } from 'next/server';
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = pathname === '/login' || pathname.startsWith('/api/auth/');
  const hasSession = request.cookies.has('viettyping_session');

  if (!hasSession && !isPublic && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (hasSession && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets).*)'],
};
