# Nexra - League of Legends Dashboard
## État du Projet - 14 Janvier 2026

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
- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + Vercel
- **Backend**: Cloudflare Workers (Hono) + D1 (SQLite) + R2 (Storage) + Queues + KV
- **Recorder**: Electron + FFmpeg + Node.js + Windows Installer (NSIS)
- **IA**: Claude AI (Sonnet 4) avec Vision pour analyse vidéo
- **APIs**: Riot Games API + Data Dragon CDN + Anthropic API

---

## ✅ Fonctionnalités Implémentées

### 1. **Authentification & Profil**
- Recherche de joueur par Riot ID (GameName#TagLine)
- Affichage des informations de profil (icône, niveau, région)
- Affichage du rang actuel (tier, division, LP, winrate)
- Top 3 champions joués avec statistiques

### 2. **Onglet Summary (Résumé)**
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

### 3. **Onglet Champions (Statistiques détaillées)**
- En-tête professionnel avec statistiques globales
- Liste de tous les champions joués (triable par Games/Winrate/KDA)
- Top 3 meilleurs/pires matchups par champion

### 4. **Système d'Images Dynamiques**
- Fetch automatique de la dernière version Data Dragon
- URLs dynamiques pour champions/items/spells/icônes

### 5. **Analyse IA des Parties** ✨
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

### 6. **Nexra Vision - Desktop App** ✨ NOUVEAU ✨

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

#### Distribution
- **Installer Windows**: NSIS (.exe)
- **Hébergement**: GitHub Releases
- **Téléchargement**: Bouton sur le dashboard quand Vision non détecté

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

### Avantages
- Pas de popup "accès réseau local" dans le navigateur
- Détection fiable même derrière firewall
- Fonctionne avec Vercel (pas besoin de localhost)

---

## 📁 Structure du Projet

### Projet Frontend - nexra (`/src`)
```
├── components/
│   ├── PlayerHeader.tsx          # En-tête avec profil et rang
│   ├── RecentGames.tsx           # Conteneur principal avec tabs
│   ├── MatchCard.tsx             # Carte de match détaillée
│   ├── ChampionsStats.tsx        # Statistiques par champion
│   ├── NexraVisionStatus.tsx     # ✨ Détection Vision + Download
│   ├── NavigationTabs.tsx        # Menu (Summary/Champions/Analysis)
│   ├── skeletons/                # Composants skeleton loading
│   └── analysis/                 # Composants d'analyse IA
│       ├── AnalysisTab.tsx       # ✨ Avec détection Vision heartbeat
│       ├── GameAnalysisCard.tsx
│       ├── DeathClipsSection.tsx
│       └── ...
├── app/api/
│   ├── riot/                     # Routes Riot Games API
│   └── vision/                   # ✨ Route legacy (non utilisée)
└── utils/
    ├── ddragon.ts                # Gestion Data Dragon
    ├── nexraApi.ts               # Client API Nexra
    └── ...
```

### Projet Backend - nexra-api (Cloudflare Workers)
```
nexra-api/
├── src/
│   ├── index.ts              # Point d'entrée + Queue consumer
│   ├── routes/
│   │   ├── analysis.ts       # CRUD analyses + queue send
│   │   ├── recordings.ts     # Upload vidéo + clips + streaming
│   │   └── vision.ts         # ✨ Heartbeat endpoints
│   ├── services/
│   │   └── analyzer.ts       # Logique d'analyse IA (Claude Vision)
│   └── types/
│       └── index.ts          # Types partagés
├── wrangler.toml             # Configuration Cloudflare
└── schema.sql                # Schema D1
```

### Projet Recorder - nexra-vision (Electron)
```
nexra-vision/
├── src/
│   ├── main.js               # App Electron principale
│   │   ├── Détection de partie LoL
│   │   ├── Enregistrement écran (MediaRecorder)
│   │   ├── Extraction clips (FFmpeg)
│   │   ├── Upload vers nexra-api (sans analyse auto)
│   │   ├── Heartbeat toutes les 20s
│   │   └── Overlay in-game
│   └── windows/
│       ├── recorder.html
│       ├── overlay.html
│       └── settings.html
├── assets/
│   └── nexra-vision-ico.ico
├── package.json              # Version 1.0.4
└── dist/                     # Build output
    └── Nexra-Vision-Setup-1-0-4.exe
```

---

## 🔧 Dernières Modifications

### 14/01/2026 - Session 2 : Heartbeat & Manual Analysis

#### Système Heartbeat (nexra-api)
1. **Nouveaux endpoints**
   - `POST /vision/heartbeat` - Reçoit heartbeat avec PUUID
   - `GET /vision/status/:puuid` - Vérifie si Vision online
2. **Stockage KV** avec TTL 30 secondes
3. **Pas de popup** navigateur (plus de call localhost)

#### Nexra Vision v1.0.4
1. **Heartbeat** envoyé toutes les 20 secondes
2. **Plus d'analyse automatique** - upload seulement
3. **Notification** "Recording Ready - Go to dashboard to start AI analysis"
4. **Auto-start** Windows conservé

#### Frontend Updates
1. **NexraVisionStatus.tsx** - Utilise heartbeat API
2. **AnalysisTab.tsx** - Utilise heartbeat API + bouton download
3. **Bouton "Download Nexra Vision"** quand non détecté
4. **Supprimé** boutons retry/re-analyze
5. **Navigation** "Back to Dashboard" → onglet Recent Games

#### Déploiements
- **Vercel**: https://nexra-jet.vercel.app/
- **Cloudflare Workers**: https://nexra-api.nexra-api.workers.dev
- **GitHub Release**: v1.0.4

### 14/01/2026 - Session 1 : Analyse IA Complete

#### Backend nexra-api
- Déploiement Cloudflare Workers
- Routes recordings + analysis
- Analyse IA Claude Vision
- Fix snake_case → camelCase

#### Recorder nexra-vision
- Enregistrement automatique
- Extraction clips parallélisée
- Upload vers API

#### Frontend nexra
- Onglet Analysis complet
- Vidéo player avec seeking
- UI traduite en anglais

---

## 🚀 Comment Démarrer

### Prérequis
```bash
Node.js 18+
npm ou pnpm
FFmpeg (pour nexra-vision)
Compte Cloudflare (pour nexra-api)
Compte Vercel (pour nexra)
```

### 1. Frontend (nexra)
```bash
cd nexra
npm install

# Configuration .env.local :
RIOT_API_KEY=RGAPI-xxx
NEXT_PUBLIC_NEXRA_API_URL=https://nexra-api.nexra-api.workers.dev

npm run dev   # http://localhost:3000
```

### 2. Backend (nexra-api)
```bash
cd nexra-api
npm install

# Secrets Cloudflare
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put RIOT_API_KEY

# Déploiement
npx wrangler deploy
```

### 3. Recorder (nexra-vision)
```bash
cd nexra-vision
npm install

# Build Windows installer
npm run build:win

# Output: dist/Nexra-Vision-Setup-1-0-4.exe
```

### 4. Créer une Release GitHub
1. Tag: `v1.0.X`
2. Upload: `Nexra-Vision-Setup-1-0-X.exe`
3. Mettre à jour lien dans `NexraVisionStatus.tsx` et `AnalysisTab.tsx`

---

## 🐛 Problèmes Connus & Solutions

### Nexra Vision non détecté
- **Cause**: Ancienne version sans heartbeat
- **Solution**: Désinstaller et installer v1.0.4+

### Analyse se lance automatiquement
- **Cause**: Ancienne version < v1.0.4
- **Solution**: Installer v1.0.4 (analyse manuelle)

### Rate Limiting Riot API
- **Solution**: Délais de 200ms entre requêtes + retry backoff

### Windows SmartScreen Warning
- **Cause**: Installer non signé
- **Solution**: Certificat de signature de code ($300-500/an)
- **Workaround**: Cliquer "Plus d'infos" → "Exécuter quand même"

---

## 📝 TODO / Améliorations Futures

### Court Terme
- [x] ~~Heartbeat system pour détection Vision~~
- [x] ~~Analyse manuelle (pas automatique)~~
- [ ] Loading skeletons améliorés
- [ ] Cache API Riot (Next.js revalidation)
- [ ] Infinite scroll pour les matchs

### Moyen Terme
- [ ] Certificat de signature Windows
- [ ] Version Mac de Nexra Vision
- [ ] Système de favoris joueurs
- [ ] Mode comparaison

---

## 🔐 Système Utilisateur & Monétisation (Priorité Haute)

### 1. Authentification & Gestion Utilisateur

#### Inscription / Connexion
- [ ] Page d'inscription (email + mot de passe)
- [ ] Page de connexion
- [ ] OAuth providers (Google, Discord)
- [ ] Vérification email
- [ ] Mot de passe oublié / Reset
- [ ] Session management (JWT tokens)

#### Liaison Compte Riot
- [ ] OAuth Riot Sign-On (RSO)
- [ ] Vérification de propriété du compte
- [ ] Support multi-comptes Riot par utilisateur
- [ ] Sync automatique des données de profil

#### Profil Utilisateur
- [ ] Page profil avec infos personnelles
- [ ] Avatar personnalisable
- [ ] Préférences (langue, notifications)
- [ ] Historique des analyses
- [ ] Comptes Riot liés

### 2. Système de Crédits

#### Crédits de Base
- [ ] Crédits offerts à l'inscription (ex: 3 analyses gratuites)
- [ ] Crédits bonus première liaison Riot
- [ ] Affichage solde crédits dans header/dashboard

#### Consommation
- [ ] 1 crédit = 1 analyse IA complète
- [ ] Blocage si solde insuffisant
- [ ] Confirmation avant consommation
- [ ] Historique des consommations

#### Recharges (Achat de crédits)
| Pack | Crédits | Prix | Bonus |
|------|---------|------|-------|
| Starter | 5 | 4.99€ | - |
| Standard | 15 | 9.99€ | +2 gratuits |
| Pro | 50 | 24.99€ | +10 gratuits |
| Ultimate | 150 | 49.99€ | +50 gratuits |

### 3. Abonnements (Alternative/Complément)

| Plan | Prix/mois | Analyses | Avantages |
|------|-----------|----------|-----------|
| **Free** | 0€ | 2/mois | Fonctionnalités de base |
| **Plus** | 9.99€ | 20/mois | Analyses prioritaires |
| **Pro** | 19.99€ | Illimité | Support prioritaire, features avancées |

#### Fonctionnalités par tier
- **Free**: Stats de base, 2 analyses/mois, pub
- **Plus**: Stats avancées, 20 analyses/mois, sans pub
- **Pro**: Tout illimité, coaching tips avancés, export PDF

### 4. Paiement & Facturation

#### Intégration Stripe
- [ ] Checkout sécurisé
- [ ] Paiement CB (Visa, Mastercard)
- [ ] Apple Pay / Google Pay
- [ ] Gestion des abonnements récurrents
- [ ] Webhooks pour confirmation paiement

#### Facturation
- [ ] Historique des achats
- [ ] Factures téléchargeables (PDF)
- [ ] Gestion TVA par pays

### 5. Base de Données Utilisateurs

#### Tables à créer (D1/PostgreSQL)
```sql
-- Utilisateurs
users (id, email, password_hash, created_at, email_verified)

-- Comptes Riot liés
riot_accounts (id, user_id, puuid, game_name, tag_line, region, is_primary)

-- Crédits
credit_balances (user_id, balance, updated_at)
credit_transactions (id, user_id, amount, type, description, created_at)

-- Abonnements
subscriptions (id, user_id, plan, status, stripe_subscription_id, expires_at)

-- Achats
purchases (id, user_id, amount, credits, stripe_payment_id, created_at)
```

### 6. Fonctionnalités Additionnelles

#### Gamification
- [ ] Badges/Achievements (première analyse, 10 analyses, etc.)
- [ ] Streak de connexion quotidienne
- [ ] Classement amélioration (progression du score)

#### Social
- [ ] Partage d'analyse (lien public/privé)
- [ ] Comparaison avec amis
- [ ] Leaderboard communautaire

#### Programme de Parrainage
- [ ] Code parrain unique par utilisateur
- [ ] Bonus parrain: +1 crédit par filleul inscrit
- [ ] Bonus filleul: +1 crédit bonus à l'inscription
- [ ] Dashboard parrainage (stats, gains)

#### Notifications
- [ ] Email récap hebdomadaire
- [ ] Push notifications (analyse terminée)
- [ ] Alertes solde crédits bas

### 7. Admin Dashboard

- [ ] Gestion utilisateurs (ban, crédits manuels)
- [ ] Stats globales (revenus, utilisateurs, analyses)
- [ ] Logs d'activité
- [ ] Gestion des codes promo

---

## 🛠️ Stack Technique Recommandée

### Authentification
- **NextAuth.js** ou **Clerk** pour auth
- **Riot RSO** pour liaison compte LoL
- **JWT** pour sessions

### Paiement
- **Stripe** pour paiements et abonnements
- **Stripe Checkout** pour UI de paiement
- **Webhooks** pour events (payment_succeeded, subscription_updated)

### Base de Données
- **Cloudflare D1** (actuel) ou **PlanetScale/Supabase** pour scale
- **Drizzle ORM** ou **Prisma** pour requêtes

### Email
- **Resend** ou **SendGrid** pour emails transactionnels
- Templates pour: vérification, reset password, récap hebdo

---

## 📊 Métriques Business à Tracker

- **MRR** (Monthly Recurring Revenue)
- **Taux de conversion** Free → Paid
- **ARPU** (Average Revenue Per User)
- **Churn rate** (taux de désabonnement)
- **CAC** (Customer Acquisition Cost)
- **LTV** (Lifetime Value)

---

## 🚀 Roadmap Suggérée

### Phase 1 - MVP Auth (2-3 semaines)
1. Inscription/Connexion email
2. Liaison compte Riot basique
3. Table users dans D1

### Phase 2 - Crédits (1-2 semaines)
1. Système de crédits
2. Crédits gratuits à l'inscription
3. Blocage si pas de crédits

### Phase 3 - Paiement (2 semaines)
1. Intégration Stripe
2. Achat de packs de crédits
3. Historique achats

### Phase 4 - Abonnements (2 semaines)
1. Plans Free/Plus/Pro
2. Gestion abonnements Stripe
3. Features par tier

### Phase 5 - Polish (1-2 semaines)
1. Programme parrainage
2. Badges/Gamification
3. Admin dashboard

---

## 🏆 État Actuel

### Frontend (nexra)
✅ Déployé sur Vercel
✅ Détection Vision via heartbeat
✅ UI complète en anglais
✅ Bouton download Vision

### Backend (nexra-api)
✅ Déployé sur Cloudflare Workers
✅ Heartbeat endpoints fonctionnels
✅ Analyse IA Claude Vision
✅ Upload vidéo R2

### Recorder (nexra-vision)
✅ v1.0.4 avec heartbeat
✅ Analyse manuelle uniquement
✅ Auto-start Windows
✅ Distribué via GitHub Releases

---

*Dernière mise à jour : 14 Janvier 2026 - Session 2*
