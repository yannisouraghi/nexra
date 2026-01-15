import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      riotPuuid?: string;
      riotGameName?: string;
      riotTagLine?: string;
      riotRegion?: string;
      credits?: number;
      subscriptionTier?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    riotPuuid?: string;
    riotGameName?: string;
    riotTagLine?: string;
    riotRegion?: string;
    credits?: number;
    subscriptionTier?: string;
  }
}
