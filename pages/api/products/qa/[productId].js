import prisma from '../../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

async function askGroq(question, product) {
  const specs = (() => { try { return JSON.parse(product.specs || '{}'); } catch { return {}; } })();
  const specText = Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join(', ');
  const colors = (() => { try { return JSON.parse(product.colors || '[]'); } catch { return []; } })();
  const storage = (() => { try { return JSON.parse(product.storageOptions || '[]'); } catch { return []; } })();

  const systemPrompt = `You are a helpful product expert for KigaliTech, an electronics shop in Kigali, Rwanda. Answer customer questions about products accurately and concisely. Keep answers under 3 sentences. Be friendly and helpful. If you don't know something specific, give a helpful general answer based on the product type.`;

  const userPrompt = `Product: ${product.name}
Category: ${product.category}
Brand: ${product.brand || 'N/A'}
Price: RWF ${Math.round((product.price / 100) * 1475).toLocaleString()}
Description: ${product.description}
${specText ? `Specs: ${specText}` : ''}
${colors.length ? `Available colors: ${colors.join(', ')}` : ''}
${storage.length ? `Storage options: ${storage.join(', ')}` : ''}

Customer question: ${question}

Answer the question directly and helpfully.`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 200,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`Groq error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not answer that question right now.';
}

export default async function handler(req, res) {
  const { productId } = req.query;
  const id = parseInt(productId);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid product ID' });

  // GET — fetch all Q&As for a product
  if (req.method === 'GET') {
    const qas = await prisma.productQA.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(qas);
  }

  // POST — ask a new question
  if (req.method === 'POST') {
    const { question } = req.body;
    if (!question || question.trim().length < 3) {
      return res.status(400).json({ error: 'Please enter a question' });
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const askedBy = token?.name || 'Anonymous';

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Check if same question already answered (simple similarity)
    const existing = await prisma.productQA.findFirst({
      where: {
        productId: id,
        question: { contains: question.trim().slice(0, 20), mode: 'insensitive' },
      },
    });
    if (existing) return res.json(existing);

    let answer;
    try {
      answer = await askGroq(question.trim(), product);
    } catch {
      answer = 'Our team will answer this question shortly. You can also reach us on WhatsApp: +250 786 276 555';
    }

    const qa = await prisma.productQA.create({
      data: { productId: id, question: question.trim(), answer, askedBy },
    });

    return res.status(201).json(qa);
  }

  // PATCH — mark helpful
  if (req.method === 'PATCH') {
    const { id: qaId } = req.body;
    const qa = await prisma.productQA.update({
      where: { id: Number(qaId) },
      data: { helpful: { increment: 1 } },
    });
    return res.json(qa);
  }

  res.status(405).end();
}
