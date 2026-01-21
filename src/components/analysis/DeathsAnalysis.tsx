'use client';

import { useState } from 'react';
import { Skull, Clock, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Swords, TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface DeathAnalysisEntry {
  deathNumber: number;
  timestamp: number;
  gamePhase: 'early' | 'mid' | 'late';
  situationContext: string;
  fightAnalysis: {
    wasWinnable: boolean;
    reason: string;
    goldState: string;
    levelState: string;
    cooldownsAvailable: string;
  };
  whatWentWrong: string;
  whatShouldHaveDone: string;
  deathCost: string;
  coachVerdict: 'critical' | 'avoidable' | 'unlucky' | 'acceptable';
}

interface DeathsAnalysisProps {
  deathsAnalysis: DeathAnalysisEntry[];
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getVerdictConfig(verdict: string) {
  switch (verdict) {
    case 'critical':
      return { color: '#ff3366', bgColor: 'rgba(255,51,102,0.1)', label: 'Critical', icon: XCircle };
    case 'avoidable':
      return { color: '#f97316', bgColor: 'rgba(249,115,22,0.1)', label: 'Avoidable', icon: AlertTriangle };
    case 'unlucky':
      return { color: '#a855f7', bgColor: 'rgba(168,85,247,0.1)', label: 'Unlucky', icon: Minus };
    case 'acceptable':
      return { color: '#00ff88', bgColor: 'rgba(0,255,136,0.1)', label: 'Acceptable', icon: CheckCircle };
    default:
      return { color: '#888', bgColor: 'rgba(136,136,136,0.1)', label: verdict, icon: Minus };
  }
}

function getPhaseConfig(phase: string) {
  switch (phase) {
    case 'early':
      return { color: '#00d4ff', label: 'Early Game' };
    case 'mid':
      return { color: '#ffd700', label: 'Mid Game' };
    case 'late':
      return { color: '#ff3366', label: 'Late Game' };
    default:
      return { color: '#888', label: phase };
  }
}

function DeathCard({ death }: { death: DeathAnalysisEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const verdictConfig = getVerdictConfig(death.coachVerdict);
  const phaseConfig = getPhaseConfig(death.gamePhase);
  const VerdictIcon = verdictConfig.icon;

  return (
    <div style={styles.deathCard}>
      {/* Header */}
      <button
        style={styles.deathHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={styles.deathInfo}>
          <div style={{
            ...styles.deathNumber,
            backgroundColor: verdictConfig.bgColor,
            borderColor: verdictConfig.color,
          }}>
            <Skull size={14} color={verdictConfig.color} />
            <span style={{ color: verdictConfig.color, fontWeight: 600 }}>#{death.deathNumber}</span>
          </div>
          <div style={styles.deathMeta}>
            <span style={styles.timestamp}>
              <Clock size={12} />
              {formatTimestamp(death.timestamp)}
            </span>
            <span style={{
              ...styles.phaseBadge,
              color: phaseConfig.color,
              borderColor: phaseConfig.color,
            }}>
              {phaseConfig.label}
            </span>
          </div>
        </div>

        <div style={styles.headerRight}>
          <div style={{
            ...styles.verdictBadge,
            backgroundColor: verdictConfig.bgColor,
            color: verdictConfig.color,
            borderColor: verdictConfig.color,
          }}>
            <VerdictIcon size={12} />
            {verdictConfig.label}
          </div>
          {isExpanded ? <ChevronUp size={18} color="#888" /> : <ChevronDown size={18} color="#888" />}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div style={styles.deathContent}>
          {/* Situation Context */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Situation</h4>
            <p style={styles.sectionText}>{death.situationContext}</p>
          </div>

          {/* Fight Analysis */}
          <div style={{
            ...styles.fightAnalysisBox,
            borderColor: death.fightAnalysis.wasWinnable ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)',
            backgroundColor: death.fightAnalysis.wasWinnable ? 'rgba(0,255,136,0.05)' : 'rgba(255,51,102,0.05)',
          }}>
            <div style={styles.fightHeader}>
              <Swords size={16} color={death.fightAnalysis.wasWinnable ? '#00ff88' : '#ff3366'} />
              <span style={{
                fontWeight: 600,
                color: death.fightAnalysis.wasWinnable ? '#00ff88' : '#ff3366',
              }}>
                {death.fightAnalysis.wasWinnable ? 'Fight Was Winnable' : 'Fight Was NOT Winnable'}
              </span>
            </div>
            <p style={styles.fightReason}>{death.fightAnalysis.reason}</p>

            <div style={styles.fightStats}>
              <div style={styles.fightStat}>
                <span style={styles.fightStatLabel}>Gold State</span>
                <span style={{
                  ...styles.fightStatValue,
                  color: death.fightAnalysis.goldState.toLowerCase().includes('ahead') ? '#00ff88' :
                         death.fightAnalysis.goldState.toLowerCase().includes('behind') ? '#ff3366' : '#ffd700',
                }}>
                  {death.fightAnalysis.goldState.toLowerCase().includes('ahead') ? <TrendingUp size={12} /> :
                   death.fightAnalysis.goldState.toLowerCase().includes('behind') ? <TrendingDown size={12} /> : <Minus size={12} />}
                  {death.fightAnalysis.goldState}
                </span>
              </div>
              <div style={styles.fightStat}>
                <span style={styles.fightStatLabel}>Level State</span>
                <span style={styles.fightStatValue}>{death.fightAnalysis.levelState}</span>
              </div>
              <div style={styles.fightStat}>
                <span style={styles.fightStatLabel}>Cooldowns</span>
                <span style={styles.fightStatValue}>{death.fightAnalysis.cooldownsAvailable}</span>
              </div>
            </div>
          </div>

          {/* What Went Wrong */}
          <div style={styles.section}>
            <h4 style={{ ...styles.sectionTitle, color: '#ff3366' }}>
              <XCircle size={14} />
              What Went Wrong
            </h4>
            <p style={styles.sectionText}>{death.whatWentWrong}</p>
          </div>

          {/* What Should Have Done */}
          <div style={styles.section}>
            <h4 style={{ ...styles.sectionTitle, color: '#00ff88' }}>
              <CheckCircle size={14} />
              What You Should Have Done
            </h4>
            <p style={styles.sectionText}>{death.whatShouldHaveDone}</p>
          </div>

          {/* Death Cost */}
          <div style={styles.deathCostBox}>
            <span style={styles.deathCostLabel}>Cost of this death:</span>
            <p style={styles.deathCostText}>{death.deathCost}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DeathsAnalysis({ deathsAnalysis }: DeathsAnalysisProps) {
  if (!deathsAnalysis || deathsAnalysis.length === 0) {
    return (
      <div style={styles.emptyState}>
        <CheckCircle size={48} color="#00ff88" />
        <h3 style={styles.emptyTitle}>Perfect Game!</h3>
        <p style={styles.emptyText}>You didn't die this game. Great job staying alive!</p>
      </div>
    );
  }

  // Calculate stats
  const verdictCounts = deathsAnalysis.reduce((acc, d) => {
    acc[d.coachVerdict] = (acc[d.coachVerdict] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const winnableCount = deathsAnalysis.filter(d => d.fightAnalysis.wasWinnable).length;

  return (
    <div style={styles.container}>
      {/* Summary Stats */}
      <div style={styles.summaryRow}>
        <div style={styles.summaryCard}>
          <Skull size={20} color="#ff3366" />
          <span style={styles.summaryValue}>{deathsAnalysis.length}</span>
          <span style={styles.summaryLabel}>Total Deaths</span>
        </div>
        {verdictCounts.critical > 0 && (
          <div style={{ ...styles.summaryCard, borderColor: 'rgba(255,51,102,0.3)' }}>
            <XCircle size={20} color="#ff3366" />
            <span style={{ ...styles.summaryValue, color: '#ff3366' }}>{verdictCounts.critical}</span>
            <span style={styles.summaryLabel}>Critical</span>
          </div>
        )}
        {verdictCounts.avoidable > 0 && (
          <div style={{ ...styles.summaryCard, borderColor: 'rgba(249,115,22,0.3)' }}>
            <AlertTriangle size={20} color="#f97316" />
            <span style={{ ...styles.summaryValue, color: '#f97316' }}>{verdictCounts.avoidable}</span>
            <span style={styles.summaryLabel}>Avoidable</span>
          </div>
        )}
        <div style={styles.summaryCard}>
          <Swords size={20} color={winnableCount > 0 ? '#ff3366' : '#00ff88'} />
          <span style={styles.summaryValue}>{winnableCount}/{deathsAnalysis.length}</span>
          <span style={styles.summaryLabel}>Were Winnable</span>
        </div>
      </div>

      {/* Deaths List */}
      <div style={styles.deathsList}>
        {deathsAnalysis.map((death) => (
          <DeathCard key={death.deathNumber} death={death} />
        ))}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  summaryRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  summaryCard: {
    flex: '1 1 120px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 700,
    color: 'white',
  },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  deathsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  deathCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  deathHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  deathInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  deathNumber: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid',
    fontSize: 13,
  },
  deathMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  timestamp: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  phaseBadge: {
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    border: '1px solid',
    backgroundColor: 'transparent',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  verdictBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid',
  },
  deathContent: {
    padding: '0 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  section: {
    paddingTop: 16,
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 600,
    color: '#00d4ff',
    marginBottom: 8,
    margin: 0,
  },
  sectionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 1.6,
    margin: 0,
    marginTop: 8,
  },
  fightAnalysisBox: {
    padding: 16,
    borderRadius: 10,
    border: '1px solid',
  },
  fightHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  fightReason: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 1.6,
    margin: 0,
    marginBottom: 16,
  },
  fightStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    paddingTop: 12,
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  fightStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  fightStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  fightStatValue: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 500,
  },
  deathCostBox: {
    padding: 14,
    backgroundColor: 'rgba(255,51,102,0.08)',
    borderRadius: 10,
    border: '1px solid rgba(255,51,102,0.2)',
  },
  deathCostLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#ff3366',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  deathCostText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 1.5,
    margin: 0,
    marginTop: 8,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    textAlign: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: '#00ff88',
    margin: 0,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    margin: 0,
  },
};
