import { useState } from 'react';
import SearchBox from '../common/SearchBox';
import Button from '../common/Button';
import Icon from '../common/Icon';
import { PRIORITIES, PRIORITY_LABELS, SORT_OPTIONS, STATUSES, STATUS_LABELS } from '../../utils/constants';

// A select that looks like a filter chip; highlighted when a value is set
function ChipSelect({ icon, label, value, onChange, children, active }) {
  return (
    <label
      className={`relative inline-flex h-9 shrink-0 items-center rounded-lg border text-[13px] transition-colors focus-within:ring-[3px] focus-within:ring-indigo-500/15 ${
        active ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-line-strong bg-white text-slate-700 hover:border-slate-300'
      }`}
    >
      <Icon name={icon} className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 opacity-70" />
      <span className="sr-only">{label}</span>
      <select value={value} onChange={onChange} className="h-full cursor-pointer appearance-none bg-transparent pl-8 pr-7 focus:outline-none">
        {children}
      </select>
      <Icon name="chevronDown" className="pointer-events-none absolute right-2 h-3.5 w-3.5 opacity-60" />
    </label>
  );
}

// Every filter lives in the URL (see BoardPage), so links and refresh keep them
export default function BoardFilters({ filters, search, onSearch, onChange, onClear, members, active }) {
  const [open, setOpen] = useState(false);
  const statuses = filters.status ? filters.status.split(',') : [];
  const toggleStatus = (s) => {
    const current = statuses.length ? statuses : STATUSES;
    const next = current.includes(s) ? current.filter((x) => x !== s) : [...current, s];
    if (!next.length) return; // keep at least one column
    onChange({ status: next.length === STATUSES.length ? '' : STATUSES.filter((x) => next.includes(x)).join(',') });
  };
  const activeCount = ['priority', 'assignee', 'label', 'overdue'].filter((k) => filters[k]).length + (filters.sort !== 'position' ? 1 : 0);

  const controls = (
    <>
      <ChipSelect icon="sliders" label="Priority" value={filters.priority} onChange={(e) => onChange({ priority: e.target.value })} active={Boolean(filters.priority)}>
        <option value="">Any priority</option>
        {[...PRIORITIES].reverse().map((p) => (
          <option key={p} value={p}>
            {PRIORITY_LABELS[p]}
          </option>
        ))}
        <option value="high,urgent">High + Urgent</option>
      </ChipSelect>
      <ChipSelect icon="user" label="Assignee" value={filters.assignee} onChange={(e) => onChange({ assignee: e.target.value })} active={Boolean(filters.assignee)}>
        <option value="">Anyone</option>
        <option value="me">Assigned to me</option>
        <option value="none">Unassigned</option>
        {members.map((m) => (
          <option key={m.user._id} value={m.user._id}>
            {m.user.name}
          </option>
        ))}
      </ChipSelect>
      <ChipSelect icon="list" label="Sort" value={filters.sort} onChange={(e) => onChange({ sort: e.target.value })} active={filters.sort !== 'position'}>
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            Sort: {o.label}
          </option>
        ))}
      </ChipSelect>
      <label
        className={`relative inline-flex h-9 shrink-0 items-center rounded-lg border text-[13px] focus-within:ring-[3px] focus-within:ring-indigo-500/15 ${
          filters.label ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-line-strong bg-white text-slate-700'
        }`}
      >
        <Icon name="tag" className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 opacity-70" />
        <input
          aria-label="Label"
          placeholder="Label"
          value={filters.label}
          onChange={(e) => onChange({ label: e.target.value.trim().toLowerCase() })}
          maxLength={20}
          className="h-full w-28 rounded-lg bg-transparent pl-8 pr-2 placeholder:text-slate-500 focus:outline-none"
        />
      </label>
      <button
        type="button"
        aria-pressed={filters.overdue === 'true'}
        onClick={() => onChange({ overdue: filters.overdue === 'true' ? '' : 'true' })}
        className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-[13px] ${
          filters.overdue === 'true' ? 'border-red-200 bg-red-50 text-red-600' : 'border-line-strong bg-white text-slate-700 hover:border-slate-300'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${filters.overdue === 'true' ? 'bg-red-500' : 'bg-red-400'}`} />
        Overdue only
      </button>
    </>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={search} onChange={onSearch} placeholder="Search title and description" className="min-w-0 flex-1 md:max-w-xs" />
        {/* phones: everything else sits behind a Filters button */}
        <Button variant="secondary" icon="sliders" className="md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          Filters
          {activeCount > 0 && <span className="rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">{activeCount}</span>}
        </Button>
        {/* tablet: one scrollable chip row; wide screens: chips wrap */}
        <div className="no-scrollbar hidden min-w-0 flex-1 items-center gap-2 overflow-x-auto md:flex 2xl:flex-wrap 2xl:overflow-visible">{controls}</div>
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          {active && (
            <Button variant="ghost" size="sm" icon="x" onClick={onClear}>
              Clear
            </Button>
          )}
          <div className="hidden rounded-lg border border-line bg-sunken p-0.5 xl:inline-flex" role="group" aria-label="Columns">
            {STATUSES.map((s) => {
              const on = !statuses.length || statuses.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleStatus(s)}
                  className={`h-8 rounded-md px-2.5 text-xs font-medium transition ${on ? 'bg-white text-ink shadow-card' : 'text-slate-500 hover:text-ink'}`}
                >
                  {STATUS_LABELS[s]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {open && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden">
          {controls}
          {active && (
            <Button variant="ghost" icon="x" onClick={onClear}>
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
