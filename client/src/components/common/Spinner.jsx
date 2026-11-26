export default function Spinner({ size = 'md', className = 'text-indigo-600', label = 'Loading' }) {
  const dim = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }[size];
  return (
    <svg className={`animate-spin ${dim} ${className}`} viewBox="0 0 24 24" fill="none" role="status" aria-label={label}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function FullPageSpinner({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner size="lg" label={label} />
      <span className="text-sm">{label}…</span>
    </div>
  );
}
