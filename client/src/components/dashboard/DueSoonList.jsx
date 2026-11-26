import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import PriorityBadge from '../tasks/PriorityBadge';
import { dueLabel } from '../../utils/format';

export default function DueSoonList({ tasks }) {
  if (!tasks.length) return <p className="py-6 text-center text-sm text-slate-500">Nothing due in the next 7 days.</p>;
  return (
    <ul className="-mx-2 divide-y divide-slate-100">
      {tasks.map((t) => (
        <li key={t._id}>
          <Link to={`/boards/${t.board?._id}/tasks/${t._id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50">
            <Avatar user={t.assignee} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{t.title}</p>
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                {dueLabel(t.dueDate)}
                <span className="text-slate-300">·</span>
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.board?.color }} />
                {t.board?.name}
              </p>
            </div>
            <PriorityBadge priority={t.priority} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
