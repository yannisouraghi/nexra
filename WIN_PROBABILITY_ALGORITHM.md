# Algorithme de Probabilité de Victoire

## 📋 Vue d'ensemble

Cet algorithme calcule une **probabilité de victoire (0-100%)** pour une équipe donnée dans League of Legends, basé sur des scores pondérés et des facteurs contextuels.

**Type**: Algorithme déterministe (non-IA)
**Performance**: < 10ms par calcul
**Reproductible**: Oui
**Ajustable**: Oui (poids configurables)

---

## 🏗️ Architecture

```
calculateMatchWinProbability()
├── calculateTeamScore(yourTeam)
│   ├── calculatePlayerScore(player1) × 5
│   │   ├── ELO Score (0-35)
│   │   ├── Champion Mastery (0-20)
│   │   ├── Recent Performance (0-15)
│   │   ├── Role Fit (0-15)
│   │   ├── Activity (0-10)
│   │   └── Streak (0-5)
│   ├── Role Multipliers
│   ├── Team Synergy Bonus (0-10)
│   └── Composition Bonus (0-8)
├── calculateTeamScore(opponentTeam)
└── Sigmoïde → Probabilité %
```

---

## 📊 Calcul du PlayerScore (0-100)

### 1. ELO Score (35 points max)

**Objectif**: Évaluer le niveau de jeu général du joueur

```typescript
Elo = Base Elo (tier) + Division Bonus + LP

Exemples:
- Iron IV 0 LP    → 400 elo  → 0 points
- Gold II 50 LP   → 1500 elo → 19 points
- Diamond I 100LP → 2525 elo → 29 points
- Challenger 500LP→ 3600 elo → 35 points
```

**Normalisation**: `score = (elo - 400) / (3500 - 400) × 35`

---

### 2. Champion Mastery (20 points max)

**Objectif**: Mesurer la maîtrise du champion joué

**Composantes**:
- **Niveau de maîtrise** (12 points max): `(mastery/7) × 12`
- **Winrate sur champion** (5 points): `(winrate/100) × 5` (si ≥5 games)
- **KDA moyen** (2 points):
  - KDA ≥ 3.0 → +2 points
  - KDA ≥ 2.0 → +1 point
- **Bonus games** (2 points): Si ≥50 games sur le champion
- **Bonus Mastery 7** (3 points): Si niveau 7

**Exemple**:
```
Joueur avec:
- Mastery 7 → 12 points
- 60% winrate (20 games) → 3 points
- KDA 3.5 → 2 points
- 50+ games → 2 points
- Mastery 7 → 3 points
= 22 points → plafonné à 20
```

---

### 3. Recent Performance (15 points max)

**Objectif**: Capturer la forme actuelle

```typescript
Si données récentes disponibles (5-10 dernières games):
  score = (recentWinrate / 100) × 15

Sinon:
  score = (globalWinrate / 100) × 15
```

**Exemples**:
- 8W-2L récentes (80%) → 12 points
- 3W-7L récentes (30%) → 4.5 points

---

### 4. Role Fit (15 points max)

**Objectif**: Pénaliser l'autofill et l'off-role

```typescript
Base: 15 points

Pénalités:
- Autofill → -15 points (0 points total)
- Off-role (pas main role) → -10 points (5 points total)
- Main role → 15 points (aucune pénalité)
```

---

### 5. Activity (10 points max)

**Objectif**: Pénaliser l'inactivité

```typescript
Base: 10 points

Pénalité: daysSinceLastGame × 0.5
Max pénalité: 7 jours × 0.5 = 3.5 points

Exemples:
- Joué hier → 10 points
- 3 jours d'inactivité → 8.5 points
- 7+ jours d'inactivité → 6.5 points
```

---

### 6. Streak (5 points max)

**Objectif**: Bonus/malus selon la série actuelle

```typescript
Win streak:
- 1 win → +1 point
- 3 wins → +3 points
- 5+ wins → +5 points (max)

Lose streak (moins impactant):
- 1 loss → -0.5 point
- 3 losses → -1.5 points
- 5+ losses → -2.5 points (max malus)
```

---

## 🎭 Role Multipliers

Certains rôles ont plus d'impact sur l'issue du match:

```typescript
JUNGLE:  × 1.15  (Contrôle de la map, ganks)
SUPPORT: × 1.10  (Vision, engage, peel)
MID:     × 1.05  (Roaming, contrôle)
ADC:     × 1.00  (Baseline)
TOP:     × 0.95  (Impact plus faible early)
```

**Application**: `PlayerScore × RoleMultiplier`

---

## 👥 Team Score

### Calcul de base

```typescript
TeamScore = (Σ PlayerScores pondérés) / 5
```

### Bonus de Synergie (0-10 points)

**Si fourni manuellement**: `(teamSynergy / 100) × 10`

**Sinon (calcul auto)**:
```typescript
autofillCount = nombre de joueurs en autofill
synergyBonus = 10 × (1 - autofillCount/5)

Exemples:
- 0 autofill → 10 points
- 1 autofill → 8 points
- 2 autofills → 6 points
```

### Bonus de Composition (0-8 points)

**1. Balance AD/AP (3 points max)**
```typescript
balanceDeviation = |50 - adApBalance|
bonus = (1 - balanceDeviation/50) × 3

Exemples:
- 50/50 AD-AP → 3 points
- 30/70 AD-AP → 1.8 points
- 10/90 AD-AP → 0.6 point
```

**2. Power Scaling (5 points max)**
```typescript
avgPower = (earlyGamePower + lateGamePower) / 2
bonus = (avgPower / 100) × 5

Exemples:
- Early 80, Late 70 → 3.75 points
- Early 50, Late 50 → 2.5 points
```

---

## 🎲 Conversion en Probabilité

Une fois les deux TeamScores calculés, on utilise une **fonction sigmoïde**:

```typescript
scoreDiff = yourTeamScore - opponentTeamScore

probability = 1 / (1 + e^(-k × scoreDiff))

Avec k = 0.1 (contrôle la sensibilité)
```

### Exemples de conversion

| Différence | Probabilité |
|------------|-------------|
| +30        | ~95%        |
| +20        | ~88%        |
| +10        | ~73%        |
| +5         | ~62%        |
| 0          | 50%         |
| -5         | ~38%        |
| -10        | ~27%        |
| -20        | ~12%        |
| -30        | ~5%         |

**Limitations**: La probabilité est bornée entre **5% et 95%** pour rester réaliste.

---

## 🎚️ Ajustement des Poids

Tous les poids sont configurables dans `WEIGHTS`:

```typescript
export const WEIGHTS = {
  // PlayerScore (total = 100)
  ELO_WEIGHT: 35,                    // ← Augmenter pour valoriser le skill
  CHAMPION_MASTERY_WEIGHT: 20,      // ← Augmenter pour valoriser l'OTP
  RECENT_PERFORMANCE_WEIGHT: 15,     // ← Augmenter pour valoriser la forme
  ROLE_FIT_WEIGHT: 15,               // ← Augmenter pour pénaliser autofill
  ACTIVITY_WEIGHT: 10,
  STREAK_WEIGHT: 5,

  // Role multipliers
  ROLE_MULTIPLIERS: {
    'JUNGLE': 1.15,  // ← Ajuster selon meta
    'SUPPORT': 1.10,
    'MID': 1.05,
    'ADC': 1.00,
    'TOP': 0.95,
  },

  // Bonus/Pénalités
  AUTOFILL_PENALTY: 15,              // ← Augmenter pour plus pénaliser
  OFF_ROLE_PENALTY: 10,
  INACTIVITY_PENALTY_PER_DAY: 0.5,
  WIN_STREAK_BONUS_PER_WIN: 1,
  MASTERY_7_BONUS: 3,
  HIGH_GAMES_BONUS: 2,

  // Team
  TEAM_SYNERGY_BONUS: 10,
  COMPOSITION_BONUS: 8,
};
```

---

## 📈 Indicateur de Confiance

La confiance est calculée selon la **quantité de données disponibles**:

```typescript
Pour chaque joueur, on compte des "data points":
- 20+ games sur champion → +2 points
- 5-19 games sur champion → +1 point
- 50+ games total → +1 point
- Données récentes (5+ games) → +1 point
- Tier connu (pas UNRANKED) → +1 point

Max par joueur: 5 points
Max équipe: 25 points (5 joueurs)

Confiance:
- ≥ 70% des points → HIGH
- ≥ 40% des points → MEDIUM
- < 40% → LOW
```

---

## 🎨 Intégration UI

### Couleurs selon probabilité

```typescript
≥ 65% → Vert (#10b981)   "Très favorable"
≥ 55% → Bleu (#3b82f6)   "Favorable"
≥ 45% → Jaune (#eab308)  "Équilibré"
≥ 35% → Orange (#f97316) "Défavorable"
< 35% → Rouge (#ef4444)  "Très défavorable"
```

### Composant WinProbabilityBadge

```tsx
<WinProbabilityBadge
  probability={73}          // 0-100
  confidence="HIGH"         // LOW | MEDIUM | HIGH
  showBar={true}            // Afficher barre de progression
  size="medium"             // small | medium | large
/>
```

Affiche:
- Badge coloré: `73% | Favorable`
- Icône de confiance
- Barre de progression animée

---

## 🚀 Exemple d'utilisation

```typescript
import { calculateMatchWinProbability } from '@/utils/winProbabilityCalculator';

const yourTeam: TeamData = {
  players: [
    {
      summonerName: "Player1",
      role: "JUNGLE",
      tier: "DIAMOND",
      division: "II",
      leaguePoints: 50,
      championName: "LeeSin",
      championMastery: 7,
      gamesOnChampion: 150,
      winrateOnChampion: 58,
      kdaOnChampion: 3.2,
      globalWinrate: 54,
      totalGames: 500,
      isMainRole: true,
      isAutofill: false,
      recentWins: 7,
      recentGames: 10,
      currentStreak: 3,
      daysSinceLastGame: 0,
    },
    // ... 4 autres joueurs
  ],
};

const opponentTeam: TeamData = {
  players: [ /* ... */ ],
};

const result = calculateMatchWinProbability(yourTeam, opponentTeam);

console.log(result);
/*
{
  winProbability: 64,
  teamScore: 72.5,
  opponentScore: 68.2,
  breakdown: {
    playerScores: [78, 72, 69, 71, 73],
    teamBonuses: 8,
    compositionScore: 5.5,
    synergy: 8
  },
  confidence: "HIGH"
}
*/
```

---

## ⚠️ Limitations actuelles

1. **Données manquantes**: L'algorithme fonctionne avec des estimations si certaines données ne sont pas disponibles (mastery, stats récentes, etc.)

2. **Matchups**: Les matchups directs entre champions ne sont pas encore pris en compte (ex: Malphite counter des ADC)

3. **Meta shifts**: Pas d'adaptation automatique selon les patchs (certains champions deviennent plus forts)

4. **Duo queue**: Les synergies entre joueurs en duo ne sont pas détectées

5. **Bans**: Les bans ne sont pas pris en compte dans le calcul

---

## 🔮 Améliorations futures possibles

1. **API enrichie**:
   - Récupérer les vraies stats de mastery via Riot API
   - Historique de matchs plus profond
   - Détection du main role

2. **Matchup matrix**:
   - Base de données de matchups par lane
   - Ajustement du score selon les counters

3. **Meta awareness**:
   - Intégrer les données de win rate par patch
   - Bonus pour les champions "meta"

4. **Duo detection**:
   - Détecter les joueurs en duo
   - Bonus de synergie spécifique

5. **Historical learning**:
   - Ajuster automatiquement les poids selon la précision historique
   - A/B testing des configurations

---

## 📞 Support & Feedback

Pour toute question ou amélioration:
- Modifier les poids dans `WEIGHTS`
- Tester avec des matchs réels
- Comparer avec les résultats réels
- Ajuster itérativement

**Formule clé**: `Précision > Complexité`

Un algorithme simple bien calibré est meilleur qu'un algorithme complexe mal calibré.
