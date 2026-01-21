import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard');
  const isOnLinkRiot = req.nextUrl.pathname === '/link-riot';

  // If trying to access dashboard without being logged in
  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // If trying to access link-riot without being logged in
  if (isOnLinkRiot && !isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/link-riot'],
};
