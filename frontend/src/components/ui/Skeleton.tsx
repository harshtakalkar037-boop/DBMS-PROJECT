/**
 * Loading placeholders.
 *
 * Every data-driven surface in the app should have a skeleton that mirrors its
 * real layout, so first paint never shows an empty box. All of these share the
 * shimmer defined by `.skeleton` in index.css.
 */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-3" style={{ width: `${100 - i * 9}%` }} />
      ))}
    </div>
  );
}

/** KPI tile placeholder. */
export function SkeletonStat({ className = '' }: { className?: string }) {
  return (
    <div className={`card card-pad ${className}`} aria-hidden="true">
      <div className="skeleton h-3 w-24" />
      <div className="skeleton mt-3 h-7 w-16" />
      <div className="skeleton mt-3 h-2.5 w-32" />
    </div>
  );
}

export function SkeletonStatRow({ count = 4, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStat key={i} />
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 260, className = '' }: { height?: number; className?: string }) {
  return (
    <div className={`card card-pad ${className}`} aria-hidden="true">
      <div className="skeleton h-3 w-40" />
      <div className="mt-5 flex items-end gap-2" style={{ height }}>
        {[38, 62, 48, 74, 56, 84, 66, 92, 70, 58].map((h, i) => (
          <div key={i} className="skeleton flex-1" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 5, className = '' }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={`card overflow-hidden ${className}`} aria-hidden="true">
      <div className="border-b border-line bg-surface-2 px-4 py-3">
        <div className="skeleton h-3 w-40" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="skeleton h-3" style={{ width: `${22 + ((r + c) % 4) * 12}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`card divide-y divide-line ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="skeleton h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-2.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage({ variant = 'dashboard' }: { variant?: 'dashboard' | 'table' | 'detail' }) {
  if (variant === 'table') {
    return (
      <div className="space-y-4">
        <div className="skeleton h-7 w-56" />
        <SkeletonTable rows={8} />
      </div>
    );
  }
  if (variant === 'detail') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-64" />
        <div className="card card-pad space-y-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <SkeletonChart />
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-3 w-80" />
      </div>
      <SkeletonStatRow />
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonChart className="lg:col-span-2" />
        <SkeletonList />
      </div>
    </div>
  );
}
