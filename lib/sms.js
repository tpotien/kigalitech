import AfricasTalking from 'africastalking';

let _client = null;

function getClient() {
  const apiKey = process.env.AFRICAS_TALKING_API_KEY;
  const username = process.env.AFRICAS_TALKING_USERNAME;

  if (!apiKey || !username || apiKey === 'placeholder' || username === 'placeholder') {
    return null;
  }

  if (!_client) {
    _client = AfricasTalking({ apiKey, username });
  }

  return _client;
}

/**
 * Send an SMS message via Africa's Talking.
 * @param {string} to   - Recipient phone number (E.164 recommended, e.g. +250786276555)
 * @param {string} message - Text content
 * @returns {{ sent: boolean, messageId?: string, error?: string }}
 */
export async function sendSms(to, message) {
  const client = getClient();

  if (!client) {
    console.warn('[SMS] Africa\'s Talking is not configured. Set AFRICAS_TALKING_API_KEY and AFRICAS_TALKING_USERNAME.');
    return { sent: false, error: 'not configured' };
  }

  try {
    const sms = client.SMS;
    const result = await sms.send({ to: [to], message });

    const recipient = result?.SMSMessageData?.Recipients?.[0];
    const statusCode = recipient?.statusCode;

    // Africa's Talking statusCode 101 = success
    if (statusCode === 101 || statusCode === '101') {
      return { sent: true, messageId: recipient?.messageId };
    }

    const errorMsg = recipient?.status || result?.SMSMessageData?.Message || 'Unknown error';
    return { sent: false, error: errorMsg };
  } catch (err) {
    console.error('[SMS] Send failed:', err.message);
    return { sent: false, error: err.message };
  }
}

export const SMS_TEMPLATES = {
  orderConfirmed: (name, orderId, total) =>
    `Dear ${name}, your KigaliTech order #${orderId} is confirmed! Total: ${total}. Track: kigalitech.com/orders/${orderId}`,

  orderShipped: (name, orderId) =>
    `Hi ${name}! Your order #${orderId} has been shipped. Track: kigalitech.com/orders/${orderId}`,

  orderDelivered: (name, orderId) =>
    `Hi ${name}! Your order #${orderId} has been delivered. Enjoy! Need help? Call +250786276555`,

  stockAlert: (productName) =>
    `KigaliTech: Great news! "${productName}" is back in stock. Shop now: kigalitech.com`,

  repairUpdate: (ticketId, status) =>
    `KigaliTech Repairs: Your ticket #${ticketId} status is now: ${status}. Call +250786276555 for details.`,
};
