import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { mockAnalyzedGames } from '@/utils/mockAnalysisData';
import { NEXRA_API_URL } from '@/config/api';

// GET: Return list of analyzed games (including processing ones)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const puuid = searchParams.get('puuid');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!puuid) {
    return NextResponse.json(
      { error: 'Missing puuid parameter' },
      { status: 400 }
    );
  }

  // Verify ownership
  const sessionUser = session.user as { riotPuuid?: string };
  if (sessionUser.riotPuuid && sessionUser.riotPuuid !== puuid) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    // Try to fetch from real API
    const response = await fetch(
      `${NEXRA_API_URL}/analysis?puuid=${puuid}&limit=${limit}&offset=${offset}`,
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
        // Include completed AND processing analyses
        const games = data.data.map((analysis: any) => ({
          id: analysis.id,
          matchId: analysis.match_id || analysis.matchId,
          champion: analysis.champion || 'Unknown',
          result: analysis.result || 'loss',
          duration: analysis.duration || 0,
          overallScore: analysis.stats?.overallScore || 0,
          errorsCount: analysis.errors?.length || analysis.stats?.errorsFound || 0,
          status: analysis.status,
          progress: analysis.progress ?? null,
          progressMessage: analysis.progressMessage ?? analysis.progress_message ?? null,
          createdAt: analysis.created_at || analysis.createdAt,
          kills: analysis.kills || 0,
          deaths: analysis.deaths || 0,
          assists: analysis.assists || 0,
          role: analysis.role,
          gameMode: analysis.gameMode || 'CLASSIC',
          // Include full analysis data for caching (only for completed)
          stats: analysis.status === 'completed' ? (analysis.stats || null) : null,
          errors: analysis.status === 'completed' ? (analysis.errors || []) : [],
          tips: analysis.status === 'completed' ? (analysis.tips || []) : [],
          clips: analysis.status === 'completed' ? (analysis.clips || []) : [],
        }));

        return NextResponse.json({
          games,
          total: games.length,
          hasMore: games.length === limit,
        });
      }
    }

    // Only use mock data in development
    if (process.env.NODE_ENV === 'development') {
      const paginatedGames = mockAnalyzedGames.slice(offset, offset + limit);
      return NextResponse.json({
        games: paginatedGames,
        total: mockAnalyzedGames.length,
        hasMore: offset + limit < mockAnalyzedGames.length,
        _isMockData: true,
      });
    }

    return NextResponse.json({
      games: [],
      total: 0,
      hasMore: false,
    });

  } catch (error) {
    console.error('Failed to fetch from API:', error);

    if (process.env.NODE_ENV === 'development') {
      const paginatedGames = mockAnalyzedGames.slice(offset, offset + limit);
      return NextResponse.json({
        games: paginatedGames,
        total: mockAnalyzedGames.length,
        hasMore: offset + limit < mockAnalyzedGames.length,
        _isMockData: true,
      });
    }

    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
}
