'use client';

import { MatchForAnalysis, getScoreColor, getStatusColor, getStatusLabel, Role } from '@/types/analysis';
import { getChampionSplashUrl } from '@/utils/ddragon';
import { useState, type JSX } from 'react';
import Link from 'next/link';

interface GameAnalysisCardProps {
  match: MatchForAnalysis;
  onStartAnalysis?: (matchId: string) => void;
  isStarting?: boolean;
}

// Role display labels
const roleLabels: Record<Role, string> = {
  TOP: 'TOP',
  JUNGLE: 'JGL',
  MID: 'MID',
  ADC: 'ADC',
  SUPPORT: 'SUP',
  UNKNOWN: '?',
};

// Role colors for visual distinction
const roleColors: Record<Role, string> = {
  TOP: '#f59e0b',
  JUNGLE: '#22c55e',
  MID: '#8b5cf6',
  ADC: '#ef4444',
  SUPPORT: '#06b6d4',
  UNKNOWN: '#6b7280',
};

// Role Icon component
const RoleIcon = ({ role }: { role: Role }) => {
  const [imageError, setImageError] = useState(false);

  const roleImageUrls: Record<Role, string> = {
    TOP: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png',
    JUNGLE: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-jungle.png',
    MID: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png',
    ADC: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-bottom.png',
    SUPPORT: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-utility.png',
    UNKNOWN: '',
  };

  const imageUrl = roleImageUrls[role];
  const color = roleColors[role];
  const label = roleLabels[role];

  if (role === 'UNKNOWN' || !imageUrl || imageError) {
    return (
      <div style={{
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        backgroundColor: `${color}30`,
        border: `1px solid ${color}50`,
      }}>
        <span style={{
          fontSize: 12,
          fontWeight: 700,
          color: color,
          letterSpacing: '0.05em',
        }}>
          {label}
        </span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={role}
      style={{
        width: 32,
        height: 32,
        filter: 'brightness(1.2)',
      }}
      onError={() => setImageError(true)}
    />
  );
};

// Format game mode for display
const formatGameMode = (gameMode: string | null): string => {
  if (!gameMode) return 'Classic';

  // If backend already sent a properly formatted string, use it
  if (gameMode.includes('Ranked') || gameMode.includes('Normal') ||
      gameMode.includes('ARAM') || gameMode.includes('URF')) {
    return gameMode;
  }

  // Parse legacy gameMode strings from Riot API
  const mode = gameMode.toUpperCase();
  if (mode === 'CLASSIC' || mode === 'MATCHED_GAME') return 'Ranked';
  if (mode === 'ARAM') return 'ARAM';
  if (mode === 'URF' || mode === 'ARURF') return 'URF';
  if (mode === 'ONEFORALL') return 'One for All';
  if (mode === 'PRACTICETOOL') return 'Practice';
  if (mode === 'TUTORIAL') return 'Tutorial';
  if (mode === 'PRACTICE TOOL') return 'Practice';

  return gameMode;
};

// Processing animation component with progress
const ProcessingAnimation = ({ progress }: { progress: number | null }) => {
  const displayProgress = progress ?? 0;
  const circumference = 2 * Math.PI * 35;
  const strokeDashoffset = circumference - (displayProgress / 100) * circumference;

  return (
    <div style={styles.processingContainer}>
      <div style={styles.processingRing}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke="rgba(0, 212, 255, 0.15)"
            strokeWidth="5"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke="#00d4ff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
              transition: 'stroke-dashoffset 0.5s ease',
            }}
          />
        </svg>
        {/* Percentage in center */}
        <div style={styles.progressPercent}>{displayProgress}%</div>
      </div>
      <div style={styles.processingText}>
        Analyzing<span className="animated-dots"></span>
      </div>
      <style>{`
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
};

// Start button component
const StartAnalysisButton = ({ onClick, isLoading }: { onClick: () => void; isLoading?: boolean }) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    disabled={isLoading}
    style={{
      ...styles.startButton,
      opacity: isLoading ? 0.7 : 1,
      cursor: isLoading ? 'not-allowed' : 'pointer',
    }}
  >
    {isLoading ? (
      <>
        <div style={styles.buttonSpinner} />
        <span>Starting...</span>
      </>
    ) : (
      <>
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Start Analysis</span>
      </>
    )}
  </button>
);

export default function GameAnalysisCard({ match, onStartAnalysis, isStarting }: GameAnalysisCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const status = match.analysisStatus;
  const isCompleted = status === 'completed';
  const isProcessing = status === 'processing';
  const isPending = status === 'pending';
  const isNotStarted = status === 'not_started';
  const isFailed = status === 'failed';

  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  // Map role string to Role type
  const roleMap: Record<string, Role> = {
    'TOP': 'TOP',
    'JUNGLE': 'JUNGLE',
    'MID': 'MID',
    'MIDDLE': 'MID',
    'ADC': 'ADC',
    'BOTTOM': 'ADC',
    'BOT': 'ADC',
    'SUPPORT': 'SUPPORT',
    'UTILITY': 'SUPPORT',
    'SUP': 'SUPPORT',
  };
  const normalizedRole = match.role?.toUpperCase() || '';
  const role: Role = roleMap[normalizedRole] || 'UNKNOWN';

  const scoreColor = isCompleted ? getScoreColor(match.overallScore) : statusColor;
  const isWin = match.result === 'win';

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString.replace(' ', 'T') + 'Z');
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const kda = match.deaths > 0
    ? ((match.kills + match.assists) / match.deaths).toFixed(2)
    : 'Perfect';

  const champion = match.champion || 'Unknown';
  const champSplashUrl = champion !== 'Unknown' ? getChampionSplashUrl(champion) : null;

  // Handle click - only navigate if completed
  const handleClick = (e: React.MouseEvent) => {
    if (!isCompleted) {
      e.preventDefault();
    }
  };

  const cardContent = (
    <>
      {/* Background Image */}
      {champSplashUrl && !imageError ? (
        <div style={styles.bgContainer}>
          <img
            src={champSplashUrl}
            alt={champion}
            style={{
              ...styles.bgImage,
              opacity: isProcessing ? 0.3 : 0.7,
              filter: isProcessing ? 'blur(2px)' : 'none',
            }}
            onError={() => setImageError(true)}
          />
          <div style={styles.bgOverlay} />
        </div>
      ) : (
        <div style={styles.bgFallback} />
      )}

      {/* Top Left - Date */}
      <span style={styles.timeAgo}>
        {formatTimeAgo(match.timestamp ? new Date(match.timestamp).toISOString() : null)}
      </span>

      {/* Top Right - Victory/Defeat Badge */}
      {match.result && (
        <span style={{
          ...styles.resultBadge,
          backgroundColor: isWin ? 'rgba(0, 255, 136, 0.25)' : 'rgba(255, 51, 102, 0.25)',
          color: isWin ? '#00ff88' : '#ff3366',
        }}>
          {isWin ? 'VICTORY' : 'DEFEAT'}
        </span>
      )}

      {/* Status Badge - Different display based on status */}
      {isCompleted ? (
        /* Completed: Subtle checkmark icon */
        <div style={styles.completedIcon}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
            <path stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L19 7" />
          </svg>
        </div>
      ) : isProcessing ? (
        /* Processing: No badge, the animation is enough */
        null
      ) : (
        /* Other statuses: Full badge centered */
        <div style={{
          ...styles.statusBadge,
          backgroundColor: `${statusColor}25`,
          color: statusColor,
          borderColor: `${statusColor}50`,
        }}>
          {statusLabel}
        </div>
      )}

      {/* Content Container */}
      <div style={styles.content}>

        {/* Middle Section - Different content based on status */}
        <div style={styles.middleSection}>
          {isProcessing ? (
            <ProcessingAnimation progress={null} />
          ) : isNotStarted || isPending ? (
            <div style={styles.pendingContainer}>
              {role !== 'UNKNOWN' && (
                <div style={styles.roleIcon}>
                  <RoleIcon role={role} />
                </div>
              )}
              <StartAnalysisButton
                onClick={() => onStartAnalysis?.(match.matchId)}
                isLoading={isStarting}
              />
            </div>
          ) : isFailed ? (
            <div style={styles.failedContainer}>
              <div style={styles.failedIcon}>
                <svg width="40" height="40" fill="none" stroke="#ff3366" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div style={styles.failedText}>Analysis failed</div>
            </div>
          ) : (
            <>
              <div style={styles.roleIcon}>
                <RoleIcon role={role} />
              </div>
              <div style={{
                ...styles.scoreBadge,
                backgroundColor: `${scoreColor}25`,
                color: scoreColor,
                borderColor: `${scoreColor}60`,
              }}>
                {match.overallScore} pts
              </div>
            </>
          )}
        </div>

        {/* Bottom Section */}
        <div style={styles.bottomSection}>
          <h3 style={styles.championName}>{champion}</h3>

          {/* KDA - Only show if we have game data */}
          {match.result && (
            <div style={styles.kdaRow}>
              <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 18 }}>{match.kills}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }}>/</span>
              <span style={{ color: '#f87171', fontWeight: 700, fontSize: 18 }}>{match.deaths}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }}>/</span>
              <span style={{ color: '#22d3ee', fontWeight: 700, fontSize: 18 }}>{match.assists}</span>
              <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>({kda})</span>
            </div>
          )}

          {/* Game Mode & Duration */}
          <div style={styles.metaRow}>
            <span style={styles.metaText}>{formatGameMode(match.gameMode)}</span>
            <span style={styles.metaDot}>•</span>
            <span style={styles.metaText}>{formatDuration(match.gameDuration)}</span>
          </div>

          {/* Errors - Only show if completed */}
          {isCompleted && match.errorsCount > 0 && (
            <div style={styles.errorsRow}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{match.errorsCount} errors detected</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover Effect - View Button (only for completed) */}
      {isCompleted && (
        <div style={{
          ...styles.hoverOverlay,
          opacity: isHovered ? 1 : 0,
        }}>
          <div style={styles.viewButton}>
            <span>View Analysis</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      )}
    </>
  );

  // Wrap in Link only if completed
  if (isCompleted && match.analysisId) {
    return (
      <Link
        href={`/dashboard/analysis/${match.analysisId}`}
        style={{
          ...styles.card,
          borderColor: isWin ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 51, 102, 0.4)',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          boxShadow: isHovered ? '0 0 30px rgba(0,212,255,0.3)' : 'none',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {cardContent}
      </Link>
    );
  }

  // Non-clickable card for other states
  return (
    <div
      style={{
        ...styles.card,
        borderColor: isProcessing ? 'rgba(0, 212, 255, 0.4)' : isFailed ? 'rgba(255, 51, 102, 0.4)' : 'rgba(107, 114, 128, 0.4)',
        cursor: 'default',
      }}
      onClick={handleClick}
    >
      {cardContent}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    position: 'relative',
    display: 'block',
    overflow: 'visible',
    borderRadius: 16,
    width: 220,
    height: 320,
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
    border: '2px solid',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
  },
  bgContainer: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    borderRadius: 14,
  },
  bgImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'top',
    transition: 'all 0.3s ease',
  },
  bgOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.3) 100%)',
  },
  bgFallback: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    opacity: 0.3,
    borderRadius: 14,
    overflow: 'hidden',
  },
  statusBadge: {
    position: 'absolute',
    top: 38,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    border: '1px solid',
    backdropFilter: 'blur(4px)',
  },
  completedIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    zIndex: 20,
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
    border: '2px solid #1a1a2e',
  },
  statusDot: {
    width: 8,
    height: 8,
    position: 'relative',
  },
  statusDotInner: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  content: {
    position: 'relative',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: 16,
    paddingTop: 36,
  },
  timeAgo: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    fontSize: 11,
    fontWeight: 500,
    padding: '4px 8px',
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'rgba(255,255,255,0.8)',
    backdropFilter: 'blur(4px)',
  },
  resultBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: 6,
    backdropFilter: 'blur(4px)',
  },
  middleSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  roleIcon: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    border: '2px solid rgba(255,255,255,0.2)',
    boxShadow: '0 0 20px rgba(255,255,255,0.1)',
  },
  scoreBadge: {
    padding: '6px 16px',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 700,
    border: '1px solid',
  },
  bottomSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  championName: {
    fontSize: 20,
    fontWeight: 700,
    color: 'white',
    textAlign: 'center',
    margin: 0,
  },
  kdaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.6)',
  },
  metaDot: {
    color: 'rgba(255,255,255,0.4)',
  },
  errorsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    fontSize: 12,
    color: '#fb923c',
  },
  hoverOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.3s ease',
    borderRadius: 14,
    overflow: 'hidden',
  },
  viewButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    borderRadius: 8,
    fontWeight: 600,
    color: 'white',
    background: 'linear-gradient(135deg, rgba(0,212,255,0.3) 0%, rgba(99,102,241,0.3) 100%)',
    border: '1px solid rgba(0,212,255,0.5)',
  },
  // Processing animation styles
  processingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  processingRing: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercent: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: 700,
    color: '#00d4ff',
  },
  processingText: {
    fontSize: 14,
    fontWeight: 600,
    color: '#00d4ff',
  },
  processingSubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  // Pending state styles
  pendingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  startButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    color: 'white',
    background: 'linear-gradient(135deg, #00d4ff 0%, #6366f1 100%)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)',
  },
  buttonSpinner: {
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  // Failed state styles
  failedContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  failedIcon: {
    padding: 12,
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 51, 102, 0.2)',
  },
  failedText: {
    fontSize: 14,
    fontWeight: 600,
    color: '#ff3366',
  },
};
