import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ email: '', name: '', role: 'staff' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { fetch('/api/admin/staff').then((r) => r.json()).then(setStaff); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/admin/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setStaff((prev) => {
      const exists = prev.find((s) => s.id === data.id);
      return exists ? prev.map((s) => (s.id === data.id ? data : s)) : [...prev, data];
    });
    setForm({ email: '', name: '', role: 'staff' });
    setMsg('Staff member added/updated.');
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  }

  async function handleRoleChange(id, role) {
    await fetch('/api/admin/staff', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, role }) });
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, role } : s)));
  }

  async function handleRemove(id) {
    await fetch('/api/admin/staff', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setStaff((prev) => prev.filter((s) => s.id !== id));
  }

  const inp = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200';

  return (
    <AdminLayout title="Staff Management">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Staff list */}
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-900">Team Members ({staff.length})</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {staff.map((s) => (
              <div key={s.id} className="flex items-center gap-4 px-6 py-4">
                {s.image ? (
                  <img src={s.image} alt="" className="h-10 w-10 rounded-full flex-shrink-0" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600 flex-shrink-0">
                    {(s.name || s.email)[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{s.name || '(no name)'}</p>
                  <p className="text-xs text-slate-400 truncate">{s.email}</p>
                </div>
                <select
                  value={s.role}
                  onChange={(e) => handleRoleChange(s.id, e.target.value)}
                  className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold bg-white text-slate-700"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={() => handleRemove(s.id)} className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            {!staff.length && <div className="px-6 py-10 text-center text-slate-400">No staff members yet.</div>}
          </div>
        </div>

        {/* Add form */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Add / Grant Access</h2>
          <p className="text-sm text-slate-500 mb-5">Enter the email of an existing user to promote them, or create a new staff entry.</p>
          {msg && <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{msg}</div>}
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} placeholder="staff@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} placeholder="Full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inp}>
                <option value="staff">Staff — manage orders & products</option>
                <option value="admin">Admin — full access</option>
              </select>
            </div>
            <button type="submit" disabled={saving} className="w-full rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
              {saving ? 'Adding...' : 'Add Staff Member'}
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">Role Permissions</p>
            <div className="space-y-1 text-xs text-slate-500">
              <p><span className="font-medium text-slate-700">Admin:</span> Full access — products, orders, analytics, staff</p>
              <p><span className="font-medium text-slate-700">Staff:</span> Manage orders, view products, no staff/analytics access</p>
              <p><span className="font-medium text-slate-700">Customer:</span> Browse, purchase, track personal orders only</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
