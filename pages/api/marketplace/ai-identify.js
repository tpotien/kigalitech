import { getToken } from 'next-auth/jwt';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Sign in required' });

  const { serialNumber, imageDataUrl } = req.body;
  if (!serialNumber && !imageDataUrl) {
    return res.status(400).json({ error: 'Provide a serial number or image' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'AI not configured' });

  const SYSTEM = `You are a device identification assistant for KigaliTech marketplace in Kigali, Rwanda.
Identify the device and return ONLY valid JSON with no markdown or explanation:
{
  "title": "Full device name with model number (e.g. Samsung Galaxy S23 Ultra 256GB Phantom Black)",
  "description": "2-3 sentence description highlighting key features, storage, color, and condition hints",
  "category": "One of: Phones, Laptops, Tablets, Audio, Cameras, Wearables, TVs, Gaming, Other",
  "brand": "Manufacturer brand name",
  "suggestedCondition": "One of: like_new, good, fair, poor",
  "suggestedPrice": 150000
}
suggestedPrice is in Rwandan Francs (RWF) for a fair used market price in Rwanda.
If you cannot identify the device, return: {"error": "Could not identify device"}`;

  try {
    let messages;

    if (serialNumber) {
      messages = [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `Device serial number: ${serialNumber}\n\nIdentify this device and return its listing details as JSON.`,
        },
      ];
    } else {
      const base64 = imageDataUrl.split(',')[1];
      const mimeType = imageDataUrl.match(/^data:(image\/\w+);/)?.[1] || 'image/jpeg';
      messages = [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: 'text', text: SYSTEM + '\n\nIdentify the device in this photo and return its listing details as JSON.' },
          ],
        },
      ];
    }

    const model = imageDataUrl
      ? 'meta-llama/llama-4-scout-17b-16e-instruct'
      : 'llama-3.3-70b-versatile';

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, max_tokens: 512, temperature: 0.2, messages }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error('[ai-identify] Groq error:', err);
      return res.status(502).json({ error: 'AI service unavailable. Fill in the form manually.' });
    }

    const groqData = await groqRes.json();
    const text = groqData.choices?.[0]?.message?.content?.trim() || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in AI response');

    const result = JSON.parse(match[0]);
    if (result.error) return res.status(422).json({ error: result.error });

    return res.json(result);
  } catch (err) {
    console.error('[ai-identify] error:', err.message);
    return res.status(500).json({ error: 'Could not identify device. Please fill in the form manually.' });
  }
}
