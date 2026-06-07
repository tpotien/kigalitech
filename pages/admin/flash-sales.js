import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getToken } from 'next-auth/jwt';

export async function getServerSideProps(context) {
  const token = await getToken({ req: context.req });
  if (!token || !['admin', 'staff'].includes(token.role)) {
    return { redirect: { destination: '/signin', permanent: false } };
  }
  return { props: {} };
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function timeRemaining(end) {
  if (!end) return null;
  const diff = new Date(end).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

export default function FlashSalesAdmin() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [discountPct, setDiscountPct] = useState(20);
  const [hoursLeft, setHoursLeft] = useState(24);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    const r = await fetch('/api/products?limit=200');
    const data = await r.json();
    const all = Array.isArray(data) ? data : (data.products || []);
    setProducts(all.filter(p => p.flashSalePrice || p.flashSaleEnd));
  }

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    setSearching(true);
    fetch(`/api/products?search=${encodeURIComponent(search)}&limit=10`)
      .then(r => r.json())
      .then(data => {
        setSearchResults(Array.isArray(data) ? data : (data.products || []));
      })
      .finally(() => setSearching(false));
  }, [search]);

  async function handleSetSale(e) {
    e.preventDefault();
    if (!selectedProduct) return setMsg('Please select a product first.');
    setSaving(true);
    setMsg('');
    try {
      const r = await fetch('/api/admin/flash-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProduct.id, discountPct, hoursLeft }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      setMsg(`Flash sale set on "${selectedProduct.name}" — ${discountPct}% off for ${hoursLeft}h`);
      setSelectedProduct(null);
      setSearch('');
      setSearchResults([]);
      loadProducts();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleClear(productId, productName) {
    if (!confirm(`Clear flash sale on "${productName}"?`)) return;
    const r = await fetch('/api/admin/flash-sale', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    if (r.ok) {
      setMsg(`Flash sale cleared for "${productName}"`);
      loadProducts();
    }
  }

  return (
    <AdminLayout title="Flash Sales">
      <div className="max-w-4xl space-y-8">

        {/* Set Flash Sale Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-5">Create Flash Sale</h2>

          <form onSubmit={handleSetSale} className="space-y-5">
            {/* Product search */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Product</label>
              {selectedProduct ? (
                <div className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-sm">{selectedProduct.name}</p>
                    <p className="text-xs text-slate-500">Current price: ${(selectedProduct.price / 100).toFixed(2)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedProduct(null); setSearch(''); }}
                    className="text-xs text-slate-400 hover:text-red-500"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search product by name…"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 rounded-xl border border-slate-100 bg-white shadow-xl max-h-60 overflow-auto">
                      {searchResults.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { setSelectedProduct(p); setSearch(''); setSearchResults([]); }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-sky-50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                            <p className="text-xs text-slate-400">${(p.price / 100).toFixed(2)} · {p.category}</p>
                          </div>
                          {p.flashSalePrice && (
                            <span className="rounded-full bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5">Sale active</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {searching && (
                    <p className="mt-1.5 text-xs text-slate-400">Searching…</p>
                  )}
                </div>
              )}
            </div>

            {/* Discount % and hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Discount %</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={discountPct}
                  onChange={e => setDiscountPct(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Duration (hours)</label>
                <input
                  type="number"
                  min="1"
                  max="720"
                  value={hoursLeft}
                  onChange={e => setHoursLeft(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            {/* Preview */}
            {selectedProduct && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm">
                <p className="font-semibold text-amber-800">Preview</p>
                <p className="text-amber-700 mt-0.5">
                  Original: <span className="line-through">${(selectedProduct.price / 100).toFixed(2)}</span>
                  {' → '}
                  Sale price: <span className="font-bold">${((selectedProduct.price * (1 - discountPct / 100)) / 100).toFixed(2)}</span>
                  {' — '}Ends in {hoursLeft}h
                </p>
              </div>
            )}

            {msg && (
              <p className={`text-sm font-medium rounded-lg px-4 py-2 ${msg.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                {msg}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || !selectedProduct}
              className="rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-6 py-2.5 text-sm transition-colors"
            >
              {saving ? 'Setting…' : 'Set Flash Sale'}
            </button>
          </form>
        </div>

        {/* Active Flash Sales */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Active Flash Sales</h2>
            <button onClick={loadProducts} className="text-xs text-slate-400 hover:text-sky-600 transition-colors">Refresh</button>
          </div>

          {products.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              <p className="text-4xl mb-3">⚡</p>
              <p className="text-sm">No active flash sales</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Original</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sale Price</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ends</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Remaining</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map(p => {
                  const remaining = timeRemaining(p.flashSaleEnd);
                  const expired = remaining === 'Expired';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800">{p.name}</td>
                      <td className="px-6 py-4 text-slate-500">${(p.price / 100).toFixed(2)}</td>
                      <td className="px-6 py-4 font-bold text-orange-600">${(p.flashSalePrice / 100).toFixed(2)}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(p.flashSaleEnd)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          expired ? 'bg-slate-100 text-slate-500' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {remaining || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleClear(p.id, p.name)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold"
                        >
                          Clear
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
