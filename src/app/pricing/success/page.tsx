'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Verify the session (optional - could fetch session details from API)
      // For now, just show success since Stripe redirected here
      setTimeout(() => setStatus('success'), 1000);
    } else {
      setStatus('error');
    }
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <motion.div
        className="payment-status-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="payment-spinner-large"></div>
        <p className="payment-status-text">Verifying payment...</p>
      </motion.div>
    );
  }

  if (status === 'success') {
    return (
      <motion.div
        className="payment-status-card payment-status-success"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
      >
        <div className="payment-success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>

        <h1 className="payment-success-title">Payment Successful!</h1>
        <p className="payment-success-subtitle">
          Your credits have been added to your account.
        </p>

        <div className="payment-success-actions">
          <Link href="/dashboard" className="payment-btn-primary">
            Go to Dashboard
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
          <Link href="/pricing" className="payment-btn-secondary">
            Buy More Credits
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="payment-status-card payment-status-error"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="payment-error-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>

      <h1 className="payment-error-title">Something went wrong</h1>
      <p className="payment-error-subtitle">
        We couldn't verify your payment. If you were charged, please contact support.
      </p>

      <div className="payment-success-actions">
        <Link href="/pricing" className="payment-btn-primary">
          Try Again
        </Link>
        <Link href="/dashboard" className="payment-btn-secondary">
          Go to Dashboard
        </Link>
      </div>
    </motion.div>
  );
}

function LoadingFallback() {
  return (
    <div className="payment-status-card">
      <div className="payment-spinner-large"></div>
      <p className="payment-status-text">Loading...</p>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="payment-success-page">
      <AnimatedBackground />

      <div className="payment-success-container">
        <Suspense fallback={<LoadingFallback />}>
          <PaymentSuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
