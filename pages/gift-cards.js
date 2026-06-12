import { useState } from 'react';
import Layout from '../components/Layout';
import Head from 'next/head';

export default function GiftCards() {
  const [tab, setTab] = useState('buy');
  const [amount, setAmount] = useState(1000000); // 10,000 RWF in cents
  const [customAmount, setCustomAmount] = useState('');
  const [form, setForm] = useState({ buyerName: '', buyerEmail: '', toName: '', toEmail: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [checkCode, setCheckCode] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const presets = [
    { label: 'RWF 5,000', value: 500000 },
    { label: 'RWF 10,000', value: 1000000 },
    { label: 'RWF 20,000', value: 2000000 },
    { label: 'RWF 50,000', value: 5000000 },
  ];

  async function handleBuy(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const finalAmount = customAmount ? Math.round(Number(customAmount) * 100) : amount;
    const res = await fetch('/api/gift-cards/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: finalAmount, ...form }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setCard(data); setLoading(false);
  }

  async function handleCheck(e) {
    e.preventDefault();
    setChecking(true); setCheckResult(null);
    const res = await fetch(`/api/gift-cards/check?code=${encodeURIComponent(checkCode.trim().toUpperCase())}`);
    const data = await res.json();
    setCheckResult(res.ok ? data : { error: data.error });
    setChecking(false);
  }

  function copyCode() {
    navigator.clipboard.writeText(card.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Layout title="Gift Cards">
      <Head><title>Gift Cards | KigaliTech</title></Head>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">🎁</span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">Gift Cards</h1>
          <p className="text-slate-500">Give the gift of tech. Valid for 1 year.</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 mb-8">
          {['buy', 'check'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${tab === t ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>
              {t === 'buy' ? '🛒 Buy a Gift Card' : '🔍 Check Balance'}
            </button>
          ))}
        </div>

        {tab === 'buy' ? (
          card ? (
            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700 p-8 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-1">Gift Card Created!</h2>
              <p className="text-slate-500 text-sm mb-6">Share this code with the recipient</p>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-700 p-6 mb-4">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Gift Card Code</p>
                <p className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100 tracking-widest">{card.code}</p>
                <p className="text-sm text-emerald-600 font-semibold mt-2">Balance: RWF {(card.balance / 100).toLocaleString()}</p>
              </div>
              <button onClick={copyCode} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-2.5 text-sm transition-colors">
                {copied ? '✓ Copied!' : 'Copy Code'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleBuy} className="space-y-5">
              {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Amount</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {presets.map(p => (
                    <button key={p.value} type="button" onClick={() => { setAmount(p.value); setCustomAmount(''); }}
                      className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${!customAmount && amount === p.value ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <input type="number" placeholder="Custom amount (RWF)" value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Your Name *</label>
                  <input required value={form.buyerName} onChange={e => setForm({...form, buyerName: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Your Email *</label>
                  <input required type="email" value={form.buyerEmail} onChange={e => setForm({...form, buyerEmail: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Recipient Name</label>
                  <input value={form.toName} onChange={e => setForm({...form, toName: e.target.value})}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Recipient Email</label>
                  <input type="email" value={form.toEmail} onChange={e => setForm({...form, toEmail: e.target.value})}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Personal Message</label>
                <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={2}
                  placeholder="Happy birthday! Enjoy shopping at KigaliTech 🎉"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold py-3 text-sm transition-colors">
                {loading ? 'Creating…' : `Purchase Gift Card · RWF ${((customAmount ? Number(customAmount) : amount / 100)).toLocaleString()}`}
              </button>
            </form>
          )
        ) : (
          <div>
            <form onSubmit={handleCheck} className="flex gap-3 mb-6">
              <input value={checkCode} onChange={e => setCheckCode(e.target.value.toUpperCase())} placeholder="KT-XXXX-XXXX"
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500" />
              <button type="submit" disabled={checking || !checkCode} className="rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 text-sm transition-colors">
                {checking ? '…' : 'Check'}
              </button>
            </form>
            {checkResult && (
              checkResult.error ? (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-600">{checkResult.error}</div>
              ) : (
                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-6 text-center">
                  <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mb-1">RWF {(checkResult.balance / 100).toLocaleString()}</p>
                  <p className="text-sm text-slate-500">remaining balance</p>
                  {checkResult.expiresAt && <p className="text-xs text-slate-400 mt-2">Expires: {new Date(checkResult.expiresAt).toLocaleDateString()}</p>}
                  {checkResult.balance === 0 && <p className="text-sm text-red-500 font-semibold mt-2">This card has been fully redeemed</p>}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
