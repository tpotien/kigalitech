/**
 * Migrates base64 product images from the database to Supabase Storage.
 *
 * Usage:
 *   SUPABASE_SERVICE_KEY=<key> node scripts/migrate-images-to-storage.mjs
 *
 * Get SUPABASE_SERVICE_KEY from:
 *   Supabase Dashboard → Project Settings → API → "service_role" secret
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

// Load .env.local
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)="?(.+?)"?\s*$/);
  if (m) process.env[m[1]] ??= m[2];
}

const SUPABASE_URL = 'https://czcesaanizdvkqtnzecj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = 'product-images';

if (!SUPABASE_SERVICE_KEY) {
  console.error('\nMissing SUPABASE_SERVICE_KEY');
  console.error('Get it from: Supabase Dashboard → Project Settings → API → service_role\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const prisma = new PrismaClient();

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) throw new Error(`Failed to create bucket: ${error.message}`);
    console.log(`Created public bucket: ${BUCKET}`);
  } else {
    console.log(`Bucket already exists: ${BUCKET}`);
  }
}

function base64ToBuffer(dataUri) {
  const [header, b64] = dataUri.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const ext = mime.split('/')[1].replace('jpeg', 'jpg');
  return { buffer: Buffer.from(b64, 'base64'), mime, ext };
}

async function uploadImage(productId, index, dataUri) {
  const { buffer, mime, ext } = base64ToBuffer(dataUri);
  const path = `products/${productId}/${index}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: true,
  });
  if (error) throw new Error(`Upload failed for ${path}: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
}

async function main() {
  console.log('Connecting to database...');
  const products = await prisma.product.findMany({
    select: { id: true, name: true, images: true },
  });

  const toMigrate = products.filter(p => {
    try {
      const imgs = JSON.parse(p.images || '[]');
      return imgs.some(img => img.startsWith('data:'));
    } catch { return false; }
  });

  console.log(`Found ${toMigrate.length} products with base64 images to migrate\n`);
  if (toMigrate.length === 0) {
    console.log('Nothing to do!');
    await prisma.$disconnect();
    return;
  }

  await ensureBucket();

  let done = 0;
  let failed = 0;

  for (const product of toMigrate) {
    let images;
    try { images = JSON.parse(product.images || '[]'); } catch { continue; }

    const newImages = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img.startsWith('data:')) {
        newImages.push(img);
        continue;
      }
      try {
        const url = await uploadImage(product.id, i, img);
        newImages.push(url);
      } catch (e) {
        console.error(`  ✗ Failed image ${i} for product ${product.id}: ${e.message}`);
        newImages.push('');
        failed++;
      }
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { images: JSON.stringify(newImages) },
    });

    done++;
    console.log(`[${done}/${toMigrate.length}] ✓ ${product.name.substring(0, 50)}`);
  }

  await prisma.$disconnect();
  console.log(`\nDone! Migrated: ${done}, Failed images: ${failed}`);
}

main().catch(e => { console.error(e); process.exit(1); });
