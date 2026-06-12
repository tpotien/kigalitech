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

export default function DeliveryZonesAdmin() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [fee, setFee] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('1');
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadZones(); }, []);

  async function loadZones() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/delivery-zones');
      const data = await r.json();
      setZones(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return setMsg('Zone name is required.');
    setAdding(true);
    setMsg('');
    try {
      const r = await fetch('/api/admin/delivery-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, fee: fee ? Number(fee) : 0, sortOrder: sortOrder ? Number(sortOrder) : 0, estimatedDays: estimatedDays ? Number(estimatedDays) : 1 }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      setName('');
      setFee('');
      setSortOrder('');
      setMsg(`Zone "${data.name}" added successfully.`);
      loadZones();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(zone) {
    const r = await fetch('/api/admin/delivery-zones', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: zone.id, active: !zone.active }),
    });
    if (r.ok) loadZones();
  }

  async function handleDelete(zone) {
    if (!confirm(`Delete zone "${zone.name}"? This cannot be undone.`)) return;
    const r = await fetch('/api/admin/delivery-zones', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: zone.id }),
    });
    if (r.ok) {
      setMsg(`Zone "${zone.name}" deleted.`);
      loadZones();
    }
  }

  async function handleFeeEdit(zone, newFee) {
    const r = await fetch('/api/admin/delivery-zones', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: zone.id, fee: Math.round(Number(newFee)) }),
    });
    if (r.ok) loadZones();
  }

  return (
    <AdminLayout title="Delivery Zones">
      <div className="max-w-3xl space-y-8">

        {/* Add Zone Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-5">Add Delivery Zone</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Zone Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Kigali City"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Fee (RWF)
                </label>
                <input
                  type="number"
                  min="0"
                  value={fee}
                  onChange={e => setFee(e.target.value)}
                  placeholder="e.g. 2000"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Est. Hours</label>
                <input
                  type="number"
                  min="1"
                  value={estimatedDays}
                  onChange={e => setEstimatedDays(e.target.value)}
                  placeholder="2"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sort Order</label>
                <input
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            {msg && (
              <p className={`text-sm font-medium rounded-lg px-4 py-2 ${msg.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                {msg}
              </p>
            )}

            <button
              type="submit"
              disabled={adding}
              className="rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 text-sm transition-colors"
            >
              {adding ? 'Adding…' : 'Add Zone'}
            </button>
          </form>
        </div>

        {/* Zones Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">All Delivery Zones</h2>
            <button onClick={loadZones} className="text-xs text-slate-400 hover:text-sky-600 transition-colors">Refresh</button>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">Loading…</div>
          ) : zones.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-3xl mb-3">🚚</p>
              <p className="text-sm text-slate-400">No delivery zones yet. Add one above.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Zone</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee (RWF)</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Est. Hours</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {zones.map(zone => (
                  <ZoneRow
                    key={zone.id}
                    zone={zone}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onFeeEdit={handleFeeEdit}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function ZoneRow({ zone, onToggle, onDelete, onFeeEdit }) {
  const [editing, setEditing] = useState(false);
  const [feeVal, setFeeVal] = useState(zone.fee);

  function handleFeeBlur() {
    setEditing(false);
    if (Number(feeVal) !== zone.fee) {
      onFeeEdit(zone, feeVal);
    }
  }

  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="px-6 py-4 font-semibold text-slate-800">{zone.name}</td>
      <td className="px-6 py-4">
        {editing ? (
          <input
            type="number"
            min="0"
            value={feeVal}
            onChange={e => setFeeVal(e.target.value)}
            onBlur={handleFeeBlur}
            autoFocus
            className="w-24 rounded-lg border border-sky-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-sky-100"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-slate-700 hover:text-sky-600 font-medium tabular-nums"
            title="Click to edit"
          >
            {zone.fee.toLocaleString()} RWF
          </button>
        )}
      </td>
      <td className="px-6 py-4 text-slate-500">{zone.estimatedDays ?? 2}h</td>
      <td className="px-6 py-4">
        <button
          onClick={() => onToggle(zone)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors ${
            zone.active
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${zone.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {zone.active ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td className="px-6 py-4">
        <button
          onClick={() => onDelete(zone)}
          className="text-xs text-red-500 hover:text-red-700 font-semibold"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
