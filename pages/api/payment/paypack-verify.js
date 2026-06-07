// GET ?ref=xxx
// Verifies a Paypack transaction by querying the events API

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
  if (!data.access) throw new Error('Paypack auth: no access token in response');
  return data.access;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { ref } = req.query;
  if (!ref) return res.status(400).json({ error: 'ref query parameter is required' });

  const clientId = process.env.PAYPACK_CLIENT_ID;
  const clientSecret = process.env.PAYPACK_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId === 'placeholder' || clientSecret === 'placeholder') {
    return res.status(503).json({
      error: 'Paypack is not configured. Add PAYPACK_CLIENT_ID and PAYPACK_CLIENT_SECRET to your environment.',
    });
  }

  try {
    const token = await getPaypackToken();

    const verifyRes = await fetch(
      `https://payments.paypack.rw/api/events/transactions?ref=${encodeURIComponent(ref)}`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await verifyRes.json();

    if (!verifyRes.ok) {
      return res.status(400).json({ error: data.message || data.error || 'Verification failed' });
    }

    // Paypack events API returns transaction details; a "successful" cashin has kind='CASHIN' and status indicates success
    const transaction = data.transaction || data;
    const status = transaction.status || data.status || 'unknown';
    const paid = status === 'successful' || status === 'success';

    return res.status(200).json({
      paid,
      status,
      amount: transaction.amount ?? data.amount,
      ref,
    });
  } catch (err) {
    console.error('[paypack-verify]', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
