export default function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} aria-hidden="true" />;
}

export function CardSkeleton({ count = 3 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="space-y-2.5 rounded-xl border border-line bg-white p-3">
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-1.5">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-3 w-1/3" />
    </div>
  ));
}
