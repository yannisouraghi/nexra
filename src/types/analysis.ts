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

export interface GameError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  title: string;
  description: string;
  timestamp: number;        // Seconds into game
  suggestion: string;       // How to improve
  // Video clip timestamps for error replay
  clipStart?: number;       // Start of clip (seconds)
  clipEnd?: number;         // End of clip (seconds)
  // Extended coaching note from AI
  coachingNote?: string;    // Detailed coaching explanation
  videoClip?: {
    start: number;
    end: number;
    url: string;
  };
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

export interface VideoClip {
  id: string;
  type: 'error' | 'highlight' | 'death';
  timestamp: number;
  duration: number;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  // Video timestamps for clip extraction
  startTime?: number;       // Start time in video (seconds)
  endTime?: number;         // End time in video (seconds)
  // Link to related error
  errorId?: string;
  // AI Analysis for death clips
  aiAnalysis?: {
    deathCause: string;           // Why the player died
    mistakes: string[];           // List of mistakes made
    suggestions: string[];        // How to avoid this death
    situationalAdvice: string;    // Context-specific advice
    severity: ErrorSeverity;      // How bad was this death
  };
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
  comparedToRank: RankComparison[];
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
  clips?: VideoClip[];

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

// Recording with analysis status - unified view
export interface RecordingWithAnalysis {
  // Recording info
  recordingId: string;
  matchId: string;
  puuid: string;
  region: string;
  videoKey: string;
  recordingDuration: number | null;
  fileSize: number | null;
  recordingCreatedAt: string;
  uploadedAt: string | null;
  // Analysis info (null if not started)
  analysisId: string | null;
  analysisStatus: AnalysisStatus;
  progress: number | null;
  progressMessage: string | null;
  champion: string | null;
  result: 'win' | 'loss' | null;
  gameDuration: number | null;
  gameMode: string | null;
  kills: number;
  deaths: number;
  assists: number;
  role: string | null;
  overallScore: number;
  errorsCount: number;
  analysisCreatedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
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
