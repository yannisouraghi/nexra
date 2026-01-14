import { NextRequest, NextResponse } from 'next/server';
import { getMockAnalysisById } from '@/utils/mockAnalysisData';

const NEXRA_API_URL = process.env.NEXRA_API_URL || 'http://localhost:8787';

// GET: Return detailed analysis for one game
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Try to fetch from real API
    const response = await fetch(
      `${NEXRA_API_URL}/analysis/${id}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (response.ok) {
      const data = await response.json();

      if (data.success && data.data) {
        const analysis = data.data;

        // Transform API response to match frontend expected format
        return NextResponse.json({
          id: analysis.id,
          matchId: analysis.match_id || analysis.matchId,
          puuid: analysis.puuid,
          status: analysis.status,
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
        });
      }
    }

    // If API returns 404 or fails, try mock data
    if (response.status === 404) {
      const mockAnalysis = getMockAnalysisById(id);
      if (mockAnalysis) {
        return NextResponse.json(mockAnalysis);
      }
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Fallback to mock data for other errors
    console.log('Using mock data (API unavailable)');
    const mockAnalysis = getMockAnalysisById(id);
    if (mockAnalysis) {
      return NextResponse.json(mockAnalysis);
    }

    return NextResponse.json(
      { error: 'Analysis not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Failed to fetch from API:', error);

    // Fallback to mock data
    const mockAnalysis = getMockAnalysisById(id);
    if (mockAnalysis) {
      return NextResponse.json(mockAnalysis);
    }

    return NextResponse.json(
      { error: 'Analysis not found' },
      { status: 404 }
    );
  }
}
