import Anthropic from '@anthropic-ai/sdk';
import { getToken } from 'next-auth/jwt';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name, category } = req.body;
  if (!name) return res.status(400).json({ error: 'Product name required' });

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a product database assistant for an electronics store called KigaliTech in Rwanda.
Generate complete product details for: "${name}" in category "${category || 'Electronics'}".

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "description": "2-3 sentence product description highlighting key benefits",
  "colors": ["Color1", "Color2", "Color3"],
  "storageOptions": ["64GB", "128GB", "256GB"],
  "warrantyOptions": ["1 Year", "2 Years"],
  "specs": {
    "Key Spec 1": "Value",
    "Key Spec 2": "Value",
    "Key Spec 3": "Value",
    "Key Spec 4": "Value",
    "Key Spec 5": "Value",
    "Key Spec 6": "Value"
  },
  "brand": "Brand Name",
  "weight": "150g",
  "suggestedPrice": 99900,
  "tags": ["tag1", "tag2", "tag3"]
}

Rules:
- suggestedPrice is in cents (USD × 100), e.g. $999 = 99900
- specs should be the most relevant 6-8 specs for this product type (display, processor, battery, camera, etc.)
- storageOptions: only if relevant (phones/laptops), otherwise []
- colors: realistic colors for this product (3-5 typical options)
- warrantyOptions: realistic warranty periods`,
        },
      ],
    });

    const text = message.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Invalid AI response' });

    const data = JSON.parse(jsonMatch[0]);
    return res.json(data);
  } catch (err) {
    console.error('AI fill error:', err);
    return res.status(500).json({ error: err.message || 'AI request failed' });
  }
}
