// Semantic tones from the design system: tinted fill, matching deep text, hairline border
const TONES = {
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function Badge({ tone = 'slate', children, className = '', pill = false }) {
  return (
    <span
      className={`inline-flex h-[22px] items-center gap-1 border px-1.5 text-[11px] font-medium whitespace-nowrap ${pill ? 'rounded-full px-2' : 'rounded-md'} ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
