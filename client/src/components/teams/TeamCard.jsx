import { Link } from 'react-router-dom';
import RoleBadge from './RoleBadge';
import Icon from '../common/Icon';
import { timeAgo } from '../../utils/format';

export default function TeamCard({ team }) {
  return (
    <Link
      to={`/teams/${team._id}`}
      className="group flex flex-col rounded-2xl border border-line bg-white p-5 transition hover:border-slate-300 hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-button">
          {team.name.slice(0, 2).toUpperCase()}
        </span>
        <RoleBadge role={team.myRole} />
      </div>
      <h3 className="mt-4 font-semibold tracking-tight text-ink group-hover:text-indigo-700">{team.name}</h3>
      <p className="mt-1 line-clamp-2 min-h-10 text-sm text-ink-muted">{team.description || 'No description'}</p>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="users" className="h-3.5 w-3.5" />
          {team.memberCount} member{team.memberCount === 1 ? '' : 's'}
        </span>
        <span>Updated {timeAgo(team.updatedAt)}</span>
      </div>
    </Link>
  );
}
