import Icon from './Icon';

export default function SearchBox({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block h-9 w-full rounded-lg border border-line-strong bg-white pl-9 pr-8 text-sm text-ink placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-[3px] focus:ring-indigo-500/15 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700">
          <Icon name="x" className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
