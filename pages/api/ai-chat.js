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

// Convert OpenAI-format messages → Gemini contents format
function toGeminiContents(messages) {
  return messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages } = req.body;
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: 'messages required' });
  }

  const geminiKey = process.env.GOOGLE_AI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  if (!geminiKey && !groqKey) return res.status(503).json({ error: 'AI not configured' });

  const lang = detectLang(messages);

  // Fetch live products from DB
  let productContext = '';
  try {
    const products = await prisma.product.findMany({
      where: { active: true, stock: { gt: 0 } },
      select: { name: true, price: true, category: true, stock: true, brand: true },
      orderBy: { id: 'desc' },
      take: 60,
    });
    productContext = products
      .map(p => `- ${p.name}${p.brand ? ` (${p.brand})` : ''} | RWF ${Math.round(p.price).toLocaleString()} | ${p.category}${p.stock <= 5 ? ` | Only ${p.stock} left` : ''}`)
      .join('\n');
  } catch (e) {
    console.error('[ai-chat] DB error:', e.message);
  }

  // Kinyarwanda: translate question → English → get answer → translate back
  let workingMessages = messages.slice(-8);
  let isRwandaFlow = false;

  if (lang === 'rw') {
    try {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        const translatedQ = await googleTranslate(lastUserMsg.content, 'rw', 'en');
        workingMessages = workingMessages.map(m =>
          m === lastUserMsg ? { ...m, content: translatedQ } : m
        );
        isRwandaFlow = true;
      }
    } catch (e) {
      console.error('[ai-chat] translate to en failed:', e.message);
    }
  }

  const langInstruction = lang === 'fr'
    ? 'Respond in French. Be direct, 1-2 sentences max.'
    : 'Respond in English. Be direct, 1-2 sentences max.';

  const systemPrompt = `You are KigaliTech AI — a helpful shopping assistant for KigaliTech electronics store in Kigali, Rwanda.

${langInstruction}

PRODUCTS CURRENTLY IN STOCK:
${productContext || 'No products loaded.'}

RULES:
- Answer ONLY what was asked — keep it short and helpful
- Always include product name + RWF price when recommending products
- Payment methods: MTN MoMo / Airtel Money → +250 786 276 555
- We deliver across all of Rwanda
- For anything you can't answer → direct to WhatsApp: +250 786 276 555
- Never invent products not listed above
- Be friendly and conversational`;

  // ── Try Gemini 1.5 Flash first ────────────────────────────────────────────
  if (geminiKey) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: toGeminiContents(workingMessages),
            generationConfig: { temperature: 0.3, maxOutputTokens: 150 },
          }),
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        let reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (reply) {
          if (isRwandaFlow) {
            try { reply = await googleTranslate(reply, 'en', 'rw'); } catch {}
          }
          return res.json({ reply, _source: 'gemini' });
        }
      } else {
        const errText = await geminiRes.text();
        console.warn('[ai-chat] Gemini error:', errText);
      }
    } catch (err) {
      console.warn('[ai-chat] Gemini failed, trying Groq:', err.message);
    }
  }

  // ── Fallback: Groq ────────────────────────────────────────────────────────
  if (groqKey) {
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: systemPrompt }, ...workingMessages],
          max_tokens: 120,
          temperature: 0.3,
        }),
      });

      const data = await groqRes.json();
      if (!groqRes.ok) throw new Error(data.error?.message || 'Groq error');

      let reply = data.choices?.[0]?.message?.content?.trim();
      if (!reply) throw new Error('Empty response');

      if (isRwandaFlow) {
        try { reply = await googleTranslate(reply, 'en', 'rw'); } catch {}
      }
      return res.json({ reply, _source: 'groq' });
    } catch (err) {
      console.error('[ai-chat] Groq failed:', err.message);
    }
  }

  const fallback = {
    rw: 'Hari ikibazo gito. Twandikire kuri WhatsApp: +250 786 276 555 😊',
    fr: 'Un problème est survenu. WhatsApp: +250 786 276 555 😊',
    en: 'Something went wrong. WhatsApp us: +250 786 276 555 😊',
  };
  return res.status(500).json({ reply: fallback[lang] });
}
