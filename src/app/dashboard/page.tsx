'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import RecentGames from '@/components/RecentGames';
import AnimatedBackground from '@/components/AnimatedBackground';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [riotAccount, setRiotAccount] = useState<{
    gameName: string;
    tagLine: string;
    region: string;
  } | null>(null);

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') return;

    // If not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // Priority 1: Check URL params FIRST (after linking redirect)
    const gameName = searchParams.get('gameName');
    const tagLine = searchParams.get('tagLine');
    const region = searchParams.get('region') || 'euw1';

    if (gameName && tagLine) {
      const accountData = { gameName, tagLine, region };
      localStorage.setItem('nexra_riot_account', JSON.stringify(accountData));
      setRiotAccount(accountData);
      return;
    }

    // Priority 2: Check localStorage (persisted from previous session)
    const saved = localStorage.getItem('nexra_riot_account');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.gameName && parsed.tagLine) {
          setRiotAccount(parsed);
          return;
        }
      } catch (e) {
        console.error('Failed to parse saved riot account:', e);
      }
    }

    // Priority 3: Check session for Riot account (from database)
    const user = session?.user as any;
    if (user?.riotGameName && user?.riotTagLine) {
      const accountData = {
        gameName: user.riotGameName,
        tagLine: user.riotTagLine,
        region: user.riotRegion || 'euw1',
      };
      localStorage.setItem('nexra_riot_account', JSON.stringify(accountData));
      setRiotAccount(accountData);
      return;
    }

    // No account found anywhere, redirect to link-riot page
    router.push('/link-riot');
  }, [searchParams, router, status, session]);

  // Show loading while checking session
  if (status === 'loading' || !riotAccount) {
    return (
      <div className="dashboard-page">
        <AnimatedBackground />
        <div className="relative z-10 flex justify-center items-center" style={{ minHeight: '100vh' }}>
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="flex flex-col items-center" style={{ gap: '1.25rem' }}>
              {/* Animated loader */}
              <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    border: '3px solid rgba(0, 212, 255, 0.1)',
                    borderTopColor: 'rgba(0, 212, 255, 0.8)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: '6px',
                    border: '3px solid rgba(0, 102, 255, 0.1)',
                    borderTopColor: 'rgba(0, 102, 255, 0.6)',
                    borderRadius: '50%',
                    animation: 'spin 1.5s linear infinite reverse',
                  }}
                />
              </div>
              <div>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500', marginBottom: '0.25rem' }}>
                  Loading Dashboard
                </p>
                <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.875rem' }}>
                  Fetching your data...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <RecentGames riotAccount={riotAccount} />;
}

function DashboardLoader() {
  return (
    <div className="dashboard-page">
      <AnimatedBackground />
      <div className="relative z-10 flex justify-center items-center" style={{ minHeight: '100vh' }}>
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="flex flex-col items-center" style={{ gap: '1.25rem' }}>
            <div style={{ position: 'relative', width: '48px', height: '48px' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  border: '3px solid rgba(0, 212, 255, 0.1)',
                  borderTopColor: 'rgba(0, 212, 255, 0.8)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: '6px',
                  border: '3px solid rgba(0, 102, 255, 0.1)',
                  borderTopColor: 'rgba(0, 102, 255, 0.6)',
                  borderRadius: '50%',
                  animation: 'spin 1.5s linear infinite reverse',
                }}
              />
            </div>
            <div>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500', marginBottom: '0.25rem' }}>
                Loading Dashboard
              </p>
              <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.875rem' }}>
                Preparing your experience...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoader />}>
      <DashboardContent />
    </Suspense>
  );
}
