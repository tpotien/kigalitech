import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';

function parse(v) {
  if (typeof v === 'object' && v !== null) return v;
  try { return JSON.parse(v); } catch { return {}; }
}

function parseArr(v) {
  if (Array.isArray(v)) return v;
  try { const r = JSON.parse(v); return Array.isArray(r) ? r : []; } catch { return []; }
}

// Find best (lowest for price, highest for numeric) among values in a row
function getBestIndices(values, label) {
  const nums = values.map(v => {
    const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? null : n;
  });
  const allNull = nums.every(n => n === null);
  if (allNull) return [];

  const lowerBetter = /price|cost|weight/i.test(label);
  const validNums = nums.filter(n => n !== null);
  if (validNums.length === 0) return [];

  const best = lowerBetter ? Math.min(...validNums) : Math.max(...validNums);
  return nums.map((n, i) => (n === best ? i : -1)).filter(i => i !== -1);
}

export default function ComparePage() {
  const { items, remove, clear } = useCompare();
  const { addItem } = useCart();
  const { format } = useCurrency();
  const { toast } = useToast();

  if (items.length === 0) {
    return (
      <Layout>
        <Head><title>Compare Products — KigaliTech</title></Head>
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 bg-slate-50 dark:bg-slate-950">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30">
              <svg className="h-10 w-10 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Nothing to compare yet</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Add up to 3 products to compare side by side.</p>
            <Link href="/products" className="mt-6 inline-block rounded-full bg-sky-600 px-8 py-3 font-semibold text-white hover:bg-sky-700 no-underline transition-colors">
              Browse Products
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Collect all spec keys across all products
  const allSpecKeys = [...new Set(items.flatMap(p => Object.keys(parse(p.specs))))];

  const rows = [
    {
      label: 'Price',
      values: items.map(p => format(p.price)),
      raw: items.map(p => p.price),
      lowerBetter: true,
    },
    {
      label: 'Brand',
      values: items.map(p => p.brand || '—'),
    },
    {
      label: 'Category',
      values: items.map(p => p.category),
    },
    {
      label: 'Stock',
      values: items.map(p =>
        p.stock > 0 ? `${p.stock} in stock` : 'Sold out'
      ),
      raw: items.map(p => p.stock),
      highlight: (val, i) => items[i]?.stock > 0,
      highlightColor: (val, i) => items[i]?.stock === 0 ? 'text-red-500' : 'text-emerald-600',
      noHighlight: true,
    },
    {
      label: 'Colors',
      values: items.map(p => {
        const cols = parseArr(p.colors);
        return cols.length ? cols.join(', ') : '—';
      }),
    },
    {
      label: 'Storage Options',
      values: items.map(p => {
        const sto = parseArr(p.storageOptions);
        return sto.length ? sto.join(' / ') : '—';
      }),
    },
    ...allSpecKeys.map(key => ({
      label: key,
      values: items.map(p => {
        const specs = parse(p.specs);
        return specs[key] != null ? String(specs[key]) : '—';
      }),
    })),
  ];

  function handleAddToCart(product) {
    const images = parseArr(product.images);
    const colors = parseArr(product.colors);
    const storageOptions = parseArr(product.storageOptions);
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: images[0],
      color: colors[0] || '',
      storage: storageOptions[0] || '',
      quantity: 1,
    });
    toast({ type: 'cart', title: 'Added to cart', message: product.name });
  }

  return (
    <Layout>
      <Head><title>Compare Products — KigaliTech</title></Head>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">

          {/* Header */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Compare Products</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Comparing {items.length} product{items.length !== 1 ? 's' : ''} side by side
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={clear}
                className="rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Clear All
              </button>
              <Link href="/products" className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 no-underline transition-colors">
                + Add More
              </Link>
            </div>
          </div>

          {/* Comparison table */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* Product cards header */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {/* Label column */}
                    <th className="w-36 sm:w-44 px-6 py-6 text-left align-bottom">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Spec</span>
                    </th>

                    {/* Product columns */}
                    {items.map(product => {
                      const images = parseArr(product.images);
                      return (
                        <th key={product.id} className="px-4 py-6 align-top text-center">
                          <div className="flex flex-col items-center gap-3">
                            {/* Image */}
                            <Link href={`/products/${product.id}`} className="block">
                              <div className="mx-auto h-28 w-28 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                {images[0] ? (
                                  <img src={images[0]} alt={product.name} className="h-full w-full object-contain p-2" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-slate-300">
                                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </Link>

                            {/* Category */}
                            <p className="text-[11px] font-bold uppercase tracking-widest text-sky-600">{product.category}</p>

                            {/* Name */}
                            <Link href={`/products/${product.id}`} className="no-underline">
                              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug hover:text-sky-700 transition-colors text-center line-clamp-2 max-w-[160px]">
                                {product.name}
                              </p>
                            </Link>

                            {/* Price */}
                            <div className="text-center">
                              <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{format(product.price)}</p>
                              {product.comparePrice && product.comparePrice > product.price && (
                                <p className="text-xs text-slate-400 line-through">{format(product.comparePrice)}</p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 w-full max-w-[160px]">
                              <button
                                onClick={() => handleAddToCart(product)}
                                disabled={product.stock === 0}
                                className={`rounded-xl px-4 py-2 text-sm font-bold text-white transition-all active:scale-95 ${
                                  product.stock === 0
                                    ? 'bg-slate-300 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed'
                                    : 'bg-sky-600 hover:bg-sky-700 shadow-sm shadow-sky-200'
                                }`}
                              >
                                {product.stock === 0 ? 'Sold Out' : '+ Add to Cart'}
                              </button>
                              <button
                                onClick={() => remove(product.id)}
                                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 hover:border-red-200 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </th>
                      );
                    })}

                    {/* Placeholder columns if fewer than 3 */}
                    {Array.from({ length: 3 - items.length }).map((_, i) => (
                      <th key={`empty-${i}`} className="px-4 py-6 align-top text-center">
                        <Link href="/products" className="no-underline block">
                          <div className="mx-auto flex h-28 w-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all">
                            <span className="text-2xl text-slate-300 dark:text-slate-600">+</span>
                            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Add product</span>
                          </div>
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, rowIdx) => {
                    // Compute best indices for highlighting
                    const bestIndices = row.noHighlight ? [] : getBestIndices(
                      row.raw || row.values,
                      row.label
                    );
                    const allSame = row.values.length > 1 && row.values.every(v => v === row.values[0]);

                    return (
                      <tr
                        key={row.label}
                        className={`border-b border-slate-50 dark:border-slate-800/60 last:border-0 ${rowIdx % 2 === 0 ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}`}
                      >
                        {/* Label */}
                        <td className="px-6 py-3.5">
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap">
                            {row.label}
                          </span>
                        </td>

                        {/* Values */}
                        {row.values.map((val, colIdx) => {
                          const isBest = bestIndices.includes(colIdx) && !allSame && items.length > 1;
                          const customColor = row.highlightColor?.(val, colIdx);

                          return (
                            <td key={`${row.label}-${colIdx}`} className="px-4 py-3.5 text-center">
                              <span className={`text-sm font-medium ${
                                customColor
                                  ? customColor
                                  : isBest
                                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                    : 'text-slate-700 dark:text-slate-300'
                              }`}>
                                {val}
                                {isBest && (
                                  <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-[9px] font-bold text-emerald-600">
                                    ✓
                                  </span>
                                )}
                              </span>
                            </td>
                          );
                        })}

                        {/* Empty cells for placeholders */}
                        {Array.from({ length: 3 - items.length }).map((_, i) => (
                          <td key={`empty-cell-${i}`} className="px-4 py-3.5 text-center">
                            <span className="text-slate-200 dark:text-slate-700">—</span>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Back link */}
          <div className="mt-8 text-center">
            <Link href="/products" className="text-sm text-sky-600 hover:text-sky-700 font-medium no-underline">
              ← Back to Products
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
