'use client';

import { useState, useEffect } from 'react';

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
    title: "Link Your Riot Account",
    description: "First, connect your Riot Games account so we can track your matches. Enter your Riot ID (GameName#TAG) to get started.",
    image: (
      <div style={{ width: '100%', height: '200px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '12px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#ef4444">
            <path d="M12.534 21.77l-1.09-2.81 10.52.54-.451 4.5zM15.06 0L.307 6.969 2.59 17.471H5.6l-.52-7.084 2.688-1.478.623 8.562h3.01l-.58-10.2 2.779-1.53.796 11.73h3.09l-.18-14.583z" />
          </svg>
          <div style={{ color: 'white', fontSize: '18px', fontWeight: 600 }}>
            YourName<span style={{ color: 'rgba(255,255,255,0.4)' }}>#</span><span style={{ color: '#22d3ee' }}>TAG</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          Find your Riot ID in the League client
        </div>
      </div>
    ),
    tip: "Your Riot ID can be found in the top-right corner of the League client."
  },
  {
    title: "Play a League Game",
    description: "Once your account is linked, simply play a game of League of Legends. We automatically detect when you start and finish a match.",
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
      <div style={{ width: '100%', height: '200px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Mock game card */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            🎮
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'white', fontWeight: 600 }}>Yasuo</span>
              <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: 600, background: 'rgba(34, 197, 94, 0.2)', padding: '2px 8px', borderRadius: '4px' }}>VICTORY</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '4px' }}>
              <span style={{ color: '#22c55e' }}>12</span> / <span style={{ color: '#ef4444' }}>3</span> / <span style={{ color: '#f59e0b' }}>8</span>
              <span style={{ marginLeft: '12px' }}>32:45</span>
            </div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)', padding: '8px 16px', borderRadius: '6px', color: 'white', fontWeight: 600, fontSize: '13px' }}>
            Analyze
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
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
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

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      localStorage.setItem('nexra_onboarding_completed', 'true');
      onComplete();
    }, 300);
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(() => {
      localStorage.setItem('nexra_onboarding_completed', 'true');
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
