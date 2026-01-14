import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.RIOT_CLIENT_ID;
  const redirectUri = process.env.RIOT_REDIRECT_URI || 'http://localhost:3000/api/auth/riot/callback';

  if (!clientId) {
    return NextResponse.json(
      { error: 'RIOT_CLIENT_ID non configuré dans .env' },
      { status: 500 }
    );
  }

  // Construire l'URL d'autorisation Riot
  const authUrl = new URL('https://auth.riotgames.com/authorize');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', 'openid');

  return NextResponse.redirect(authUrl.toString());
}
