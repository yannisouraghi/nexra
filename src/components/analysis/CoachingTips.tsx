'use client';

import { CoachingTip } from '@/types/analysis';

interface CoachingTipsProps {
  tips: CoachingTip[];
}

export default function CoachingTips({ tips }: CoachingTipsProps) {
  const sortedTips = [...tips].sort((a, b) => a.priority - b.priority);

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return '#ff3366';
    if (priority === 2) return '#ff6b35';
    if (priority === 3) return '#ffd700';
    if (priority === 4) return '#00d4ff';
    return '#00ff88';
  };

  return (
    <div>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <svg width="24" height="24" fill="none" stroke="#00d4ff" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 style={styles.headerTitle}>Conseils de Coaching</h3>
          <p style={styles.headerSubtitle}>Basés sur l'analyse de ta partie</p>
        </div>
      </div>

      {/* Tips List */}
      <div style={styles.tipsList}>
        {sortedTips.map((tip) => {
          const priorityColor = getPriorityColor(tip.priority);
          return (
            <div key={tip.id} style={styles.tipCard}>
              {/* Priority Bar */}
              <div style={{ ...styles.priorityBar, backgroundColor: priorityColor }} />

              <div style={styles.tipContent}>
                {/* Header */}
                <div style={styles.tipHeader}>
                  <div style={{
                    ...styles.priorityBadge,
                    backgroundColor: `${priorityColor}20`,
                    color: priorityColor,
                  }}>
                    #{tip.priority}
                  </div>
                  <span style={styles.category}>{tip.category}</span>
                </div>

                <h4 style={styles.tipTitle}>{tip.title}</h4>
                <p style={styles.tipDescription}>{tip.description}</p>

                {/* Exercise */}
                {tip.exercice && (
                  <div style={styles.exerciseBox}>
                    <span style={styles.exerciseLabel}>Exercice pratique</span>
                    <p style={styles.exerciseText}>{tip.exercice}</p>
                  </div>
                )}

                {/* Related Errors */}
                {tip.relatedErrors && tip.relatedErrors.length > 0 && (
                  <span style={styles.relatedErrors}>
                    Lié à {tip.relatedErrors.length} erreur{tip.relatedErrors.length > 1 ? 's' : ''} dans cette partie
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pro Tip */}
      <div style={styles.proTipBox}>
        <div style={styles.proTipIcon}>
          <svg width="20" height="20" fill="none" stroke="#00d4ff" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h4 style={styles.proTipTitle}>Conseil Pro</h4>
          <p style={styles.proTipText}>
            Concentre-toi sur un seul aspect à la fois. Commence par le conseil priorité #1 et travaille dessus pendant 5-10 parties avant de passer au suivant.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0,212,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: 'white',
    margin: 0,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    margin: 0,
  },
  tipsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  tipCard: {
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  priorityBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
  },
  tipContent: {
    padding: '20px 24px 20px 28px',
  },
  tipHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  priorityBadge: {
    padding: '3px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
  },
  category: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'white',
    margin: '0 0 8px 0',
  },
  tipDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.6,
    margin: 0,
  },
  exerciseBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(0,255,136,0.08)',
    border: '1px solid rgba(0,255,136,0.2)',
  },
  exerciseLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: '#00ff88',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 8,
  },
  exerciseText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 1.6,
    margin: 0,
  },
  relatedErrors: {
    display: 'block',
    marginTop: 12,
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
  },
  proTipBox: {
    marginTop: 24,
    padding: 20,
    borderRadius: 12,
    background: 'linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,255,136,0.05) 100%)',
    border: '1px solid rgba(0,212,255,0.2)',
    display: 'flex',
    gap: 16,
  },
  proTipIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0,212,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  proTipTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: 'white',
    margin: '0 0 6px 0',
  },
  proTipText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.6,
    margin: 0,
  },
};
