import { Link } from 'react-router-dom';
import Button from './Button';
import Icon from './Icon';

export default function ErrorState({ title = 'Something went wrong', message, onRetry, backTo, compact = false }) {
  return (
    <div role="alert" className={`flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/60 text-center ${compact ? 'p-4' : 'm-4 p-10'}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
        <Icon name="alert" className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-red-800">{title}</h3>
      {message && <p className="mt-1 max-w-md text-sm text-red-700">{message}</p>}
      <div className="mt-4 flex gap-2">
        {onRetry && (
          <Button variant="secondary" size="sm" icon="refresh" onClick={() => onRetry()}>
            Retry
          </Button>
        )}
        {backTo && (
          <Link to={backTo} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-red-700 hover:bg-red-100">
            <Icon name="arrowLeft" className="h-3.5 w-3.5" />
            Go back
          </Link>
        )}
      </div>
    </div>
  );
}
