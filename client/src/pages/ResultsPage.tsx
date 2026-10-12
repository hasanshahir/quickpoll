import { useParams, Link } from 'react-router-dom';
import { useLiveResults } from '../hooks/useLiveResults';
import { getStoredAdminToken } from '../api';
import {
  Radio,
  Lock,
  Share2,
  Vote,
  Settings,
  AlertTriangle,
  RotateCw,
  Trophy,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { ShareModal } from '../components/ShareModal';

export const ResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data, status, error, pollDeleted, refetch } = useLiveResults(id);
  const [shareOpen, setShareOpen] = useState(false);

  const adminToken = id ? getStoredAdminToken(id) : null;

  if (pollDeleted) {
    return (
      <div className="mx-auto max-w-lg py-16 px-4 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 mb-4 ring-1 ring-rose-500/20">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Poll Deleted</h2>
        <p className="text-sm text-slate-400 mb-6">This poll was removed by its administrator.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
        >
          Create New Poll
        </Link>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-lg py-16 px-4 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 mb-4 ring-1 ring-rose-500/20">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Unable to Load Results</h2>
        <p className="text-sm text-slate-400 mb-6">{error}</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <RotateCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-xl py-12 px-4 animate-pulse">
        <div className="h-4 w-32 bg-slate-800 rounded mb-4" />
        <div className="h-8 w-4/5 bg-slate-800 rounded mb-8" />
        <div className="space-y-4">
          <div className="h-16 bg-slate-800/60 rounded-xl" />
          <div className="h-16 bg-slate-800/60 rounded-xl" />
          <div className="h-16 bg-slate-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  const { poll, total_votes, results } = data;
  const isPollExpired = poll.expires_at && new Date() > new Date(poll.expires_at);
  const isPollClosed = poll.is_closed || Boolean(isPollExpired);

  // Determine top winning option(s) if any votes exist
  const maxVotes = Math.max(...results.map((r) => r.votes), 0);

  return (
    <div className="mx-auto max-w-xl py-6 px-4 sm:px-0">
      {/* Header status badges & live connection indicators */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {isPollClosed ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Lock className="w-3.5 h-3.5" />
                Poll Closed
              </span>
            ) : status === 'live' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Radio className="w-3 h-3" />
                Live Results
              </span>
            ) : status === 'reconnecting' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <RotateCw className="w-3 h-3 animate-spin" />
                Reconnecting...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <RotateCw className="w-3 h-3" />
                Auto-refreshing (5s)
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <Users className="w-3 h-3 text-slate-400" />
              {total_votes} {total_votes === 1 ? 'vote' : 'votes'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700/80"
              title="Share poll link and QR code"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>

            {adminToken && (
              <Link
                to={`/manage/${poll.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
                title="Manage this poll"
              >
                <Settings className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight leading-snug">
          {poll.question}
        </h1>
      </div>

      {/* Results breakdown cards */}
      <div className="space-y-3 mb-8">
        {results.map((opt) => {
          const isWinner = maxVotes > 0 && opt.votes === maxVotes;

          return (
            <div
              key={opt.option_id}
              className={`relative overflow-hidden rounded-xl border p-4 transition-all ${
                isWinner
                  ? 'bg-slate-900 border-emerald-500/40 shadow-sm shadow-emerald-500/5'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              {/* Animated Progress Bar fill */}
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out rounded-xl ${
                  isWinner ? 'bg-emerald-500/20' : 'bg-slate-800/80'
                }`}
                style={{ width: `${opt.percentage}%` }}
              />

              {/* Text content above fill */}
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  {isWinner && (
                    <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span
                    className={`text-sm sm:text-base font-semibold truncate ${
                      isWinner ? 'text-emerald-100' : 'text-slate-200'
                    }`}
                  >
                    {opt.option_text}
                  </span>
                </div>

                <div className="text-right shrink-0 flex items-baseline gap-2">
                  <span className="text-xs text-slate-400">
                    {opt.votes} {opt.votes === 1 ? 'vote' : 'votes'}
                  </span>
                  <span
                    className={`text-sm sm:text-base font-mono font-bold ${
                      isWinner ? 'text-emerald-400' : 'text-slate-300'
                    }`}
                  >
                    {opt.percentage}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation & actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
        {!isPollClosed && (
          <Link
            to={`/p/${poll.id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20"
          >
            <Vote className="w-4 h-4" />
            Cast a Vote
          </Link>
        )}

        <button
          onClick={() => setShareOpen(true)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors border border-slate-700"
        >
          <Share2 className="w-4 h-4" />
          Share Poll & QR Code
        </button>
      </div>

      {/* Share Modal */}
      {id && (
        <ShareModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          pollId={id}
          question={poll.question}
        />
      )}
    </div>
  );
};
