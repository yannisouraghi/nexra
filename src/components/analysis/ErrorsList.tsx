'use client';

import { useState } from 'react';
import {
  GameError,
  ErrorType,
  ErrorSeverity,
  ErrorContext,
  getSeverityColor,
  getSeverityLabel,
  getErrorTypeLabel,
  formatTimestamp,
} from '@/types/analysis';

interface ErrorsListProps {
  errors: GameError[];
  matchId?: string;
}

export default function ErrorsList({ errors, matchId }: ErrorsListProps) {
  const [filterSeverity, setFilterSeverity] = useState<ErrorSeverity | 'all'>('all');
  const [filterType, setFilterType] = useState<ErrorType | 'all'>('all');
  const [expandedError, setExpandedError] = useState<string | null>(null);

  const errorTypes = [...new Set(errors.map((e) => e.type))];

  const filteredErrors = errors.filter((error) => {
    if (filterSeverity !== 'all' && error.severity !== filterSeverity) return false;
    if (filterType !== 'all' && error.type !== filterType) return false;
    return true;
  });

  const sortedErrors = [...filteredErrors].sort((a, b) => a.timestamp - b.timestamp);
  const severities: (ErrorSeverity | 'all')[] = ['all', 'critical', 'high', 'medium', 'low'];

  return (
    <div>
      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Severity:</span>
          <div style={styles.filterButtons}>
            {severities.map((sev) => {
              const isActive = filterSeverity === sev;
              const color = sev !== 'all' ? getSeverityColor(sev as ErrorSeverity) : '#fff';
              return (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  style={{
                    ...styles.filterButton,
                    backgroundColor: isActive ? (sev === 'all' ? 'rgba(255,255,255,0.15)' : `${color}25`) : 'rgba(255,255,255,0.05)',
                    color: isActive ? (sev === 'all' ? '#fff' : color) : 'rgba(255,255,255,0.6)',
                    borderColor: isActive ? (sev === 'all' ? 'rgba(255,255,255,0.2)' : `${color}40`) : 'transparent',
                  }}
                >
                  {sev === 'all' ? 'All' : getSeverityLabel(sev as ErrorSeverity)}
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ErrorType | 'all')}
            style={styles.select}
          >
            <option value="all">All types</option>
            {errorTypes.map((type) => (
              <option key={type} value={type}>{getErrorTypeLabel(type)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Errors List */}
      {sortedErrors.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No errors match your filters</p>
        </div>
      ) : (
        <div style={styles.errorsList}>
          {sortedErrors.map((error) => {
            const isExpanded = expandedError === error.id;
            const severityColor = getSeverityColor(error.severity);

            return (
              <div
                key={error.id}
                style={{
                  ...styles.errorCard,
                  backgroundColor: isExpanded ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                  borderColor: isExpanded ? `${severityColor}40` : 'rgba(255,255,255,0.06)',
                }}
              >
                {/* Error Header */}
                <button
                  onClick={() => setExpandedError(isExpanded ? null : error.id)}
                  style={styles.errorHeader}
                >
                  <div style={{ ...styles.severityDot, backgroundColor: severityColor }} />
                  <span style={styles.timestamp}>{formatTimestamp(error.timestamp)}</span>
                  <div style={{ flex: 1 }}>
                    <span style={styles.errorTitle}>{error.title}</span>
                    <span style={styles.errorType}>{getErrorTypeLabel(error.type)}</span>
                  </div>
                  <span style={{
                    ...styles.severityBadge,
                    backgroundColor: `${severityColor}20`,
                    color: severityColor,
                  }}>
                    {getSeverityLabel(error.severity)}
                  </span>
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="rgba(255,255,255,0.4)"
                    viewBox="0 0 24 24"
                    style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={styles.expandedContent}>
                    <p style={styles.description}>{error.description}</p>

                    {/* Suggestion */}
                    <div style={styles.suggestionBox}>
                      <span style={styles.suggestionLabel}>How to fix</span>
                      <p style={styles.suggestionText}>{error.suggestion}</p>
                    </div>

                    {/* Coaching Note */}
                    {error.coachingNote && (
                      <div style={styles.coachingBox}>
                        <span style={styles.coachingLabel}>Coach's note</span>
                        <p style={styles.coachingText}>{error.coachingNote}</p>
                      </div>
                    )}

                    {/* Error Context Display */}
                    {error.context && (
                      <div style={styles.contextBox}>
                        <span style={styles.contextLabel}>Contexte</span>
                        <div style={styles.contextGrid}>
                          {error.context.goldState && (
                            <div style={styles.contextItem}>
                              <span style={styles.contextItemLabel}>Gold</span>
                              <span style={{
                                ...styles.contextItemValue,
                                color: error.context.goldState.differential >= 0 ? '#00ff88' : '#ff3366'
                              }}>
                                {error.context.goldState.differential >= 0 ? '+' : ''}{error.context.goldState.differential} gold
                              </span>
                            </div>
                          )}
                          {error.context.levelState && (
                            <div style={styles.contextItem}>
                              <span style={styles.contextItemLabel}>Niveau</span>
                              <span style={styles.contextItemValue}>
                                Lvl {error.context.levelState.player} vs {error.context.levelState.opponent}
                              </span>
                            </div>
                          )}
                          {error.context.mapState && (
                            <div style={styles.contextItem}>
                              <span style={styles.contextItemLabel}>Zone</span>
                              <span style={{
                                ...styles.contextItemValue,
                                color: error.context.mapState.zone === 'safe' ? '#00ff88' :
                                       error.context.mapState.zone === 'neutral' ? '#ffd700' : '#ff3366'
                              }}>
                                {error.context.mapState.zone === 'safe' ? 'Safe' :
                                 error.context.mapState.zone === 'neutral' ? 'Neutre' : 'Danger'}
                              </span>
                            </div>
                          )}
                          {error.context.mapState?.nearestAlly && (
                            <div style={styles.contextItem}>
                              <span style={styles.contextItemLabel}>Allie proche</span>
                              <span style={styles.contextItemValue}>
                                {error.context.mapState.nearestAlly.champion} ({error.context.mapState.nearestAlly.distance} u)
                              </span>
                            </div>
                          )}
                          {error.context.csState && (
                            <div style={styles.contextItem}>
                              <span style={styles.contextItemLabel}>CS</span>
                              <span style={{
                                ...styles.contextItemValue,
                                color: error.context.csState.differential >= 0 ? '#00ff88' : '#ff3366'
                              }}>
                                {error.context.csState.player} vs {error.context.csState.opponent}
                              </span>
                            </div>
                          )}
                          <div style={styles.contextItem}>
                            <span style={styles.contextItemLabel}>Phase</span>
                            <span style={styles.contextItemValue}>
                              {error.context.gamePhase === 'early' ? 'Early game' :
                               error.context.gamePhase === 'mid' ? 'Mid game' : 'Late game'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  filters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 24,
    marginBottom: 24,
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  filterLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  filterButtons: {
    display: 'flex',
    gap: 6,
  },
  filterButton: {
    padding: '6px 12px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  select: {
    padding: '8px 12px',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: 14,
    outline: 'none',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
  },
  errorsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  errorCard: {
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid',
    transition: 'all 0.2s',
  },
  errorHeader: {
    width: '100%',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  timestamp: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: 'rgba(255,255,255,0.5)',
    width: 48,
    flexShrink: 0,
  },
  errorTitle: {
    display: 'block',
    fontWeight: 500,
    color: 'white',
    fontSize: 15,
    marginBottom: 2,
  },
  errorType: {
    display: 'block',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  severityBadge: {
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  expandedContent: {
    padding: '0 20px 20px 92px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  description: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 1.6,
    margin: 0,
  },
  suggestionBox: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(0,212,255,0.08)',
    border: '1px solid rgba(0,212,255,0.2)',
  },
  suggestionLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: '#00d4ff',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 8,
  },
  suggestionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 1.6,
    margin: 0,
  },
  coachingBox: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255,215,0,0.08)',
    border: '1px solid rgba(255,215,0,0.2)',
  },
  coachingLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: '#ffd700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 8,
  },
  coachingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 1.6,
    margin: 0,
  },
  contextBox: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(168,85,247,0.08)',
    border: '1px solid rgba(168,85,247,0.2)',
  },
  contextLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: '#a855f7',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: 12,
  },
  contextGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 12,
  },
  contextItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  contextItemLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
  contextItemValue: {
    fontSize: 14,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.9)',
  },
};
