'use client';

import { useState, Suspense, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AnimatedBackground from '@/components/AnimatedBackground';

type AuthMode = 'login' | 'register';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl });
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'register') {
        // Validation
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        if (password.length < 8) {
          setError('Password must be at least 8 characters');
          setLoading(false);
          return;
        }

        // Register
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Registration failed');
          setLoading(false);
          return;
        }

        setSuccess('Account created! Signing you in...');

        // Auto sign in after registration
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError('Account created but login failed. Please try logging in.');
          setMode('login');
          setLoading(false);
          return;
        }

        router.push(callbackUrl);
      } else {
        // Login
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError('Invalid email or password');
          setLoading(false);
          return;
        }

        router.push(callbackUrl);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
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

        {/* Auth Card */}
        <div className="auth-card" style={{ maxWidth: '420px' }}>
          <div className="auth-card-glow"></div>

          {/* Mode Tabs */}
          <div style={styles.tabs}>
            <button
              onClick={() => switchMode('login')}
              style={{
                ...styles.tab,
                ...(mode === 'login' ? styles.tabActive : {}),
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode('register')}
              style={{
                ...styles.tab,
                ...(mode === 'register' ? styles.tabActive : {}),
              }}
            >
              Create Account
            </button>
          </div>

          <div className="auth-header" style={{ marginTop: '1.5rem' }}>
            <h1 className="auth-title">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="auth-subtitle">
              {mode === 'login'
                ? 'Sign in to access your dashboard'
                : 'Join Nexra to improve your gameplay'}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div style={styles.errorBox}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div style={styles.successBox}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleCredentialsSubmit} style={styles.form}>
            {mode === 'register' && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Name (optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  style={styles.input}
                />
              </div>
            )}

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Min. 8 characters' : 'Your password'}
                required
                minLength={mode === 'register' ? 8 : undefined}
                style={styles.input}
              />
            </div>

            {mode === 'register' && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  style={styles.input}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <div style={styles.spinner}></div>
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={styles.divider}>
            <span style={styles.dividerLine}></span>
            <span style={styles.dividerText}>or</span>
            <span style={styles.dividerLine}></span>
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

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  tabs: {
    display: 'flex',
    gap: '4px',
    padding: '4px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    marginBottom: '0.5rem',
  },
  tab: {
    flex: 1,
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.6)',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    color: '#00d4ff',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '1.5rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.7)',
  },
  input: {
    padding: '12px 16px',
    fontSize: '15px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: 'white',
    outline: 'none',
    transition: 'all 0.2s',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 24px',
    fontSize: '15px',
    fontWeight: 600,
    color: 'white',
    background: 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '8px',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    margin: '24px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    border: '1px solid rgba(255, 51, 102, 0.3)',
    borderRadius: '10px',
    color: '#ff3366',
    fontSize: '14px',
    marginTop: '1rem',
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    border: '1px solid rgba(0, 255, 136, 0.3)',
    borderRadius: '10px',
    color: '#00ff88',
    fontSize: '14px',
    marginTop: '1rem',
  },
};

function LoginLoader() {
  return (
    <div className="auth-page">
      <AnimatedBackground />
      <div className="auth-container">
        <div className="auth-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="auth-card-glow"></div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid rgba(0, 212, 255, 0.2)',
              borderTopColor: '#00d4ff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoader />}>
      <LoginContent />
    </Suspense>
  );
}
