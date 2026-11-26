import { Link, useLocation } from 'react-router-dom';
import Avatar from '../common/Avatar';
import Icon from '../common/Icon';
import PriorityBadge from './PriorityBadge';
import DueDateBadge from './DueDateBadge';
import { STATUSES, STATUS_LABELS } from '../../utils/constants';

// One card on the board. The status menu is the keyboard- and touch-friendly way to move a task.
export default function TaskCard({ task, boardId, onMove, dragging = false }) {
  const { search } = useLocation();
  const done = task.status === 'done';
  return (
    <article
      className={`group relative overflow-hidden rounded-xl border bg-white p-3 transition ${
        dragging ? 'rotate-[1.5deg] border-indigo-300 shadow-pop' : 'border-line hover:border-slate-300 hover:shadow-card'
      }`}
    >
      {task.isOverdue && <span className="absolute inset-y-0 left-0 w-1 bg-red-500" aria-hidden="true" />}
      <Link
        to={`/boards/${boardId}/tasks/${task._id}${search}`}
        className={`block text-sm font-medium leading-snug ${done ? 'text-slate-400 line-through decoration-slate-300' : 'text-ink hover:text-indigo-700'}`}
      >
        {task.title}
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        {task.labels?.map((l) => (
          <span key={l} className={`micro-caps rounded px-1.5 py-[3px] ${done ? 'bg-slate-50 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
            {l}
          </span>
        ))}
        <PriorityBadge priority={task.priority} />
      </div>

      {(task.dueDate || task.completedAt) && (
        <div className="mt-2">
          <DueDateBadge task={task} />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 text-xs text-slate-500">
          <Avatar user={task.assignee} size="sm" />
          {task.commentCount > 0 && (
            <span className="inline-flex items-center gap-1" title="Comments">
              <Icon name="message" className="h-3.5 w-3.5" /> {task.commentCount}
            </span>
          )}
          {task.attachmentCount > 0 && (
            <span className="inline-flex items-center gap-1" title="Attachments">
              <Icon name="paperclip" className="h-3.5 w-3.5" /> {task.attachmentCount}
            </span>
          )}
        </div>
        <label className="relative inline-flex items-center">
          <span className="sr-only">Move &quot;{task.title}&quot;</span>
          <select
            value={task.status}
            onChange={(e) => onMove(task, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className={`h-7 cursor-pointer appearance-none rounded-md border border-transparent py-0 pl-2 pr-6 text-[11px] font-semibold hover:border-line-strong focus:border-indigo-400 focus:outline-none ${
              done ? 'bg-emerald-50 text-emerald-700' : task.status === 'in_progress' ? 'bg-indigo-50 text-indigo-700' : 'bg-sunken text-slate-600'
            }`}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <Icon name="chevronUpDown" className="pointer-events-none absolute right-1.5 h-3 w-3 text-current opacity-60" />
        </label>
      </div>
    </article>
  );
}
