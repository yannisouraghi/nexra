'use client';

import { AnalysisStats, getScoreColor, getScoreLabel } from '@/types/analysis';

interface StatsComparisonProps {
  stats: AnalysisStats;
}

export default function StatsComparison({ stats }: StatsComparisonProps) {
  const scoreBreakdown = [
    { label: 'CS Score', value: stats.csScore, icon: 'coins' },
    { label: 'Vision Score', value: stats.visionScore, icon: 'eye' },
    { label: 'Positioning', value: stats.positioningScore, icon: 'target' },
    { label: 'Objectives', value: stats.objectiveScore, icon: 'flag' },
    { label: 'Trading', value: stats.tradingScore ?? 0, icon: 'swords' },
  ];

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 75) return '#00ff88';
    if (percentile >= 50) return '#00d4ff';
    if (percentile >= 25) return '#ffd700';
    return '#ff3366';
  };

  return (
    <div>
      {/* Score Breakdown */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          <svg width="20" height="20" fill="none" stroke="#00d4ff" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          Score Breakdown
        </h3>

        <div style={styles.scoreGrid}>
          {scoreBreakdown.map((item) => {
            const color = getScoreColor(item.value);
            const label = getScoreLabel(item.value);

            return (
              <div key={item.label} style={{ ...styles.scoreCard, borderColor: `${color}30` }}>
                <div style={styles.scoreHeader}>
                  <span style={styles.scoreLabel}>{item.label}</span>
                  <span style={{ ...styles.scoreValue, color }}>{item.value}</span>
                </div>

                <div style={styles.progressTrack}>
                  <div style={{ ...styles.progressBar, width: `${item.value}%`, backgroundColor: color }} />
                </div>

                <div style={styles.scoreBadgeRow}>
                  <span style={{
                    ...styles.scoreBadge,
                    backgroundColor: `${color}20`,
                    color,
                  }}>
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rank Comparison - Only show if data is available */}
      {stats.comparedToRank && stats.comparedToRank.length > 0 && (
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          <svg width="20" height="20" fill="none" stroke="#ffd700" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Comparison with your Rank
        </h3>

        <div style={styles.comparisonList}>
          {stats.comparedToRank.map((comparison) => {
            const percentileColor = getPercentileColor(comparison.percentile);
            const isAboveAverage = comparison.yours >= comparison.average;
            const diff = ((comparison.yours - comparison.average) / comparison.average * 100).toFixed(0);

            return (
              <div key={comparison.metric} style={styles.comparisonCard}>
                <div style={styles.comparisonHeader}>
                  <span style={styles.comparisonMetric}>{comparison.metric}</span>
                  <span style={{
                    ...styles.percentileBadge,
                    backgroundColor: `${percentileColor}20`,
                    color: percentileColor,
                  }}>
                    Top {100 - comparison.percentile}%
                  </span>
                </div>

                <div style={styles.comparisonBarTrack}>
                  <div
                    style={{
                      ...styles.comparisonBar,
                      width: `${Math.min((comparison.yours / Math.max(comparison.yours, comparison.average) * 100), 100)}%`,
                      backgroundColor: percentileColor,
                    }}
                  >
                    <span style={styles.barValue}>{comparison.yours}</span>
                  </div>
                  <div
                    style={{
                      ...styles.averageMarker,
                      left: `${(comparison.average / Math.max(comparison.yours, comparison.average) * 100)}%`,
                    }}
                  />
                </div>

                <div style={styles.comparisonFooter}>
                  <div style={styles.comparisonStats}>
                    <span style={styles.statLabel}>You: <span style={{ color: 'white', fontWeight: 500 }}>{comparison.yours}</span></span>
                    <span style={styles.statLabel}>Average: <span style={{ color: 'white', fontWeight: 500 }}>{comparison.average}</span></span>
                  </div>
                  <span style={{ ...styles.diffValue, color: isAboveAverage ? '#00ff88' : '#ff3366' }}>
                    {isAboveAverage ? '+' : ''}{diff}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Summary Stats */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{stats.deathsAnalyzed}</div>
          <div style={styles.summaryLabel}>Deaths analyzed</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={{ ...styles.summaryValue, color: '#ff6b35' }}>{stats.errorsFound}</div>
          <div style={styles.summaryLabel}>Errors found</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={{ ...styles.summaryValue, color: '#00d4ff' }}>
            {Math.round(stats.errorsFound / stats.deathsAnalyzed * 10) / 10 || 0}
          </div>
          <div style={styles.summaryLabel}>Errors/death</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={{ ...styles.summaryValue, color: getScoreColor(stats.overallScore) }}>
            {stats.overallScore}
          </div>
          <div style={styles.summaryLabel}>Overall score</div>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 18,
    fontWeight: 600,
    color: 'white',
    marginBottom: 20,
  },
  scoreGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
  },
  scoreCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid',
  },
  scoreHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 700,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.5s ease',
  },
  scoreBadgeRow: {
    marginTop: 12,
    textAlign: 'right',
  },
  scoreBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
  },
  comparisonList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  comparisonCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  comparisonHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  comparisonMetric: {
    fontSize: 15,
    fontWeight: 500,
    color: 'white',
  },
  percentileBadge: {
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
  },
  comparisonBarTrack: {
    position: 'relative',
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  comparisonBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 10,
  },
  barValue: {
    fontSize: 12,
    fontWeight: 700,
    color: '#000',
  },
  averageMarker: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  comparisonFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  comparisonStats: {
    display: 'flex',
    gap: 20,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  diffValue: {
    fontSize: 13,
    fontWeight: 600,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 700,
    color: 'white',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
};
