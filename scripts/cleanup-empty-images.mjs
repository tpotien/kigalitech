/**
 * Removes empty-string entries from product image arrays left by failed migration uploads.
 * Safe to run multiple times — skips products with no empty slots.
 *
 * Usage:
 *   node scripts/cleanup-empty-images.mjs
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)="?(.+?)"?\s*$/);
  if (m) process.env[m[1]] ??= m[2];
}

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, name: true, images: true } });

  const affected = products.filter(p => {
    try {
      return JSON.parse(p.images || '[]').includes('');
    } catch { return false; }
  });

  if (affected.length === 0) {
    console.log('No products with empty image slots found.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${affected.length} products with empty image slots:\n`);

  let fixed = 0;
  for (const p of affected) {
    const images = JSON.parse(p.images);
    const cleaned = images.filter(img => img !== '');
    await prisma.product.update({ where: { id: p.id }, data: { images: JSON.stringify(cleaned) } });
    console.log(`  ✓ Product ${p.id} — ${p.name.substring(0, 50)} (removed ${images.length - cleaned.length} empty slot(s), ${cleaned.length} images remain)`);
    fixed++;
  }

  await prisma.$disconnect();
  console.log(`\nDone! Cleaned ${fixed} products.`);
}

main().catch(e => { console.error(e); process.exit(1); });
