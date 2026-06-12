import prisma from '../../lib/prisma';
import { sendWhatsAppText, sendWhatsAppImage } from '../../lib/whatsapp';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'kigalitech2025';
const SITE_URL     = process.env.NEXTAUTH_URL || 'https://kigalitechservices.com';
const LOGO_URL     = `${SITE_URL}/logo.png`;

const BIZ = {
  name:    'KigaliTech',
  tagline: 'Your trusted tech partner in Kigali, Rwanda 🇷🇼',
  address: 'KN 74 St, Kigali, Rwanda',
  phone:   '+250 786 276 555',
  email:   'kigalitechservices@gmail.com',
  hours:   'Every day  |  6:00 AM – 12:00 AM',
};

// Signature appended to every outgoing message
const SIG = `\n\n—\n*${BIZ.name}* · ${BIZ.address}\n📞 ${BIZ.phone}`;

// Extract 9-digit core for fuzzy phone matching
function coreDigits(phone) {
  let p = String(phone || '').replace(/\D/g, '');
  if (p.startsWith('250')) p = p.slice(3);
  if (p.startsWith('0'))   p = p.slice(1);
  return p;
}

const ORDER_STATUS = {
  pending:    '⏳ Pending payment',
  confirmed:  '✅ Confirmed',
  processing: '⚙️ Being prepared',
  shipped:    '🚚 Shipped',
  delivered:  '🎉 Delivered',
  cancelled:  '❌ Cancelled',
};

const REPAIR_STATUS = {
  open:        '📋 Open',
  in_progress: '🔧 In progress',
  ready:       '✅ Ready for pickup',
  completed:   '🎉 Completed',
  cancelled:   '❌ Cancelled',
};

function mainMenu() {
  return (
    `👋 Welcome to *${BIZ.name}*!\n` +
    `_${BIZ.tagline}_\n\n` +
    `How can I help you today?\n\n` +
    `1️⃣  Track my order\n` +
    `2️⃣  Repair status\n` +
    `3️⃣  Search products\n` +
    `4️⃣  Delivery info\n` +
    `5️⃣  Contact & hours\n\n` +
    `Reply with a number or type your question directly.` +
    SIG
  );
}

async function handleMessage(senderPhone, text) {
  const t  = (text || '').trim();
  const tl = t.toLowerCase();
  const core = coreDigits(senderPhone);

  // ── Greeting ──────────────────────────────────────────────────────────────
  if (!t || /^(hi|hello|hey|start|menu|help|hola|muraho|bonjour|salut|yo|sup|0)$/i.test(t)) {
    // Send logo first, then menu — returned as array for multi-message handling
    return [{ type: 'image', url: LOGO_URL, caption: `${BIZ.name} — ${BIZ.tagline}` }, { type: 'text', body: mainMenu() }];
  }

  // ── Option 1 / order keywords ──────────────────────────────────────────────
  if (tl === '1' || /\b(order|orders|track|my order|nimero|numero|commande)\b/i.test(tl)) {
    const orders = await prisma.order.findMany({
      where: { shippingPhone: { contains: core } },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true, status: true, total: true, createdAt: true,
        items: { select: { name: true, quantity: true }, take: 1 },
      },
    });

    if (!orders.length) {
      return (
        `🔍 No orders found for your number.\n\n` +
        `Try sending your *order number* directly (e.g. *"Order 45"*).\n\n` +
        `Shop: ${SITE_URL}` + SIG
      );
    }

    const lines = orders.map(o => {
      const item = o.items[0]?.name || 'items';
      return `📦 Order *#${o.id}* — ${ORDER_STATUS[o.status] || o.status}\n   ${item} · RWF ${Math.round(o.total).toLocaleString()}`;
    });

    return (
      `📋 *Your recent orders:*\n\n${lines.join('\n\n')}\n\n` +
      `Send the *order number* for full details (e.g. *"45"*).` + SIG
    );
  }

  // ── Option 2 / repair keywords ─────────────────────────────────────────────
  if (tl === '2' || /\b(repair|fix|ticket|broken|damage|kugarura|reparation)\b/i.test(tl)) {
    const user = await prisma.user.findFirst({
      where: { phoneNumber: { contains: core } },
      select: { id: true },
    });

    const repairs = user
      ? await prisma.repairTicket.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: { id: true, status: true, productName: true, quotedCost: true, quoteStatus: true },
        })
      : [];

    if (!repairs.length) {
      return (
        `🔍 No repair tickets found for your number.\n\n` +
        `Submit a repair request:\n🌐 ${SITE_URL}/repairs` + SIG
      );
    }

    const lines = repairs.map(r => {
      let line = `🔧 Ticket *#${r.id}* — ${r.productName}\n   ${REPAIR_STATUS[r.status] || r.status}`;
      if (r.quoteStatus === 'quoted' && r.quotedCost > 0)
        line += `\n   💰 Quote: RWF ${Math.round(r.quotedCost).toLocaleString()}`;
      return line;
    });

    return `🛠️ *Your repair tickets:*\n\n${lines.join('\n\n')}\n\nFull details: ${SITE_URL}/account#repairs` + SIG;
  }

  // ── Option 3 / product hint ────────────────────────────────────────────────
  if (tl === '3') {
    return (
      `🛍️ *Search products*\n\n` +
      `Type a product name or brand, for example:\n` +
      `• *"iPhone 15"*\n• *"Samsung TV"*\n• *"AirPods"*\n• *"Laptop"*\n\n` +
      `Browse everything: ${SITE_URL}/products` + SIG
    );
  }

  // ── Option 4 / delivery ────────────────────────────────────────────────────
  if (tl === '4' || /\b(delivery|shipping|deliver|free delivery|how long|amafaranga|kwishyura)\b/i.test(tl)) {
    return (
      `🚚 *${BIZ.name} — Delivery Info*\n\n` +
      `✅ First *5 orders* — FREE delivery\n` +
      `📍 *Kigali:* same day or next day\n` +
      `🗺️ *Outside Kigali:* 1–3 business days\n` +
      `💰 Standard fee: RWF 14,730\n\n` +
      `We deliver across all of Rwanda 🇷🇼` + SIG
    );
  }

  // ── Option 5 / contact ─────────────────────────────────────────────────────
  if (tl === '5' || /\b(contact|agent|human|call|staff|support|speak|talk)\b/i.test(tl)) {
    return (
      `📞 *${BIZ.name} — Contact Us*\n\n` +
      `📍 *Address:* ${BIZ.address}\n` +
      `💬 *WhatsApp:* ${BIZ.phone}\n` +
      `📧 *Email:* ${BIZ.email}\n` +
      `🌐 *Website:* ${SITE_URL}\n\n` +
      `🕐 *Hours:* ${BIZ.hours}\n\n` +
      `Our team will respond shortly! 🙏`
    );
  }

  // ── Direct order number (pure digits or "order 45") ────────────────────────
  const orderMatch = t.match(/^(?:order\s*#?\s*)?(\d{1,6})$/i);
  if (orderMatch) {
    const orderId = Number(orderMatch[1]);
    if (orderId > 0) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true, status: true, total: true, shippingName: true,
          shippingPhone: true, createdAt: true,
          items: { select: { name: true, quantity: true, price: true } },
        },
      });

      if (!order) return `Order *#${orderId}* not found. Please check the number and try again.` + SIG;

      if (!order.shippingPhone?.includes(core)) {
        return (
          `Order *#${orderId}* found but it's not linked to your number.\n\n` +
          `Contact us for help:\n📞 ${BIZ.phone}` + SIG
        );
      }

      const date = new Date(order.createdAt).toLocaleDateString('en-RW', { day: 'numeric', month: 'short', year: 'numeric' });
      const itemList = order.items.map(i => `  • ${i.name} × ${i.quantity} — RWF ${Math.round(i.price).toLocaleString()}`).join('\n');

      return (
        `📦 *Order #${order.id}* — *${BIZ.name}*\n\n` +
        `👤 ${order.shippingName}\n` +
        `📅 ${date}\n` +
        `📋 Status: *${ORDER_STATUS[order.status] || order.status}*\n\n` +
        `*Items:*\n${itemList}\n\n` +
        `💰 Total: *RWF ${Math.round(order.total).toLocaleString()}*\n\n` +
        `Need help? Reply *agent* or call ${BIZ.phone}` + SIG
      );
    }
  }

  // ── Product name search ────────────────────────────────────────────────────
  if (t.length >= 3) {
    const products = await prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: t, mode: 'insensitive' } },
          { brand: { contains: t, mode: 'insensitive' } },
          { category: { contains: t, mode: 'insensitive' } },
        ],
      },
      select: { name: true, price: true, stock: true, comparePrice: true },
      orderBy: [{ featured: 'desc' }, { stock: 'desc' }],
      take: 5,
    });

    if (products.length) {
      const lines = products.map(p => {
        const avail = p.stock > 0 ? '✅ In stock' : '❌ Out of stock';
        const slash = p.comparePrice && p.comparePrice > p.price
          ? ` _(was RWF ${Math.round(p.comparePrice).toLocaleString()})_`
          : '';
        return `• *${p.name}*${slash}\n  RWF ${Math.round(p.price).toLocaleString()} · ${avail}`;
      });

      return (
        `🛍️ *${BIZ.name}* — found *${products.length}* result(s) for "${t}":\n\n` +
        `${lines.join('\n\n')}\n\n` +
        `Order online: ${SITE_URL}/products` + SIG
      );
    }
  }

  // ── Fallback ───────────────────────────────────────────────────────────────
  return (
    `Sorry, I didn't understand that. 😅\n\n` +
    `Here's what I can do:\n\n` +
    `1️⃣  Track my order\n` +
    `2️⃣  Repair status\n` +
    `3️⃣  Search products\n` +
    `4️⃣  Delivery info\n` +
    `5️⃣  Contact us\n\n` +
    `Or type an *order number* or *product name* directly.` + SIG
  );
}

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  // Meta webhook verification (GET)
  if (req.method === 'GET') {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      res.setHeader('Content-Type', 'text/plain');
      res.status(200).end(challenge);
      return;
    }
    return res.status(403).end('Forbidden');
  }

  if (req.method !== 'POST') return res.status(405).end();

  // Always 200 Meta immediately — they retry on anything else
  res.status(200).json({ status: 'ok' });

  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    if (!value?.messages?.length) return;

    const message = value.messages[0];
    const senderPhone = message.from;

    // Non-text messages — politely redirect
    if (message.type !== 'text') {
      await sendWhatsAppText(
        senderPhone,
        `I can only read text messages for now. 😊\n\nType *menu* to see what I can help with.` + SIG
      );
      return;
    }

    const reply = await handleMessage(senderPhone, message.text?.body || '');

    if (!reply) return;

    // Reply can be a single string or an array of {type, ...} objects (e.g. logo + text)
    const parts = Array.isArray(reply) ? reply : [{ type: 'text', body: reply }];

    for (const part of parts) {
      if (part.type === 'image') {
        await sendWhatsAppImage(senderPhone, part.url, part.caption || '');
      } else {
        await sendWhatsAppText(senderPhone, part.body);
      }
    }
  } catch (err) {
    console.error('[WhatsApp Bot]', err.message);
  }
}
