import { getToken } from 'next-auth/jwt';

// ─── Category templates ───────────────────────────────────────────────────────
// Used when ANTHROPIC_API_KEY is not set — gives instant, realistic defaults

const TEMPLATES = {
  Phones: {
    colors: ['Midnight Black', 'Pearl White', 'Cosmic Blue', 'Rose Gold'],
    storageOptions: ['128GB', '256GB', '512GB'],
    warrantyOptions: ['1 Year', '2 Years', '2 Years AppleCare+'],
    specKeys: ['Display', 'Processor', 'RAM', 'Camera', 'Battery', 'OS', 'Connectivity', 'Weight'],
    weight: '195g',
    tags: ['smartphone', 'mobile', '5G'],
  },
  Laptops: {
    colors: ['Space Gray', 'Silver', 'Midnight', 'Starlight'],
    storageOptions: ['256GB SSD', '512GB SSD', '1TB SSD'],
    warrantyOptions: ['1 Year', '2 Years', '3 Years'],
    specKeys: ['Processor', 'RAM', 'Storage', 'Display', 'Battery Life', 'OS', 'GPU', 'Weight'],
    weight: '1.4kg',
    tags: ['laptop', 'computer', 'portable'],
  },
  TVs: {
    colors: ['Black'],
    storageOptions: [],
    warrantyOptions: ['1 Year', '2 Years', '3 Years'],
    specKeys: ['Screen Size', 'Resolution', 'Display Type', 'HDR', 'Smart TV', 'HDMI Ports', 'Refresh Rate', 'Audio'],
    weight: '12kg',
    tags: ['tv', 'smart tv', '4K', 'OLED'],
  },
  Audio: {
    colors: ['Black', 'White', 'Navy Blue', 'Midnight', 'Silver'],
    storageOptions: [],
    warrantyOptions: ['1 Year', '2 Years'],
    specKeys: ['Driver Size', 'Frequency Response', 'Battery Life', 'Connectivity', 'Noise Cancellation', 'Impedance', 'Weight'],
    weight: '250g',
    tags: ['headphones', 'audio', 'wireless', 'ANC'],
  },
  Wearables: {
    colors: ['Black', 'Silver', 'Gold', 'Midnight', 'Starlight'],
    storageOptions: [],
    warrantyOptions: ['1 Year', '2 Years'],
    specKeys: ['Display', 'Battery Life', 'Water Resistance', 'Health Sensors', 'Connectivity', 'Compatibility', 'Weight'],
    weight: '38g',
    tags: ['smartwatch', 'wearable', 'fitness', 'health'],
  },
  Gaming: {
    colors: ['Black', 'White', 'Limited Edition'],
    storageOptions: ['512GB SSD', '1TB SSD', '2TB SSD'],
    warrantyOptions: ['1 Year', '2 Years'],
    specKeys: ['Processor', 'RAM', 'Storage', 'GPU', 'Display', 'Connectivity', 'Battery'],
    weight: '4kg',
    tags: ['gaming', 'console', 'games'],
  },
  Tablets: {
    colors: ['Space Gray', 'Silver', 'Blue', 'Pink', 'Starlight'],
    storageOptions: ['64GB', '128GB', '256GB', '512GB'],
    warrantyOptions: ['1 Year', '2 Years'],
    specKeys: ['Display', 'Processor', 'RAM', 'Camera', 'Battery', 'OS', 'Connectivity', 'Weight'],
    weight: '460g',
    tags: ['tablet', 'iPad', 'portable'],
  },
  Cameras: {
    colors: ['Black', 'Silver'],
    storageOptions: [],
    warrantyOptions: ['1 Year', '2 Years'],
    specKeys: ['Sensor', 'Megapixels', 'ISO Range', 'Shutter Speed', 'Video', 'Lens Mount', 'Battery Life', 'Weight'],
    weight: '650g',
    tags: ['camera', 'photography', 'DSLR', 'mirrorless'],
  },
  Accessories: {
    colors: ['Black', 'White', 'Gray'],
    storageOptions: [],
    warrantyOptions: ['1 Year'],
    specKeys: ['Compatibility', 'Material', 'Dimensions', 'Weight', 'Color Options'],
    weight: '100g',
    tags: ['accessories', 'electronics', 'compatible'],
  },
  'Smart Home': {
    colors: ['White', 'Black', 'Charcoal'],
    storageOptions: [],
    warrantyOptions: ['1 Year', '2 Years'],
    specKeys: ['Connectivity', 'Compatibility', 'Power', 'Voice Assistant', 'App Control', 'Range', 'Setup'],
    weight: '300g',
    tags: ['smart home', 'IoT', 'wifi', 'alexa', 'google home'],
  },
};

// Known brand → suggest price range (cents) and brand name cleanup
const BRAND_HINTS = {
  apple: { priceMin: 79900, priceMax: 159900 },
  samsung: { priceMin: 49900, priceMax: 129900 },
  sony: { priceMin: 29900, priceMax: 99900 },
  lg: { priceMin: 29900, priceMax: 89900 },
  huawei: { priceMin: 29900, priceMax: 89900 },
  xiaomi: { priceMin: 19900, priceMax: 59900 },
  oppo: { priceMin: 19900, priceMax: 59900 },
  dell: { priceMin: 59900, priceMax: 149900 },
  hp: { priceMin: 49900, priceMax: 129900 },
  lenovo: { priceMin: 49900, priceMax: 119900 },
  asus: { priceMin: 49900, priceMax: 129900 },
  bose: { priceMin: 24900, priceMax: 79900 },
  jbl: { priceMin: 4900, priceMax: 39900 },
  anker: { priceMin: 1900, priceMax: 14900 },
  canon: { priceMin: 49900, priceMax: 199900 },
  nikon: { priceMin: 49900, priceMax: 199900 },
  fujifilm: { priceMin: 59900, priceMax: 179900 },
  google: { priceMin: 29900, priceMax: 99900 },
  philips: { priceMin: 4900, priceMax: 49900 },
  amazon: { priceMin: 4900, priceMax: 24900 },
};

function templateFill(name, category) {
  const tpl = TEMPLATES[category] || TEMPLATES['Accessories'];
  const nameLower = name.toLowerCase();

  // Detect brand from name
  let brand = '';
  let priceRange = { priceMin: 9900, priceMax: 49900 };
  for (const [b, hint] of Object.entries(BRAND_HINTS)) {
    if (nameLower.includes(b)) {
      brand = b.charAt(0).toUpperCase() + b.slice(1);
      priceRange = hint;
      break;
    }
  }

  // Mid-range price suggestion
  const suggestedPrice = Math.round((priceRange.priceMin + priceRange.priceMax) / 2 / 100) * 100;

  // Build spec values based on category
  const specMap = {
    Phones: {
      'Display': '6.7" Super AMOLED, 120Hz, 2400×1080',
      'Processor': 'Octa-core 3.2GHz',
      'RAM': '8GB',
      'Camera': '108MP + 12MP + 5MP triple rear, 32MP front',
      'Battery': '5000mAh, 65W fast charge',
      'OS': 'Android 14',
      'Connectivity': '5G, Wi-Fi 6, Bluetooth 5.3, NFC',
      'Weight': '195g',
    },
    Laptops: {
      'Processor': 'Intel Core i7 13th Gen / Apple M3',
      'RAM': '16GB DDR5',
      'Storage': '512GB NVMe SSD',
      'Display': '15.6" FHD IPS, 144Hz',
      'Battery Life': 'Up to 12 hours',
      'OS': 'Windows 11 Home / macOS Sonoma',
      'GPU': 'Intel Iris Xe / NVIDIA RTX 4060',
      'Weight': '1.6kg',
    },
    TVs: {
      'Screen Size': '55"',
      'Resolution': '4K UHD (3840×2160)',
      'Display Type': 'QLED / OLED',
      'HDR': 'HDR10+, Dolby Vision',
      'Smart TV': 'Yes — webOS / Tizen / Google TV',
      'HDMI Ports': '3× HDMI 2.1',
      'Refresh Rate': '120Hz',
      'Audio': '20W 2.0ch with Dolby Atmos',
    },
    Audio: {
      'Driver Size': '40mm dynamic driver',
      'Frequency Response': '20Hz – 20kHz',
      'Battery Life': '30 hours ANC on / 40 hours ANC off',
      'Connectivity': 'Bluetooth 5.3, 3.5mm jack',
      'Noise Cancellation': 'Active Noise Cancellation (ANC)',
      'Impedance': '32Ω',
      'Weight': '250g',
    },
    Wearables: {
      'Display': '1.9" Always-On Retina LTPO',
      'Battery Life': 'Up to 18 hours',
      'Water Resistance': '50m / 5ATM',
      'Health Sensors': 'Heart rate, SpO2, ECG, Sleep tracking',
      'Connectivity': 'Bluetooth 5.3, Wi-Fi, GPS',
      'Compatibility': 'iOS 16+ / Android 10+',
      'Weight': '38g',
    },
    Gaming: {
      'Processor': 'AMD Zen 2 / Intel Core i7',
      'RAM': '16GB GDDR6',
      'Storage': '825GB NVMe SSD',
      'GPU': 'AMD RDNA 2 / NVIDIA RTX 4070',
      'Display': 'Supports up to 4K 120fps',
      'Connectivity': 'Wi-Fi 6, Bluetooth 5.1, HDMI 2.1',
      'Battery': 'N/A (Console)',
    },
    Tablets: {
      'Display': '11" Liquid Retina, 120Hz ProMotion',
      'Processor': 'Apple M2 / Snapdragon 8 Gen 2',
      'RAM': '8GB',
      'Camera': '12MP rear, 12MP ultra-wide front',
      'Battery': '10,090mAh, all-day battery',
      'OS': 'iPadOS 17 / Android 14',
      'Connectivity': 'Wi-Fi 6E, Bluetooth 5.3, USB-C',
      'Weight': '466g',
    },
    Cameras: {
      'Sensor': '35mm Full-Frame CMOS',
      'Megapixels': '45MP',
      'ISO Range': '100 – 102400',
      'Shutter Speed': '1/8000s – 30s',
      'Video': '8K RAW / 4K 120fps',
      'Lens Mount': 'Sony E / Canon RF / Nikon Z',
      'Battery Life': '400 shots per charge',
      'Weight': '650g (body only)',
    },
    Accessories: {
      'Compatibility': 'Universal / Model-specific',
      'Material': 'Premium aluminum / polycarbonate',
      'Dimensions': 'Standard',
      'Weight': '85g',
      'Color Options': 'Black, White, Gray',
    },
    'Smart Home': {
      'Connectivity': 'Wi-Fi 6, Zigbee, Z-Wave',
      'Compatibility': 'Alexa, Google Home, Apple HomeKit',
      'Power': 'AC 100–240V / Battery powered',
      'Voice Assistant': 'Amazon Alexa built-in',
      'App Control': 'iOS & Android app',
      'Range': 'Up to 30m',
      'Setup': 'Plug & play, 2 min setup',
    },
  };

  const specValues = specMap[category] || specMap['Accessories'];
  const specs = {};
  (tpl.specKeys || []).forEach(k => { if (specValues[k]) specs[k] = specValues[k]; });

  // Build description
  const descMap = {
    Phones: `The ${name} delivers a premium smartphone experience with a stunning high-refresh display, powerful processor, and all-day battery life. Featuring a versatile camera system and fast connectivity, it's the perfect device for productivity and entertainment.`,
    Laptops: `The ${name} is a high-performance laptop designed for professionals and power users. With its fast processor, ample RAM, and crisp display, it handles demanding tasks with ease while staying portable for everyday use.`,
    TVs: `The ${name} brings cinema-quality visuals to your living room with its stunning 4K display and vibrant colors. Smart features let you access all your favorite streaming apps, while Dolby Atmos audio delivers immersive sound.`,
    Audio: `The ${name} delivers exceptional audio quality with deep bass, crisp highs, and a wide soundstage. Active noise cancellation blocks out distractions, and long battery life keeps the music playing all day long.`,
    Wearables: `The ${name} is your ultimate health and fitness companion, tracking workouts, heart rate, and sleep with precision. Its always-on display and seamless smartphone integration keep you connected without missing a beat.`,
    Gaming: `The ${name} is built for next-generation gaming with blazing-fast load times, stunning 4K graphics, and ultra-responsive controls. Enjoy an expansive game library with exclusive titles and online multiplayer.`,
    Tablets: `The ${name} combines powerful performance with a stunning portable display, perfect for creativity, productivity, and entertainment. Its long battery life and lightweight design make it your ideal companion on the go.`,
    Cameras: `The ${name} is a professional-grade camera that captures life's moments in stunning detail. With its advanced autofocus, impressive low-light performance, and 4K video capabilities, it's ready for any shooting scenario.`,
    Accessories: `The ${name} is a premium accessory designed to complement and protect your devices. Built with quality materials and thoughtful design, it delivers reliable performance and enhances your everyday tech experience.`,
    'Smart Home': `The ${name} makes your home smarter and more efficient with easy voice and app control. Compatible with all major smart home ecosystems, it integrates seamlessly with your existing devices for a connected living experience.`,
  };

  return {
    description: descMap[category] || descMap['Accessories'],
    brand: brand || '',
    colors: tpl.colors,
    storageOptions: tpl.storageOptions,
    warrantyOptions: tpl.warrantyOptions,
    specs,
    weight: tpl.weight,
    suggestedPrice,
    tags: [...tpl.tags, name.toLowerCase().split(' ').filter(w => w.length > 2)].flat(),
  };
}

// ─── API handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name, category } = req.body;
  if (!name) return res.status(400).json({ error: 'Product name required' });

  // ── Try Claude API first ──────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey && apiKey !== 'placeholder') {
    try {
      const { Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });

      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `You are a product database assistant for KigaliTech, an electronics store in Rwanda.
Generate complete product details for: "${name}" (category: "${category || 'Electronics'}").

Return ONLY valid JSON — no markdown, no explanation:
{
  "description": "2–3 sentence product description highlighting key benefits",
  "brand": "Brand Name",
  "colors": ["Color1", "Color2", "Color3"],
  "storageOptions": ["128GB", "256GB"] or [] if not applicable,
  "warrantyOptions": ["1 Year", "2 Years"],
  "specs": { "Key1": "Value1", "Key2": "Value2" },
  "weight": "195g",
  "suggestedPrice": 99900,
  "tags": ["tag1", "tag2"]
}
Rules: suggestedPrice in cents (USD×100). Include 6–8 relevant specs for this product category.`,
        }],
      });

      const text = message.content[0].text.trim();
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON in response');
      const data = JSON.parse(match[0]);
      return res.json({ ...data, _source: 'claude' });
    } catch (err) {
      console.warn('[ai-fill] Claude API failed, falling back to templates:', err.message);
      // fall through to template
    }
  }

  // ── Template fallback — always works ─────────────────────────────────────
  const cat = category && TEMPLATES[category] ? category : 'Accessories';
  const data = templateFill(name, cat);
  return res.json({ ...data, _source: 'template' });
}
