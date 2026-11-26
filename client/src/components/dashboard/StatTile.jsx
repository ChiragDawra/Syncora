import Icon from '../common/Icon';

export default function StatTile({ label, value, tone = 'text-ink', icon, iconTone = 'bg-slate-100 text-slate-600', hint, children }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="micro-caps text-slate-500">{label}</p>
        {icon && (
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconTone}`}>
            <Icon name={icon} className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <p className={`mt-2 text-3xl font-semibold tracking-tight tabular-nums ${tone}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      {children}
    </div>
  );
}
