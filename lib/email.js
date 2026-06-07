import nodemailer from 'nodemailer';

const BRAND = 'KigaliTech';
const SUPPORT_PHONE = '+250 786 276 555';
const SITE_URL = process.env.NEXTAUTH_URL || 'https://electronics-shop-amber.vercel.app';
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '250786276555';

// ─── Transport ───────────────────────────────────────────────────────────────

async function sendViaResend(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === 'placeholder') return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || `${BRAND} <noreply@kigalitech.com>`,
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
  return true;
}

function getSmtpTransport() {
  const server = process.env.EMAIL_SERVER;
  if (!server || server.includes('placeholder') || server.includes('example.com')) return null;
  try {
    const url = new URL(server);
    return nodemailer.createTransport({
      host: url.hostname,
      port: Number(url.port) || 587,
      secure: url.port === '465',
      auth: {
        user: url.username ? decodeURIComponent(url.username) : undefined,
        pass: url.password ? decodeURIComponent(url.password) : undefined,
      },
    });
  } catch { return null; }
}

async function send(to, subject, html) {
  try {
    if (await sendViaResend(to, subject, html)) return;
    const smtp = getSmtpTransport();
    if (smtp) {
      await smtp.sendMail({ from: process.env.EMAIL_FROM || `noreply@kigalitech.com`, to, subject, html });
    }
  } catch (err) {
    console.error('[email]', err.message);
  }
}

// ─── Shared layout ───────────────────────────────────────────────────────────

function layout(title, accent, body) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',system-ui,sans-serif;color:#1e293b">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#0c4a6e 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center">
    <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px">${BRAND}</div>
    <div style="font-size:13px;color:#7dd3fc;margin-top:6px">${title}</div>
  </td></tr>
  <!-- Body -->
  <tr><td style="background:#fff;padding:36px 40px;border:1px solid #e2e8f0;border-top:none">${body}</td></tr>
  <!-- Footer -->
  <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center">
    <p style="margin:0 0 8px;font-size:13px;color:#64748b">Need help? Call or WhatsApp us: <a href="tel:${SUPPORT_PHONE.replace(/\s/g,'')}" style="color:#0ea5e9;text-decoration:none">${SUPPORT_PHONE}</a></p>
    <p style="margin:0;font-size:12px;color:#94a3b8">© ${new Date().getFullYear()} ${BRAND} · Kigali, Rwanda · <a href="https://wa.me/${WHATSAPP}" style="color:#0ea5e9">WhatsApp</a></p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

function btn(href, label, color = '#0ea5e9') {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#fff;padding:13px 28px;border-radius:50px;text-decoration:none;font-weight:700;font-size:14px;margin-top:20px">${label}</a>`;
}

function badge(text, color) {
  return `<span style="display:inline-block;background:${color};color:#fff;padding:4px 14px;border-radius:50px;font-size:12px;font-weight:700">${text}</span>`;
}

function itemsTable(items) {
  const rows = items.map(i => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;font-size:14px">${i.name}${i.color ? ` <span style="color:#94a3b8">· ${i.color}</span>` : ''}${i.storage ? ` <span style="color:#94a3b8">· ${i.storage}</span>` : ''}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;text-align:center;color:#64748b;font-size:14px">×${i.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;font-size:14px">$${((i.price * i.quantity) / 100).toFixed(2)}</td>
    </tr>`).join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0;background:#f8fafc;border-radius:12px;overflow:hidden">
    <thead><tr style="background:#f1f5f9">
      <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;color:#94a3b8;font-weight:600">Item</th>
      <th style="padding:10px 8px;text-align:center;font-size:11px;text-transform:uppercase;color:#94a3b8;font-weight:600">Qty</th>
      <th style="padding:10px 8px;text-align:right;font-size:11px;text-transform:uppercase;color:#94a3b8;font-weight:600">Price</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ─── Order confirmation ───────────────────────────────────────────────────────

export async function sendOrderConfirmation({ order, shippingName, shippingEmail, items }) {
  if (!shippingEmail) return;
  const body = `
    <p style="font-size:18px;margin:0 0 8px">Hi ${shippingName || 'there'} 👋</p>
    <p style="color:#64748b;margin:0 0 24px">Thank you for your order! We've received it and are getting it ready.</p>
    ${badge('Order Confirmed', '#10b981')}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:20px 0">
      <div style="font-size:13px;color:#64748b;margin-bottom:4px">Order number</div>
      <div style="font-size:24px;font-weight:800;color:#0f172a">#${order.id}</div>
    </div>
    ${itemsTable(items)}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr><td style="padding:6px 0;font-size:14px;color:#64748b">Subtotal</td><td style="padding:6px 0;font-size:14px;text-align:right">$${((order.total - (order.discountAmount || 0)) / 100).toFixed(2)}</td></tr>
      ${order.discountAmount ? `<tr><td style="padding:6px 0;font-size:14px;color:#10b981">Discount</td><td style="padding:6px 0;font-size:14px;text-align:right;color:#10b981">-$${(order.discountAmount / 100).toFixed(2)}</td></tr>` : ''}
      <tr style="border-top:2px solid #f1f5f9"><td style="padding:10px 0 0;font-size:16px;font-weight:800">Total</td><td style="padding:10px 0 0;font-size:16px;font-weight:800;text-align:right">$${(order.total / 100).toFixed(2)}</td></tr>
    </table>
    <div style="background:#f8fafc;border-radius:12px;padding:16px;margin:24px 0;font-size:13px;color:#64748b">
      <strong style="color:#1e293b">Shipping to:</strong> ${order.shippingAddress || 'Rwanda'}<br/>
      <strong style="color:#1e293b">Payment:</strong> ${order.paymentMethod || 'Pending'}
    </div>
    ${btn(`${SITE_URL}/orders/${order.id}`, 'Track My Order')}
    <p style="margin:20px 0 0;font-size:13px;color:#94a3b8">We'll send you another email when your order ships.</p>`;
  await send(shippingEmail, `✅ Order #${order.id} confirmed — ${BRAND}`, layout('Order Confirmation', '#10b981', body));
}

// ─── Order status update ──────────────────────────────────────────────────────

const STATUS_CONFIG = {
  confirmed:   { emoji: '✅', color: '#10b981', label: 'Confirmed',  msg: 'Your order has been confirmed by our team and is being prepared.' },
  processing:  { emoji: '⚙️', color: '#f59e0b', label: 'Processing', msg: 'We are now carefully preparing your items for shipment.' },
  shipped:     { emoji: '🚚', color: '#0ea5e9', label: 'Shipped',    msg: 'Your order is on its way! Expect delivery within 1–3 business days in Kigali.' },
  delivered:   { emoji: '🎉', color: '#10b981', label: 'Delivered',  msg: 'Your order has been delivered. We hope you love it!' },
  cancelled:   { emoji: '❌', color: '#ef4444', label: 'Cancelled',  msg: 'Your order has been cancelled. Contact us if you have questions.' },
  payment_failed: { emoji: '⚠️', color: '#ef4444', label: 'Payment Failed', msg: 'Your payment could not be processed. Please retry or contact us.' },
};

export async function sendOrderStatusUpdate({ order, status, customerEmail, customerName }) {
  if (!customerEmail) return;
  const cfg = STATUS_CONFIG[status] || { emoji: '📦', color: '#64748b', label: status, msg: `Your order status is now: ${status}.` };
  const body = `
    <p style="font-size:18px;margin:0 0 8px">Hi ${customerName || 'there'},</p>
    ${badge(`${cfg.emoji} ${cfg.label}`, cfg.color)}
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:20px 0">
      <div style="font-size:13px;color:#64748b;margin-bottom:4px">Order #${order.id}</div>
      <p style="margin:0;font-size:15px;font-weight:600;color:#1e293b">${cfg.msg}</p>
    </div>
    ${status === 'shipped' ? `<p style="font-size:14px;color:#64748b">Delivery address: <strong>${order.shippingAddress}</strong></p>` : ''}
    ${btn(`${SITE_URL}/orders/${order.id}`, 'View Order Details', cfg.color)}`;
  await send(customerEmail, `${cfg.emoji} Order #${order.id} — ${cfg.label} | ${BRAND}`, layout(`Order ${cfg.label}`, cfg.color, body));
}

// ─── Repair quote ─────────────────────────────────────────────────────────────

export async function sendRepairQuoteEmail({ ticket, customerEmail, customerName }) {
  if (!customerEmail) return;
  const cost = ticket.quotedCost ? `$${(ticket.quotedCost / 100).toFixed(2)}` : 'TBD';
  const body = `
    <p style="font-size:18px;margin:0 0 8px">Hi ${customerName || 'there'},</p>
    <p style="color:#64748b;margin:0 0 24px">We've reviewed your device and prepared a repair quote for you.</p>
    ${badge('💰 Quote Ready', '#f59e0b')}
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:24px;margin:20px 0">
      <div style="font-size:13px;color:#92400e;margin-bottom:4px">Repair Ticket #${ticket.id}</div>
      <div style="font-size:20px;font-weight:800;color:#0f172a;margin-bottom:8px">${ticket.productName}</div>
      <div style="font-size:13px;color:#64748b;margin-bottom:16px">${ticket.issue}</div>
      <div style="font-size:13px;color:#92400e;font-weight:600">Quoted Cost</div>
      <div style="font-size:32px;font-weight:800;color:#d97706">${cost}</div>
      ${ticket.quoteNotes ? `<p style="margin:12px 0 0;font-size:13px;color:#78350f;background:#fef3c7;padding:12px;border-radius:8px">${ticket.quoteNotes}</p>` : ''}
    </div>
    <p style="font-size:14px;color:#64748b">Please log in to accept or decline this quote. The quote is valid for 48 hours.</p>
    ${btn(`${SITE_URL}/account#repairs`, 'Accept or Decline Quote', '#f59e0b')}`;
  await send(customerEmail, `💰 Repair Quote Ready: ${ticket.productName} — ${BRAND}`, layout('Repair Quote', '#f59e0b', body));
}

// ─── Repair status update ─────────────────────────────────────────────────────

const REPAIR_STATUS_CONFIG = {
  open:          { emoji: '📋', color: '#64748b', msg: 'Your repair ticket has been received and is awaiting review.' },
  in_progress:   { emoji: '🔧', color: '#f59e0b', msg: 'Great news! Our technician is now working on your device.' },
  waiting_parts: { emoji: '⏳', color: '#8b5cf6', msg: 'We are waiting for parts to arrive. We\'ll update you as soon as they do.' },
  completed:     { emoji: '✅', color: '#10b981', msg: 'Your repair is complete! Your device is ready for pickup or delivery.' },
  cancelled:     { emoji: '❌', color: '#ef4444', msg: 'Your repair ticket has been cancelled. Please contact us if you have questions.' },
};

export async function sendRepairStatusEmail({ ticket, status, customerEmail, customerName }) {
  if (!customerEmail) return;
  const cfg = REPAIR_STATUS_CONFIG[status] || { emoji: '📋', color: '#64748b', msg: `Your repair status is now: ${status}.` };
  const body = `
    <p style="font-size:18px;margin:0 0 8px">Hi ${customerName || 'there'},</p>
    ${badge(`${cfg.emoji} Repair ${status.replace('_', ' ')}`, cfg.color)}
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:20px 0">
      <div style="font-size:13px;color:#64748b;margin-bottom:4px">Repair Ticket #${ticket.id} · ${ticket.productName}</div>
      <p style="margin:0;font-size:15px;font-weight:600;color:#1e293b">${cfg.msg}</p>
    </div>
    ${status === 'completed' ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:0 0 20px;font-size:14px;color:#166534">📍 <strong>Pickup:</strong> Visit our store at Kigali or call ${SUPPORT_PHONE} to arrange delivery.</div>` : ''}
    ${btn(`${SITE_URL}/account#repairs`, 'View Repair Status', cfg.color)}`;
  await send(customerEmail, `${cfg.emoji} Repair Update: ${ticket.productName} — ${BRAND}`, layout('Repair Update', cfg.color, body));
}

// ─── Welcome email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail({ name, email }) {
  if (!email || email.includes('@phone.kigalitech.com')) return;
  const body = `
    <p style="font-size:20px;margin:0 0 4px">Welcome to ${BRAND}, ${name || 'there'}! 🎉</p>
    <p style="color:#64748b;margin:0 0 28px">Rwanda's #1 electronics destination. Here's what you can do:</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${[
        ['🛒', 'Shop top brands', 'Phones, laptops, TVs, audio and more — all with official warranty.'],
        ['📦', 'Track orders', 'Real-time updates from checkout to your door.'],
        ['⭐', 'Earn loyalty points', '1 point for every $1 spent — redeem for discounts.'],
        ['🔧', 'Repair service', 'Book a device repair right from your account.'],
      ].map(([icon, title, desc]) => `<tr><td style="padding:12px 0;vertical-align:top;width:48px;font-size:24px">${icon}</td><td style="padding:12px 0;vertical-align:top"><strong style="font-size:14px">${title}</strong><br/><span style="font-size:13px;color:#64748b">${desc}</span></td></tr>`).join('')}
    </table>
    ${btn(`${SITE_URL}/products`, 'Start Shopping')}
    <p style="margin:20px 0 0;font-size:13px;color:#94a3b8">Questions? Call or WhatsApp: <strong>${SUPPORT_PHONE}</strong></p>`;
  await send(email, `Welcome to ${BRAND} 🎉`, layout('Welcome!', '#0ea5e9', body));
}

// ─── Low stock alert (admin) ──────────────────────────────────────────────────

export async function sendLowStockAlert({ product }) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;
  if (!adminEmail) return;
  const body = `
    <p style="font-size:16px;margin:0 0 20px">A product is running low on stock and needs restocking.</p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:24px;margin:0 0 24px">
      <div style="font-size:20px;font-weight:800;color:#0f172a;margin-bottom:12px">${product.name}</div>
      <div style="display:grid;gap:8px">
        <div style="font-size:13px;color:#64748b">Product ID: <strong>#${product.id}</strong></div>
        <div style="font-size:13px;color:#64748b">Current Stock: <strong style="color:#ef4444;font-size:18px">${product.stock} units</strong></div>
        <div style="font-size:13px;color:#64748b">Threshold: <strong>${product.lowStockThreshold}</strong></div>
      </div>
    </div>
    ${btn(`${SITE_URL}/admin/products/${product.id}`, 'Update Stock Level', '#f59e0b')}`;
  await send(adminEmail, `⚠️ Low Stock: ${product.name} (${product.stock} left) — ${BRAND}`, layout('⚠️ Low Stock Alert', '#f59e0b', body));
}

// ─── Email verification OTP ───────────────────────────────────────────────────

export async function sendVerificationEmail({ email, name, code }) {
  if (!email || email.includes('@phone.kigalitech.com')) return;
  const body = `
    <p style="font-size:18px;margin:0 0 8px">Hi ${name || 'there'} 👋</p>
    <p style="color:#64748b;margin:0 0 28px">Please verify your email address to activate your ${BRAND} account.</p>
    <div style="background:linear-gradient(135deg,#1e40af,#1d4ed8);border-radius:20px;padding:36px;text-align:center;margin:0 0 28px">
      <div style="font-size:13px;font-weight:600;color:#bfdbfe;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px">Your verification code</div>
      <div style="display:inline-flex;gap:8px;justify-content:center">
        ${code.split('').map(d => `<span style="display:inline-block;width:44px;height:56px;line-height:56px;text-align:center;background:rgba(255,255,255,0.15);border-radius:12px;font-size:28px;font-weight:800;color:#fff;letter-spacing:0">${d}</span>`).join('')}
      </div>
      <div style="font-size:12px;color:#93c5fd;margin-top:16px">This code expires in <strong style="color:#fff">10 minutes</strong></div>
    </div>
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px;margin:0 0 24px;font-size:13px;color:#0369a1">
      <strong>🔒 Security tip:</strong> KigaliTech will never ask for this code via phone or WhatsApp. Only enter it on our website.
    </div>
    ${btn(`${SITE_URL}/verify-email?email=${encodeURIComponent(email)}`, 'Verify Email Now', '#2563eb')}
    <p style="margin:20px 0 0;font-size:12px;color:#94a3b8">If you didn't create a ${BRAND} account, you can safely ignore this email.</p>`;
  await send(email, `🔐 Your ${BRAND} verification code: ${code}`, layout('Email Verification', '#2563eb', body));
}

// ─── Loyalty points earned ────────────────────────────────────────────────────

export async function sendLoyaltyPointsEmail({ email, name, pointsEarned, newBalance, orderId }) {
  if (!email || email.includes('@phone.kigalitech.com')) return;
  const body = `
    <p style="font-size:18px;margin:0 0 8px">Hi ${name || 'there'},</p>
    <p style="color:#64748b;margin:0 0 24px">You just earned loyalty points from your order!</p>
    <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);border-radius:16px;padding:28px;text-align:center;margin:0 0 24px">
      <div style="font-size:13px;color:#a5b4fc;margin-bottom:4px">Points earned</div>
      <div style="font-size:40px;font-weight:800;color:#fff">+${pointsEarned}</div>
      <div style="font-size:13px;color:#a5b4fc;margin-top:8px">New balance: <strong style="color:#fff">${newBalance} pts</strong></div>
    </div>
    <p style="font-size:13px;color:#64748b;text-align:center">Every 100 points = $1 discount on your next order.</p>
    ${btn(`${SITE_URL}/account/loyalty`, 'View My Points', '#6366f1')}`;
  await send(email, `🌟 You earned ${pointsEarned} loyalty points — ${BRAND}`, layout('Loyalty Points Earned', '#6366f1', body));
}

// ─── Newsletter welcome ───────────────────────────────────────────────────────

export async function sendNewsletterWelcome({ email, name, code }) {
  if (!email) return;
  const body = `
    <p style="font-size:18px;margin:0 0 8px">Hi ${name || 'there'} 🎉</p>
    <p style="color:#64748b;margin:0 0 24px">Thanks for subscribing! Here's your exclusive 10% discount code:</p>
    <div style="background:linear-gradient(135deg,#0f172a,#0c4a6e);border-radius:16px;padding:28px;text-align:center;margin:0 0 24px">
      <div style="font-size:13px;color:#7dd3fc;margin-bottom:8px;text-transform:uppercase;letter-spacing:2px">Your discount code</div>
      <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:3px;font-family:monospace">${code}</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:8px">10% off · One use · No minimum</div>
    </div>
    <p style="font-size:13px;color:#64748b">Enter this code at checkout to save 10% on your first order. Valid for one use only.</p>
    ${btn(`${SITE_URL}/products`, 'Shop Now & Save 10%', '#0ea5e9')}`;
  await send(email, `🎁 Your 10% discount code — ${BRAND}`, layout('Welcome Gift', '#0ea5e9', body));
}

// ─── Abandoned cart ───────────────────────────────────────────────────────────

export async function sendTradeInUpdate({ email, name, productName, action, offeredPrice, couponCode, finalPrice, rejectReason }) {
  if (!email) return;
  const configs = {
    offer: {
      subject: `💰 We have an offer for your ${productName}`,
      title: 'Trade-In Offer',
      accent: '#0ea5e9',
      body: `
        <p style="font-size:18px;margin:0 0 8px">Hi ${name || 'there'} 👋</p>
        <p style="color:#64748b;margin:0 0 24px">We've reviewed your <strong>${productName}</strong> trade-in request and have an offer for you.</p>
        <div style="background:linear-gradient(135deg,#0f172a,#0c4a6e);border-radius:16px;padding:28px;text-align:center;margin:0 0 24px">
          <div style="font-size:13px;color:#7dd3fc;margin-bottom:6px;text-transform:uppercase;letter-spacing:2px">Our Offer</div>
          <div style="font-size:36px;font-weight:800;color:#fff">RWF ${(offeredPrice/100).toLocaleString()}</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:6px">For your ${productName}</div>
        </div>
        <p style="font-size:14px;color:#64748b;">You can accept, counter-offer, or decline this offer in your account.</p>
        ${btn(`${SITE_URL}/account?tab=trade-ins`, 'View Offer', '#0ea5e9')}`,
    },
    confirmed: {
      subject: `🎉 Trade-in confirmed — here's your coupon!`,
      title: 'Trade-In Confirmed',
      accent: '#10b981',
      body: `
        <p style="font-size:18px;margin:0 0 8px">Congratulations ${name || 'there'} 🎉</p>
        <p style="color:#64748b;margin:0 0 24px">Your trade-in for <strong>${productName}</strong> has been confirmed at <strong>RWF ${(finalPrice/100).toLocaleString()}</strong>.</p>
        <div style="background:linear-gradient(135deg,#065f46,#047857);border-radius:16px;padding:28px;text-align:center;margin:0 0 24px">
          <div style="font-size:13px;color:#6ee7b7;margin-bottom:8px;text-transform:uppercase;letter-spacing:2px">Your Discount Coupon</div>
          <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:3px;font-family:monospace">${couponCode}</div>
          <div style="font-size:12px;color:#a7f3d0;margin-top:8px">Worth RWF ${(finalPrice/100).toLocaleString()} · One use · Apply at checkout</div>
        </div>
        ${btn(`${SITE_URL}/products`, 'Shop Now', '#10b981')}`,
    },
    rejected: {
      subject: `Trade-in update for your ${productName}`,
      title: 'Trade-In Update',
      accent: '#64748b',
      body: `
        <p style="font-size:18px;margin:0 0 8px">Hi ${name || 'there'},</p>
        <p style="color:#64748b;margin:0 0 16px">Thank you for submitting your <strong>${productName}</strong> for trade-in.</p>
        <p style="color:#64748b;margin:0 0 24px">Unfortunately, we are unable to accept this trade-in at this time.${rejectReason ? ` Reason: ${rejectReason}` : ''}</p>
        <p style="font-size:13px;color:#94a3b8;">If you have questions, please reach us on WhatsApp: <a href="https://wa.me/250786276555" style="color:#0ea5e9">+250 786 276 555</a></p>`,
    },
  };
  const cfg = configs[action];
  if (!cfg) return;
  await send(email, cfg.subject, layout(cfg.title, cfg.accent, cfg.body));
}

export async function sendTempPasswordEmail({ email, name, tempPassword }) {
  if (!email) return;
  const body = `
    <p style="font-size:18px;margin:0 0 8px">Password Reset Request</p>
    <p style="color:#64748b;margin:0 0 24px">Hi ${name || 'there'}, here is your temporary password. Use it to sign in, then you will be asked to create a new password.</p>
    <div style="background:#f0f9ff;border:2px dashed #0ea5e9;border-radius:16px;padding:20px 24px;text-align:center;margin:0 0 24px">
      <p style="margin:0 0 6px;font-size:12px;color:#64748b;letter-spacing:1px;text-transform:uppercase">Temporary Password</p>
      <p style="margin:0;font-size:28px;font-weight:800;font-family:monospace;letter-spacing:4px;color:#0284c7">${tempPassword}</p>
    </div>
    <p style="color:#64748b;font-size:13px;margin:0 0 24px">⚠️ This password expires as soon as you use it. After signing in you must set a new password immediately.</p>
    ${btn(`${SITE_URL}/signin`, 'Sign In Now', '#0ea5e9')}
    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8">If you did not request this, ignore this email — your account is safe.</p>`;
  await send(email, `Your temporary password — ${BRAND}`, layout('Temporary Password', '#0ea5e9', body));
}

export async function sendAbandonedCartEmail({ email, items }) {
  if (!email) return;
  const itemList = items.slice(0, 3).map(i =>
    `<tr><td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:14px">${i.name}</td><td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:14px">$${((i.price||0)/100).toFixed(2)}</td></tr>`
  ).join('');
  const body = `
    <p style="font-size:18px;margin:0 0 8px">You left something behind! 🛒</p>
    <p style="color:#64748b;margin:0 0 24px">Your cart is waiting for you at KigaliTech.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f8fafc;border-radius:12px;overflow:hidden;margin:0 0 24px">
      <tbody>${itemList}</tbody>
    </table>
    ${items.length > 3 ? `<p style="font-size:13px;color:#64748b;margin:-16px 0 24px">+ ${items.length - 3} more items</p>` : ''}
    ${btn(`${SITE_URL}/checkout`, 'Complete My Order', '#0ea5e9')}
    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8">Need help? WhatsApp us: <a href="https://wa.me/250786276555" style="color:#0ea5e9">+250 786 276 555</a></p>`;
  await send(email, `🛒 You left items in your cart — ${BRAND}`, layout('Your Cart is Waiting', '#0ea5e9', body));
}
