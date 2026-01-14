'use client';

import { useState } from 'react';
import {
  GameError,
  ErrorType,
  ErrorSeverity,
  getSeverityColor,
  getSeverityLabel,
  getErrorTypeLabel,
  formatTimestamp,
} from '@/types/analysis';

interface ErrorsListProps {
  errors: GameError[];
  matchId?: string;
  onPlayClip?: (startTime: number, endTime: number) => void;
}

export default function ErrorsList({ errors, matchId, onPlayClip }: ErrorsListProps) {
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
          <span style={styles.filterLabel}>Sévérité:</span>
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
                  {sev === 'all' ? 'Tous' : getSeverityLabel(sev as ErrorSeverity)}
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
            <option value="all">Tous les types</option>
            {errorTypes.map((type) => (
              <option key={type} value={type}>{getErrorTypeLabel(type)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Errors List */}
      {sortedErrors.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Aucune erreur ne correspond à vos filtres</p>
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
                      <span style={styles.suggestionLabel}>Comment corriger</span>
                      <p style={styles.suggestionText}>{error.suggestion}</p>
                    </div>

                    {/* Coaching Note */}
                    {error.coachingNote && (
                      <div style={styles.coachingBox}>
                        <span style={styles.coachingLabel}>Note du coach</span>
                        <p style={styles.coachingText}>{error.coachingNote}</p>
                      </div>
                    )}

                    {/* Video Clip Button */}
                    {(error.clipStart !== undefined && error.clipEnd !== undefined) && (
                      <button
                        onClick={() => onPlayClip?.(error.clipStart!, error.clipEnd!)}
                        style={styles.clipButton}
                      >
                        <svg width="20" height="20" fill="#ff6b35" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        <span>Voir le clip</span>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                          ({formatTimestamp(error.clipStart)} - {formatTimestamp(error.clipEnd)})
                        </span>
                      </button>
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
  clipButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 20px',
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,53,0.15)',
    border: '1px solid rgba(255,107,53,0.3)',
    color: 'white',
    fontWeight: 500,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s',
    alignSelf: 'flex-start',
  },
};
