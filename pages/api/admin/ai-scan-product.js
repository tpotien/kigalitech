import { getToken } from 'next-auth/jwt';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { imageDataUrl } = req.body;
  if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Valid image required' });
  }

  const geminiKey = process.env.GOOGLE_AI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  if (!geminiKey && !groqKey) return res.status(503).json({ error: 'Vision AI not configured' });

  // Extract base64 content from data URL
  const base64 = imageDataUrl.split(',')[1];
  const mimeType = imageDataUrl.match(/^data:(image\/\w+);/)?.[1] || 'image/jpeg';

  const prompt = `You are a product cataloguing assistant for KigaliTech, an electronics store in Kigali, Rwanda.

Analyze this product image and extract ALL visible information to create a complete product listing.

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "name": "Exact product name with model number if visible",
  "brand": "Brand name",
  "category": "One of: Phones, Laptops, TVs, Audio, Wearables, Gaming, Tablets, Cameras, Accessories, Smart Home",
  "description": "2-3 sentences highlighting key benefits and features visible in the image",
  "colors": ["Color visible in image", "Other common colors for this model"],
  "storageOptions": ["128GB", "256GB"] or [] if not applicable,
  "warrantyOptions": ["1 Year", "2 Years"],
  "specs": {
    "Key": "Value — extract any specs visible on packaging or the product itself"
  },
  "weight": "estimated weight with unit",
  "suggestedPrice": 99900,
  "tags": ["tag1", "tag2", "tag3"]
}

Rules:
- suggestedPrice is in USD cents (e.g. $299 = 29900). Estimate a fair market price for Rwanda.
- Include 5-8 specs relevant to the product type — read any text visible on the product/box
- If you can't read a spec clearly, estimate based on the product model you recognize
- Extract the EXACT model name/number if visible on the product
- tags should be searchable keywords in lowercase`;

  // ── Try Gemini Vision first (superior image understanding) ────────────────
  if (geminiKey) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inlineData: { mimeType, data: base64 } },
                { text: prompt },
              ],
            }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
          }),
        }
      );
      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const product = JSON.parse(match[0]);
          return res.json({ ...product, _source: 'gemini-2.0-vision' });
        }
      } else {
        const errText = await geminiRes.text();
        console.warn('[ai-scan] Gemini error:', errText);
      }
    } catch (err) {
      console.warn('[ai-scan] Gemini failed, trying Groq:', err.message);
    }
  }

  // ── Fallback: Groq Vision ─────────────────────────────────────────────────
  if (groqKey) {
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
              { type: 'text', text: prompt },
            ],
          }],
        }),
      });
      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const text = groqData.choices?.[0]?.message?.content?.trim() || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const product = JSON.parse(match[0]);
          return res.json({ ...product, _source: 'vision' });
        }
      }
    } catch (err) {
      console.warn('[ai-scan] Groq vision failed:', err.message);
    }
  }

  return res.status(502).json({ error: 'Could not read product from image. Try typing the name instead.' });
}
