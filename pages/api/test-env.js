// Quick diagnostic: check what DATABASE_URL Vercel is sending
export default function handler(req, res) {
  const url = process.env.DATABASE_URL || 'NOT SET';
  const hasValue = url.length > 10;
  const prefix = url.substring(0, 30);
  res.json({ hasValue, prefix, len: url.length });
}
