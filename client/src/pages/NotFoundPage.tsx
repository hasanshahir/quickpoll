import { Link } from 'react-router-dom';
import { HelpCircle, Home, TrendingUp } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <div className="rounded-2xl bg-slate-900 p-4 mb-4 ring-1 ring-slate-800 shadow-xl">
        <HelpCircle className="h-10 w-10 text-emerald-400" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mb-2">
        Page Not Found
      </h1>
      <p className="text-xs sm:text-sm text-slate-400 mb-8 max-w-xs">
        The link you followed may be broken or the poll may have been deleted.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link
          to="/"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20"
        >
          <Home className="h-4 w-4" />
          Create a Poll
        </Link>
        <Link
          to="/trending"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <TrendingUp className="h-4 w-4" />
          Trending
        </Link>
      </div>
    </div>
  );
};
