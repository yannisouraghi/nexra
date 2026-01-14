'use client';

import { getWinProbabilityColor, getWinProbabilityLabel } from '@/utils/winProbabilityCalculator';

interface WinProbabilityBadgeProps {
  probability: number; // 0-100
  confidence?: 'LOW' | 'MEDIUM' | 'HIGH';
  showBar?: boolean; // Afficher la barre de progression
  size?: 'small' | 'medium' | 'large';
}

export default function WinProbabilityBadge({
  probability,
  confidence = 'MEDIUM',
  showBar = true,
  size = 'medium',
}: WinProbabilityBadgeProps) {
  const color = getWinProbabilityColor(probability);
  const label = getWinProbabilityLabel(probability);

  // Tailles
  const sizeStyles = {
    small: {
      badge: 'text-xs',
      bar: 'h-1.5',
      icon: 'w-3 h-3',
      padding: '0.625rem 1rem',
    },
    medium: {
      badge: 'text-sm',
      bar: 'h-2',
      icon: 'w-4 h-4',
      padding: '0.75rem 1.25rem',
    },
    large: {
      badge: 'text-base',
      bar: 'h-3',
      icon: 'w-5 h-5',
      padding: '1rem 1.5rem',
    },
  };

  const styles = sizeStyles[size];

  // Icône de confiance
  const getConfidenceIcon = () => {
    if (confidence === 'HIGH') {
      return (
        <svg className={styles.icon} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else if (confidence === 'MEDIUM') {
      return (
        <svg className={styles.icon} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else {
      return (
        <svg className={styles.icon} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
  };

  return (
    <div className="flex flex-col" style={{ gap: '0.5rem' }}>
      {/* Badge */}
      <div className="flex items-center" style={{ gap: '0.5rem' }}>
        <div
          className={`${styles.badge} rounded-lg font-bold backdrop-blur-sm border flex items-center`}
          style={{
            backgroundColor: `${color}15`,
            borderColor: `${color}40`,
            color: color,
            gap: '0.625rem',
            padding: styles.padding,
          }}
        >
          <span>{probability}%</span>
          <span className="opacity-60">|</span>
          <span className="font-semibold opacity-90">{label}</span>
        </div>

        {/* Icône de confiance */}
        <div
          className="rounded-full backdrop-blur-sm border"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            color:
              confidence === 'HIGH'
                ? '#10b981'
                : confidence === 'MEDIUM'
                ? '#eab308'
                : '#ef4444',
            padding: '0.375rem',
          }}
          title={`Confidence: ${confidence === 'HIGH' ? 'High' : confidence === 'MEDIUM' ? 'Medium' : 'Low'}`}
        >
          {getConfidenceIcon()}
        </div>
      </div>

      {/* Barre de progression */}
      {showBar && (
        <div className="w-full">
          <div
            className={`${styles.bar} w-full rounded-full overflow-hidden`}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <div
              className={`${styles.bar} rounded-full transition-all duration-700 ease-out`}
              style={{
                width: `${probability}%`,
                backgroundColor: color,
                boxShadow: `0 0 12px ${color}80`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
