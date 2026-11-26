import { NavLink, Outlet, useParams } from 'react-router-dom';
import { TeamProvider } from '../../context/TeamContext';
import useTeam from '../../hooks/useTeam';
import RoleBadge from '../teams/RoleBadge';
import Avatar from '../common/Avatar';

const tabClass = ({ isActive }) =>
  `whitespace-nowrap border-b-2 px-1 pb-2.5 text-[13px] font-medium transition-colors ${
    isActive ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-ink'
  }`;

function TeamHeader() {
  const { team, myRole, can } = useTeam();
  return (
    <div className="mb-6">
      <p className="text-[13px] text-slate-500">Team</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{team.name}</h1>
        <RoleBadge role={myRole} />
        <div className="ml-auto flex items-center gap-2">
          <div className="flex -space-x-2">
            {team.members.slice(0, 5).map((m) => (
              <Avatar key={m.user._id} user={m.user} size="sm" />
            ))}
          </div>
          <span className="text-[13px] text-slate-500">{team.members.length} members</span>
        </div>
      </div>
      {team.description && <p className="mt-1 max-w-2xl text-sm text-ink-muted">{team.description}</p>}
      {/* the sidebar carries these links from lg up */}
      <nav className="no-scrollbar mt-4 flex gap-5 overflow-x-auto border-b border-line lg:hidden" aria-label="Team">
        <NavLink end to={`/teams/${team._id}`} className={tabClass}>
          Boards
        </NavLink>
        <NavLink to={`/teams/${team._id}/dashboard`} className={tabClass}>
          Dashboard
        </NavLink>
        <NavLink to={`/teams/${team._id}/activity`} className={tabClass}>
          Activity
        </NavLink>
        {can('team:settings') && (
          <NavLink to={`/teams/${team._id}/settings`} className={tabClass}>
            Settings
          </NavLink>
        )}
      </nav>
    </div>
  );
}

// Nested route layout: /teams/:teamId/* shares the team header and TeamContext
export default function TeamLayout() {
  const { teamId } = useParams();
  return (
    <TeamProvider teamId={teamId} key={teamId}>
      <TeamHeader />
      <Outlet />
    </TeamProvider>
  );
}
