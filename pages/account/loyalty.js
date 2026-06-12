import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Link from 'next/link';

const RWF_PER_POINT = 13.4; // 100 pts = RWF 1,340

function rwfValue(points) {
  return `RWF ${Math.round(points * RWF_PER_POINT).toLocaleString()}`;
}

function TransactionRow({ tx }) {
  const isEarn = tx.points > 0;
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${
          isEarn ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-red-100 dark:bg-red-900/30 text-red-500'
        }`}>
          {isEarn ? '↑' : '↓'}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {tx.action === 'earn' ? 'Points Earned' : tx.action === 'redeem' ? 'Points Redeemed' : 'Points Expired'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{tx.reason}</p>
          <p className="text-xs text-slate-300 dark:text-slate-600 mt-0.5">
            {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
      <p className={`text-sm font-extrabold tabular-nums ${isEarn ? 'text-emerald-600' : 'text-red-500'}`}>
        {isEarn ? '+' : ''}{tx.points} pts
      </p>
    </div>
  );
}

// Tier ladder by role: admin=Platinum(top), staff=Gold(top), users capped at Silver
function TierProgress({ points, role }) {
  const ALL = [
    { name: 'Bronze',   min: 0,     max: 499,  color: 'bg-amber-600',  icon: '🥉' },
    { name: 'Silver',   min: 500,   max: 999,  color: 'bg-slate-400',  icon: '🥈' },
    { name: 'Gold',     min: 1000,  max: 4999, color: 'bg-yellow-500', icon: '🥇' },
    { name: 'Platinum', min: 5000,  max: null, color: 'bg-violet-500', icon: '💎' },
  ];
  const tiers = role === 'admin'
    ? ALL
    : role === 'staff'
      ? ALL.slice(0, 3) // Bronze → Silver → Gold (top for staff)
      : ALL.slice(0, 2); // Bronze → Silver (top for regular users)

  const effectivePoints = role === 'admin'
    ? Math.max(points, 5000)
    : role === 'staff'
      ? Math.max(points, 1000)
      : points;

  const current = tiers.find(t => effectivePoints >= t.min && (t.max === null || effectivePoints <= t.max)) || tiers[tiers.length - 1];
  const next = tiers.find(t => t.min > (current?.min ?? 0));
  const pct = next ? Math.min(100, ((effectivePoints - current.min) / (next.min - current.min)) * 100) : 100;

  return (
    <div className="mt-5 pt-5 border-t border-sky-400/30">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-sky-200">{next ? `${next.min - points} pts to ${next.name}` : 'Top tier reached!'}</p>
        <p className="text-xs font-semibold text-sky-100">{current?.name}</p>
      </div>
      <div className="h-2 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-white transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const TIER_GRADIENT = {
  Bronze:   'from-amber-600 to-amber-800',
  Silver:   'from-slate-400 to-slate-600',
  Gold:     'from-yellow-400 to-amber-600',
  Platinum: 'from-violet-500 to-indigo-700',
};
const TIER_ICON = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' };

function EmvChip() {
  return (
    <svg width="38" height="30" viewBox="0 0 38 30" fill="none" style={{borderRadius:'4px',overflow:'visible'}}>
      <rect width="38" height="30" rx="4" fill="#d4a843"/>
      <rect x="13" y="0" width="12" height="30" fill="#c49930" opacity="0.4"/>
      <rect x="0" y="10" width="38" height="10" fill="#c49930" opacity="0.4"/>
      <rect x="13" y="10" width="12" height="10" rx="1" fill="#b8892a"/>
      <line x1="13" y1="0" x2="13" y2="10" stroke="#b8892a" strokeWidth="1"/>
      <line x1="25" y1="0" x2="25" y2="10" stroke="#b8892a" strokeWidth="1"/>
      <line x1="13" y1="20" x2="13" y2="30" stroke="#b8892a" strokeWidth="1"/>
      <line x1="25" y1="20" x2="25" y2="30" stroke="#b8892a" strokeWidth="1"/>
    </svg>
  );
}

function LoyaltyCardDisplay({ card, userName }) {
  const expiry = card.expiresAt ? new Date(card.expiresAt) : null;
  const expiryStr = expiry
    ? `${String(expiry.getMonth() + 1).padStart(2, '0')}/${expiry.getFullYear().toString().slice(-2)}`
    : '';

  // Format card number as 4 groups of 4
  const rawNum = (card.cardNumber || '').replace(/\D/g,'');
  const formattedNum = rawNum.length >= 16
    ? rawNum.replace(/(.{4})/g,'$1 ').trim()
    : card.cardNumber;

  return (
    <div
      id="loyalty-card-print"
      style={{
        width: '340px', height: '213px',
        borderRadius: '16px',
        background: card.tier === 'Platinum'
          ? 'linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)'
          : card.tier === 'Gold'
            ? 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)'
            : card.tier === 'Silver'
              ? 'linear-gradient(135deg, #64748b 0%, #334155 100%)'
              : 'linear-gradient(135deg, #92400e 0%, #78350f 100%)',
        color: 'white',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        flexShrink: 0,
      }}
    >
      {/* Background circles */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ position: 'absolute', bottom: -50, left: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
      <div style={{ position: 'absolute', top: 20, right: 60, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

      {/* Top row: brand + tier */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="KT" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px' }}>KIGALITECH</div>
            <div style={{ fontSize: '8px', opacity: 0.65, letterSpacing: '2.5px', marginTop: '1px' }}>MEMBER CARD</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', lineHeight: 1 }}>{TIER_ICON[card.tier]}</div>
          <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '1.5px', opacity: 0.95, marginTop: '2px', background: 'rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: '99px', display: 'inline-block' }}>{card.tier.toUpperCase()}</div>
        </div>
      </div>

      {/* EMV chip */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <EmvChip />
        {/* Contactless symbol */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" opacity="0.6">
          <path d="M8.5 16.5a5 5 0 000-9M5.5 19.5a9 9 0 000-15M11.5 13.5a1 1 0 000-3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Card number */}
      <div style={{ position: 'relative', fontFamily: '"Courier New", Courier, monospace', fontSize: '14px', letterSpacing: '4px', opacity: 0.9, fontWeight: 600 }}>
        {formattedNum}
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', position: 'relative' }}>
        <div>
          <div style={{ fontSize: '8px', opacity: 0.55, letterSpacing: '2px', marginBottom: '3px', textTransform: 'uppercase' }}>Card Holder</div>
          <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px' }}>{(userName || 'Member').toUpperCase()}</div>
          <div style={{ fontSize: '9px', opacity: 0.65, marginTop: '3px' }}>{card.points.toLocaleString()} pts</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {expiryStr && (
            <>
              <div style={{ fontSize: '8px', opacity: 0.55, letterSpacing: '2px', marginBottom: '3px', textTransform: 'uppercase' }}>Valid Thru</div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>{expiryStr}</div>
            </>
          )}
          <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '5px', letterSpacing: '0.5px' }}>+250 786 276 555</div>
        </div>
      </div>
    </div>
  );
}

export default function LoyaltyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState(null);
  const [cardLoading, setCardLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/signin?callbackUrl=/account/loyalty');
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/loyalty/balance')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch('/api/loyalty/card')
      .then(r => r.json())
      .then(d => setCard(d.card || null))
      .catch(() => {})
      .finally(() => setCardLoading(false));
  }, [status]);

  async function requestCard() {
    setRequesting(true);
    try {
      const res = await fetch('/api/loyalty/card', { method: 'POST' });
      const d = await res.json();
      if (d.card) setCard(d.card);
    } catch {}
    setRequesting(false);
  }

  function buildCardHtml() {
    if (!card) return '';
    const bg = card.tier === 'Platinum' ? 'linear-gradient(135deg,#7c3aed,#4338ca)'
      : card.tier === 'Gold' ? 'linear-gradient(135deg,#f59e0b,#b45309)'
      : card.tier === 'Silver' ? 'linear-gradient(135deg,#64748b,#334155)'
      : 'linear-gradient(135deg,#92400e,#78350f)';
    const icon = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' }[card.tier] || '🪪';
    const expiry = card.expiresAt ? new Date(card.expiresAt) : null;
    const expiryStr = expiry
      ? `${String(expiry.getMonth() + 1).padStart(2, '0')}/${expiry.getFullYear().toString().slice(-2)}`
      : '';
    const name = (session?.user?.name || 'Member').toUpperCase();
    const rawNum = (card.cardNumber || '').replace(/\D/g,'');
    const formattedNum = rawNum.length >= 16 ? rawNum.replace(/(.{4})/g,'$1 ').trim() : card.cardNumber;

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>KigaliTech Loyalty Card — ${name}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0f172a;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;gap:20px}
  .card{width:360px;height:225px;border-radius:18px;background:${bg};color:white;padding:22px 24px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,0.5)}
  .c1{position:absolute;top:-50px;right:-50px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.05)}
  .c2{position:absolute;bottom:-60px;left:-30px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.04)}
  .c3{position:absolute;top:30px;right:80px;width:90px;height:90px;border-radius:50%;background:rgba(255,255,255,0.03)}
  .btn{padding:12px 36px;border-radius:999px;background:white;color:#0f172a;font-size:14px;font-weight:700;border:none;cursor:pointer;letter-spacing:0.5px}
  @media print{body{background:white;min-height:auto}.card{box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}.btn{display:none}}
</style></head><body>
<div class="card">
  <div class="c1"></div><div class="c2"></div><div class="c3"></div>
  <div style="display:flex;align-items:center;justify-content:space-between;position:relative">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:30px;height:30px;border-radius:7px;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">🛒</div>
      <div>
        <div style="font-weight:800;font-size:12px;letter-spacing:2.5px">KIGALITECH</div>
        <div style="font-size:7.5px;opacity:0.6;letter-spacing:3px;margin-top:1px">MEMBER CARD</div>
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:20px;line-height:1">${icon}</div>
      <div style="font-size:8px;font-weight:800;letter-spacing:2px;opacity:0.9;margin-top:3px;background:rgba(255,255,255,0.15);padding:2px 7px;border-radius:99px;display:inline-block">${card.tier.toUpperCase()}</div>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:14px;position:relative">
    <svg width="38" height="30" viewBox="0 0 38 30"><rect width="38" height="30" rx="4" fill="#d4a843"/><rect x="13" y="0" width="12" height="30" fill="#c49930" opacity="0.4"/><rect x="0" y="10" width="38" height="10" fill="#c49930" opacity="0.4"/><rect x="13" y="10" width="12" height="10" rx="1" fill="#b8892a"/></svg>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" opacity="0.55"><path d="M8.5 16.5a5 5 0 000-9M5.5 19.5a9 9 0 000-15M11.5 13.5a1 1 0 000-3" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
  </div>
  <div style="font-family:'Courier New',monospace;font-size:15px;letter-spacing:4px;opacity:0.9;font-weight:600;position:relative">${formattedNum}</div>
  <div style="display:flex;align-items:flex-end;justify-content:space-between;position:relative">
    <div>
      <div style="font-size:7.5px;opacity:0.5;letter-spacing:2px;margin-bottom:3px;text-transform:uppercase">Card Holder</div>
      <div style="font-size:13px;font-weight:700;letter-spacing:0.5px">${name}</div>
      <div style="font-size:8.5px;opacity:0.65;margin-top:3px">${card.points.toLocaleString()} points</div>
    </div>
    ${expiryStr ? `<div style="text-align:right"><div style="font-size:7.5px;opacity:0.5;letter-spacing:2px;margin-bottom:3px;text-transform:uppercase">Valid Thru</div><div style="font-size:13px;font-weight:700">${expiryStr}</div></div>` : ''}
  </div>
</div>
<button class="btn" onclick="window.print()">🖨 Print / Save as PDF</button>
</body></html>`;
  }

  function printCard() {
    if (!card || card.status !== 'approved') return;
    const html = buildCardHtml();

    // Use hidden iframe — avoids popup blockers on all browsers
    const existing = document.getElementById('__loyalty-print-frame');
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = '__loyalty-print-frame';
    iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:600px;height:500px;border:none;visibility:hidden;';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch {
        // fallback: open new tab
        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); }
      }
      setTimeout(() => { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); }, 2000);
    };
  }

  async function downloadCard() {
    if (!card || card.status !== 'approved') return;
    const W = 680, H = 426;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    function rrect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
      ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
      ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
      ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
    }
    rrect(0,0,W,H,32); ctx.save(); ctx.clip();
    const gmap = { Platinum:['#7c3aed','#4338ca'], Gold:['#f59e0b','#b45309'], Silver:['#64748b','#334155'], Bronze:['#92400e','#78350f'] };
    const [c1,c2] = gmap[card.tier]||gmap.Bronze;
    const bg = ctx.createLinearGradient(0,0,W,H); bg.addColorStop(0,c1); bg.addColorStop(1,c2);
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.arc(W+80,-80,360,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.beginPath(); ctx.arc(-60,H+100,300,0,Math.PI*2); ctx.fill();
    try {
      const logo = await new Promise((res,rej)=>{ const img=new Image(); img.onload=()=>res(img); img.onerror=rej; img.src='/logo.png'; });
      ctx.save(); ctx.beginPath(); ctx.arc(76,68,28,0,Math.PI*2); ctx.clip(); ctx.drawImage(logo,48,40,56,56); ctx.restore();
    } catch {
      ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(76,68,28,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='white'; ctx.textAlign='center'; ctx.font='bold 20px system-ui'; ctx.fillText('KT',76,75); ctx.textAlign='left';
    }
    ctx.fillStyle='white'; ctx.font='bold 24px system-ui,-apple-system,sans-serif'; ctx.fillText('KIGALITECH',120,60);
    ctx.fillStyle='rgba(255,255,255,0.65)'; ctx.font='13px system-ui'; ctx.fillText('MEMBER CARD',122,82);
    const tIcons={Bronze:'🥉',Silver:'🥈',Gold:'🥇',Platinum:'💎'};
    ctx.font='34px system-ui'; ctx.textAlign='right'; ctx.fillStyle='white'; ctx.fillText(tIcons[card.tier]||'🪪',W-48,60);
    ctx.font='bold 13px system-ui';
    const tlabel=card.tier.toUpperCase(); const tw=ctx.measureText(tlabel).width;
    ctx.fillStyle='rgba(255,255,255,0.18)'; rrect(W-tw-84,68,tw+28,24,12); ctx.fill();
    ctx.fillStyle='white'; ctx.fillText(tlabel,W-52,84); ctx.textAlign='left';
    const cg=ctx.createLinearGradient(48,148,124,208); cg.addColorStop(0,'#d4a843'); cg.addColorStop(1,'#b8892a');
    rrect(48,148,76,60,8); ctx.fillStyle=cg; ctx.fill();
    ctx.strokeStyle='#b8892a'; ctx.lineWidth=2;
    ctx.strokeRect(74,148,24,60); ctx.strokeRect(48,168,76,20);
    ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.font='bold 26px "Courier New",Courier,monospace';
    ctx.fillText(card.cardNumber||'',48,280);
    ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='600 11px system-ui'; ctx.fillText('CARD HOLDER',48,322);
    ctx.fillStyle='white'; ctx.font='bold 24px system-ui';
    ctx.fillText((session?.user?.name||'MEMBER').toUpperCase().slice(0,22),48,354);
    ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.font='15px system-ui'; ctx.fillText(`${card.points.toLocaleString()} pts`,48,386);
    if (card.expiresAt) {
      const exp=new Date(card.expiresAt);
      const es=`${String(exp.getMonth()+1).padStart(2,'0')}/${exp.getFullYear().toString().slice(-2)}`;
      ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='600 11px system-ui'; ctx.textAlign='right';
      ctx.fillText('VALID THRU',W-48,322); ctx.fillStyle='white'; ctx.font='bold 24px system-ui'; ctx.fillText(es,W-48,354);
    }
    ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.font='14px system-ui'; ctx.textAlign='right';
    ctx.fillText('+250 786 276 555',W-48,386); ctx.textAlign='left';
    ctx.restore();
    canvas.toBlob(blob=>{
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a'); a.href=url; a.download=`KigaliTech-Card-${card.cardNumber}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    },'image/png');
  }

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!session) return null;

  const points = data?.points ?? 0;
  const transactions = data?.transactions ?? [];
  const role = session?.user?.role;
  // Tier by role: admin=Platinum, staff=Gold, others capped at Silver
  const tier = role === 'admin' ? 'Platinum' : role === 'staff' ? 'Gold' : (points >= 500 ? 'Silver' : 'Bronze');

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <Link href="/account" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-sky-600 no-underline mb-4">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Account
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Loyalty Points</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Earn points on every purchase and redeem for discounts</p>
        </div>

        {/* Points Balance Card */}
        <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-6 mb-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-sky-100 uppercase tracking-widest">Your Balance</p>
              <p className="text-5xl font-extrabold mt-2 tabular-nums">{points.toLocaleString()}</p>
              <p className="text-sky-200 text-sm mt-1">points</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-bold">
                <span>{tier === 'Platinum' ? '💎' : tier === 'Gold' ? '🥇' : tier === 'Silver' ? '🥈' : '🥉'}</span>
                {tier}
              </div>
              <p className="mt-2 text-xs text-sky-200 text-right">≈ {rwfValue(points)}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-sky-400/30 flex items-center justify-between">
            <p className="text-sm text-sky-100">Redeemable value</p>
            <p className="text-lg font-extrabold">{rwfValue(points)}</p>
          </div>
          <TierProgress points={points} role={role} />
        </div>

        {/* Loyalty Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 mb-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🪪</span> Loyalty Card
          </h2>

          {cardLoading ? (
            <div className="h-12 flex items-center text-slate-400 text-sm">Loading card status...</div>
          ) : card?.status === 'approved' ? (
            <div className="space-y-4">
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">Your card is active ✓</p>
              <div className="overflow-x-auto">
                <LoyaltyCardDisplay card={card} userName={session?.user?.name} />
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={printCard}
                  className="flex items-center gap-2 rounded-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-700 dark:hover:bg-slate-100 transition">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                  </svg>
                  Print Card
                </button>
                <button onClick={downloadCard}
                  className="flex items-center gap-2 rounded-full border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  Download as Image
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Card #{card.cardNumber} · {card.tier} · Expires {card.expiresAt ? new Date(card.expiresAt).toLocaleDateString() : '—'}
              </p>
            </div>
          ) : card?.status === 'pending' ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">⏳ Awaiting admin approval</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Your card preview is shown below. Download will be available once an admin approves your card.</p>
              </div>
              <div className="overflow-x-auto">
                <LoyaltyCardDisplay card={card} userName={session?.user?.name} />
              </div>
              <p className="text-xs text-slate-400 font-mono">Card #: {card.cardNumber} · pending approval</p>
            </div>
          ) : card?.status === 'rejected' ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-4">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">Request not approved</p>
                {card.adminNotes && <p className="text-xs text-red-600 dark:text-red-500 mt-1">{card.adminNotes}</p>}
              </div>
              <button onClick={requestCard} disabled={requesting}
                className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 transition">
                {requesting ? 'Requesting...' : 'Request Again'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">Get a physical loyalty card showing your tier and membership details. Present it in-store or share digitally.</p>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <li>✓ Shows your name, tier &amp; card number</li>
                <li>✓ Valid for 1 year from approval</li>
                <li>✓ Download, print, or save as PDF</li>
              </ul>
              <button onClick={requestCard} disabled={requesting}
                className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 transition">
                {requesting ? 'Requesting...' : 'Request My Loyalty Card'}
              </button>
            </div>
          )}
        </div>

        {/* How to earn */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 mb-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span>⭐</span> How to Earn Points
          </h2>
          <div className="space-y-3">
            {[
              { icon: '🛒', label: 'Purchase',        desc: 'Earn 1 point per RWF 29,500 spent (max 15 pts per order)', pts: 'up to 15 pts' },
              { icon: '⭐', label: 'Write a Review',   desc: 'Leave a verified product review',                          pts: '3 pts' },
              { icon: '🎂', label: 'Birthday Bonus',   desc: 'Points bonus on your birthday month',                      pts: '5 pts' },
              { icon: '👥', label: 'Refer a Friend',   desc: 'Your friend places their first order — rarest reward',     pts: '100 pts' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.label}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <span className="rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 px-3 py-1 text-xs font-bold whitespace-nowrap">
                  {item.pts}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/40 rounded-xl px-4 py-3">
            <strong>Redeem:</strong> 100 points = RWF 1,340 discount at checkout. Points are rare — invite a friend to earn the most in one action.
          </p>
        </div>

        {/* Transaction History */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Activity</h2>
          </div>
          <div className="px-6">
            {transactions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-3xl mb-3">🎯</p>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No transactions yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Start shopping to earn your first points!</p>
                <Link href="/products"
                  className="mt-4 inline-block rounded-xl bg-sky-600 text-white text-sm font-bold px-5 py-2.5 no-underline hover:bg-sky-700 transition-colors">
                  Shop Now
                </Link>
              </div>
            ) : (
              transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)
            )}
          </div>
        </div>

      </div>

    </Layout>
  );
}
