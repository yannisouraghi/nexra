'use client';

import { useState, useRef, useEffect } from 'react';
import { VideoClip, formatTimestamp, getSeverityColor, getSeverityLabel, ErrorSeverity } from '@/types/analysis';

interface DeathClipsSectionProps {
  clips: VideoClip[];
  matchId?: string;
}

const API_URL = process.env.NEXT_PUBLIC_NEXRA_API_URL || 'http://localhost:8787';

// Severity order for sorting (most severe first)
const severityOrder: Record<ErrorSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export default function DeathClipsSection({ clips, matchId }: DeathClipsSectionProps) {
  // Filter death clips OR clips that have aiAnalysis (which means they're analyzed deaths)
  // Also include clips where title/description contains "mort" (death in French)
  const deathClips = clips
    .filter(clip =>
      clip.type === 'death' ||
      clip.aiAnalysis !== undefined ||
      clip.title?.toLowerCase().includes('mort') ||
      clip.description?.toLowerCase().includes('mort')
    )
    .sort((a, b) => {
      const severityA = a.aiAnalysis?.severity || 'medium';
      const severityB = b.aiAnalysis?.severity || 'medium';
      return severityOrder[severityA] - severityOrder[severityB];
    });

  const [expandedClip, setExpandedClip] = useState<string | null>(null);
  const [playingClip, setPlayingClip] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<Record<string, boolean>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const videoUrl = matchId ? `${API_URL}/recordings/${matchId}/video` : null;

  const handlePlayClip = (clipId: string, clip: VideoClip) => {
    const video = videoRefs.current[clipId];
    if (!video) return;

    if (playingClip === clipId) {
      video.pause();
      setPlayingClip(null);
    } else {
      // Pause any other playing video
      if (playingClip && videoRefs.current[playingClip]) {
        videoRefs.current[playingClip]?.pause();
      }

      // Seek to clip start and play
      const startTime = clip.startTime || clip.timestamp - 5;
      video.currentTime = Math.max(0, startTime);
      video.play();
      setPlayingClip(clipId);
    }
  };

  const handleTimeUpdate = (clipId: string, clip: VideoClip) => {
    const video = videoRefs.current[clipId];
    if (!video) return;

    const endTime = clip.endTime || clip.timestamp + 10;
    if (video.currentTime >= endTime) {
      video.pause();
      setPlayingClip(null);
    }
  };

  if (deathClips.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>
          <svg width="48" height="48" fill="none" stroke="rgba(255,255,255,0.3)" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 style={styles.emptyTitle}>Aucune mort enregistrée</h3>
        <p style={styles.emptyText}>
          Bravo ! Tu n'es pas mort pendant cette partie, ou les clips n'ont pas été générés.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <svg width="24" height="24" fill="none" stroke="#ff6b35" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 style={styles.title}>Analyse de tes Morts</h2>
            <p style={styles.subtitle}>{deathClips.length} mort{deathClips.length > 1 ? 's' : ''} analysée{deathClips.length > 1 ? 's' : ''} par l'IA</p>
          </div>
        </div>
      </div>

      <div style={styles.clipsGrid}>
        {deathClips.map((clip, index) => {
          const isExpanded = expandedClip === clip.id;
          const isPlaying = playingClip === clip.id;
          const hasError = videoError[clip.id];
          const severity = clip.aiAnalysis?.severity || 'medium';
          const severityColor = getSeverityColor(severity);

          return (
            <div
              key={clip.id}
              style={{
                ...styles.clipCard,
                borderColor: isExpanded ? severityColor : 'rgba(255,255,255,0.08)',
              }}
            >
              {/* Death Number Badge */}
              <div style={{
                ...styles.deathBadge,
                backgroundColor: `${severityColor}20`,
                color: severityColor,
              }}>
                Mort #{index + 1}
              </div>

              {/* Video Player */}
              <div style={styles.videoContainer}>
                {videoUrl && !hasError ? (
                  <>
                    <video
                      ref={(el) => { videoRefs.current[clip.id] = el; }}
                      src={videoUrl}
                      style={styles.video}
                      preload="metadata"
                      onTimeUpdate={() => handleTimeUpdate(clip.id, clip)}
                      onError={() => setVideoError(prev => ({ ...prev, [clip.id]: true }))}
                      onEnded={() => setPlayingClip(null)}
                    />
                    <button
                      onClick={() => handlePlayClip(clip.id, clip)}
                      style={styles.playButton}
                    >
                      {isPlaying ? (
                        <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                    <div style={styles.timestamp}>
                      {formatTimestamp(clip.timestamp)}
                    </div>
                  </>
                ) : (
                  <div style={styles.videoPlaceholder}>
                    <svg width="32" height="32" fill="none" stroke="rgba(255,255,255,0.3)" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Vidéo non disponible</span>
                  </div>
                )}
              </div>

              {/* Quick Info */}
              <div style={styles.quickInfo}>
                <h3 style={styles.clipTitle}>{clip.title}</h3>
                <div style={styles.severityTag}>
                  <span style={{ ...styles.severityDot, backgroundColor: severityColor }} />
                  {getSeverityLabel(severity)}
                </div>
              </div>

              {/* AI Analysis Section */}
              {clip.aiAnalysis ? (
                <div style={styles.analysisSection}>
                  {/* Death Cause */}
                  <div style={styles.analysisBlock}>
                    <div style={styles.analysisHeader}>
                      <svg width="16" height="16" fill="none" stroke="#ff6b35" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Cause de la mort</span>
                    </div>
                    <p style={styles.analysisText}>{clip.aiAnalysis.deathCause}</p>
                  </div>

                  {/* Mistakes */}
                  {clip.aiAnalysis.mistakes.length > 0 && (
                    <div style={styles.analysisBlock}>
                      <div style={styles.analysisHeader}>
                        <svg width="16" height="16" fill="none" stroke="#ff3366" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Erreurs commises</span>
                      </div>
                      <ul style={styles.mistakesList}>
                        {clip.aiAnalysis.mistakes.map((mistake, i) => (
                          <li key={i} style={styles.mistakeItem}>
                            <span style={styles.mistakeBullet}>•</span>
                            {mistake}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Expand/Collapse for more details */}
                  <button
                    onClick={() => setExpandedClip(isExpanded ? null : clip.id)}
                    style={styles.expandButton}
                  >
                    {isExpanded ? 'Voir moins' : 'Voir les conseils'}
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div style={styles.expandedContent}>
                      {/* Suggestions */}
                      {clip.aiAnalysis.suggestions.length > 0 && (
                        <div style={styles.analysisBlock}>
                          <div style={styles.analysisHeader}>
                            <svg width="16" height="16" fill="none" stroke="#00ff88" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Comment éviter cette mort</span>
                          </div>
                          <ul style={styles.suggestionsList}>
                            {clip.aiAnalysis.suggestions.map((suggestion, i) => (
                              <li key={i} style={styles.suggestionItem}>
                                <span style={styles.suggestionNumber}>{i + 1}</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Situational Advice */}
                      {clip.aiAnalysis.situationalAdvice && (
                        <div style={styles.adviceBox}>
                          <div style={styles.adviceHeader}>
                            <svg width="18" height="18" fill="none" stroke="#00d4ff" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <span>Conseil du Coach IA</span>
                          </div>
                          <p style={styles.adviceText}>{clip.aiAnalysis.situationalAdvice}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div style={styles.noAnalysis}>
                  <p>{clip.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,53,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: 'white',
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    margin: '4px 0 0 0',
  },
  clipsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  clipCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    border: '1px solid',
    overflow: 'hidden',
    transition: 'border-color 0.2s',
  },
  deathBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    borderBottomRightRadius: 12,
  },
  videoContainer: {
    position: 'relative',
    aspectRatio: '16/9',
    backgroundColor: '#000',
    maxHeight: 300,
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  videoPlaceholder: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 56,
    height: 56,
    borderRadius: '50%',
    backgroundColor: 'rgba(0,212,255,0.9)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
    transition: 'transform 0.2s, background-color 0.2s',
  },
  timestamp: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    padding: '4px 10px',
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  quickInfo: {
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  clipTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'white',
    margin: 0,
  },
  severityTag: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: 500,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  analysisSection: {
    padding: 20,
  },
  analysisBlock: {
    marginBottom: 16,
  },
  analysisHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  analysisText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 1.6,
    margin: 0,
  },
  mistakesList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  mistakeItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 1.5,
  },
  mistakeBullet: {
    color: '#ff3366',
    fontWeight: 700,
    fontSize: 18,
    lineHeight: 1,
  },
  expandButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    padding: '12px',
    marginTop: 8,
    backgroundColor: 'rgba(0,212,255,0.1)',
    border: '1px solid rgba(0,212,255,0.2)',
    borderRadius: 10,
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  expandedContent: {
    marginTop: 20,
    paddingTop: 20,
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  suggestionsList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  suggestionItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 1.5,
  },
  suggestionNumber: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(0,255,136,0.15)',
    color: '#00ff88',
    fontSize: 12,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  adviceBox: {
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(0,212,255,0.08)',
    border: '1px solid rgba(0,212,255,0.15)',
  },
  adviceHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    fontSize: 14,
    fontWeight: 700,
    color: '#00d4ff',
  },
  adviceText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    lineHeight: 1.7,
    margin: 0,
  },
  noAnalysis: {
    padding: 20,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  emptyState: {
    padding: 60,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    margin: '0 auto 20px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0,255,136,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: 'white',
    margin: '0 0 8px 0',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    margin: 0,
    maxWidth: 300,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
};
