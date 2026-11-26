export default function ProgressBar({ value = 0, label, tone = 'bg-indigo-600', className = '' }) {
  return (
    <div className={className}>
      {label && (
        <div className="mb-1 flex justify-between text-xs text-ink-muted">
          <span>{label}</span>
          <span className="tabular-nums">{value}%</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full transition-all duration-500 ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
