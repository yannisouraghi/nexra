'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import RecentGames from '@/components/RecentGames';
import AnimatedBackground from '@/components/AnimatedBackground';
import OnboardingModal from '@/components/OnboardingModal';
import MobileNotAvailable from '@/components/MobileNotAvailable';
import { NEXRA_API_URL } from '@/config/api';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [riotAccount, setRiotAccount] = useState<{
    gameName: string;
    tagLine: string;
    region: string;
  } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') return;

    // If not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const user = session?.user as any;
    const currentUserId = user?.id;

    if (!currentUserId) {
      setIsLoading(false);
      return;
    }

    // First, clean up any stale localStorage data from a different user
    const saved = localStorage.getItem('nexra_riot_account');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.userId && parsed.userId !== currentUserId) {
          localStorage.removeItem('nexra_riot_account');
        }
      } catch (e) {
        localStorage.removeItem('nexra_riot_account');
      }
    }

    // Priority 1: Check URL params FIRST (after linking redirect)
    const gameName = searchParams.get('gameName');
    const tagLine = searchParams.get('tagLine');
    const region = searchParams.get('region') || 'euw1';

    if (gameName && tagLine) {
      const accountData = { gameName, tagLine, region, userId: currentUserId };
      localStorage.setItem('nexra_riot_account', JSON.stringify(accountData));
      setRiotAccount(accountData);
      setIsLoading(false);
      return;
    }

    // Priority 2: Sync user with backend and get their data (SOURCE OF TRUTH)
    // Uses /users/auth which creates user if not exists
    const fetchUserData = async () => {
      try {
        const userEmail = (user as any).email;
        const userName = (user as any).name;
        const userImage = (user as any).image;

        const response = await fetch(`${NEXRA_API_URL}/users/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: currentUserId,
            email: userEmail,
            name: userName,
            image: userImage,
          }),
        });

        if (response.ok) {
          const data = await response.json();

          // Check for Riot account (fields are snake_case from DB)
          if (data.success && data.user?.riot_game_name && data.user?.riot_tag_line) {
            const accountData = {
              gameName: data.user.riot_game_name,
              tagLine: data.user.riot_tag_line,
              region: data.user.riot_region || 'euw1',
              userId: currentUserId,
            };
            localStorage.setItem('nexra_riot_account', JSON.stringify(accountData));
            setRiotAccount(accountData);
            setIsLoading(false);
            return;
          }
        }

        // Priority 3: Check localStorage (backup/cache)
        const savedAfterCleanup = localStorage.getItem('nexra_riot_account');
        if (savedAfterCleanup) {
          try {
            const parsed = JSON.parse(savedAfterCleanup);
            if (parsed.gameName && parsed.tagLine && (!parsed.userId || parsed.userId === currentUserId)) {
              setRiotAccount(parsed);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.error('Failed to parse saved riot account:', e);
          }
        }

        // No account found anywhere, redirect to link-riot page
        router.push('/link-riot');
      } catch (err) {
        console.error('Error fetching user data:', err);
        // On error, try localStorage as fallback
        const savedAfterCleanup = localStorage.getItem('nexra_riot_account');
        if (savedAfterCleanup) {
          try {
            const parsed = JSON.parse(savedAfterCleanup);
            if (parsed.gameName && parsed.tagLine) {
              setRiotAccount(parsed);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.error('Failed to parse saved riot account:', e);
          }
        }
        router.push('/link-riot');
      }
    };

    fetchUserData();
  }, [searchParams, router, status, session]);

  // Check if user needs onboarding (first-time user)
  useEffect(() => {
    if (!riotAccount) return;

    // Check if onboarding has been completed
    const onboardingCompleted = localStorage.getItem('nexra_onboarding_completed');
    if (!onboardingCompleted) {
      // First-time user, show onboarding
      setShowOnboarding(true);
    }
  }, [riotAccount]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

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

  return (
    <>
      <RecentGames riotAccount={riotAccount} />
      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}
      <MobileNotAvailable
        gameName={riotAccount.gameName}
        tagLine={riotAccount.tagLine}
      />
    </>
  );
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
