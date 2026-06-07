// POST body: { phone, amount, orderId, currency='RWF' }
// Authenticates with Paypack client_id/client_secret, then charges via cashin API

async function getPaypackToken() {
  const res = await fetch('https://payments.paypack.rw/api/auth/agents/authorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.PAYPACK_CLIENT_ID,
      client_secret: process.env.PAYPACK_CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paypack auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  // Paypack returns { access: '...', refresh: '...' }
  if (!data.access) throw new Error('Paypack auth: no access token in response');
  return data.access;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const clientId = process.env.PAYPACK_CLIENT_ID;
  const clientSecret = process.env.PAYPACK_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId === 'placeholder' || clientSecret === 'placeholder') {
    return res.status(503).json({
      error: 'Paypack payments are not configured. Add PAYPACK_CLIENT_ID and PAYPACK_CLIENT_SECRET to your environment.',
    });
  }

  const { phone, amount, orderId, currency = 'RWF' } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({ error: 'phone and amount are required' });
  }

  // Normalise phone: strip spaces and leading +
  const normalizedPhone = String(phone).replace(/\s+/g, '').replace(/^\+/, '');

  // amount is expected in cents from the client; Paypack works in whole RWF units
  const rwfAmount = Math.ceil(Number(amount) / 100);

  try {
    const token = await getPaypackToken();

    const chargeRes = await fetch('https://payments.paypack.rw/api/transactions/cashin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: rwfAmount,
        number: normalizedPhone,
        environment: 'production',
      }),
    });

    const data = await chargeRes.json();

    if (!chargeRes.ok) {
      return res.status(400).json({ error: data.message || data.error || 'Paypack cashin failed' });
    }

    // data.ref is the transaction reference for later verification
    const ref = data.ref || data.transaction?.ref;

    return res.status(200).json({
      ref,
      status: data.status || data.transaction?.status || 'pending',
      orderId,
      currency,
      amount: rwfAmount,
    });
  } catch (err) {
    console.error('[paypack-charge]', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
