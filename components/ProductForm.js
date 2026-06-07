import { useState, useRef } from 'react';
import { useRouter } from 'next/router';

const CATEGORIES = [
  'Phones', 'Laptops', 'TVs', 'Audio', 'Wearables',
  'Gaming', 'Tablets', 'Cameras', 'Accessories', 'Smart Home',
];

// Defined outside component so React never recreates them on re-render
function Section({ title, children }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, help, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {help && <p className="text-xs text-slate-400 mb-1">{help}</p>}
      {children}
    </div>
  );
}

function parse(val, fallback = []) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'object' && val !== null) return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

export default function ProductForm({ initial }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const [nameWarning, setNameWarning] = useState('');
  const fileRef = useRef();

  const [form, setForm] = useState({
    name: initial?.name || '',
    category: initial?.category || 'Phones',
    brand: initial?.brand || '',
    sku: initial?.sku || '',
    description: initial?.description || '',
    price: initial?.price ? (initial.price / 100).toFixed(2) : '',
    comparePrice: initial?.comparePrice ? (initial.comparePrice / 100).toFixed(2) : '',
    stock: initial?.stock ?? '',
    lowStockThreshold: initial?.lowStockThreshold ?? 5,
    weight: initial?.weight || '',
    dimensions: initial?.dimensions || '',
    featured: initial?.featured ?? false,
    active: initial?.active ?? true,
    images: parse(initial?.images, []).join('\n'),
    colors: parse(initial?.colors, []).join(', '),
    storageOptions: parse(initial?.storageOptions, []).join(', '),
    warrantyOptions: parse(initial?.warrantyOptions, []).join(', '),
    specs: typeof initial?.specs === 'string' ? initial.specs : JSON.stringify(parse(initial?.specs, {}), null, 2),
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
    preOrderDepositRwf: initial?.preOrderDeposit ? (initial.preOrderDeposit / 100).toString() : '',
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
        colors: Array.isArray(data.colors) ? data.colors.join(', ') : f.colors,
        storageOptions: Array.isArray(data.storageOptions) ? data.storageOptions.join(', ') : f.storageOptions,
        warrantyOptions: Array.isArray(data.warrantyOptions) ? data.warrantyOptions.join(', ') : f.warrantyOptions,
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : f.tags,
        specs: data.specs ? JSON.stringify(data.specs, null, 2) : f.specs,
        price: data.suggestedPrice && !f.price ? (data.suggestedPrice / 100).toFixed(2) : f.price,
      }));
      const src = data._source === 'claude' ? '✨ Claude AI' : '⚡ Smart Fill';
      setAiStatus(`${src} — filled! Review and adjust before saving.`);
      setTimeout(() => setAiStatus(''), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  }

  function handleAiFill() { runAiFill(form.name, form.category); }
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
    const isEmpty = !form.description && !form.brand && !form.colors && !form.specs;
    if (isEmpty) runAiFill(name, form.category);
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageDataUrl: ev.target.result }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        set('images', form.images ? `${form.images}\n${data.url}` : data.url);
      } catch (err) {
        setError(err.message);
      } finally {
        setUploading(false);
        e.target.value = '';
      }
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
        price: Math.round(parseFloat(form.price) * 100),
        comparePrice: form.comparePrice ? Math.round(parseFloat(form.comparePrice) * 100) : null,
        stock: parseInt(form.stock, 10),
        lowStockThreshold: parseInt(form.lowStockThreshold, 10),
        weight: form.weight,
        dimensions: form.dimensions,
        featured: form.featured,
        active: form.active,
        images: form.images.split('\n').map((s) => s.trim()).filter(Boolean),
        colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
        storageOptions: form.storageOptions.split(',').map((s) => s.trim()).filter(Boolean),
        warrantyOptions: form.warrantyOptions.split(',').map((s) => s.trim()).filter(Boolean),
        serialNumbers: form.serialNumbers.split(',').map((s) => s.trim()).filter(Boolean),
        tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
        bundledWith: (() => { try { return JSON.stringify(JSON.parse(form.bundledWith || '[]')); } catch { return '[]'; } })(),
        preOrder: form.preOrder,
        preOrderDate: form.preOrderDate ? new Date(form.preOrderDate).toISOString() : null,
        preOrderDeposit: form.preOrderDeposit || 0,
        specs: (() => { try { return JSON.parse(form.specs); } catch { return {}; } })(),
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

  const inp = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100';
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

      {/* AI Fill Banner — optional feature */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-50 to-sky-50 border border-violet-100 p-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800 text-sm">Auto Fill {aiLoading && <span className="ml-1.5 inline-block h-3 w-3 align-middle animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />}</p>
          <p className="text-xs text-slate-500 mt-0.5">Type the product name and tab away — description, specs, colors, warranty &amp; price fill automatically. Click the button to re-fill anytime.</p>
        </div>
        <button
          type="button"
          onClick={handleAiFill}
          disabled={aiLoading || !form.name.trim()}
          title="Requires ANTHROPIC_API_KEY — all fields can also be filled manually"
          className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-violet-200 transition-all"
        >
          {aiLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Generating...
            </>
          ) : (
            <>
              <span>✨</span>
              AI Fill
            </>
          )}
        </button>
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
            <input value={form.sku} onChange={(e) => set('sku', e.target.value)} className={inp} placeholder="e.g. APPLE-IP17PM" />
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
          <Field label="Price (USD) *">
            <input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} className={inp} placeholder="0.00" />
          </Field>
          <Field label="Compare Price (USD)" help="Shown as strikethrough">
            <input type="number" step="0.01" min="0" value={form.comparePrice} onChange={(e) => set('comparePrice', e.target.value)} className={inp} placeholder="0.00" />
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
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <svg className="h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <span className="text-xs text-slate-400">or paste URLs below — uploaded files are added automatically</span>
        </div>

        <Field label="Image URLs" help="One URL per line — first image is the main display image.">
          <textarea
            rows={5}
            value={form.images}
            onChange={(e) => set('images', e.target.value)}
            className={ta}
            placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
          />
        </Field>
        {form.images && (
          <div className="mt-3 flex flex-wrap gap-2">
            {form.images.split('\n').filter((u) => u.trim()).slice(0, 8).map((url, i) => (
              <img key={i} src={url.trim()} alt="" className="h-16 w-16 rounded-xl object-cover border border-slate-200" onError={(e) => e.target.style.display='none'} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Variants & Options">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Colors" help="Comma-separated — AI fills this automatically">
            <input value={form.colors} onChange={(e) => set('colors', e.target.value)} className={inp} placeholder="Black, White, Silver, Blue" />
            {form.colors && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.colors.split(',').map((c) => c.trim()).filter(Boolean).map((c) => (
                  <span key={c} className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    <span className="mr-1.5 h-2.5 w-2.5 rounded-full border border-slate-200" style={{ background: c.toLowerCase().replace(/\s/g, '') }} />
                    {c}
                  </span>
                ))}
              </div>
            )}
          </Field>
          <Field label="Storage Options" help="Comma-separated. e.g. 128GB, 256GB, 512GB">
            <input value={form.storageOptions} onChange={(e) => set('storageOptions', e.target.value)} className={inp} placeholder="128GB, 256GB, 1TB" />
          </Field>
          <Field label="Warranty Options" help="Comma-separated — AI fills this automatically">
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
                <span key={k} className="rounded-lg bg-sky-50 border border-sky-100 px-2 py-0.5 text-xs text-sky-700">
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
            <span className="text-sm text-slate-700">Featured product</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="h-4 w-4 rounded accent-sky-600" />
            <span className="text-sm text-slate-700">Active (visible in store)</span>
          </label>
        </div>
      </Section>

      {/* Pre-Order Settings */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
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
              <input type="number" min="0" value={form.preOrderDepositRwf || ''} onChange={e => setForm({...form, preOrderDepositRwf: e.target.value, preOrderDeposit: Math.round(Number(e.target.value) * 100)})}
                placeholder="0 = free to reserve"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
        )}
      </div>

      {/* Bundle Products */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Bundle Products</h3>
        <p className="text-xs text-slate-500">Add product IDs to bundle together (customers get a discount on bundled items)</p>
        <div className="flex gap-2">
          <input type="text" id="bundleInput" placeholder="Product ID : discount% (e.g. 42:15)"
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          <button type="button" onClick={() => {
            const val = document.getElementById('bundleInput').value.trim();
            if (!val) return;
            const [pid, disc] = val.split(':');
            if (!pid) return;
            const current = (() => { try { return JSON.parse(form.bundledWith || '[]'); } catch { return []; } })();
            const updated = [...current, { productId: Number(pid), discount: Number(disc) || 10 }];
            setForm({ ...form, bundledWith: JSON.stringify(updated) });
            document.getElementById('bundleInput').value = '';
          }} className="rounded-xl bg-sky-600 text-white px-4 py-2 text-sm font-semibold hover:bg-sky-700 transition-colors">Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(() => { try { return JSON.parse(form.bundledWith || '[]'); } catch { return []; } })().map((b, i) => (
            <span key={i} className="flex items-center gap-1.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 px-3 py-1 text-xs font-medium">
              Product #{b.productId} · {b.discount}% off
              <button type="button" onClick={() => {
                const current = (() => { try { return JSON.parse(form.bundledWith || '[]'); } catch { return []; } })();
                setForm({ ...form, bundledWith: JSON.stringify(current.filter((_, j) => j !== i)) });
              }} className="text-sky-500 hover:text-red-500 transition-colors">×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving} className="rounded-xl bg-sky-600 px-8 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
          {saving ? 'Saving...' : initial?.id ? 'Save Changes' : 'Create Product'}
        </button>
        <button type="button" onClick={() => router.push('/admin/products')} className="rounded-xl border border-slate-200 px-6 py-3 text-sm text-slate-600 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
