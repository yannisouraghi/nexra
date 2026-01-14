import { NextRequest, NextResponse } from 'next/server';

const NEXRA_VISION_URL = 'http://127.0.0.1:45678';

// POST: Send account data to Nexra Vision running locally
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { puuid, gameName, tagLine, region, profileIconId } = body;

    if (!puuid || !gameName || !tagLine) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send to Nexra Vision local server
    const response = await fetch(`${NEXRA_VISION_URL}/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ puuid, gameName, tagLine, region, profileIconId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { error: error.error || 'Failed to link account' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Connection refused means Nexra Vision is not running
    if ((error as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: 'Nexra Vision is not running', code: 'NOT_RUNNING' },
        { status: 503 }
      );
    }

    console.error('Failed to link to Nexra Vision:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Nexra Vision' },
      { status: 500 }
    );
  }
}

// GET: Check if Nexra Vision is running
export async function GET() {
  try {
    const response = await fetch(`${NEXRA_VISION_URL}/status`, {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ running: false });
  } catch {
    return NextResponse.json({ running: false, code: 'NOT_RUNNING' });
  }
}
