'use client';

import { Skeleton, SkeletonCircle } from './SkeletonCard';

export default function MatchCardSkeleton() {
  return (
    <div
      className="match-card"
      style={{
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
      }}
    >
      {/* Barre latérale placeholder */}
      <div
        className="skeleton-pulse"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '5px',
          height: '100%',
          background: 'rgba(51, 65, 85, 0.5)',
        }}
      />

      {/* Champion icon */}
      <SkeletonCircle size="64px" />

      {/* Champion info + KDA */}
      <div style={{ flex: '0 0 140px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Skeleton width="80px" height="1.25rem" rounded="sm" />
        <Skeleton width="100px" height="1rem" rounded="sm" />
        <Skeleton width="60px" height="0.875rem" rounded="sm" />
      </div>

      {/* Stats section */}
      <div style={{ flex: 1, display: 'flex', gap: '2rem', alignItems: 'center' }}>
        {/* CS/Gold */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <Skeleton width="50px" height="0.75rem" rounded="sm" />
          <Skeleton width="70px" height="1rem" rounded="sm" />
        </div>

        {/* Damage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <Skeleton width="50px" height="0.75rem" rounded="sm" />
          <Skeleton width="80px" height="1rem" rounded="sm" />
        </div>

        {/* Items */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width="32px" height="32px" rounded="sm" />
          ))}
        </div>
      </div>

      {/* Game info (right side) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem' }}>
        <Skeleton width="60px" height="0.875rem" rounded="sm" />
        <Skeleton width="45px" height="0.75rem" rounded="sm" />
        <Skeleton width="80px" height="0.75rem" rounded="sm" />
      </div>
    </div>
  );
}

export function MatchCardSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            opacity: 1 - i * 0.1,
            animationDelay: `${i * 0.1}s`,
          }}
        >
          <MatchCardSkeleton />
        </div>
      ))}
    </div>
  );
}
