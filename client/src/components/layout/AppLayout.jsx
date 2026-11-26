import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { WorkspaceProvider } from '../../context/WorkspaceContext';
import useWorkspace from '../../hooks/useWorkspace';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

function Shell() {
  const { drawerOpen, setDrawerOpen } = useWorkspace();
  const { pathname } = useLocation();

  // close the mobile drawer on navigation and on Escape
  useEffect(() => setDrawerOpen(false), [pathname, setDrawerOpen]);
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen, setDrawerOpen]);

  return (
    <div className="min-h-full">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 border-r border-line bg-sunken lg:flex">
        <Sidebar />
      </aside>

      {/* mobile / tablet drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={() => setDrawerOpen(false)} />
          <aside className="relative flex h-full w-72 max-w-[85vw] bg-sunken shadow-dialog">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <Navbar />
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-5 sm:px-6 md:pb-10 lg:px-8 lg:pt-7">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

// Layout route: sidebar + app bar on every logged-in page; the matched child renders in <Outlet/>
export default function AppLayout() {
  return (
    <WorkspaceProvider>
      <Shell />
    </WorkspaceProvider>
  );
}
