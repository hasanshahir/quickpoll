import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, QrCode, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  pollId: string;
  question: string;
}

export const ShareModal = ({ isOpen, onClose, pollId, question }: ShareModalProps) => {
  const [copiedType, setCopiedType] = useState<'vote' | 'results' | null>(null);
  const [activeTab, setActiveTab] = useState<'vote' | 'results'>('vote');

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const voteUrl = `${origin}/p/${pollId}`;
  const resultsUrl = `${origin}/p/${pollId}/results`;

  const targetUrl = activeTab === 'vote' ? voteUrl : resultsUrl;

  const handleCopy = (url: string, type: 'vote' | 'results') => {
    navigator.clipboard.writeText(url);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2 mb-2 text-emerald-400 font-semibold text-sm">
          <Share2 className="w-4 h-4" />
          Share Poll
        </div>
        <h3 className="text-base font-bold text-slate-100 line-clamp-2 mb-4 leading-snug">
          {question}
        </h3>

        {/* Tab switcher: Vote Link vs Results Link */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-5">
          <button
            onClick={() => setActiveTab('vote')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'vote'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vote Link
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'results'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Results Link
          </button>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl mb-4 shadow-inner">
          <QRCodeSVG
            value={targetUrl}
            size={168}
            bgColor="#ffffff"
            fgColor="#090d16"
            level="M"
            includeMargin={false}
          />
          <span className="mt-2 text-[10px] font-medium text-slate-600 flex items-center gap-1">
            <QrCode className="w-3 h-3" />
            Scan to open {activeTab === 'vote' ? 'ballot' : 'results'}
          </span>
        </div>

        {/* URL Box & Copy Button */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
          <input
            type="text"
            readOnly
            value={targetUrl}
            className="flex-1 bg-transparent px-2.5 text-xs font-mono text-slate-300 truncate focus:outline-none"
          />
          <button
            onClick={() => handleCopy(targetUrl, activeTab)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shrink-0"
          >
            {copiedType === activeTab ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
