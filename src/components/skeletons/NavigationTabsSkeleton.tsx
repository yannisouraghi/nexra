'use client';

import { Skeleton } from './SkeletonCard';

export default function NavigationTabsSkeleton() {
  return (
    <div className="glass-card" style={{ padding: '0.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
            }}
          >
            <Skeleton width="20px" height="20px" rounded="sm" />
            <Skeleton width="80px" height="1rem" rounded="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
