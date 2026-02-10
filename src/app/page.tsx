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
  const stepsRef = useRef<HTMLDivElement>(null);

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

  // Timeline scroll-driven fill
  const { scrollYProgress: stepsProgress } = useScroll({
    target: stepsRef,
    offset: ["start 0.8", "end 0.45"]
  });

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

  // ---- Parallax transforms ----
  const parallaxSlow = useTransform(scrollY, [0, 1000], [0, -80]);
  const parallaxMed = useTransform(scrollY, [0, 1000], [0, -160]);

  // ---- Animation variants ----
  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2
      }
    }
  };

  const scaleIn = {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] }
  };

  // ---- Cursor glow for glass cards ----
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
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
        {/* Video Background */}
        <motion.div
          className="nexra-hero-bg"
          style={{ scale: heroScale, y: heroY }}
        >
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
          <div className="nexra-hero-overlay" />
          <div className="nexra-hero-noise" />
        </motion.div>

        {/* Navigation */}
        <motion.nav
          className="nexra-nav"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link href="/" className="nexra-logo">
            <Image src="/nexra-logo.png" alt="Nexra" width={32} height={32} className="nexra-logo-img" />
            <span className="nexra-logo-text">NEXRA</span>
          </Link>
          <div className="nexra-nav-actions">
            <button onClick={() => { setAuthMode('login'); setIsAuthOpen(true); }} className="nexra-nav-btn nexra-nav-btn-ghost">
              Sign In
            </button>
            <motion.button
              onClick={() => { setAuthMode('register'); setIsAuthOpen(true); }}
              className="nexra-nav-btn nexra-nav-btn-primary"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </motion.button>
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
            <motion.div className="nexra-badge" variants={fadeInUp}>
              <span className="nexra-badge-pulse" />
              <span className="nexra-badge-text">AI-Powered Coaching</span>
            </motion.div>

            {/* Headline — Solid colors for visibility over video */}
            <motion.h1 className="nexra-headline" variants={fadeInUp}>
              <span className="nexra-headline-sub">Your Personal</span>
              <span className="nexra-headline-main">
                <span className="nexra-headline-white">LEAGUE</span>
                <span className="nexra-headline-accent">COACH</span>
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p className="nexra-subheadline" variants={fadeInUp}>
              Advanced AI analyzes every game, identifies your mistakes,
              and delivers personalized coaching to help you climb.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div className="nexra-hero-ctas" variants={fadeInUp}>
              <motion.button
                onClick={handleGoogleSignIn}
                className="nexra-cta nexra-cta-primary"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="nexra-cta-icon">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </motion.button>
              <motion.button
                onClick={() => { setAuthMode('register'); setIsAuthOpen(true); }}
                className="nexra-cta nexra-cta-secondary"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <span>Create Account</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div className="nexra-hero-stats" variants={scaleIn}>
              <div className="nexra-stat-glass">
                <span className="nexra-stat-value">Deep</span>
                <span className="nexra-stat-label">AI Analysis</span>
              </div>
              <div className="nexra-stat-sep" />
              <div className="nexra-stat-glass">
                <span className="nexra-stat-value">100+</span>
                <span className="nexra-stat-label">Error Types</span>
              </div>
              <div className="nexra-stat-sep" />
              <div className="nexra-stat-glass">
                <span className="nexra-stat-value">24/7</span>
                <span className="nexra-stat-label">Available</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="nexra-scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          style={{ opacity: heroOpacity }}
        >
          <motion.div
            className="nexra-scroll-line"
            animate={{ scaleY: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </section>

      {/* ============================================
          MARQUEE TICKER
          ============================================ */}
      <div className="nexra-marquee">
        <motion.div
          className="nexra-marquee-track"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          {[0, 1].map((setIndex) => (
            <div key={setIndex} className="nexra-marquee-set">
              {['Death Analysis', 'Real-time Stats', 'AI Coaching', 'Progress Tracking', 'Timeline Analysis', 'Matchup Intel', 'Riot API Data', 'Personalized Tips'].map((item, i) => (
                <span key={i} className="nexra-marquee-item">
                  <span className="nexra-marquee-dot" />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </motion.div>
      </div>

      {/* ============================================
          FEATURES — Bento Grid
          ============================================ */}
      <section className="nexra-section nexra-features-section">
        <div className="nexra-section-bg">
          <motion.div className="nexra-section-glow nexra-section-glow-1" style={{ y: parallaxSlow }} />
          <motion.div className="nexra-section-glow nexra-section-glow-2" style={{ y: parallaxMed }} />
        </div>

        <div className="nexra-container">
          <motion.div
            className="nexra-section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="nexra-section-tag">Features</span>
            <h2 className="nexra-section-title">
              Everything you need to<br /><span className="nexra-text-gradient">dominate</span>
            </h2>
            <p className="nexra-section-subtitle">Powered by Riot API data and advanced AI to give you insights no other tool can.</p>
          </motion.div>

          <div className="nexra-bento-grid">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className={`nexra-glass-card nexra-bento-${index}`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                onMouseMove={handleCardMouseMove}
                style={{ '--accent': feature.color } as React.CSSProperties}
              >
                <div className="nexra-glass-card-glow" />
                <div className="nexra-glass-card-noise" />
                <div className="nexra-glass-card-border" />
                <div className="nexra-glass-card-content">
                  <div className="nexra-feature-icon">{feature.icon}</div>
                  <h3 className="nexra-feature-title">{feature.title}</h3>
                  <p className="nexra-feature-desc">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          HOW IT WORKS — Vertical Timeline
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
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="nexra-section-tag">How It Works</span>
            <h2 className="nexra-section-title">
              Four steps to <span className="nexra-text-gradient">improvement</span>
            </h2>
          </motion.div>

          <div className="nexra-timeline" ref={stepsRef}>
            {/* Scroll-driven progress line */}
            <div className="nexra-timeline-track">
              <motion.div
                className="nexra-timeline-fill"
                style={{ scaleY: stepsProgress }}
              />
            </div>

            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className="nexra-timeline-step"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Node on timeline */}
                <motion.div
                  className="nexra-timeline-node"
                  initial={{ scale: 0.7, opacity: 0.3 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span>{step.number}</span>
                </motion.div>

                {/* Step card */}
                <div className="nexra-timeline-card">
                  <div className="nexra-timeline-icon">{step.icon}</div>
                  <div className="nexra-timeline-text">
                    <h3 className="nexra-timeline-title">{step.title}</h3>
                    <p className="nexra-timeline-desc">{step.description}</p>
                  </div>
                </div>

                {/* Animated arrow connector */}
                {index < steps.length - 1 && (
                  <motion.div
                    className="nexra-timeline-arrow"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-20px" }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <motion.path
                        d="M12 4v12M7 12l5 5 5-5"
                        stroke="#00dcff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </svg>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          FINAL CTA
          ============================================ */}
      <section className="nexra-section nexra-cta-section">
        <div className="nexra-cta-bg">
          <motion.div
            className="nexra-cta-orb nexra-cta-orb-1"
            animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="nexra-cta-orb nexra-cta-orb-2"
            animate={{ x: [0, -40, 0], y: [0, 30, 0], scale: [1, 0.9, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="nexra-container">
          <motion.div
            className="nexra-cta-card"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="nexra-glass-card-noise" />
            <div className="nexra-cta-card-inner">
              <h2 className="nexra-cta-title">
                Ready to <span className="nexra-text-gradient">climb?</span>
              </h2>
              <p className="nexra-cta-desc">
                Join players who are using AI to improve their game.
                Start analyzing your matches today.
              </p>
              <motion.button
                onClick={() => { setAuthMode('register'); setIsAuthOpen(true); }}
                className="nexra-cta nexra-cta-final"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <span>Start Free Now</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </motion.button>
            </div>
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
                <Image src="/nexra-logo.png" alt="Nexra" width={22} height={22} className="nexra-footer-logo-img" />
                <span>NEXRA</span>
              </Link>
              <p className="nexra-footer-disclaimer">
                Nexra is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games
                or anyone officially involved in producing or managing Riot Games properties.
                Riot Games and League of Legends are trademarks of Riot Games, Inc.
              </p>
            </div>
            <div className="nexra-footer-links">
              <Link href="/legal" className="nexra-footer-link">Legal Notice</Link>
              <Link href="/privacy" className="nexra-footer-link">Privacy</Link>
              <Link href="/terms" className="nexra-footer-link">Terms</Link>
            </div>
          </div>
          <div className="nexra-footer-bottom">
            <span>&copy; 2025 Nexra - Crocoding. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* ============================================
          AUTH MODAL — Identical functionality
          ============================================ */}
      <AnimatePresence>
        {isAuthOpen && (
          <motion.div
            className="nexra-auth-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setIsAuthOpen(false)}
          >
            <motion.div
              className="nexra-auth-modal"
              initial={{ opacity: 0, scale: 0.88, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 50 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="nexra-auth-glow-top" />
              <div className="nexra-auth-glow-bottom" />
              <div className="nexra-glass-card-noise" />
              <div className="nexra-auth-border-line" />

              <button className="nexra-auth-close" onClick={() => setIsAuthOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>

              <div className="nexra-auth-content">
                {/* Logo + Title */}
                <div className="nexra-auth-header">
                  <div className="nexra-auth-logo-wrap">
                    <Image src="/nexra-logo.png" alt="Nexra" width={44} height={44} className="nexra-auth-logo-img" />
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={authMode}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <h2 className="nexra-auth-title">
                        {authMode === 'verify' ? 'Check your inbox' : authMode === 'login' ? 'Welcome back' : 'Get started'}
                      </h2>
                      <p className="nexra-auth-subtitle">
                        {authMode === 'verify'
                          ? `We sent a 6-digit code to ${verificationEmail}`
                          : authMode === 'login'
                          ? 'Sign in to continue to your dashboard'
                          : 'Create your account to start improving'
                        }
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Tabs */}
                {authMode !== 'verify' && (
                  <div className="nexra-auth-tabs">
                    <button className={`nexra-auth-tab ${authMode === 'login' ? 'active' : ''}`} onClick={() => switchAuthMode('login')}>Sign In</button>
                    <button className={`nexra-auth-tab ${authMode === 'register' ? 'active' : ''}`} onClick={() => switchAuthMode('register')}>Register</button>
                  </div>
                )}

                {/* Alerts */}
                <AnimatePresence mode="wait">
                  {authError && (
                    <motion.div className="nexra-auth-alert nexra-auth-alert-error" initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -8, height: 0 }} transition={{ duration: 0.25 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>{authError}</span>
                    </motion.div>
                  )}
                  {authSuccess && (
                    <motion.div className="nexra-auth-alert nexra-auth-alert-success" initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -8, height: 0 }} transition={{ duration: 0.25 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>{authSuccess}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form body */}
                <AnimatePresence mode="wait" initial={false}>
                  {authMode === 'verify' ? (
                    <motion.div
                      key="verify"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <form className="nexra-auth-form" onSubmit={handleVerifySubmit}>
                        <div className="nexra-auth-field">
                          <label>Verification Code</label>
                          <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            required
                            maxLength={6}
                            disabled={authLoading}
                            className="nexra-auth-code-input"
                          />
                        </div>
                        <button type="submit" className="nexra-auth-submit" disabled={authLoading || verificationCode.length !== 6}>
                          <span className="nexra-auth-submit-text">{authLoading ? 'Verifying...' : 'Verify Email'}</span>
                        </button>
                        <div className="nexra-auth-verify-actions">
                          <button type="button" onClick={handleResendCode} disabled={resendCooldown > 0 || authLoading} className="nexra-auth-link">
                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                          </button>
                          <span className="nexra-auth-link-sep" />
                          <button type="button" onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }} className="nexra-auth-link">
                            Back to sign in
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="auth-form"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {/* Google */}
                      <button onClick={handleGoogleSignIn} className="nexra-auth-google" disabled={authLoading}>
                        <svg viewBox="0 0 24 24" fill="currentColor" className="nexra-auth-google-icon">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span>Continue with Google</span>
                      </button>

                      <div className="nexra-auth-divider"><span>or continue with email</span></div>

                      {/* Email Form */}
                      <form className="nexra-auth-form" onSubmit={handleCredentialsSubmit}>
                        <div className="nexra-auth-field">
                          <label>Email address</label>
                          <div className="nexra-auth-input-wrap">
                            <svg className="nexra-auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={authLoading} />
                          </div>
                        </div>
                        <div className="nexra-auth-field">
                          <label>Password</label>
                          <div className="nexra-auth-input-wrap">
                            <svg className="nexra-auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            <input type={showPassword ? 'text' : 'password'} placeholder={authMode === 'register' ? 'Min. 8 characters' : 'Enter password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={authMode === 'register' ? 8 : undefined} disabled={authLoading} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} className="nexra-auth-input-toggle">
                              {showPassword ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              )}
                            </button>
                          </div>
                        </div>
                        <AnimatePresence initial={false}>
                          {authMode === 'register' && (
                            <motion.div
                              key="confirm-pw"
                              className="nexra-auth-field"
                              initial={{ opacity: 0, height: 0, marginTop: 0 }}
                              animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                              style={{ overflow: 'hidden' }}
                            >
                              <label>Confirm password</label>
                              <div className="nexra-auth-input-wrap">
                                <svg className="nexra-auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .56-.9l7-3.5a1 1 0 0 1 .88 0l7 3.5a1 1 0 0 1 .56.9z"/><path d="m9 12 2 2 4-4"/></svg>
                                <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={authLoading} />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1} className="nexra-auth-input-toggle">
                                  {showConfirmPassword ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                  ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                  )}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <button type="submit" className="nexra-auth-submit" disabled={authLoading}>
                          <span className="nexra-auth-submit-text">
                            {authLoading
                              ? (authMode === 'login' ? 'Signing in...' : 'Creating account...')
                              : (authMode === 'login' ? 'Sign In' : 'Create Account')
                            }
                          </span>
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="nexra-auth-terms">
                  By continuing, you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
