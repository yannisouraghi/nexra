import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// GET - Fetch user's riot account from cookie
export async function GET() {
  try {
    const cookieStore = await cookies();
    const riotAccountCookie = cookieStore.get('nexra_riot_account');

    if (!riotAccountCookie?.value) {
      return NextResponse.json(
        { error: 'No riot account linked' },
        { status: 404 }
      );
    }

    const riotAccount = JSON.parse(riotAccountCookie.value);

    return NextResponse.json(riotAccount, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error fetching riot account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch riot account' },
      { status: 500 }
    );
  }
}

// POST - Store riot account in cookie (called from dashboard)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameName, tagLine, region, puuid } = body;

    if (!gameName || !tagLine) {
      return NextResponse.json(
        { error: 'Missing gameName or tagLine' },
        { status: 400 }
      );
    }

    const riotAccount = {
      gameName,
      tagLine,
      region: region || 'EUW1',
      puuid: puuid || null,
    };

    const response = NextResponse.json({ success: true, riotAccount });

    // Set cookie that lasts 30 days
    response.cookies.set('nexra_riot_account', JSON.stringify(riotAccount), {
      httpOnly: false, // Allow JS access for debugging
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error storing riot account:', error);
    return NextResponse.json(
      { error: 'Failed to store riot account' },
      { status: 500 }
    );
  }
}

// OPTIONS - Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
