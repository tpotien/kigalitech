import { useState, useEffect, useRef } from 'react';
import { useSession, signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useLang } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import ReferralCard from '../components/ReferralCard';
import VerifiedBadge from '../components/VerifiedBadge';
import AvatarWithBadge from '../components/AvatarWithBadge';
import { usePushNotification } from '../hooks/usePushNotification';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-red-50 text-primary',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-600',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const REPAIR_STATUS_COLORS = {
  open: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-500',
};

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl transition-transform hover:scale-110 focus:outline-none"
        >
          <span className={(hover || value) >= star ? 'text-amber-400' : 'text-slate-200'}>★</span>
        </button>
      ))}
      {value > 0 && (
        <span className="ml-1.5 text-sm font-medium text-amber-500">
          {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][value]}
        </span>
      )}
    </div>
  );
}

function ReviewForm({ item, orderId, onDone }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!rating) { setMsg('Please select a star rating.'); return; }
    setSaving(true);
    setMsg('');
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: item.productId, rating, title, body }),
    });
    const data = await res.json();
    if (res.ok) { onDone(item.productId); }
    else { setMsg(data.error || 'Failed to submit review'); }
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="mt-3 rounded-2xl border border-amber-100 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4 space-y-3">
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Rate <span className="text-primary text-primary">{item.name}</span></p>
      <StarRating value={rating} onChange={setRating} />
      <input
        required
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Review title (e.g. Amazing product!)"
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-sky-800"
      />
      <textarea
        required
        rows={3}
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Share your experience with this product..."
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-3 py-2 text-sm resize-none focus:border-primary focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-sky-800"
      />
      {msg && <p className="text-xs text-red-500">{msg}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {saving ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}

const TRADEIN_STATUS = {
  pending:     { label: 'Under Review',       color: 'bg-slate-100 text-slate-600',     icon: '⏳' },
  offer_made:  { label: 'Offer Received',     color: 'bg-red-50 text-primary',         icon: '💬' },
  negotiating: { label: 'Awaiting Response',  color: 'bg-violet-100 text-violet-700',   icon: '🔄' },
  accepted:    { label: 'Deal Accepted',      color: 'bg-emerald-100 text-emerald-700', icon: '✅' },
  rejected:    { label: 'Not Accepted',       color: 'bg-red-100 text-red-700',         icon: '❌' },
  confirmed:   { label: 'Confirmed — Coupon Ready!', color: 'bg-emerald-600 text-white', icon: '🎉' },
  completed:   { label: 'Completed',          color: 'bg-slate-600 text-white',         icon: '✓' },
};

// Tier rules: admin=Platinum, staff=Gold, regular users capped at Silver
function LoyaltyTierCard({ points, role }) {
  const ALL_TIERS = [
    { name: 'Bronze',   icon: '🥉', min: 0,     max: 999,      color: 'from-amber-600 to-amber-700',   bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-200 dark:border-amber-800',   perks: ['1 pt per RWF 1,000 spent', 'Member discounts'] },
    { name: 'Silver',   icon: '🥈', min: 1000,  max: 4999,     color: 'from-slate-400 to-slate-500',   bg: 'bg-slate-50 dark:bg-slate-800/50',   border: 'border-slate-200 dark:border-slate-600',   perks: ['1.5 pts per RWF 1,000', 'Free standard delivery', 'Early sale access'] },
    { name: 'Gold',     icon: '🥇', min: 5000,  max: 14999,    color: 'from-yellow-400 to-amber-500',  bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-700', perks: ['2 pts per RWF 1,000', 'Free delivery always', 'Priority support', 'Birthday bonus'] },
    { name: 'Platinum', icon: '💎', min: 15000, max: Infinity,  color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-700', perks: ['3 pts per RWF 1,000', '5% extra discount', 'Dedicated account manager', 'VIP events'] },
  ];

  const tiers = role === 'admin'
    ? ALL_TIERS
    : role === 'staff'
      ? ALL_TIERS.slice(0, 3)   // Bronze → Silver → Gold (staff max)
      : ALL_TIERS.slice(0, 2);  // Bronze → Silver (regular user max)

  const effectivePoints = role === 'admin'
    ? Math.max(points, 15000)   // admin always Platinum
    : role === 'staff'
      ? Math.max(points, 5000)  // staff always Gold
      : points;

  const current = tiers.find(t => effectivePoints >= t.min && effectivePoints <= t.max) || tiers[tiers.length - 1];
  const nextTier = tiers[tiers.indexOf(current) + 1] || null;
  const progress = nextTier ? Math.min(100, Math.round(((effectivePoints - current.min) / (nextTier.min - current.min)) * 100)) : 100;

  return (
    <div className={`rounded-2xl border ${current.border} ${current.bg} p-5 mb-6`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Loyalty Status</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl">{current.icon}</span>
            <span className={`text-2xl font-extrabold bg-gradient-to-r ${current.color} bg-clip-text text-transparent`}>{current.name}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{points.toLocaleString()}</p>
          <p className="text-xs text-slate-500">points</p>
        </div>
      </div>
      {nextTier && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>{current.name}</span>
            <span>{nextTier.min - points} pts to {nextTier.name} {nextTier.icon}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${current.color} transition-all duration-700`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {!nextTier && (
        <p className="text-sm font-semibold text-violet-700 dark:text-violet-300 mb-4">🎉 You&apos;ve reached the highest tier!</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {current.perks.map(perk => (
          <div key={perk} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            <svg className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            {perk}
          </div>
        ))}
      </div>
    </div>
  );
}

function AddressBook() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ label: 'Home', name: '', phone: '', address: '', isDefault: false });
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/account/addresses')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAddresses(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true); setMsg('');
    const r = await fetch('/api/account/addresses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await r.json();
    if (r.ok) {
      setAddresses(prev => form.isDefault ? [data, ...prev.map(a => ({ ...a, isDefault: false }))] : [...prev, data]);
      setForm({ label: 'Home', name: '', phone: '', address: '', isDefault: false });
      setMsg('Address saved!');
    } else setMsg(data.error || 'Failed');
    setAdding(false);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this address?')) return;
    await fetch('/api/account/addresses', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setAddresses(prev => prev.filter(a => a.id !== id));
  }

  async function setDefault(id) {
    await fetch('/api/account/addresses', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isDefault: true }) });
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
  }

  const inp = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-red-100';

  return (
    <div className="space-y-6">
      {/* Saved addresses */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Saved Addresses</h2>
        {loading ? <div className="text-slate-400 text-sm">Loading…</div> : addresses.length === 0 ? (
          <p className="text-sm text-slate-400">No saved addresses yet. Add one below.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {addresses.map(addr => (
              <div key={addr.id} className={`rounded-2xl border p-4 ${addr.isDefault ? 'border-primary bg-sky-50 bg-red-50' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-primary uppercase">{addr.label}</span>
                  {addr.isDefault && <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Default</span>}
                </div>
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{addr.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{addr.phone}</p>
                <p className="text-xs text-slate-400 mt-0.5">{addr.address}</p>
                <div className="flex gap-2 mt-3">
                  {!addr.isDefault && (
                    <button onClick={() => setDefault(addr.id)} className="text-xs font-semibold text-primary hover:text-primary">Set default</button>
                  )}
                  <button onClick={() => handleDelete(addr.id)} className="text-xs font-semibold text-red-500 hover:text-red-700 ml-auto">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add address form */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Add New Address</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Label</label>
              <select value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className={inp}>
                {['Home', 'Work', 'Other'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inp} placeholder="Full name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Phone *</label>
              <input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inp} placeholder="+250 7XX XXX XXX" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Address *</label>
              <input required value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inp} placeholder="Street, area, city" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} className="rounded" />
            Set as default address
          </label>
          {msg && <p className={`text-sm ${msg.includes('Failed') || msg.includes('error') ? 'text-red-600' : 'text-emerald-600'}`}>{msg}</p>}
          <button type="submit" disabled={adding} className="rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold px-6 py-2.5 text-sm">
            {adding ? 'Saving…' : 'Save Address'}
          </button>
        </form>
      </div>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
    >
      {copied ? '✓ Copied!' : 'Copy Code'}
    </button>
  );
}

const TAB_MAP = { repairs: 'repairs', 'trade-ins': 'trade-ins', tradein: 'trade-ins', wishlist: 'wishlist', profile: 'profile', orders: 'orders' };

export default function AccountPage() {
  const { data: session, status } = useSession();
  const { t } = useLang();
  const { format } = useCurrency();
  const router = useRouter();
  const { ids: wishlistIds, toggle: toggleWishlist } = useWishlist();
  const { add: addToCart } = useCart();
  const push = usePushNotification();
  const [reorderingId, setReorderingId] = useState(null);
  const [tab, setTab] = useState('orders');
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [tradeIns, setTradeIns] = useState([]);
  const [loadingTradeIns, setLoadingTradeIns] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [form, setForm] = useState({ productName: '', issue: '', description: '', priority: 'normal', orderId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [repairImages, setRepairImages] = useState([]); // [{dataUrl, url}]
  const [uploadingImg, setUploadingImg] = useState(false);
  const [repairAction, setRepairAction] = useState({}); // {[id]: 'loading'}
  const repairImgRef = useRef();
  const [profileName, setProfileName] = useState('');
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [profileImageDataUrl, setProfileImageDataUrl] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: '', ok: false });
  const photoRef = useRef();

  // Delivery confirmation state
  const [confirmingId, setConfirmingId] = useState(null);
  const [reviewingOrderId, setReviewingOrderId] = useState(null);
  const [reviewedProducts, setReviewedProducts] = useState(new Set());

  // Trade-in negotiation state
  const [tradeInAction, setTradeInAction] = useState({}); // { [id]: 'loading' | 'counter' }
  const [counterAmounts, setCounterAmounts] = useState({});
  const [counterNotes, setCounterNotes] = useState({});
  const [tradeInMsg, setTradeInMsg] = useState({});

  // Badge state
  const [badgeInfo, setBadgeInfo] = useState({ verifiedBuyer: false, role: null });

  // Loyalty points state
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  // Read ?tab= from URL (e.g. from /repairs → /account?tab=repairs)
  useEffect(() => {
    const t = router.query.tab;
    const hash = window.location.hash.replace('#', '');
    const key = t || hash;
    if (key && TAB_MAP[key]) setTab(TAB_MAP[key]);
  }, [router.query.tab]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    setLoadingOrders(true);
    fetch('/api/account/orders').then(r => r.json()).then(data => { setOrders(Array.isArray(data) ? data : []); setLoadingOrders(false); });
    setProfileName(session?.user?.name || '');
    setProfileImagePreview(session?.user?.image || null);
    fetch('/api/account/badge').then(r => r.ok ? r.json() : null).then(data => { if (data) setBadgeInfo(data); });
    fetch('/api/loyalty/balance').then(r => r.ok ? r.json() : null).then(data => { if (data?.points !== undefined) setLoyaltyPoints(data.points); });
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated' || tab !== 'repairs') return;
    setLoadingTickets(true);
    fetch('/api/repairs').then(r => r.json()).then(data => { setTickets(Array.isArray(data) ? data : []); setLoadingTickets(false); }).catch(() => setLoadingTickets(false));
  }, [status, tab]);

  useEffect(() => {
    if (status !== 'authenticated' || tab !== 'wishlist') return;
    setLoadingWishlist(true);
    fetch('/api/account/wishlist').then(r => r.json()).then(data => { setWishlistItems(Array.isArray(data) ? data : []); setLoadingWishlist(false); }).catch(() => setLoadingWishlist(false));
  }, [status, tab]);

  useEffect(() => {
    if (status !== 'authenticated' || tab !== 'trade-ins') return;
    setLoadingTradeIns(true);
    fetch('/api/account/trade-ins').then(r => r.json()).then(data => { setTradeIns(Array.isArray(data) ? data : []); setLoadingTradeIns(false); });
  }, [status, tab]);

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 256;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setProfileImageDataUrl(dataUrl);
        setProfileImagePreview(dataUrl);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ text: '', ok: false });
    const payload = {};
    if (profileName !== (session?.user?.name || '')) payload.name = profileName;
    if (profileImageDataUrl) payload.imageDataUrl = profileImageDataUrl;
    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      setProfileImageDataUrl(null);
      if (data.image) setProfileImagePreview(data.image);
      setProfileMsg({ text: 'Profile updated!', ok: true });
      // Force session to refresh so navbar/avatar update immediately
      await getSession();
      window.location.reload();
    } else {
      setProfileMsg({ text: data.error || 'Failed to update', ok: false });
    }
    setSavingProfile(false);
  }

  async function handleReorder(order) {
    setReorderingId(order.id);
    const items = order.items || [];
    for (const item of items) {
      addToCart({
        id: item.productId || item.id,
        name: item.name,
        price: item.price,
        image: item.image || '',
        color: item.color || '',
        storage: item.storage || '',
        quantity: item.quantity || 1,
      });
    }
    await new Promise(r => setTimeout(r, 600));
    setReorderingId(null);
  }

  async function confirmReceipt(orderId) {
    setConfirmingId(orderId);
    const res = await fetch(`/api/account/orders/${orderId}/confirm`, { method: 'POST' });
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === orderId
        ? { ...o, customerConfirmed: true, status: o.status === 'shipped' ? 'delivered' : o.status }
        : o
      ));
      setReviewingOrderId(orderId);
    }
    setConfirmingId(null);
  }

  function handleReviewDone(productId) {
    setReviewedProducts(prev => new Set([...prev, productId]));
  }

  async function respondTradeIn(id, action) {
    setTradeInAction(prev => ({ ...prev, [id]: 'loading' }));
    setTradeInMsg(prev => ({ ...prev, [id]: '' }));
    const body = { action };
    if (action === 'counter') {
      const amt = parseFloat(counterAmounts[id] || '0');
      if (!amt || amt <= 0) {
        setTradeInMsg(prev => ({ ...prev, [id]: 'Please enter a valid counter amount' }));
        setTradeInAction(prev => ({ ...prev, [id]: null }));
        return;
      }
      body.counterPrice = Math.round(amt * 100);
      body.userNotes = counterNotes[id] || '';
    }
    const res = await fetch(`/api/account/trade-ins/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      setTradeIns(prev => prev.map(t => t.id === id ? data : t));
      setTradeInMsg(prev => ({ ...prev, [id]: action === 'accept' ? '✓ Offer accepted!' : action === 'reject' ? 'Trade-in declined.' : '✓ Counter-offer sent!' }));
      setCounterAmounts(prev => ({ ...prev, [id]: '' }));
      setCounterNotes(prev => ({ ...prev, [id]: '' }));
    } else {
      setTradeInMsg(prev => ({ ...prev, [id]: data.error || 'Something went wrong' }));
    }
    setTradeInAction(prev => ({ ...prev, [id]: null }));
  }

  async function handleRepairImageAdd(e) {
    const file = e.target.files[0];
    if (!file || repairImages.length >= 3) return;
    setUploadingImg(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      const res = await fetch('/api/repairs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      });
      const result = await res.json();
      if (res.ok) setRepairImages(prev => [...prev, { dataUrl, url: result.url }]);
      setUploadingImg(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function submitRepair(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg('');
    const res = await fetch('/api/repairs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, deviceImages: repairImages.map(img => img.url) }),
    });
    const data = await res.json();
    if (res.ok) {
      setSubmitMsg('Repair request submitted! We will review and send you a cost quote.');
      setTickets(prev => [data, ...prev]);
      setForm({ productName: '', issue: '', description: '', priority: 'normal', orderId: '' });
      setRepairImages([]);
    } else {
      setSubmitMsg(data.error || 'Failed to submit');
    }
    setSubmitting(false);
  }

  async function respondRepair(id, action) {
    setRepairAction(prev => ({ ...prev, [id]: 'loading' }));
    const res = await fetch(`/api/repairs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (res.ok) setTickets(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    setRepairAction(prev => ({ ...prev, [id]: null }));
  }

  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated' || !session) {
    if (typeof window !== 'undefined') window.location.replace('/signin?callbackUrl=/account');
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }


  return (
    <Layout>
      <div className="max-w-container mx-auto px-4 lg:px-6 py-10">

        {/* Breadcrumb */}
        <nav className="text-sm text-ex-muted flex items-center gap-2 mb-10">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-ex-text font-medium">My Account</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* ── Exclusive sidebar ── */}
          <aside className="lg:w-64 flex-shrink-0 w-full">
            {/* Welcome */}
            <div className="mb-6">
              <p className="text-sm text-ex-muted mb-0.5">Hello,</p>
              <p className="font-semibold text-ex-text text-lg">{session.user.name || 'Customer'}</p>
            </div>

            {/* Sidebar nav groups */}
            <nav className="space-y-1">
              <p className="text-sm font-semibold text-ex-text mb-2">Manage My Account</p>
              {[
                { id: 'profile',   label: 'My Profile' },
                { id: 'addresses', label: 'Address Book' },
              ].map(item => (
                <button key={item.id} onClick={() => setTab(item.id)}
                  className={`block w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    tab === item.id ? 'text-primary font-medium' : 'text-ex-muted hover:text-primary'
                  }`}>
                  {item.label}
                </button>
              ))}

              <p className="text-sm font-semibold text-ex-text mt-5 mb-2 pt-4 border-t border-ex-border">My Orders</p>
              {[
                { id: 'orders',   label: 'My Orders' },
                { id: 'repairs',  label: 'Repair Tickets' },
                { id: 'trade-ins',label: 'Trade-Ins' },
              ].map(item => (
                <button key={item.id} onClick={() => setTab(item.id)}
                  className={`block w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    tab === item.id ? 'text-primary font-medium' : 'text-ex-muted hover:text-primary'
                  }`}>
                  {item.label}
                </button>
              ))}

              <p className="text-sm font-semibold text-ex-text mt-5 mb-2 pt-4 border-t border-ex-border">Other</p>
              <button onClick={() => setTab('wishlist')}
                className={`block w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                  tab === 'wishlist' ? 'text-primary font-medium' : 'text-ex-muted hover:text-primary'
                }`}>
                My Wishlist {wishlistIds.size > 0 ? `(${wishlistIds.size})` : ''}
              </button>
            </nav>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">

          {/* ── Wishlist Tab ── */}
          {tab === 'wishlist' && (
            <div>
              {loadingWishlist ? (
                <div className="flex justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : wishlistItems.length === 0 ? (
                <div className="rounded-3xl bg-white dark:bg-slate-900 p-16 text-center shadow-sm">
                  <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <p className="mt-4 text-slate-500 dark:text-slate-400">Your wishlist is empty</p>
                  <Link href="/products" className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">Browse Products</Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {wishlistItems.map(item => {
                    const product = item.product;
                    const images = (() => { try { return JSON.parse(product.images); } catch { return []; } })();
                    const discount = product.comparePrice && product.comparePrice > product.price
                      ? Math.round((1 - product.price / product.comparePrice) * 100)
                      : null;
                    return (
                      <div key={item.id} className="flex gap-4 rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-shadow">
                        <Link href={`/products/${product.id}`} className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 block">
                          {images[0] && <img src={images[0]} alt={product.name} className="h-full w-full object-cover" />}
                        </Link>
                        <div className="flex flex-1 flex-col justify-between min-w-0">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{product.category}</p>
                            <Link href={`/products/${product.id}`} className="font-semibold text-slate-900 dark:text-slate-100 no-underline hover:text-primary line-clamp-2 text-sm mt-0.5 block">
                              {product.name}
                            </Link>
                          </div>
                          <div className="flex items-center justify-between mt-2 gap-2">
                            <div>
                              <span className="font-bold text-slate-900 dark:text-slate-100">{format(product.price)}</span>
                              {discount && <span className="ml-1.5 text-[10px] font-bold text-red-500">-{discount}%</span>}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={async () => {
                                  await toggleWishlist(product.id);
                                  setWishlistItems(prev => prev.filter(i => i.product.id !== product.id));
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                title="Remove from wishlist"
                              >
                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              </button>
                              <Link
                                href={`/products/${product.id}`}
                                className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white no-underline hover:bg-primary-hover"
                              >
                                View
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Trade-Ins Tab ── */}
          {tab === 'trade-ins' && (
            <div className="space-y-4">
              {loadingTradeIns ? (
                <div className="flex justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : tradeIns.length === 0 ? (
                <div className="rounded-3xl bg-white dark:bg-slate-900 p-16 text-center shadow-sm">
                  <div className="mx-auto mb-4 text-5xl">♻️</div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No trade-in requests yet</h3>
                  <p className="mt-2 text-slate-500 dark:text-slate-400">Submit your used device to get a coupon towards your next purchase.</p>
                  <Link href="/trade-in" className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover no-underline">
                    Start a Trade-In
                  </Link>
                </div>
              ) : (
                tradeIns.map(ti => {
                  const meta = TRADEIN_STATUS[ti.status] || TRADEIN_STATUS.pending;
                  const isCountering = tradeInAction[ti.id] === 'counter';
                  const isLoading = tradeInAction[ti.id] === 'loading';
                  const msg = tradeInMsg[ti.id];

                  return (
                    <div key={ti.id} className={`rounded-3xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden border ${ti.status === 'offer_made' ? 'border-sky-200 ' : 'border-transparent dark:border-slate-800'}`}>
                      {/* Header */}
                      <div className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{ti.productName}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {ti.brand && `${ti.brand} · `}
                              {ti.condition} condition · Submitted {new Date(ti.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${meta.color}`}>
                            {meta.icon} {meta.label}
                          </span>
                        </div>

                        {/* Price row */}
                        <div className="mt-3 flex flex-wrap gap-3 text-sm">
                          {ti.askingPrice > 0 && (
                            <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-slate-600 dark:text-slate-300">
                              Your price: <span className="font-semibold">{format(ti.askingPrice)}</span>
                            </span>
                          )}
                          {ti.offeredPrice > 0 && (
                            <span className="rounded-lg bg-sky-50 bg-red-50 px-2.5 py-1 text-primary text-primary">
                              Our offer: <span className="font-semibold">{format(ti.offeredPrice)}</span>
                            </span>
                          )}
                          {ti.counterPrice > 0 && (
                            <span className="rounded-lg bg-violet-50 dark:bg-violet-900/20 px-2.5 py-1 text-violet-700 dark:text-violet-300">
                              Your counter: <span className="font-semibold">{format(ti.counterPrice)}</span>
                            </span>
                          )}
                          {ti.finalPrice > 0 && (
                            <span className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 text-emerald-700 dark:text-emerald-300">
                              Agreed: <span className="font-bold">{format(ti.finalPrice)}</span>
                            </span>
                          )}
                        </div>

                        {/* Admin message */}
                        {ti.adminNotes && (
                          <div className="mt-3 rounded-xl bg-sky-50 bg-red-50 border border-sky-100  px-4 py-3">
                            <p className="text-xs font-semibold text-primary mb-0.5">Message from KigaliTech</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{ti.adminNotes}</p>
                          </div>
                        )}

                        {/* Feedback */}
                        {msg && (
                          <div className={`mt-3 rounded-xl px-4 py-2.5 text-sm font-medium ${msg.startsWith('✓') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                            {msg}
                          </div>
                        )}
                      </div>

                      {/* Offer actions — only when offer is awaiting response */}
                      {ti.status === 'offer_made' && !msg?.startsWith('✓') && (
                        <div className="border-t border-sky-100  bg-sky-50/30 dark:bg-sky-900/10 px-5 pb-5">
                          <div className="pt-4 mb-3">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">We're offering <span className="text-primary text-primary">{format(ti.offeredPrice)}</span> for your {ti.productName}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Accept to proceed, counter with your price, or decline</p>
                          </div>

                          {!isCountering ? (
                            <div className="flex flex-wrap gap-2">
                              <button
                                disabled={isLoading}
                                onClick={() => respondTradeIn(ti.id, 'accept')}
                                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {isLoading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : '✓'}
                                Accept {format(ti.offeredPrice)}
                              </button>
                              <button
                                disabled={isLoading}
                                onClick={() => setTradeInAction(prev => ({ ...prev, [ti.id]: 'counter' }))}
                                className="rounded-full border border-violet-300 bg-violet-50 px-5 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50"
                              >
                                Counter Offer
                              </button>
                              <button
                                disabled={isLoading}
                                onClick={() => respondTradeIn(ti.id, 'reject')}
                                className="rounded-full border border-slate-200 dark:border-slate-700 px-5 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={counterAmounts[ti.id] || ''}
                                  onChange={e => setCounterAmounts(prev => ({ ...prev, [ti.id]: e.target.value }))}
                                  placeholder="Your counter amount"
                                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-sky-800"
                                />
                              </div>
                              <textarea
                                rows={2}
                                value={counterNotes[ti.id] || ''}
                                onChange={e => setCounterNotes(prev => ({ ...prev, [ti.id]: e.target.value }))}
                                placeholder="Add a note (optional)"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-3 py-2 text-sm resize-none focus:border-primary focus:outline-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  disabled={isLoading}
                                  onClick={() => respondTradeIn(ti.id, 'counter')}
                                  className="rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1.5"
                                >
                                  {isLoading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                                  Send Counter
                                </button>
                                <button
                                  onClick={() => setTradeInAction(prev => ({ ...prev, [ti.id]: null }))}
                                  className="rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Negotiating — waiting state */}
                      {ti.status === 'negotiating' && (
                        <div className="border-t border-violet-100 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-900/10 px-5 py-4">
                          <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                            🔄 Your counter-offer of <strong>{format(ti.counterPrice)}</strong> has been sent. Waiting for KigaliTech's response.
                          </p>
                        </div>
                      )}

                      {/* Coupon — confirmed! */}
                      {ti.status === 'confirmed' && ti.couponCode && (
                        <div className="border-t border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-5 py-5">
                          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-3">🎉 Your trade-in is confirmed! Here's your coupon:</p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="rounded-xl border-2 border-dashed border-emerald-400 bg-white dark:bg-slate-900 px-4 py-3">
                              <p className="text-xs text-emerald-600 font-semibold mb-0.5">Coupon Code</p>
                              <p className="font-mono text-xl font-bold text-emerald-800 tracking-wider">{ti.couponCode}</p>
                              <p className="text-xs text-emerald-600 mt-0.5">Value: {format(ti.finalPrice)} off</p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <CopyButton text={ti.couponCode} />
                              <Link
                                href={`/checkout?coupon=${ti.couponCode}`}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 no-underline text-center"
                              >
                                Apply at Checkout →
                              </Link>
                            </div>
                          </div>
                          <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-400">Single use · Valid for your next order · No minimum spend</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Orders Tab ── */}
          {tab === 'orders' && (
            <div className="space-y-4">
              <LoyaltyTierCard points={loyaltyPoints || session?.user?.loyaltyPoints || 0} role={session?.user?.role} />
              {loadingOrders ? (
                <div className="flex justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : orders.length === 0 ? (
                <div className="rounded-3xl bg-white dark:bg-slate-900 p-16 text-center shadow-sm">
                  <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="mt-4 text-slate-500 dark:text-slate-400">{t('noOrders')}</p>
                  <Link href="/products" className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">{t('shopNow')}</Link>
                </div>
              ) : (
                orders.map(order => {
                  const canConfirm = !order.customerConfirmed && ['shipped', 'delivered'].includes(order.status);
                  const showReview = order.customerConfirmed && reviewingOrderId === order.id;
                  const unreviewedItems = (order.items || []).filter(it => !reviewedProducts.has(it.productId));

                  return (
                    <div key={order.id} className="rounded-3xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                      <div className="p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">Order #{order.id}</p>
                            <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {order.customerConfirmed && (
                              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                Received
                              </span>
                            )}
                            <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600'}`}>
                              {order.status}
                            </span>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{format(order.total)}</p>
                          </div>
                        </div>

                        {order.items?.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {order.items.map((item, i) => (
                              <span key={i} className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-600 dark:text-slate-300">
                                {item.name} × {item.quantity}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link
                            href={`/orders/${order.id}`}
                            className="rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 no-underline"
                          >
                            {t('viewDetails')}
                          </Link>
                          <button
                            onClick={() => handleReorder(order)}
                            disabled={reorderingId === order.id}
                            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60 flex items-center gap-1.5 transition"
                          >
                            {reorderingId === order.id ? (
                              <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Adding…</>
                            ) : (
                              <><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Reorder</>
                            )}
                          </button>
                          <Link
                            href={`/orders/${order.id}/receipt`}
                            className="rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 no-underline flex items-center gap-1.5"
                          >
                            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Receipt
                          </Link>

                          {/* Confirm Receipt button */}
                          {canConfirm && (
                            <button
                              onClick={() => confirmReceipt(order.id)}
                              disabled={confirmingId === order.id}
                              className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {confirmingId === order.id ? (
                                <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Confirming...</>
                              ) : (
                                <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> I Received This Order</>
                              )}
                            </button>
                          )}

                          {/* Write a review trigger */}
                          {order.customerConfirmed && !showReview && unreviewedItems.length > 0 && (
                            <button
                              onClick={() => setReviewingOrderId(order.id)}
                              className="rounded-full border border-amber-300 bg-amber-50 px-5 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 flex items-center gap-1.5"
                            >
                              <span>★</span> Write a Review
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Review section — expands after confirmation or clicking */}
                      {showReview && unreviewedItems.length > 0 && (
                        <div className="border-t border-amber-100 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10 px-5 pb-5">
                          <div className="pt-4 mb-3">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                              <span className="text-amber-400 text-lg">★</span>
                              How was your order? Share your experience
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">Your verified review helps other customers</p>
                          </div>
                          <div className="space-y-3">
                            {unreviewedItems.map(item => (
                              <ReviewForm
                                key={item.productId}
                                item={item}
                                orderId={order.id}
                                onDone={handleReviewDone}
                              />
                            ))}
                          </div>
                          {unreviewedItems.length === 0 && (
                            <p className="py-4 text-sm text-emerald-700 font-medium">All products reviewed — thank you!</p>
                          )}
                        </div>
                      )}

                      {/* All reviewed confirmation */}
                      {showReview && unreviewedItems.length === 0 && (
                        <div className="border-t border-emerald-100 bg-emerald-50/40 px-5 py-4">
                          <p className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Thank you for your reviews!
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Addresses Tab ── */}
          {tab === 'addresses' && <AddressBook />}

          {/* ── Profile Tab ── */}
          {tab === 'profile' && (
            <div className="space-y-5">
            <ReferralCard />
            <form onSubmit={saveProfile} className="space-y-5">
              <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm">
                <h2 className="mb-5 text-lg font-bold text-slate-900 dark:text-slate-100">Profile Picture</h2>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
                  <AvatarWithBadge
                    image={profileImagePreview}
                    name={session.user.name}
                    role={session.user.role}
                    emailVerified={session.user.emailVerified}
                    size="2xl"
                  />
                  <div className="text-center sm:text-left">
                    <button
                      type="button"
                      onClick={() => photoRef.current?.click()}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Change Photo
                    </button>
                    <p className="mt-1.5 text-xs text-slate-400">JPG, PNG or WebP · auto-resized to 256px</p>
                    <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">Your Info</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Display Name</label>
                    <input
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-sky-800"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                    <input
                      value={session.user.email || ''}
                      disabled
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {profileMsg.text && (
                <p className={`rounded-xl px-4 py-3 text-sm font-medium ${profileMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {profileMsg.text}
                </p>
              )}

              <button type="submit" disabled={savingProfile} className="rounded-full bg-primary px-7 py-3 font-semibold text-white hover:bg-primary-hover disabled:opacity-50">
                {savingProfile ? 'Saving…' : 'Save Profile'}
              </button>
            </form>

            {push.supported && (
              <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Order Notifications</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {push.subscribed ? 'You\'ll be notified when your order status changes.' : 'Get notified about order updates, delivery status, and more.'}
                  </p>
                </div>
                <button
                  onClick={push.subscribed ? push.unsubscribe : push.subscribe}
                  disabled={push.loading}
                  className={`flex-shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-all disabled:opacity-50 ${
                    push.subscribed
                      ? 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                      : 'bg-primary text-white hover:bg-primary-hover shadow-sm'
                  }`}
                >
                  {push.loading ? '…' : push.subscribed ? 'Turn Off' : 'Enable'}
                </button>
              </div>
            )}
            </div>
          )}

          {/* ── Repair Tickets Tab ── */}
          {tab === 'repairs' && (
            <div className="space-y-6">
              {/* Submit form */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                    <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-slate-100">{t('submitRepair')}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Send us your device details and photos — we'll quote you a price</p>
                  </div>
                </div>
                <form onSubmit={submitRepair} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t('productName')} *</label>
                      <input required value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} placeholder="e.g. iPhone 15 Pro"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-sky-800" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t('issue')} *</label>
                      <input required value={form.issue} onChange={e => setForm({ ...form, issue: e.target.value })} placeholder="e.g. Cracked screen, won't charge"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-sky-800" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t('description')}</label>
                    <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the problem in detail — when it started, what happened, etc."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-sky-800 resize-none" />
                  </div>

                  {/* Device photo upload */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Device Photos <span className="font-normal text-slate-400">(up to 3 — helps us quote accurately)</span>
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {repairImages.map((img, i) => (
                        <div key={i} className="group relative h-24 w-24 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                          <img src={img.dataUrl} alt="" className="h-full w-full object-cover" />
                          <button type="button" onClick={() => setRepairImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                      {repairImages.length < 3 && (
                        <button type="button" onClick={() => repairImgRef.current?.click()}
                          disabled={uploadingImg}
                          className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:border-primary hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all disabled:opacity-50">
                          {uploadingImg
                            ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            : <>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <span className="text-[11px] font-semibold">Add Photo</span>
                              </>
                          }
                        </button>
                      )}
                    </div>
                    <input ref={repairImgRef} type="file" accept="image/*" className="hidden" onChange={handleRepairImageAdd} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t('priority')}</label>
                      <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-sky-800">
                        <option value="low">Low — Not urgent</option>
                        <option value="normal">Normal</option>
                        <option value="high">High — Within a few days</option>
                        <option value="urgent">Urgent — ASAP</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Order ID (if purchased from us)</label>
                      <input value={form.orderId} onChange={e => setForm({ ...form, orderId: e.target.value })} placeholder="Optional" type="number"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-sky-800" />
                    </div>
                  </div>

                  {submitMsg && (
                    <p className={`rounded-xl px-4 py-3 text-sm font-medium ${submitMsg.includes('submitted') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>{submitMsg}</p>
                  )}
                  <button type="submit" disabled={submitting || uploadingImg}
                    className="rounded-full bg-primary px-8 py-3 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50 shadow-md shadow-sky-100 transition-all active:scale-95">
                    {submitting ? 'Submitting...' : 'Submit Repair Request'}
                  </button>
                </form>
              </div>

              {/* Tickets list */}
              {loadingTickets ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : tickets.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 px-1">My Repair Requests</h2>
                  {tickets.map(ticket => {
                    const imgs = (() => { try { return JSON.parse(ticket.deviceImages || '[]'); } catch { return []; } })();
                    const isLoading = repairAction[ticket.id] === 'loading';
                    return (
                      <div key={ticket.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                        {/* Header */}
                        <div className="flex flex-wrap items-start justify-between gap-2 p-5 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">#{ticket.id} — {ticket.productName}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{ticket.issue}</p>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${REPAIR_STATUS_COLORS[ticket.status] || 'bg-slate-100 text-slate-600'}`}>
                              {ticket.status?.replace(/_/g, ' ')}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${PRIORITY_COLORS[ticket.priority] || 'bg-slate-100 text-slate-600'}`}>
                              {ticket.priority}
                            </span>
                          </div>
                        </div>

                        {/* Device photos */}
                        {imgs.length > 0 && (
                          <div className="px-5 pt-4 flex gap-2 flex-wrap">
                            {imgs.map((src, i) => (
                              <img key={i} src={src} alt="" className="h-16 w-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition" onClick={() => window.open(src, '_blank')} />
                            ))}
                          </div>
                        )}

                        {/* Quote card */}
                        {ticket.quotedCost > 0 && (
                          <div className={`mx-5 mt-4 rounded-2xl p-4 ${
                            ticket.quoteStatus === 'accepted' || ticket.quoteStatus === 'confirmed' ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800'
                            : ticket.quoteStatus === 'rejected' ? 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700'
                            : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                          }`}>
                            {ticket.quoteStatus === 'quoted' && (
                              <div className="flex items-center gap-2 mb-3">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400">
                                  <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                </span>
                                <p className="text-sm font-bold text-amber-800">You have a repair quote — please respond</p>
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Repair Quote</p>
                                <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">{format(ticket.quotedCost)}</p>
                                {ticket.quoteNotes && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{ticket.quoteNotes}</p>}
                              </div>
                              {ticket.quoteStatus === 'quoted' && (
                                <div className="flex gap-3">
                                  <button onClick={() => respondRepair(ticket.id, 'accept')} disabled={isLoading}
                                    className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-all active:scale-95">
                                    {isLoading ? '...' : '✓ Accept'}
                                  </button>
                                  <button onClick={() => respondRepair(ticket.id, 'reject')} disabled={isLoading}
                                    className="rounded-full border-2 border-red-200 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-all active:scale-95">
                                    Decline
                                  </button>
                                </div>
                              )}
                              {(ticket.quoteStatus === 'accepted' || ticket.quoteStatus === 'confirmed') && (
                                <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">✓ Accepted</span>
                              )}
                              {ticket.quoteStatus === 'rejected' && (
                                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500">Declined</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Admin notes */}
                        {ticket.adminNotes && (
                          <div className="mx-5 mt-3 rounded-xl bg-sky-50 bg-red-50 border border-sky-100  p-3">
                            <p className="text-xs font-bold text-primary mb-0.5">Message from KigaliTech</p>
                            <p className="text-sm text-sky-800 text-primary">{ticket.adminNotes}</p>
                          </div>
                        )}

                        <p className="px-5 py-4 text-xs text-slate-400">
                          Submitted {new Date(ticket.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          </div>{/* end flex-1 main */}
        </div>{/* end flex row */}
      </div>
    </Layout>
  );
}
