import React, { useState } from 'react';
import { validateBusinessIdea } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { Loader2, Terminal } from 'lucide-react';

export const IdeaValidator: React.FC = () => {
  const [idea, setIdea] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    setLoading(true);
    setFeedback(null);
    
    try {
      const result = await validateBusinessIdea(idea);
      setFeedback(result);
    } catch (err) {
      setFeedback("システムエラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Terminal Input Header */}
      <div className="flex items-center gap-2 mb-4 text-brand-500">
        <Terminal className="w-4 h-4" />
        <span className="text-[10px] font-mono tracking-widest uppercase">AI_DIAGNOSTIC_SYSTEM v2.0</span>
        <div className="flex-1"></div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-[10px] font-mono text-green-400">ONLINE</span>
        </div>
      </div>

      {/* Cyberpunk Input Form */}
      <div className="border border-slate-800 bg-slate-900/50 overflow-hidden">
        <form onSubmit={handleSubmit} className="relative" aria-label="AI診断フォーム">
          {/* Input Area */}
          <div className="relative">
            <label htmlFor="idea-input" className="sr-only">あなたの目標やお悩みを入力してください</label>
            <div className="absolute top-4 left-4 font-mono text-brand-500 text-sm">&gt;_</div>
            <textarea
              id="idea-input"
              className="w-full pl-10 pr-4 py-4 bg-transparent text-white font-mono text-sm placeholder:text-slate-600 border-none outline-none resize-none focus:ring-0"
              rows={3}
              placeholder="あなたの目標やお悩みを入力..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              aria-describedby="feedback-area"
            />
          </div>

          {/* Action Bar */}
          <div className="bg-slate-900 px-4 py-3 flex justify-between items-center border-t border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 font-mono">GEMINI_ENGINE</span>
              <div className="h-3 w-[1px] bg-slate-700"></div>
              <span className="text-[10px] text-slate-600 font-mono">{idea.length} CHARS</span>
            </div>

            {/* Beam Button */}
            <button
              type="submit"
              disabled={loading || !idea.trim()}
              aria-label="AI診断を開始する"
              className="group relative overflow-hidden px-6 py-2 bg-brand-500 text-black text-xs font-mono font-bold tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.4)]"
            >
              {/* Beam Effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
              <span className="relative flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : 'EXECUTE'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Result Area - Terminal Output Style */}
      {feedback && (
        <div id="feedback-area" className="mt-4 border border-slate-800 bg-black overflow-hidden animate-fade-in-up" role="region" aria-label="AI診断結果">
          {/* Result Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800">
            <span className="font-mono text-[10px] text-slate-500">OUTPUT_STREAM</span>
            <span className="font-mono text-[10px] text-green-400">SUCCESS</span>
          </div>

          {/* Result Content */}
          <div className="p-4">
            <div className="prose prose-sm prose-invert max-w-none prose-headings:font-mono prose-headings:text-brand-400 prose-p:text-slate-300 prose-strong:text-white prose-ul:text-slate-400 prose-li:marker:text-brand-500">
              <ReactMarkdown>{feedback}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};