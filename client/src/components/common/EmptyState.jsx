import Icon from './Icon';

export default function EmptyState({ title, message, action, icon = 'inbox', compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center ${compact ? 'p-6' : 'p-12'}`}>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-ink">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-ink-muted">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
