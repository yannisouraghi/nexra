'use client';

import { Skeleton, SkeletonCircle } from './SkeletonCard';

export default function ChampionCardSkeleton() {
  return (
    <div
      className="glass-card"
      style={{
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
      }}
    >
      {/* Rank badge */}
      <Skeleton width="32px" height="32px" rounded="full" />

      {/* Champion image */}
      <SkeletonCircle size="72px" />

      {/* Champion name and games */}
      <div style={{ flex: '0 0 120px', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <Skeleton width="100px" height="1.25rem" rounded="sm" />
        <Skeleton width="60px" height="0.875rem" rounded="sm" />
      </div>

      {/* Stats grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <Skeleton width="40px" height="0.625rem" rounded="sm" />
            <Skeleton width="60px" height="1rem" rounded="sm" />
          </div>
        ))}
      </div>

      {/* Matchups */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        {/* Best matchup */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          <Skeleton width="40px" height="0.5rem" rounded="sm" />
          <SkeletonCircle size="32px" />
          <Skeleton width="30px" height="0.5rem" rounded="sm" />
        </div>
        {/* Worst matchup */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          <Skeleton width="40px" height="0.5rem" rounded="sm" />
          <SkeletonCircle size="32px" />
          <Skeleton width="30px" height="0.5rem" rounded="sm" />
        </div>
      </div>
    </div>
  );
}

export function ChampionCardSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            opacity: 1 - i * 0.15,
            animationDelay: `${i * 0.1}s`,
          }}
        >
          <ChampionCardSkeleton />
        </div>
      ))}
    </div>
  );
}
