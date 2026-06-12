import { useState, useRef, useEffect } from 'react';

const SUGGESTIONS = [
  'Best phone under RWF 300,000?',
  'Do you have Samsung phones?',
  'What laptops are available?',
  'How do I pay with MoMo?',
];

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! 👋 I\'m KigaliTech\'s AI assistant. Ask me anything — products, prices, delivery, or payments!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text) {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');

    const updated = [...messages, { role: 'user', content: userMsg }];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      const reply = data.reply || 'Sorry, I\'m having trouble. Please WhatsApp us at +250 786 276 555. 😊';
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, I\'m having trouble. Please WhatsApp us at +250 786 276 555. 😊' }]);
    }
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className="fixed bottom-[12rem] right-2 left-2 sm:left-auto sm:right-6 sm:w-[380px] z-50 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
          style={{ maxHeight: '65vh' }}>
          {/* Header */}
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 px-5 pt-5 pb-4">
            {/* Close button */}
            <button onClick={() => setOpen(false)} className="absolute top-3 right-3 text-slate-400 hover:text-white transition p-1 z-10">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            {/* Logo fills the brand space */}
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center shadow-lg overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="KigaliTech"
                    className="h-full w-full object-cover"
                    onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML='<span style="font-size:22px;font-weight:900;color:#0284c7">KT</span>'; }}
                  />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </div>
              <div>
                <p className="text-base font-extrabold text-white tracking-tight">KigaliTech AI</p>
                <p className="text-xs text-sky-300 mt-0.5">Ask me anything about our products</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-medium">Online now</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: 0 }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-full bg-white border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 overflow-hidden">
                    <img src="/logo.png" alt="KT" className="h-full w-full object-cover"
                      onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML='<span style="font-size:10px;font-weight:700;color:#0284c7">KT</span>'; }} />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-sky-600 text-white rounded-br-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="h-7 w-7 rounded-full bg-white border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 mr-2 overflow-hidden">
                  <img src="/logo.png" alt="KT" className="h-full w-full object-cover" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                  {[0,1,2].map(i => (
                    <span key={i} className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (only before first user message) */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="rounded-full border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 px-3 py-1 text-xs text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-3 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about products, prices, delivery…"
              className="flex-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="h-9 w-9 flex-shrink-0 rounded-full bg-sky-600 flex items-center justify-center text-white hover:bg-sky-700 disabled:opacity-40 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Mobile: small icon only. Desktop: pill with logo + label */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-36 right-4 sm:bottom-24 sm:right-6 z-50 opacity-60 hover:opacity-100 transition-all active:scale-95 hover:scale-105"
        aria-label="AI Chat"
      >
        {/* Mobile button — small round logo */}
        <div className="flex sm:hidden items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-slate-900 to-sky-700 shadow-md border border-sky-400/40 relative">
          <img
            src="/logo.png"
            alt="AI"
            className="h-4 w-4 rounded-full object-cover"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
          <span className="hidden text-white text-xs font-bold">AI</span>
          {unread > 0 && !open && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold flex items-center justify-center border border-white">
              {unread}
            </span>
          )}
        </div>
        {/* Desktop button — pill with logo + label */}
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-gradient-to-r from-slate-900 to-sky-700 text-white shadow-lg pl-1 pr-3 py-1 relative">
          <img
            src="/logo.png"
            alt="KigaliTech AI"
            className="h-7 w-7 rounded-full object-cover flex-shrink-0 border border-sky-400/50"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div className="text-left leading-tight">
            <p className="text-[10px] font-semibold text-sky-300 uppercase tracking-widest">AI Chat</p>
            <p className="text-xs font-bold text-white">Ask KigaliTech</p>
          </div>
          {unread > 0 && !open && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center border-2 border-white">
              {unread}
            </span>
          )}
        </div>
      </button>
    </>
  );
}
