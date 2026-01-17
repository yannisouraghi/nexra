// Types for AI Game Analysis Feature

// Error types detected by AI - Extended for detailed coaching
export type ErrorType =
  | 'positioning'       // Bad positioning in fights/lane
  | 'timing'            // Wrong timing on abilities/engages
  | 'cs-missing'        // Missed CS opportunities
  | 'vision'            // Vision control mistakes
  | 'objective'         // Objective control errors
  | 'map-awareness'     // Not watching minimap
  | 'itemization'       // Suboptimal item choices
  | 'cooldown-tracking' // Not tracking enemy cooldowns
  | 'trading'           // Bad trades in lane
  | 'wave-management'   // Poor wave control
  | 'roaming'           // Bad roaming decisions
  | 'teamfight';        // Teamfight mistakes

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

export type AnalysisStatus = 'not_started' | 'pending' | 'processing' | 'completed' | 'failed';

// Context for detailed error analysis based on Riot API Timeline data
export interface ErrorContext {
  goldState?: {
    player: number;
    opponent: number;
    differential: number;
  };
  levelState?: {
    player: number;
    opponent: number;
  };
  mapState?: {
    zone: 'safe' | 'neutral' | 'danger';
    nearestAlly?: { champion: string; distance: number };
    nearestEnemy?: { champion: string; distance: number };
    playerPosition?: { x: number; y: number };
  };
  visionState?: {
    playerWardsActive: number;
    areaWarded: boolean;
  };
  csState?: {
    player: number;
    opponent: number;
    differential: number;
  };
  gamePhase: 'early' | 'mid' | 'late';
}

export interface GameError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  title: string;
  description: string;
  timestamp: number;        // Seconds into game
  suggestion: string;       // How to improve
  // Extended coaching note from AI
  coachingNote?: string;    // Detailed coaching explanation
  // Context from Riot API Timeline
  context?: ErrorContext;
}

export interface CoachingTip {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: number;         // 1 = most important
  relatedErrors?: string[]; // Error IDs this tip addresses
  icon?: string;            // Icon identifier
  // Practical exercise for improvement
  exercice?: string;        // Practice Tool exercise
}


// Performance summary from AI analysis
export interface PerformanceSummary {
  overallAssessment: string;
  strengths: string[];
  weaknesses: string[];
  improvementPlan: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  estimatedRank?: string;
  rankUpTip?: string;
}

export interface AnalysisStats {
  overallScore: number;     // 0-100
  csScore: number;
  visionScore: number;
  positioningScore: number;
  objectiveScore: number;
  tradingScore?: number;    // Optional for backwards compatibility
  deathsAnalyzed: number;
  errorsFound: number;
  comparedToRank?: RankComparison[];  // Optional - may not be available for all analyses
  // Performance summary from AI coach
  performanceSummary?: PerformanceSummary;
}

export interface RankComparison {
  metric: string;
  yours: number;
  average: number;
  percentile: number;
}

export interface GameAnalysis {
  id: string;
  matchId: string;
  puuid: string;
  status: AnalysisStatus;
  createdAt: string;
  completedAt?: string;

  // Game info
  champion: string;
  result: 'win' | 'loss';
  duration: number;
  gameMode: string;
  kills: number;
  deaths: number;
  assists: number;

  // Analysis results (only when completed)
  stats?: AnalysisStats;
  errors?: GameError[];
  tips?: CoachingTip[];

  // Error info (only when failed)
  errorMessage?: string;
}

export type Role = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT' | 'UNKNOWN';

export interface AnalyzedGameSummary {
  id: string;
  matchId: string;
  champion: string;
  result: 'win' | 'loss';
  duration: number;
  overallScore: number;
  errorsCount: number;
  status: AnalysisStatus;
  createdAt: string;
  kills: number;
  deaths: number;
  assists: number;
  role: Role;
  gameMode: string;
}

// Match ready for analysis (based on Riot API data)
export interface MatchForAnalysis {
  matchId: string;
  puuid: string;
  region: string;
  champion: string;
  result: 'win' | 'loss';
  gameDuration: number;
  gameMode: string;
  queueId: number;
  kills: number;
  deaths: number;
  assists: number;
  role: string;
  timestamp: number;
  // Analysis info (null if not analyzed)
  analysisId: string | null;
  analysisStatus: AnalysisStatus;
  overallScore: number;
  errorsCount: number;
}

// Status display helpers
export function getStatusColor(status: AnalysisStatus): string {
  switch (status) {
    case 'not_started': return '#6b7280'; // Gray
    case 'pending': return '#f59e0b';     // Amber
    case 'processing': return '#00d4ff';   // Cyan
    case 'completed': return '#00ff88';    // Green
    case 'failed': return '#ff3366';       // Red
  }
}

export function getStatusLabel(status: AnalysisStatus): string {
  switch (status) {
    case 'not_started': return 'Ready';
    case 'pending': return 'Pending';
    case 'processing': return 'Analysing...';
    case 'completed': return 'Complete';
    case 'failed': return 'Failed';
  }
}

// Helper functions for colors
export function getScoreColor(score: number): string {
  if (score >= 90) return '#00ff88'; // Excellent - Green
  if (score >= 70) return '#00d4ff'; // Good - Cyan
  if (score >= 50) return '#ffd700'; // Average - Gold
  if (score >= 30) return '#ff6b35'; // Needs Work - Orange
  return '#ff3366';                   // Critical - Red
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Average';
  if (score >= 30) return 'Needs Work';
  return 'Critical';
}

export function getSeverityColor(severity: ErrorSeverity): string {
  switch (severity) {
    case 'critical': return '#ff3366';
    case 'high': return '#ff6b35';
    case 'medium': return '#ffd700';
    case 'low': return '#00ff88';
  }
}

export function getSeverityLabel(severity: ErrorSeverity): string {
  switch (severity) {
    case 'critical': return 'Critical';
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
  }
}

export function getErrorTypeLabel(type: ErrorType): string {
  const labels: Record<ErrorType, string> = {
    'positioning': 'Positionnement',
    'timing': 'Timing',
    'cs-missing': 'CS Manqués',
    'vision': 'Vision',
    'objective': 'Objectifs',
    'map-awareness': 'Conscience Map',
    'itemization': 'Itemisation',
    'cooldown-tracking': 'Cooldowns',
    'trading': 'Trades',
    'wave-management': 'Gestion Waves',
    'roaming': 'Roaming',
    'teamfight': 'Teamfight',
  };
  return labels[type] || type;
}

export function getErrorTypeIcon(type: ErrorType): string {
  const icons: Record<ErrorType, string> = {
    'positioning': 'map-pin',
    'timing': 'clock',
    'cs-missing': 'coins',
    'vision': 'eye',
    'objective': 'target',
    'map-awareness': 'map',
    'itemization': 'shopping-bag',
    'cooldown-tracking': 'timer',
    'trading': 'swords',
    'wave-management': 'waves',
    'roaming': 'navigation',
    'teamfight': 'users',
  };
  return icons[type] || 'alert-circle';
}

export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
