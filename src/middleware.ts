import { NextResponse } from 'next/server';
export function middleware() {
  // Cookie presence alone cannot establish a valid session. Keep login accessible
  // when a cookie is expired; server handlers/layouts enforce actual authorization.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets).*)'],
};
