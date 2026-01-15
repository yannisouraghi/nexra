# Nexra - League of Legends Dashboard
## État du Projet - 15 Janvier 2026 (Mise à jour Session 4)

---

## 📋 Vue d'ensemble

Application Next.js 15 de statistiques League of Legends avec intégration complète de l'API Riot Games et **analyse IA des parties avec coaching personnalisé**.

### Architecture Multi-Projets
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  nexra          │────►│  nexra-api      │◄────│  nexra-vision   │
│  (Next.js)      │     │  (CF Workers)   │     │  (Electron)     │
│  Frontend       │     │  Backend        │     │  Recorder       │
│  Vercel         │     │  Cloudflare     │     │  Windows App    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ GitHub          │     │ Claude AI       │     │ GitHub Releases │
│ nexra repo      │     │ (Vision)        │     │ Installer .exe  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### URLs de Production
- **Frontend**: https://nexra-jet.vercel.app/
- **Backend API**: https://nexra-api.nexra-api.workers.dev
- **Vision Releases**: https://github.com/yannisouraghi/nexra-vision/releases

### Repositories GitHub
- **nexra** (Frontend): https://github.com/yannisouraghi/nexra
- **nexra-api** (Backend): https://github.com/yannisouraghi/nexra-api
- **nexra-vision** (Recorder): https://github.com/yannisouraghi/nexra-vision

### Technologies
- **Frontend**: Next.js 15 (App Router) + TypeScript + CSS Custom + Vercel
- **Backend**: Cloudflare Workers (Hono) + D1 (SQLite) + R2 (Storage) + Queues + KV
- **Recorder**: Electron + FFmpeg + Node.js + Windows Installer (NSIS)
- **IA**: Claude AI (Sonnet 4) avec Vision pour analyse vidéo
- **Auth**: NextAuth.js v5 + Google OAuth
- **APIs**: Riot Games API + Data Dragon CDN + Anthropic API

---

## ✅ Fonctionnalités Implémentées

### 1. **Authentification & Gestion Utilisateur** ✨ NOUVEAU ✨

#### Google OAuth
- Connexion via Google (NextAuth.js v5)
- Session JWT sécurisée
- Sync automatique avec base de données D1

#### Liaison Compte Riot
- Page dédiée `/link-riot`
- Validation du compte via Riot API
- Stockage sécurisé en DB (pas juste localStorage)
- Protection contre le vol de compte (PUUID unique par utilisateur)

#### Système de Crédits
- 3 crédits gratuits à l'inscription
- Consommation par analyse IA
- API pour gérer les crédits

#### Pages Auth
- **Landing Page** (`/`) - Présentation du produit
- **Login** (`/login`) - Connexion Google
- **Link Riot** (`/link-riot`) - Liaison compte LoL
- **Dashboard** (`/dashboard`) - Accès protégé

### 2. **Dashboard & Profil**
- Recherche de joueur par Riot ID (GameName#TagLine)
- Affichage des informations de profil (icône, niveau, région)
- Affichage du rang actuel (tier, division, LP, winrate)
- Top 3 champions joués avec statistiques

### 3. **Onglet Summary (Résumé)**
- Liste des matchs récents avec détails complets
- Filtres par mode de jeu (Ranked Solo/Duo, Normal, ARAM, etc.)
- Cartes de match extensibles avec 6 onglets :
  - **Overview**: Stats principales, items, runes
  - **Combat**: Dégâts, kills, healing
  - **Economy**: Or, CS, graphiques de progression
  - **Charts**: Graphiques temporels (or, CS, XP, niveau)
  - **Scoreboard**: Tableau complet des 10 joueurs
  - **Probability**: Calcul de probabilité de victoire
- Badge MVP pour le meilleur joueur de chaque équipe
- Indicateur de rôle et autofill
- Win probability badge sur chaque match

### 4. **Onglet Champions (Statistiques détaillées)**
- En-tête professionnel avec statistiques globales
- Liste de tous les champions joués (triable par Games/Winrate/KDA)
- Top 3 meilleurs/pires matchups par champion

### 5. **Analyse IA des Parties**
**Onglet Analysis avec coaching IA personnalisé**

#### Workflow
1. **Nexra Vision** enregistre automatiquement les parties
2. **Upload vidéo** vers le backend (pas d'analyse automatique)
3. **L'utilisateur** lance l'analyse manuellement depuis le dashboard
4. **Claude Vision** analyse les clips et génère des conseils

#### Fonctionnalités
- Score de performance global (0-100)
- Détection d'erreurs classées par sévérité
- Conseils personnalisés basés sur le champion/rôle
- Plan d'amélioration immédiat, court et long terme

### 6. **Nexra Vision - Desktop App**

#### Fonctionnalités
- **Détection automatique** des parties League of Legends
- **Enregistrement écran** avec overlay in-game
- **Auto-start** au démarrage de Windows
- **Heartbeat system** pour détection depuis le dashboard
- **Upload automatique** de l'enregistrement après la partie

#### Versions
| Version | Changements |
|---------|-------------|
| v1.0.0 | Release initiale |
| v1.0.1 | Auto-start au boot Windows |
| v1.0.2 | URL production Vercel |
| v1.0.3 | Système heartbeat pour détection dashboard |
| v1.0.4 | Analyse manuelle uniquement (plus d'auto-start analyse) |

---

## 🔐 Système d'Authentification (Implémenté)

### Architecture Auth
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Landing Page   │────►│  Google OAuth   │────►│  Link Riot      │
│  (/)            │     │  (/login)       │     │  (/link-riot)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  Dashboard      │
                                                │  (/dashboard)   │
                                                │  Protected      │
                                                └─────────────────┘
```

### Flux d'authentification
1. **Utilisateur arrive** sur la landing page
2. **Clique "Start with Google"** → redirection vers Google OAuth
3. **Google authentifie** → callback vers NextAuth
4. **NextAuth crée/sync** l'utilisateur dans D1 via `/users/auth`
5. **Redirection** vers `/link-riot` si pas de compte Riot lié
6. **Utilisateur entre** son Riot ID (GameName#TAG)
7. **Validation** via Riot API
8. **Liaison** du PUUID à l'utilisateur dans D1
9. **Redirection** vers `/dashboard`

### Base de Données Users (D1)

#### Table `users`
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,           -- Google OAuth ID
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    image TEXT,

    -- Riot Account
    riot_puuid TEXT UNIQUE,        -- Lié aux analyses
    riot_game_name TEXT,
    riot_tag_line TEXT,
    riot_region TEXT,
    riot_linked_at TEXT,

    -- Credits
    credits INTEGER DEFAULT 3,     -- 3 gratuits au départ
    total_credits_used INTEGER DEFAULT 0,

    -- Subscription
    subscription_tier TEXT DEFAULT 'free',
    subscription_expires_at TEXT,

    -- Timestamps
    created_at TEXT,
    updated_at TEXT,
    last_login_at TEXT
);
```

### API Endpoints Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users/auth` | Créer/sync utilisateur à la connexion |
| GET | `/users/:id` | Récupérer infos utilisateur |
| POST | `/users/:id/link-riot` | Lier compte Riot |
| DELETE | `/users/:id/link-riot` | Délier compte Riot |
| GET | `/users/:id/credits` | Voir crédits restants |
| POST | `/users/:id/use-credit` | Consommer un crédit |
| POST | `/users/:id/add-credits` | Ajouter crédits (achat) |

### Configuration Google OAuth

1. **Google Cloud Console**: https://console.cloud.google.com/apis/credentials
2. **Créer OAuth 2.0 Client ID**
3. **Redirect URI**: `http://localhost:3000/api/auth/callback/google`
4. **Production**: Ajouter l'URI Vercel

### Variables d'environnement (.env.local)
```env
# Auth
AUTH_SECRET=<generated-secret>
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>

# Riot
RIOT_API_KEY=RGAPI-xxx

# API
NEXT_PUBLIC_NEXRA_API_URL=https://nexra-api.nexra-api.workers.dev
```

---

## 🔄 Système de Heartbeat

### Architecture
```
┌─────────────────┐                    ┌─────────────────┐
│  Nexra Vision   │ ──── heartbeat ───►│  nexra-api      │
│  (toutes 20s)   │     POST /vision/  │  (Cloudflare KV)│
└─────────────────┘     heartbeat      └─────────────────┘
                                              │
                                              ▼
┌─────────────────┐                    ┌─────────────────┐
│  Dashboard      │◄─── status ────────│  KV Storage     │
│  (vérifie 30s)  │     GET /vision/   │  (TTL 30s)      │
└─────────────────┘     status/:puuid  └─────────────────┘
```

### Endpoints API
- `POST /vision/heartbeat` - Nexra Vision envoie son PUUID + version
- `GET /vision/status/:puuid` - Dashboard vérifie si Vision est online

### Timing
- Vision envoie heartbeat: **toutes les 20 secondes**
- TTL du heartbeat: **30 secondes**
- Dashboard vérifie: **toutes les 30 secondes**
- Délai max détection offline: **~30-60 secondes**

---

## 📁 Structure du Projet

### Projet Frontend - nexra (`/src`)
```
├── app/
│   ├── page.tsx                 # ✨ Landing page (nouveau design)
│   ├── login/page.tsx           # ✨ Page connexion Google
│   ├── link-riot/page.tsx       # ✨ Liaison compte Riot
│   ├── dashboard/page.tsx       # Dashboard protégé
│   ├── globals.css              # ✨ Design system complet
│   └── api/
│       ├── auth/[...nextauth]/  # ✨ NextAuth handlers
│       └── riot/                # Routes Riot Games API
├── components/
│   ├── PlayerHeader.tsx
│   ├── RecentGames.tsx
│   ├── MatchCard.tsx
│   ├── ChampionsStats.tsx
│   ├── NexraVisionStatus.tsx
│   ├── Providers.tsx            # ✨ SessionProvider
│   ├── AnimatedBackground.tsx
│   └── analysis/
│       ├── AnalysisTab.tsx
│       └── ...
├── types/
│   └── next-auth.d.ts           # ✨ Types session étendue
├── auth.ts                      # ✨ Config NextAuth + sync DB
└── middleware.ts                # ✨ Protection routes
```

### Projet Backend - nexra-api (Cloudflare Workers)
```
nexra-api/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── analysis.ts
│   │   ├── recordings.ts
│   │   ├── vision.ts
│   │   └── users.ts             # ✨ CRUD utilisateurs
│   ├── services/
│   │   └── analyzer.ts
│   └── types/
│       └── index.ts
├── migrations/
│   ├── 001_add_match_data.sql
│   ├── 002_add_clips_column.sql
│   ├── 003_add_progress_columns.sql
│   └── 004_add_users_table.sql  # ✨ Table users + crédits
├── wrangler.toml
└── schema.sql
```

---

## 🔧 Dernières Modifications

### 14/01/2026 - Session 3 : Authentification & Gestion Utilisateur

#### Authentification Google OAuth
1. **NextAuth.js v5** configuré avec Google provider
2. **Session JWT** avec données utilisateur étendues
3. **Sync automatique** avec backend D1 à chaque connexion

#### Pages Auth
1. **Landing page** (`/`) - Design "Digital Arena" épuré
2. **Login page** (`/login`) - Bouton Google
3. **Link Riot page** (`/link-riot`) - Formulaire liaison
4. **Dashboard** (`/dashboard`) - Route protégée

#### Backend Users API
1. **Migration 004** - Table `users` avec crédits
2. **Routes CRUD** - Auth, link-riot, credits
3. **Protection** - Un PUUID ne peut être lié qu'à un seul compte

#### Design System
1. **Suppression** des cercles animés qui gênaient le texte
2. **Design épuré** - Fond sombre avec glows subtils
3. **CSS custom** - Plus de Tailwind inline, classes dédiées
4. **Responsive** - Mobile-first

#### Déploiements
- **Migration D1**: Table users appliquée
- **Cloudflare Workers**: API users déployée
- **Config Google**: OAuth configuré

### 14/01/2026 - Session 2 : Heartbeat & Manual Analysis
(Voir historique précédent)

### 14/01/2026 - Session 1 : Analyse IA Complete
(Voir historique précédent)

---

## 🚀 Comment Démarrer

### Prérequis
```bash
Node.js 18+
npm ou pnpm
FFmpeg (pour nexra-vision)
Compte Cloudflare (pour nexra-api)
Compte Vercel (pour nexra)
Compte Google Cloud (pour OAuth)
```

### 1. Frontend (nexra)
```bash
cd nexra
npm install

# Configuration .env.local :
AUTH_SECRET=<générer avec: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
RIOT_API_KEY=RGAPI-xxx
NEXT_PUBLIC_NEXRA_API_URL=https://nexra-api.nexra-api.workers.dev

npm run dev   # http://localhost:3000
```

### 2. Backend (nexra-api)
```bash
cd nexra-api
npm install

# Appliquer migrations
npx wrangler d1 execute nexra-db --file=./migrations/004_add_users_table.sql --remote

# Secrets Cloudflare
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put RIOT_API_KEY

# Déploiement
npm run deploy
```

### 3. Config Google OAuth
1. Aller sur https://console.cloud.google.com/apis/credentials
2. Créer un projet "Nexra"
3. Configurer écran de consentement OAuth (External)
4. Créer identifiants OAuth 2.0
5. Ajouter redirect URI: `http://localhost:3000/api/auth/callback/google`
6. **Important**: Ajouter ton email comme "Utilisateur test" dans Audience

### 4. Recorder (nexra-vision)
```bash
cd nexra-vision
npm install
npm run build:win
# Output: dist/Nexra-Vision-Setup-1-0-4.exe
```

---

## 🐛 Problèmes Connus & Solutions

### Erreur "Access blocked" Google OAuth
- **Cause**: Email non ajouté comme utilisateur test
- **Solution**: Google Auth Platform → Audience → Ajouter utilisateur test

### Nexra Vision non détecté
- **Cause**: Ancienne version sans heartbeat
- **Solution**: Désinstaller et installer v1.0.4+

### Analyse se lance automatiquement
- **Cause**: Ancienne version < v1.0.4
- **Solution**: Installer v1.0.4 (analyse manuelle)

---

## 📝 TODO / Améliorations Futures

### Court Terme
- [x] ~~Heartbeat system pour détection Vision~~
- [x] ~~Analyse manuelle (pas automatique)~~
- [x] ~~Authentification Google OAuth~~
- [x] ~~Gestion utilisateur en DB~~
- [x] ~~Système de crédits de base~~
- [x] ~~Loading skeletons améliorés~~
- [x] ~~Infinite scroll pour les matchs~~

### Moyen Terme
- [ ] Intégration Stripe (achat crédits)
- [ ] Abonnements (Free/Pro/Unlimited)
- [ ] Riot Sign-On (RSO) quand disponible
- [ ] Programme parrainage
- [ ] Admin dashboard

### Long Terme
- [ ] Version Mac de Nexra Vision
- [ ] App mobile
- [ ] Coaching live pendant la partie

---

## 🏆 État Actuel

### Frontend (nexra)
✅ Landing page moderne avec video LoL
✅ Authentification Google OAuth
✅ Liaison compte Riot sécurisée
✅ Dashboard protégé avec redirections intelligentes
✅ Design system épuré
✅ Loading skeletons premium avec shimmer cyan
✅ Infinite scroll pour les matchs

### Backend (nexra-api)
✅ Table users avec crédits
✅ API users complète
✅ Heartbeat endpoints
✅ Analyse IA Claude Vision
✅ Upload vidéo R2

### Recorder (nexra-vision)
✅ v1.0.4 avec heartbeat
✅ Analyse manuelle uniquement
✅ Auto-start Windows
✅ Distribué via GitHub Releases

---

*Dernière mise à jour : 15 Janvier 2026 - Session 4 (UI/UX Improvements)*
