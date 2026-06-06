import { useState, useRef, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

export default function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: false });
  const fileRef = useRef();

  useEffect(() => {
    fetch('/api/admin/profile')
      .then(r => r.json())
      .then(data => {
        setProfile(data);
        setForm(f => ({ ...f, name: data.name || '', email: data.email || '' }));
        setImagePreview(data.image || null);
      });
  }, []);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageDataUrl(ev.target.result);
      setImagePreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      setMsg({ text: 'Passwords do not match', ok: false });
      return;
    }
    setSaving(true);
    setMsg({ text: '', ok: false });

    const payload = {};
    if (form.name !== (profile?.name || '')) payload.name = form.name;
    if (form.email !== (profile?.email || '')) payload.email = form.email;
    if (form.password) payload.password = form.password;
    if (imageDataUrl) payload.imageDataUrl = imageDataUrl;

    const res = await fetch('/api/admin/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      setProfile(data);
      setImageDataUrl(null);
      setForm(f => ({ ...f, password: '', confirmPassword: '', email: data.email, name: data.name || '' }));
      setImagePreview(data.image || imagePreview);
      setMsg({ text: 'Profile saved. Changes fully reflect on next sign-in.', ok: true });
    } else {
      setMsg({ text: data.error || 'Failed to save', ok: false });
    }
    setSaving(false);
  }

  const inp = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100';

  return (
    <AdminLayout title="My Profile">
      <form onSubmit={handleSave} className="max-w-lg mx-auto space-y-6">

        {/* Avatar */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-5">Profile Picture</h3>
          <div className="flex items-center gap-5">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover border-2 border-sky-200 shadow"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-600 text-3xl font-bold text-white shadow">
                {(profile?.name || profile?.email || 'A')[0].toUpperCase()}
              </div>
            )}
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Choose Photo
              </button>
              <p className="mt-1.5 text-xs text-slate-400">JPG, PNG or WebP — max 5 MB</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Account Info</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={inp}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className={inp}
            />
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5">
            <p className="text-xs text-slate-500">
              Role: <span className="font-semibold text-slate-700 capitalize">{profile?.role || 'admin'}</span>
            </p>
          </div>
        </div>

        {/* Change Password */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Change Password</h3>
          <p className="text-xs text-slate-400 -mt-1">Leave blank to keep your current password</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className={inp}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              className={inp}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
        </div>

        {msg.text && (
          <p className={`rounded-xl px-4 py-3 text-sm font-medium ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {msg.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-sky-600 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </AdminLayout>
  );
}
