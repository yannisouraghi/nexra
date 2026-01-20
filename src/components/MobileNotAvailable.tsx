'use client';

import { useState, useEffect } from 'react';

interface MobileNotAvailableProps {
  gameName?: string;
  tagLine?: string;
}

// Detect if the user is on a real mobile device (not just a small screen)
const detectMobileDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // Check user agent for mobile devices
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
  const isMobileUserAgent = mobileRegex.test(userAgent);

  // Check for touch capability combined with small screen (tablets excluded by screen size)
  const hasTouchScreen = (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );

  // Check if it's a mobile device based on screen characteristics
  // Mobile phones typically have width < 768 AND are touch devices
  const isSmallTouchDevice = hasTouchScreen && window.screen.width < 768;

  // Also check for mobile platform
  const isMobilePlatform = /Android|iPhone|iPad|iPod/i.test(navigator.platform || '');

  // Return true only if user agent suggests mobile OR it's a small touch device
  // This prevents false positives when desktop users resize their browser
  return isMobileUserAgent || isMobilePlatform || isSmallTouchDevice;
};

export default function MobileNotAvailable({ gameName, tagLine }: MobileNotAvailableProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    const wasDismissed = sessionStorage.getItem('nexra_mobile_dismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Check if actually on a mobile device (not just small window)
    const mobile = detectMobileDevice();
    setIsMobile(mobile);
    if (mobile) {
      setTimeout(() => setIsVisible(true), 100);
    }

    // No need for resize listener since we're detecting actual mobile devices
    // not just screen width
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      sessionStorage.setItem('nexra_mobile_dismissed', 'true');
      setDismissed(true);
    }, 300);
  };

  // Don't render if not mobile or already dismissed
  if (!isMobile || dismissed) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(12px)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'linear-gradient(180deg, rgba(20, 20, 30, 0.98) 0%, rgba(10, 10, 15, 0.98) 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 100px rgba(0, 212, 255, 0.15)',
          overflow: 'hidden',
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Top gradient accent */}
        <div
          style={{
            height: '4px',
            background: 'linear-gradient(90deg, #00d4ff 0%, #0066ff 50%, #a855f7 100%)',
          }}
        />

        {/* Content */}
        <div style={{ padding: '32px 24px' }}>
          {/* Icon */}
          <div
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* Desktop icon */}
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00d4ff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            {/* Glow effect */}
            <div
              style={{
                position: 'absolute',
                inset: '-10px',
                background: 'radial-gradient(circle, rgba(0, 212, 255, 0.2) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Title */}
          <h2
            style={{
              color: 'white',
              fontSize: '22px',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '12px',
              fontFamily: 'Rajdhani, sans-serif',
            }}
          >
            Desktop Only
          </h2>

          {/* Description */}
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '15px',
              lineHeight: 1.7,
              textAlign: 'center',
              marginBottom: '24px',
            }}
          >
            Nexra is optimized for desktop browsers to provide the best coaching experience.
            Please visit us on your computer to analyze your games.
          </p>

          {/* Account linked confirmation */}
          {gameName && tagLine && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '14px 16px',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', marginBottom: '2px' }}>
                  Account Linked
                </div>
                <div style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>
                  {gameName}
                  <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 400 }}>#{tagLine}</span>
                </div>
              </div>
            </div>
          )}

          {/* URL hint */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '24px',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                fontFamily: 'monospace',
              }}
            >
              nexra-ai.app
            </span>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)',
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(0, 212, 255, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 25px rgba(0, 212, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 212, 255, 0.3)';
            }}
          >
            Got it
          </button>

          {/* Footer note */}
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.35)',
              fontSize: '12px',
              textAlign: 'center',
              marginTop: '16px',
            }}
          >
            Mobile support coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
