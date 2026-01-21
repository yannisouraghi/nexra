'use client';

import { MatchForAnalysis, getScoreColor, getStatusColor, Role } from '@/types/analysis';
import { getChampionSplashUrl } from '@/utils/ddragon';
import { useState, useEffect } from 'react';

type AnalysisLanguage = 'en' | 'fr' | 'es' | 'de' | 'pt';

const LANGUAGES: { code: AnalysisLanguage; flag: string }[] = [
  { code: 'en', flag: '🇬🇧' },
  { code: 'fr', flag: '🇫🇷' },
  { code: 'es', flag: '🇪🇸' },
  { code: 'de', flag: '🇩🇪' },
  { code: 'pt', flag: '🇧🇷' },
];

interface GameAnalysisCardProps {
  match: MatchForAnalysis;
  onStartAnalysis?: (matchId: string, language: AnalysisLanguage) => void;
  onCardClick?: (match: MatchForAnalysis) => void;
  isStarting?: boolean;
}

const roleConfig: Record<Role, { label: string; color: string; img: string }> = {
  TOP: { label: 'TOP', color: '#f59e0b', img: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png' },
  JUNGLE: { label: 'JGL', color: '#22c55e', img: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-jungle.png' },
  MID: { label: 'MID', color: '#8b5cf6', img: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png' },
  ADC: { label: 'ADC', color: '#ef4444', img: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-bottom.png' },
  SUPPORT: { label: 'SUP', color: '#06b6d4', img: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-utility.png' },
  UNKNOWN: { label: '?', color: '#6b7280', img: '' },
};

function normalizeRole(str?: string): Role {
  const map: Record<string, Role> = {
    TOP: 'TOP', JUNGLE: 'JUNGLE', MID: 'MID', MIDDLE: 'MID',
    ADC: 'ADC', BOTTOM: 'ADC', BOT: 'ADC',
    SUPPORT: 'SUPPORT', UTILITY: 'SUPPORT', SUP: 'SUPPORT',
  };
  return map[str?.toUpperCase() || ''] || 'UNKNOWN';
}

function formatDuration(s: number | null): string {
  if (!s) return '--:--';
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

function formatTimeAgo(ts: number | null): string {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - ts) / 60000);
  if (diff < 60) return `${diff}m`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
}

function RoleIcon({ role }: { role: Role }) {
  const [err, setErr] = useState(false);
  const cfg = roleConfig[role];

  if (role === 'UNKNOWN' || !cfg.img || err) {
    return (
      <div style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${cfg.color}25`,
        border: `1px solid ${cfg.color}40`,
        color: cfg.color,
        fontSize: 10,
        fontWeight: 700,
      }}>
        {cfg.label}
      </div>
    );
  }

  return (
    <img
      src={cfg.img}
      alt={role}
      style={{ width: 28, height: 28, filter: 'brightness(1.1)' }}
      onError={() => setErr(true)}
    />
  );
}

export default function GameAnalysisCard({ match, onStartAnalysis, onCardClick, isStarting }: GameAnalysisCardProps) {
  const [imgErr, setImgErr] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lang, setLang] = useState<AnalysisLanguage>('en');

  const status = match.analysisStatus;
  const isCompleted = status === 'completed';
  const isProcessing = status === 'processing';
  const isReady = status === 'not_started' || status === 'pending';
  const isFailed = status === 'failed';

  const role = normalizeRole(match.role);
  const isWin = match.result === 'win';
  const champion = match.champion || 'Unknown';
  const splash = champion !== 'Unknown' ? getChampionSplashUrl(champion) : null;
  const scoreColor = isCompleted ? getScoreColor(match.overallScore) : getStatusColor(status);
  const kda = match.deaths > 0 ? ((match.kills + match.assists) / match.deaths).toFixed(1) : '∞';

  // Smooth progress animation - cycles through phases to avoid getting stuck
  useEffect(() => {
    if (isProcessing) {
      setProgress(0);
      let phase = 0;
      const iv = setInterval(() => {
        setProgress(p => {
          // Phase 1: Quick start (0-40%)
          if (p < 40) return p + 2;
          // Phase 2: Slower middle (40-70%)
          if (p < 70) return p + 0.8;
          // Phase 3: Even slower (70-90%)
          if (p < 90) return p + 0.4;
          // Phase 4: Cycle between 90-98% to show activity
          phase = (phase + 1) % 20;
          return 90 + (phase < 10 ? phase * 0.8 : (20 - phase) * 0.8);
        });
      }, 150);
      return () => clearInterval(iv);
    }
    setProgress(isCompleted ? 100 : 0);
  }, [isProcessing, isCompleted]);

  const borderColor = isCompleted
    ? (isWin ? 'rgba(0,255,136,0.5)' : 'rgba(255,51,102,0.5)')
    : isProcessing ? 'rgba(0,212,255,0.6)' : isFailed ? 'rgba(255,51,102,0.5)' : 'rgba(255,255,255,0.12)';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minWidth: 200,
        maxWidth: 240,
        height: 340,
        borderRadius: 16,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #0d0d1a 100%)',
        border: `2px solid ${borderColor}`,
        cursor: isCompleted ? 'pointer' : 'default',
        transform: hovered && isCompleted ? 'scale(1.02)' : 'scale(1)',
        boxShadow: hovered && isCompleted ? '0 12px 40px rgba(0,212,255,0.25)' : '0 4px 20px rgba(0,0,0,0.3)',
        transition: 'all 0.25s ease',
      }}
      onClick={() => isCompleted && onCardClick?.(match)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background */}
      {splash && !imgErr ? (
        <div style={{ position: 'absolute', inset: 0 }}>
          <img
            src={splash}
            alt={champion}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top',
              opacity: isProcessing ? 0.2 : 0.55,
              filter: isProcessing ? 'blur(3px)' : 'none',
              transition: 'all 0.3s',
            }}
            onError={() => setImgErr(true)}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.4) 100%)',
          }} />
        </div>
      ) : (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(0,212,255,0.2) 100%)',
        }} />
      )}

      {/* Top: Time + Result */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
      }}>
        <span style={{
          padding: '5px 10px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 600,
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(8px)',
        }}>
          {formatTimeAgo(match.timestamp)}
        </span>
        {match.result && (
          <span style={{
            padding: '5px 10px',
            borderRadius: 8,
            fontSize: 10,
            fontWeight: 700,
            backgroundColor: isWin ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,102,0.2)',
            color: isWin ? '#00ff88' : '#ff3366',
            backdropFilter: 'blur(8px)',
          }}>
            {isWin ? 'WIN' : 'LOSS'}
          </span>
        )}
      </div>

      {/* Completed badge */}
      {isCompleted && (
        <div style={{
          position: 'absolute',
          top: -2,
          right: -2,
          zIndex: 20,
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: '#22c55e',
          border: '3px solid #1a1a2e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Content */}
      <div style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 16,
        paddingTop: 52,
      }}>
        {/* Middle */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}>
          {isProcessing ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', width: 70, height: 70 }}>
                <svg width="70" height="70" viewBox="0 0 70 70" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="35" cy="35" r="30" fill="none" stroke="rgba(0,212,255,0.15)" strokeWidth="5" />
                  <circle
                    cx="35" cy="35" r="30" fill="none" stroke="#00d4ff" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 30}
                    strokeDashoffset={2 * Math.PI * 30 * (1 - progress / 100)}
                    style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                  />
                </svg>
                <span style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#00d4ff',
                }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#00d4ff' }}>Analyzing...</span>
            </div>
          ) : isReady ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <RoleIcon role={role} />
              </div>

              {/* Language */}
              <select
                value={lang}
                onChange={(e) => { e.stopPropagation(); setLang(e.target.value as AnalysisLanguage); }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} style={{ backgroundColor: '#1a1a2e' }}>
                    {l.flag} {l.code.toUpperCase()}
                  </option>
                ))}
              </select>

              {/* Analyze Button */}
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onStartAnalysis?.(match.matchId, lang); }}
                disabled={isStarting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'white',
                  background: 'linear-gradient(135deg, #00d4ff 0%, #6366f1 100%)',
                  border: 'none',
                  cursor: isStarting ? 'not-allowed' : 'pointer',
                  opacity: isStarting ? 0.6 : 1,
                  boxShadow: '0 4px 20px rgba(0,212,255,0.4)',
                  transition: 'all 0.2s',
                }}
              >
                {isStarting ? (
                  <>
                    <div style={{
                      width: 14,
                      height: 14,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>Analyze</span>
                  </>
                )}
              </button>
            </div>
          ) : isFailed ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,51,102,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="24" height="24" fill="none" stroke="#ff3366" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#ff3366' }}>Failed</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <RoleIcon role={role} />
              </div>
              <div style={{
                padding: '8px 18px',
                borderRadius: 20,
                fontSize: 15,
                fontWeight: 700,
                backgroundColor: `${scoreColor}20`,
                color: scoreColor,
                border: `1px solid ${scoreColor}50`,
              }}>
                {match.overallScore} pts
              </div>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCardClick?.(match); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'white',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>View Analysis</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          marginTop: 'auto',
          paddingTop: 12,
        }}>
          <h3 style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'white',
            margin: 0,
            textAlign: 'center',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}>
            {champion}
          </h3>

          {match.result && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 16, fontWeight: 600 }}>
              <span style={{ color: '#4ade80' }}>{match.kills}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
              <span style={{ color: '#f87171' }}>{match.deaths}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
              <span style={{ color: '#22d3ee' }}>{match.assists}</span>
              <span style={{ marginLeft: 8, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>({kda})</span>
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            color: 'rgba(255,255,255,0.5)',
          }}>
            <span>Ranked</span>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>•</span>
            <span>{formatDuration(match.gameDuration)}</span>
          </div>

          {isCompleted && match.errorsCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: '#fb923c',
              marginTop: 2,
            }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{match.errorsCount} errors</span>
            </div>
          )}
        </div>
      </div>


      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
