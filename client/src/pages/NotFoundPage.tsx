import { Link } from 'react-router-dom';
import { HelpCircle, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-20 text-center">
      <div className="rounded-full bg-slate-800 p-4 mb-4 ring-1 ring-slate-700">
        <HelpCircle className="h-10 w-10 text-slate-400" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-2">Page Not Found</h1>
      <p className="text-sm text-slate-400 mb-6">The page or poll you're looking for doesn't exist or has moved.</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
      >
        <Home className="h-4 w-4" />
        Return Home
      </Link>
    </div>
  );
};
