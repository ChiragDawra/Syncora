import { Link } from 'react-router-dom';
import Badge from '../common/Badge';
import Icon from '../common/Icon';
import { timeAgo } from '../../utils/format';

export default function BoardCard({ board }) {
  return (
    <Link
      to={`/boards/${board._id}`}
      className="group flex flex-col rounded-2xl border border-line bg-white p-4 transition hover:border-slate-300 hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${board.color}1a`, color: board.color }}>
            <Icon name="kanban" />
          </span>
          <h3 className="truncate font-semibold tracking-tight text-ink group-hover:text-indigo-700">{board.name}</h3>
        </div>
        {board.archived && <Badge tone="amber">Archived</Badge>}
      </div>
      <p className="mt-3 line-clamp-2 min-h-10 text-sm text-ink-muted">{board.description || 'No description'}</p>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="list" className="h-3.5 w-3.5" />
          {board.taskCount ?? 0} task{board.taskCount === 1 ? '' : 's'}
        </span>
        <span>Created {timeAgo(board.createdAt)}</span>
      </div>
    </Link>
  );
}
