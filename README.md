# Nexra - AI League of Legends Coach

Nexra is an AI-powered coaching platform for League of Legends players. It analyzes your gameplay using Riot API data and provides personalized improvement tips.

**Live:** https://www.nexra-ai.app

## Tech Stack

### Frontend (nexra)
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS + Custom CSS
- **Auth:** NextAuth.js v5 (Google OAuth)
- **Deployment:** Cloudflare Pages

### Backend (nexra-api)
- **Runtime:** Cloudflare Workers (Hono framework)
- **Database:** Cloudflare D1 (SQLite)
- **Storage:** Cloudflare R2 (video storage - future)
- **Queue:** Cloudflare Queues (analysis processing)
- **AI:** Anthropic Claude API

## Features

### Current
- Google OAuth authentication
- Riot account linking (via Riot ID)
- Match history display with detailed stats
- Champion statistics
- Live game detection
- AI-powered game analysis (using Riot Timeline API)
- Credits system for analysis
- Settings modal (profile, linked accounts, credits, danger zone)

### Planned
- [x] Mobile "not available" page after Riot account linking
- [x] Advanced coaching tips based on role/champion
- [ ] Video clip analysis (Nexra Vision)

## Project Structure

```
nexra/                          # Frontend (Next.js)
├── src/
│   ├── app/                    # App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth handlers
│   │   │   └── riot/          # Riot API proxies
│   │   ├── dashboard/         # Main dashboard
│   │   ├── link-riot/         # Riot account linking
│   │   ├── settings/          # Settings page (deprecated - now modal)
│   │   └── analysis/          # Game analysis pages
│   ├── components/            # React components
│   │   ├── analysis/          # Analysis-specific components
│   │   └── skeletons/         # Loading skeletons
│   ├── auth.ts                # NextAuth configuration
│   └── globals.css            # Global styles
└── public/                    # Static assets

nexra-api/                      # Backend (Cloudflare Workers)
├── src/
│   ├── routes/
│   │   ├── users.ts           # User management & auth
│   │   ├── analyses.ts        # Game analysis
│   │   └── recordings.ts      # Video recordings (future)
│   ├── middleware/
│   │   └── auth.ts            # Authentication middleware
│   └── index.ts               # Main entry point
├── migrations/                 # D1 database migrations
└── schema.sql                 # Base database schema
```

## Authentication Flow

1. User clicks "Sign in with Google"
2. NextAuth handles OAuth flow
3. JWT callback calls `/users/auth` to sync user with backend
4. Backend finds user by EMAIL (not ID) to handle OAuth ID changes
5. If user exists: returns existing data with original DB ID
6. If new user: creates user with OAuth ID
7. Frontend updates token.id with database ID for consistency

**Important:** Google OAuth can generate different user IDs across sessions. The backend uses EMAIL as the source of truth and preserves the original database ID to maintain foreign key integrity with `analyses` and `recordings` tables.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,           -- Original OAuth ID (preserved)
    email TEXT NOT NULL UNIQUE,    -- Source of truth for user lookup
    name TEXT,
    image TEXT,

    -- Linked Riot account
    riot_puuid TEXT,
    riot_game_name TEXT,
    riot_tag_line TEXT,
    riot_region TEXT,
    riot_linked_at TEXT,

    -- Credits system
    credits INTEGER DEFAULT 3,
    total_credits_used INTEGER DEFAULT 0,

    -- Subscription
    subscription_tier TEXT DEFAULT 'free',
    subscription_expires_at TEXT,

    -- Auth
    password_hash TEXT,
    auth_provider TEXT DEFAULT 'google',

    -- Timestamps
    created_at TEXT,
    updated_at TEXT,
    last_login_at TEXT
);
```

### Foreign Key Relationships
- `analyses.user_id` → `users.id`
- `recordings.user_id` → `users.id`

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_NEXRA_API_URL=https://nexra-api.nexra-api.workers.dev
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
AUTH_SECRET=your_nextauth_secret
RIOT_API_KEY=your_riot_api_key
```

### Backend (wrangler.toml secrets)
```
ANTHROPIC_API_KEY=your_anthropic_key
RIOT_API_KEY=your_riot_api_key
```

## Development

### Frontend
```bash
cd nexra
npm install
npm run dev
```

### Backend
```bash
cd nexra-api
npm install
npm run dev      # Local development
npm run deploy   # Deploy to Cloudflare
```

### Database Migrations
```bash
cd nexra-api
npx wrangler d1 execute nexra-db --file=migrations/XXX_migration.sql --remote
```

## Known Issues & Solutions

### User ID Changes on Login
**Problem:** Google OAuth can generate different user IDs, causing users to appear as new.
**Solution:** Backend looks up users by email and preserves original database ID.

### Foreign Key Constraints
**Problem:** Can't update user ID due to FK references from analyses/recordings.
**Solution:** Never update user ID; return original ID to frontend.

### Tailwind Classes Not Applying
**Problem:** Some Tailwind classes don't work in production.
**Solution:** Use inline styles for critical positioning (e.g., fixed buttons).

## TODO

- [x] Add mobile "not available" page/popup after Riot account linking
- [x] Add more detailed coaching based on lane/role
- [ ] Implement video analysis (Nexra Vision)
- [ ] Implement Stripe payments for credits
- [ ] Add social features (compare with friends)

## Contributing

This is a private project. Contact the maintainer for access.

## License

Proprietary - All rights reserved.
