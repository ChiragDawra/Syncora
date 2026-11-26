import Spinner from './Spinner';
import Icon from './Icon';

const VARIANTS = {
  primary: 'bg-indigo-600 text-white shadow-button hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300',
  secondary: 'bg-white text-slate-700 border border-line-strong hover:bg-slate-50 hover:border-slate-300 disabled:text-slate-400',
  danger: 'bg-red-600 text-white shadow-button hover:bg-red-700 disabled:bg-red-300',
  ghost: 'text-slate-600 hover:bg-sunken hover:text-ink disabled:text-slate-300',
  'danger-ghost': 'text-red-600 hover:bg-red-50 disabled:text-red-300',
};
const SIZES = {
  sm: 'h-8 px-2.5 text-[13px] gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-11 px-4 text-[15px] gap-2',
};

export default function Button({ variant = 'primary', size = 'md', loading = false, icon, className = '', children, disabled, type = 'button', ...props }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? <Spinner size="sm" className="text-current" /> : icon && <Icon name={icon} className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      {children}
    </button>
  );
}
