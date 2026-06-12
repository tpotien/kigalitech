import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';

const PAYMENT_TERMS = ['Due on Receipt', 'Net 7', 'Net 15', 'Net 30', 'Net 60', '50% Upfront'];
const VAT_RATE = 0.18; // 18% Rwanda VAT

function generateRef() {
  const now = new Date();
  return `PRO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`;
}

function fmt(n) {
  return Number(n || 0).toLocaleString('en-RW');
}

export default function ProformaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const printRef = useRef(null);

  const [info, setInfo] = useState({
    ref: generateRef(),
    date: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
    paymentTerms: 'Net 30',
    currency: 'RWF',
    includeVat: true,
  });

  const [client, setClient] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    tinNumber: '',
  });

  const [lines, setLines] = useState([
    { description: '', qty: 1, unitPrice: 0 },
  ]);

  const [notes, setNotes] = useState('Thank you for your business. All prices are in Rwandan Francs (RWF).');

  if (status === 'loading') return null;
  if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
    if (typeof window !== 'undefined') router.replace('/signin');
    return null;
  }

  function setInfoField(k, v) { setInfo(prev => ({ ...prev, [k]: v })); }
  function setClientField(k, v) { setClient(prev => ({ ...prev, [k]: v })); }

  function setLine(i, k, v) {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  }

  function addLine() {
    setLines(prev => [...prev, { description: '', qty: 1, unitPrice: 0 }]);
  }

  function removeLine(i) {
    setLines(prev => prev.filter((_, idx) => idx !== i));
  }

  const subtotal = lines.reduce((s, l) => s + Number(l.qty || 0) * Number(l.unitPrice || 0), 0);
  const vatAmount = info.includeVat ? Math.round(subtotal * VAT_RATE) : 0;
  const grandTotal = subtotal + vatAmount;

  function handlePrint() {
    window.print();
  }

  const inp = 'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-200';
  const label = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide';

  return (
    <AdminLayout title="Proforma Invoice">
      <style global jsx>{`
        @media print {
          body * { visibility: hidden; }
          #proforma-print, #proforma-print * { visibility: visible; }
          #proforma-print { position: absolute; left: 0; top: 0; width: 100%; padding: 32px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Proforma Invoice</h1>
            <p className="text-sm text-slate-500 mt-0.5">Generate corporate proforma invoices for clients</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setInfo(prev => ({ ...prev, ref: generateRef() }))}
              className="rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              New Ref
            </button>
            <button onClick={handlePrint}
              className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Form + Preview grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">

          {/* ── LEFT: Form ── */}
          <div className="space-y-6 no-print">

            {/* Invoice Info */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">Invoice Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>Reference #</label>
                  <input value={info.ref} onChange={e => setInfoField('ref', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={label}>Currency</label>
                  <select value={info.currency} onChange={e => setInfoField('currency', e.target.value)} className={inp}>
                    <option>RWF</option>
                    <option>USD</option>
                    <option>EUR</option>
                  </select>
                </div>
                <div>
                  <label className={label}>Issue Date</label>
                  <input type="date" value={info.date} onChange={e => setInfoField('date', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={label}>Valid Until</label>
                  <input type="date" value={info.validUntil} onChange={e => setInfoField('validUntil', e.target.value)} className={inp} />
                </div>
                <div className="col-span-2">
                  <label className={label}>Payment Terms</label>
                  <select value={info.paymentTerms} onChange={e => setInfoField('paymentTerms', e.target.value)} className={inp}>
                    {PAYMENT_TERMS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <input type="checkbox" id="vat" checked={info.includeVat} onChange={e => setInfoField('includeVat', e.target.checked)} className="accent-sky-600 h-4 w-4" />
                  <label htmlFor="vat" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Include 18% VAT (Rwanda)</label>
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">Bill To (Client)</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={label}>Company Name</label>
                  <input value={client.companyName} onChange={e => setClientField('companyName', e.target.value)} placeholder="ACME Ltd." className={inp} />
                </div>
                <div>
                  <label className={label}>Contact Name</label>
                  <input value={client.contactName} onChange={e => setClientField('contactName', e.target.value)} placeholder="Jean Baptiste" className={inp} />
                </div>
                <div>
                  <label className={label}>Phone</label>
                  <input value={client.phone} onChange={e => setClientField('phone', e.target.value)} placeholder="+250 7XX XXX XXX" className={inp} />
                </div>
                <div>
                  <label className={label}>Email</label>
                  <input type="email" value={client.email} onChange={e => setClientField('email', e.target.value.toLowerCase())} placeholder="client@company.com" className={inp} />
                </div>
                <div>
                  <label className={label}>TIN Number</label>
                  <input value={client.tinNumber} onChange={e => setClientField('tinNumber', e.target.value)} placeholder="123 456 789" className={inp} />
                </div>
                <div className="col-span-2">
                  <label className={label}>Address</label>
                  <textarea rows={2} value={client.address} onChange={e => setClientField('address', e.target.value)} placeholder="Street, District, Kigali" className={`${inp} resize-none`} />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">Line Items</h2>
              <div className="space-y-3">
                {lines.map((line, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_110px_32px] gap-2 items-start">
                    <input
                      value={line.description}
                      onChange={e => setLine(i, 'description', e.target.value)}
                      placeholder="Product / Service description"
                      className={inp}
                    />
                    <input
                      type="number" min="1"
                      value={line.qty}
                      onChange={e => setLine(i, 'qty', e.target.value)}
                      placeholder="Qty"
                      className={inp}
                    />
                    <input
                      type="number" min="0" step="1"
                      value={line.unitPrice}
                      onChange={e => setLine(i, 'unitPrice', e.target.value)}
                      placeholder="Unit price"
                      className={inp}
                    />
                    <button type="button" onClick={() => removeLine(i)} disabled={lines.length === 1}
                      className="flex h-9 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-30">
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addLine}
                  className="rounded-full border border-dashed border-slate-300 dark:border-slate-600 px-4 py-2 text-sm text-slate-500 hover:border-sky-400 hover:text-sky-600 transition w-full text-center">
                  + Add line item
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
              <label className={label}>Notes / Terms</label>
              <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className={`${inp} resize-none`} />
            </div>
          </div>

          {/* ── RIGHT: Live Preview ── */}
          <div>
            <div ref={printRef} id="proforma-print" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm text-slate-900 dark:text-slate-100 text-sm">

              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <img src="/logo.png" alt="KigaliTech" className="h-14 w-14 rounded-full object-cover mb-3" />
                  <p className="font-extrabold text-base text-slate-900 dark:text-white">KigaliTech Services</p>
                  <p className="text-xs text-slate-500">KN 74 ST, Kigali/Rwanda</p>
                  <p className="text-xs text-slate-500">+250 786 276 555 · info@kigalitechservices.com</p>
                  <p className="text-xs text-slate-500">TIN: 103 256 789</p>
                </div>
                <div className="text-right">
                  <div className="inline-block rounded-xl bg-sky-600 px-4 py-2 text-white font-extrabold text-lg mb-2">PROFORMA INVOICE</div>
                  <p className="text-xs text-slate-500">Ref: <span className="font-bold text-slate-800 dark:text-slate-200">{info.ref}</span></p>
                  <p className="text-xs text-slate-500">Date: <span className="font-semibold">{info.date}</span></p>
                  <p className="text-xs text-slate-500">Valid Until: <span className="font-semibold">{info.validUntil}</span></p>
                  <p className="text-xs text-slate-500">Terms: <span className="font-semibold">{info.paymentTerms}</span></p>
                </div>
              </div>

              {/* Bill To */}
              <div className="mb-6 rounded-xl bg-slate-50 dark:bg-slate-800 px-5 py-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</p>
                <p className="font-bold text-slate-900 dark:text-white">{client.companyName || 'Company Name'}</p>
                {client.contactName && <p className="text-slate-600 dark:text-slate-400">{client.contactName}</p>}
                {client.address && <p className="text-slate-500 text-xs whitespace-pre-line">{client.address}</p>}
                {client.email && <p className="text-slate-500 text-xs">{client.email}</p>}
                {client.phone && <p className="text-slate-500 text-xs">{client.phone}</p>}
                {client.tinNumber && <p className="text-slate-500 text-xs">TIN: {client.tinNumber}</p>}
              </div>

              {/* Line items table */}
              <table className="w-full text-xs mb-6">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <th className="text-left px-3 py-2 font-semibold text-slate-600 dark:text-slate-400 rounded-l-lg">#</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-600 dark:text-slate-400">Description</th>
                    <th className="text-right px-3 py-2 font-semibold text-slate-600 dark:text-slate-400">Qty</th>
                    <th className="text-right px-3 py-2 font-semibold text-slate-600 dark:text-slate-400">Unit Price</th>
                    <th className="text-right px-3 py-2 font-semibold text-slate-600 dark:text-slate-400 rounded-r-lg">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2">{line.description || <span className="text-slate-300">—</span>}</td>
                      <td className="px-3 py-2 text-right">{line.qty}</td>
                      <td className="px-3 py-2 text-right">{info.currency} {fmt(line.unitPrice)}</td>
                      <td className="px-3 py-2 text-right font-medium">{info.currency} {fmt(Number(line.qty || 0) * Number(line.unitPrice || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-6">
                <div className="w-64 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span>{info.currency} {fmt(subtotal)}</span>
                  </div>
                  {info.includeVat && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>VAT (18%)</span>
                      <span>{info.currency} {fmt(vatAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-base text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                    <span>Total Due</span>
                    <span>{info.currency} {fmt(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Bank / Payment details */}
              <div className="rounded-xl border border-sky-100 dark:border-sky-900/40 bg-sky-50 dark:bg-sky-900/20 px-4 py-3 mb-4 text-xs">
                <p className="font-bold text-sky-800 dark:text-sky-300 mb-1">Payment Details</p>
                <p className="text-sky-700 dark:text-sky-400">MoMo (MTN/Airtel): <span className="font-bold">+250 786 276 555</span></p>
                <p className="text-sky-700 dark:text-sky-400">Account Name: <span className="font-bold">KigaliTech Services</span></p>
                <p className="text-sky-700 dark:text-sky-400">Reference: <span className="font-bold">{info.ref}</span></p>
              </div>

              {/* Notes */}
              {notes && (
                <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
                  {notes}
                </div>
              )}

              <div className="mt-6 text-center text-[10px] text-slate-400">
                This is a proforma invoice and not a tax invoice. Goods remain property of KigaliTech Services until full payment is received.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
