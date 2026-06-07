import Stripe from 'stripe';
import prisma from '../../../lib/prisma';

// CRITICAL: disable Next.js body parser so Stripe can verify the raw body signature
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

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || stripeSecretKey === 'placeholder') {
    return res.status(503).json({ error: 'Stripe is not configured' });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).json({ error: 'Missing stripe-signature header' });

  let event;
  try {
    const rawBody = await getRawBody(req);

    if (webhookSecret && webhookSecret !== 'placeholder') {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // In development without a webhook secret, parse manually (unsafe — set STRIPE_WEBHOOK_SECRET in prod)
      console.warn('[stripe-webhook] STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
      event = JSON.parse(rawBody.toString());
    }
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object;
        await prisma.order.updateMany({
          where: { stripePaymentIntentId: intent.id },
          data: {
            status: 'confirmed',
            paymentConfirmed: true,
          },
        });
        console.log(`[stripe-webhook] payment_intent.succeeded: ${intent.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object;
        await prisma.order.updateMany({
          where: { stripePaymentIntentId: intent.id },
          data: { status: 'payment_failed' },
        });
        console.log(`[stripe-webhook] payment_intent.payment_failed: ${intent.id}`);
        break;
      }

      default:
        // Unhandled event — acknowledge receipt so Stripe doesn't retry
        break;
    }
  } catch (err) {
    console.error('[stripe-webhook] DB update error:', err.message);
    return res.status(500).json({ error: 'Internal server error processing event' });
  }

  return res.status(200).json({ received: true });
}
