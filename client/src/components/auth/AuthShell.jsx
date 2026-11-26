import Icon from '../common/Icon';

const POINTS = [
  { icon: 'user', text: 'Every task has an owner, a status, a priority and a due date' },
  { icon: 'users', text: 'Team roles decide who can do what: owner, admin, member' },
  { icon: 'dashboard', text: 'Workload, overdue work and progress at a glance' },
];

// Shared frame for the login and register pages: brand panel on large screens, form card everywhere
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-full lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-indigo-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-violet-400/30 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-center gap-2.5 text-lg font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <Icon name="logo" className="h-5 w-5" strokeWidth={2.6} />
          </span>
          Syncora
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">One workspace. Clear ownership. Complete accountability.</h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-start gap-3 text-[15px] text-indigo-100">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon name={p.icon} className="h-4 w-4 text-white" />
                </span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-indigo-200">Back End Engineering-II · MERN team task board</p>
      </aside>

      <main className="flex items-center justify-center bg-canvas px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <img src="/favicon.svg" alt="" className="mb-6 h-10 w-10 lg:hidden" />
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
            <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>
          </div>
          {children}
          {footer && <p className="mt-6 text-center text-sm text-ink-muted">{footer}</p>}
        </div>
      </main>
    </div>
  );
}
