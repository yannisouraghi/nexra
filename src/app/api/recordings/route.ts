import { NextRequest, NextResponse } from 'next/server';

const NEXRA_API_URL = process.env.NEXRA_API_URL || 'http://localhost:8787';

// GET: List recordings with analysis status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const puuid = searchParams.get('puuid');
  const limit = searchParams.get('limit') || '20';
  const offset = searchParams.get('offset') || '0';

  if (!puuid) {
    return NextResponse.json(
      { success: false, error: 'puuid is required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${NEXRA_API_URL}/recordings?puuid=${puuid}&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch recordings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recordings', data: [] },
      { status: 500 }
    );
  }
}
