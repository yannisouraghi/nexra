'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { GameAnalysis, VideoClip, getScoreColor, getScoreLabel } from '@/types/analysis';
import { getChampionImageUrl, getChampionSplashUrl } from '@/utils/ddragon';
import { getAnalysisById, Analysis } from '@/utils/nexraApi';
import Image from 'next/image';
import Link from 'next/link';
import ErrorsList from '@/components/analysis/ErrorsList';
import CoachingTips from '@/components/analysis/CoachingTips';
import VideoClipPlayer from '@/components/analysis/VideoClipPlayer';
import StatsComparison from '@/components/analysis/StatsComparison';

type TabType = 'summary' | 'errors' | 'tips' | 'clips' | 'stats';

function toGameAnalysis(analysis: Analysis): GameAnalysis {
  return {
    id: analysis.id,
    matchId: analysis.matchId,
    puuid: analysis.puuid,
    status: analysis.status,
    createdAt: analysis.createdAt,
    completedAt: analysis.completedAt,
    champion: analysis.champion || 'Unknown',
    result: analysis.result || 'win',
    duration: analysis.duration || 0,
    gameMode: analysis.gameMode || 'Unknown',
    kills: analysis.kills || 0,
    deaths: analysis.deaths || 0,
    assists: analysis.assists || 0,
    stats: analysis.stats,
    errors: analysis.errors,
    tips: analysis.tips,
    clips: analysis.clips,
    errorMessage: analysis.errorMessage,
  };
}

export default function AnalysisPage() {
  const params = useParams();
  const analysisId = params.id as string;

  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [imageError, setImageError] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalysis() {
      try {
        const data = await getAnalysisById(analysisId);
        if (data) {
          setAnalysis(toGameAnalysis(data));
        } else {
          setError('Analyse non trouvée');
        }
      } catch (err) {
        setError('Erreur lors du chargement de l\'analyse');
        console.error(err);
      }
      setLoading(false);
    }

    if (analysisId) {
      loadAnalysis();
    }
  }, [analysisId]);

  // Handler to play clip from error - switches to clips tab and selects the clip
  const handlePlayClipFromError = useCallback((startTime: number, endTime: number) => {
    if (!analysis?.clips) return;

    // Find the clip that matches these timestamps
    const matchingClip = analysis.clips.find(clip => {
      const clipStart = clip.startTime || clip.timestamp - 5;
      const clipEnd = clip.endTime || clip.timestamp + 15;
      // Allow some tolerance in matching (within 2 seconds)
      return Math.abs(clipStart - startTime) < 2 && Math.abs(clipEnd - endTime) < 2;
    });

    if (matchingClip) {
      setSelectedClipId(matchingClip.id);
      setActiveTab('clips');
    }
  }, [analysis?.clips]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Chargement de l'analyse...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>
          <svg width="48" height="48" fill="none" stroke="#ff3366" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 style={styles.errorTitle}>{error || 'Analyse non trouvée'}</h2>
        <p style={styles.errorSubtext}>L'analyse demandée n'existe pas ou a été supprimée.</p>
        <Link href="/dashboard" style={styles.backButton}>
          ← Retour au dashboard
        </Link>
      </div>
    );
  }

  const scoreColor = getScoreColor(analysis.stats?.overallScore || 0);
  const scoreLabel = getScoreLabel(analysis.stats?.overallScore || 0);
  const isWin = analysis.result === 'win';
  const performanceSummary = analysis.stats?.performanceSummary;
  const champSplashUrl = analysis.champion !== 'Unknown' ? getChampionSplashUrl(analysis.champion) : null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const kda = analysis.deaths > 0
    ? ((analysis.kills + analysis.assists) / analysis.deaths).toFixed(2)
    : 'Perfect';

  // Count clips that are linked to errors
  const errorClips = analysis.clips?.filter(c => c.type === 'error') || [];

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'summary', label: 'Résumé' },
    { id: 'errors', label: 'Erreurs', count: analysis.errors?.length || 0 },
    { id: 'tips', label: 'Conseils', count: analysis.tips?.length || 0 },
    { id: 'clips', label: 'Clips', count: errorClips.length },
    { id: 'stats', label: 'Stats' },
  ];

  return (
    <div style={styles.page}>
      {/* Hero Section */}
      <div style={styles.hero}>
        {champSplashUrl && !imageError && (
          <>
            <img
              src={champSplashUrl}
              alt={analysis.champion}
              style={styles.heroImage}
              onError={() => setImageError(true)}
            />
            <div style={styles.heroOverlay} />
          </>
        )}

        {/* Top Nav */}
        <div style={styles.topNav}>
          <Link href="/dashboard" style={styles.navButton}>
            ← Dashboard
          </Link>
        </div>

        {/* Hero Content */}
        <div style={styles.heroContent}>
          <div style={styles.heroMain}>
            {/* Champion Icon */}
            <div style={{
              ...styles.championIcon,
              borderColor: isWin ? '#00ff88' : '#ff3366',
              boxShadow: `0 0 30px ${isWin ? 'rgba(0,255,136,0.4)' : 'rgba(255,51,102,0.4)'}`,
            }}>
              <Image
                src={getChampionImageUrl(analysis.champion)}
                alt={analysis.champion}
                width={100}
                height={100}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Info */}
            <div style={styles.heroInfo}>
              <div style={styles.heroTitleRow}>
                <h1 style={styles.heroTitle}>{analysis.champion}</h1>
                <span style={{
                  ...styles.resultBadge,
                  backgroundColor: isWin ? 'rgba(0,255,136,0.15)' : 'rgba(255,51,102,0.15)',
                  color: isWin ? '#00ff88' : '#ff3366',
                  borderColor: isWin ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)',
                }}>
                  {isWin ? 'VICTOIRE' : 'DÉFAITE'}
                </span>
              </div>

              <div style={styles.heroMeta}>
                <span style={styles.metaItem}>{formatDuration(analysis.duration)}</span>
                <span style={styles.metaDivider}>•</span>
                <span style={styles.metaItem}>{analysis.gameMode}</span>
                <span style={styles.metaDivider}>•</span>
                <span style={styles.kdaDisplay}>
                  <span style={{ color: '#00ff88' }}>{analysis.kills}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
                  <span style={{ color: '#ff3366' }}>{analysis.deaths}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
                  <span style={{ color: '#00d4ff' }}>{analysis.assists}</span>
                  <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.5)' }}>({kda} KDA)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Score */}
          {analysis.stats && (
            <div style={styles.scoreCard}>
              <div style={styles.scoreValue}>
                <span style={{ color: scoreColor, fontSize: 48, fontWeight: 700 }}>
                  {analysis.stats.overallScore}
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
                  <h3 style={styles.cardTitle}>Évaluation Globale</h3>
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
                  <div style={{ ...styles.card, borderColor: 'rgba(0,255,136,0.2)' }}>
                    <h4 style={{ ...styles.cardSubtitle, color: '#00ff88' }}>Points Forts</h4>
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
                    <h4 style={{ ...styles.cardSubtitle, color: '#ff3366' }}>Points à Améliorer</h4>
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
                  <h3 style={styles.cardTitle}>Plan d'Amélioration</h3>
                  <div style={styles.threeColumn}>
                    <div style={styles.planSection}>
                      <h5 style={{ ...styles.planTitle, color: '#00d4ff' }}>Immédiat</h5>
                      <ul style={styles.planList}>
                        {performanceSummary.improvementPlan.immediate.map((item, i) => (
                          <li key={i} style={styles.planItem}>→ {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div style={styles.planSection}>
                      <h5 style={{ ...styles.planTitle, color: '#a855f7' }}>Court Terme</h5>
                      <ul style={styles.planList}>
                        {performanceSummary.improvementPlan.shortTerm.map((item, i) => (
                          <li key={i} style={styles.planItem}>→ {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div style={styles.planSection}>
                      <h5 style={{ ...styles.planTitle, color: '#f97316' }}>Long Terme</h5>
                      <ul style={styles.planList}>
                        {performanceSummary.improvementPlan.longTerm.map((item, i) => (
                          <li key={i} style={styles.planItem}>→ {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {performanceSummary.rankUpTip && (
                    <div style={styles.tipBox}>
                      <span style={styles.tipLabel}>Conseil pour monter</span>
                      <p style={styles.tipText}>{performanceSummary.rankUpTip}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>Résumé non disponible. Relance l'analyse pour obtenir des résultats.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'errors' && (
          <div>
            {analysis.errors && analysis.errors.length > 0 ? (
              <>
                {/* Info banner about clips */}
                {errorClips.length > 0 && (
                  <div style={styles.infoBanner}>
                    <svg width="20" height="20" fill="none" stroke="#00d4ff" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{errorClips.length} erreur{errorClips.length > 1 ? 's' : ''} avec clip vidéo disponible. Clique sur "Voir le clip" pour visionner le moment dans la vidéo.</span>
                  </div>
                )}
                <ErrorsList
                  errors={analysis.errors}
                  matchId={analysis.matchId}
                  onPlayClip={handlePlayClipFromError}
                />
              </>
            ) : (
              <div style={styles.emptyState}>
                <p style={{ ...styles.emptyText, color: '#00ff88' }}>Aucune erreur majeure détectée.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tips' && (
          <div>
            {analysis.tips && analysis.tips.length > 0 ? (
              <CoachingTips tips={analysis.tips} />
            ) : (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>Pas de conseils disponibles.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'clips' && (
          <VideoClipPlayer
            clips={analysis.clips || []}
            matchId={analysis.matchId}
            selectedClipId={selectedClipId}
            onClipSelect={setSelectedClipId}
          />
        )}

        {activeTab === 'stats' && (
          <div>
            {analysis.stats ? (
              <StatsComparison stats={analysis.stats} />
            ) : (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>Statistiques non disponibles.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: 'rgba(255,255,255,0.9)',
  },
  loadingContainer: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  spinner: {
    width: 48,
    height: 48,
    border: '3px solid rgba(0,212,255,0.2)',
    borderTopColor: '#00d4ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  errorContainer: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    backgroundColor: 'rgba(255,51,102,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 600,
    color: 'white',
    marginBottom: 8,
  },
  errorSubtext: {
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 32,
  },
  backButton: {
    padding: '12px 24px',
    backgroundColor: 'rgba(0,212,255,0.1)',
    color: '#00d4ff',
    borderRadius: 12,
    textDecoration: 'none',
    fontWeight: 500,
    border: '1px solid rgba(0,212,255,0.2)',
  },
  hero: {
    position: 'relative',
    height: 300,
    overflow: 'hidden',
  },
  heroImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'top',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(10,10,10,1) 100%)',
  },
  topNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 48px',
  },
  navButton: {
    padding: '10px 20px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(10px)',
    color: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    textDecoration: 'none',
    fontWeight: 500,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '0 48px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heroMain: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 24,
  },
  championIcon: {
    width: 100,
    height: 100,
    borderRadius: 16,
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
    gap: 16,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 700,
    color: 'white',
    margin: 0,
  },
  resultBadge: {
    padding: '6px 16px',
    borderRadius: 8,
    fontSize: 12,
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
    fontSize: 14,
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
    gap: 20,
    padding: '20px 28px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(10px)',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  scoreValue: {
    textAlign: 'center',
  },
  scoreLabel: {
    padding: '8px 16px',
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: '1px solid',
  },
  tabBar: {
    position: 'sticky',
    top: 0,
    zIndex: 20,
    backgroundColor: 'rgba(10,10,10,0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  tabContainer: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 48px',
    display: 'flex',
    gap: 4,
  },
  tab: {
    padding: '16px 20px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: 'all 0.2s',
  },
  tabCount: {
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 500,
  },
  content: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '40px 48px',
  },
  summaryContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 32,
    border: '1px solid rgba(255,255,255,0.08)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: 'white',
    marginBottom: 16,
    margin: 0,
  },
  cardSubtitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 16,
    margin: 0,
  },
  cardText: {
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.7,
    fontSize: 15,
    marginBottom: 20,
    margin: 0,
  },
  rankRow: {
    marginTop: 24,
    paddingTop: 20,
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  rankLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  rankValue: {
    padding: '8px 20px',
    borderRadius: 10,
    background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(99,102,241,0.15))',
    color: '#00d4ff',
    fontWeight: 600,
    border: '1px solid rgba(0,212,255,0.3)',
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 24,
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.6,
    fontSize: 14,
  },
  threeColumn: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 24,
    marginTop: 24,
  },
  planSection: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  planTitle: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 16,
    margin: 0,
  },
  planList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  planItem: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 1.5,
  },
  tipBox: {
    marginTop: 24,
    padding: 24,
    borderRadius: 12,
    background: 'linear-gradient(135deg, rgba(255,215,0,0.08), transparent)',
    border: '1px solid rgba(255,215,0,0.2)',
  },
  tipLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#ffd700',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 8,
  },
  tipText: {
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.6,
    fontSize: 14,
    margin: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 40px',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
  },
  infoBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 20px',
    marginBottom: 24,
    borderRadius: 10,
    backgroundColor: 'rgba(0,212,255,0.08)',
    border: '1px solid rgba(0,212,255,0.2)',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
};
