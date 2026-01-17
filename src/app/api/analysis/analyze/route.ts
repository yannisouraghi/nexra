// API Route for Game Analysis
// Proxies to the backend API for analysis

import { NextRequest, NextResponse } from 'next/server';

const NEXRA_API_URL = process.env.NEXT_PUBLIC_NEXRA_API_URL || 'https://nexra-api.nexra-api.workers.dev';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, puuid, region } = body;

    // Validate required fields
    if (!matchId || !puuid || !region) {
      return NextResponse.json(
        { error: 'Missing required fields: matchId, puuid, region' },
        { status: 400 }
      );
    }

    // Call the backend API for analysis
    const response = await fetch(`${NEXRA_API_URL}/analysis/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        matchId,
        puuid,
        region,
        save: true,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      // Handle rate limiting
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
