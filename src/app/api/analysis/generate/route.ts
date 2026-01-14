import { NextRequest, NextResponse } from 'next/server';
import { AnalyzedGameSummary } from '@/types/analysis';

// POST: Simulate starting analysis (returns pending status)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, puuid, champion, result, duration, kills, deaths, assists, role, gameMode } = body;

    // Validate required fields
    if (!matchId || !puuid) {
      return NextResponse.json(
        { error: 'Missing required fields: matchId and puuid' },
        { status: 400 }
      );
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create a new pending analysis
    const newAnalysis: AnalyzedGameSummary = {
      id: `analysis-${Date.now()}`,
      matchId,
      champion: champion || 'Unknown',
      result: result || 'loss',
      duration: duration || 0,
      overallScore: 0, // Will be calculated after analysis
      errorsCount: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      kills: kills || 0,
      deaths: deaths || 0,
      assists: assists || 0,
      role: role || 'UNKNOWN',
      gameMode: gameMode || 'CLASSIC',
    };

    // In production, this would:
    // 1. Queue the video for processing
    // 2. Fetch Riot API timeline data
    // 3. Run AI analysis on video clips
    // 4. Store results in database

    return NextResponse.json({
      success: true,
      analysis: newAnalysis,
      message: 'Analysis queued successfully. Check back soon for results.',
    });
  } catch (error) {
    console.error('Error creating analysis:', error);
    return NextResponse.json(
      { error: 'Failed to create analysis' },
      { status: 500 }
    );
  }
}
