import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useWorkspace from '../../hooks/useWorkspace';
import useFetch from '../../hooks/useFetch';
import { listTeams } from '../../api/teams';
import { listBoards } from '../../api/boards';
import { can } from '../../utils/permissions';
import Avatar from '../common/Avatar';
import Icon from '../common/Icon';
import RoleBadge from '../teams/RoleBadge';

const itemClass = ({ isActive }) =>
  `flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors ${
    isActive ? 'bg-white text-indigo-700 shadow-card ring-1 ring-line' : 'text-slate-600 hover:bg-white/70 hover:text-ink'
  }`;

function SectionTitle({ children, action }) {
  return (
    <div className="mb-1 mt-5 flex items-center justify-between px-2.5">
      <span className="micro-caps text-slate-400">{children}</span>
      {action}
    </div>
  );
}

// Left navigation: workspace (team) switcher, main links, the team's boards, and the signed-in user
export default function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const { teamId, setTeamId, version } = useWorkspace();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { data: teams } = useFetch((cfg) => listTeams(cfg), [version]);
  const team = teams?.find((t) => t._id === teamId) || null;
  const { data: boards } = useFetch(
    (cfg) => (team ? listBoards(team._id, { archived: 'false' }, cfg) : Promise.resolve({ data: [] })),
    [team?._id, version]
  );

  const switchTeam = (id) => {
    if (!id) return;
    setTeamId(id);
    navigate(`/teams/${id}`);
    onNavigate?.();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-14 items-center gap-2 px-4">
        <Link to="/teams" onClick={onNavigate} className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink">
          <img src="/favicon.svg" alt="" className="h-7 w-7" />
          Syncora
        </Link>
      </div>

      <div className="px-3">
        {teams?.length ? (
          <label className="relative flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-2 shadow-card focus-within:ring-[3px] focus-within:ring-indigo-500/15">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-[10px] font-bold text-white">
              {(team?.name || '?').slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-ink">{team ? team.name : 'Choose a team'}</span>
              {team && <RoleBadge role={team.myRole} />}
            </span>
            <Icon name="chevronUpDown" className="h-4 w-4 text-slate-400" />
            <select
              aria-label="Switch team"
              value={team?._id || ''}
              onChange={(e) => switchTeam(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              {!team && <option value="">Choose a team</option>}
              {teams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Main">
        <div className="mt-4 space-y-0.5">
          <NavLink to="/teams" end className={itemClass} onClick={onNavigate}>
            <Icon name="users" /> Teams
          </NavLink>
          <NavLink to="/my-tasks" className={itemClass} onClick={onNavigate}>
            <Icon name="checkCircle" /> My tasks
          </NavLink>
        </div>

        {team && (
          <>
            <SectionTitle>{team.name}</SectionTitle>
            <div className="space-y-0.5">
              <NavLink to={`/teams/${team._id}`} end className={itemClass} onClick={onNavigate}>
                <Icon name="kanban" /> Boards
              </NavLink>
              <NavLink to={`/teams/${team._id}/dashboard`} className={itemClass} onClick={onNavigate}>
                <Icon name="dashboard" /> Dashboard
              </NavLink>
              <NavLink to={`/teams/${team._id}/activity`} className={itemClass} onClick={onNavigate}>
                <Icon name="activity" /> Activity
              </NavLink>
              {can(team.myRole, 'team:settings') && (
                <NavLink to={`/teams/${team._id}/settings`} className={itemClass} onClick={onNavigate}>
                  <Icon name="settings" /> Settings
                </NavLink>
              )}
            </div>

            <SectionTitle
              action={
                can(team.myRole, 'board:create') && (
                  <Link to={`/teams/${team._id}?new=board`} onClick={onNavigate} className="rounded p-0.5 text-slate-400 hover:bg-white hover:text-indigo-600" aria-label="New board">
                    <Icon name="plus" className="h-3.5 w-3.5" />
                  </Link>
                )
              }
            >
              Boards
            </SectionTitle>
            <div className="space-y-0.5">
              {(boards || []).map((b) => {
                const active = pathname.startsWith(`/boards/${b._id}`);
                return (
                  <Link
                    key={b._id}
                    to={`/boards/${b._id}`}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={`flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] ${active ? 'bg-white font-medium text-ink shadow-card ring-1 ring-line' : 'text-slate-600 hover:bg-white/70 hover:text-ink'}`}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: b.color }} />
                    <span className="truncate">{b.name}</span>
                    <span className="ml-auto text-[11px] tabular-nums text-slate-400">{b.taskCount ?? ''}</span>
                  </Link>
                );
              })}
              {boards && !boards.length && <p className="px-2.5 py-1 text-xs text-slate-400">No boards yet</p>}
            </div>
          </>
        )}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-line px-3 py-3">
        <Link to="/profile" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1 hover:bg-white/70">
          <Avatar user={user} size="md" />
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium text-ink">{user?.name}</span>
            <span className="block truncate text-xs text-slate-500">{user?.email}</span>
          </span>
        </Link>
        <button type="button" onClick={handleLogout} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-red-600" aria-label="Log out" title="Log out">
          <Icon name="logout" />
        </button>
      </div>
    </div>
  );
}
