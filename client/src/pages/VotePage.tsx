import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import type { Poll } from '../api';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  BarChart2,
  Lock,
  ArrowRight,
  Vote,
  Sparkles,
} from 'lucide-react';

export const VotePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    api
      .getPoll(id)
      .then((data) => {
        setPoll(data);
        if (data.has_voted || data.hasVoted) {
          setAlreadyVoted(true);
        }
      })
      .catch((err) => {
        setError(err.message || 'Poll could not be found.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleToggleOption = (optionId: string) => {
    if (!poll || poll.is_closed || alreadyVoted) return;

    if (poll.is_multiple_choice) {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((o) => o !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
    setVoteError(null);
  };

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !poll || poll.is_closed || alreadyVoted) return;

    if (selectedOptions.length === 0) {
      setVoteError('Please select at least one option to vote.');
      return;
    }

    setSubmitting(true);
    setVoteError(null);

    try {
      await api.submitVote(id, selectedOptions);
      setAlreadyVoted(true);
      navigate(`/p/${id}/results`);
    } catch (err: any) {
      if (err.status === 409) {
        localStorage.setItem(`quickpoll_voted_${id}`, 'true');
        setAlreadyVoted(true);
        setVoteError('You have already voted on this poll.');
      } else {
        setVoteError(err.message || 'Failed to submit vote. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl py-12 px-4 animate-pulse">
        <div className="h-4 w-28 bg-slate-800 rounded mb-4" />
        <div className="h-8 w-3/4 bg-slate-800 rounded mb-8" />
        <div className="space-y-3">
          <div className="h-14 bg-slate-800/60 rounded-xl" />
          <div className="h-14 bg-slate-800/60 rounded-xl" />
          <div className="h-14 bg-slate-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="mx-auto max-w-lg py-16 px-4 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 mb-4 ring-1 ring-rose-500/20">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Poll Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">{error || 'This poll does not exist or may have been deleted.'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
        >
          Create New Poll
        </Link>
      </div>
    );
  }

  const isPollExpired = poll.expires_at && new Date() > new Date(poll.expires_at);
  const isPollClosed = poll.is_closed || Boolean(isPollExpired);

  return (
    <div className="mx-auto max-w-xl py-6 px-4 sm:px-0">
      {/* Poll Header & Badges */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {isPollClosed ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Lock className="w-3.5 h-3.5" />
              Poll Closed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          )}

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {poll.is_multiple_choice ? 'Multiple Choice' : 'Single Choice'}
          </span>

          {poll.expires_at && !isPollClosed && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Clock className="w-3 h-3" />
              Ends {new Date(poll.expires_at).toLocaleDateString()}
            </span>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight leading-snug">
          {poll.question}
        </h1>
      </div>

      {/* Already Voted Banner */}
      {alreadyVoted && (
        <div className="mb-6 p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
            <p className="text-sm font-medium text-teal-200">
              You have already voted on this poll.
            </p>
          </div>
          <Link
            to={`/p/${poll.id}/results`}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 text-xs font-bold hover:bg-teal-400 transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            View Results
          </Link>
        </div>
      )}

      {/* Closed Notice */}
      {isPollClosed && !alreadyVoted && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-sm font-medium text-amber-200">
              Voting has ended for this poll.
            </p>
          </div>
          <Link
            to={`/p/${poll.id}/results`}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            View Final Results
          </Link>
        </div>
      )}

      {/* Voting Form */}
      <form onSubmit={handleVoteSubmit} className="space-y-3">
        {poll.options.map((option) => {
          const isSelected = selectedOptions.includes(option.id);
          const isDisabled = isPollClosed || alreadyVoted;

          return (
            <div
              key={option.id}
              onClick={() => !isDisabled && handleToggleOption(option.id)}
              className={`group relative flex items-center gap-3 p-4 rounded-xl border transition-all select-none ${
                isDisabled
                  ? 'cursor-not-allowed opacity-70 bg-slate-900/40 border-slate-800'
                  : 'cursor-pointer'
              } ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-slate-100 shadow-sm shadow-emerald-500/10'
                  : 'bg-slate-900 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              {/* Radio or Checkbox icon */}
              <div
                className={`w-5 h-5 flex items-center justify-center transition-colors shrink-0 ${
                  poll.is_multiple_choice ? 'rounded' : 'rounded-full'
                } border ${
                  isSelected
                    ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                    : 'border-slate-600 group-hover:border-slate-400'
                }`}
              >
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[3]" />
                )}
              </div>

              <span className="text-sm sm:text-base font-medium flex-1">
                {option.option_text}
              </span>
            </div>
          );
        })}

        {voteError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{voteError}</span>
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={
              isPollClosed ||
              alreadyVoted ||
              selectedOptions.length === 0 ||
              submitting
            }
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm sm:text-base hover:bg-emerald-400 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Submitting Ballot...
              </>
            ) : alreadyVoted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Vote Recorded
              </>
            ) : (
              <>
                <Vote className="w-4 h-4" />
                Cast Your Vote
              </>
            )}
          </button>

          <Link
            to={`/p/${poll.id}/results`}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors border border-slate-700/60"
          >
            <BarChart2 className="w-4 h-4" />
            <span>See Live Results</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-60" />
          </Link>
        </div>
      </form>

      {/* Footer hint */}
      <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Live ballot verification enabled
        </span>
        <span>QuickPoll Anonymous</span>
      </div>
    </div>
  );
};
