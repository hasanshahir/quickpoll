import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api, getStoredAdminToken, getMyPolls, saveStoredAdminToken } from '../api';
import type { Poll } from '../api';
import {
  Settings,
  Lock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  BarChart2,
  ExternalLink,
  ArrowLeft,
  Key,
} from 'lucide-react';

export const AdminPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenFromUrl = searchParams.get('token');
  const tokenFromStorage = id ? getStoredAdminToken(id) : null;

  const [adminToken, setAdminToken] = useState(tokenFromUrl || tokenFromStorage || '');
  const [tokenInput, setTokenInput] = useState('');

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Confirmation dialogs
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Store token from URL in localStorage and sanitize address bar
  useEffect(() => {
    if (tokenFromUrl && id) {
      saveStoredAdminToken(id, tokenFromUrl);
      setAdminToken(tokenFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [tokenFromUrl, id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    api
      .getPoll(id)
      .then((data) => {
        setPoll(data);
      })
      .catch((err) => {
        setError(err.message || 'Poll could not be found.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleApplyToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setAdminToken(tokenInput.trim());
  };

  const handleClosePoll = async () => {
    if (!id || !adminToken) return;
    setProcessing(true);
    setError(null);

    try {
      const res = await api.closePoll(id, adminToken);
      setActionMessage(res.message || 'Poll has been closed successfully.');
      setPoll((prev) => (prev ? { ...prev, is_closed: true } : null));
      setConfirmCloseOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to close poll. Verify your admin token.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeletePoll = async () => {
    if (!id || !adminToken) return;
    setProcessing(true);
    setError(null);

    try {
      await api.deletePoll(id, adminToken);

      // Clean up localStorage
      const polls = getMyPolls().filter((p) => p.id !== id);
      localStorage.setItem('quickpoll_my_polls', JSON.stringify(polls));

      setConfirmDeleteOpen(false);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to delete poll. Verify your admin token.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl py-12 px-4 animate-pulse">
        <div className="h-4 w-28 bg-slate-800 rounded mb-4" />
        <div className="h-8 w-3/4 bg-slate-800 rounded mb-8" />
        <div className="h-32 bg-slate-800/60 rounded-xl" />
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="mx-auto max-w-lg py-16 px-4 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 mb-4 ring-1 ring-rose-500/20">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Poll Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">{error}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl py-6 px-4 sm:px-0">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {poll && (
          <div className="flex items-center gap-2">
            <Link
              to={`/p/${poll.id}/results`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Live Results
            </Link>
            <Link
              to={`/p/${poll.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition-colors border border-emerald-500/30"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Vote Page
            </Link>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
          <Settings className="w-3.5 h-3.5" />
          Creator Administration
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight leading-snug">
          {poll?.question}
        </h1>
      </div>

      {/* Messages */}
      {actionMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-300 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Admin Token Input if not provided or recognized */}
      {!adminToken && (
        <div className="mb-6 p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold text-sm">
            <Key className="w-4 h-4" />
            Admin Token Required
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Enter the secret admin token provided when this poll was created to manage it.
          </p>

          <form onSubmit={handleApplyToken} className="flex gap-2">
            <input
              type="text"
              required
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste UUID admin token"
              className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs transition-colors shrink-0"
            >
              Authenticate
            </button>
          </form>
        </div>
      )}

      {/* Management Actions */}
      {adminToken && poll && (
        <div className="space-y-4">
          {/* Status Card */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Current Status
              </p>
              <p className="text-sm font-bold text-slate-200 mt-0.5">
                {poll.is_closed ? 'Closed (Voting Disabled)' : 'Active (Accepting Votes)'}
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                poll.is_closed
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {poll.is_closed ? 'Closed' : 'Active'}
            </span>
          </div>

          {/* Action 1: Close Poll */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                Close Poll
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Stop accepting new votes while preserving existing results.
              </p>
            </div>

            <button
              onClick={() => setConfirmCloseOpen(true)}
              disabled={poll.is_closed}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              {poll.is_closed ? 'Already Closed' : 'Close Poll Early'}
            </button>
          </div>

          {/* Action 2: Delete Poll */}
          <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                Delete Poll
              </h3>
              <p className="text-xs text-rose-200/70 mt-1">
                Permanently delete this poll, all options, and all cast votes.
              </p>
            </div>

            <button
              onClick={() => setConfirmDeleteOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold text-xs transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Poll
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Close Poll */}
      {confirmCloseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              Close This Poll?
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Voters will immediately be prevented from casting further ballots. This action cannot be reversed.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmCloseOpen(false)}
                disabled={processing}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleClosePoll}
                disabled={processing}
                className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors"
              >
                {processing ? 'Closing...' : 'Yes, Close Poll'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Delete Poll */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-rose-500/30 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-rose-300 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Permanently Delete Poll?
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              This will erase all questions, options, and vote records from the database. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteOpen(false)}
                disabled={processing}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePoll}
                disabled={processing}
                className="px-4 py-2 rounded-lg bg-rose-500 text-slate-950 text-xs font-bold hover:bg-rose-600 transition-colors"
              >
                {processing ? 'Deleting...' : 'Yes, Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
