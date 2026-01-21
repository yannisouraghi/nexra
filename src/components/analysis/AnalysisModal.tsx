'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { MatchForAnalysis, getScoreColor, getScoreLabel, AnalysisStats } from '@/types/analysis';
import { getChampionImageUrl, getChampionCenteredSplashUrl } from '@/utils/ddragon';
import ErrorsList from './ErrorsList';
import CoachingTips from './CoachingTips';
import StatsComparison from './StatsComparison';
import DeathsAnalysis from './DeathsAnalysis';

interface AnalysisData {
  id: string;
  matchId: string;
  stats?: AnalysisStats;
  errors?: any[];
  tips?: any[];
}

interface AnalysisModalProps {
  match: MatchForAnalysis;
  analysisData: AnalysisData | null;
  isAnalyzing: boolean;
  onClose: () => void;
}

type TabType = 'summary' | 'deaths' | 'errors' | 'tips' | 'stats';

export default function AnalysisModal({
  match,
  analysisData,
  isAnalyzing,
  onClose,
}: AnalysisModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [imageError, setImageError] = useState(false);

  // Modal only opens when analysis is completed - no auto-start needed

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const isCompleted = analysisData !== null;
  const scoreColor = isCompleted ? getScoreColor(analysisData.stats?.overallScore || 0) : '#00d4ff';
  const scoreLabel = isCompleted ? getScoreLabel(analysisData.stats?.overallScore || 0) : '';
  const isWin = match.result === 'win';
  const performanceSummary = analysisData?.stats?.performanceSummary;
  const champSplashUrl = match.champion !== 'Unknown' ? getChampionCenteredSplashUrl(match.champion) : null;

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const kda = match.deaths > 0
    ? ((match.kills + match.assists) / match.deaths).toFixed(2)
    : 'Perfect';

  const deathsAnalysis = analysisData?.stats?.deathsAnalysis;

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'summary', label: 'Summary' },
    { id: 'deaths', label: 'Deaths', count: deathsAnalysis?.length || match.deaths || 0 },
    { id: 'errors', label: 'Errors', count: analysisData?.errors?.length || 0 },
    { id: 'tips', label: 'Tips', count: analysisData?.tips?.length || 0 },
    { id: 'stats', label: 'Stats' },
  ];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button style={styles.closeButton} onClick={onClose}>
          <X size={24} />
        </button>

        {/* Hero Section */}
        <div style={styles.hero}>
          {champSplashUrl && !imageError && (
            <>
              <img
                src={champSplashUrl}
                alt={match.champion}
                style={styles.heroImage}
                onError={() => setImageError(true)}
              />
              <div style={styles.heroOverlay} />
            </>
          )}

          {/* Hero Content */}
          <div style={styles.heroContent}>
            <div style={styles.heroMain}>
              {/* Champion Icon */}
              <div style={{
                ...styles.championIcon,
                borderColor: isWin ? '#00ff88' : '#ff3366',
                boxShadow: `0 0 30px ${isWin ? 'rgba(0,255,136,0.4)' : 'rgba(255,51,102,0.4)'}`,
              }}>
                <img
                  src={getChampionImageUrl(match.champion)}
                  alt={match.champion}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Info */}
              <div style={styles.heroInfo}>
                <div style={styles.heroTitleRow}>
                  <h1 style={styles.heroTitle}>{match.champion}</h1>
                  <span style={{
                    ...styles.resultBadge,
                    backgroundColor: isWin ? 'rgba(0,255,136,0.15)' : 'rgba(255,51,102,0.15)',
                    color: isWin ? '#00ff88' : '#ff3366',
                    borderColor: isWin ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)',
                  }}>
                    {isWin ? 'VICTORY' : 'DEFEAT'}
                  </span>
                </div>

                <div style={styles.heroMeta}>
                  <span style={styles.metaItem}>{formatDuration(match.gameDuration)}</span>
                  <span style={styles.metaDivider}>•</span>
                  <span style={styles.metaItem}>{match.gameMode || 'Ranked'}</span>
                  <span style={styles.metaDivider}>•</span>
                  <span style={styles.kdaDisplay}>
                    <span style={{ color: '#00ff88' }}>{match.kills}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
                    <span style={{ color: '#ff3366' }}>{match.deaths}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
                    <span style={{ color: '#00d4ff' }}>{match.assists}</span>
                    <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.5)' }}>({kda} KDA)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Score */}
            {isCompleted && analysisData.stats && (
              <div style={styles.scoreCard}>
                <div style={styles.scoreValue}>
                  <span style={{ color: scoreColor, fontSize: 48, fontWeight: 700 }}>
                    {analysisData.stats.overallScore}
                  </span>
                </div>
                <span style={{
                  ...styles.scoreLabel,
                  backgroundColor: `${scoreColor}20`,
                  color: scoreColor,
                  borderColor: `${scoreColor}40`,
                }}>
                  {scoreLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isAnalyzing && !isCompleted && (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingContent}>
              <div style={styles.spinner} />
              <h3 style={styles.loadingTitle}>Analyzing your game...</h3>
              <p style={styles.loadingText}>
                We're reviewing your deaths, CS, vision, and objectives. This takes a few seconds.
              </p>
              <div style={styles.loadingSteps}>
                <div style={styles.loadingStep}>
                  <div style={{ ...styles.stepDot, backgroundColor: '#00d4ff' }} />
                  <span>Fetching match data</span>
                </div>
                <div style={styles.loadingStep}>
                  <div style={{ ...styles.stepDot, backgroundColor: 'rgba(0,212,255,0.5)' }} />
                  <span>Analyzing deaths & positioning</span>
                </div>
                <div style={styles.loadingStep}>
                  <div style={{ ...styles.stepDot, backgroundColor: 'rgba(0,212,255,0.3)' }} />
                  <span>Evaluating CS & vision</span>
                </div>
                <div style={styles.loadingStep}>
                  <div style={{ ...styles.stepDot, backgroundColor: 'rgba(0,212,255,0.2)' }} />
                  <span>Generating recommendations</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Content */}
        {isCompleted && (
          <>
            {/* Tabs */}
            <div style={styles.tabBar}>
              <div style={styles.tabContainer}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      ...styles.tab,
                      color: activeTab === tab.id ? '#00d4ff' : 'rgba(255,255,255,0.5)',
                      borderBottomColor: activeTab === tab.id ? '#00d4ff' : 'transparent',
                      backgroundColor: activeTab === tab.id ? 'rgba(0,212,255,0.1)' : 'transparent',
                    }}
                  >
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span style={{
                        ...styles.tabCount,
                        backgroundColor: activeTab === tab.id ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.1)',
                        color: activeTab === tab.id ? '#00d4ff' : 'rgba(255,255,255,0.5)',
                      }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div style={styles.content}>
              {activeTab === 'summary' && (
                <div style={styles.summaryContent}>
                  {performanceSummary ? (
                    <>
                      {/* Assessment Card */}
                      <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Overall Assessment</h3>
                        <p style={styles.cardText}>{performanceSummary.overallAssessment}</p>
                        {performanceSummary.estimatedRank && (
                          <div style={styles.rankRow}>
                            <span style={styles.rankLabel}>Estimated rank:</span>
                            <span style={styles.rankValue}>{performanceSummary.estimatedRank}</span>
                          </div>
                        )}
                      </div>

                      {/* Strengths & Weaknesses */}
                      <div style={styles.twoColumn}>
                        <div style={{ ...styles.card, borderColor: 'rgba(0,255,136,0.2)' }}>
                          <h4 style={{ ...styles.cardSubtitle, color: '#00ff88' }}>Strengths</h4>
                          <ul style={styles.list}>
                            {performanceSummary.strengths.map((item, i) => (
                              <li key={i} style={styles.listItem}>
                                <span style={{ color: '#00ff88', marginRight: 12 }}>+</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div style={{ ...styles.card, borderColor: 'rgba(255,51,102,0.2)' }}>
                          <h4 style={{ ...styles.cardSubtitle, color: '#ff3366' }}>Areas to Improve</h4>
                          <ul style={styles.list}>
                            {performanceSummary.weaknesses.map((item, i) => (
                              <li key={i} style={styles.listItem}>
                                <span style={{ color: '#ff3366', marginRight: 12 }}>−</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Improvement Plan */}
                      <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Improvement Plan</h3>
                        <div style={styles.threeColumn}>
                          <div style={styles.planSection}>
                            <h5 style={{ ...styles.planTitle, color: '#00d4ff' }}>Immediate</h5>
                            <ul style={styles.planList}>
                              {performanceSummary.improvementPlan.immediate.map((item, i) => (
                                <li key={i} style={styles.planItem}>→ {item}</li>
                              ))}
                            </ul>
                          </div>
                          <div style={styles.planSection}>
                            <h5 style={{ ...styles.planTitle, color: '#a855f7' }}>Short Term</h5>
                            <ul style={styles.planList}>
                              {performanceSummary.improvementPlan.shortTerm.map((item, i) => (
                                <li key={i} style={styles.planItem}>→ {item}</li>
                              ))}
                            </ul>
                          </div>
                          <div style={styles.planSection}>
                            <h5 style={{ ...styles.planTitle, color: '#f97316' }}>Long Term</h5>
                            <ul style={styles.planList}>
                              {performanceSummary.improvementPlan.longTerm.map((item, i) => (
                                <li key={i} style={styles.planItem}>→ {item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {performanceSummary.rankUpTip && (
                          <div style={styles.tipBox}>
                            <span style={styles.tipLabel}>Tip to Climb</span>
                            <p style={styles.tipText}>{performanceSummary.rankUpTip}</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={styles.emptyState}>
                      <p style={styles.emptyText}>Summary not available. The analysis may have encountered an issue.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'deaths' && (
                <div>
                  <DeathsAnalysis deathsAnalysis={deathsAnalysis || []} />
                </div>
              )}

              {activeTab === 'errors' && (
                <div>
                  {analysisData.errors && analysisData.errors.length > 0 ? (
                    <ErrorsList errors={analysisData.errors} matchId={match.matchId} />
                  ) : (
                    <div style={styles.emptyState}>
                      <p style={{ ...styles.emptyText, color: '#00ff88' }}>No major errors detected. Great game!</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tips' && (
                <div>
                  {analysisData.tips && analysisData.tips.length > 0 ? (
                    <CoachingTips tips={analysisData.tips} />
                  ) : (
                    <div style={styles.emptyState}>
                      <p style={styles.emptyText}>No tips available.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'stats' && (
                <div>
                  {analysisData.stats ? (
                    <StatsComparison stats={analysisData.stats} />
                  ) : (
                    <div style={styles.emptyState}>
                      <p style={styles.emptyText}>Statistics not available.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
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
    animation: 'fadeIn 0.2s ease-out',
  },
  modal: {
    position: 'relative',
    width: '100%',
    maxWidth: 1100,
    maxHeight: '90vh',
    backgroundColor: '#0f0f0f',
    borderRadius: 20,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 50,
    width: 44,
    height: 44,
    borderRadius: '50%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  hero: {
    position: 'relative',
    height: 240,
    flexShrink: 0,
    overflow: 'hidden',
  },
  heroImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center top',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(15,15,15,1) 100%)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '0 32px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heroMain: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 20,
  },
  championIcon: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    border: '3px solid',
    flexShrink: 0,
  },
  heroInfo: {
    paddingBottom: 4,
  },
  heroTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: 'white',
    margin: 0,
  },
  resultBadge: {
    padding: '4px 12px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.05em',
    border: '1px solid',
  },
  heroMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'rgba(255,255,255,0.6)',
  },
  metaItem: {
    fontSize: 13,
    fontWeight: 500,
  },
  metaDivider: {
    color: 'rgba(255,255,255,0.2)',
  },
  kdaDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    fontWeight: 600,
  },
  scoreCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '16px 24px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(10px)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  scoreValue: {
    textAlign: 'center',
  },
  scoreLabel: {
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: '1px solid',
  },
  loadingContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  loadingContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 20,
  },
  spinner: {
    width: 56,
    height: 56,
    border: '4px solid rgba(0,212,255,0.2)',
    borderTopColor: '#00d4ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: 'white',
    margin: 0,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    margin: 0,
    maxWidth: 400,
    lineHeight: 1.6,
  },
  loadingSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 16,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  loadingStep: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  tabBar: {
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  tabContainer: {
    display: 'flex',
    gap: 4,
    padding: '0 32px',
  },
  tab: {
    padding: '14px 18px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    borderRadius: '8px 8px 0 0',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: 'all 0.2s',
  },
  tabCount: {
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 500,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 32,
  },
  summaryContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 24,
    border: '1px solid rgba(255,255,255,0.08)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: 'white',
    marginBottom: 14,
    margin: 0,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 14,
    margin: 0,
  },
  cardText: {
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.7,
    fontSize: 14,
    marginBottom: 16,
    margin: 0,
  },
  rankRow: {
    marginTop: 20,
    paddingTop: 16,
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  rankLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  rankValue: {
    padding: '6px 16px',
    borderRadius: 8,
    background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(99,102,241,0.15))',
    color: '#00d4ff',
    fontWeight: 600,
    fontSize: 13,
    border: '1px solid rgba(0,212,255,0.3)',
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 20,
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.6,
    fontSize: 13,
  },
  threeColumn: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    marginTop: 20,
  },
  planSection: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  planTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 12,
    margin: 0,
  },
  planList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  planItem: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 1.5,
  },
  tipBox: {
    marginTop: 20,
    padding: 20,
    borderRadius: 10,
    background: 'linear-gradient(135deg, rgba(255,215,0,0.08), transparent)',
    border: '1px solid rgba(255,215,0,0.2)',
  },
  tipLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: '#ffd700',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 8,
  },
  tipText: {
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.6,
    fontSize: 13,
    margin: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 40px',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
  },
};
