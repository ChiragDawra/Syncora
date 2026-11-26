import { Link, useSearchParams } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import usePagination from '../hooks/usePagination';
import { listMyTasks } from '../api/tasks';
import PriorityBadge from '../components/tasks/PriorityBadge';
import DueDateBadge from '../components/tasks/DueDateBadge';
import Badge from '../components/common/Badge';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { CardSkeleton } from '../components/common/Skeleton';
import { STATUS_LABELS } from '../utils/constants';

const VIEWS = [
  { value: 'todo,in_progress', label: 'Open' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];
const STATUS_TONE = { todo: 'slate', in_progress: 'amber', done: 'green' };

export default function MyTasksPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'todo,in_progress';
  const sort = params.get('sort') || 'dueDate';
  const overdue = params.get('overdue') || '';
  const { page, setPage } = usePagination();

  const { data, meta, loading, error, refetch } = useFetch(
    (cfg) => listMyTasks({ status, sort, page, limit: 20, ...(overdue && { overdue }) }, cfg),
    [status, sort, page, overdue]
  );

  const set = (key, value) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete('page');
      return next;
    });

  let content;
  if (loading) {
    content = (
      <div className="space-y-2">
        <CardSkeleton count={4} />
      </div>
    );
  } else if (error) {
    content = <ErrorState title="Could not load your tasks" message={error.message} onRetry={refetch} />;
  } else if (!data.length) {
    content = <EmptyState icon="checkCircle" title="Nothing here" message="No tasks assigned to you match this view." />;
  } else {
    content = (
      <>
        <ul className="divide-y divide-slate-100 rounded-2xl border border-line bg-white">
          {data.map((t) => (
            <li key={t._id}>
              <Link to={`/boards/${t.board._id}/tasks/${t._id}`} className="flex flex-col gap-2 px-4 py-3 hover:bg-slate-50 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{t.title}</p>
                  <p className="text-xs text-slate-500">
                    {t.team?.name} · <span style={{ color: t.board?.color }}>●</span> {t.board?.name}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABELS[t.status]}</Badge>
                  <PriorityBadge priority={t.priority} />
                  <DueDateBadge task={t} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <Pagination meta={meta} onPage={setPage} />
      </>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">My tasks</h1>
      <p className="text-sm text-slate-600">Everything assigned to you, across all your teams.</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            type="button"
            aria-pressed={status === v.value}
            onClick={() => set('status', v.value === 'todo,in_progress' ? '' : v.value)}
            className={`rounded-full border px-3 py-1 text-sm ${status === v.value ? 'border-indigo-300 bg-indigo-50 font-medium text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`}
          >
            {v.label}
          </button>
        ))}
        <label className="ml-2 inline-flex items-center gap-1.5 text-sm text-slate-700">
          <input type="checkbox" checked={overdue === 'true'} onChange={(e) => set('overdue', e.target.checked ? 'true' : '')} />
          Overdue
        </label>
        <select
          aria-label="Sort"
          value={sort}
          onChange={(e) => set('sort', e.target.value === 'dueDate' ? '' : e.target.value)}
          className="ml-auto rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
        >
          <option value="dueDate">Due date</option>
          <option value="priority">Priority</option>
          <option value="-createdAt">Newest</option>
        </select>
      </div>

      <div className="mt-4">{content}</div>
    </div>
  );
}
