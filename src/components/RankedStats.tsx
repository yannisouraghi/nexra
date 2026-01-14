'use client';

interface RankedStatsProps {
  rank: {
    tier: string;
    rank: string;
    leaguePoints: number;
    wins: number;
    losses: number;
  } | null;
}

export default function RankedStats({ rank }: RankedStatsProps) {
  if (!rank) {
    return (
      <div className="glass-card p-6">
        <h4 className="heading-sm text-white mb-4">Ranked Solo/Duo</h4>
        <div className="text-center py-10">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-gray-600/20 to-gray-800/20 flex items-center justify-center border-2 border-white/10 mb-4 backdrop-blur-sm">
            <span className="text-white/60 text-3xl font-bold">?</span>
          </div>
          <p className="text-[var(--text-secondary)] font-medium mb-1">Unranked</p>
          <p className="text-[var(--text-tertiary)] text-xs">No ranked games</p>
        </div>
      </div>
    );
  }

  // URL du logo de rank
  const tier = rank.tier.toLowerCase();
  const rankImageUrl = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-${tier}.png`;

  const totalGames = rank.wins + rank.losses;
  const winRate = totalGames > 0 ? Math.round((rank.wins / totalGames) * 100) : 0;

  const tierColors: { [key: string]: string } = {
    'iron': 'from-gray-700 to-gray-900',
    'bronze': 'from-orange-900 to-orange-950',
    'silver': 'from-gray-400 to-gray-600',
    'gold': 'from-yellow-500 to-yellow-700',
    'platinum': 'from-cyan-500 to-cyan-700',
    'emerald': 'from-emerald-500 to-emerald-700',
    'diamond': 'from-blue-400 to-blue-600',
    'master': 'from-purple-500 to-purple-700',
    'grandmaster': 'from-red-500 to-red-700',
    'challenger': 'from-yellow-300 to-yellow-500',
  };

  const gradient = tierColors[tier] || 'from-gray-600 to-gray-800';

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
      <h4 className="heading-sm text-white mb-5">Ranked Solo/Duo</h4>

      <div className="text-center">
        {/* Rank Badge */}
        <div className="relative inline-block mb-5">
          <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${gradient} p-1 border-4 border-cyan-500/20 shadow-xl shadow-cyan-500/10`}>
            <div className="w-full h-full rounded-full bg-black/40 flex items-center justify-center overflow-hidden backdrop-blur-sm">
              <img
                src={rankImageUrl}
                alt={`${rank.tier} ${rank.rank}`}
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Rank Details */}
        <div className="mb-5">
          <h3 className="text-2xl font-bold text-white mb-1.5">
            {rank.tier.charAt(0) + rank.tier.slice(1).toLowerCase()} {rank.rank}
          </h3>
          <p className="text-lg font-semibold text-cyan-300">{rank.leaguePoints} LP</p>
        </div>

        {/* Win Rate */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)] font-semibold text-sm">Win Rate</span>
            <span className="text-white font-bold text-base">{winRate}%</span>
          </div>

          <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-600 rounded-full transition-all duration-700 ease-out shadow-lg shadow-cyan-500/50"
              style={{ width: `${winRate}%` }}
            ></div>
          </div>

          {/* Wins/Losses */}
          <div className="flex items-center justify-center gap-5 pt-3">
            <div className="text-center">
              <div className="text-gradient-victory font-bold text-xl mb-0.5">{rank.wins}</div>
              <div className="label text-[var(--text-tertiary)]">Wins</div>
            </div>
            <div className="text-[var(--text-muted)] text-xl">/</div>
            <div className="text-center">
              <div className="text-gradient-defeat font-bold text-xl mb-0.5">{rank.losses}</div>
              <div className="label text-[var(--text-tertiary)]">Losses</div>
            </div>
          </div>

          {/* Total Games */}
          <div className="pt-4 border-t border-white/5">
            <p className="text-[var(--text-tertiary)] text-xs">
              {totalGames} games played
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
