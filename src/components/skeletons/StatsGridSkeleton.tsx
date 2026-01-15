'use client';

import { Skeleton } from './SkeletonCard';

export default function StatsGridSkeleton() {
  return (
    <div className="glass-card" style={{ padding: '3rem' }}>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-glass-ultra border border-glass-border text-center"
            style={{ padding: '1.5rem' }}
          >
            <Skeleton width="80px" height="0.75rem" rounded="sm" className="mx-auto" />
            <div style={{ marginTop: '1rem' }}>
              <Skeleton width="60px" height="3rem" rounded="md" className="mx-auto" />
            </div>
          </div>
        ))}
      </div>

      {/* Win Rate Progress Bar */}
      <div className="rounded-xl bg-glass-ultra border border-glass-border" style={{ padding: '1.5rem' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
          <Skeleton width="140px" height="0.875rem" rounded="sm" />
          <Skeleton width="50px" height="1.25rem" rounded="sm" />
        </div>
        <Skeleton width="100%" height="0.75rem" rounded="full" />
      </div>
    </div>
  );
}
