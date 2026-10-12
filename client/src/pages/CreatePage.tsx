import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, saveMyPoll, getMyPolls } from '../api';
import type { StoredPoll } from '../api';
import {
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  BarChart2,
  Settings,
  Sparkles,
  ExternalLink,
  Vote,
} from 'lucide-react';
import { ShareModal } from '../components/ShareModal';

export const CreatePage = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success state after creation
  const [createdData, setCreatedData] = useState<{
    id: string;
    question: string;
    admin_token: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<'vote' | 'results' | 'admin' | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // My polls loaded from localStorage
  const [myPolls, setMyPolls] = useState<StoredPoll[]>([]);

  useEffect(() => {
    setMyPolls(getMyPolls());
  }, [createdData]);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError('Please enter a question for your poll.');
      return;
    }

    const filteredOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (filteredOptions.length < 2) {
      setError('A poll must have at least 2 non-empty options.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        question: trimmedQuestion,
        options: filteredOptions,
        is_multiple_choice: isMultipleChoice,
        expires_at: hasExpiry && expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      const res = await api.createPoll(payload);

      // Save to localStorage for creator management & "My Polls"
      saveMyPoll({
        id: res.poll.id,
        question: res.poll.question,
        admin_token: res.admin_token,
        created_at: res.poll.created_at,
      });

      setCreatedData({
        id: res.poll.id,
        question: res.poll.question,
        admin_token: res.admin_token,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create poll. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (text: string, key: 'vote' | 'results' | 'admin') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // Render Success Screen
  if (createdData) {
    const voteLink = `${origin}/p/${createdData.id}`;
    const resultsLink = `${origin}/p/${createdData.id}/results`;
    const adminLink = `${origin}/manage/${createdData.id}?token=${createdData.admin_token}`;

    return (
      <div className="mx-auto max-w-xl py-8 px-4 sm:px-0 animate-in fade-in duration-200">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold text-slate-100 tracking-tight mb-2">
            Your Poll is Live!
          </h2>
          <p className="text-sm text-slate-300 font-medium mb-6">
            "{createdData.question}"
          </p>

          {/* Links Section */}
          <div className="space-y-4 mb-6">
            {/* Share Voting Link */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Share Link (For Voters)
              </label>
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={voteLink}
                  className="flex-1 bg-transparent px-2.5 text-xs font-mono text-slate-300 truncate focus:outline-none"
                />
                <button
                  onClick={() => handleCopy(voteLink, 'vote')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shrink-0"
                >
                  {copiedKey === 'vote' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'vote' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Results Link */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Live Results Link
              </label>
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={resultsLink}
                  className="flex-1 bg-transparent px-2.5 text-xs font-mono text-slate-300 truncate focus:outline-none"
                />
                <button
                  onClick={() => handleCopy(resultsLink, 'results')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors shrink-0 border border-slate-700"
                >
                  {copiedKey === 'results' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'results' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Admin Link Warning */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2.5 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Save Your Admin Link (Shown Once)
                  </h4>
                  <p className="text-xs text-amber-200/90 mt-0.5">
                    Anyone with this link can close or delete your poll. It will not be shown again.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/80 border border-amber-500/30">
                <input
                  type="text"
                  readOnly
                  value={adminLink}
                  className="flex-1 bg-transparent px-2 text-[11px] font-mono text-amber-200 truncate focus:outline-none"
                />
                <button
                  onClick={() => handleCopy(adminLink, 'admin')}
                  className="inline-flex items-center gap-1 rounded bg-amber-500 px-2.5 py-1 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shrink-0"
                >
                  {copiedKey === 'admin' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'admin' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShareModalOpen(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors"
            >
              Show QR Code
            </button>
            <Link
              to={`/p/${createdData.id}/results`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors border border-slate-700"
            >
              <BarChart2 className="w-4 h-4" />
              View Results
            </Link>
            <button
              onClick={() => {
                setCreatedData(null);
                setQuestion('');
                setOptions(['', '']);
                setHasExpiry(false);
              }}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
            >
              Create Another
            </button>
          </div>
        </div>

        {/* Share modal */}
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          pollId={createdData.id}
          question={createdData.question}
        />
      </div>
    );
  }

  // Render Creation Form
  return (
    <div className="mx-auto max-w-xl py-6 px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mb-2 flex items-center gap-2">
          <span>Create an Instant Poll</span>
          <Sparkles className="w-5 h-5 text-emerald-400" />
        </h1>
        <p className="text-sm text-slate-400">
          Set up a live poll in seconds. Share the link or QR code, no login required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question field */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            Poll Question
          </label>
          <input
            type="text"
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Which design concept do you prefer?"
            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm sm:text-base transition-colors"
          />
        </div>

        {/* Options list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-200">
              Answer Options
            </label>
            <span className="text-xs text-slate-500 font-mono">
              {options.length} / 10 options
            </span>
          </div>

          <div className="space-y-2.5">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-6 text-xs text-slate-500 font-mono text-center">
                  {idx + 1}.
                </span>
                <input
                  type="text"
                  required
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors"
                    title="Remove option"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 10 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors border border-dashed border-emerald-500/30 w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              Add Another Option
            </button>
          )}
        </div>

        {/* Settings: Multi-choice & Expiration */}
        <div className="space-y-4 pt-2 border-t border-slate-800/80">
          {/* Multiple choice toggle */}
          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Allow Multiple Choices
              </p>
              <p className="text-xs text-slate-400">
                Voters can select more than one answer option.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isMultipleChoice}
              onChange={(e) => setIsMultipleChoice(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
            />
          </label>

          {/* Optional expiration toggle */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Set Expiration Time
                  </p>
                  <p className="text-xs text-slate-400">
                    Automatically close poll after a specified date.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={hasExpiry}
                onChange={(e) => setHasExpiry(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
              />
            </label>

            {hasExpiry && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <input
                  type="datetime-local"
                  required={hasExpiry}
                  value={expiresAt}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-base hover:bg-emerald-400 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              Publishing Poll...
            </>
          ) : (
            <>
              <Vote className="w-5 h-5" />
              Create Poll
            </>
          )}
        </button>
      </form>

      {/* My Polls list from localStorage */}
      {myPolls.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-800">
          <h3 className="text-base font-bold text-slate-200 mb-3 flex items-center gap-2">
            <span>My Created Polls</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {myPolls.length}
            </span>
          </h3>

          <div className="space-y-2">
            {myPolls.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {p.question}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Created {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Link
                    to={`/p/${p.id}/results`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                    title="Results"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/manage/${p.id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                    title="Manage"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/p/${p.id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    title="Vote link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
