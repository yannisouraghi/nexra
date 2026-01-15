import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard');
  const isOnLinkRiot = req.nextUrl.pathname === '/link-riot';
  const isOnLogin = req.nextUrl.pathname === '/login';

  // If trying to access dashboard without being logged in
  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If trying to access link-riot without being logged in
  if (isOnLinkRiot && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If logged in and trying to access login page, redirect to dashboard
  // The dashboard page will handle redirect to link-riot if needed
  if (isOnLogin && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/link-riot', '/login'],
};
