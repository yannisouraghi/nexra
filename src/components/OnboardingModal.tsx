'use client';

import { useState, useEffect } from 'react';
import { NEXRA_API_URL } from '@/config/api';

interface OnboardingStep {
  title: string;
  description: string;
  image: React.ReactNode;
  tip?: string;
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to Nexra!",
    description: "Your AI-powered League of Legends coach. We analyze your games using Riot API data and help you improve with personalized insights and coaching tips.",
    image: (
      <div style={{ width: '100%', height: '200px', background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(0, 255, 255, 0.1) 0%, transparent 70%)' }} />
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="50" stroke="url(#welcomeGrad)" strokeWidth="3" fill="none" />
          <path d="M60 20L45 50h30L60 20z" fill="url(#welcomeGrad)" />
          <path d="M60 100L75 70H45L60 100z" fill="url(#welcomeGrad)" />
          <circle cx="60" cy="60" r="15" fill="url(#welcomeGrad)" />
          <defs>
            <linearGradient id="welcomeGrad" x1="0" y1="0" x2="120" y2="120">
              <stop stopColor="#00ffff" />
              <stop offset="1" stopColor="#0066ff" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 600 }}>
          AI-Powered Coaching
        </div>
      </div>
    ),
    tip: "Let's get you started in just a few steps!"
  },
  {
    title: "Play a League Game",
    description: "Now that your Riot account is linked, simply play a game of League of Legends. We automatically detect when you start and finish a match.",
    image: (
      <div style={{ width: '100%', height: '200px', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '20px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '2px solid rgba(34, 197, 94, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', textAlign: 'center' }}>
          Play any Ranked, Normal, or ARAM game
        </div>
      </div>
    ),
    tip: "We support Ranked Solo/Duo, Flex, Normal, and ARAM games."
  },
  {
    title: "Game Detected!",
    description: "After your game ends, it will appear in your dashboard. You'll see your champion, KDA, and match result. The game is now ready to be analyzed!",
    image: (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        {/* Realistic GameAnalysisCard preview */}
        <div style={{
          position: 'relative',
          width: '180px',
          height: '260px',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #1a1a2e 0%, #0d0d1a 100%)',
          border: '2px solid rgba(0,255,136,0.5)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {/* Champion splash background */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <img
              src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg"
              alt="Yasuo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top',
                opacity: 0.55,
              }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.4) 100%)',
            }} />
          </div>

          {/* Top badges */}
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            right: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
          }}>
            <span style={{
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 600,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(8px)',
            }}>
              2m
            </span>
            <span style={{
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 9,
              fontWeight: 700,
              backgroundColor: 'rgba(0,255,136,0.2)',
              color: '#00ff88',
            }}>
              WIN
            </span>
          </div>

          {/* Content */}
          <div style={{
            position: 'relative',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: 12,
            paddingTop: 44,
          }}>
            {/* Middle - Analyze button */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <img
                  src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png"
                  alt="MID"
                  style={{ width: 22, height: 22, filter: 'brightness(1.1)' }}
                />
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                color: 'white',
                background: 'linear-gradient(135deg, #00d4ff 0%, #6366f1 100%)',
                boxShadow: '0 4px 16px rgba(0,212,255,0.4)',
              }}>
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Analyze</span>
              </div>
            </div>

            {/* Bottom - Champion info */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              marginTop: 'auto',
              paddingTop: 8,
            }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'white',
                margin: 0,
                textAlign: 'center',
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}>
                Yasuo
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 13, fontWeight: 600 }}>
                <span style={{ color: '#4ade80' }}>12</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
                <span style={{ color: '#f87171' }}>3</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
                <span style={{ color: '#22d3ee' }}>8</span>
                <span style={{ marginLeft: 6, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>(6.7)</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 9,
                color: 'rgba(255,255,255,0.5)',
              }}>
                <span>Ranked</span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>•</span>
                <span>32:45</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
          New game detected automatically
        </div>
      </div>
    ),
    tip: "Games usually appear within 1-2 minutes after the match ends."
  },
  {
    title: "Get AI Analysis",
    description: "Go to the 'Analysis' tab in the left menu to see your recent games. Click 'Analyze' on any game to get a detailed AI breakdown of your performance.",
    image: (
      <div style={{ width: '100%', height: '200px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '20px' }}>
        {/* Menu illustration */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Vertical menu mockup */}
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(255,255,255,0.2)' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Summary</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                <path d="M12 3l1.5 4.5h5l-4 3 1.5 4.5-4-3-4 3 1.5-4.5-4-3h5z" />
              </svg>
              <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 600 }}>Analysis</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(255,255,255,0.2)' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Live Game</span>
            </div>
          </div>
          {/* Arrow */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          {/* AI icon */}
          <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(0, 212, 255, 0.3)', border: '1px solid rgba(0, 212, 255, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', textAlign: 'center' }}>
          AI analyzes deaths, CS, vision, positioning & more
        </div>
      </div>
    ),
    tip: "Each analysis uses 1 credit. You start with 3 free credits!"
  },
  {
    title: "Learn & Improve",
    description: "Review your personalized analysis with detailed breakdowns of each mistake, coaching tips, and comparisons to higher-ranked players. Time to climb!",
    image: (
      <div style={{ width: '100%', height: '200px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Score display */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 700, background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>78</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Overall Score</div>
          </div>
          <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#f59e0b' }}>5</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Errors Found</div>
          </div>
          <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#22d3ee' }}>8</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Tips</div>
          </div>
        </div>
        {/* Sample tip */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <div>
            <div style={{ color: 'white', fontSize: '12px', fontWeight: 500 }}>Improve CS in lane phase</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '2px' }}>You missed 23 CS in the first 10 minutes</div>
          </div>
        </div>
      </div>
    ),
    tip: "Check your analysis after each game to track your progress!"
  },
];

interface OnboardingModalProps {
  onComplete: () => void;
  userId?: string;
}

export default function OnboardingModal({ onComplete, userId }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const markOnboardingComplete = async () => {
    // Store in localStorage as backup
    localStorage.setItem('nexra_onboarding_completed', 'true');

    // Also save to database if userId is available
    if (userId) {
      try {
        await fetch(`${NEXRA_API_URL}/users/${userId}/complete-onboarding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error saving onboarding status:', error);
        // localStorage already set as fallback
      }
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(async () => {
      await markOnboardingComplete();
      onComplete();
    }, 300);
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(async () => {
      await markOnboardingComplete();
      onComplete();
    }, 300);
  };

  const step = steps[currentStep];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(180deg, rgba(20, 20, 30, 0.98) 0%, rgba(10, 10, 15, 0.98) 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 100px rgba(0, 212, 255, 0.1)',
          overflow: 'hidden',
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Progress bar */}
        <div style={{ height: '3px', background: 'rgba(255, 255, 255, 0.1)' }}>
          <div
            style={{
              height: '100%',
              width: `${((currentStep + 1) / steps.length) * 100}%`,
              background: 'linear-gradient(90deg, #00d4ff 0%, #0066ff 100%)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Header */}
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00d4ff' }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <button
            onClick={handleSkip}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '13px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'; e.currentTarget.style.background = 'none'; }}
          >
            Skip tutorial
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Image */}
          <div style={{ marginBottom: '24px' }}>
            {step.image}
          </div>

          {/* Title */}
          <h2 style={{
            color: 'white',
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '12px',
            fontFamily: 'Rajdhani, sans-serif',
          }}>
            {step.title}
          </h2>

          {/* Description */}
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '15px',
            lineHeight: 1.6,
            marginBottom: '16px',
          }}>
            {step.description}
          </p>

          {/* Tip */}
          {step.tip && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              background: 'rgba(0, 212, 255, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 212, 255, 0.2)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px' }}>
                {step.tip}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                style={{
                  width: index === currentStep ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: index === currentStep
                    ? 'linear-gradient(90deg, #00d4ff 0%, #0066ff 100%)'
                    : index < currentStep
                      ? 'rgba(0, 212, 255, 0.5)'
                      : 'rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.background = 'transparent'; }}
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 212, 255, 0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 212, 255, 0.3)'; }}
            >
              {currentStep === steps.length - 1 ? "Let's Go!" : 'Next'}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
