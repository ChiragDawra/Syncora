import { initials } from '../../utils/format';

const COLORS = ['bg-indigo-600', 'bg-violet-600', 'bg-sky-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-600'];
const colorFor = (name = '') => COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
const DIMS = { xs: 'h-5 w-5 text-[9px]', sm: 'h-6 w-6 text-[10px]', md: 'h-8 w-8 text-xs', lg: 'h-16 w-16 text-xl' };

export default function Avatar({ user, size = 'md', className = '' }) {
  const dim = DIMS[size];
  if (!user) {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-slate-400 ${dim} ${className}`} title="Unassigned">
        ?
      </span>
    );
  }
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.name} title={user.name} className={`shrink-0 rounded-full object-cover ring-2 ring-white ${dim} ${className}`} />;
  }
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white ${colorFor(user.name)} ${dim} ${className}`} title={user.name}>
      {initials(user.name)}
    </span>
  );
}
