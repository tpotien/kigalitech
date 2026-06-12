import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';

function rwfToUsdCents(rwf) { return Math.round(Number(rwf)); }
function usdCentsToRwf(cents) { return String(Math.round(cents)); }

const CATEGORIES = [
  'Phones', 'Laptops', 'TVs', 'Audio', 'Wearables',
  'Gaming', 'Tablets', 'Cameras', 'Accessories', 'Smart Home',
];

// Defined outside component so React never recreates them on re-render
function Section({ title, children }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, help, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      {help && <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{help}</p>}
      {children}
    </div>
  );
}

function parse(val, fallback = []) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'object' && val !== null) return val;
  try {
    const p = JSON.parse(val);
    // JSON.parse(null) returns null without throwing — always fall back in that case
    if (p === null || p === undefined) return fallback;
    return p;
  } catch { return fallback; }
}

function parseStorageItems(val, storagePriceVal) {
  const arr = parse(val, []);
  if (!Array.isArray(arr)) return [];
  let priceMap = {};
  try { priceMap = JSON.parse(storagePriceVal || '{}'); } catch {}
  return arr.map(item => {
    if (typeof item === 'string') {
      const rwf = priceMap[item] ? String(Math.round(priceMap[item])) : '';
      return { value: item, priceRwf: rwf, available: true };
    }
    return { value: item.value || '', priceRwf: item.priceRwf != null ? String(item.priceRwf) : '', available: item.available !== false };
  });
}

export default function ProductForm({ initial }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [selectedImgIndexes, setSelectedImgIndexes] = useState(new Set());
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanPreview, setScanPreview] = useState(null);
  const [nameWarning, setNameWarning] = useState('');
  const [storageItems, setStorageItems] = useState(() => parseStorageItems(initial?.storageOptions, initial?.storagePrice));
  const [newStorageVal, setNewStorageVal] = useState('');
  const [bundleSearch, setBundleSearch] = useState('');
  const [bundleResults, setBundleResults] = useState([]);
  const fileRef = useRef();
  const scanRef = useRef();

  useEffect(() => {
    if (!bundleSearch.trim()) { setBundleResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/admin/products?search=${encodeURIComponent(bundleSearch)}`);
        const d = await r.json();
        setBundleResults((d.products || d || []).slice(0, 6));
      } catch { setBundleResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [bundleSearch]);

  const [form, setForm] = useState({
    name: initial?.name || '',
    category: initial?.category || 'Phones',
    brand: initial?.brand || '',
    sku: initial?.sku || '',
    description: initial?.description || '',
    price: initial?.price ? usdCentsToRwf(initial.price) : '',
    comparePrice: initial?.comparePrice ? usdCentsToRwf(initial.comparePrice) : '',
    stock: initial?.stock ?? '',
    lowStockThreshold: initial?.lowStockThreshold ?? 5,
    weight: initial?.weight || '',
    dimensions: initial?.dimensions || '',
    featured: initial?.featured ?? false,
    active: initial?.active ?? true,
    images: parse(initial?.images, []).join('\n'),
    colors: parse(initial?.colors, []).join(', '),
    warrantyOptions: parse(initial?.warrantyOptions, []).join(', '),
    specs: typeof initial?.specs === 'string' ? initial.specs : JSON.stringify(parse(initial?.specs, {}) || {}, null, 2),
    serialNumbers: parse(initial?.serialNumbers, []).join(', '),
    tags: parse(initial?.tags, []).join(', '),
    bundledWith: (() => {
      try {
        const val = initial?.bundledWith;
        if (!val) return '[]';
        const parsed = typeof val === 'string' ? JSON.parse(val) : val;
        // Normalise: if it's an array of numbers/strings, convert to object array
        if (Array.isArray(parsed)) {
          return JSON.stringify(parsed.map(b =>
            typeof b === 'object' ? b : { productId: Number(b), discount: 10 }
          ));
        }
        return '[]';
      } catch { return '[]'; }
    })(),
    preOrder: initial?.preOrder ?? false,
    preOrderDate: initial?.preOrderDate
      ? new Date(initial.preOrderDate).toISOString().split('T')[0]
      : '',
    preOrderDeposit: initial?.preOrderDeposit ?? 0,
    preOrderDepositRwf: initial?.preOrderDeposit ? initial.preOrderDeposit.toString() : '',
    colorImages: (() => {
      try {
        const v = initial?.colorImages;
        if (!v) return '{}';
        return typeof v === 'string' ? v : JSON.stringify(v);
      } catch { return '{}'; }
    })(),
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function runAiFill(name, category) {
    if (!name?.trim()) return;
    setAiLoading(true);
    setAiStatus('Auto-filling product details…');
    setError('');
    try {
      const res = await fetch('/api/admin/ai-fill-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fill failed');

      setForm((f) => ({
        ...f,
        description: data.description || f.description,
        brand: data.brand || f.brand,
        weight: data.weight || f.weight,
        dimensions: data.dimensions || f.dimensions,
        colors: Array.isArray(data.colors) ? data.colors.join(', ') : f.colors,
        storageOptions: Array.isArray(data.storageOptions) ? data.storageOptions.join(', ') : f.storageOptions,
        warrantyOptions: Array.isArray(data.warrantyOptions) ? data.warrantyOptions.join(', ') : f.warrantyOptions,
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : f.tags,
        specs: data.specs ? JSON.stringify(data.specs, null, 2) : f.specs,
        price: data.suggestedPrice && !f.price ? usdCentsToRwf(data.suggestedPrice) : f.price,
        ...(Array.isArray(data.storageOptions) && data.storageOptions.length ? {} : {}),
      }));
      if (Array.isArray(data.storageOptions) && data.storageOptions.length) {
        setStorageItems(parseStorageItems(JSON.stringify(data.storageOptions)));
      }
      const src = data._source?.startsWith('gemini') ? '✨ Gemini AI' : data._source === 'groq' ? '✨ Groq AI' : data._source === 'claude' ? '✨ Claude AI' : '⚡ Smart Fill';
      setAiStatus(`${src} — filled! Review and adjust before saving.`);
      setTimeout(() => setAiStatus(''), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  }

  function handleAiFill() { runAiFill(form.name, form.category); }

  function handleScanPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      // Resize to max 1024px before sending to keep API fast
      const img = new window.Image();
      img.onload = async () => {
        const MAX = 1024;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setScanPreview(dataUrl);
        setScanning(true);
        setAiStatus('Scanning product image…');
        setError('');
        try {
          const res = await fetch('/api/admin/ai-scan-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageDataUrl: dataUrl }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Scan failed');
          setForm((f) => ({
            ...f,
            name: data.name || f.name,
            category: data.category || f.category,
            description: data.description || f.description,
            brand: data.brand || f.brand,
            weight: data.weight || f.weight,
            dimensions: data.dimensions || f.dimensions,
            colors: Array.isArray(data.colors) ? data.colors.join(', ') : f.colors,
            storageOptions: Array.isArray(data.storageOptions) ? data.storageOptions.join(', ') : f.storageOptions,
            warrantyOptions: Array.isArray(data.warrantyOptions) ? data.warrantyOptions.join(', ') : f.warrantyOptions,
            tags: Array.isArray(data.tags) ? data.tags.join(', ') : f.tags,
            specs: data.specs ? JSON.stringify(data.specs, null, 2) : f.specs,
            price: data.suggestedPrice && !f.price ? usdCentsToRwf(data.suggestedPrice) : f.price,
            images: f.images ? f.images : dataUrl,
          }));
          setAiStatus('📷 Product scanned — review all fields before saving.');
          setTimeout(() => setAiStatus(''), 6000);
        } catch (err) {
          setError(err.message);
          setAiStatus('');
        } finally {
          setScanning(false);
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  }

  function handleNameChange(e) {
    const raw = e.target.value;
    // Strip emojis and special characters in real-time
    const cleaned = raw
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
      .replace(/[\u{2600}-\u{27BF}]/gu, '')
      .replace(/[\u{2300}-\u{23FF}]/gu, '')
      .replace(/[\u{2B00}-\u{2BFF}]/gu, '');
    if (cleaned !== raw) {
      setNameWarning('Emojis and special symbols are not allowed in product names and have been removed.');
    } else if (/[^\x20-\x7EÀ-ɏ]/.test(raw) && raw.length > 0) {
      setNameWarning('Tip: Avoid special characters — they may not translate correctly.');
    } else {
      setNameWarning('');
    }
    set('name', cleaned);
  }

  function handleNameBlur(e) {
    const name = e.target.value.trim();
    if (!name) return;
    const specsBlank = !form.specs || form.specs.trim() === '{}' || form.specs.trim() === '';
    const isEmpty = !form.description && !form.brand && !form.colors && specsBlank;
    if (isEmpty) runAiFill(name, form.category);
  }

  async function resizeAndUpload(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new window.Image();
        img.onload = async () => {
          const MAX = 1000;
          const scale = Math.min(MAX / img.width, MAX / img.height, 1);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          try {
            const res = await fetch('/api/admin/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageDataUrl: dataUrl }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            resolve(data.url);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = ev.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError('');
    e.target.value = '';
    setUploadProgress({ done: 0, total: files.length });

    const urls = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await resizeAndUpload(files[i]);
        urls.push(url);
        setUploadProgress({ done: i + 1, total: files.length });
      } catch (err) {
        setError(`File ${i + 1} failed: ${err.message}`);
      }
    }
    if (urls.length) {
      setForm(f => {
        const existing = f.images ? f.images.trim() : '';
        return { ...f, images: existing ? `${existing}\n${urls.join('\n')}` : urls.join('\n') };
      });
    }
    setUploading(false);
    setUploadProgress({ done: 0, total: 0 });
  }

  async function handleColorImageUpload(file, colorName) {
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = async () => {
        const MAX = 1000;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        try {
          const res = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageDataUrl: dataUrl }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload failed');
          setForm(f => {
            try {
              const existing = JSON.parse(f.colorImages || '{}');
              return { ...f, colorImages: JSON.stringify({ ...existing, [colorName]: data.url }) };
            } catch {
              return { ...f, colorImages: JSON.stringify({ [colorName]: data.url }) };
            }
          });
        } catch (err) {
          setError(err.message);
        } finally {
          setUploading(false);
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        category: form.category,
        brand: form.brand,
        sku: form.sku,
        description: form.description,
        price: rwfToUsdCents(form.price),
        comparePrice: form.comparePrice ? rwfToUsdCents(form.comparePrice) : null,
        stock: parseInt(form.stock, 10),
        lowStockThreshold: parseInt(form.lowStockThreshold, 10),
        weight: form.weight,
        dimensions: form.dimensions,
        featured: form.featured,
        active: form.active,
        images: form.images.split('\n').map((s) => s.trim()).filter(Boolean),
        colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
        storageOptions: storageItems.filter(s => s.value.trim()).map(s => s.value.trim()),
        storagePrice: JSON.stringify(
          Object.fromEntries(
            storageItems
              .filter(s => s.value.trim() && Number(s.priceRwf) > 0)
              .map(s => [s.value.trim(), rwfToUsdCents(s.priceRwf)])
          )
        ),
        warrantyOptions: form.warrantyOptions.split(',').map((s) => s.trim()).filter(Boolean),
        serialNumbers: form.serialNumbers.split(',').map((s) => s.trim()).filter(Boolean),
        tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
        bundledWith: (() => { try { return JSON.stringify(JSON.parse(form.bundledWith || '[]')); } catch { return '[]'; } })(),
        preOrder: form.preOrder,
        preOrderDate: form.preOrderDate ? new Date(form.preOrderDate).toISOString() : null,
        preOrderDeposit: form.preOrderDeposit || 0,
        specs: (() => { try { return JSON.parse(form.specs); } catch { return {}; } })(),
        colorImages: (() => { try { return JSON.parse(form.colorImages || '{}'); } catch { return {}; } })(),
      };

      const url = initial?.id ? `/api/admin/products/${initial.id}` : '/api/admin/products';
      const method = initial?.id ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Save failed');
      router.push('/admin/products');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const inp = 'w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900';
  const ta = `${inp} resize-none`;

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.preventDefault();
      }}
      className="space-y-6 max-w-4xl"
    >
      {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}
      {aiStatus && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
          <span className="text-base">✨</span> {aiStatus}
        </div>
      )}

      {/* AI Fill Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-50 to-sky-50 dark:from-violet-950/40 dark:to-sky-950/40 border border-violet-100 dark:border-violet-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              AI Product Assistant
              {(aiLoading || scanning) && <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="font-medium text-violet-700 dark:text-violet-400">📷 Scan a photo</span> — AI reads the product and fills everything instantly.
              Or type the name and click <span className="font-medium text-violet-700 dark:text-violet-400">AI Fill</span>. All fields can be edited manually.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Scan Photo button */}
            <button
              type="button"
              onClick={() => scanRef.current?.click()}
              disabled={scanning || aiLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              {scanning ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Scanning…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Scan Photo
                </>
              )}
            </button>
            {/* Hidden file input — camera on mobile, file picker on desktop */}
            <input
              ref={scanRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleScanPhoto}
            />
            {/* AI Fill by name */}
            <button
              type="button"
              onClick={handleAiFill}
              disabled={aiLoading || scanning || !form.name.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-violet-200 transition-all"
            >
              {aiLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Filling…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Fill
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scan preview thumbnail */}
        {scanPreview && (
          <div className="mt-3 flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-3 py-2">
            <img src={scanPreview} alt="Scanned product" className="h-12 w-12 rounded-lg object-contain border border-slate-100" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 truncate">{scanning ? 'Analysing image with AI…' : 'Scan complete — review fields below'}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">You can still edit any field manually</p>
            </div>
            <button type="button" onClick={() => setScanPreview(null)} className="text-slate-400 hover:text-slate-600 p-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        )}
      </div>

      <Section title="Basic Info">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product Name *">
            <input
              required
              value={form.name}
              onChange={(e) => handleNameChange(e)}
              onBlur={handleNameBlur}
              className={inp}
              placeholder="e.g. iPhone 17 Pro Max"
            />
            {nameWarning && (
              <p className="mt-1.5 text-xs text-amber-600 flex items-start gap-1">
                <svg className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {nameWarning}
              </p>
            )}
          </Field>
          <Field label="Category *">
            <select required value={form.category} onChange={(e) => set('category', e.target.value)} className={inp}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Brand">
            <input value={form.brand} onChange={(e) => set('brand', e.target.value)} className={inp} placeholder="e.g. Apple" />
          </Field>
          <Field label="SKU">
            <div className="flex gap-2">
              <input value={form.sku} onChange={(e) => set('sku', e.target.value)} className={`${inp} flex-1`} placeholder="e.g. APPLE-IP17PM" />
              <button type="button" onClick={() => {
                const b = form.brand.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4);
                const n = form.name.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
                const r = Math.floor(Math.random()*900+100);
                set('sku', `${b}${b&&n?'-':''}${n}-${r}`);
              }} className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 whitespace-nowrap">
                Generate
              </button>
            </div>
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Description *">
            <textarea required rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} className={ta} placeholder="Describe the product..." />
          </Field>
        </div>
      </Section>

      <Section title="Pricing & Stock">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Price (RWF) *">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">RWF</span>
              <input required type="number" step="1" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} className={`${inp} pl-12`} placeholder="0" />
            </div>
          </Field>
          <Field label="Compare Price (RWF)" help="Shown as strikethrough">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">RWF</span>
              <input type="number" step="1" min="0" value={form.comparePrice} onChange={(e) => set('comparePrice', e.target.value)} className={`${inp} pl-12`} placeholder="0" />
            </div>
          </Field>
          <Field label="Stock *">
            <input required type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} className={inp} placeholder="0" />
          </Field>
          <Field label="Low Stock Alert At">
            <input type="number" min="0" value={form.lowStockThreshold} onChange={(e) => set('lowStockThreshold', e.target.value)} className={inp} />
          </Field>
        </div>
      </Section>

      <Section title="Images">
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50"
          >
            <svg className="h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {uploading
              ? uploadProgress.total > 1
                ? `Uploading ${uploadProgress.done}/${uploadProgress.total}…`
                : 'Uploading…'
              : 'Upload Photos'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />

          {selectedImgIndexes.size > 0 && (
            <>
              <button
                type="button"
                onClick={() => {
                  const urls = form.images.split('\n').filter(u => u.trim());
                  const remaining = urls.filter((_, i) => !selectedImgIndexes.has(i));
                  set('images', remaining.join('\n'));
                  setSelectedImgIndexes(new Set());
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
              >
                🗑 Delete selected ({selectedImgIndexes.size})
              </button>
              <button
                type="button"
                onClick={() => setSelectedImgIndexes(new Set())}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline"
              >
                Deselect all
              </button>
            </>
          )}
          <span className="text-xs text-slate-400 ml-auto">Select photos to delete • first photo is the main image</span>
        </div>

        {/* Image grid with checkboxes */}
        {(() => {
          const urls = form.images.split('\n').map(u => u.trim()).filter(Boolean);
          const allSelected = urls.length > 0 && selectedImgIndexes.size === urls.length;
          return urls.length > 0 ? (
            <div className="mb-4">
              {/* Select all row */}
              <div className="mb-2 flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-500 dark:text-slate-400 select-none">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => {
                      if (allSelected) setSelectedImgIndexes(new Set());
                      else setSelectedImgIndexes(new Set(urls.map((_, i) => i)));
                    }}
                    className="h-3.5 w-3.5 rounded accent-sky-600"
                  />
                  Select all ({urls.length})
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                {urls.map((url, i) => {
                  const isSelected = selectedImgIndexes.has(i);
                  const isDragging = dragIndex === i;
                  const isDragOver = dragOverIndex === i && dragIndex !== i;
                  return (
                    <div
                      key={i}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragIndex(i); }}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverIndex(i); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragIndex === null || dragIndex === i) return;
                        const reordered = [...urls];
                        const [moved] = reordered.splice(dragIndex, 1);
                        reordered.splice(i, 0, moved);
                        set('images', reordered.join('\n'));
                        setSelectedImgIndexes(new Set());
                        setDragIndex(null);
                        setDragOverIndex(null);
                      }}
                      onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                      className={`relative group cursor-grab active:cursor-grabbing rounded-xl overflow-hidden border-2 transition-all ${
                        isDragging ? 'opacity-40 scale-95' :
                        isDragOver ? 'border-sky-500 shadow-lg scale-105' :
                        isSelected ? 'border-red-400 shadow-md' :
                        'border-slate-200 dark:border-slate-600 hover:border-sky-300'
                      }`}
                      style={{ width: 88, height: 88 }}
                      onClick={() => {
                        setSelectedImgIndexes(prev => {
                          const next = new Set(prev);
                          if (next.has(i)) next.delete(i); else next.add(i);
                          return next;
                        });
                      }}
                    >
                      <img src={url} alt="" className="h-full w-full object-contain bg-white dark:bg-slate-800" onError={(e) => { e.target.style.display='none'; }} />
                      {/* Checkbox overlay */}
                      <div className={`absolute top-1 left-1 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-red-500 border-red-500' : 'bg-white/80 border-slate-300 group-hover:border-sky-400'}`}>
                        {isSelected && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      {/* First = main badge */}
                      {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-sky-600/80 text-white text-[9px] font-bold text-center py-0.5">MAIN</span>}
                      {/* Quick delete */}
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          const remaining = urls.filter((_, j) => j !== i);
                          set('images', remaining.join('\n'));
                          setSelectedImgIndexes(prev => {
                            const next = new Set();
                            prev.forEach(idx => { if (idx < i) next.add(idx); else if (idx > i) next.add(idx - 1); });
                            return next;
                          });
                        }}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500/80 hover:bg-red-600 text-white text-[11px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >×</button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null;
        })()}

        <Field label="Image URLs" help="One URL per line — paste additional URLs here">
          <textarea
            rows={3}
            value={form.images}
            onChange={(e) => { set('images', e.target.value); setSelectedImgIndexes(new Set()); }}
            className={ta}
            placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
          />
        </Field>
      </Section>

      <Section title="Variants & Options">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Colors" help="Comma-separated — AI fills this automatically">
            <input value={form.colors} onChange={(e) => set('colors', e.target.value)} className={inp} placeholder="Black, White, Silver, Blue" />
            {form.colors && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.colors.split(',').map((c) => c.trim()).filter(Boolean).map((c) => (
                  <span key={c} className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <span className="mr-1.5 h-2.5 w-2.5 rounded-full border border-slate-200 dark:border-slate-500" style={{ background: c.toLowerCase().replace(/\s/g, '') }} />
                    {c}
                  </span>
                ))}
              </div>
            )}
          </Field>
          {/* Per-color variant images — spans full width */}
          {form.colors && form.colors.trim() && (
            <div className="sm:col-span-2 mt-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 p-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2">
                <span>🎨</span> Color Variant Images
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                Upload a specific photo for each color — customers see the exact variant they pick.
              </p>
              <div className="space-y-3">
                {form.colors.split(',').map(c => c.trim()).filter(Boolean).map(colorName => {
                  const colorImgMap = (() => { try { return JSON.parse(form.colorImages || '{}'); } catch { return {}; } })();
                  const img = colorImgMap[colorName];
                  return (
                    <div key={colorName} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-28 flex-shrink-0">
                        <span className="h-3.5 w-3.5 rounded-full border border-slate-300 dark:border-slate-500 flex-shrink-0" style={{ background: colorName.toLowerCase().replace(/\s/g, '') }} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{colorName}</span>
                      </div>
                      {img ? (
                        <div className="relative flex-shrink-0">
                          <img src={img} alt={colorName} className="h-14 w-14 rounded-xl object-cover border-2 border-sky-300 shadow-sm" />
                          <button
                            type="button"
                            onClick={() => {
                              setForm(f => {
                                try {
                                  const m = JSON.parse(f.colorImages || '{}');
                                  delete m[colorName];
                                  return { ...f, colorImages: JSON.stringify(m) };
                                } catch { return f; }
                              });
                            }}
                            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center hover:bg-red-600 shadow-sm"
                          >×</button>
                        </div>
                      ) : (
                        <div className="h-14 w-14 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-slate-300 dark:text-slate-600 text-xl">+</span>
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => handleColorImageUpload(e.target.files[0], colorName);
                          input.click();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {img ? 'Replace' : 'Upload'}
                      </button>
                      {img && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ Set</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Storage Options with per-option pricing */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Storage Options & Pricing</label>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Enter the RWF increment <strong>above</strong> the base product price for every tier — including the first one (e.g. 128GB). Leave 0 for no increment.</p>
            <div className="space-y-2 mb-3">
              {storageItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={item.available}
                    onChange={e => setStorageItems(prev => prev.map((s, j) => j === i ? {...s, available: e.target.checked} : s))}
                    className="h-4 w-4 rounded accent-sky-600 flex-shrink-0"
                    title="In stock"
                  />
                  <input
                    value={item.value}
                    onChange={e => setStorageItems(prev => prev.map((s, j) => j === i ? {...s, value: e.target.value} : s))}
                    className="w-24 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
                    placeholder="128GB"
                  />
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">RWF</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.priceRwf}
                      onChange={e => setStorageItems(prev => prev.map((s, j) => j === i ? {...s, priceRwf: e.target.value} : s))}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 pl-10 pr-2 py-1 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
                      placeholder="+increment (RWF)"
                    />
                  </div>
                  <button type="button" onClick={() => setStorageItems(prev => prev.filter((_, j) => j !== i))}
                    className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 text-lg leading-none">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newStorageVal}
                onChange={e => setNewStorageVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newStorageVal.trim()) { setStorageItems(prev => [...prev, {value: newStorageVal.trim(), priceRwf: '', available: true}]); setNewStorageVal(''); } } }}
                className={`${inp} flex-1`}
                placeholder="128GB, 256GB, 1TB…"
              />
              <button type="button" onClick={() => { if (newStorageVal.trim()) { setStorageItems(prev => [...prev, {value: newStorageVal.trim(), priceRwf: '', available: true}]); setNewStorageVal(''); } }}
                className="rounded-xl bg-sky-600 text-white px-4 py-2 text-sm font-semibold hover:bg-sky-700 transition-colors">Add</button>
            </div>
          </div>
          <Field label="Warranty" help="Manual input — e.g. 1 Year, 2 Years">
            <input value={form.warrantyOptions} onChange={(e) => set('warrantyOptions', e.target.value)} className={inp} placeholder="1 Year, 2 Years, 3 Years" />
          </Field>
          <Field label="Serial Numbers" help="Comma-separated">
            <input value={form.serialNumbers} onChange={(e) => set('serialNumbers', e.target.value)} className={inp} placeholder="SN-001, SN-002, SN-003" />
          </Field>
          <Field label="Frequently Bought Together" help="Configure bundle products in the Bundle Products section below">
            <p className="text-xs text-slate-400 py-2">Use the Bundle Products section below to add products with discount percentages.</p>
          </Field>
        </div>
      </Section>

      <Section title="Specifications">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-slate-400">AI fills this with accurate specs. Edit freely.</p>
          {form.specs && form.specs !== '{}' && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries((() => { try { return JSON.parse(form.specs); } catch { return {}; } })()).slice(0, 4).map(([k, v]) => (
                <span key={k} className="rounded-lg bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800 px-2 py-0.5 text-xs text-sky-700 dark:text-sky-300">
                  <span className="font-medium">{k}:</span> {v}
                </span>
              ))}
              {Object.keys((() => { try { return JSON.parse(form.specs); } catch { return {}; } })()).length > 4 && (
                <span className="text-xs text-slate-400">+{Object.keys((() => { try { return JSON.parse(form.specs); } catch { return {}; } })()).length - 4} more</span>
              )}
            </div>
          )}
        </div>
        <Field label="Specs (JSON)" help='Key-value pairs. e.g. {"RAM": "16GB", "Battery": "30 hours"}'>
          <textarea
            rows={8}
            value={form.specs}
            onChange={(e) => set('specs', e.target.value)}
            className={`${ta} font-mono text-xs`}
            placeholder='{"RAM": "16GB", "Storage": "512GB", "Battery": "10 hours"}'
          />
        </Field>
      </Section>

      <Section title="Shipping & Meta">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Weight">
            <input value={form.weight} onChange={(e) => set('weight', e.target.value)} className={inp} placeholder="e.g. 250g" />
          </Field>
          <Field label="Dimensions">
            <input value={form.dimensions} onChange={(e) => set('dimensions', e.target.value)} className={inp} placeholder="e.g. 163 × 58 × 40mm" />
          </Field>
          <Field label="Tags" help="Comma-separated for search/filter — AI fills this automatically">
            <input value={form.tags} onChange={(e) => set('tags', e.target.value)} className={inp} placeholder="laptop, gaming, sale" />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} className="h-4 w-4 rounded accent-sky-600" />
            <span className="text-sm text-slate-700 dark:text-slate-300">Featured product</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="h-4 w-4 rounded accent-sky-600" />
            <span className="text-sm text-slate-700 dark:text-slate-300">Active (visible in store)</span>
          </label>
        </div>
      </Section>

      {/* Pre-Order Settings */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Pre-Order Settings</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={!!form.preOrder} onChange={e => setForm({...form, preOrder: e.target.checked})}
            className="h-5 w-5 rounded text-sky-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable Pre-Order for this product</span>
        </label>
        {form.preOrder && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Release Date</label>
              <input type="date" value={form.preOrderDate || ''} onChange={e => setForm({...form, preOrderDate: e.target.value})}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Deposit Amount (RWF)</label>
              <input type="number" min="0" value={form.preOrderDepositRwf || ''} onChange={e => setForm({...form, preOrderDepositRwf: e.target.value, preOrderDeposit: Math.round(Number(e.target.value))})}
                placeholder="0 = free to reserve"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
        )}
      </div>

      {/* Bundle Products */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Bundle Products</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Search and add products to bundle — customers get a discount when buying together</p>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={bundleSearch}
            onChange={e => setBundleSearch(e.target.value)}
            placeholder="Search product name to add to bundle…"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 pr-10"
          />
          {bundleSearch && <button type="button" onClick={() => { setBundleSearch(''); setBundleResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">×</button>}
          {bundleResults.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
              {bundleResults.map(p => {
                const bundled = (() => { try { return JSON.parse(form.bundledWith || '[]'); } catch { return []; } })();
                const alreadyAdded = bundled.some(b => b.productId === p.id);
                return (
                  <button key={p.id} type="button" disabled={alreadyAdded}
                    onClick={() => {
                      if (alreadyAdded) return;
                      const current = (() => { try { return JSON.parse(form.bundledWith || '[]'); } catch { return []; } })();
                      setForm(f => ({ ...f, bundledWith: JSON.stringify([...current, { productId: p.id, productName: p.name, discount: 10 }]) }));
                      setBundleSearch(''); setBundleResults([]);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${alreadyAdded ? 'opacity-40 cursor-not-allowed' : ''}`}>
                    <span className="flex-1 truncate font-medium text-slate-800 dark:text-slate-100">{p.name}</span>
                    <span className="text-xs text-slate-400">#{p.id}</span>
                    {alreadyAdded && <span className="text-[10px] text-emerald-600 font-semibold">Added</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bundle list */}
        <div className="flex flex-wrap gap-2">
          {(() => { try { return JSON.parse(form.bundledWith || '[]'); } catch { return []; } })().map((b, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 px-3 py-2">
              <div>
                <p className="text-xs font-semibold text-sky-800 dark:text-sky-300">{b.productName || `Product #${b.productId}`}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-sky-600 dark:text-sky-400">Discount:</span>
                  <input type="number" min="0" max="100" value={b.discount}
                    onChange={e => {
                      const current = (() => { try { return JSON.parse(form.bundledWith || '[]'); } catch { return []; } })();
                      setForm(f => ({ ...f, bundledWith: JSON.stringify(current.map((bb, j) => j === i ? {...bb, discount: Number(e.target.value)} : bb)) }));
                    }}
                    className="w-12 rounded border border-sky-200 dark:border-sky-700 bg-white dark:bg-slate-800 px-1 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-sky-400"
                  />
                  <span className="text-[10px] text-sky-600 dark:text-sky-400">%</span>
                </div>
              </div>
              <button type="button" onClick={() => {
                const current = (() => { try { return JSON.parse(form.bundledWith || '[]'); } catch { return []; } })();
                setForm(f => ({ ...f, bundledWith: JSON.stringify(current.filter((_, j) => j !== i)) }));
              }} className="text-slate-300 hover:text-red-500 transition-colors ml-1">×</button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving || uploading} className="rounded-xl bg-sky-600 px-8 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
          {uploading ? 'Uploading image...' : saving ? 'Saving...' : initial?.id ? 'Save Changes' : 'Create Product'}
        </button>
        <button type="button" onClick={() => router.push('/admin/products')} className="rounded-xl border border-slate-200 px-6 py-3 text-sm text-slate-600 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
