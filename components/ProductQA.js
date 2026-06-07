import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ProductQA({ productId }) {
  const { data: session } = useSession();
  const [qas, setQas] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [helpfulClicked, setHelpfulClicked] = useState({});

  useEffect(() => {
    fetch(`/api/products/qa/${productId}`)
      .then(r => r.json())
      .then(data => { setQas(Array.isArray(data) ? data : []); setFetching(false); })
      .catch(() => setFetching(false));
  }, [productId]);

  async function handleAsk(e) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/qa/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (res.ok) {
        setQas(prev => [data, ...prev.filter(q => q.id !== data.id)]);
        setQuestion('');
      }
    } finally {
      setLoading(false);
    }
  }

  async function markHelpful(qaId) {
    if (helpfulClicked[qaId]) return;
    setHelpfulClicked(p => ({ ...p, [qaId]: true }));
    await fetch(`/api/products/qa/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: qaId }),
    });
    setQas(prev => prev.map(q => q.id === qaId ? { ...q, helpful: q.helpful + 1 } : q));
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
          <svg className="h-5 w-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Product Q&amp;A</h3>
          <p className="text-xs text-slate-500">Answered instantly by AI · {qas.length} question{qas.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full bg-violet-50 dark:bg-violet-900/20 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-xs font-medium text-violet-700 dark:text-violet-300">AI Powered</span>
        </div>
      </div>

      {/* Ask form */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <form onSubmit={handleAsk} className="flex gap-3">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask anything about this product…"
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            disabled={loading}
            maxLength={300}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Asking…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Ask AI
              </>
            )}
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-400">
          {session ? `Asking as ${session.user.name}` : 'Ask anonymously · No account needed'}
        </p>
      </div>

      {/* Q&A list */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {fetching ? (
          <div className="flex items-center justify-center py-10">
            <svg className="h-5 w-5 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : qas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <svg className="h-10 w-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">No questions yet</p>
            <p className="text-xs mt-1">Be the first to ask!</p>
          </div>
        ) : (
          qas.map(qa => (
            <div key={qa.id} className="px-6 py-5">
              {/* Question */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500">Q</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{qa.question}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {qa.askedBy !== 'Anonymous' ? qa.askedBy : 'Customer'} · {new Date(qa.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {/* Answer */}
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40 text-xs font-bold text-violet-600 dark:text-violet-400">A</div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{qa.answer}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-violet-500 font-medium flex items-center gap-1">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      AI Answer
                    </span>
                    <button
                      onClick={() => markHelpful(qa.id)}
                      disabled={helpfulClicked[qa.id]}
                      className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-50 flex items-center gap-1 transition-colors"
                    >
                      👍 Helpful {qa.helpful > 0 && `(${qa.helpful})`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
