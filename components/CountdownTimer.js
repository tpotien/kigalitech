import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCurrency } from '../context/CurrencyContext';

function getTimeLeft(target) {
  const diff = target - Date.now();
  if (diff <= 0) return { h: 0, m: 0, s: 0 };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s };
}

export default function CountdownTimer({ product, discount = 25, hours = 8, label = 'Flash Deal — Ends Soon' }) {
  const { format } = useCurrency();
  const [target] = useState(() => Date.now() + (hours || 8) * 3600000);
  const [time, setTime] = useState(getTimeLeft(target));

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const pad = (n) => String(n).padStart(2, '0');

  function parseImages(val) {
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  }
  const images = parseImages(product?.images);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-2">
          {/* Left */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-1.5 text-sm font-semibold text-red-400">
              🔥 {label}
            </span>

            <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
              {product ? product.name : 'Deal of the Day'}
            </h2>
            <p className="mt-3 text-slate-300">
              Limited time offer — grab it before the price goes back up.
            </p>

            {product && (
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-4xl font-extrabold text-white">
                  {format(Math.round(product.price * (1 - discount / 100)))}
                </span>
                <span className="text-xl text-slate-500 line-through">
                  {format(product.price)}
                </span>
                <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">
                  {discount}% OFF
                </span>
              </div>
            )}

            {/* Timer */}
            <div className="mt-6 flex items-center gap-3">
              {[
                { label: 'Hours', val: pad(time.h) },
                { label: 'Mins', val: pad(time.m) },
                { label: 'Secs', val: pad(time.s) },
              ].map(({ label, val }, i) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                      <span className="text-2xl font-extrabold text-white tabular-nums">{val}</span>
                    </div>
                    <span className="mt-1 text-xs text-slate-400">{label}</span>
                  </div>
                  {i < 2 && <span className="mb-4 text-2xl font-bold text-slate-400">:</span>}
                </div>
              ))}
            </div>

            <Link
              href={product ? `/products/${product.id}` : '/deals'}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-red-500 px-7 py-3.5 font-semibold text-white hover:bg-red-400 no-underline shadow-lg shadow-red-500/30 transition-all"
            >
              Grab the Deal
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Right — product image blended into dark card */}
          <div className="flex items-center justify-center relative min-h-[260px]">
            {images[0] ? (
              <div className="relative w-72 h-72">
                {/* Glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-52 w-52 rounded-full bg-red-500/25 blur-3xl" />
                </div>
                {/* Radial mask — fades any image into the dark background */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 46%, black 25%, transparent 80%)',
                    maskImage: 'radial-gradient(ellipse 80% 80% at 50% 46%, black 25%, transparent 80%)',
                  }}
                >
                  <img
                    src={images[0]}
                    alt="Deal product"
                    className="h-full w-full object-cover object-center"
                  />
                </div>
                {/* Badge */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-full bg-red-500 px-4 py-1.5 text-sm font-bold text-white shadow-lg">
                  🔥 Today Only
                </div>
              </div>
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-3xl bg-white/10 text-6xl">
                ⚡
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
