'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import AnimatedBackground from '@/components/AnimatedBackground';
import Link from 'next/link';

const REGIONS = [
  { value: 'euw1', label: 'Europe West (EUW)' },
  { value: 'eun1', label: 'Europe Nordic & East (EUNE)' },
  { value: 'na1', label: 'North America (NA)' },
  { value: 'kr', label: 'Korea (KR)' },
  { value: 'br1', label: 'Brazil (BR)' },
  { value: 'la1', label: 'Latin America North (LAN)' },
  { value: 'la2', label: 'Latin America South (LAS)' },
  { value: 'oc1', label: 'Oceania (OCE)' },
  { value: 'ru', label: 'Russia (RU)' },
  { value: 'tr1', label: 'Turkey (TR)' },
  { value: 'jp1', label: 'Japan (JP)' },
  { value: 'ph2', label: 'Philippines (PH)' },
  { value: 'sg2', label: 'Singapore (SG)' },
  { value: 'th2', label: 'Thailand (TH)' },
  { value: 'tw2', label: 'Taiwan (TW)' },
  { value: 'vn2', label: 'Vietnam (VN)' },
];

const NEXRA_API_URL = process.env.NEXT_PUBLIC_NEXRA_API_URL || 'https://nexra-api.nexra-api.workers.dev';

// Generate auth header from session
function getAuthHeaders(userId?: string, email?: string): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (userId && email) {
    headers['Authorization'] = `Bearer ${userId}:${email}`;
  }
  return headers;
}

export default function LinkRiotPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [region, setRegion] = useState('euw1');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAccount, setCheckingAccount] = useState(true);
  const [error, setError] = useState('');

  // Check if user already has a linked Riot account by fetching from database
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.id) {
      setCheckingAccount(false);
      return;
    }

    // Check if user just unlinked their account - don't redirect
    const justUnlinked = localStorage.getItem('nexra_riot_unlinked');
    if (justUnlinked) {
      localStorage.removeItem('nexra_riot_unlinked');
      localStorage.removeItem('nexra_riot_account');
      setCheckingAccount(false);
      return;
    }

    // Use /users/auth to sync user and check for Riot account
    // This endpoint creates the user if they don't exist and returns their data
    const checkRiotAccount = async () => {
      try {
        const userId = session.user.id;
        const userEmail = (session.user as any).email;
        const userName = (session.user as any).name;
        const userImage = (session.user as any).image;

        console.log('Syncing user and checking Riot account for:', userId, userEmail);

        // Call /users/auth which creates user if not exists and returns their data
        const response = await fetch(`${NEXRA_API_URL}/users/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: userId,
            email: userEmail,
            name: userName,
            image: userImage,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('User data from /users/auth:', data);

          // Check if user has Riot account (fields are snake_case from DB)
          if (data.success && data.user?.riot_game_name && data.user?.riot_tag_line) {
            console.log('User has Riot account, redirecting to dashboard');
            const accountData = {
              gameName: data.user.riot_game_name,
              tagLine: data.user.riot_tag_line,
              region: data.user.riot_region || 'euw1',
              puuid: data.user.riot_puuid,
              userId: userId,
            };
            localStorage.setItem('nexra_riot_account', JSON.stringify(accountData));
            router.push('/dashboard');
            return;
          }
        }

        // No Riot account found - stay on this page
        console.log('No Riot account found, staying on link page');
        localStorage.removeItem('nexra_riot_account');
        setCheckingAccount(false);
      } catch (err) {
        console.error('Error checking Riot account:', err);
        setCheckingAccount(false);
      }
    };

    checkRiotAccount();
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Check if we have a user session
    const userId = session?.user?.id;
    if (!userId) {
      setError('Session expired. Please sign in again.');
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Validate the Riot account exists via Riot API
      console.log('Validating Riot account...', { gameName, tagLine, region });
      const validateResponse = await fetch(
        `/api/riot/summoner?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}&region=${region}`
      );

      if (!validateResponse.ok) {
        const data = await validateResponse.json();
        throw new Error(data.error || 'Account not found');
      }

      const summonerData = await validateResponse.json();
      console.log('Riot account validated:', summonerData.puuid);

      // Step 2: Link the Riot account to the user in the database
      console.log('Linking to user:', userId);
      const userEmail = (session?.user as { email?: string })?.email;
      const linkResponse = await fetch(`${NEXRA_API_URL}/users/${userId}/link-riot`, {
        method: 'POST',
        headers: getAuthHeaders(userId, userEmail),
        body: JSON.stringify({
          puuid: summonerData.puuid,
          gameName,
          tagLine,
          region,
        }),
      });

      if (!linkResponse.ok) {
        const linkData = await linkResponse.json();
        throw new Error(linkData.error || 'Failed to link account');
      }
      console.log('Account linked successfully');

      // Step 3: Store in localStorage as backup (with userId for verification)
      localStorage.setItem('nexra_riot_account', JSON.stringify({
        gameName,
        tagLine,
        region,
        puuid: summonerData.puuid,
        profileIconId: summonerData.profileIconId,
        userId, // Store user ID to verify ownership on next load
      }));

      // Step 4: Redirect to dashboard
      console.log('Redirecting to dashboard...');
      const redirectUrl = `/dashboard?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}&region=${region}`;
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('Link account error:', err);
      setError(err instanceof Error ? err.message : 'Failed to link account');
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('nexra_riot_account');
    signOut({ callbackUrl: '/' });
  };

  // Show loading while checking session or checking for Riot account
  if (status === 'loading' || checkingAccount) {
    return (
      <div className="auth-page">
        <AnimatedBackground />
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-card-glow"></div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem' }}>
              <span className="auth-spinner" style={{ width: '2rem', height: '2rem' }}></span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Checking account...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <AnimatedBackground />

      <div className="auth-container">
        {/* Logo */}
        <Link href="/" className="auth-logo">
          <div className="auth-logo-mark">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M16 2L4 9v14l12 7 12-7V9L16 2z" stroke="url(#linkLogoGradient)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
              <path d="M16 16L6 10M16 16l10-6M16 16v12" stroke="url(#linkLogoGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <circle cx="16" cy="16" r="3" fill="url(#linkLogoGradient)"/>
              <defs>
                <linearGradient id="linkLogoGradient" x1="4" y1="2" x2="28" y2="30">
                  <stop stopColor="#00ffff"/>
                  <stop offset="1" stopColor="#0066ff"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="auth-logo-text">NEXRA</span>
        </Link>

        {/* Card */}
        <div className="auth-card">
          <div className="auth-card-glow"></div>

          {/* User Info */}
          {session?.user && (
            <div className="auth-user-info">
              <div className="auth-user-details">
                {session.user.image && (
                  <img src={session.user.image} alt="" className="auth-user-avatar" />
                )}
                <span className="auth-user-email">{session.user.email}</span>
              </div>
              <button onClick={handleSignOut} className="auth-signout" title="Sign out">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          )}

          {/* Header */}
          <div className="auth-header">
            <div className="auth-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="6" width="20" height="12" rx="2"/>
                <circle cx="12" cy="12" r="3"/>
                <path d="M6 12h.01M18 12h.01"/>
              </svg>
            </div>
            <h1 className="auth-title">Link Your Riot Account</h1>
            <p className="auth-subtitle">Enter your Riot ID to connect your League account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Riot ID</label>
              <div className="auth-input-row">
                <input
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="GameName"
                  className="auth-input"
                  required
                />
                <span className="auth-input-divider">#</span>
                <input
                  type="text"
                  value={tagLine}
                  onChange={(e) => setTagLine(e.target.value.toUpperCase())}
                  placeholder="TAG"
                  className="auth-input auth-input-tag"
                  maxLength={5}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="auth-select"
              >
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="auth-error">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading || !gameName || !tagLine}
              className="auth-submit"
            >
              <span className="auth-submit-bg"></span>
              <span className="auth-submit-content">
                {isLoading ? (
                  <>
                    <span className="auth-spinner"></span>
                    Verifying...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    Link Account
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Tip */}
          <div className="auth-tip">
            <span className="auth-tip-label">Tip:</span>
            <span className="auth-tip-text">
              Your Riot ID can be found in the League client or on your Riot Games account page.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
