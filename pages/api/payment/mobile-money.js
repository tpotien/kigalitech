// MTN MoMo & Airtel Money via Flutterwave
// Docs: https://developer.flutterwave.com/docs/collecting-payments/mobile-money/rwanda
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { amount, currency = 'RWF', phone, network, email, name, orderId, txRef } = req.body;

  if (!amount || !phone || !network) {
    return res.status(400).json({ error: 'amount, phone, and network are required' });
  }

  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey || secretKey === 'placeholder') {
    return res.status(503).json({
      error: 'Mobile money payments are not configured. Add FLUTTERWAVE_SECRET_KEY to your environment.',
    });
  }

  try {
    const payload = {
      tx_ref: txRef || `KT-${Date.now()}-${orderId || 0}`,
      amount: Math.ceil(amount), // amount is already in RWF
      currency,
      network: network === 'mtn' ? 'MTN' : 'AIRTEL',
      email: email || 'customer@kigalitechservices.com',
      phone_number: phone.replace(/\s+/g, '').replace(/^\+/, ''),
      fullname: name || 'Customer',
      redirect_url: `${process.env.NEXTAUTH_URL}/orders/confirm`,
      meta: { order_id: orderId },
    };

    const flwRes = await fetch('https://api.flutterwave.com/v3/charges?type=mobile_money_rwanda', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await flwRes.json();

    if (!flwRes.ok || data.status !== 'success') {
      return res.status(400).json({ error: data.message || 'Mobile money charge failed' });
    }

    res.json({
      status: data.data?.status,
      txRef: payload.tx_ref,
      flwRef: data.data?.flw_ref,
      message: data.message,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
