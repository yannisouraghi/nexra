'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

// ============================================
// NEXRA LANDING PAGE - PREMIUM GAMER SAAS
// Liquid Glass / Apple-like Design
// ============================================

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'verify'>('login');
  const [isLoaded, setIsLoaded] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Skip first 2 seconds of video
  const handleVideoLoaded = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 2;
    }
  };

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 1.1]);
  const heroY = useTransform(scrollY, [0, 400], [0, 100]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // User is already logged in, redirect to dashboard
      // The dashboard will handle the Riot account check
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const handleGoogleSignIn = () => {
    // Redirect to dashboard - it will handle Riot account check
    signIn('google', { callbackUrl: '/dashboard' });
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {
      if (authMode === 'register') {
        if (password !== confirmPassword) {
          setAuthError('Passwords do not match');
          setAuthLoading(false);
          return;
        }

        if (password.length < 8) {
          setAuthError('Password must be at least 8 characters');
          setAuthLoading(false);
          return;
        }

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setAuthError(data.error || 'Registration failed');
          setAuthLoading(false);
          return;
        }

        // Check if verification is required
        if (data.requiresVerification) {
          setVerificationEmail(email);
          setAuthMode('verify');
          setAuthSuccess('Account created! Check your email for verification code.');
          setAuthLoading(false);
          return;
        }

        setAuthSuccess('Account created! Signing you in...');

        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setAuthError('Account created but login failed. Please try logging in.');
          setAuthMode('login');
          setAuthLoading(false);
          return;
        }

        router.push('/dashboard');
      } else {
        // Login - first check with backend for verification status
        const checkResponse = await fetch('/api/auth/check-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const checkData = await checkResponse.json();

        // Handle verification requirement
        if (checkData.requiresVerification) {
          setVerificationEmail(email);
          setAuthMode('verify');
          setAuthError('Please verify your email before signing in.');
          setAuthLoading(false);
          return;
        }

        // Handle other login errors
        if (!checkResponse.ok) {
          setAuthError(checkData.error || 'Invalid email or password');
          setAuthLoading(false);
          return;
        }

        // Backend validated, now sign in with NextAuth
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setAuthError('Invalid email or password');
          setAuthLoading(false);
          return;
        }

        router.push('/dashboard');
      }
    } catch {
      setAuthError('Something went wrong. Please try again.');
      setAuthLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.error || 'Invalid verification code');
        setAuthLoading(false);
        return;
      }

      setAuthSuccess('Email verified! Signing you in...');

      // Now sign in
      const result = await signIn('credentials', {
        email: verificationEmail,
        password,
        redirect: false,
      });

      if (result?.error) {
        setAuthSuccess('Email verified! Please sign in.');
        setAuthMode('login');
        setEmail(verificationEmail);
        setAuthLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      setAuthError('Verification failed. Please try again.');
      setAuthLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setAuthError('');
    setAuthLoading(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.error || 'Failed to resend code');
        setAuthLoading(false);
        return;
      }

      setAuthSuccess('New verification code sent!');
      setResendCooldown(60);
      setAuthLoading(false);
    } catch {
      setAuthError('Failed to resend code. Please try again.');
      setAuthLoading(false);
    }
  };

  const switchAuthMode = (mode: 'login' | 'register') => {
    if (authMode === 'verify' && mode !== 'login' && mode !== 'register') return;
    setAuthMode(mode);
    setAuthError('');
    setAuthSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="6"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
      ),
      title: "Death Analysis",
      description: "Every death dissected by AI to reveal what went wrong and how to prevent it.",
      color: "#ff4d6a"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      ),
      title: "Real-time Stats",
      description: "CS scores, vision control, damage breakdowns updated live during your session.",
      color: "#00d4ff"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
        </svg>
      ),
      title: "AI Coaching",
      description: "Personalized tips tailored to your champion pool, playstyle, and rank.",
      color: "#a855f7"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      ),
      title: "Progress Tracking",
      description: "Visualize your improvement over time with detailed analytics and graphs.",
      color: "#00ff88"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      ),
      title: "Timeline Analysis",
      description: "Deep dive into every moment of your game using Riot API Timeline data.",
      color: "#ffb800"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      title: "Matchup Intel",
      description: "Know your strongest and weakest matchups before the game even starts.",
      color: "#3b82f6"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Link Your Account",
      description: "Sign in and connect your Riot account. We'll automatically sync your match history.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      )
    },
    {
      number: "02",
      title: "Play Your Games",
      description: "Just play normally. Your match data is automatically available for analysis after each game.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="10 8 16 12 10 16 10 8"/>
        </svg>
      )
    },
    {
      number: "03",
      title: "AI Analyzes",
      description: "Our AI analyzes timeline data from the Riot API to identify mistakes, patterns, and areas for improvement.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
        </svg>
      )
    },
    {
      number: "04",
      title: "Climb The Ranks",
      description: "Apply personalized insights, fix recurring mistakes, and watch your rank rise game after game.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
      )
    }
  ];

  return (
    <div className="nexra-lp">
      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section ref={heroRef} className="nexra-hero">
        {/* Video Background - LoL Cinematic */}
        <motion.div
          className="nexra-hero-bg"
          style={{ scale: heroScale, y: heroY }}
        >
          {/* Video Background - Place your cinematic in /public/hero-cinematic.mp4 */}
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="nexra-hero-video"
            onLoadedMetadata={handleVideoLoaded}
          >
            <source src="/hero-cinematic.mp4" type="video/mp4" />
          </video>

          {/* Dark Overlay */}
          <div className="nexra-hero-overlay" />

          {/* Subtle Particles on top */}
          <div className="nexra-particles">
            <div className="nexra-particle" style={{ left: '15%', animationDelay: '0s' }} />
            <div className="nexra-particle" style={{ left: '35%', animationDelay: '1.5s' }} />
            <div className="nexra-particle" style={{ left: '55%', animationDelay: '3s' }} />
            <div className="nexra-particle" style={{ left: '75%', animationDelay: '4.5s' }} />
            <div className="nexra-particle" style={{ left: '25%', animationDelay: '2s' }} />
            <div className="nexra-particle" style={{ left: '65%', animationDelay: '3.5s' }} />
          </div>
        </motion.div>

        {/* Navigation */}
        <motion.nav
          className="nexra-nav"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link href="/" className="nexra-logo">
            <Image
              src="/nexra-logo.png"
              alt="Nexra"
              width={40}
              height={40}
              className="nexra-logo-img"
            />
            <span className="nexra-logo-text">NEXRA</span>
          </Link>

          <div className="nexra-nav-actions">
            <button
              onClick={() => { setAuthMode('login'); setIsAuthOpen(true); }}
              className="nexra-nav-btn nexra-nav-btn-ghost"
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('register'); setIsAuthOpen(true); }}
              className="nexra-nav-btn nexra-nav-btn-primary"
            >
              Get Started
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </motion.nav>

        {/* Hero Content */}
        <div className="nexra-hero-content">
          <motion.div
            className="nexra-hero-inner"
            initial="initial"
            animate={isLoaded ? "animate" : "initial"}
            variants={staggerContainer}
          >
            {/* Badge */}
            <motion.div
              className="nexra-badge"
              variants={fadeInUp}
            >
              <span className="nexra-badge-pulse" />
              <span className="nexra-badge-text">AI-Powered Coaching</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="nexra-headline"
              variants={fadeInUp}
            >
              Your Personal
              <br />
              <span className="nexra-headline-accent">League Coach</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              className="nexra-subheadline"
              variants={fadeInUp}
            >
              Advanced AI analyzes every game, identifies your mistakes,
              and delivers personalized coaching to help you climb.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="nexra-hero-ctas"
              variants={fadeInUp}
            >
              <button
                onClick={() => { setAuthMode('login'); setIsAuthOpen(true); }}
                className="nexra-cta nexra-cta-primary"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="nexra-cta-icon">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
              <button
                onClick={() => { setAuthMode('register'); setIsAuthOpen(true); }}
                className="nexra-cta nexra-cta-secondary"
              >
                <span>Create Account</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="nexra-hero-stats"
              variants={fadeInUp}
            >
              <div className="nexra-stat">
                <span className="nexra-stat-value">AI</span>
                <span className="nexra-stat-label">Powered Analysis</span>
              </div>
              <div className="nexra-stat-divider" />
              <div className="nexra-stat">
                <span className="nexra-stat-value">100+</span>
                <span className="nexra-stat-label">Error Types Detected</span>
              </div>
              <div className="nexra-stat-divider" />
              <div className="nexra-stat">
                <span className="nexra-stat-value">24/7</span>
                <span className="nexra-stat-label">Always Available</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="nexra-scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          style={{ opacity: heroOpacity }}
        >
          <span>Scroll to explore</span>
          <motion.div
            className="nexra-scroll-arrow"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ============================================
          FEATURES SECTION
          ============================================ */}
      <section className="nexra-section nexra-features-section">
        <div className="nexra-section-bg">
          <div className="nexra-section-glow nexra-section-glow-1" />
          <div className="nexra-section-glow nexra-section-glow-2" />
        </div>

        <div className="nexra-container">
          <motion.div
            className="nexra-section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="nexra-section-tag">Features</span>
            <h2 className="nexra-section-title">
              Everything you need to <span className="nexra-text-gradient">dominate</span>
            </h2>
            <p className="nexra-section-subtitle">
              Powerful AI tools designed specifically for League of Legends players who want to improve.
            </p>
          </motion.div>

          <div className="nexra-features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="nexra-feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                style={{ '--accent': feature.color } as React.CSSProperties}
              >
                <div className="nexra-feature-icon">
                  {feature.icon}
                </div>
                <h3 className="nexra-feature-title">{feature.title}</h3>
                <p className="nexra-feature-desc">{feature.description}</p>
                <div className="nexra-feature-glow" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          HOW IT WORKS SECTION
          ============================================ */}
      <section className="nexra-section nexra-steps-section">
        <div className="nexra-section-bg">
          <div className="nexra-grid-bg" />
        </div>

        <div className="nexra-container">
          <motion.div
            className="nexra-section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="nexra-section-tag">How It Works</span>
            <h2 className="nexra-section-title">
              Four steps to <span className="nexra-text-gradient">improvement</span>
            </h2>
          </motion.div>

          <div className="nexra-steps-timeline">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className="nexra-step"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                <div className="nexra-step-connector">
                  <div className="nexra-step-line" />
                  <motion.div
                    className="nexra-step-number"
                    whileHover={{ scale: 1.1 }}
                  >
                    {step.number}
                  </motion.div>
                </div>
                <div className="nexra-step-content">
                  <div className="nexra-step-icon">
                    {step.icon}
                  </div>
                  <h3 className="nexra-step-title">{step.title}</h3>
                  <p className="nexra-step-desc">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          FINAL CTA SECTION
          ============================================ */}
      <section className="nexra-section nexra-cta-section">
        <div className="nexra-cta-bg">
          <motion.div
            className="nexra-cta-orb nexra-cta-orb-1"
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="nexra-cta-orb nexra-cta-orb-2"
            animate={{
              x: [0, -30, 0],
              y: [0, 20, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="nexra-container">
          <motion.div
            className="nexra-cta-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="nexra-cta-title">Ready to climb?</h2>
            <p className="nexra-cta-desc">
              Join players who are using AI to improve their game.
              Start analyzing your matches today.
            </p>
            <motion.button
              onClick={() => { setAuthMode('register'); setIsAuthOpen(true); }}
              className="nexra-cta nexra-cta-final"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span>Start Free Now</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="nexra-footer">
        <div className="nexra-container">
          <div className="nexra-footer-content">
            <div className="nexra-footer-brand">
              <Link href="/" className="nexra-footer-logo">
                <svg viewBox="0 0 40 40" fill="none">
                  <path
                    d="M20 4L6 12v16l14 8 14-8V12L20 4z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                    opacity="0.4"
                  />
                  <circle cx="20" cy="20" r="3" fill="currentColor" opacity="0.4"/>
                </svg>
                <span>NEXRA</span>
              </Link>
              <p className="nexra-footer-disclaimer">
                Nexra is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games
                or anyone officially involved in producing or managing Riot Games properties.
                Riot Games and League of Legends are trademarks of Riot Games, Inc.
              </p>
            </div>
          </div>
          <div className="nexra-footer-bottom">
            <span>&copy; 2025 Nexra. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* ============================================
          AUTH MODAL
          ============================================ */}
      <AnimatePresence>
        {isAuthOpen && (
          <motion.div
            className="nexra-auth-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAuthOpen(false)}
          >
            <motion.div
              className="nexra-auth-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="nexra-auth-close"
                onClick={() => setIsAuthOpen(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>

              <div className="nexra-auth-header">
                <div className="nexra-auth-logo">
                  <svg viewBox="0 0 40 40" fill="none">
                    <defs>
                      <linearGradient id="authLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00f0ff" />
                        <stop offset="100%" stopColor="#0066ff" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M20 4L6 12v16l14 8 14-8V12L20 4z"
                      stroke="url(#authLogoGrad)"
                      strokeWidth="2"
                      fill="none"
                    />
                    <circle cx="20" cy="20" r="4" fill="url(#authLogoGrad)"/>
                  </svg>
                </div>
                <h2 className="nexra-auth-title">
                  {authMode === 'verify' ? 'Verify your email' : authMode === 'login' ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="nexra-auth-subtitle">
                  {authMode === 'verify'
                    ? `Enter the 6-digit code sent to ${verificationEmail}`
                    : authMode === 'login'
                    ? 'Sign in to access your dashboard'
                    : 'Start your journey to improvement'
                  }
                </p>
              </div>

              {/* Auth Tabs - hide during verification */}
              {authMode !== 'verify' && (
                <div className="nexra-auth-tabs">
                  <button
                    className={`nexra-auth-tab ${authMode === 'login' ? 'active' : ''}`}
                    onClick={() => switchAuthMode('login')}
                  >
                    Sign In
                  </button>
                  <button
                    className={`nexra-auth-tab ${authMode === 'register' ? 'active' : ''}`}
                    onClick={() => switchAuthMode('register')}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Error/Success Messages */}
              {authError && (
                <div className="nexra-auth-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {authError}
                </div>
              )}
              {authSuccess && (
                <div className="nexra-auth-success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {authSuccess}
                </div>
              )}

              {/* Verification Form */}
              {authMode === 'verify' ? (
                <form className="nexra-auth-form" onSubmit={handleVerifySubmit}>
                  <div className="nexra-auth-field">
                    <label>Verification Code</label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      required
                      maxLength={6}
                      disabled={authLoading}
                      className="!text-center !text-lg !tracking-[4px] !font-mono placeholder:!text-sm placeholder:!tracking-normal"
                    />
                  </div>
                  <button
                    type="submit"
                    className="nexra-auth-submit"
                    disabled={authLoading || verificationCode.length !== 6}
                    style={{ opacity: authLoading || verificationCode.length !== 6 ? 0.7 : 1 }}
                  >
                    {authLoading ? 'Verifying...' : 'Verify Email'}
                  </button>
                  <div className="flex flex-col items-center gap-2 mt-4">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0 || authLoading}
                      className="text-sm text-cyan-400 hover:text-cyan-300 disabled:text-white/40 disabled:cursor-not-allowed"
                    >
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't receive a code? Resend"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                      className="text-xs text-white/50 hover:text-white/70"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {/* Google Sign In */}
                  <button
                    onClick={handleGoogleSignIn}
                    className="nexra-auth-google"
                    disabled={authLoading}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <div className="nexra-auth-divider">
                    <span>or</span>
                  </div>

                  {/* Email Form */}
                  <form className="nexra-auth-form" onSubmit={handleCredentialsSubmit}>
                <div className="nexra-auth-field">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={authLoading}
                  />
                </div>
                <div className="nexra-auth-field">
                  <label>Password</label>
                  <div className="relative w-full">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={authMode === 'register' ? 'Min. 8 characters' : 'Enter your password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={authMode === 'register' ? 8 : undefined}
                      disabled={authLoading}
                                          />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-cyan-400 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {authMode === 'register' && (
                  <div className="nexra-auth-field">
                    <label>Confirm Password</label>
                    <div className="relative w-full">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={authLoading}
                                              />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-cyan-400 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}
                    <button
                      type="submit"
                      className="nexra-auth-submit"
                      disabled={authLoading}
                      style={{ opacity: authLoading ? 0.7 : 1 }}
                    >
                      {authLoading
                        ? (authMode === 'login' ? 'Signing in...' : 'Creating account...')
                        : (authMode === 'login' ? 'Sign In' : 'Create Account')
                      }
                    </button>
                  </form>
                </>
              )}

              <p className="nexra-auth-terms">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
