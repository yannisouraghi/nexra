'use client';

import { ErrorType, getErrorTypeLabel, getScoreColor, getScoreLabel } from '@/types/analysis';

interface OverallStats {
  totalGames: number;
  avgScore: number;
  totalErrors: number;
  avgErrorsPerGame: number;
  winRate: number;
  mostCommonErrors: { type: ErrorType; count: number }[];
}

interface AnalysisOverviewProps {
  stats: OverallStats;
}

export default function AnalysisOverview({ stats }: AnalysisOverviewProps) {
  const scoreColor = getScoreColor(stats.avgScore);
  const scoreLabel = getScoreLabel(stats.avgScore);

  // Calculate stroke dasharray for circular progress
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = (stats.avgScore / 100) * circumference;

  return (
    <div style={styles.card}>
      <div style={styles.mainLayout}>
        {/* Score Circle */}
        <div style={styles.scoreSection}>
          <div style={styles.scoreCircleContainer}>
            <svg width="128" height="128" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                style={{
                  filter: `drop-shadow(0 0 8px ${scoreColor}60)`,
                  transition: 'stroke-dashoffset 1s ease-out',
                }}
              />
            </svg>
            <div style={styles.scoreOverlay}>
              <span style={{ ...styles.scoreValue, color: scoreColor }}>
                {stats.avgScore}
              </span>
              <span style={styles.scoreSubtext}>Average</span>
            </div>
          </div>
          <span style={{
            ...styles.scoreBadge,
            backgroundColor: `${scoreColor}20`,
            color: scoreColor,
          }}>
            {scoreLabel}
          </span>
        </div>

        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <StatCard
            label="Analyzed Games"
            value={stats.totalGames.toString()}
            icon={
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            color="#00d4ff"
          />
          <StatCard
            label="Win Rate"
            value={`${stats.winRate}%`}
            icon={
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color={stats.winRate >= 50 ? '#00ff88' : '#ff3366'}
          />
          <StatCard
            label="Total Errors"
            value={stats.totalErrors.toString()}
            icon={
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            color="#ff6b35"
          />
          <StatCard
            label="Errors/Game"
            value={stats.avgErrorsPerGame.toString()}
            icon={
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            color="#ffd700"
          />
        </div>

        {/* Most Common Errors */}
        <div style={styles.errorsSection}>
          <h3 style={styles.errorsSectionTitle}>
            <svg width="16" height="16" fill="none" stroke="#ff6b35" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Common Errors
          </h3>
          <div style={styles.errorsList}>
            {stats.mostCommonErrors.slice(0, 4).map((error) => {
              const maxCount = stats.mostCommonErrors[0].count;
              const percentage = maxCount > 0 ? (error.count / maxCount) * 100 : 0;
              return (
                <div key={error.type} style={styles.errorRow}>
                  <div
                    style={{
                      ...styles.errorBarBg,
                      background: `linear-gradient(90deg, rgba(255,107,53,0.2) ${percentage}%, transparent ${percentage}%)`,
                    }}
                  />
                  <div style={styles.errorRowContent}>
                    <span style={styles.errorLabel}>{getErrorTypeLabel(error.type)}</span>
                    <span style={styles.errorCount}>{error.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        ...styles.statCard,
        backgroundColor: `${color}10`,
        borderColor: `${color}30`,
      }}
    >
      <div style={{ ...styles.statHeader, color }}>
        {icon}
        <span style={styles.statLabel}>{label}</span>
      </div>
      <span style={styles.statValue}>{value}</span>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  mainLayout: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 24,
    alignItems: 'flex-start',
  },
  scoreSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  scoreCircleContainer: {
    position: 'relative',
    width: 128,
    height: 128,
  },
  scoreOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 700,
  },
  scoreSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  scoreBadge: {
    padding: '6px 16px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
  },
  statsGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
    minWidth: 280,
  },
  statCard: {
    padding: 16,
    borderRadius: 12,
    border: '1px solid',
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.6)',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    color: 'white',
  },
  errorsSection: {
    width: 256,
    flexShrink: 0,
  },
  errorsSectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  errorsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  errorRow: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  errorBarBg: {
    position: 'absolute',
    inset: 0,
    borderRadius: 8,
  },
  errorRowContent: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
  },
  errorLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  errorCount: {
    fontSize: 13,
    fontWeight: 600,
    color: 'white',
  },
};
