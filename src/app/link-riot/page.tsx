'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { NEXRA_API_URL } from '@/config/api';

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

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.id) {
      setCheckingAccount(false);
      return;
    }

    const justUnlinked = localStorage.getItem('nexra_riot_unlinked');
    if (justUnlinked) {
      localStorage.removeItem('nexra_riot_unlinked');
      localStorage.removeItem('nexra_riot_account');
      setCheckingAccount(false);
      return;
    }

    const checkRiotAccount = async () => {
      try {
        const userId = session.user.id;
        const userEmail = (session.user as any).email;
        const userName = (session.user as any).name;
        const userImage = (session.user as any).image;

        const response = await fetch(`${NEXRA_API_URL}/users/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: userId, email: userEmail, name: userName, image: userImage }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user?.riot_game_name && data.user?.riot_tag_line) {
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

    const userId = session?.user?.id;
    if (!userId) {
      setError('Session expired. Please sign in again.');
      setIsLoading(false);
      return;
    }

    try {
      const validateResponse = await fetch(
        `/api/riot/summoner?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}&region=${region}`
      );

      if (!validateResponse.ok) {
        const data = await validateResponse.json();
        throw new Error(data.error || 'Account not found');
      }

      const summonerData = await validateResponse.json();
      const userEmail = (session?.user as { email?: string })?.email;

      const linkResponse = await fetch(`${NEXRA_API_URL}/users/${userId}/link-riot`, {
        method: 'POST',
        headers: getAuthHeaders(userId, userEmail),
        body: JSON.stringify({ puuid: summonerData.puuid, gameName, tagLine, region }),
      });

      const linkData = await linkResponse.json();
      if (!linkResponse.ok) throw new Error(linkData.error || 'Failed to link account');

      await fetch(`${NEXRA_API_URL}/users/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          email: userEmail,
          name: (session?.user as any)?.name,
          image: (session?.user as any)?.image,
        }),
      });

      localStorage.setItem('nexra_riot_account', JSON.stringify({
        gameName, tagLine, region,
        puuid: summonerData.puuid,
        profileIconId: summonerData.profileIconId,
        userId,
      }));

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

  if (status === 'loading' || checkingAccount) {
    return (
      <div className="nexra-link-page">
        <div className="nexra-link-bg" />
        <div className="nexra-link-container">
          <div className="nexra-link-card">
            <div className="nexra-link-card-glow" />
            <div className="nexra-link-card-border" />
            <div className="nexra-glass-card-noise" />
            <div className="nexra-link-card-inner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', gap: '1rem' }}>
              <div className="nexra-link-spinner" />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', fontFamily: 'Outfit, sans-serif' }}>Checking account...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nexra-link-page">
      <div className="nexra-link-bg" />

      <div className="nexra-link-container">
        {/* Logo */}
        <Link href="/" className="nexra-link-logo">
          <Image src="/nexra-logo.png" alt="Nexra" width={36} height={36} className="nexra-link-logo-img" />
          <span className="nexra-link-logo-text">NEXRA</span>
        </Link>

        {/* Card */}
        <div className="nexra-link-card">
          <div className="nexra-link-card-glow" />
          <div className="nexra-link-card-border" />
          <div className="nexra-glass-card-noise" />

          <div className="nexra-link-card-inner">
            {/* User info bar */}
            {session?.user && (
              <div className="nexra-link-user">
                <div className="nexra-link-user-info">
                  {session.user.image && (
                    <img src={session.user.image} alt="" className="nexra-link-user-avatar" />
                  )}
                  <span className="nexra-link-user-email">{session.user.email}</span>
                </div>
                <button onClick={handleSignOut} className="nexra-link-signout" title="Sign out">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </button>
              </div>
            )}

            {/* Header */}
            <div className="nexra-link-header">
              <div className="nexra-link-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </div>
              <h1 className="nexra-link-title">Link your Riot Account</h1>
              <p className="nexra-link-subtitle">Enter your Riot ID to connect your League of Legends account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="nexra-link-form">
              <div className="nexra-link-field">
                <label>Riot ID</label>
                <div className="nexra-link-riot-row">
                  <div className="nexra-auth-input-wrap nexra-link-riot-name">
                    <svg className="nexra-auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <input type="text" value={gameName} onChange={(e) => setGameName(e.target.value)} placeholder="GameName" required />
                  </div>
                  <span className="nexra-link-riot-hash">#</span>
                  <div className="nexra-auth-input-wrap nexra-link-riot-tag">
                    <input type="text" value={tagLine} onChange={(e) => setTagLine(e.target.value.toUpperCase())} placeholder="TAG" maxLength={5} required style={{ paddingLeft: '0.875rem' }} />
                  </div>
                </div>
              </div>

              <div className="nexra-link-field">
                <label>Region</label>
                <select value={region} onChange={(e) => setRegion(e.target.value)} className="nexra-link-select">
                  {REGIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="nexra-link-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={isLoading || !gameName || !tagLine} className="nexra-auth-submit" style={{ marginTop: '0.5rem' }}>
                <span className="nexra-auth-submit-text">
                  {isLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      <span className="nexra-link-spinner-sm" />
                      Verifying...
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                      </svg>
                      Link Account
                    </span>
                  )}
                </span>
              </button>
            </form>

            {/* Tip */}
            <div className="nexra-link-tip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 16, height: 16, flexShrink: 0, color: 'rgba(0,220,255,0.5)' }}>
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
              </svg>
              <span>Find your Riot ID in the League client or at account.riotgames.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
