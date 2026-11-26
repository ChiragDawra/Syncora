import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center p-8 text-center">
      <p className="text-6xl font-bold text-indigo-600">404</p>
      <h1 className="mt-2 text-xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-1 text-sm text-slate-600">The link may be broken, or the page was removed.</p>
      <Link to="/teams" className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
        Back to my teams
      </Link>
    </div>
  );
}
