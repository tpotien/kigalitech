import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';

export default function AdminCustomers() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phoneNumber: '' });
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/signin');
    if (status === 'authenticated' && !['admin', 'staff'].includes(session?.user?.role)) router.replace('/');
  }, [status, session]);

  useEffect(() => {
    fetch('/api/admin/customers')
      .then(r => r.json())
      .then(data => { setCustomers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setCustomers([]); setLoading(false); });
  }, []);

  async function saveEdit() {
    setSaving(true);
    const res = await fetch('/api/admin/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editing.id, ...editForm }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCustomers(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
      setEditing(null);
    }
    setSaving(false);
  }

  async function deleteCustomer(id) {
    if (!confirm('Delete this customer account? This cannot be undone.')) return;
    const res = await fetch(`/api/admin/customers?id=${id}`, { method: 'DELETE' });
    if (res.ok) setCustomers(prev => prev.filter(c => c.id !== id));
  }

  const filtered = customers.filter(c =>
    !search || [c.name, c.email, c.phoneNumber].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  if (status === 'loading' || loading) {
    return (
      <AdminLayout title="Customers">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Customers">
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <span className="text-sm text-slate-500">{filtered.length} customers</span>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-5 py-4 text-left font-semibold text-slate-500">Customer</th>
              <th className="px-4 py-4 text-left font-semibold text-slate-500 hidden md:table-cell">Phone</th>
              <th className="px-4 py-4 text-left font-semibold text-slate-500 hidden lg:table-cell">Orders</th>
              <th className="px-4 py-4 text-left font-semibold text-slate-500 hidden lg:table-cell">Reviews</th>
              <th className="px-5 py-4 text-right font-semibold text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(customer => (
              <tr key={customer.id} className="hover:bg-slate-50">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {customer.image
                      ? <img src={customer.image} alt="" className="h-8 w-8 rounded-full flex-shrink-0" />
                      : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-600 flex-shrink-0">{(customer.name || customer.email || '?')[0].toUpperCase()}</div>
                    }
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{customer.name || '—'}</p>
                      <p className="text-xs text-slate-400 truncate">{customer.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-600 hidden md:table-cell">{customer.phoneNumber || '—'}</td>
                <td className="px-4 py-4 hidden lg:table-cell">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{customer._count?.orders || 0}</span>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{customer._count?.reviews || 0}</span>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setEditing(customer); setEditForm({ name: customer.name || '', email: customer.email || '', phoneNumber: customer.phoneNumber || '' }); }}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-sky-600 hover:bg-sky-50"
                    >
                      Edit
                    </button>
                    {session?.user?.role === 'admin' && (
                      <button
                        onClick={() => deleteCustomer(customer.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-slate-400">No customers found</div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="mb-5 text-lg font-bold text-slate-900">Edit Customer</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                <input value={editForm.phoneNumber} onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })} placeholder="+250 7XX XXX XXX" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={saveEdit} disabled={saving} className="flex-1 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
