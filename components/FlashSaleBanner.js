import { useState, useEffect } from 'react';
import Link from 'next/link';

function useCountdown(endDate) {
  const calcTimeLeft = () => {
    if (!endDate) return null;
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      mins: Math.floor((diff / 1000 / 60) % 60),
      secs: Math.floor((diff / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calcTimeLeft);

  useEffect(() => {
    if (!endDate) return;
    const id = setInterval(() => {
      const t = calcTimeLeft();
      setTimeLeft(t);
      if (t && t.days === 0 && t.hours === 0 && t.mins === 0 && t.secs === 0) {
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return timeLeft;
}

function Pad({ n }) {
  return <span>{String(n).padStart(2, '0')}</span>;
}

export default function FlashSaleBanner() {
  const [sale, setSale] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('flashSaleDismissed') === '1') {
        setDismissed(true);
        setLoading(false);
        return;
      }
    }
    fetch('/api/flash-sale-active')
      .then(r => r.json())
      .then(data => {
        if (data.active && data.product) {
          setSale(data.product);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const timeLeft = useCountdown(sale?.flashSaleEnd);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('flashSaleDismissed', '1');
    }
  };

  if (loading || dismissed || !sale || !timeLeft) return null;

  const expired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.mins === 0 && timeLeft.secs === 0;
  if (expired) return null;

  const savePct = sale.price > 0
    ? Math.round(((sale.price - sale.flashSalePrice) / sale.price) * 100)
    : 0;

  return (
    <div className="relative bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 dark:from-red-700 dark:via-orange-600 dark:to-amber-600 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3">

          {/* Left: Flash icon + label */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xl animate-pulse">⚡</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-90">Flash Sale</p>
              <p className="text-sm font-extrabold leading-tight truncate max-w-[200px] sm:max-w-none">
                {sale.name} &mdash; Save {savePct}%
              </p>
            </div>
          </div>

          {/* Center: Countdown */}
          <div className="flex items-center gap-2 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80 hidden sm:block">Ends in</span>
            <div className="flex items-center gap-1.5">
              {timeLeft.days > 0 && (
                <>
                  <div className="flex flex-col items-center bg-white/20 rounded-lg px-2.5 py-1 min-w-[42px]">
                    <span className="text-lg font-extrabold tabular-nums leading-none"><Pad n={timeLeft.days} /></span>
                    <span className="text-[9px] uppercase tracking-wider opacity-80">days</span>
                  </div>
                  <span className="text-lg font-bold opacity-70">:</span>
                </>
              )}
              <div className="flex flex-col items-center bg-white/20 rounded-lg px-2.5 py-1 min-w-[42px]">
                <span className="text-lg font-extrabold tabular-nums leading-none"><Pad n={timeLeft.hours} /></span>
                <span className="text-[9px] uppercase tracking-wider opacity-80">hrs</span>
              </div>
              <span className="text-lg font-bold opacity-70">:</span>
              <div className="flex flex-col items-center bg-white/20 rounded-lg px-2.5 py-1 min-w-[42px]">
                <span className="text-lg font-extrabold tabular-nums leading-none"><Pad n={timeLeft.mins} /></span>
                <span className="text-[9px] uppercase tracking-wider opacity-80">min</span>
              </div>
              <span className="text-lg font-bold opacity-70">:</span>
              <div className="flex flex-col items-center bg-white/20 rounded-lg px-2.5 py-1 min-w-[42px]">
                <span className="text-lg font-extrabold tabular-nums leading-none"><Pad n={timeLeft.secs} /></span>
                <span className="text-[9px] uppercase tracking-wider opacity-80">sec</span>
              </div>
            </div>
          </div>

          {/* Right: CTA + dismiss */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/deals"
              className="rounded-full bg-white text-orange-600 px-4 py-1.5 text-sm font-extrabold no-underline hover:bg-orange-50 transition-colors shadow-md"
            >
              Shop Deals
            </Link>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss flash sale banner"
              className="opacity-70 hover:opacity-100 transition-opacity p-1"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
