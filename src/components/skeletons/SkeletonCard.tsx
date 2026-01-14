'use client';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({ className = '', width, height, rounded = 'md' }: SkeletonProps) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={`skeleton-pulse ${roundedClasses[rounded]} ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem',
        background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.5) 0%, rgba(51, 65, 85, 0.5) 50%, rgba(30, 41, 59, 0.5) 100%)',
        backgroundSize: '200% 100%',
      }}
    />
  );
}

export function SkeletonCircle({ size = '40px', className = '' }: { size?: string; className?: string }) {
  return (
    <div
      className={`skeleton-pulse rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.5) 0%, rgba(51, 65, 85, 0.5) 50%, rgba(30, 41, 59, 0.5) 100%)',
        backgroundSize: '200% 100%',
      }}
    />
  );
}

export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="0.875rem"
          width={i === lines - 1 && lines > 1 ? '70%' : '100%'}
          rounded="sm"
        />
      ))}
    </div>
  );
}
