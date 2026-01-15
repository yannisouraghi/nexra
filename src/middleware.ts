import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const hasRiotAccount = !!(req.auth as any)?.user?.riotPuuid || !!(req.auth as any)?.riotPuuid;
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard');
  const isOnLinkRiot = req.nextUrl.pathname === '/link-riot';
  const isOnLogin = req.nextUrl.pathname === '/login';
  const isOnHome = req.nextUrl.pathname === '/';

  // If trying to access dashboard without being logged in
  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If trying to access dashboard without a Riot account linked
  if (isOnDashboard && isLoggedIn && !hasRiotAccount) {
    return NextResponse.redirect(new URL('/link-riot', req.url));
  }

  // If trying to access link-riot without being logged in
  if (isOnLinkRiot && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If on link-riot but already has a Riot account, go to dashboard
  if (isOnLinkRiot && isLoggedIn && hasRiotAccount) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If logged in and trying to access login page
  if (isOnLogin && isLoggedIn) {
    // Redirect to dashboard if has Riot account, otherwise to link-riot
    if (hasRiotAccount) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.redirect(new URL('/link-riot', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/link-riot', '/login'],
};
