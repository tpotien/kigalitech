import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';

function parse(val) {
  try { return typeof val === 'string' ? JSON.parse(val) : val; } catch { return []; }
}

export default function AdminProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  useEffect(() => {
    fetch('/api/admin/products').then((r) => r.json()).then((data) => { setProducts(data); setLoading(false); });
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered = products.filter((p) => {
    const matchCat = catFilter === 'All' || p.category === catFilter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  async function toggleActive(id, current) {
    await fetch(`/api/admin/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !current }) });
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, active: !current } : p)));
  }

  return (
    <AdminLayout title="Products">
      <div className="mb-6 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 w-60"
          />
          <div className="flex flex-wrap gap-1">
            {categories.map((c) => (
              <button key={c} onClick={() => setCatFilter(c)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${catFilter === c ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <Link href="/admin/products/new" className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 no-underline">
          + Add Product
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading...</div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 hidden sm:table-cell">Category</th>
                <th className="px-4 py-3 hidden md:table-cell">Colors</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3 hidden lg:table-cell">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((p) => {
                const images = parse(p.images);
                const colors = parse(p.colors);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {images[0] && <img src={images[0]} alt="" className="h-10 w-10 rounded-xl object-cover flex-shrink-0" />}
                        <div>
                          <p className="font-medium text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.brand || p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{p.category}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {colors.slice(0, 3).map((c) => (
                          <span key={c} className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600">{c}</span>
                        ))}
                        {colors.length > 3 && <span className="text-xs text-slate-400">+{colors.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      ${(p.price / 100).toFixed(2)}
                      {p.comparePrice && <p className="text-xs text-slate-400 line-through">${(p.comparePrice / 100).toFixed(2)}</p>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`font-semibold ${p.stock <= p.lowStockThreshold ? 'text-amber-600' : 'text-emerald-600'}`}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(p.id, p.active)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {p.active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/admin/products/${p.id}`} className="rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 no-underline">Edit</Link>
                        <Link href={`/products/${p.id}`} target="_blank" className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 no-underline">View</Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-16 text-center text-slate-400">No products found.</div>}
        </div>
      )}
    </AdminLayout>
  );
}
