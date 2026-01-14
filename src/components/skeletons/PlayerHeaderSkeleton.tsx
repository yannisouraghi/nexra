'use client';

import { Skeleton, SkeletonCircle } from './SkeletonCard';

export default function PlayerHeaderSkeleton() {
  return (
    <div
      className="glass-card animate-fadeIn"
      style={{
        padding: '2rem',
        marginBottom: '1.5rem',
      }}
    >
      {/* Top row: Profile info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Profile icon */}
        <div style={{ position: 'relative' }}>
          <SkeletonCircle size="80px" />
          {/* Level badge */}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <Skeleton width="40px" height="20px" rounded="full" />
          </div>
        </div>

        {/* Name and badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton width="200px" height="1.75rem" rounded="sm" />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Skeleton width="50px" height="24px" rounded="full" />
            <Skeleton width="100px" height="24px" rounded="full" />
          </div>
        </div>
      </div>

      {/* Main content row: Rank, Recent matches, Top champions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Rank section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Rank emblem */}
          <Skeleton width="100px" height="100px" rounded="lg" />

          {/* Rank info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <Skeleton width="120px" height="1.5rem" rounded="sm" />
            <Skeleton width="80px" height="1rem" rounded="sm" />
            <Skeleton width="100px" height="0.875rem" rounded="sm" />
          </div>
        </div>

        {/* Recent matches */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton width="100px" height="0.75rem" rounded="sm" />
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCircle key={i} size="28px" />
            ))}
          </div>
        </div>

        {/* Top champions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton width="100px" height="0.75rem" rounded="sm" />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <SkeletonCircle size="40px" />
                <Skeleton width="30px" height="0.625rem" rounded="sm" />
                <Skeleton width="40px" height="0.625rem" rounded="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom stats grid */}
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <Skeleton width="60px" height="0.75rem" rounded="sm" />
            <Skeleton width="80px" height="1.25rem" rounded="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
