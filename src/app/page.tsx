'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

// ============================================
// NEXRA LANDING PAGE - PREMIUM GAMER SAAS
// Liquid Glass / Apple-like Design
// ============================================

export default function LandingPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoaded, setIsLoaded] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/link-riot' });
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
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      ),
      title: "Video Clips",
      description: "Key moments highlighted with AI commentary explaining what happened.",
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
      title: "Install Nexra Vision",
      description: "Lightweight desktop app that runs silently in the background, automatically detecting and recording your League games.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      )
    },
    {
      number: "02",
      title: "Play Your Games",
      description: "Just play normally. Nexra Vision captures everything: your gameplay, minimap movements, item timings, and more.",
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
      description: "Our advanced AI breaks down every play, identifies mistakes you didn't notice, and finds patterns in your gameplay.",
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
          NEXRA VISION SECTION
          ============================================ */}
      <section className="nexra-section nexra-vision-section">
        <div className="nexra-container">
          <div className="nexra-vision-content">
            <motion.div
              className="nexra-vision-info"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <span className="nexra-section-tag">Nexra Vision</span>
              <h2 className="nexra-section-title">
                The <span className="nexra-text-gradient">eye</span> that never misses
              </h2>
              <p className="nexra-vision-desc">
                Nexra Vision is our lightweight desktop recorder that automatically captures your League games.
                No manual recording, no performance impact, no hassle.
              </p>

              <ul className="nexra-vision-features">
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Auto-detects League of Legends</span>
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Zero performance impact</span>
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Automatic cloud sync</span>
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Works in background silently</span>
                </motion.li>
              </ul>

              <motion.button
                onClick={() => { setAuthMode('register'); setIsAuthOpen(true); }}
                className="nexra-vision-cta"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                <span>Sign Up to Download</span>
              </motion.button>
            </motion.div>

            <motion.div
              className="nexra-vision-preview"
              initial={{ opacity: 0, x: 50, rotateY: -10 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <div className="nexra-vision-card">
                <div className="nexra-vision-card-header">
                  <div className="nexra-vision-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="nexra-vision-card-title">Nexra Vision</span>
                </div>
                <div className="nexra-vision-card-body">
                  <div className="nexra-vision-status">
                    <div className="nexra-vision-eye">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      <motion.div
                        className="nexra-vision-eye-glow"
                        animate={{
                          opacity: [0.5, 1, 0.5],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                    <div className="nexra-vision-status-text">
                      <span className="nexra-vision-status-label">Status</span>
                      <span className="nexra-vision-status-value">
                        <span className="nexra-vision-status-dot" />
                        Watching for games...
                      </span>
                    </div>
                  </div>

                  <div className="nexra-vision-stats">
                    <div className="nexra-vision-stat">
                      <span className="nexra-vision-stat-value">0</span>
                      <span className="nexra-vision-stat-label">Games Today</span>
                    </div>
                    <div className="nexra-vision-stat">
                      <span className="nexra-vision-stat-value">Ready</span>
                      <span className="nexra-vision-stat-label">Sync Status</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                className="nexra-vision-float nexra-vision-float-1"
                animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="10 8 16 12 10 16 10 8"/>
                </svg>
              </motion.div>
              <motion.div
                className="nexra-vision-float nexra-vision-float-2"
                animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </motion.div>
            </motion.div>
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
                  {authMode === 'login' ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="nexra-auth-subtitle">
                  {authMode === 'login'
                    ? 'Sign in to access your dashboard'
                    : 'Start your journey to improvement'
                  }
                </p>
              </div>

              {/* Auth Tabs */}
              <div className="nexra-auth-tabs">
                <button
                  className={`nexra-auth-tab ${authMode === 'login' ? 'active' : ''}`}
                  onClick={() => setAuthMode('login')}
                >
                  Sign In
                </button>
                <button
                  className={`nexra-auth-tab ${authMode === 'register' ? 'active' : ''}`}
                  onClick={() => setAuthMode('register')}
                >
                  Create Account
                </button>
              </div>

              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                className="nexra-auth-google"
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
              <form className="nexra-auth-form" onSubmit={(e) => e.preventDefault()}>
                <div className="nexra-auth-field">
                  <label>Email</label>
                  <input type="email" placeholder="you@example.com" />
                </div>
                <div className="nexra-auth-field">
                  <label>Password</label>
                  <input type="password" placeholder="Enter your password" />
                </div>
                {authMode === 'register' && (
                  <div className="nexra-auth-field">
                    <label>Confirm Password</label>
                    <input type="password" placeholder="Confirm your password" />
                  </div>
                )}
                <button type="submit" className="nexra-auth-submit">
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

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
