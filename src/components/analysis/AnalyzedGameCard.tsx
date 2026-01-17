'use client';

import { AnalyzedGameSummary, getScoreColor, Role } from '@/types/analysis';
import { getChampionSplashUrl } from '@/utils/ddragon';
import { useState, type JSX } from 'react';
import Link from 'next/link';

interface AnalyzedGameCardProps {
  game: AnalyzedGameSummary;
  onViewDetails?: () => void;
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
  TOP: '#f59e0b',    // Orange/Amber
  JUNGLE: '#22c55e', // Green
  MID: '#8b5cf6',    // Purple
  ADC: '#ef4444',    // Red
  SUPPORT: '#06b6d4', // Cyan
  UNKNOWN: '#6b7280', // Gray
};

// Role Icon component - uses Community Dragon images with text fallback
const RoleIcon = ({ role }: { role: Role }) => {
  const [imageError, setImageError] = useState(false);

  // Community Dragon position icons URLs
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

  // If role is UNKNOWN or image failed, show text label
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

  // Show Community Dragon icon
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

export default function AnalyzedGameCard({ game }: AnalyzedGameCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const scoreColor = getScoreColor(game.overallScore);
  const isWin = game.result === 'win';

  const formatDuration = (seconds: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (dateString: string) => {
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

  const kda = game.deaths > 0
    ? ((game.kills + game.assists) / game.deaths).toFixed(2)
    : 'Perfect';

  const champSplashUrl = game.champion && game.champion !== 'Unknown'
    ? getChampionSplashUrl(game.champion)
    : null;

  return (
    <Link
      href={`/dashboard/analysis/${game.id}`}
      style={{
        ...styles.card,
        borderColor: isWin ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 51, 102, 0.4)',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isHovered ? '0 0 30px rgba(0,212,255,0.3)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image */}
      {champSplashUrl && !imageError ? (
        <div style={styles.bgContainer}>
          <img
            src={champSplashUrl}
            alt={game.champion}
            style={styles.bgImage}
            onError={() => setImageError(true)}
          />
          <div style={styles.bgOverlay} />
        </div>
      ) : (
        <div style={styles.bgFallback} />
      )}

      {/* Content Container */}
      <div style={styles.content}>
        {/* Top Row - Date & Victory/Defeat */}
        <div style={styles.topRow}>
          <span style={styles.timeAgo}>
            {formatTimeAgo(game.createdAt)}
          </span>
          <span style={{
            ...styles.resultBadge,
            backgroundColor: isWin ? 'rgba(0, 255, 136, 0.25)' : 'rgba(255, 51, 102, 0.25)',
            color: isWin ? '#00ff88' : '#ff3366',
          }}>
            {isWin ? 'VICTORY' : 'DEFEAT'}
          </span>
        </div>

        {/* Middle - Role Icon */}
        <div style={styles.middleSection}>
          <div style={styles.roleIcon}>
            <div style={{ color: 'rgba(255,255,255,0.8)' }}>
              <RoleIcon role={game.role} />
            </div>
          </div>

          {/* Score Badge */}
          <div style={{
            ...styles.scoreBadge,
            backgroundColor: `${scoreColor}25`,
            color: scoreColor,
            borderColor: `${scoreColor}60`,
          }}>
            {game.overallScore} pts
          </div>
        </div>

        {/* Bottom Section */}
        <div style={styles.bottomSection}>
          {/* Champion Name */}
          <h3 style={styles.championName}>{game.champion}</h3>

          {/* KDA */}
          <div style={styles.kdaRow}>
            <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 18 }}>{game.kills}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }}>/</span>
            <span style={{ color: '#f87171', fontWeight: 700, fontSize: 18 }}>{game.deaths}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }}>/</span>
            <span style={{ color: '#22d3ee', fontWeight: 700, fontSize: 18 }}>{game.assists}</span>
            <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>({kda})</span>
          </div>

          {/* Game Mode & Duration */}
          <div style={styles.metaRow}>
            <span style={styles.metaText}>{game.gameMode}</span>
            <span style={styles.metaDot}>•</span>
            <span style={styles.metaText}>{formatDuration(game.duration)}</span>
          </div>

          {/* Errors */}
          {game.errorsCount > 0 && (
            <div style={styles.errorsRow}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{game.errorsCount} errors detected</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover Effect - View Button */}
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
    </Link>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    position: 'relative',
    display: 'block',
    overflow: 'hidden',
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
  },
  bgImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'top',
    opacity: 0.7,
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
  },
  content: {
    position: 'relative',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: 16,
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeAgo: {
    fontSize: 11,
    fontWeight: 500,
    padding: '4px 8px',
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: 'rgba(255,255,255,0.8)',
  },
  resultBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: 6,
  },
  middleSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
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
};
