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
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
             ┌─────────────┐       ┌─────────────┐
             │ Claude AI   │       │ Cloudflare  │
             │ (Vision)    │       │ R2/D1/Queue │
             └─────────────┘       └─────────────┘
```

### Technologies
- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Cloudflare Workers (Hono) + D1 (SQLite) + R2 (Storage) + Queues
- **Recorder**: Electron + FFmpeg + Node.js
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
- En-tête professionnel avec statistiques globales :
  - Champion le plus joué
  - Meilleur winrate
  - Meilleur KDA
  - Total dégâts
  - CS moyen
- Liste de tous les champions joués (triable par Games/Winrate/KDA)
- Cartes de champions extensibles avec :
  - Badge de classement (#1, #2, #3...)
  - Statistiques détaillées (games, W-L, KDA, CS, Or, Dégâts, Vision)
  - **Top 3 meilleurs matchups** (contre qui vous gagnez le plus en lane)
  - **Top 3 pires matchups** (contre qui vous perdez le plus en lane)
- Animation fluide lors du changement d'onglet
- Design épuré et moderne

### 4. **Système d'Images Dynamiques**
- Fetch automatique de la dernière version Data Dragon
- Mise à jour dynamique de toutes les images :
  - Champions (y compris les nouveaux comme Mel)
  - Items
  - Sorts d'invocateur
  - Icônes de profil
- Centralisation dans `/src/utils/ddragon.ts`
- Gestion des cas spéciaux de noms de champions

### 5. **Analyse IA des Parties** ✨ NOUVEAU ✨
**Onglet Analysis avec coaching IA personnalisé**

#### Fonctionnalités
- **Enregistrement automatique** des parties avec Nexra Vision (Electron)
- **Upload vidéo** vers Cloudflare R2 (~100 MB max, format WebM)
- **Extraction de clips** aux moments clés (morts, kills, objectifs)
- **Analyse Vision IA** des clips avec Claude (frames extraites)
- **Score de performance** global (0-100) avec breakdown par catégorie
- **Détection d'erreurs** classées par sévérité (critical/high/medium/low)
- **Conseils personnalisés** basés sur le champion et le rôle joués
- **Plan d'amélioration** immédiat, court terme et long terme

#### Composants Frontend (`/src/components/analysis/`)
- `AnalysisTab.tsx` - Onglet principal avec liste des analyses
- `AnalysisOverview.tsx` - Vue d'ensemble des performances
- `GameAnalysisModal.tsx` - Modal détaillé d'une analyse
- `DeathClipsSection.tsx` - Section morts avec vidéo + analyse IA
- `ErrorsList.tsx` - Liste des erreurs détectées
- `CoachingTips.tsx` - Conseils de coaching
- `VideoClipPlayer.tsx` - Lecteur vidéo avec seeking
- `StatsComparison.tsx` - Comparaison avec la moyenne du rang

#### Types d'erreurs détectées
- Objectifs mal gérés (Dragon/Baron)
- Morts avant objectifs
- Power spikes ignorés
- Mauvaise macro/positionnement
- Vision insuffisante
- Mauvais teamfights
- Back timings incorrects
- Wave management

---

## 📁 Structure du Projet

### Projet Frontend - nexra (`/src`)
```
├── components/
│   ├── PlayerHeader.tsx          # En-tête avec profil et rang
│   ├── RecentGames.tsx           # Conteneur principal avec tabs
│   ├── MatchCard.tsx             # Carte de match détaillée
│   ├── ChampionsStats.tsx        # Statistiques par champion
│   ├── NavigationTabs.tsx        # Menu (Summary/Champions/Analysis)
│   ├── GameModeFilter.tsx        # Filtres de mode de jeu
│   ├── WinProbabilityBadge.tsx   # Badge probabilité de victoire
│   └── analysis/                 # ✨ Composants d'analyse IA
│       ├── AnalysisTab.tsx
│       ├── GameAnalysisModal.tsx
│       ├── DeathClipsSection.tsx
│       ├── ErrorsList.tsx
│       ├── CoachingTips.tsx
│       ├── VideoClipPlayer.tsx
│       └── StatsComparison.tsx
├── app/api/
│   ├── riot/                     # Routes Riot Games API
│   │   ├── summoner/route.ts
│   │   ├── rank/route.ts
│   │   ├── matches/route.ts
│   │   ├── match-timeline/route.ts
│   │   ├── champion-details/route.ts
│   │   ├── player-stats/route.ts
│   │   └── enrich-player/route.ts
│   └── analysis/                 # ✨ Routes d'analyse (mock)
│       ├── games/route.ts
│       ├── [id]/route.ts
│       └── generate/route.ts
├── types/
│   └── analysis.ts               # ✨ Types pour l'analyse IA
└── utils/
    ├── ddragon.ts                # Gestion Data Dragon
    ├── nexraApi.ts               # ✨ Client API Nexra
    ├── winProbabilityCalculator.ts
    ├── roleDetection.ts
    └── matchDataAdapter.ts
```

### Projet Backend - nexra-api (Cloudflare Workers)
```
nexra-api/
├── src/
│   ├── index.ts              # Point d'entrée + Queue consumer
│   ├── routes/
│   │   ├── analysis.ts       # CRUD analyses + queue send
│   │   └── recordings.ts     # Upload vidéo + clips + streaming
│   ├── services/
│   │   └── analyzer.ts       # Logique d'analyse IA (Claude Vision)
│   ├── types/
│   │   └── index.ts          # Types partagés
│   └── utils/
│       └── helpers.ts        # Utilitaires
├── wrangler.toml             # Configuration Cloudflare
└── schema.sql                # Schema D1 (recordings, analyses)
```

### Projet Recorder - nexra-vision (Electron)
```
nexra-vision/
├── src/
│   └── main.js               # App Electron principale
│       ├── Détection de partie LoL
│       ├── Enregistrement écran (MediaRecorder)
│       ├── Extraction clips (FFmpeg)
│       ├── Upload vers nexra-api
│       └── Overlay in-game
├── config.json               # Configuration utilisateur
└── package.json
```

---

## 🎨 Design & UX

### Système de Design
- **Glass morphism** avec cartes translucides
- **Animations** progressives avec delays (30ms entre éléments)
- **Couleurs dynamiques** selon le rang (cyan pour élevé, rouge pour bas)
- **Responsive** : layouts différents mobile/desktop
- **Police principale** : Rajdhani (moderne et tech)

### Animations
- Fade-in au chargement des sections
- Transitions douces lors du changement d'onglet
- Hover effects sur tous les éléments interactifs
- Pas de flickering grâce à la simplification des animations

### Palette de Couleurs
- **Victoire** : Cyan (#00d4ff) / Bleu
- **Défaite** : Rouge (#ef4444)
- **Rang élevé** : Cyan / Or
- **Rang bas** : Rouge / Gris
- **Background** : Noir (#0a0a0a) avec gradients subtils

---

## 🔧 Dernières Modifications

### 14/01/2026 - Analyse IA Complete

#### Backend nexra-api (Cloudflare Workers)
1. **Déploiement sur Cloudflare Workers**
   - URL: `https://nexra-api.nexra-api.workers.dev`
   - D1 Database: `nexra-db`
   - R2 Bucket: `nexra-videos`
   - Queue: `nexra-analysis-queue`

2. **Routes implémentées**
   - `POST /recordings/upload-url` - Créer un enregistrement
   - `PUT /recordings/:id/upload` - Upload vidéo (max 100MB)
   - `POST /recordings/:id/clips` - Upload clips avec frames
   - `GET /recordings/:matchId/video` - Streaming vidéo avec Range support
   - `POST /analysis` - Créer une analyse
   - `POST /analysis/:id/reanalyze` - Relancer une analyse
   - `GET /analysis/:id` - Récupérer une analyse
   - `GET /analysis?puuid=X` - Lister les analyses d'un joueur

3. **Analyse IA avec Claude Vision**
   - Extraction de 3 frames par clip
   - Envoi à Claude Sonnet 4 avec contexte de jeu
   - Analyse de position, minimap, erreurs
   - Génération de conseils personnalisés par champion/rôle

4. **Fix snake_case → camelCase**
   - API retourne maintenant `matchId`, `createdAt`, etc.
   - Transformation dans toutes les routes GET

#### Recorder nexra-vision (Electron)
1. **Enregistrement automatique**
   - Détection du processus League of Legends
   - Hotkey F9 pour démarrer/arrêter
   - Overlay in-game avec statut

2. **Extraction de clips optimisée**
   - Traitement parallèle par batches de 4
   - Tous les clips uploadés (pas de limite)
   - FFmpeg avec settings rapides (VP8, CRF 35)
   - ~5 secondes par clip au lieu de 20

3. **Upload vers l'API**
   - Vidéo compressée (<100 MB)
   - Clips avec 3 frames chacun
   - Données de match Riot intégrées

4. **Re-analyse**
   - Fonction `reanalyzeLastRecording()` pour relancer sans rejouer

#### Frontend nexra
1. **Onglet Analysis**
   - Tab "Morts" avec vidéo + analyse IA
   - Tri par sévérité (critical first)
   - Vidéo player avec seeking aux timestamps
   - Cause de mort, erreurs, suggestions

2. **Composants créés**
   - `DeathClipsSection.tsx` - Affichage des morts analysées
   - `GameAnalysisModal.tsx` - Modal avec tous les onglets
   - Types dans `analysis.ts`

### 13/01/2026 - Images Dynamiques

1. **Création de `/src/utils/ddragon.ts`**
   - Fetch et cache de la version Data Dragon
   - URLs dynamiques pour champions/items/spells

2. **Amélioration des Matchups**
   - Top 3 best/worst matchups par champion
   - Filtrage par lane opponents uniquement

3. **Navigation & Animations**
   - Suppression des tabs non utilisés
   - Fix du flickering au chargement

---

## 🚀 Comment Démarrer

### Prérequis
```bash
Node.js 18+
npm ou pnpm
FFmpeg (pour nexra-vision)
Compte Cloudflare (pour nexra-api)
```

### 1. Frontend (nexra)
```bash
cd nexra
npm install

# Configuration
# Créer .env.local :
RIOT_API_KEY=RGAPI-votre-clé-ici
NEXT_PUBLIC_NEXRA_API_URL=https://nexra-api.nexra-api.workers.dev

npm run dev   # http://localhost:3000
```

### 2. Backend (nexra-api)
```bash
cd nexra-api
npm install

# Configuration secrets Cloudflare
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put RIOT_API_KEY

# Développement local
npm run dev   # http://localhost:8787

# Déploiement
npx wrangler deploy
```

### 3. Recorder (nexra-vision)
```bash
cd nexra-vision
npm install

# Configuration (config.json)
{
  "riotId": "VotreNom#TAG",
  "apiKey": "votre-clé-riot",
  "hotkey": "F9"
}

npm start   # Lance l'app Electron
```

---

## 🐛 Problèmes Connus & Solutions

### Rate Limiting Riot API
- **Problème**: 429 Too Many Requests
- **Solution actuelle**:
  - Délais de 200ms entre requêtes
  - Retry avec backoff exponentiel (2s, 4s, 5s)
  - Limitation à 30 matchs pour champion-details
  - Délai initial de 2s avant de fetch les matchs

### Performance
- **MatchCard.tsx très lourd** (2700+ lignes)
  - Considérer un refactoring en sous-composants
  - Actuellement fonctionnel mais difficile à maintenir

### Images de Runes
- Les runes utilisent encore l'API OPGG
- Data Dragon ne fournit pas les images de runes
- Solution actuelle : Garder OPGG pour les perks uniquement

---

## 📝 TODO / Améliorations Futures

### Court Terme
- [ ] Ajouter un loading skeleton lors du chargement initial
- [ ] Améliorer le cache des requêtes API
- [ ] Ajouter pagination pour les matchs (actuellement limité aux 20 derniers)

### Moyen Terme
- [ ] Implémenter l'onglet "Mastery" (mastery points par champion)
- [ ] Ajouter des graphiques de progression sur plusieurs jours
- [ ] Système de favoris pour suivre plusieurs joueurs
- [ ] Mode comparaison de joueurs

### Long Terme
- [ ] Refactoring de MatchCard.tsx en composants plus petits
- [ ] Backend avec base de données pour historique
- [ ] Authentification utilisateur
- [ ] Notifications pour les matchs des joueurs suivis

### Optimisations
- [ ] Implémenter ISR (Incremental Static Regeneration)
- [ ] Service Worker pour cache offline
- [ ] Lazy loading des onglets MatchCard
- [ ] Virtualisation de la liste de matchs

---

## 🎯 Points Clés pour Reprendre

### Si vous voulez modifier les stats affichées :
1. **API Route** : Modifier `/src/app/api/riot/champion-details/route.ts`
2. **Interface** : Mettre à jour l'interface `ChampionDetail`
3. **Composant** : Modifier `ChampionsStats.tsx` pour afficher les nouvelles données

### Si vous voulez ajouter un nouvel onglet :
1. **NavigationTabs.tsx** : Ajouter le tab dans l'array `tabs`
2. **RecentGames.tsx** : Ajouter la condition dans le rendu du contenu

### Si vous voulez modifier le design :
- La plupart des styles sont inline dans les composants
- Couleurs globales dans `globals.css`
- Variables CSS disponibles : `--text-primary`, `--text-secondary`, `--text-tertiary`

### Si les images ne s'affichent pas :
1. Vérifier que Data Dragon API est accessible
2. Vérifier la console pour les erreurs 404
3. Vérifier `ddragon.ts` et les fonctions `normalize*Name`

---

## 📞 Support & Ressources

### Documentation Riot API
- [Riot Developer Portal](https://developer.riotgames.com/)
- [Data Dragon Documentation](https://developer.riotgames.com/docs/lol#data-dragon)

### Technologies
- [Next.js 15 Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 🏆 État Actuel

### Frontend (nexra)
✅ Build réussi
✅ Toutes les images Data Dragon dynamiques
✅ Onglet Analysis avec affichage des clips de morts
✅ Vidéo player avec seeking
✅ UI complète et polie

### Backend (nexra-api)
✅ Déployé sur Cloudflare Workers
✅ Upload vidéo vers R2 (max 100MB)
✅ Extraction et analyse de clips avec Claude Vision
✅ Queue async pour traitement des analyses
✅ Streaming vidéo avec Range support
✅ API retourne camelCase (fix du 14/01)

### Recorder (nexra-vision)
✅ Détection automatique des parties LoL
✅ Enregistrement avec overlay in-game
✅ Extraction de clips parallélisée
✅ Upload de tous les clips
✅ Re-analyse sans rejouer

### Dernière Analyse Testée
- **Champion**: Mel MID
- **Score**: 45/100
- **Clips analysés**: 14
- **Morts avec analyse IA**: 2 (avec aiAnalysis complet)

---

*Dernière mise à jour : 14 Janvier 2026*
