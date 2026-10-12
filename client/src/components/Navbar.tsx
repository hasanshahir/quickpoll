import { Link, useLocation } from 'react-router-dom';
import { Vote, TrendingUp, PlusCircle } from 'lucide-react';

export const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-emerald-400 hover:text-emerald-300 transition-colors">
          <Vote className="h-6 w-6 text-emerald-400" />
          <span className="bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent font-extrabold tracking-tight text-xl">
            QuickPoll
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
          <Link
            to="/trending"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              isActive('/trending')
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden xs:inline">Trending</span>
          </Link>

          <Link
            to="/"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              isActive('/')
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                : 'bg-emerald-500/90 text-slate-950 hover:bg-emerald-400 font-semibold'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Poll</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};
