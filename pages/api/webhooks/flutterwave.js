import prisma from '../../../lib/prisma';

// CRITICAL: disable Next.js body parser so we can read the raw body for hash verification
export const config = {
  api: {
    bodyParser: false,
  },
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const webhookHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
  const receivedHash = req.headers['verif-hash'];

  // Verify the webhook signature
  if (webhookHash && webhookHash !== 'placeholder') {
    if (!receivedHash || receivedHash !== webhookHash) {
      console.warn('[flutterwave-webhook] Invalid verif-hash header');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } else {
    console.warn('[flutterwave-webhook] FLUTTERWAVE_WEBHOOK_HASH not set — skipping hash verification');
  }

  let payload;
  try {
    const rawBody = await getRawBody(req);
    payload = JSON.parse(rawBody.toString());
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { event, data } = payload;

  try {
    // Only act on successful charges
    if (event === 'charge.completed' && data?.status === 'successful') {
      const txRef = data.tx_ref;

      if (!txRef) {
        console.warn('[flutterwave-webhook] No tx_ref in payload');
        return res.status(200).json({ received: true });
      }

      // tx_ref is stored in order notes (format: "KT-<timestamp>-<orderId>")
      // Try to parse orderId from txRef first
      const txRefParts = txRef.match(/KT-\d+-(\d+)/);
      const parsedOrderId = txRefParts ? Number(txRefParts[1]) : null;

      let updatedCount = 0;

      if (parsedOrderId) {
        const result = await prisma.order.updateMany({
          where: { id: parsedOrderId, paymentConfirmed: false },
          data: { status: 'confirmed', paymentConfirmed: true },
        });
        updatedCount = result.count;
      }

      // Fallback: search notes field for the tx_ref
      if (updatedCount === 0) {
        const result = await prisma.order.updateMany({
          where: { notes: { contains: txRef }, paymentConfirmed: false },
          data: { status: 'confirmed', paymentConfirmed: true },
        });
        updatedCount = result.count;
      }

      console.log(`[flutterwave-webhook] charge.completed txRef=${txRef} updated=${updatedCount} orders`);
    }
  } catch (err) {
    console.error('[flutterwave-webhook] DB update error:', err.message);
    return res.status(500).json({ error: 'Internal server error processing event' });
  }

  return res.status(200).json({ received: true });
}
