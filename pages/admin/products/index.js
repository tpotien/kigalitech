import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';

function parse(val) {
  try { return typeof val === 'string' ? JSON.parse(val) : val; } catch { return []; }
}

function StockCell({ product, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(product.stock);

  async function save() {
    setEditing(false);
    if (Number(val) === product.stock) return;
    await fetch(`/api/admin/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: Number(val) }),
    });
    onUpdate(product.id, Number(val));
  }

  if (editing) {
    return (
      <input
        type="number" min="0" value={val} autoFocus
        onChange={e => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
        className="w-16 rounded-lg border border-sky-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-sky-100"
      />
    );
  }
  return (
    <button onClick={() => setEditing(true)} title="Click to edit stock"
      className={`font-semibold hover:underline ${product.stock <= (product.lowStockThreshold || 5) ? 'text-amber-600' : 'text-emerald-600'}`}>
      {product.stock}
    </button>
  );
}

export default function AdminProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  useEffect(() => {
    fetch('/api/admin/products').then((r) => r.json()).then((data) => { setProducts(Array.isArray(data) ? data : []); setLoading(false); });
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

  async function deleteProduct(id, name) {
    if (!confirm(`Delete "${name}"?\n\nThis hides the product from the store. It can be restored by editing the product.`)) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  async function hardDelete(id, name) {
    if (!confirm(`PERMANENTLY delete "${name}"?\n\nThis cannot be undone and will remove all data for this product.`)) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hard: true }) });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  async function duplicateProduct(id, name) {
    if (!confirm(`Duplicate "${name}"?\n\nA hidden copy will be created with stock set to 0.`)) return;
    const res = await fetch(`/api/admin/products/${id}?action=duplicate`, { method: 'POST' });
    const dup = await res.json();
    if (dup.id) {
      setProducts(prev => [dup, ...prev]);
    }
  }

  async function activateAllHidden() {
    const hidden = products.filter(p => !p.active);
    if (!hidden.length) return alert('No hidden products.');
    if (!confirm(`Activate all ${hidden.length} hidden product(s)?`)) return;
    await fetch('/api/admin/products?action=activate_all', { method: 'POST' });
    setProducts(prev => prev.map(p => ({ ...p, active: true })));
  }

  function exportCSV() {
    const headers = ['ID', 'Name', 'Brand', 'Category', 'Price (RWF)', 'Stock', 'Active', 'Featured'];
    const rows = filtered.map(p => [
      p.id, p.name || '', p.brand || '', p.category || '',
      p.price ?? '', p.stock ?? '',
      p.active ? 'Yes' : 'No',
      p.featured ? 'Yes' : 'No',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `products-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
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
        <div className="flex gap-2">
          <button onClick={exportCSV} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            ↓ Export CSV
          </button>
          {products.some(p => !p.active) && (
            <button onClick={activateAllHidden} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              Activate All Hidden ({products.filter(p => !p.active).length})
            </button>
          )}
          <Link href="/admin/products/new" className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 no-underline">
            + Add Product
          </Link>
        </div>
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
                      RWF {Math.round(p.price).toLocaleString()}
                      {p.comparePrice && <p className="text-xs text-slate-400 line-through">RWF {Math.round(p.comparePrice).toLocaleString()}</p>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <StockCell product={p} onUpdate={(id, stock) => setProducts(prev => prev.map(x => x.id === id ? { ...x, stock } : x))} />
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
                      <div className="flex gap-2 flex-wrap">
                        <Link href={`/admin/products/${p.id}`} className="rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 no-underline">Edit</Link>
                        <Link href={`/products/${p.id}`} target="_blank" className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 no-underline">View</Link>
                        <button onClick={() => duplicateProduct(p.id, p.name)} className="rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100">Copy</button>
                        <button onClick={() => deleteProduct(p.id, p.name)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100">Delete</button>
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
