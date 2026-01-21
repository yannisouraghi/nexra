// Coaching Tip Generator - Generates personalized tips based on analysis results

import { DetectedError } from '../types';

interface CoachingTip {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: number;
  relatedErrors?: string[];
}

// Error type to category mapping
const ERROR_CATEGORIES: Record<string, string> = {
  'cs-missing': 'Farm',
  'vision': 'Vision',
  'positioning': 'Positioning',
  'map-awareness': 'Map Awareness',
  'objective': 'Objectives',
  'trading': 'Trading',
  'timing': 'Timing',
  'wave-management': 'Wave Management',
  'itemization': 'Items',
  'cooldown-tracking': 'Cooldowns',
  'roaming': 'Roaming',
  'teamfight': 'Teamfight',
};

// Pre-defined coaching tips by category
const COACHING_TIPS: Record<string, CoachingTip[]> = {
  'cs-missing': [
    {
      id: 'cs-1',
      category: 'Farm',
      title: 'Practice last hitting',
      description: 'Go into Practice Tool and train last hitting without using abilities. Aim for 80+ CS at 10 min.',
      priority: 1,
    },
    {
      id: 'cs-2',
      category: 'Farm',
      title: 'CS under tower',
      description: 'Learn the pattern: 2 tower shots + 1 auto for melees, 1 tower shot + 1 auto for casters (with starting items).',
      priority: 2,
    },
  ],
  'vision': [
    {
      id: 'vision-1',
      category: 'Vision',
      title: 'Buy Control Wards',
      description: 'Buy a Control Ward on every back. Place it in your jungle or near objectives.',
      priority: 1,
    },
    {
      id: 'vision-2',
      category: 'Vision',
      title: 'Ward before objectives',
      description: 'Place wards 1 minute before Dragon/Baron spawns to gather information.',
      priority: 2,
    },
  ],
  'positioning': [
    {
      id: 'pos-1',
      category: 'Positioning',
      title: 'Stay with your team',
      description: 'In mid/late game, don\'t separate from your team unless you have vision and know where enemies are.',
      priority: 1,
    },
    {
      id: 'pos-2',
      category: 'Positioning',
      title: 'Respect fog of war',
      description: 'If you don\'t see 3+ enemies on the map, play as if they\'re coming for you.',
      priority: 2,
    },
  ],
  'map-awareness': [
    {
      id: 'map-1',
      category: 'Map Awareness',
      title: 'Check your minimap',
      description: 'Force yourself to look at your minimap every 3 seconds. It\'s a habit you need to develop.',
      priority: 1,
    },
    {
      id: 'map-2',
      category: 'Map Awareness',
      title: 'Track the enemy jungler',
      description: 'Mentally note where the enemy jungler was last seen. If spotted bot, they\'ll be top in 30-40 sec.',
      priority: 2,
    },
  ],
  'objective': [
    {
      id: 'obj-1',
      category: 'Objectives',
      title: 'Prioritize objectives',
      description: 'After a kill or gaining an advantage, always think: "What objective can I take?"',
      priority: 1,
    },
    {
      id: 'obj-2',
      category: 'Objectives',
      title: 'Time objectives',
      description: 'Dragon respawns after 5 min, Baron after 6 min. Prepare 1 min before spawn.',
      priority: 2,
    },
  ],
  'trading': [
    {
      id: 'trade-1',
      category: 'Trading',
      title: 'Trade when enemy last hits',
      description: 'Attack the enemy when they go to last hit a minion. They have to choose between hitting you or taking the CS.',
      priority: 1,
    },
    {
      id: 'trade-2',
      category: 'Trading',
      title: 'Respect power spikes',
      description: 'Watch out for levels 2, 3, 6 and item completions. These are moments when your opponent becomes stronger.',
      priority: 2,
    },
  ],
};

export function generateCoachingTips(
  errors: DetectedError[],
  scores: {
    csScore: number;
    visionScore: number;
    positioningScore: number;
    objectiveScore: number;
    tradingScore: number;
  }
): CoachingTip[] {
  const tips: CoachingTip[] = [];
  const usedTipIds = new Set<string>();

  // Count errors by type
  const errorCounts: Record<string, number> = {};
  const errorIds: Record<string, string[]> = {};

  for (const error of errors) {
    const type = error.type;
    errorCounts[type] = (errorCounts[type] || 0) + 1;
    if (!errorIds[type]) errorIds[type] = [];
    errorIds[type].push(`error-${error.timestamp}`);
  }

  // Sort error types by count (most frequent first)
  const sortedTypes = Object.entries(errorCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type);

  // Add tips for most common error types
  for (const errorType of sortedTypes) {
    const categoryTips = COACHING_TIPS[errorType];
    if (!categoryTips) continue;

    for (const tip of categoryTips) {
      if (usedTipIds.has(tip.id)) continue;
      if (tips.length >= 5) break; // Max 5 tips

      tips.push({
        ...tip,
        relatedErrors: errorIds[errorType]?.slice(0, 3),
      });
      usedTipIds.add(tip.id);
    }
  }

  // Add tips based on low scores
  const scoreCategories: Array<{ score: number; category: string }> = [
    { score: scores.csScore, category: 'cs-missing' },
    { score: scores.visionScore, category: 'vision' },
    { score: scores.positioningScore, category: 'positioning' },
    { score: scores.objectiveScore, category: 'objective' },
    { score: scores.tradingScore, category: 'trading' },
  ];

  // Sort by lowest score first
  scoreCategories.sort((a, b) => a.score - b.score);

  for (const { score, category } of scoreCategories) {
    if (score < 60 && tips.length < 5) {
      const categoryTips = COACHING_TIPS[category];
      if (!categoryTips) continue;

      for (const tip of categoryTips) {
        if (usedTipIds.has(tip.id)) continue;
        if (tips.length >= 5) break;

        tips.push(tip);
        usedTipIds.add(tip.id);
      }
    }
  }

  // Assign final priorities
  tips.forEach((tip, index) => {
    tip.priority = index + 1;
  });

  return tips;
}
