import prisma from '../../lib/prisma';

const RW_WORDS = ['ndashaka','nashaka','igiciro','kugura','ngurura','telefoni','mudasobwa','amafaranga','mfite','mumfashije','murashoboye','nimba','ariko','kandi','cyangwa','ibiciro','mbese','oya','yego','amakuru','noneho','iki','uko','bite','nte','hano','aho','ubu','none'];

function detectLang(messages) {
  const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || '';
  if (RW_WORDS.some(w => lastUser.includes(w))) return 'rw';
  const frWords = ['bonjour','merci','avez','voulez','quel','prix','téléphone','ordinateur','livraison','paiement','vous','est','les','des','une','pour'];
  if (frWords.some(w => lastUser.includes(w))) return 'fr';
  return 'en';
}

async function googleTranslate(text, from, to) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error('translate failed');
  const data = await res.json();
  return data[0].map(item => item[0]).filter(Boolean).join('');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages } = req.body;
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: 'messages required' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'AI not configured' });

  const lang = detectLang(messages);

  // Fetch products from DB
  let productContext = '';
  try {
    const products = await prisma.product.findMany({
      where: { active: true, stock: { gt: 0 } },
      select: { name: true, price: true, category: true, stock: true, brand: true },
      orderBy: { id: 'desc' },
      take: 60,
    });
    productContext = products
      .map(p => `- ${p.name}${p.brand ? ` (${p.brand})` : ''} | RWF ${p.price?.toLocaleString()} | ${p.category}${p.stock <= 5 ? ` | ${p.stock} left` : ''}`)
      .join('\n');
  } catch (e) {
    console.error('[ai-chat] DB error:', e.message);
  }

  // For Kinyarwanda: translate last message to English → get AI answer in English → translate back
  let translatedMessages = messages.slice(-8);
  let isRwandaFlow = false;

  if (lang === 'rw') {
    try {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        const translatedQ = await googleTranslate(lastUserMsg.content, 'rw', 'en');
        // Replace the last user message with the translated version for the AI
        translatedMessages = translatedMessages.map(m =>
          m === lastUserMsg ? { ...m, content: translatedQ } : m
        );
        isRwandaFlow = true;
      }
    } catch (e) {
      console.error('[ai-chat] translate to en failed:', e.message);
      // Fall through — AI will try Kinyarwanda directly
    }
  }

  const langInstruction = lang === 'fr'
    ? 'Respond in French. Be direct, 1-2 sentences only.'
    : 'Respond in English. Be direct, 1-2 sentences only.';

  const systemPrompt = `You are KigaliTech's AI assistant in Kigali, Rwanda.

${langInstruction}

PRODUCTS IN STOCK:
${productContext || 'No products loaded.'}

RULES:
- Answer ONLY what was asked — nothing extra
- Always include product name + RWF price when recommending
- Payment: MTN/Airtel MoMo → +250 786 276 555
- Delivery: all of Rwanda
- Unknown topics → give WhatsApp: +250 786 276 555
- Never mention products not listed above`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...translatedMessages,
        ],
        max_tokens: 120,
        temperature: 0.3,
      }),
    });

    const data = await groqRes.json();
    if (!groqRes.ok) throw new Error(data.error?.message || 'GROQ error');

    let reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error('Empty response');

    // Translate English reply back to Kinyarwanda
    if (isRwandaFlow) {
      try {
        reply = await googleTranslate(reply, 'en', 'rw');
      } catch (e) {
        console.error('[ai-chat] translate to rw failed:', e.message);
        // Return English if translation back fails
      }
    }

    return res.json({ reply });
  } catch (err) {
    console.error('[ai-chat]', err.message);
    const fallback = {
      rw: 'Hari ikibazo gito. Twandikire kuri WhatsApp: +250 786 276 555 😊',
      fr: 'Un problème est survenu. WhatsApp: +250 786 276 555 😊',
      en: 'Something went wrong. WhatsApp us: +250 786 276 555 😊',
    };
    return res.status(500).json({ reply: fallback[lang] });
  }
}
