import { format, parseISO } from 'date-fns';

// Tasks completed per day for 14 days, drawn with plain CSS bars (no chart library)
export default function CompletedChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.done));
  const total = data.reduce((sum, d) => sum + d.done, 0);
  return (
    <figure>
      <div className="relative">
        {/* light gridlines */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-t border-dashed border-slate-100" />
          ))}
        </div>
        <div className="relative flex h-44 items-end gap-1 sm:gap-2" role="img" aria-label={`${total} tasks completed in the last 14 days`}>
          {data.map((d) => (
            <div key={d.date} className="group flex h-full flex-1 flex-col items-center justify-end">
              <span className="mb-1 text-[10px] font-medium tabular-nums text-slate-500 opacity-0 transition group-hover:opacity-100">{d.done}</span>
              <div
                className={`w-full max-w-8 rounded-t-md transition-colors ${d.done ? 'bg-emerald-500 group-hover:bg-emerald-600' : 'bg-slate-100'}`}
                style={{ height: `${Math.max(3, (d.done / max) * 100)}%` }}
                title={`${format(parseISO(d.date), 'd MMM')}: ${d.done} done`}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex gap-1 text-[10px] text-slate-400 sm:gap-2">
        {data.map((d, i) => (
          <span key={d.date} className="flex-1 text-center tabular-nums">
            {i % 2 === 0 ? format(parseISO(d.date), 'd/M') : ''}
          </span>
        ))}
      </div>
      <figcaption className="mt-3 text-xs text-slate-500">
        <strong className="font-semibold text-ink">{total}</strong> completed in the last 14 days
      </figcaption>
    </figure>
  );
}
