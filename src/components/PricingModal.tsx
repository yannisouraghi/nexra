'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { X, Shield, Lock, Zap, Check, Sparkles } from 'lucide-react';

const CREDIT_PACKS = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 5,
    price: 4.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
    popular: false,
    description: 'Perfect for trying out',
    features: ['5 AI analyses', 'Coaching tips', 'Never expires'],
  },
  {
    id: 'popular',
    name: 'Popular',
    credits: 15,
    price: 9.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_POPULAR,
    popular: true,
    description: 'Best value',
    features: ['15 AI analyses', 'Priority processing', 'Never expires'],
    savings: '33% off',
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 50,
    price: 24.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    popular: false,
    description: 'For dedicated climbers',
    features: ['50 AI analyses', 'Priority processing', 'Never expires'],
    savings: '50% off',
  },
];

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePurchase = async (packId: string, priceId: string | undefined) => {
    if (status !== 'authenticated') {
      router.push('/login');
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
          userId: (session?.user as any)?.id,
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
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button style={styles.closeButton} onClick={onClose}>
          <X size={20} />
        </button>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerIcon}>
            <Sparkles size={24} />
          </div>
          <h2 style={styles.title}>Get More Credits</h2>
          <p style={styles.subtitle}>Each credit = one AI-powered game analysis</p>

          {status === 'authenticated' && (
            <div style={styles.currentCredits}>
              <span style={styles.creditsLabel}>Current balance:</span>
              <span style={styles.creditsValue}>{userCredits} credits</span>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div style={styles.cardsContainer}>
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              style={{
                ...styles.card,
                ...(pack.popular ? styles.cardPopular : {}),
              }}
            >
              {pack.popular && <div style={styles.popularBadge}>Best Value</div>}
              {pack.savings && <div style={styles.savingsBadge}>{pack.savings}</div>}

              <div style={styles.cardHeader}>
                <h3 style={styles.cardName}>{pack.name}</h3>
                <p style={styles.cardDescription}>{pack.description}</p>
              </div>

              <div style={styles.priceSection}>
                <span style={styles.currency}>$</span>
                <span style={styles.price}>{pack.price.toFixed(2)}</span>
              </div>

              <div style={styles.creditsSection}>
                <span style={styles.creditsAmount}>{pack.credits}</span>
                <span style={styles.creditsText}>credits</span>
              </div>

              <ul style={styles.featuresList}>
                {pack.features.map((feature, i) => (
                  <li key={i} style={styles.featureItem}>
                    <Check size={14} style={{ color: '#00ff88', flexShrink: 0 }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePurchase(pack.id, pack.priceId)}
                disabled={isLoading !== null}
                style={{
                  ...styles.buyButton,
                  ...(pack.popular ? styles.buyButtonPopular : {}),
                  opacity: isLoading !== null ? 0.7 : 1,
                }}
              >
                {isLoading === pack.id ? (
                  <span style={styles.loadingText}>
                    <span style={styles.spinner} />
                    Processing...
                  </span>
                ) : (
                  'Purchase'
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div style={styles.trustSection}>
          <div style={styles.trustItem}>
            <Shield size={16} />
            <span>Secure Payment</span>
          </div>
          <div style={styles.trustItem}>
            <Lock size={16} />
            <span>SSL Encrypted</span>
          </div>
          <div style={styles.trustItem}>
            <Zap size={16} />
            <span>Instant Delivery</span>
          </div>
        </div>

        <p style={styles.footer}>Powered by Stripe. Credits never expire.</p>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    position: 'relative',
    width: '100%',
    maxWidth: 900,
    maxHeight: '90vh',
    overflowY: 'auto',
    backgroundColor: '#0f0f0f',
    borderRadius: 20,
    padding: '32px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    animation: 'fadeIn 0.2s ease-out',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  header: {
    textAlign: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(99,102,241,0.2))',
    border: '1px solid rgba(0,212,255,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    color: '#00d4ff',
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: 'white',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    margin: 0,
  },
  currentCredits: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: '8px 16px',
    borderRadius: 20,
    backgroundColor: 'rgba(0,212,255,0.1)',
    border: '1px solid rgba(0,212,255,0.2)',
  },
  creditsLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  creditsValue: {
    fontSize: 13,
    fontWeight: 600,
    color: '#00d4ff',
  },
  cardsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    position: 'relative',
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.2s',
  },
  cardPopular: {
    backgroundColor: 'rgba(0,212,255,0.05)',
    border: '1px solid rgba(0,212,255,0.3)',
    boxShadow: '0 0 30px rgba(0,212,255,0.1)',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '4px 12px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #00d4ff, #0066ff)',
    color: 'white',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  savingsBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: '2px 8px',
    borderRadius: 6,
    backgroundColor: 'rgba(0,255,136,0.15)',
    color: '#00ff88',
    fontSize: 10,
    fontWeight: 600,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardName: {
    fontSize: 18,
    fontWeight: 600,
    color: 'white',
    margin: '0 0 4px',
  },
  cardDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    margin: 0,
  },
  priceSection: {
    display: 'flex',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  currency: {
    fontSize: 16,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.6)',
    marginRight: 2,
  },
  price: {
    fontSize: 32,
    fontWeight: 700,
    color: 'white',
  },
  creditsSection: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 16,
  },
  creditsAmount: {
    fontSize: 24,
    fontWeight: 700,
    color: '#00d4ff',
  },
  creditsText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  featuresList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  buyButton: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: 'white',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buyButtonPopular: {
    background: 'linear-gradient(135deg, #00d4ff, #0066ff)',
    border: 'none',
  },
  loadingText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  spinner: {
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  trustSection: {
    display: 'flex',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    margin: 0,
  },
};
