import { useState, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Link from 'next/link';

const TEMPLATE_HEADERS = 'name,category,brand,description,price,comparePrice,stock,sku,featured';
const TEMPLATE_CSV = TEMPLATE_HEADERS + '\nSamsung Galaxy A56,Phones,Samsung,Affordable mid-range Android phone,299.99,349.99,20,SKU-001,false\nJBL Charge 6,Audio,JBL,Portable Bluetooth speaker,149.99,,15,SKU-002,true';

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    // Simple CSV parse (handles quoted fields)
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      } else if (line[i] === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += line[i];
      }
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  }).filter(row => row.name);
}

export default function AdminImport() {
  const [csvText, setCsvText] = useState('');
  const [rows, setRows] = useState([]);
  const [parsed, setParsed] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      setCsvText(text);
      const parsed = parseCSV(text);
      setRows(parsed);
      setParsed(true);
      setResult(null);
      setError('');
    };
    reader.readAsText(file);
  }

  function handleTextChange(e) {
    const text = e.target.value;
    setCsvText(text);
    if (text.trim()) {
      const parsed = parseCSV(text);
      setRows(parsed);
      setParsed(true);
    } else {
      setRows([]);
      setParsed(false);
    }
    setResult(null);
    setError('');
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    if (!rows.length) { setError('No valid rows to import.'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/admin/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const templateDataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE_CSV)}`;

  return (
    <AdminLayout title="Import Products">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">CSV Bulk Import</h1>
            <p className="text-slate-500 mt-1 text-sm">Import products from a CSV file</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={templateDataUri}
              download="kigalitech-import-template.csv"
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 no-underline transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Template
            </a>
            <Link href="/admin/products" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 no-underline">
              ← Products
            </Link>
          </div>
        </div>

        {/* CSV columns hint */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 px-5 py-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">CSV Columns</p>
          <p className="font-mono text-xs text-slate-600 break-all">{TEMPLATE_HEADERS}</p>
          <p className="text-xs text-slate-400 mt-2">Required: <code className="bg-white border border-slate-200 rounded px-1">name</code>, <code className="bg-white border border-slate-200 rounded px-1">category</code>, <code className="bg-white border border-slate-200 rounded px-1">price</code>. All others optional.</p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-colors ${
            dragOver ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-slate-50 hover:border-sky-300 hover:bg-sky-50'
          }`}
        >
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
          <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600">Drag &amp; drop a CSV file here</p>
            <p className="text-xs text-slate-400 mt-1">or click to browse</p>
          </div>
        </div>

        {/* Paste area */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Or paste CSV content</label>
          <textarea
            rows={5}
            value={csvText}
            onChange={handleTextChange}
            placeholder={TEMPLATE_CSV}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-y"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Result */}
        {result && (
          <div className="rounded-2xl border p-5 space-y-3 bg-white border-slate-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <span className="text-xl">✓</span>
                <span>{result.imported} imported</span>
              </div>
              {result.errors > 0 && (
                <div className="flex items-center gap-2 text-red-600 font-semibold">
                  <span className="text-xl">✗</span>
                  <span>{result.errors} errors</span>
                </div>
              )}
            </div>
            {result.results?.filter(r => !r.ok).length > 0 && (
              <div className="space-y-1">
                {result.results.filter(r => !r.ok).map((r, i) => (
                  <p key={i} className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5">
                    <span className="font-semibold">{r.name || 'Row'}</span>: {r.error}
                  </p>
                ))}
              </div>
            )}
            <Link href="/admin/products" className="inline-block text-sm text-sky-600 hover:underline no-underline font-medium">
              View all products →
            </Link>
          </div>
        )}

        {/* Preview table */}
        {parsed && rows.length > 0 && !result && (
          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Preview</h2>
                <p className="text-sm text-slate-400 mt-0.5">Showing first 5 of {rows.length} row{rows.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={handleImport}
                disabled={loading}
                className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-all"
              >
                {loading ? 'Importing…' : `Import ${rows.length} Product${rows.length !== 1 ? 's' : ''}`}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Name', 'Category', 'Brand', 'Price', 'Stock'].map(h => (
                      <th key={h} className="py-2 px-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[200px] truncate">{row.name || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-500">{row.category || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-500">{row.brand || '—'}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{row.price ? `$${parseFloat(row.price).toFixed(2)}` : '—'}</td>
                      <td className="py-2.5 px-3 text-slate-500">{row.stock || '0'}</td>
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
