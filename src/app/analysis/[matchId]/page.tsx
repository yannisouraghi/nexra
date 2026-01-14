'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Analysis,
  checkRecordingExists,
  getAnalysisByMatchId,
  getScoreColor,
  getScoreLabel,
} from '@/utils/nexraApi';
import { getChampionImageUrl } from '@/utils/ddragon';
import Image from 'next/image';
import AnimatedBackground from '@/components/AnimatedBackground';
import ErrorsList from '@/components/analysis/ErrorsList';
import CoachingTips from '@/components/analysis/CoachingTips';
import VideoClipPlayer from '@/components/analysis/VideoClipPlayer';
import StatsComparison from '@/components/analysis/StatsComparison';

interface PageParams {
  matchId: string;
}

type TabType = 'errors' | 'tips' | 'clips' | 'stats';

export default function AnalysisPage({ params }: { params: Promise<PageParams> }) {
  const { matchId } = use(params);
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [status, setStatus] = useState<'loading' | 'no_recording' | 'pending' | 'processing' | 'completed' | 'failed'>('loading');
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
      // First check if an analysis already exists
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

      // No analysis exists, check if recording exists
      const hasRecording = await checkRecordingExists(matchId);

      if (!hasRecording) {
        setStatus('no_recording');
        return;
      }

      // Recording exists but no analysis - this shouldn't happen normally
      // The user would need to trigger analysis creation
      setStatus('no_recording');
    } catch (error) {
      console.error('Failed to load analysis:', error);
      setStatus('no_recording');
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
      id: 'clips',
      label: 'Clips',
      count: analysis?.clips?.length || 0,
      icon: (
        <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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

          {/* No Recording State */}
          {status === 'no_recording' && (
            <div className="glass-card" style={{
              borderRadius: '1.5rem',
              padding: '3rem',
              maxWidth: '48rem',
              margin: '0 auto',
            }}>
              {/* Header */}
              <div style={{
                textAlign: 'center',
                marginBottom: '2rem',
              }}>
                <div style={{
                  width: '5rem',
                  height: '5rem',
                  margin: '0 auto 1.5rem',
                  borderRadius: '1.25rem',
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 40px rgba(168,85,247,0.3)',
                }}>
                  <svg style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'white',
                  marginBottom: '0.5rem',
                }}>
                  No Recording Found
                </h1>
                <p style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '1rem',
                }}>
                  This game wasn't recorded with <span style={{ color: '#a855f7', fontWeight: 600 }}>Nexra Vision</span>
                </p>
              </div>

              {/* Divider */}
              <div style={{
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.3), transparent)',
                marginBottom: '2rem',
              }} />

              {/* Nexra Vision Info */}
              <div style={{
                textAlign: 'center',
                marginBottom: '2rem',
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'white',
                  marginBottom: '0.75rem',
                }}>
                  Get Nexra Vision
                </h2>
                <p style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.95rem',
                  lineHeight: 1.7,
                  maxWidth: '32rem',
                  margin: '0 auto',
                }}>
                  Our desktop application runs in the background and automatically records your games,
                  then uploads them for AI-powered analysis of your gameplay.
                </p>
              </div>

              {/* Features Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                marginBottom: '2rem',
              }}>
                <div style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(168,85,247,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg style={{ width: '1.25rem', height: '1.25rem', color: '#a855f7' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>AI-Detected Mistakes</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Positioning errors, missed CS, bad trades</div>
                  </div>
                </div>

                <div style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(236,72,153,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg style={{ width: '1.25rem', height: '1.25rem', color: '#ec4899' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>Video Clips</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Key moments with AI commentary</div>
                  </div>
                </div>

                <div style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(251,191,36,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg style={{ width: '1.25rem', height: '1.25rem', color: '#fbbf24' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>Coaching Tips</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Personalized advice for your rank</div>
                  </div>
                </div>

                <div style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(34,211,238,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg style={{ width: '1.25rem', height: '1.25rem', color: '#22d3ee' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>Performance Scores</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Compare to players at your level</div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div style={{ textAlign: 'center' }}>
                <button
                  disabled
                  style={{
                    padding: '1rem 3rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                    color: 'white',
                    fontWeight: 600,
                    border: 'none',
                    opacity: 0.6,
                    cursor: 'not-allowed',
                    fontSize: '1rem',
                  }}
                >
                  Coming Soon
                </button>
                <p style={{
                  fontSize: '0.8rem',
                  color: 'rgba(255,255,255,0.4)',
                  marginTop: '0.75rem',
                }}>
                  Available for Windows & macOS • Free to use
                </p>
              </div>
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
                  Analyse<span className="animated-dots"></span>
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
                  {activeTab === 'clips' && analysis.clips && (
                    <VideoClipPlayer clips={analysis.clips} />
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
