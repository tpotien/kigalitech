import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === 'placeholder') {
    return res.status(503).json({ error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your environment.' });
  }

  const stripe = new Stripe(key, { apiVersion: '2023-10-16' });

  const { amount, currency = 'usd', metadata = {} } = req.body;
  if (!amount || amount < 50) return res.status(400).json({ error: 'Invalid amount' });

  try {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata,
    });
    res.json({ clientSecret: intent.client_secret, intentId: intent.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
