import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

const NEXRA_API_URL = process.env.NEXT_PUBLIC_NEXRA_API_URL || 'https://nexra-api.nexra-api.workers.dev';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Call backend to verify credentials
          const response = await fetch(`${NEXRA_API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Invalid credentials');
          }

          const data = await response.json();

          if (data.user) {
            // Return user object for session
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name || data.user.email.split('@')[0],
              image: data.user.image || null,
            };
          }

          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // First time login - set basic user info
      if (user && account) {
        // For Google OAuth, use 'sub' from account if user.id is not set
        token.id = user.id || (account.providerAccountId);
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
              // IMPORTANT: Use the database ID, not the OAuth provider ID
              // This ensures consistency with foreign key references
              if (data.user.id) {
                token.id = data.user.id;
              }
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
