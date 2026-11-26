import useTeam from '../hooks/useTeam';
import useFetch from '../hooks/useFetch';
import usePagination from '../hooks/usePagination';
import { listActivity } from '../api/teams';
import Avatar from '../components/common/Avatar';
import Icon from '../components/common/Icon';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { CardSkeleton } from '../components/common/Skeleton';
import { describeActivity, ACTIVITY_ICONS } from '../utils/activity';
import { formatDateTime, timeAgo } from '../utils/format';

export default function ActivityPage() {
  const { team } = useTeam();
  const { page, setPage } = usePagination();
  const { data, meta, loading, error, refetch } = useFetch((cfg) => listActivity(team._id, { page, limit: 20 }, cfg), [team._id, page]);

  if (loading) return <div className="space-y-2"><CardSkeleton count={5} /></div>;
  if (error) return <ErrorState title="Could not load activity" message={error.message} onRetry={refetch} />;
  if (!data.length) return <EmptyState icon="activity" title="No activity yet" message="Creating boards, tasks and comments shows up here." />;

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink">Activity</h2>
      <ol className="relative rounded-2xl border border-line bg-white">
        {data.map((a, i) => {
          const kind = a.action.split('.')[0];
          return (
            <li key={a._id} className={`flex items-start gap-3 px-4 py-3.5 ${i ? 'border-t border-slate-100' : ''}`}>
              <div className="relative">
                <Avatar user={a.actor} size="md" />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-indigo-600 ring-1 ring-line">
                  <Icon name={ACTIVITY_ICONS[kind] || 'activity'} className="h-2.5 w-2.5" strokeWidth={2.6} />
                </span>
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-ink-muted">
                  <span className="font-medium text-ink">{a.actor?.name || 'Someone'}</span> {describeActivity(a)}
                  {a.board?.name && <span className="text-slate-400"> · {a.board.name}</span>}
                </p>
                <time className="text-xs text-slate-400" dateTime={a.createdAt} title={formatDateTime(a.createdAt)}>
                  {timeAgo(a.createdAt)}
                </time>
              </div>
            </li>
          );
        })}
      </ol>
      <Pagination meta={meta} onPage={setPage} />
    </section>
  );
}
