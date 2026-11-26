import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useWorkspace from '../../hooks/useWorkspace';
import Avatar from '../common/Avatar';
import Icon from '../common/Icon';

// Top app bar for phones and tablets (the sidebar takes over from lg up)
export default function Navbar() {
  const { user } = useAuth();
  const { setDrawerOpen } = useWorkspace();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-xl lg:hidden">
      <div className="flex h-14 items-center justify-between px-2 sm:px-4">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-ink hover:bg-sunken"
          aria-label="Open navigation"
        >
          <Icon name="menu" className="h-5 w-5" />
        </button>
        <Link to="/teams" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink">
          <img src="/favicon.svg" alt="" className="h-6 w-6" />
          Syncora
        </Link>
        <Link to="/profile" className="flex h-11 w-11 items-center justify-center rounded-full" aria-label="Profile">
          <Avatar user={user} size="md" />
        </Link>
      </div>
    </header>
  );
}
