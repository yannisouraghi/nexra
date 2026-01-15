import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

const NEXRA_API_URL = process.env.NEXT_PUBLIC_NEXRA_API_URL || 'https://nexra-api.nexra-api.workers.dev';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // First time login - set basic user info
      if (user && account) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }

      // Always fetch latest user data from backend (on login and session refresh)
      const userId = token.id || user?.id;
      if (userId) {
        try {
          // Use POST /users/auth to sync and get latest data
          const response = await fetch(`${NEXRA_API_URL}/users/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: userId,
              email: token.email || user?.email,
              name: token.name || user?.name,
              image: token.image || user?.image,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            // Update token with latest user data from database
            if (data.user) {
              token.riotPuuid = data.user.riot_puuid || null;
              token.riotGameName = data.user.riot_game_name || null;
              token.riotTagLine = data.user.riot_tag_line || null;
              token.riotRegion = data.user.riot_region || null;
              token.credits = data.user.credits ?? 0;
              token.subscriptionTier = data.user.subscription_tier || 'free';
            }
          }
        } catch (error) {
          console.error('Failed to sync user with backend:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // Add Riot account info to session
        (session.user as any).riotPuuid = token.riotPuuid;
        (session.user as any).riotGameName = token.riotGameName;
        (session.user as any).riotTagLine = token.riotTagLine;
        (session.user as any).riotRegion = token.riotRegion;
        (session.user as any).credits = token.credits;
        (session.user as any).subscriptionTier = token.subscriptionTier;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
});
