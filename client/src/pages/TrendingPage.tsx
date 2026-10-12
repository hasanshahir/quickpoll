import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { TrendingPoll } from '../api';
import {
  Users,
  Vote,
  BarChart2,
  Lock,
  RotateCw,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';

export const TrendingPage = () => {
  const [trending, setTrending] = useState<TrendingPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTrending();
      setTrending(res.trending || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load trending polls.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  return (
    <div className="mx-auto max-w-xl py-6 px-4 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            Trending Polls
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Polls ranked by total votes.
          </p>
        </div>

        <button
          onClick={fetchTrending}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50"
          title="Refresh trending polls"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-slate-900/70 border border-slate-800 rounded-2xl p-4" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-200 mb-1">Failed to load trending polls</h3>
          <p className="text-xs text-rose-300 mb-4">{error}</p>
          <button
            onClick={fetchTrending}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && trending.length === 0 && (
        <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Users className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-slate-100 mb-1">No polls yet</h3>
          <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
            No polls have been created yet.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            Create a Poll
          </Link>
        </div>
      )}

      {!loading && !error && trending.length > 0 && (
        <div className="space-y-3">
          {trending.map((p, idx) => (
            <div
              key={p.id}
              className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex items-center justify-center w-5 h-5 rounded-md bg-slate-800 text-[11px] font-mono font-bold text-slate-400 shrink-0">
                    {idx + 1}
                  </span>
                  <Link
                    to={`/p/${p.id}`}
                    className="text-sm sm:text-base font-bold text-slate-100 hover:text-emerald-400 transition-colors line-clamp-2"
                  >
                    {p.question}
                  </Link>
                </div>

                {p.is_closed ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                    <Lock className="w-2.5 h-2.5" />
                    Closed
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    Active
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/50 mt-3 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    {p.total_votes} {p.total_votes === 1 ? 'vote' : 'votes'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/p/${p.id}/results`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Results
                  </Link>
                  {!p.is_closed && (
                    <Link
                      to={`/p/${p.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
                    >
                      <Vote className="w-3.5 h-3.5" />
                      Vote
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
