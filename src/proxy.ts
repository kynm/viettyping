import { NextResponse } from 'next/server';

export function proxy() {
  // Server handlers/layouts validate sessions. An expired cookie must not block login.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets).*)'],
};
