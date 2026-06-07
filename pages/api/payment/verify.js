// Verify Flutterwave transaction by tx_ref or flw_ref
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { txRef, flwRef } = req.query;
  if (!txRef && !flwRef) return res.status(400).json({ error: 'txRef or flwRef required' });

  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey || secretKey === 'placeholder') {
    return res.status(503).json({ error: 'Flutterwave not configured' });
  }

  try {
    // Verify by transaction reference
    const url = flwRef
      ? `https://api.flutterwave.com/v3/transactions/${flwRef}/verify`
      : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${txRef}`;

    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const data = await r.json();

    if (data.status !== 'success') {
      return res.json({ paid: false, status: data.data?.status || 'unknown' });
    }

    res.json({
      paid: data.data?.status === 'successful',
      status: data.data?.status,
      amount: data.data?.amount,
      currency: data.data?.currency,
      txRef: data.data?.tx_ref,
      flwRef: data.data?.flw_ref,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
