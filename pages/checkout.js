import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Layout from '../components/Layout';
import Footer from '../components/Footer';
import DeliverySlotPicker from '../components/DeliverySlotPicker';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLang } from '../context/LanguageContext';

// Defaults — overridden at runtime from SiteConfig
const DEFAULT_PHONE = '0786276555';
const DEFAULT_PHONE_DISPLAY = '+250 786 276 555';
const DEFAULT_WHATSAPP = '250786276555';

const PAYMENT_METHODS = [
  { id: 'momo',        label: 'Mobile Money (MTN / Airtel)', icon: '🇷🇼', desc: 'Send to our MoMo number — fast & easy', popular: true },
  { id: 'cash',        label: 'Cash on Delivery',            icon: '💵', desc: 'Pay cash when your order arrives' },
  { id: 'installment', label: 'Installment Plan',            icon: '📅', desc: 'Split over 3–12 months — contact us to arrange' },
];

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { format } = useCurrency();
  const { t } = useLang();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null); // { orderId }
  const [loyaltyPts, setLoyaltyPts] = useState(null);
  const [freeDeliveries, setFreeDeliveries] = useState(null); // { used, remaining, total }

  useEffect(() => {
    if (session) {
      fetch('/api/loyalty/balance').then(r => r.json()).then(d => setLoyaltyPts(d?.points ?? 0)).catch(() => {});
      fetch('/api/account/free-deliveries').then(r => r.json()).then(setFreeDeliveries).catch(() => {});
    }
  }, [session]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'momo',
    notes: '',
    useMpost: false,
    mpostPhone: '',
  });

  useEffect(() => {
    if (session?.user) {
      setForm(f => ({
        ...f,
        name: f.name || session.user.name || '',
        email: f.email || session.user.email || '',
      }));
      fetch('/api/account/addresses')
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setSavedAddresses(data); })
        .catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    if (!items.length) return;
    const cartIds = items.map(i => i.id);
    const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
    const cat = categories[0] || '';
    fetch(`/api/products?${cat ? `category=${encodeURIComponent(cat)}&` : ''}limit=8`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUpsellProducts(data.filter(p => !cartIds.includes(p.id) && p.stock > 0).slice(0, 4));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/signin?callbackUrl=/checkout');
  }, [status]);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [addressSaved, setAddressSaved] = useState(false);
  const [addressSaveLoading, setAddressSaveLoading] = useState(false);
  const [BUSINESS_PHONE, setBusinessPhone] = useState(DEFAULT_PHONE);
  const [BUSINESS_PHONE_DISPLAY, setBusinessPhoneDisplay] = useState(DEFAULT_PHONE_DISPLAY);
  const [WHATSAPP_NUMBER, setWhatsappNumber] = useState(DEFAULT_WHATSAPP);

  useEffect(() => {
    fetch('/api/admin/site-config')
      .then(r => r.json())
      .then(cfg => {
        if (cfg.phone) {
          const raw = cfg.phone.replace(/\s/g, '');
          setBusinessPhoneDisplay(cfg.phone);
          setWhatsappNumber(raw.startsWith('+') ? raw.slice(1) : raw);
          if (raw.startsWith('+250')) setBusinessPhone('0' + raw.slice(4));
          else if (raw.startsWith('250')) setBusinessPhone('0' + raw.slice(3));
          else setBusinessPhone(raw);
        }
        if (cfg.whatsappNumber) setWhatsappNumber(cfg.whatsappNumber);
      })
      .catch(() => {});
  }, []);
  const [upsellProducts, setUpsellProducts] = useState([]);
  const [addons, setAddons] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState({});
  const [storePickup, setStorePickup] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [deliverySlot, setDeliverySlot] = useState({ date: '', slot: '' });
  const [tvInstallation, setTvInstallation] = useState(false);
  const [tvInstallAddress, setTvInstallAddress] = useState('');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(null); // { code, discount, type, value }
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Store credit state
  const [storeCredit, setStoreCredit] = useState(0);
  const [useStoreCredit, setUseStoreCredit] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/account/credit')
        .then(r => r.json())
        .then(d => setStoreCredit(d.storeCredit || 0))
        .catch(() => {});
    }
  }, [session]);

  const hasTVItem = items.some(i => i.category === 'TVs' || i.name?.toLowerCase().includes('tv'));

  useEffect(() => {
    fetch('/api/products?category=Accessories&limit=6')
      .then(r => r.json())
      .then(data => setAddons(Array.isArray(data) ? data.filter(p => p.stock > 0).slice(0, 6) : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/delivery-zones')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length) {
          setDeliveryZones(data);
          setSelectedZoneId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), orderTotal: subtotal + addonTotal }),
      });
      const data = await res.json();
      if (!res.ok) { setCouponError(data.error || 'Invalid coupon'); return; }
      setCouponApplied({ code: data.coupon.code, discount: data.coupon.discount });
    } catch {
      setCouponError('Could not validate coupon');
    } finally {
      setCouponLoading(false);
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-800';

  const addonTotal = addons.filter(a => selectedAddons[a.id]).reduce((s, a) => s + a.price, 0);
  const selectedZone = deliveryZones.find(z => z.id === selectedZoneId) || null;
  const freeDeliveryEligible = !freeDeliveries || freeDeliveries.remaining > 0;
  const shipping = storePickup ? 0 : selectedZone ? selectedZone.fee : (freeDeliveryEligible ? 0 : (subtotal + addonTotal) >= 146000 ? 0 : 14730);
  const tvInstallFee = 0; // negotiable — priced separately after contact
  const couponDiscount = couponApplied?.discount || 0;
  const creditApplied = useStoreCredit ? Math.min(storeCredit, subtotal + addonTotal + shipping - couponDiscount) : 0;
  const total = Math.max(0, subtotal + addonTotal + shipping - couponDiscount - creditApplied);
  const isMomo = form.paymentMethod === 'momo';
  const isInstallment = form.paymentMethod === 'installment';

  function buildPayload(overrides = {}) {
    const addonItems = addons
      .filter(a => selectedAddons[a.id])
      .map(a => ({ id: a.id, productId: a.id, name: a.name, price: a.price, quantity: 1, color: '', storage: '', warranty: '1 Year' }));
    return {
      items: [
        ...items.map(i => ({ id: i.id, productId: i.id, name: i.name, price: i.price, quantity: i.quantity, color: i.color, storage: i.storage, warranty: i.warranty || '1 Year' })),
        ...addonItems,
      ],
      userId: session?.user?.id || undefined,
      shippingName: form.name,
      shippingEmail: form.email,
      shippingPhone: form.phone,
      shippingAddress: storePickup ? 'STORE_PICKUP:KigaliTech Store, Kigali' : form.useMpost ? `MPOST:${form.mpostPhone}` : form.address,
      mpostAddress: form.useMpost ? form.mpostPhone : '',
      paymentMethod: PAYMENT_METHODS.find(m => m.id === form.paymentMethod)?.label || form.paymentMethod,
      notes: form.notes,
      tvInstallation,
      tvInstallAddress: tvInstallation ? tvInstallAddress : '',
      currency: 'RWF',
      deliverySlot: deliverySlot.slot ? `${deliverySlot.date} ${deliverySlot.slot}` : '',
      deliveryDate: deliverySlot.date || '',
      couponCode: couponApplied?.code || undefined,
      useStoreCredit: creditApplied > 0,
      whatsappUpdates,
      ...overrides,
    };
  }

  const showSaveAddressPrompt = session?.user && !savedAddresses.length && form.name && form.phone && form.address && !form.useMpost;

  async function saveCurrentAddress() {
    setAddressSaveLoading(true);
    try {
      const res = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: 'Home', name: form.name, phone: form.phone, address: form.address, isDefault: true }),
      });
      if (res.ok) { setAddressSaved(true); setSavedAddresses([{ name: form.name, phone: form.phone, address: form.address }]); }
    } catch { /* silent */ } finally {
      setAddressSaveLoading(false);
    }
  }

  async function placeOrder(payload) {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Checkout failed');
    return data;
  }

  // For cash / installment — place order immediately
  async function handleSubmit(e) {
    e.preventDefault();
    if (!items.length || isMomo) return;
    if (isInstallment) {
      // Open WhatsApp for installment discussion
      const msg = `Hi KigaliTech! I'd like to arrange an installment plan for my order worth ${format(total)}. My name is ${form.name}, phone: ${form.phone}.`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const data = await placeOrder(buildPayload());
      clearCart();
      router.push(`/orders/${data.orderId}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  // For MoMo — show the payment popup first
  function handleMomoClick(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || (!storePickup && !form.useMpost && !form.address)) {
      setError('Please fill in all required fields above before proceeding to payment.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setError('');
    setShowPayModal(true);
  }

  // Called when user confirms payment in modal
  async function handleConfirmPayment() {
    setSubmitting(true);
    setError('');
    try {
      const data = await placeOrder(buildPayload({ paymentStatus: 'pending_confirmation' }));
      setOrderPlaced({ orderId: data.orderId });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  function handleModalClose() {
    if (orderPlaced) {
      clearCart();
      router.push(`/orders/${orderPlaced.orderId}?payment=momo_sent`);
    } else {
      setShowPayModal(false);
    }
  }

  if (status === 'loading') {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  if (!items.length) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
          <div className="text-5xl">🛒</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Your cart is empty</h1>
          <Link href="/" className="rounded-full bg-primary px-7 py-3 font-semibold text-white hover:bg-primary-hover no-underline">
            Continue Shopping
          </Link>
        </div>
        <Footer />
      </Layout>
    );
  }

  const waMsg = encodeURIComponent(
    `Hi KigaliTech! I've just sent ${format(total)} to ${BUSINESS_PHONE_DISPLAY} for my order.\nName: ${form.name}\nPhone: ${form.phone}`
  );

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-8">{t('checkout')}</h1>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={isMomo ? handleMomoClick : handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            {/* ── Left ── */}
            <div className="space-y-6">

              {/* Saved addresses */}
              {savedAddresses.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Saved Addresses</h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {savedAddresses.map(addr => (
                      <button key={addr.id} type="button"
                        onClick={() => setForm(f => ({ ...f, name: addr.name, phone: addr.phone, address: addr.address }))}
                        className="text-left rounded-xl border border-slate-200 dark:border-slate-700 p-3 hover:border-primary hover:bg-red-50 dark:hover:bg-sky-900/20 transition-all">
                        <p className="text-xs font-bold text-primary uppercase mb-0.5">{addr.label}</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{addr.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{addr.phone}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{addr.address}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Store pickup toggle */}
              <div className={`rounded-2xl border p-4 cursor-pointer transition ${storePickup ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}
                onClick={() => setStorePickup(p => !p)}>
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${storePickup ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600'}`}>
                    {storePickup && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">🏪 Pick up at our Kigali store <span className="text-emerald-600 font-bold">(Free)</span></p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">KigaliTech Store, Kigali — pick up at your convenience</p>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('contactInfo')}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('name')} *</label>
                    <input required autoComplete="name" value={form.name} onChange={e => set('name', e.target.value)} className={inp} placeholder="Full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('email')} *</label>
                    <input required type="email" autoComplete="email" value={form.email} onChange={e => set('email', e.target.value.toLowerCase())} className={inp} placeholder="your@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('phone')} *</label>
                    <input required type="tel" autoComplete="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inp} placeholder="+250 7XX XXX XXX" />
                  </div>
                  {!storePickup && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t('address')} {!form.useMpost && '*'}
                    </label>
                    <input
                      required={!form.useMpost && !storePickup}
                      disabled={form.useMpost}
                      autoComplete="street-address"
                      value={form.address}
                      onChange={e => set('address', e.target.value)}
                      className={`${inp} ${form.useMpost ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="Street, City, Country"
                    />
                  </div>
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.useMpost} onChange={e => set('useMpost', e.target.checked)} className="mt-0.5 accent-sky-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('mpostLabel')}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('mpostDesc')}</p>
                    </div>
                  </label>
                  {form.useMpost && (
                    <input value={form.mpostPhone} onChange={e => set('mpostPhone', e.target.value)} placeholder="Mpost phone number (e.g. 0788 XXX XXX)" className={`${inp} mt-3`} />
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <DeliverySlotPicker value={deliverySlot} onChange={setDeliverySlot} />
                </div>
              </div>

              {/* Delivery Zone */}
              {!storePickup && deliveryZones.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Delivery Zone</label>
                  <div className="space-y-2">
                    {deliveryZones.map(zone => (
                      <label
                        key={zone.id}
                        className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 cursor-pointer transition ${
                          selectedZoneId === zone.id
                            ? 'border-sky-500 bg-red-50 dark:bg-sky-900/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input type="radio" name="deliveryZone" value={zone.id} checked={selectedZoneId === zone.id} onChange={() => setSelectedZoneId(zone.id)} className="accent-sky-600" />
                          <div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{zone.name}</span>
                            {zone.estimatedDays && (
                              <p className="text-xs text-slate-400 mt-0.5">Est. {zone.estimatedDays <= 2 ? `${zone.estimatedDays}h` : `${zone.estimatedDays} hours`}</p>
                            )}
                          </div>
                        </div>
                        <span className={`text-sm font-semibold ${zone.fee === 0 ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}`}>
                          {zone.fee === 0 ? 'Free' : `RWF ${zone.fee.toLocaleString()}`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* TV Installation */}
              {hasTVItem && (
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl">📺</div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t('tvInstallTitle')}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('tvInstallDesc')}</p>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={tvInstallation} onChange={e => setTvInstallation(e.target.checked)} className="accent-amber-600" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {t('addInstallation')} — <span className="text-amber-700 dark:text-amber-400 font-semibold">Negotiable</span>
                        </span>
                      </label>
                      {tvInstallation && (
                        <input value={tvInstallAddress} onChange={e => setTvInstallAddress(e.target.value)} placeholder="Installation address (if different)" className={`${inp} mt-3`} />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('paymentMethod')}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PAYMENT_METHODS.map(m => (
                    <label
                      key={m.id}
                      className={`relative flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition ${
                        form.paymentMethod === m.id
                          ? 'border-sky-500 bg-red-50 dark:bg-sky-900/20'
                          : m.popular
                            ? 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-400'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {m.popular && (
                        <span className="absolute -top-2.5 left-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          Recommended
                        </span>
                      )}
                      <input type="radio" name="payment" value={m.id} checked={form.paymentMethod === m.id} onChange={() => set('paymentMethod', m.id)} className="accent-sky-600" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg leading-none">{m.icon}</span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{m.label}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{m.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* MoMo preview */}
                {isMomo && (
                  <div className="mt-4 flex items-center gap-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                    <div className="text-3xl">📱</div>
                    <div>
                      <p className="text-sm font-semibold text-green-800 dark:text-green-300">Send to our MoMo number</p>
                      <p className="font-mono text-lg font-bold text-green-700 dark:text-green-200">{BUSINESS_PHONE_DISPLAY}</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Works with MTN MoMo and Airtel Money</p>
                    </div>
                  </div>
                )}

                {/* Installment CTA */}
                {isInstallment && (
                  <div className="mt-4 rounded-xl bg-red-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 p-4">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">We'll contact you to arrange a plan</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Clicking "Request Installment" will open WhatsApp so we can discuss your 3–12 month plan directly.</p>
                  </div>
                )}
              </div>

              {/* Accessories */}
              {addons.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xl">🛡️</span>
                    <div>
                      <h2 className="font-semibold text-slate-900 dark:text-slate-100">Add Accessories</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Delivered with your order</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {addons.map(addon => {
                      const selected = !!selectedAddons[addon.id];
                      const img = (() => { try { const imgs = JSON.parse(addon.images); return imgs[0] || null; } catch { return null; } })();
                      return (
                        <button
                          key={addon.id} type="button"
                          onClick={() => setSelectedAddons(s => ({ ...s, [addon.id]: !s[addon.id] }))}
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                            selected ? 'border-sky-500 bg-red-50 dark:bg-sky-900/20 ring-2 ring-sky-200 dark:ring-sky-800' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {img ? (
                            <img src={img} alt={addon.name} className="h-12 w-12 rounded-lg object-cover flex-shrink-0 border border-slate-100" />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0">🛡️</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{addon.name}</p>
                            <p className="text-xs font-bold text-primary mt-0.5">{format(addon.price)}</p>
                          </div>
                          <div className={`h-5 w-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'border-sky-500 bg-primary' : 'border-slate-300'}`}>
                            {selected && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('notes')}</h2>
                <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} className={`${inp} resize-none`} placeholder="Special instructions, preferred delivery time..." />
                <label className="mt-4 flex items-center gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={whatsappUpdates} onChange={e => setWhatsappUpdates(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <svg viewBox="0 0 32 32" className="h-4 w-4 fill-[#25D366] flex-shrink-0"><path d="M16.004 2C8.276 2 2 8.268 2 15.986c0 2.458.64 4.866 1.856 6.98L2 30l7.236-1.822A14.022 14.022 0 0016.004 30C23.724 30 30 23.732 30 16.014 30 8.268 23.724 2 16.004 2zm7.414 19.878c-.316.886-1.564 1.622-2.56 1.836-.68.144-1.568.258-4.552-1.004C12.624 21.162 9.98 17.6 9.778 17.338c-.198-.26-1.664-2.21-1.664-4.222 0-2.012 1.048-2.992 1.42-3.402.37-.412.808-.514 1.078-.514.27 0 .542.002.78.014.248.012.584-.096.914.696l1.31 3.184c.13.314.216.682.04 1.098-.174.414-.26.67-.522.99-.258.32-.546.716-.778.962-.258.272-.526.566-.228 1.11.3.544 1.33 2.192 2.858 3.55 1.964 1.75 3.62 2.29 4.13 2.548.512.258.81.216 1.108-.13.298-.344 1.276-1.492 1.616-2.006.34-.512.68-.43 1.146-.258.466.174 2.974 1.4 3.484 1.656.51.258.85.386.974.6.126.214.126 1.104-.19 1.99z"/></svg>
                    Send me WhatsApp updates on my order status
                  </span>
                </label>
              </div>
            </div>

            {/* ── Right: Order Summary ── */}
            <div>
              <div className="sticky top-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">{t('orderSummary')}</h2>
                </div>
                {items.some(i => i.isPreOrder) && (
                  <div className="mx-5 mt-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-300">
                    🔔 <strong>Pre-order items</strong> — you are paying the deposit only. Full balance is due when the product ships.
                  </div>
                )}
                <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-72 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.key} className="flex gap-3 px-5 py-3">
                      <img src={item.image} alt={item.name} className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                        <p className="text-xs text-slate-400">{[item.color, item.storage, `×${item.quantity}`].filter(Boolean).join(' · ')}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{format(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                {/* Coupon code */}
                <div className="px-5 pt-3 pb-2 border-t border-slate-100 dark:border-slate-800">
                  {couponApplied ? (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2">
                      <div>
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Coupon: {couponApplied.code}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-500">-{format(couponDiscount)} saved</p>
                      </div>
                      <button type="button" onClick={() => { setCouponApplied(null); setCouponInput(''); }} className="text-xs text-red-500 hover:text-red-700 font-semibold">Remove</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={couponInput}
                        onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyCoupon())}
                        placeholder="Coupon code"
                        className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      />
                      <button type="button" onClick={applyCoupon} disabled={couponLoading || !couponInput.trim()}
                        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50 transition">
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {couponError && <p className="mt-1 text-xs text-red-500">{couponError}</p>}
                </div>

                {/* Store credit */}
                {storeCredit > 0 && (
                  <div className="px-5 pb-3">
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 px-3 py-2 cursor-pointer">
                      <div>
                        <p className="text-xs font-semibold text-violet-800 dark:text-violet-300">Store Credit</p>
                        <p className="text-xs text-violet-600 dark:text-violet-400">Balance: {format(storeCredit)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {useStoreCredit && <span className="text-xs font-bold text-violet-700 dark:text-violet-300">-{format(creditApplied)}</span>}
                        <input type="checkbox" checked={useStoreCredit} onChange={e => setUseStoreCredit(e.target.checked)} className="accent-violet-600 h-4 w-4" />
                      </div>
                    </label>
                  </div>
                )}

                <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 space-y-2">
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>{t('subtotal')}</span><span>{format(subtotal)}</span>
                  </div>
                  {addonTotal > 0 && (
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>Accessories</span><span>{format(addonTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>{t('shipping')}{selectedZone ? ` — ${selectedZone.name}` : ''}</span>
                    <span>{shipping === 0 ? <span className="text-emerald-600">Free</span> : format(shipping)}</span>
                  </div>
                  {!selectedZone && freeDeliveries && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      {freeDeliveries.remaining > 0
                        ? `Free delivery order ${freeDeliveries.used + 1} of ${freeDeliveries.total}`
                        : `${freeDeliveries.total} free deliveries used — standard shipping applies`}
                    </p>
                  )}
                  {selectedZone?.estimatedDays && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-sky-900/20 px-3 py-2 text-xs text-primary dark:text-primary">
                      <span>📅</span>
                      <span>Expected delivery: <strong>{selectedZone.estimatedDays === 1 ? 'Today / Tomorrow' : `${selectedZone.estimatedDays} business days`}</strong></span>
                    </div>
                  )}
                  {tvInstallation && (
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>TV Installation</span><span className="text-amber-600 font-semibold">Negotiable</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                      <span>Coupon discount</span><span>-{format(couponDiscount)}</span>
                    </div>
                  )}
                  {creditApplied > 0 && (
                    <div className="flex justify-between text-sm text-violet-600 dark:text-violet-400">
                      <span>Store credit</span><span>-{format(creditApplied)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>{t('total')}</span><span>{format(total)}</span>
                  </div>
                  {session && loyaltyPts !== null && (
                    <div className={`mt-3 rounded-xl px-3 py-2.5 text-xs flex items-center gap-2 ${loyaltyPts >= 100 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-sky-900/20 text-primary dark:text-primary'}`}>
                      <span className="text-base">⭐</span>
                      {loyaltyPts >= 100
                        ? <span><strong>{loyaltyPts} pts</strong> available — redeem for <strong>RWF {Math.floor(loyaltyPts / 100) * 1340 > 0 ? (Math.floor(loyaltyPts / 100) * 1340).toLocaleString() : '1,340'}</strong> off at checkout</span>
                        : <span>You have <strong>{loyaltyPts} pts</strong> — <strong>{100 - loyaltyPts} more</strong> to unlock your first reward</span>
                      }
                    </div>
                  )}
                </div>

                <div className="px-5 pb-5">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-full bg-primary py-3.5 font-semibold text-white hover:bg-primary-hover disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Processing…</>
                    ) : isMomo ? (
                      `Pay ${format(total)} via MoMo`
                    ) : isInstallment ? (
                      'Request Installment Plan'
                    ) : (
                      t('placeOrder')
                    )}
                  </button>
                  <p className="mt-3 text-center text-xs text-slate-400">{t('secureCheckout')}</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      <Footer />

      {/* ── MoMo Payment Modal ── */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget && !orderPlaced && !submitting) setShowPayModal(false); }}>
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease]">

            {/* Success state */}
            {orderPlaced ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-4xl">✅</div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">Order Placed!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  We'll confirm your order once payment is verified. You'll receive a confirmation message shortly.
                </p>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
                  target="_blank" rel="noopener noreferrer"
                  className="mb-3 flex items-center justify-center gap-2 w-full rounded-full bg-[#25D366] py-3 font-semibold text-white hover:bg-[#20bf5b] transition-all"
                >
                  <svg viewBox="0 0 32 32" className="h-5 w-5 fill-white flex-shrink-0"><path d="M16.004 2C8.276 2 2 8.268 2 15.986c0 2.458.64 4.866 1.856 6.98L2 30l7.236-1.822A14.022 14.022 0 0016.004 30C23.724 30 30 23.732 30 16.014 30 8.268 23.724 2 16.004 2zm7.414 19.878c-.316.886-1.564 1.622-2.56 1.836-.68.144-1.568.258-4.552-1.004C12.624 21.162 9.98 17.6 9.778 17.338c-.198-.26-1.664-2.21-1.664-4.222 0-2.012 1.048-2.992 1.42-3.402.37-.412.808-.514 1.078-.514.27 0 .542.002.78.014.248.012.584-.096.914.696l1.31 3.184c.13.314.216.682.04 1.098-.174.414-.26.67-.522.99-.258.32-.546.716-.778.962-.258.272-.526.566-.228 1.11.3.544 1.33 2.192 2.858 3.55 1.964 1.75 3.62 2.29 4.13 2.548.512.258.81.216 1.108-.13.298-.344 1.276-1.492 1.616-2.006.34-.512.68-.43 1.146-.258.466.174 2.974 1.4 3.484 1.656.51.258.85.386.974.6.126.214.126 1.104-.19 1.99z"/></svg>
                  Send Payment Proof on WhatsApp
                </a>
                {showSaveAddressPrompt && !addressSaved && (
                  <div className="my-4 rounded-2xl bg-red-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 px-4 py-3 text-left">
                    <p className="text-sm font-semibold text-primary dark:text-primary mb-1">Save your address for next time?</p>
                    <p className="text-xs text-primary dark:text-primary mb-3">{form.address}</p>
                    <div className="flex gap-2">
                      <button onClick={saveCurrentAddress} disabled={addressSaveLoading}
                        className="flex-1 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-xs font-bold py-2 transition">
                        {addressSaveLoading ? 'Saving…' : 'Save Address'}
                      </button>
                      <button onClick={() => setAddressSaved(true)}
                        className="rounded-xl border border-sky-200 dark:border-sky-700 text-xs text-primary dark:text-primary px-3 py-2 hover:bg-sky-100 dark:hover:bg-sky-900/30 transition">
                        No thanks
                      </button>
                    </div>
                  </div>
                )}
                {addressSaved && showSaveAddressPrompt && (
                  <p className="my-3 text-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold">✓ Address saved!</p>
                )}
                <button onClick={handleModalClose} className="w-full rounded-full border border-slate-200 dark:border-slate-700 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                  View My Order
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Send Payment</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">MTN MoMo or Airtel Money</p>
                  </div>
                  <button onClick={() => setShowPayModal(false)} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                  {/* Steps */}
                  <div className="space-y-3">
                    {[
                      { n: '1', text: 'Open your MTN MoMo or Airtel Money app' },
                      { n: '2', text: `Send exactly ${format(total)} to the number below` },
                      { n: '3', text: 'Come back and tap "I\'ve Sent the Payment"' },
                    ].map(s => (
                      <div key={s.n} className="flex items-center gap-3">
                        <div className="h-7 w-7 flex-shrink-0 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">{s.n}</div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{s.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Number + QR */}
                  <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-900/20 dark:to-emerald-900/20 border border-sky-200 dark:border-sky-800 p-5">
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      {/* QR */}
                      <div className="flex-shrink-0 rounded-2xl border-4 border-white dark:border-slate-800 shadow-md p-1 bg-white">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`tel:+250${BUSINESS_PHONE}`)}`}
                          alt="MoMo QR"
                          width={120}
                          height={120}
                          className="rounded-xl"
                        />
                      </div>
                      {/* Details */}
                      <div className="text-center sm:text-left">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide font-medium">Send to</p>
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                          <span className="font-mono text-2xl font-extrabold text-slate-900 dark:text-slate-100">{BUSINESS_PHONE}</span>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(BUSINESS_PHONE)}
                            className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs text-slate-500 hover:text-primary transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mb-4">KigaliTech Services</p>
                        <div className="rounded-xl bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 px-4 py-2.5 text-center">
                          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Amount</p>
                          <p className="text-2xl font-extrabold text-amber-800 dark:text-amber-200">{format(total)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* USSD Dialer shortcut */}
                  <a
                    href={`tel:*182*1*1*${BUSINESS_PHONE}*${Math.round(total)}%23`}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-red-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 py-3 text-sm font-semibold text-primary dark:text-primary hover:bg-sky-100 dark:hover:bg-sky-900/40 transition"
                  >
                    <span className="text-lg">📞</span>
                    Dial to pay: *182*1*1*{BUSINESS_PHONE}*{Math.round(total)}#
                  </a>

                  {/* WhatsApp proof option */}
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi KigaliTech! I'm about to pay ${format(total)} for my order. My name is ${form.name}, phone: ${form.phone}.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 justify-center text-sm text-[#25D366] hover:underline"
                  >
                    <svg viewBox="0 0 32 32" className="h-4 w-4 fill-[#25D366]"><path d="M16.004 2C8.276 2 2 8.268 2 15.986c0 2.458.64 4.866 1.856 6.98L2 30l7.236-1.822A14.022 14.022 0 0016.004 30C23.724 30 30 23.732 30 16.014 30 8.268 23.724 2 16.004 2zm7.414 19.878c-.316.886-1.564 1.622-2.56 1.836-.68.144-1.568.258-4.552-1.004C12.624 21.162 9.98 17.6 9.778 17.338c-.198-.26-1.664-2.21-1.664-4.222 0-2.012 1.048-2.992 1.42-3.402.37-.412.808-.514 1.078-.514.27 0 .542.002.78.014.248.012.584-.096.914.696l1.31 3.184c.13.314.216.682.04 1.098-.174.414-.26.67-.522.99-.258.32-.546.716-.778.962-.258.272-.526.566-.228 1.11.3.544 1.33 2.192 2.858 3.55 1.964 1.75 3.62 2.29 4.13 2.548.512.258.81.216 1.108-.13.298-.344 1.276-1.492 1.616-2.006.34-.512.68-.43 1.146-.258.466.174 2.974 1.4 3.484 1.656.51.258.85.386.974.6.126.214.126 1.104-.19 1.99z"/></svg>
                    Need help? Chat with us on WhatsApp
                  </a>
                </div>

                {/* Confirm button */}
                <div className="px-6 pb-6">
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={submitting}
                    className="w-full rounded-full bg-emerald-600 py-4 font-bold text-white text-base hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50"
                  >
                    {submitting ? (
                      <><span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Placing order…</>
                    ) : (
                      `✓ I've Sent ${format(total)}`
                    )}
                  </button>
                  <p className="mt-3 text-center text-xs text-slate-400">Your order will be confirmed once we verify the payment</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Upsell: You might also like */}
      {upsellProducts.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">You might also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {upsellProducts.map(p => {
              const imgs = (() => { try { return JSON.parse(p.images || '[]'); } catch { return []; } })();
              const priceRWF = p.price;
              return (
                <a key={p.id} href={`/products/${p.id}`} target="_blank" rel="noopener noreferrer"
                  className="group rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col no-underline">
                  {imgs[0] && (
                    <div className="h-32 bg-slate-50 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                      <img src={imgs[0]} alt={p.name} className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="p-3 flex-1 flex flex-col gap-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">{p.name}</p>
                    <p className="text-xs font-bold text-primary mt-auto">RWF {priceRWF.toLocaleString()}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Layout>
  );
}
