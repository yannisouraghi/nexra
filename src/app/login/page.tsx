'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import AnimatedBackground from '@/components/AnimatedBackground';

export default function LoginPage() {
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/link-riot' });
  };

  return (
    <div className="auth-page">
      <AnimatedBackground />

      <div className="auth-container">
        {/* Logo */}
        <Link href="/" className="auth-logo">
          <div className="auth-logo-mark">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M16 2L4 9v14l12 7 12-7V9L16 2z" stroke="url(#authLogoGradient)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
              <path d="M16 16L6 10M16 16l10-6M16 16v12" stroke="url(#authLogoGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <circle cx="16" cy="16" r="3" fill="url(#authLogoGradient)"/>
              <defs>
                <linearGradient id="authLogoGradient" x1="4" y1="2" x2="28" y2="30">
                  <stop stopColor="#00ffff"/>
                  <stop offset="1" stopColor="#0066ff"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="auth-logo-text">NEXRA</span>
        </Link>

        {/* Login Card */}
        <div className="auth-card">
          <div className="auth-card-glow"></div>

          <div className="auth-header">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to access your dashboard</p>
          </div>

          {/* Google Sign In Button */}
          <button onClick={handleGoogleSignIn} className="auth-google-btn">
            <span className="auth-google-bg"></span>
            <span className="auth-google-content">
              <svg viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </span>
          </button>

          {/* Terms */}
          <p className="auth-terms">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Back to Home */}
        <Link href="/" className="auth-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
