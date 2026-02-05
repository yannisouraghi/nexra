import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getMockAnalysisById } from '@/utils/mockAnalysisData';
import { NEXRA_API_URL } from '@/config/api';

// GET: Return detailed analysis for one game
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Try to fetch from real API
    const response = await fetch(
      `${NEXRA_API_URL}/analysis/${id}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user.id}:${session.user.email || ''}`,
        },
        cache: 'no-store',
      }
    );

    if (response.ok) {
      const data = await response.json();

      if (data.success && data.data) {
        const analysis = data.data;

        // Verify ownership
        const sessionUser = session.user as { riotPuuid?: string };
        if (sessionUser.riotPuuid && analysis.puuid && sessionUser.riotPuuid !== analysis.puuid) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json({
          success: true,
          data: {
            id: analysis.id,
            matchId: analysis.match_id || analysis.matchId,
            puuid: analysis.puuid,
            status: analysis.status,
            progress: analysis.progress ?? null,
            progressMessage: analysis.progressMessage ?? null,
            createdAt: analysis.created_at || analysis.createdAt,
            completedAt: analysis.completed_at || analysis.completedAt,

            // Game info
            champion: analysis.champion || 'Unknown',
            result: analysis.result || 'loss',
            duration: analysis.duration || 0,
            gameMode: analysis.game_mode || analysis.gameMode || 'Unknown',
            kills: analysis.kills || 0,
            deaths: analysis.deaths || 0,
            assists: analysis.assists || 0,
            role: analysis.role,

            // Analysis results
            stats: analysis.stats || null,
            errors: analysis.errors || [],
            tips: analysis.tips || [],
            clips: analysis.clips || [],

            // Error info
            errorMessage: analysis.error_message || analysis.errorMessage,
          },
        });
      }
    }

    // If API returns 404
    if (response.status === 404) {
      if (process.env.NODE_ENV === 'development') {
        const mockAnalysis = getMockAnalysisById(id);
        if (mockAnalysis) {
          return NextResponse.json({ ...mockAnalysis, _isMockData: true });
        }
      }
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // API returned error
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: response.status }
    );

  } catch (error) {
    console.error('Failed to fetch from API:', error);

    if (process.env.NODE_ENV === 'development') {
      const mockAnalysis = getMockAnalysisById(id);
      if (mockAnalysis) {
        return NextResponse.json({ ...mockAnalysis, _isMockData: true });
      }
    }

    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
}
