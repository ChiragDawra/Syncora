import { Link, useLocation } from 'react-router-dom';
import useWorkspace from '../../hooks/useWorkspace';
import Icon from '../common/Icon';

// Thumb-friendly tab bar on phones (hidden from md up)
export default function BottomNav() {
  const { teamId } = useWorkspace();
  const { pathname } = useLocation();
  const items = [
    { to: teamId ? `/teams/${teamId}` : '/teams', label: 'Boards', icon: 'kanban', active: (/^\/teams\/[^/]+$/.test(pathname) || pathname.startsWith('/boards')) },
    { to: '/my-tasks', label: 'My tasks', icon: 'checkCircle', active: pathname.startsWith('/my-tasks') },
    { to: teamId ? `/teams/${teamId}/dashboard` : '/teams', label: 'Dashboard', icon: 'dashboard', active: pathname.endsWith('/dashboard') },
    { to: '/teams', label: 'Teams', icon: 'users', active: pathname === '/teams' },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/90 pb-safe backdrop-blur-xl md:hidden" aria-label="Primary">
      <div className="flex h-16 items-center justify-around px-2">
        {items.map((it) => (
          <Link
            key={it.label}
            to={it.to}
            aria-current={it.active ? 'page' : undefined}
            className={`flex min-h-11 min-w-16 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-medium ${it.active ? 'text-indigo-600' : 'text-slate-500'}`}
          >
            <Icon name={it.icon} className="h-[22px] w-[22px]" strokeWidth={it.active ? 2.2 : 1.8} />
            {it.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
