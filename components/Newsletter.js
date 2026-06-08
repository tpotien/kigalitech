import { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail('');
    }
  }

  return (
    <section className="bg-gradient-to-br from-sky-600 to-indigo-700 py-16">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <span className="text-3xl">📬</span>
        <h2 className="mt-4 text-3xl font-extrabold text-white">Get deals in your inbox</h2>
        <p className="mt-3 text-sky-100">
          Subscribe and be the first to know about flash sales, new arrivals, and exclusive member-only discounts.
        </p>

        {submitted ? (
          <div className="mt-8 rounded-2xl bg-white/20 py-5 px-8 backdrop-blur-sm">
            <p className="text-lg font-bold text-white">🎉 You're in! Deals incoming.</p>
            <p className="mt-1 text-sm text-sky-100">Check your email to confirm your subscription.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              placeholder="Enter your email address"
              className="w-full rounded-full border-0 bg-white/20 px-6 py-3.5 text-white placeholder-sky-200 backdrop-blur-sm focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 sm:w-80"
            />
            <button
              type="submit"
              className="rounded-full bg-white px-7 py-3.5 font-semibold text-sky-700 hover:bg-sky-50 transition-colors shadow-lg"
            >
              Subscribe
            </button>
          </form>
        )}

        <p className="mt-4 text-xs text-sky-200">No spam, ever. Unsubscribe any time.</p>
      </div>
    </section>
  );
}
