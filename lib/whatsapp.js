/**
 * WhatsApp Business notifications via Meta Cloud API.
 *
 * Required env vars:
 *   WHATSAPP_TOKEN      — Meta System User Token (permanent token from Business Manager)
 *   WHATSAPP_PHONE_ID   — Phone Number ID from WhatsApp Business Manager
 *
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
 */

const API_VERSION = 'v21.0';
const SITE_URL = process.env.NEXTAUTH_URL || 'https://kigalitechservices.com';

function normalizePhone(phone) {
  if (!phone) return null;
  // Strip all non-digit characters except leading +
  let cleaned = String(phone).replace(/\s/g, '').replace(/[-().]/g, '');
  // Remove leading +
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
  // Rwanda local numbers: 07XXXXXXXX → 2507XXXXXXXX
  if (cleaned.startsWith('07') && cleaned.length === 10) cleaned = '250' + cleaned.slice(1);
  if (cleaned.startsWith('7') && cleaned.length === 9) cleaned = '250' + cleaned;
  return cleaned || null;
}

async function send(to, body) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) {
    console.warn('[WhatsApp] Not configured — set WHATSAPP_TOKEN and WHATSAPP_PHONE_ID');
    return { sent: false, error: 'not configured' };
  }

  const recipient = normalizePhone(to);
  if (!recipient) return { sent: false, error: 'invalid phone number' };

  try {
    const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok && data.messages?.[0]?.id) {
      return { sent: true, messageId: data.messages[0].id };
    }
    const err = data.error?.message || JSON.stringify(data);
    console.error('[WhatsApp] API error:', err);
    return { sent: false, error: err };
  } catch (e) {
    console.error('[WhatsApp] Network error:', e.message);
    return { sent: false, error: e.message };
  }
}

/** Send a plain text message (works within 24-hour customer-initiated window). */
export async function sendWhatsAppText(to, message) {
  return send(to, {
    messaging_product: 'whatsapp',
    to: normalizePhone(to),
    type: 'text',
    text: { body: message, preview_url: false },
  });
}

/** Send an image message with optional caption. */
export async function sendWhatsAppImage(to, imageUrl, caption = '') {
  return send(to, {
    messaging_product: 'whatsapp',
    to: normalizePhone(to),
    type: 'image',
    image: { link: imageUrl, ...(caption ? { caption } : {}) },
  });
}

/**
 * Send a pre-approved template message (works anytime, no 24-hr restriction).
 * @param {string} to
 * @param {string} templateName  — template name in Meta Business Manager
 * @param {string} languageCode  — e.g. 'en_US'
 * @param {Array}  components    — template components array (body parameters, etc.)
 */
export async function sendWhatsAppTemplate(to, templateName, languageCode = 'en', components = []) {
  const payload = {
    messaging_product: 'whatsapp',
    to: normalizePhone(to),
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components.length ? { components } : {}),
    },
  };
  return send(to, payload);
}

// ─── Event helpers ────────────────────────────────────────────────────────────

export async function whatsappOrderPlaced(phone, name, orderId, total) {
  const msg =
    `Hello ${name}! 🛍️\n\n` +
    `Your KigaliTech order *#${orderId}* has been received.\n` +
    `💰 Total: *RWF ${Math.round(total).toLocaleString()}*\n\n` +
    `We'll confirm it shortly. Track your order here:\n` +
    `${SITE_URL}/orders/${orderId}\n\n` +
    `Thank you for shopping with us! 🙏`;
  return sendWhatsAppText(phone, msg);
}

export async function whatsappOrderStatus(phone, name, orderId, status) {
  const messages = {
    confirmed:  `Hello ${name}! ✅\n\nYour order *#${orderId}* is confirmed and we're preparing it now.\nTrack: ${SITE_URL}/orders/${orderId}`,
    processing: `Hello ${name}! ⚙️\n\nYour order *#${orderId}* is being packed and will ship soon.\nTrack: ${SITE_URL}/orders/${orderId}`,
    shipped:    `Hello ${name}! 🚚\n\nGreat news — your order *#${orderId}* is on its way!\nTrack: ${SITE_URL}/orders/${orderId}`,
    delivered:  `Hello ${name}! 🎉\n\nYour order *#${orderId}* has been delivered. Enjoy!\n\nNeed help? Reply here or call *+250 786 276 555*`,
    cancelled:  `Hello ${name}. ❌\n\nYour order *#${orderId}* has been cancelled.\n\nQuestions? Contact us:\n📞 +250 786 276 555\n💬 Reply to this message`,
  };
  const msg = messages[status];
  if (!msg) return { sent: false, error: 'unknown status' };
  return sendWhatsAppText(phone, msg);
}

export async function whatsappRepairUpdate(phone, name, ticketId, status) {
  const label = {
    received:    'received and logged',
    diagnosing:  'being diagnosed',
    repairing:   'under repair',
    ready:       'ready for pickup/delivery',
    completed:   'completed',
    cancelled:   'cancelled',
  }[status] || status;

  const msg =
    `Hello ${name}! 🔧\n\n` +
    `Your KigaliTech repair ticket *#${ticketId}* has been updated:\n` +
    `📋 Status: *${label}*\n\n` +
    `Questions? Call *+250 786 276 555* or reply here.`;
  return sendWhatsAppText(phone, msg);
}

export async function whatsappStockAlert(phone, name, productName) {
  const msg =
    `Hello ${name}! 🔔\n\n` +
    `Good news — *${productName}* is back in stock at KigaliTech!\n\n` +
    `Shop now: ${SITE_URL}\n\n` +
    `Reply STOP to unsubscribe from stock alerts.`;
  return sendWhatsAppText(phone, msg);
}

export async function whatsappWelcome(phone, name) {
  const msg =
    `Hello ${name}! 👋\n\n` +
    `Welcome to *KigaliTech*! Your WhatsApp is now linked to your account.\n\n` +
    `You'll receive order updates, repair status, and alerts here.\n\n` +
    `Shop: ${SITE_URL} | Help: +250 786 276 555`;
  return sendWhatsAppText(phone, msg);
}

export async function whatsappPaymentReminder(phone, name, orderId, total) {
  const msg =
    `Hello ${name}! ⏰\n\n` +
    `Your KigaliTech order *#${orderId}* is waiting for payment.\n` +
    `💰 Amount due: *RWF ${Math.round(total).toLocaleString()}*\n\n` +
    `Complete your payment: ${SITE_URL}/orders/${orderId}\n\n` +
    `Need help? Call *+250 786 276 555*`;
  return sendWhatsAppText(phone, msg);
}
