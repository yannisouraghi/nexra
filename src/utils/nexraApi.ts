// Nexra API Client

import {
  GameAnalysis,
  AnalysisStats,
  GameError,
  CoachingTip,
  VideoClip,
  RecordingWithAnalysis,
  getScoreColor as _getScoreColor,
  getScoreLabel as _getScoreLabel,
} from '@/types/analysis';

const API_URL = process.env.NEXT_PUBLIC_NEXRA_API_URL || 'http://localhost:8787';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Re-export types from @/types/analysis
export type { AnalysisStats, GameError, CoachingTip, VideoClip };

// Re-export helper functions
export const getScoreColor = _getScoreColor;
export const getScoreLabel = _getScoreLabel;

// API Analysis type - allows optional fields since processing status won't have all data
export interface Analysis {
  id: string;
  matchId: string;
  puuid: string;
  region: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  champion?: string;
  result?: 'win' | 'loss';
  duration?: number;
  gameMode?: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  role?: string;
  stats?: AnalysisStats;
  errors?: GameError[];
  tips?: CoachingTip[];
  clips?: VideoClip[];
  errorMessage?: string;
}

// Generic fetch wrapper
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json() as ApiResponse<T>;
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Request failed',
    };
  }
}

// Check if recording exists for a match
export async function checkRecordingExists(matchId: string): Promise<boolean> {
  const response = await apiFetch<{ exists: boolean }>(`/recordings/check/${matchId}`);
  return response.success && response.data?.exists === true;
}

// Get analysis by match ID
export async function getAnalysisByMatchId(matchId: string): Promise<Analysis | null> {
  const response = await apiFetch<Analysis>(`/analysis/match/${matchId}`);
  if (response.success && response.data) {
    return response.data;
  }
  return null;
}

// Get analysis by ID
export async function getAnalysisById(analysisId: string): Promise<Analysis | null> {
  const response = await apiFetch<Analysis>(`/analysis/${analysisId}`);
  if (response.success && response.data) {
    return response.data;
  }
  return null;
}

// Create new analysis request
export async function createAnalysis(matchId: string, puuid: string, region: string): Promise<{ id: string; status: string } | null> {
  const response = await apiFetch<{ id: string; status: string; existing?: boolean }>('/analysis', {
    method: 'POST',
    body: JSON.stringify({ matchId, puuid, region }),
  });

  if (response.success && response.data) {
    return response.data;
  }

  // If error is about no recording, return null
  if (response.error?.includes('No recording found')) {
    return null;
  }

  throw new Error(response.error || 'Failed to create analysis');
}

// Get all analyses for a user (uses local proxy with mock data fallback)
export async function getUserAnalyses(puuid: string, limit = 20, offset = 0): Promise<Analysis[]> {
  try {
    // Use local API route which has mock data fallback
    const response = await fetch(`/api/analysis/games?puuid=${puuid}&limit=${limit}&offset=${offset}`);
    const data = await response.json();

    if (data.games && Array.isArray(data.games)) {
      // Transform the games response to Analysis format
      return data.games.map((game: Record<string, unknown>) => ({
        id: game.id as string,
        matchId: game.matchId as string,
        puuid: puuid,
        region: 'EUW1',
        status: (game.status as string) || 'completed',
        createdAt: game.createdAt as string,
        updatedAt: game.createdAt as string,
        completedAt: game.createdAt as string,
        champion: game.champion as string,
        result: game.result as 'win' | 'loss',
        duration: game.duration as number,
        gameMode: (game.gameMode as string) || 'CLASSIC',
        kills: game.kills as number,
        deaths: game.deaths as number,
        assists: game.assists as number,
        role: game.role as string,
        stats: {
          overallScore: game.overallScore as number,
          errorsFound: game.errorsCount as number,
          csScore: 0,
          visionScore: 0,
          positioningScore: 0,
          objectiveScore: 0,
          deathsAnalyzed: 0,
          comparedToRank: [],
        },
        errors: [],
        tips: [],
        clips: [],
      }));
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch analyses:', error);
    return [];
  }
}

// Delete analysis
export async function deleteAnalysis(analysisId: string): Promise<boolean> {
  const response = await apiFetch(`/analysis/${analysisId}`, {
    method: 'DELETE',
  });
  return response.success;
}

// Re-run analysis with updated AI
export async function reanalyzeGame(analysisId: string): Promise<{ id: string; status: string } | null> {
  const response = await apiFetch<{ id: string; status: string; message: string }>(`/analysis/${analysisId}/reanalyze`, {
    method: 'POST',
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || 'Failed to restart analysis');
}

// Get all recordings with their analysis status (uses local proxy to avoid CORS)
export async function getUserRecordings(puuid: string, limit = 20, offset = 0): Promise<RecordingWithAnalysis[]> {
  try {
    // Use local API route to proxy to nexra-api
    const response = await fetch(`/api/recordings?puuid=${puuid}&limit=${limit}&offset=${offset}`);
    const data = await response.json();
    if (data.success && data.data) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch recordings:', error);
    return [];
  }
}

// Start analysis for a pending analysis (uses local proxy)
export async function startAnalysis(analysisId: string): Promise<{ id: string; status: string; message?: string } | null> {
  try {
    const response = await fetch(`/api/analysis/start/${analysisId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (data.success && data.data) {
      return data.data;
    }

    throw new Error(data.error || 'Failed to start analysis');
  } catch (error) {
    console.error('Failed to start analysis:', error);
    throw error;
  }
}

// Create analysis and optionally start it immediately
export async function createAndStartAnalysis(
  matchId: string,
  puuid: string,
  region: string,
  autoStart = false
): Promise<{ id: string; status: string } | null> {
  // First create the analysis
  const createResponse = await apiFetch<{ id: string; status: string; existing?: boolean }>('/analysis', {
    method: 'POST',
    body: JSON.stringify({ matchId, puuid, region }),
  });

  if (!createResponse.success || !createResponse.data) {
    if (createResponse.error?.includes('No recording found')) {
      return null;
    }
    throw new Error(createResponse.error || 'Failed to create analysis');
  }

  // If auto-start is requested, start the analysis
  // Start if: newly created OR existing but still in pending status
  const shouldStart = autoStart && (
    !createResponse.data.existing ||
    createResponse.data.status === 'pending'
  );

  if (shouldStart) {
    const startResponse = await startAnalysis(createResponse.data.id);
    if (startResponse) {
      return startResponse;
    }
  }

  return createResponse.data;
}
