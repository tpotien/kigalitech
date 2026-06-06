import { useState, useRef } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import Link from 'next/link';

const EXAMPLE_CSV = `name,description,brand,category,price,comparePrice,stock,lowStockThreshold,featured,images,colors,storageOptions,tags
iPhone 17 Pro,The latest flagship from Apple,Apple,Phones,1099.99,1199.99,50,5,true,https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400,Titanium|Black|White,128GB|256GB|512GB,flagship|5g|apple
Samsung Galaxy S26,Next-gen Android flagship,Samsung,Phones,999.99,,30,5,false,https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400,Phantom Black|Cream,256GB|512GB,android|flagship|samsung`;

const COLUMN_DOCS = [
  { col: 'name*', desc: 'Product name (required)' },
  { col: 'category*', desc: 'Category (required): Phones, Laptops, etc.' },
  { col: 'price*', desc: 'Price in USD, e.g. 999.99 (required)' },
  { col: 'comparePrice', desc: 'Original/compare price in USD' },
  { col: 'description', desc: 'Product description' },
  { col: 'brand', desc: 'Brand name' },
  { col: 'stock', desc: 'Stock quantity (default: 0)' },
  { col: 'featured', desc: 'true/false (default: false)' },
  { col: 'images', desc: 'URLs separated by | pipe' },
  { col: 'colors', desc: 'Color names separated by | pipe' },
  { col: 'storageOptions', desc: 'Storage options separated by | pipe' },
  { col: 'tags', desc: 'Tags separated by | pipe' },
];

export default function ImportProducts() {
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsv(ev.target.result);
    reader.readAsText(file);
  }

  async function handlePreview() {
    setError(''); setResult(null);
    setLoading(true);
    const r = await fetch('/api/admin/products/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv, preview: true }),
    });
    const data = await r.json();
    setLoading(false);
    if (!r.ok) { setError(data.error || 'Preview failed'); return; }
    setPreview(data);
  }

  async function handleImport() {
    setError('');
    setLoading(true);
    const r = await fetch('/api/admin/products/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv }),
    });
    const data = await r.json();
    setLoading(false);
    if (!r.ok) { setError(data.error || 'Import failed'); return; }
    setResult(data);
    setPreview(null);
    setCsv('');
  }

  return (
    <AdminLayout title="Import Products">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Bulk CSV Import</h1>
            <p className="text-slate-500 mt-1">Import multiple products at once from a CSV file</p>
          </div>
          <Link href="/admin/products" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 no-underline hover:bg-slate-50">
            ← Products
          </Link>
        </div>

        {/* Success */}
        {result && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 flex items-center gap-4">
            <div className="h-12 w-12 flex-shrink-0 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="font-bold text-emerald-900">Import successful!</p>
              <p className="text-emerald-700 text-sm mt-0.5">{result.count} product{result.count !== 1 ? 's' : ''} imported successfully.</p>
              <Link href="/admin/products" className="text-sm font-medium text-emerald-700 no-underline underline mt-1 inline-block">View all products →</Link>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error}</div>
        )}

        {/* Column reference */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 mb-4">CSV Column Reference</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {COLUMN_DOCS.map(({ col, desc }) => (
              <div key={col} className="flex items-start gap-2 text-sm">
                <code className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 flex-shrink-0 mt-0.5">{col}</code>
                <span className="text-slate-500">{desc}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              const blob = new Blob([EXAMPLE_CSV], { type: 'text/csv' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
              a.download = 'kigalitech-products-template.csv'; a.click();
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Template CSV
          </button>
        </div>

        {/* Upload area */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-5">
          <h2 className="font-bold text-slate-900">Upload CSV File</h2>

          {/* Dropzone */}
          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 cursor-pointer hover:border-sky-300 hover:bg-sky-50 transition-colors"
          >
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
            <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium text-slate-600">Click to select a CSV file</p>
            <p className="text-xs text-slate-400">or paste CSV text below</p>
          </div>

          {/* Textarea for paste */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">CSV Content</label>
            <textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={8}
              placeholder={EXAMPLE_CSV}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-y"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePreview}
              disabled={!csv || loading}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading…' : 'Preview Import'}
            </button>
            {preview && (
              <button
                onClick={handleImport}
                disabled={loading}
                className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Importing…' : `Import ${preview.count} Product${preview.count !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        </div>

        {/* Preview table */}
        {preview && (
          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <h2 className="font-bold text-slate-900 mb-1">Preview — First 5 Rows</h2>
            <p className="text-sm text-slate-400 mb-4">{preview.count} total rows detected</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Name', 'Category', 'Brand', 'Price', 'Stock', 'Featured'].map(h => (
                      <th key={h} className="py-2 px-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {preview.products.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[200px] truncate">{p.name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{p.category}</td>
                      <td className="py-2.5 px-3 text-slate-500">{p.brand || '—'}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">${(p.price / 100).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-slate-500">{p.stock}</td>
                      <td className="py-2.5 px-3">
                        {p.featured ? (
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">YES</span>
                        ) : (
                          <span className="text-slate-300 text-xs">no</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
