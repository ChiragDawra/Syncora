import Skeleton from '../common/Skeleton';
import Icon from '../common/Icon';

// Stats pills from GET /boards/:id/stats ($facet aggregation)
export default function BoardStats({ stats, loading }) {
  if (loading && !stats) return <Skeleton className="h-7 w-72" />;
  if (!stats) return null;
  const done = stats.byStatus?.done ?? 0;
  return (
    <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-[13px] text-slate-600">
        <Icon name="list" className="h-3.5 w-3.5 text-indigo-600" />
        <strong className="font-semibold tabular-nums text-ink">{stats.total}</strong> tasks
      </span>
      <span
        className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] ${
          stats.overdue ? 'border-red-200 bg-red-50 text-red-600' : 'border-line bg-white text-slate-600'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${stats.overdue ? 'bg-red-500' : 'bg-slate-300'}`} />
        <strong className="font-semibold tabular-nums">{stats.overdue}</strong> overdue
      </span>
      <span className="inline-flex h-7 shrink-0 items-center gap-2 rounded-full border border-line bg-white px-3 text-[13px] text-slate-600">
        Done <strong className="font-semibold tabular-nums text-ink">{stats.completionRate}%</strong>
        <span className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={stats.completionRate} aria-valuemin={0} aria-valuemax={100}>
          <span className="block h-full rounded-full bg-indigo-600 transition-all duration-500" style={{ width: `${stats.completionRate}%` }} />
        </span>
        <span className="hidden text-slate-400 sm:inline">
          {done} of {stats.total}
        </span>
      </span>
    </div>
  );
}
