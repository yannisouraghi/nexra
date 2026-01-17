'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Analysis,
  getAnalysisByMatchId,
  getScoreColor,
  getScoreLabel,
} from '@/utils/nexraApi';
import { getChampionImageUrl } from '@/utils/ddragon';
import Image from 'next/image';
import AnimatedBackground from '@/components/AnimatedBackground';
import ErrorsList from '@/components/analysis/ErrorsList';
import CoachingTips from '@/components/analysis/CoachingTips';
import StatsComparison from '@/components/analysis/StatsComparison';

interface PageParams {
  matchId: string;
}

type TabType = 'errors' | 'tips' | 'stats';

export default function AnalysisPage({ params }: { params: Promise<PageParams> }) {
  const { matchId } = use(params);
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [status, setStatus] = useState<'loading' | 'not_found' | 'pending' | 'processing' | 'completed' | 'failed'>('loading');
  const [activeTab, setActiveTab] = useState<TabType>('errors');
  const [imageError, setImageError] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadAnalysis();

    // Cleanup polling on unmount
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [matchId]);

  const loadAnalysis = async () => {
    setStatus('loading');

    try {
      // Check if an analysis exists for this match
      const existingAnalysis = await getAnalysisByMatchId(matchId);

      if (existingAnalysis) {
        setAnalysis(existingAnalysis);

        if (existingAnalysis.status === 'completed') {
          setStatus('completed');
        } else if (existingAnalysis.status === 'processing' || existingAnalysis.status === 'pending') {
          setStatus('processing');
          startPolling();
        } else if (existingAnalysis.status === 'failed') {
          setStatus('failed');
        }
        return;
      }

      // No analysis found for this match
      setStatus('not_found');
    } catch (error) {
      console.error('Failed to load analysis:', error);
      setStatus('not_found');
    }
  };

  const startPolling = () => {
    // Poll every 5 seconds for status updates
    pollingRef.current = setInterval(async () => {
      try {
        const updatedAnalysis = await getAnalysisByMatchId(matchId);
        if (updatedAnalysis) {
          setAnalysis(updatedAnalysis);

          if (updatedAnalysis.status === 'completed') {
            setStatus('completed');
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          } else if (updatedAnalysis.status === 'failed') {
            setStatus('failed');
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'errors',
      label: 'Errors',
      count: analysis?.errors?.length || 0,
      icon: (
        <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      id: 'tips',
      label: 'Coaching',
      count: analysis?.tips?.length || 0,
      icon: (
        <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      id: 'stats',
      label: 'Stats',
      icon: (
        <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0e13' }}>
      <AnimatedBackground />

      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <header style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backgroundColor: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}>
          <div style={{
            maxWidth: '72rem',
            margin: '0 auto',
            padding: '1rem 2rem',
          }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'rgba(255,255,255,0.6)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 500,
              }}
            >
              <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Dashboard</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main style={{
          maxWidth: '72rem',
          margin: '0 auto',
          padding: '2rem',
          minHeight: 'calc(100vh - 60px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          {/* Loading State */}
          {status === 'loading' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6rem 0',
            }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '5rem',
                  height: '5rem',
                  border: '4px solid rgba(168,85,247,0.2)',
                  borderTopColor: '#a855f7',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
              </div>
              <p style={{ marginTop: '1.5rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                Loading analysis...
              </p>
            </div>
          )}

          {/* Analysis Not Found State */}
          {status === 'not_found' && (
            <div className="glass-card" style={{
              borderRadius: '1.5rem',
              padding: '3rem',
              maxWidth: '32rem',
              margin: '0 auto',
              textAlign: 'center',
            }}>
              <div style={{
                width: '5rem',
                height: '5rem',
                margin: '0 auto 1.5rem',
                borderRadius: '1.25rem',
                background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.3), rgba(75, 85, 99, 0.3))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg style={{ width: '2.5rem', height: '2.5rem', color: 'rgba(255,255,255,0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'white',
                marginBottom: '0.75rem',
              }}>
                Analysis Not Found
              </h1>
              <p style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.95rem',
                marginBottom: '2rem',
                lineHeight: 1.6,
              }}>
                This match hasn't been analyzed yet. Go to your dashboard to analyze your recent games.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #00d4ff, #6366f1)',
                  color: 'white',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go to Dashboard
              </button>
            </div>
          )}

          {/* Processing State */}
          {status === 'processing' && (
            <div style={{ maxWidth: '32rem', margin: '0 auto' }}>
              <div className="glass-card" style={{
                borderRadius: '1.5rem',
                padding: '3rem',
                textAlign: 'center',
              }}>
                <div style={{
                  position: 'relative',
                  width: '7rem',
                  height: '7rem',
                  margin: '0 auto 2rem',
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    border: '4px solid rgba(168,85,247,0.2)',
                    borderTopColor: '#a855f7',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: '0.75rem',
                    border: '4px solid transparent',
                    borderBottomColor: '#ec4899',
                    borderRadius: '50%',
                    animation: 'spin 1.5s linear infinite reverse',
                  }} />
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                  Analyzing<span className="animated-dots"></span>
                </h2>
              </div>
            </div>
          )}

          {/* Completed Analysis */}
          {status === 'completed' && analysis && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Game Header Card */}
              <div className="glass-card" style={{
                borderRadius: '1.5rem',
                overflow: 'hidden',
                background: analysis.result === 'win'
                  ? 'linear-gradient(135deg, rgba(0,255,136,0.08) 0%, transparent 60%)'
                  : 'linear-gradient(135deg, rgba(255,51,102,0.08) 0%, transparent 60%)',
              }}>
                <div style={{ padding: '2rem' }}>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.5rem',
                  }}>
                    {/* Champion & Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{
                        width: '6rem',
                        height: '6rem',
                        borderRadius: '1rem',
                        overflow: 'hidden',
                        border: `2px solid ${analysis.result === 'win' ? '#00ff88' : '#ff3366'}`,
                        boxShadow: `0 0 30px ${analysis.result === 'win' ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)'}`,
                      }}>
                        {!imageError && analysis.champion ? (
                          <Image
                            src={getChampionImageUrl(analysis.champion)}
                            alt={analysis.champion}
                            width={96}
                            height={96}
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            onError={() => setImageError(true)}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <span style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.6)' }}>
                              {analysis.champion?.[0] || '?'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'white' }}>
                            {analysis.champion || 'Unknown'}
                          </h1>
                          <span style={{
                            padding: '0.375rem 1rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            backgroundColor: analysis.result === 'win' ? 'rgba(0,255,136,0.15)' : 'rgba(255,51,102,0.15)',
                            color: analysis.result === 'win' ? '#00ff88' : '#ff3366',
                          }}>
                            {analysis.result === 'win' ? 'Victory' : 'Defeat'}
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1.25rem',
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '0.9rem',
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDuration(analysis.duration || 0)}
                          </span>
                          <span>{analysis.gameMode || 'Classic'}</span>
                          <span style={{ fontWeight: 600, color: 'white', fontSize: '1.1rem' }}>
                            {analysis.kills ?? 0} / {analysis.deaths ?? 0} / {analysis.assists ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    {analysis.stats && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.25rem',
                        padding: '1.25rem',
                        borderRadius: '0.75rem',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontSize: '0.7rem',
                            color: 'rgba(255,255,255,0.5)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: '0.25rem',
                          }}>
                            Performance
                          </div>
                          <div style={{
                            fontSize: '3rem',
                            fontWeight: 700,
                            color: getScoreColor(analysis.stats.overallScore),
                            lineHeight: 1,
                          }}>
                            {analysis.stats.overallScore}
                          </div>
                        </div>
                        <div style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          backgroundColor: `${getScoreColor(analysis.stats.overallScore)}15`,
                          color: getScoreColor(analysis.stats.overallScore),
                          border: `1px solid ${getScoreColor(analysis.stats.overallScore)}30`,
                        }}>
                          {getScoreLabel(analysis.stats.overallScore)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs Card */}
              <div className="glass-card" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
                {/* Tab Navigation */}
                <div style={{
                  padding: '0 1.5rem',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                }}>
                  <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto' }}>
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.625rem',
                          padding: '1rem 1.25rem',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          borderBottom: '2px solid',
                          borderColor: activeTab === tab.id ? '#a855f7' : 'transparent',
                          color: activeTab === tab.id ? '#a855f7' : 'rgba(255,255,255,0.5)',
                          background: 'none',
                          border: 'none',
                          borderBottomWidth: '2px',
                          borderBottomStyle: 'solid',
                          marginBottom: '-1px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                        {tab.count !== undefined && tab.count > 0 && (
                          <span style={{
                            padding: '0.125rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: activeTab === tab.id ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.1)',
                            color: activeTab === tab.id ? '#c084fc' : 'rgba(255,255,255,0.5)',
                          }}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div style={{ padding: '2rem' }}>
                  {activeTab === 'errors' && analysis.errors && (
                    <ErrorsList errors={analysis.errors} />
                  )}
                  {activeTab === 'tips' && analysis.tips && (
                    <CoachingTips tips={analysis.tips} />
                  )}
                  {activeTab === 'stats' && analysis.stats && (
                    <StatsComparison stats={analysis.stats} />
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animated-dots::after {
          content: '';
          animation: dots 1.5s steps(4, end) infinite;
        }
        @keyframes dots {
          0% { content: ''; }
          25% { content: '.'; }
          50% { content: '..'; }
          75% { content: '...'; }
          100% { content: ''; }
        }
      `}</style>
    </div>
  );
}
