import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect('/?error=no_code');
  }

  const clientId = process.env.RIOT_CLIENT_ID;
  const clientSecret = process.env.RIOT_CLIENT_SECRET;
  const redirectUri = process.env.RIOT_REDIRECT_URI || 'http://localhost:3000/api/auth/riot/callback';

  if (!clientId || !clientSecret) {
    return NextResponse.redirect('/?error=missing_credentials');
  }

  try {
    // Échanger le code contre un token
    const tokenResponse = await fetch('https://auth.riotgames.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Récupérer les informations du compte
    const accountResponse = await fetch('https://auth.riotgames.com/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!accountResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const accountData = await accountResponse.json();

    // Extraire gameName et tagLine du subject (format: account:region:puuid)
    // Ou utiliser les données retournées par l'API
    const gameName = accountData.username || accountData.game_name;
    const tagLine = accountData.tag_line;

    // Rediriger vers le dashboard avec les infos du compte
    const redirectUrl = new URL('/dashboard', request.url);
    redirectUrl.searchParams.append('gameName', gameName);
    redirectUrl.searchParams.append('tagLine', tagLine);
    redirectUrl.searchParams.append('region', 'euw1');

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.redirect('/?error=auth_failed');
  }
}
