// API Route for Game Analysis
// Proxies to the backend API for analysis

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { NEXRA_API_URL } from '@/config/api';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, puuid, region, language } = body;

    // Validate required fields
    if (!matchId || !puuid || !region) {
      return NextResponse.json(
        { error: 'Missing required fields: matchId, puuid, region' },
        { status: 400 }
      );
    }

    // Verify ownership: the puuid must match the session user's puuid
    const sessionUser = session.user as { riotPuuid?: string };
    if (sessionUser.riotPuuid && sessionUser.riotPuuid !== puuid) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Call the backend API for analysis
    const response = await fetch(`${NEXRA_API_URL}/analysis/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.user.id}:${session.user.email || ''}`,
      },
      body: JSON.stringify({
        matchId,
        puuid,
        region,
        language: language || 'en',
        save: true,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limited by Riot API. Please try again in a few seconds.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: result.error || 'Analysis failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Analysis failed';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
