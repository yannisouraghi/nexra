'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';

const CREDIT_PACKS = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 5,
    price: 4.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
    popular: false,
    description: 'Perfect for trying out AI analysis',
    features: ['5 AI game analyses', 'Detailed coaching tips', 'Never expires'],
  },
  {
    id: 'popular',
    name: 'Popular',
    credits: 15,
    price: 9.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_POPULAR,
    popular: true,
    description: 'Best value for regular players',
    features: ['15 AI game analyses', 'Detailed coaching tips', 'Priority processing', 'Never expires'],
    savings: '33% savings',
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 50,
    price: 24.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    popular: false,
    description: 'For dedicated climbers',
    features: ['50 AI game analyses', 'Detailed coaching tips', 'Priority processing', 'Never expires'],
    savings: '50% savings',
  },
];

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handlePurchase = async (packId: string, priceId: string | undefined) => {
    if (status !== 'authenticated') {
      router.push('/');
      return;
    }

    if (!priceId) {
      alert('This pack is not available yet. Please try again later.');
      return;
    }

    setIsLoading(packId);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const userCredits = (session?.user as any)?.credits ?? 0;

  return (
    <div className="pricing-page">
      <AnimatedBackground />

      {/* Navigation */}
      <nav className="pricing-nav">
        <Link href="/" className="pricing-logo">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M16 2L4 9v14l12 7 12-7V9L16 2z" stroke="url(#pricingLogoGrad)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
            <circle cx="16" cy="16" r="3" fill="url(#pricingLogoGrad)"/>
            <defs>
              <linearGradient id="pricingLogoGrad" x1="4" y1="2" x2="28" y2="30">
                <stop stopColor="#00ffff"/>
                <stop offset="1" stopColor="#0066ff"/>
              </linearGradient>
            </defs>
          </svg>
          <span>NEXRA</span>
        </Link>

        <div className="pricing-nav-actions">
          {status === 'authenticated' ? (
            <Link href="/dashboard" className="pricing-nav-btn">
              Dashboard
            </Link>
          ) : (
            <Link href="/" className="pricing-nav-btn pricing-nav-btn-primary">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Header */}
      <div className="pricing-header">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="pricing-badge">Credits</span>
          <h1 className="pricing-title">
            Power up your <span className="pricing-title-accent">improvement</span>
          </h1>
          <p className="pricing-subtitle">
            Purchase credits to unlock AI-powered game analysis. Each credit = one detailed coaching session.
          </p>

          {status === 'authenticated' && (
            <div className="pricing-current-credits">
              <span className="pricing-credits-label">Your current balance:</span>
              <span className="pricing-credits-value">{userCredits} credits</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="pricing-cards">
        {CREDIT_PACKS.map((pack, index) => (
          <motion.div
            key={pack.id}
            className={`pricing-card ${pack.popular ? 'pricing-card-popular' : ''}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            {pack.popular && (
              <div className="pricing-card-badge">Most Popular</div>
            )}

            {pack.savings && (
              <div className="pricing-card-savings">{pack.savings}</div>
            )}

            <div className="pricing-card-header">
              <h3 className="pricing-card-name">{pack.name}</h3>
              <p className="pricing-card-description">{pack.description}</p>
            </div>

            <div className="pricing-card-price">
              <span className="pricing-card-currency">$</span>
              <span className="pricing-card-amount">{pack.price.toFixed(2)}</span>
            </div>

            <div className="pricing-card-credits">
              <span className="pricing-card-credits-value">{pack.credits}</span>
              <span className="pricing-card-credits-label">credits</span>
            </div>

            <ul className="pricing-card-features">
              {pack.features.map((feature, i) => (
                <li key={i}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePurchase(pack.id, pack.priceId)}
              disabled={isLoading !== null}
              className={`pricing-card-btn ${pack.popular ? 'pricing-card-btn-primary' : ''}`}
            >
              {isLoading === pack.id ? (
                <span className="pricing-btn-loading">
                  <span className="pricing-spinner"></span>
                  Processing...
                </span>
              ) : (
                <>Purchase</>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      {/* FAQ or Trust indicators */}
      <div className="pricing-trust">
        <div className="pricing-trust-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>Secure Payment</span>
        </div>
        <div className="pricing-trust-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span>SSL Encrypted</span>
        </div>
        <div className="pricing-trust-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Instant Delivery</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="pricing-footer">
        <p>Powered by Stripe. Credits never expire.</p>
      </footer>
    </div>
  );
}
