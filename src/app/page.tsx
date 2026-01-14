'use client';

import { useRouter } from 'next/navigation';
import RiotAccountLink from '@/components/RiotAccountLink';
import AnimatedBackground from '@/components/AnimatedBackground';

export default function Home() {
  const router = useRouter();

  const handleLink = (account: { gameName: string; tagLine: string; region: string }) => {
    const params = new URLSearchParams({
      gameName: account.gameName,
      tagLine: account.tagLine,
      region: account.region,
    });
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="nexra-landing">
      {/* Multi-Layer Animated Background */}
      <AnimatedBackground />

      {/* Glass Navigation */}
      <nav className="glass-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <div className="logo-crystal">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 4L6 10v12l10 6 10-6V10L16 4z" stroke="url(#logo-gradient)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
                <path d="M16 16L8 11.5M16 16l8-4.5M16 16v10" stroke="url(#logo-gradient)" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="16" cy="16" r="2" fill="url(#logo-gradient)"/>
                <defs>
                  <linearGradient id="logo-gradient" x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#00d4ff"/>
                    <stop offset="100%" stopColor="#00fff2"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="logo-text">NEXRA</span>
          </div>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="landing-main">
        <div className="content-wrapper">
          {/* Hero Section */}
          <div className="hero-block">
            <div className="status-badge">
              <span className="status-dot" />
              <span className="status-text">REAL-TIME ANALYTICS</span>
            </div>

            <h1 className="hero-heading">
              Elevate Your
              <span className="hero-gradient-text">Game</span>
            </h1>

            <p className="hero-description">
              Advanced performance tracking for League of Legends.<br />
              Analyze. Optimize. Dominate.
            </p>
          </div>

          {/* Connection Interface */}
          <div className="connection-interface">
            <RiotAccountLink onLink={handleLink} />
          </div>

          {/* Feature Indicators */}
          <div className="feature-row">
            <div className="feature-chip">
              <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Live Stats</span>
            </div>
            <div className="feature-chip">
              <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Win Tracking</span>
            </div>
            <div className="feature-chip">
              <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Match History</span>
            </div>
          </div>
        </div>
      </main>

      {/* Animated Bottom Accent */}
      <div className="bottom-accent">
        <div className="accent-line" />
      </div>
    </div>
  );
}
