'use client';

import { MatchForAnalysis, getScoreColor, getStatusColor, getStatusLabel, Role } from '@/types/analysis';
import { getChampionSplashUrl } from '@/utils/ddragon';
import { useState, useEffect } from 'react';

// Language types
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

// Role display config
const roleConfig: Record<Role, { label: string; color: string; imageUrl: string }> = {
  TOP: {
    label: 'TOP',
    color: '#f59e0b',
    imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png',
  },
  JUNGLE: {
    label: 'JGL',
    color: '#22c55e',
    imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-jungle.png',
  },
  MID: {
    label: 'MID',
    color: '#8b5cf6',
    imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png',
  },
  ADC: {
    label: 'ADC',
    color: '#ef4444',
    imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-bottom.png',
  },
  SUPPORT: {
    label: 'SUP',
    color: '#06b6d4',
    imageUrl: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-utility.png',
  },
  UNKNOWN: {
    label: '?',
    color: '#6b7280',
    imageUrl: '',
  },
};

// Normalize role string to Role type
function normalizeRole(roleStr?: string): Role {
  const map: Record<string, Role> = {
    TOP: 'TOP', JUNGLE: 'JUNGLE', MID: 'MID', MIDDLE: 'MID',
    ADC: 'ADC', BOTTOM: 'ADC', BOT: 'ADC',
    SUPPORT: 'SUPPORT', UTILITY: 'SUPPORT', SUP: 'SUPPORT',
  };
  return map[roleStr?.toUpperCase() || ''] || 'UNKNOWN';
}

// Format game mode
function formatGameMode(mode: string | null): string {
  if (!mode) return 'Ranked';
  if (mode.includes('Ranked') || mode.includes('Normal') || mode.includes('ARAM')) return mode;
  const m = mode.toUpperCase();
  if (m === 'CLASSIC' || m === 'MATCHED_GAME') return 'Ranked';
  if (m === 'ARAM') return 'ARAM';
  return mode;
}

// Format duration
function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
}

// Format time ago
function formatTimeAgo(timestamp: number | null): string {
  if (!timestamp) return '';
  const diffMs = Date.now() - timestamp;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

// Role Icon component
function RoleIcon({ role }: { role: Role }) {
  const [error, setError] = useState(false);
  const config = roleConfig[role];

  if (role === 'UNKNOWN' || !config.imageUrl || error) {
    return (
      <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold"
        style={{ backgroundColor: `${config.color}30`, border: `1px solid ${config.color}50`, color: config.color }}>
        {config.label}
      </div>
    );
  }

  return (
    <img src={config.imageUrl} alt={role} className="w-6 h-6 brightness-110" onError={() => setError(true)} />
  );
}

export default function GameAnalysisCard({ match, onStartAnalysis, onCardClick, isStarting }: GameAnalysisCardProps) {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState<AnalysisLanguage>('en');

  const status = match.analysisStatus;
  const isCompleted = status === 'completed';
  const isProcessing = status === 'processing';
  const isReady = status === 'not_started' || status === 'pending';
  const isFailed = status === 'failed';

  const role = normalizeRole(match.role);
  const isWin = match.result === 'win';
  const champion = match.champion || 'Unknown';
  const splashUrl = champion !== 'Unknown' ? getChampionSplashUrl(champion) : null;
  const scoreColor = isCompleted ? getScoreColor(match.overallScore) : getStatusColor(status);
  const kda = match.deaths > 0 ? ((match.kills + match.assists) / match.deaths).toFixed(1) : '∞';

  // Simulated progress for processing state
  useEffect(() => {
    if (isProcessing) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(p => {
          if (p < 30) return p + 3;
          if (p < 60) return p + 1.5;
          if (p < 85) return p + 0.5;
          if (p < 95) return p + 0.2;
          return p;
        });
      }, 200);
      return () => clearInterval(interval);
    }
    setProgress(isCompleted ? 100 : 0);
  }, [isProcessing, isCompleted]);

  const handleAnalyze = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStartAnalysis?.(match.matchId, language);
  };

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCardClick?.(match);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    setLanguage(e.target.value as AnalysisLanguage);
  };

  // Card border color based on state
  const borderColor = isCompleted
    ? (isWin ? 'rgba(0,255,136,0.4)' : 'rgba(255,51,102,0.4)')
    : isProcessing
    ? 'rgba(0,212,255,0.5)'
    : isFailed
    ? 'rgba(255,51,102,0.4)'
    : 'rgba(255,255,255,0.1)';

  return (
    <div
      className="relative w-full min-w-[180px] max-w-[220px] h-[300px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
        border: `2px solid ${borderColor}`,
        transform: hovered && isCompleted ? 'scale(1.03)' : 'scale(1)',
        boxShadow: hovered && isCompleted ? '0 8px 32px rgba(0,212,255,0.2)' : 'none',
      }}
      onClick={() => isCompleted && onCardClick?.(match)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background Image */}
      {splashUrl && !imgError ? (
        <div className="absolute inset-0">
          <img
            src={splashUrl}
            alt={champion}
            className="w-full h-full object-cover object-top transition-all duration-300"
            style={{ opacity: isProcessing ? 0.25 : 0.6, filter: isProcessing ? 'blur(2px)' : 'none' }}
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-cyan-900/30" />
      )}

      {/* Top Bar: Time & Result */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-3 z-10">
        <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-black/60 text-white/70 backdrop-blur-sm">
          {formatTimeAgo(match.timestamp)}
        </span>
        {match.result && (
          <span
            className="px-2 py-1 rounded-md text-[10px] font-bold backdrop-blur-sm"
            style={{
              backgroundColor: isWin ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,102,0.2)',
              color: isWin ? '#00ff88' : '#ff3366',
            }}
          >
            {isWin ? 'WIN' : 'LOSS'}
          </span>
        )}
      </div>

      {/* Completed Check Icon */}
      {isCompleted && (
        <div className="absolute -top-1 -right-1 z-20 w-5 h-5 rounded-full bg-green-500 border-2 border-[#1a1a2e] flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col p-4 pt-12">
        {/* Middle Section */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          {isProcessing ? (
            /* Processing State */
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(0,212,255,0.15)" strokeWidth="4" />
                  <circle
                    cx="32" cy="32" r="28" fill="none" stroke="#00d4ff" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={2 * Math.PI * 28 * (1 - progress / 100)}
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-cyan-400">
                  {Math.round(progress)}%
                </span>
              </div>
              <span className="text-xs font-semibold text-cyan-400">Analyzing...</span>
            </div>
          ) : isReady ? (
            /* Ready State - Analyze Button + Language */
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                <RoleIcon role={role} />
              </div>

              {/* Language Selector */}
              <select
                value={language}
                onChange={handleLanguageChange}
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-1 rounded-md text-xs font-medium bg-white/5 border border-white/10 text-white/80 cursor-pointer outline-none hover:bg-white/10 transition-colors"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[#1a1a2e]">
                    {l.flag} {l.code.toUpperCase()}
                  </option>
                ))}
              </select>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={isStarting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #00d4ff 0%, #6366f1 100%)',
                  boxShadow: '0 4px 15px rgba(0,212,255,0.3)',
                }}
              >
                {isStarting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>Analyze</span>
                  </>
                )}
              </button>
            </div>
          ) : isFailed ? (
            /* Failed State */
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-red-500">Failed</span>
            </div>
          ) : (
            /* Completed State */
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                <RoleIcon role={role} />
              </div>
              <div
                className="px-4 py-1.5 rounded-full text-sm font-bold border"
                style={{
                  backgroundColor: `${scoreColor}20`,
                  color: scoreColor,
                  borderColor: `${scoreColor}50`,
                }}
              >
                {match.overallScore} pts
              </div>
              <button
                onClick={handleView}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 transition-all duration-200 hover:scale-105"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>View Analysis</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col items-center gap-1.5 mt-auto">
          <h3 className="text-lg font-bold text-white text-center truncate w-full">{champion}</h3>

          {match.result && (
            <div className="flex items-center gap-0.5 text-base font-semibold">
              <span className="text-green-400">{match.kills}</span>
              <span className="text-white/30">/</span>
              <span className="text-red-400">{match.deaths}</span>
              <span className="text-white/30">/</span>
              <span className="text-cyan-400">{match.assists}</span>
              <span className="ml-2 text-xs text-white/40">({kda})</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-white/50">
            <span>{formatGameMode(match.gameMode)}</span>
            <span className="text-white/30">•</span>
            <span>{formatDuration(match.gameDuration)}</span>
          </div>

          {isCompleted && match.errorsCount > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-orange-400">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{match.errorsCount} errors</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover Overlay for Completed */}
      {isCompleted && (
        <div
          className="absolute inset-0 bg-black/70 flex items-center justify-center transition-opacity duration-300 rounded-2xl"
          style={{ opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none' }}
        >
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white text-sm bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border border-cyan-500/50">
            <span>View Analysis</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
