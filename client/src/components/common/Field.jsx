// Label + control + error/hint, shared by Input, Select and TextArea
export default function Field({ label, htmlFor, error, hint, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-slate-700">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>
      )}
    </div>
  );
}

export const controlClass = (error) =>
  `block w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 transition-shadow focus:outline-none focus:ring-[3px] disabled:bg-sunken disabled:text-slate-500 ${
    error ? 'border-red-300 focus:border-red-400 focus:ring-red-500/15' : 'border-line-strong focus:border-indigo-500 focus:ring-indigo-500/15'
  }`;
