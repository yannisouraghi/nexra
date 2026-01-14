# Documentation Projet Nexra - Dashboard League of Legends

## Vue d'ensemble

**Nexra** est une application web de statistiques League of Legends construite avec Next.js 15, React et TypeScript. Elle permet de rechercher des joueurs, afficher leurs statistiques détaillées, analyser leurs matchs récents, et calculer des probabilités de victoire en temps réel basées sur les données Riot Games API.

## Stack Technique

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Inline Styles
- **API**: Riot Games API (Match-v5, Summoner-v4, League-v4, Champion Mastery-v4)
- **Data Dragon**: Pour les assets statiques (icônes, images de champions, versions)

## Variables d'Environnement

```env
RIOT_API_KEY=<votre_clé_api_riot>
```

La clé API Riot est requise pour toutes les requêtes vers les endpoints Riot. Sans elle, l'application ne fonctionnera pas.

## Structure des Fichiers Importants

### Composants Principaux

#### `src/app/page.tsx`
- Page d'accueil avec formulaire de recherche de joueur
- Recherche par gameName#tagLine
- Sélection de région (EUW, NA, etc.)

#### `src/app/dashboard/page.tsx`
- Dashboard principal après recherche d'un joueur
- Affiche les statistiques du joueur et matchs récents
- Passe les données du joueur aux composants enfants

#### `src/components/PlayerHeader.tsx`
**Composant le plus important** - Affiche l'en-tête du profil joueur avec:
- Photo de profil + niveau d'invocateur
- Nom du joueur (gameName#tagLine)
- Badge de région
- Badge de saison actuelle (récupéré depuis Data Dragon)
- **Gros emblème du rang** (scale 2.2x) avec informations de rang (Tier, Division, LP)
- **5 derniers matchs** (W/L en cercles verts/rouges)
- **Top 3 champions** joués avec:
  - Image du champion (36x36px)
  - Nombre de games
  - Winrate avec code couleur (vert ≥60%, jaune ≥50%, rouge <50%)
  - Effets visuels (gradient, border, glow, hover scale)
- Stats grid: Total Games, Winrate global, W/L

**Layout actuel**: Le logo du rang et le texte du rang sont collés ensemble (gap: 0.5rem), puis espacement de 2rem avec les sections suivantes.

#### `src/components/RecentGames.tsx`
- Affiche la liste des matchs récents
- Utilise `MatchCard` pour chaque match
- Passe le PUUID au PlayerHeader
- Gère la navigation entre les onglets (Résumé, Champions, Maîtrise, Live)
- Affiche le composant approprié selon l'onglet actif

#### `src/components/ChampionsStats.tsx`
**Onglet Champions** - Affiche les statistiques détaillées de tous les champions joués (30 derniers matchs):
- **Design en cards horizontales détaillées** (pas de grille)
- **Affichage par ordre de nombre de games** (du plus joué au moins joué)
- Stats complètes par champion:
  - Winrate avec badge coloré (vert ≥60%, jaune ≥50%, rouge <50%)
  - KDA moyen avec détail K/D/A
  - CS par game
  - Gold par game
  - Dégâts par game
  - **Dégâts par minute (DPM)**
  - Vision score
  - Temps de jeu total
- **Meilleurs et pires matchups**:
  - Affichage du champion ennemi avec le meilleur winrate (minimum 2 games)
  - Affichage du champion ennemi avec le pire winrate (minimum 2 games)
  - Icônes et pourcentages pour chaque matchup
- Tri dynamique par: nombre de games, winrate, ou KDA
- Image de champion 96x96px au lieu de 64x64px

#### `src/components/MatchCard.tsx`
- Carte détaillée pour chaque match
- Affiche: Champion joué, KDA, items, résultat (Victoire/Défaite)
- Enrichissement automatique avec `/api/riot/enrich-player` pour les autres joueurs du match

### API Routes (Backend Next.js)

#### `src/app/api/riot/account/route.ts`
- **Endpoint**: `GET /api/riot/account?gameName=X&tagLine=Y&region=Z`
- Récupère les informations de compte Riot (PUUID, gameName, tagLine)
- Utilise l'API Account-v1 de Riot

#### `src/app/api/riot/summoner/route.ts`
- **Endpoint**: `GET /api/riot/summoner?puuid=X&region=Y`
- Récupère les données de l'invocateur (profileIconId, summonerLevel, encryptedSummonerId)
- Récupère aussi le rang depuis League-v4

#### `src/app/api/riot/matches/route.ts`
- **Endpoint**: `GET /api/riot/matches?puuid=X&region=Y&count=Z`
- Récupère l'historique des matchs (Match IDs)
- Puis récupère les détails complets de chaque match
- Retourne un tableau de matchs avec toutes les informations

#### `src/app/api/riot/player-stats/route.ts`
- **Endpoint**: `GET /api/riot/player-stats?puuid=X&region=Y`
- Récupère et agrège les 20 derniers matchs ranked
- Calcule:
  - Top 3 champions (games, wins, losses, winrate)
  - 10 derniers résultats de matchs (W/L boolean[])
  - Rôle principal (le plus joué)
  - Total de games
- **Utilisé par PlayerHeader** pour afficher les stats additionnelles

#### `src/app/api/riot/champion-details/route.ts`
- **Endpoint**: `GET /api/riot/champion-details?puuid=X&region=Y`
- Récupère et agrège les **30 derniers matchs ranked** (réduit pour éviter rate limiting)
- Calcule pour chaque champion:
  - Nombre de games, wins, losses, winrate
  - KDA total et moyen (kills, deaths, assists)
  - CS moyen par game
  - Vision score moyen
  - Gold moyen par game
  - Dégâts moyens aux champions par game
  - **Dégâts par minute (DPM)** - calculé en divisant les dégâts totaux par le temps de jeu total
  - Temps de jeu total (en minutes)
  - **Meilleur matchup** - champion ennemi avec le winrate le plus élevé (min 2 games)
  - **Pire matchup** - champion ennemi avec le winrate le plus bas (min 2 games)
- Retourne la liste complète des champions triée par nombre de games (du plus joué au moins joué)
- **Utilisé par ChampionsStats** pour afficher les statistiques détaillées
- **Gestion avancée du rate limiting**:
  - Délai initial de 2 secondes pour laisser les autres endpoints se terminer
  - Délai de 200ms entre chaque requête (max 5 req/s)
  - Système de retry avec backoff exponentiel sur erreur 429
  - Arrêt après 3 erreurs consécutives

#### `src/app/api/riot/enrich-player/route.ts`
- **Endpoint**: `POST /api/riot/enrich-player`
- Body: `{ summonerName, puuid, championName, region, tier?, division? }`
- Enrichit les données d'un joueur avec:
  - Rank et LP actuels
  - Maîtrise du champion (level + points)
  - Stats sur le champion (games, winrate, KDA moyen)
  - Winrate global sur 20 matchs
  - Recent wins (sur 10 derniers matchs)
  - Current streak (série de victoires/défaites)
  - Jours depuis dernière game
  - Rôles récents joués
- **Crucial pour l'algorithme de probabilité de victoire**

### Algorithme de Probabilité de Victoire

**Contexte**: L'application calcule une probabilité de victoire pour chaque équipe basée sur des données réelles.

**Facteurs pris en compte**:
1. **Rank et LP**: Converti en score MMR estimé
2. **Winrate global**: Performance générale sur 20 matchs
3. **Performance récente**: Wins sur les 10 derniers matchs
4. **Streak**: Bonus/malus si le joueur est en série
5. **Maîtrise du champion**: Level de maîtrise du champion joué
6. **Performance sur le champion**: Winrate et KDA sur ce champion spécifique
7. **Inactivité**: Malus si le joueur n'a pas joué depuis longtemps
8. **Synergie de rôle**: Pénalité si 2+ joueurs partagent le même rôle (détection de off-role)

**Calcul**:
- Chaque joueur reçoit un score individuel (0-100)
- Score d'équipe = moyenne des scores des 5 joueurs
- Probabilité relative entre les deux équipes
- Ajustements pour éviter les extrêmes (<5% ou >95%)

## Régions et Mapping

### Régions Platform (utilisées pour Summoner, League, Champion Mastery APIs)
- `euw1`, `eun1`, `na1`, `br1`, `la1`, `la2`, `oc1`, `ru`, `tr1`, `jp1`, `kr`, `ph2`, `sg2`, `th2`, `tw2`, `vn2`

### Régions Routing (utilisées pour Match-v5 et Account-v1 APIs)
- `europe`, `americas`, `asia`, `sea`

**Mapping important** (dans PlayerHeader et autres composants):
```typescript
const regionMap: { [key: string]: string } = {
  'euw1': 'europe',
  'eun1': 'europe',
  'na1': 'americas',
  'br1': 'americas',
  // ... etc
};
```

## Data Dragon

### URLs importantes
- Versions: `https://ddragon.leagueoflegends.com/api/versions.json`
- Champion data: `https://ddragon.leagueoflegends.com/cdn/15.1.1/data/en_US/champion.json`
- Champion images: `https://ddragon.leagueoflegends.com/cdn/15.1.1/img/champion/{ChampionName}.png`
- Profile icons: `https://ddragon.leagueoflegends.com/cdn/15.1.1/img/profileicon/{iconId}.png`
- Items: `https://ddragon.leagueoflegends.com/cdn/15.1.1/img/item/{itemId}.png`
- Spells: `https://ddragon.leagueoflegends.com/cdn/15.1.1/img/spell/{spellName}.png`

### Rank emblems
- Source: Community Dragon
- URL: `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-{tier}.png`
- Tiers: `iron`, `bronze`, `silver`, `gold`, `platinum`, `emerald`, `diamond`, `master`, `grandmaster`, `challenger`

## Normalisation des Noms de Champions

**Problème**: Les noms de champions de l'API Riot contiennent parfois des espaces, apostrophes, points, qui ne correspondent pas aux noms de fichiers Data Dragon.

**Solution**: Fonction `normalizeChampionName()` dans PlayerHeader:
```typescript
const specialCases = {
  'Bel\'Veth': 'Belveth',
  'Cho\'Gath': 'Chogath',
  'Dr. Mundo': 'DrMundo',
  'Jarvan IV': 'JarvanIV',
  'Kai\'Sa': 'Kaisa',
  // ... etc
};
```

## Normalisation des Rôles

**Problème**: Riot retourne plusieurs formats de positions: `TOP`, `JUNGLE`, `MIDDLE`, `BOTTOM`, `UTILITY`, `BOT`, `MID`, `SUPPORT`

**Solution**: Fonction `normalizeRolePosition()` dans enrich-player:
```typescript
const positionMap = {
  'TOP': 'TOP',
  'JUNGLE': 'JUNGLE',
  'MIDDLE': 'MID',
  'MID': 'MID',
  'BOTTOM': 'ADC',
  'BOT': 'ADC',
  'UTILITY': 'SUPPORT',
  'SUPPORT': 'SUPPORT',
};
```

Résultat: 5 rôles standard: `TOP`, `JUNGLE`, `MID`, `ADC`, `SUPPORT`

## Couleurs des Tiers

Mapping des couleurs utilisé dans PlayerHeader:
- **Challenger**: `#f59e0b` (amber)
- **Grandmaster**: `#ef4444` (red)
- **Master**: `#a855f7` (purple)
- **Diamond**: `#3b82f6` (blue)
- **Emerald**: `#10b981` (emerald/green)
- **Platinum**: `#06b6d4` (cyan)
- **Gold**: `#eab308` (yellow)
- **Silver**: `#94a3b8` (slate)
- **Bronze**: `#ea580c` (orange)
- **Iron**: `#71717a` (zinc)

## Design System

### Styling
- Utilisation de **Tailwind CSS** pour les classes utilitaires
- **Inline styles** pour les valeurs dynamiques et effets spéciaux
- **Glass-morphism**: `glass-card` class pour les cartes principales
- **Gradients**: Utilisés pour backgrounds, borders, overlays

### Effets visuels récurrents
- `box-shadow` pour les glows (ex: `0 0 12px rgba(...)`)
- `backdrop-filter: blur()` pour effets de verre
- Transitions: `transition-all duration-200/300`
- Hover effects: `hover:scale-105`, `hover:brightness-110`

### Spacing
- Gap standard entre sections: `2rem`
- Padding des cartes: `2rem`
- Margin bottom des sections: `1.5rem`

## Points Importants à Retenir

### 1. PUUID est essentiel
Le PUUID (Player Universally Unique IDentifier) est utilisé partout:
- Récupéré via Account-v1: `/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}`
- Nécessaire pour Match-v5, Champion Mastery
- Doit être passé entre les composants

### 2. Rate Limiting
Riot API a des limites strictes:
- 20 requêtes / seconde
- 100 requêtes / 2 minutes
- Délais de 50ms entre requêtes dans les boucles (ex: player-stats route)

### 3. Match History Performance
Récupérer 20 matchs avec détails complets = 21 requêtes API (1 pour IDs + 20 pour détails).
C'est coûteux mais nécessaire pour calculer les stats précises.

### 4. Données cachées vs réelles
L'API ne fournit pas directement:
- MMR réel → estimation via rank + LP
- Rôle principal → calculé à partir de l'historique
- Maîtrise réelle d'un champion → approximation via points de maîtrise

### 5. Gestion des erreurs
- Toujours vérifier `response.ok` avant de parser
- Fallbacks pour données manquantes (ex: champion mastery)
- Try/catch sur fetch individuels dans les boucles pour ne pas bloquer

### 6. Layout PlayerHeader
Structure actuelle (après dernière modification):
```
[Profile Icon + Name/Region/Season Badge]
  ↓
[Rank Emblem + Rank Info (collés)] --- [Recent Matches] --- [Top Champions]
  ↓
[Stats Grid: Games | Winrate | W/L]
```

Le logo et texte du rang sont groupés avec `gap: 0.5rem`, puis `gap: 2rem` vers les autres sections.

### 7. Enrichissement des joueurs
Dans MatchCard, les autres joueurs du match sont enrichis avec `/api/riot/enrich-player` pour afficher:
- Leur rank actuel
- Leur maîtrise du champion joué
- Leur performance récente

Cela permet d'avoir un contexte complet sur tous les participants d'un match.

## Prochaines Améliorations Possibles

1. ~~**Cache des données**~~: Implémenter un système de cache pour réduire les appels API
2. **Authentification**: Système de connexion pour sauvegarder des joueurs favoris
3. **Comparaison**: Comparer plusieurs joueurs côte à côte
4. **Graphs**: Visualisation de la progression du rank dans le temps
5. ~~**Live Game**~~: Détection et analyse de partie en cours ✅ (via nexra-vision)
6. **Historical data**: Suivi des stats sur plusieurs saisons

## Architecture Multi-Projets

### nexra (Frontend - Next.js)
```bash
cd nexra && npm install && npm run dev
# http://localhost:3000
```

### nexra-api (Backend - Cloudflare Workers)
```bash
cd nexra-api && npm install
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put RIOT_API_KEY
npx wrangler deploy
# https://nexra-api.nexra-api.workers.dev
```

### nexra-vision (Recorder - Electron)
```bash
cd nexra-vision && npm install && npm start
# App Electron avec overlay in-game
```

## Notes de Développement

- **TypeScript strict**: Typage complet requis
- **Next.js App Router**: Utiliser les Server Components quand possible
- **API Routes**: Backend serverless dans `/app/api/`
- **Styles inline**: Préférés pour les valeurs dynamiques basées sur les données
- **Cloudflare Workers**: Pas de Node.js Buffer, utiliser `atob()` + `Uint8Array`

## Dernières Modifications

### 2026-01-14 - Analyse IA des Parties

#### Backend nexra-api (Cloudflare Workers)
- **Déploiement complet** sur Cloudflare Workers
  - D1 Database pour les métadonnées
  - R2 Bucket pour les vidéos et frames
  - Queue pour traitement async des analyses
- **Routes API**:
  - `POST /recordings/upload-url` - Créer un enregistrement
  - `PUT /recordings/:id/upload` - Upload vidéo (max 100MB WebM)
  - `POST /recordings/:id/clips` - Upload clips avec frames base64
  - `GET /recordings/:matchId/video` - Streaming vidéo avec Range support
  - `POST /analysis` - Créer une analyse
  - `POST /analysis/:id/reanalyze` - Relancer une analyse
  - `GET /analysis/:id` - Récupérer une analyse complète
- **Analyse IA Claude Vision**:
  - Extraction de 3 frames par clip
  - Prompt personnalisé par champion/rôle
  - Détection d'erreurs classées par sévérité
  - Génération de conseils et plan d'amélioration
- **Fix snake_case → camelCase** dans les réponses API

#### Recorder nexra-vision (Electron)
- **Détection automatique** des parties League of Legends
- **Enregistrement écran** avec MediaRecorder (WebM)
- **Extraction de clips** parallélisée (batches de 4)
- **Upload** vers nexra-api avec frames pour Vision
- **Overlay in-game** avec statut d'enregistrement
- **Re-analyse** sans rejouer une partie

#### Frontend nexra
- **Nouvel onglet Analysis** dans le dashboard
- **Composants d'analyse**:
  - `AnalysisTab.tsx` - Liste des analyses
  - `GameAnalysisModal.tsx` - Modal détaillé
  - `DeathClipsSection.tsx` - Morts avec vidéo + IA
  - `ErrorsList.tsx`, `CoachingTips.tsx`, etc.
- **Types TypeScript** dans `analysis.ts`
- **Client API** dans `nexraApi.ts`

### 2026-01-13 - Images Dynamiques Data Dragon
- Création de `/src/utils/ddragon.ts`
- URLs dynamiques pour champions/items/spells
- Gestion des noms spéciaux de champions

### 2026-01-12 - Onglet Champions
- Composant `ChampionsStats.tsx` avec cards détaillées
- API `/api/riot/champion-details` pour stats 30 matchs
- Calcul des matchups (meilleur/pire)
- DPM (Dégâts par minute)
- Rate limiting avancé

---

**Date de création**: 2026-01-12
**Dernière mise à jour**: 2026-01-14
**Version du projet**: En développement actif
