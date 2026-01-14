'use client';

import { useState, useEffect } from 'react';
import { GameAnalysis, getScoreColor, getScoreLabel } from '@/types/analysis';
import { getChampionImageUrl } from '@/utils/ddragon';
import Image from 'next/image';
import ErrorsList from './ErrorsList';
import CoachingTips from './CoachingTips';
import VideoClipPlayer from './VideoClipPlayer';
import StatsComparison from './StatsComparison';
import DeathClipsSection from './DeathClipsSection';

interface GameAnalysisModalProps {
  analysis: GameAnalysis;
  onClose: () => void;
}

type TabType = 'summary' | 'deaths' | 'errors' | 'tips' | 'clips' | 'stats';

export default function GameAnalysisModal({ analysis, onClose }: GameAnalysisModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [imageError, setImageError] = useState(false);

  const scoreColor = getScoreColor(analysis.stats?.overallScore || 0);
  const scoreLabel = getScoreLabel(analysis.stats?.overallScore || 0);
  const isWin = analysis.result === 'win';

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const performanceSummary = analysis.stats?.performanceSummary;

  const deathClipsCount = analysis.clips?.filter(c => c.type === 'death').length || 0;

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'summary', label: 'Résumé' },
    { id: 'deaths', label: 'Morts', count: deathClipsCount },
    { id: 'errors', label: 'Erreurs', count: analysis.errors?.length || 0 },
    { id: 'tips', label: 'Conseils', count: analysis.tips?.length || 0 },
    { id: 'clips', label: 'Clips Vidéo', count: analysis.clips?.length || 0 },
    { id: 'stats', label: 'Stats' },
  ];

  return (
    <div style={styles.overlay}>
      {/* Backdrop */}
      <div style={styles.backdrop} onClick={onClose} />

      {/* Modal */}
      <div style={styles.modal}>
        {/* Header */}
        <div style={{
          ...styles.header,
          background: `linear-gradient(135deg, ${isWin ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)'} 0%, transparent 50%)`,
        }}>
          <div style={styles.headerContent}>
            <div style={styles.headerLeft}>
              {/* Champion Icon */}
              <div style={{
                ...styles.championIcon,
                borderColor: isWin ? '#00ff88' : '#ff3366',
              }}>
                {!imageError ? (
                  <Image
                    src={getChampionImageUrl(analysis.champion)}
                    alt={analysis.champion}
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div style={styles.championFallback}>
                    <span>{analysis.champion[0]}</span>
                  </div>
                )}
              </div>

              {/* Game Info */}
              <div>
                <div style={styles.titleRow}>
                  <h2 style={styles.title}>{analysis.champion}</h2>
                  <span style={{
                    ...styles.resultBadge,
                    backgroundColor: isWin ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 51, 102, 0.2)',
                    color: isWin ? '#00ff88' : '#ff3366',
                  }}>
                    {isWin ? 'VICTOIRE' : 'DÉFAITE'}
                  </span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaItem}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDuration(analysis.duration)}
                  </span>
                  <span style={styles.metaItem}>{analysis.gameMode}</span>
                  <span style={styles.kdaText}>
                    {analysis.kills}/{analysis.deaths}/{analysis.assists}
                  </span>
                </div>
              </div>
            </div>

            {/* Score */}
            {analysis.stats && (
              <div style={styles.scoreSection}>
                <div>
                  <div style={styles.scoreLabel}>Performance Score</div>
                  <div style={{ ...styles.scoreValue, color: scoreColor }}>
                    {analysis.stats.overallScore}
                  </div>
                </div>
                <div style={{
                  ...styles.scoreBadge,
                  backgroundColor: `${scoreColor}20`,
                  color: scoreColor,
                }}>
                  {scoreLabel}
                </div>
              </div>
            )}

            {/* Close Button */}
            <button onClick={onClose} style={styles.closeButton}>
              <svg width="20" height="20" fill="none" stroke="rgba(255,255,255,0.6)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabBar}>
          <div style={styles.tabContainer}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.tab,
                  color: activeTab === tab.id ? '#00d4ff' : 'rgba(255,255,255,0.6)',
                  borderBottomColor: activeTab === tab.id ? '#00d4ff' : 'transparent',
                }}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{
                    ...styles.tabCount,
                    backgroundColor: activeTab === tab.id ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.1)',
                    color: activeTab === tab.id ? '#00d4ff' : 'rgba(255,255,255,0.6)',
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
              {/* Overall Assessment */}
              {performanceSummary && (
                <>
                  <div style={styles.card}>
                    <h3 style={styles.cardTitle}>
                      <svg width="20" height="20" fill="none" stroke="#00d4ff" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Évaluation Globale
                    </h3>
                    <p style={styles.cardText}>{performanceSummary.overallAssessment}</p>
                    {performanceSummary.estimatedRank && (
                      <div style={styles.rankRow}>
                        <span style={styles.rankLabel}>Rang estimé:</span>
                        <span style={styles.rankValue}>{performanceSummary.estimatedRank}</span>
                      </div>
                    )}
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div style={styles.twoColumn}>
                    {/* Strengths */}
                    <div style={{ ...styles.card, borderColor: 'rgba(0,255,136,0.2)' }}>
                      <h4 style={{ ...styles.cardSubtitle, color: '#00ff88' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Points Forts
                      </h4>
                      <ul style={styles.list}>
                        {performanceSummary.strengths.map((strength, i) => (
                          <li key={i} style={styles.listItem}>
                            <span style={{ color: '#00ff88', marginRight: 8 }}>+</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div style={{ ...styles.card, borderColor: 'rgba(255,51,102,0.2)' }}>
                      <h4 style={{ ...styles.cardSubtitle, color: '#ff3366' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Points à Améliorer
                      </h4>
                      <ul style={styles.list}>
                        {performanceSummary.weaknesses.map((weakness, i) => (
                          <li key={i} style={styles.listItem}>
                            <span style={{ color: '#ff3366', marginRight: 8 }}>-</span>
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Improvement Plan */}
                  <div style={styles.card}>
                    <h3 style={styles.cardTitle}>
                      <svg width="20" height="20" fill="none" stroke="#ffd700" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Plan d&apos;Amélioration
                    </h3>
                    <div style={styles.planGrid}>
                      {/* Immediate */}
                      <div style={styles.planSection}>
                        <h5 style={{ ...styles.planTitle, color: '#00d4ff' }}>
                          Immédiat (Prochaine Game)
                        </h5>
                        <ul style={styles.planList}>
                          {performanceSummary.improvementPlan.immediate.map((item, i) => (
                            <li key={i} style={styles.planItem}>
                              <span style={{ color: '#00d4ff' }}>→</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Short Term */}
                      <div style={styles.planSection}>
                        <h5 style={{ ...styles.planTitle, color: '#a855f7' }}>
                          Court Terme (Cette Semaine)
                        </h5>
                        <ul style={styles.planList}>
                          {performanceSummary.improvementPlan.shortTerm.map((item, i) => (
                            <li key={i} style={styles.planItem}>
                              <span style={{ color: '#a855f7' }}>→</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Long Term */}
                      <div style={styles.planSection}>
                        <h5 style={{ ...styles.planTitle, color: '#f97316' }}>
                          Long Terme (Ce Mois)
                        </h5>
                        <ul style={styles.planList}>
                          {performanceSummary.improvementPlan.longTerm.map((item, i) => (
                            <li key={i} style={styles.planItem}>
                              <span style={{ color: '#f97316' }}>→</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Rank Up Tip */}
                    {performanceSummary.rankUpTip && (
                      <div style={styles.tipBox}>
                        <div style={styles.tipContent}>
                          <svg width="20" height="20" fill="#ffd700" viewBox="0 0 24 24">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                          </svg>
                          <div>
                            <span style={styles.tipLabel}>Conseil pour Monter</span>
                            <p style={styles.tipText}>{performanceSummary.rankUpTip}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Fallback if no summary */}
              {!performanceSummary && (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>
                    <svg width="32" height="32" fill="none" stroke="rgba(255,255,255,0.4)" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p style={styles.emptyText}>Le résumé de performance sera disponible avec les prochaines analyses.</p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'deaths' && analysis.clips && (
            <DeathClipsSection clips={analysis.clips} matchId={analysis.matchId} />
          )}
          {activeTab === 'errors' && analysis.errors && (
            <ErrorsList errors={analysis.errors} matchId={analysis.matchId} />
          )}
          {activeTab === 'tips' && analysis.tips && (
            <CoachingTips tips={analysis.tips} />
          )}
          {activeTab === 'clips' && analysis.clips && (
            <VideoClipPlayer clips={analysis.clips} matchId={analysis.matchId} />
          )}
          {activeTab === 'stats' && analysis.stats && (
            <StatsComparison stats={analysis.stats} />
          )}
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(4px)',
  },
  modal: {
    position: 'relative',
    width: '100%',
    maxWidth: 1000,
    maxHeight: '90vh',
    margin: 16,
    backgroundColor: '#0a0e13',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: 24,
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  championIcon: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    border: '2px solid',
  },
  championFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    color: 'rgba(255,255,255,0.6)',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: 'white',
    margin: 0,
  },
  resultBadge: {
    padding: '4px 12px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 14,
  },
  kdaText: {
    fontWeight: 600,
    color: 'white',
  },
  scoreSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    textAlign: 'right',
  },
  scoreLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: 700,
  },
  scoreBadge: {
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  tabBar: {
    padding: '0 24px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  tabContainer: {
    display: 'flex',
    gap: 4,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    fontSize: 14,
    fontWeight: 500,
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    marginBottom: -1,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabCount: {
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 12,
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: 24,
  },
  summaryContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  card: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 18,
    fontWeight: 700,
    color: 'white',
    marginBottom: 12,
  },
  cardSubtitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 12,
  },
  cardText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 1.6,
    margin: 0,
  },
  rankRow: {
    marginTop: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  rankLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  rankValue: {
    padding: '8px 16px',
    borderRadius: 8,
    background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(99,102,241,0.2))',
    color: '#00d4ff',
    fontWeight: 700,
    fontSize: 14,
    border: '1px solid rgba(0,212,255,0.3)',
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  planGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    marginTop: 16,
  },
  planSection: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  planTitle: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 12,
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
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.5,
  },
  tipBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 10,
    background: 'linear-gradient(135deg, rgba(255,215,0,0.1), transparent)',
    border: '1px solid rgba(255,215,0,0.3)',
  },
  tipContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#ffd700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    margin: 0,
    lineHeight: 1.5,
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 20px',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    margin: '0 auto 16px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
};
