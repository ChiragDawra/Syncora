import useTeam from '../hooks/useTeam';
import useFetch from '../hooks/useFetch';
import { getDashboard } from '../api/teams';
import StatTile from '../components/dashboard/StatTile';
import WorkloadTable from '../components/dashboard/WorkloadTable';
import DueSoonList from '../components/dashboard/DueSoonList';
import CompletedChart from '../components/dashboard/CompletedChart';
import ErrorState from '../components/common/ErrorState';
import Skeleton from '../components/common/Skeleton';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

function Panel({ title, children, className = '' }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-line bg-white p-4 sm:p-5 ${className}`}>
      <h2 className="mb-3 text-sm font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

export default function TeamDashboardPage() {
  const { team } = useTeam();
  const { data, loading, error, refetch } = useFetch((cfg) => getDashboard(team._id, cfg), [team._id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }
  if (error) return <ErrorState title="Could not load the dashboard" message={error.message} onRetry={refetch} />;

  const { totals, workload, dueSoon, completedPerDay, cached } = data;
  const rate = totals.total ? Math.round((totals.done / totals.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Dashboard</h2>
        <div className="flex items-center gap-2">
          <Badge tone={cached ? 'green' : 'slate'} pill>
            {cached ? 'Served from Redis cache' : 'Fresh from MongoDB'}
          </Badge>
          <Button variant="ghost" size="sm" icon="refresh" onClick={() => refetch({ silent: true })}>
            Refresh
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Total tasks" value={totals.total} icon="list" />
        <StatTile label="Open" value={totals.open} tone="text-indigo-700" icon="clock" iconTone="bg-indigo-50 text-indigo-600" />
        <StatTile label="Done" value={totals.done} tone="text-emerald-700" icon="checkCircle" iconTone="bg-emerald-50 text-emerald-600" hint={`${rate}% complete`} />
        <StatTile label="Overdue" value={totals.overdue} tone={totals.overdue ? 'text-red-600' : 'text-ink'} icon="alarm" iconTone="bg-red-50 text-red-600" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Workload · open tasks per member">
          <WorkloadTable workload={workload} />
        </Panel>
        <Panel title="Due in the next 7 days">
          <DueSoonList tasks={dueSoon} />
        </Panel>
      </div>
      <Panel title="Completed per day">
        <CompletedChart data={completedPerDay} />
      </Panel>
    </div>
  );
}
