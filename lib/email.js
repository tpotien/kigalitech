import nodemailer from 'nodemailer';

function getTransporter() {
  const server = process.env.EMAIL_SERVER;
  if (!server || server.includes('placeholder')) return null;

  try {
    const url = new URL(server);
    return nodemailer.createTransport({
      host: url.hostname,
      port: Number(url.port) || 587,
      secure: url.port === '465',
      auth: { user: url.username ? decodeURIComponent(url.username) : undefined, pass: url.password ? decodeURIComponent(url.password) : undefined },
    });
  } catch {
    return null;
  }
}

export async function sendOrderConfirmation({ order, shippingName, shippingEmail, items }) {
  const transporter = getTransporter();
  if (!transporter) return;

  const itemRows = items.map((i) =>
    `<tr><td style="padding:8px;border-bottom:1px solid #f1f5f9">${i.name} (${i.color || ''}${i.storage ? ' · ' + i.storage : ''})</td><td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:right">×${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600">$${((i.price * i.quantity) / 100).toFixed(2)}</td></tr>`
  ).join('');

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#1e293b">
      <div style="background:linear-gradient(135deg,#0f172a,#0c4a6e);padding:40px;text-align:center;border-radius:16px 16px 0 0">
        <h1 style="color:white;margin:0;font-size:28px">KigaliTech</h1>
        <p style="color:#7dd3fc;margin:8px 0 0">Order Confirmation</p>
      </div>
      <div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none">
        <p style="font-size:18px">Hi ${shippingName || 'there'} 👋</p>
        <p>Your order <strong>#${order.id}</strong> has been received and is being processed. We'll notify you when it ships.</p>
        <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:24px 0">
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="text-align:left;font-size:12px;text-transform:uppercase;color:#94a3b8"><th style="padding:8px">Item</th><th style="padding:8px;text-align:right">Qty</th><th style="padding:8px;text-align:right">Price</th></tr></thead>
            <tbody>${itemRows}</tbody>
            <tfoot><tr><td colspan="2" style="padding:12px 8px;font-weight:700;font-size:16px">Total</td><td style="padding:12px 8px;font-weight:700;font-size:16px;text-align:right">$${(order.total / 100).toFixed(2)}</td></tr></tfoot>
          </table>
        </div>
        <p style="margin:0">Have questions? Reply to this email or <a href="https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '250700000000'}" style="color:#0ea5e9">chat with us on WhatsApp</a>.</p>
      </div>
      <div style="padding:20px;text-align:center;color:#94a3b8;font-size:12px">
        <p>© KigaliTech · Track your order at <a href="${process.env.NEXTAUTH_URL}/orders/${order.id}" style="color:#0ea5e9">${process.env.NEXTAUTH_URL}/orders/${order.id}</a></p>
      </div>
    </div>`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@kigalitech.com',
    to: shippingEmail,
    subject: `Order #${order.id} confirmed — KigaliTech`,
    html,
  });
}

export async function sendLowStockAlert({ product }) {
  const transporter = getTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;
  if (!transporter || !adminEmail) return;

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#1e293b">
      <div style="background:linear-gradient(135deg,#92400e,#b45309);padding:32px;text-align:center;border-radius:16px 16px 0 0">
        <h1 style="color:white;margin:0;font-size:22px">⚠️ Low Stock Alert</h1>
        <p style="color:#fde68a;margin:6px 0 0">KigaliTech Inventory</p>
      </div>
      <div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none">
        <p>The following product is running low on stock and needs restocking:</p>
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px;margin:20px 0">
          <h2 style="margin:0 0 8px;color:#92400e">${product.name}</h2>
          <p style="margin:4px 0;color:#64748b">Product ID: <strong>#${product.id}</strong></p>
          <p style="margin:4px 0;color:#64748b">Current Stock: <strong style="color:#ef4444">${product.stock} units</strong></p>
          <p style="margin:4px 0;color:#64748b">Low Stock Threshold: <strong>${product.lowStockThreshold}</strong></p>
        </div>
        <a href="${process.env.NEXTAUTH_URL}/admin/products/${product.id}" style="display:inline-block;background:#f59e0b;color:white;padding:12px 24px;border-radius:50px;text-decoration:none;font-weight:600">Update Stock Level</a>
      </div>
    </div>`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@kigalitech.com',
    to: adminEmail,
    subject: `⚠️ Low Stock: ${product.name} (${product.stock} left)`,
    html,
  });
}

export async function sendOrderStatusUpdate({ order, status, customerEmail, customerName }) {
  const transporter = getTransporter();
  if (!transporter || !customerEmail) return;

  const messages = {
    confirmed: 'Your order has been confirmed by our team.',
    processing: 'We are now preparing your items for shipment.',
    shipped: 'Great news! Your order is on its way.',
    delivered: 'Your order has been delivered. Enjoy! 🎉',
    cancelled: 'Your order has been cancelled. Contact us if you have questions.',
  };

  const msg = messages[status] || `Your order status has been updated to: ${status}.`;

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#1e293b">
      <div style="background:linear-gradient(135deg,#0f172a,#0c4a6e);padding:32px;text-align:center;border-radius:16px 16px 0 0">
        <h1 style="color:white;margin:0;font-size:24px">KigaliTech</h1>
        <p style="color:#7dd3fc;margin:6px 0 0">Order Update</p>
      </div>
      <div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none">
        <p>Hi ${customerName || 'there'},</p>
        <p><strong>${msg}</strong></p>
        <p>Order: <strong>#${order.id}</strong></p>
        <a href="${process.env.NEXTAUTH_URL}/orders/${order.id}" style="display:inline-block;background:#0ea5e9;color:white;padding:12px 24px;border-radius:50px;text-decoration:none;font-weight:600;margin-top:16px">Track My Order</a>
      </div>
    </div>`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@kigalitech.com',
    to: customerEmail,
    subject: `Order #${order.id} — ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    html,
  });
}
