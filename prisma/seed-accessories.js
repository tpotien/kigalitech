const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const accessories = [
    {
      name: 'Tempered Glass Screen Protector — Universal',
      category: 'Accessories',
      description: 'Ultra-clear 9H hardness tempered glass that protects your screen from scratches, drops and fingerprints. Easy bubble-free installation, compatible with most smartphones and tablets.',
      price: 999,
      comparePrice: 1999,
      stock: 50,
      images: JSON.stringify(['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80']),
      specs: JSON.stringify({ 'Hardness': '9H', 'Thickness': '0.33mm', 'Transparency': '99%', 'Compatibility': 'Universal 5.5"–6.9"', 'Installation': 'Bubble-free' }),
      tags: JSON.stringify(['screen protector', 'tempered glass', 'accessories', 'protection']),
      brand: 'KigaliTech',
      featured: false,
      active: true,
    },
    {
      name: 'Premium Silicone Phone Cover — Full Protection',
      category: 'Accessories',
      description: 'Slim-fit liquid silicone case with microfiber lining that absorbs shocks and protects against drops. Precise cutouts for all ports and raised edges protect the camera and screen.',
      price: 1299,
      comparePrice: 2499,
      stock: 40,
      images: JSON.stringify(['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80']),
      colors: JSON.stringify(['Black', 'Navy Blue', 'Forest Green', 'Lavender', 'Sand Pink']),
      specs: JSON.stringify({ 'Material': 'Liquid Silicone + Microfiber', 'Protection': 'Drop-proof 1.5m', 'Weight': '28g', 'Compatibility': 'Multiple models available', 'Ports': 'All cutouts precise' }),
      tags: JSON.stringify(['phone case', 'cover', 'silicone', 'protection', 'accessories']),
      brand: 'KigaliTech',
      featured: false,
      active: true,
    },
    {
      name: 'USB-C 65W Fast Charger — Wall Adapter',
      category: 'Accessories',
      description: 'GaN technology 65W fast charger compatible with laptops, phones and tablets. Charges your phone to 50% in just 25 minutes. Compact design, perfect for travel.',
      price: 2499,
      comparePrice: 3999,
      stock: 30,
      images: JSON.stringify(['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80']),
      specs: JSON.stringify({ 'Output': '65W USB-C PD', 'Technology': 'GaN, PPS', 'Compatibility': 'iPhone 15+, Samsung, Laptops', 'Ports': '1× USB-C + 1× USB-A', 'Weight': '68g' }),
      tags: JSON.stringify(['charger', 'fast charge', 'USB-C', 'GaN', 'accessories']),
      brand: 'Anker',
      featured: false,
      active: true,
    },
    {
      name: 'USB-C to USB-C Braided Cable 1m',
      category: 'Accessories',
      description: 'Durable nylon-braided USB-C to USB-C cable supporting 100W fast charging and 40Gbps data transfer. Tangle-free design tested to 30,000+ bends.',
      price: 799,
      comparePrice: 1499,
      stock: 60,
      images: JSON.stringify(['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80']),
      colors: JSON.stringify(['Black', 'White']),
      specs: JSON.stringify({ 'Power Delivery': '100W', 'Data Speed': 'Up to 40Gbps', 'Length': '1 meter', 'Material': 'Nylon braided', 'Durability': '30,000+ bends tested' }),
      tags: JSON.stringify(['cable', 'USB-C', 'fast charge', 'accessories']),
      brand: 'Anker',
      featured: false,
      active: true,
    },
    {
      name: '10,000mAh Power Bank — Slim Design',
      category: 'Accessories',
      description: 'Ultra-slim 10,000mAh power bank with dual USB-A + USB-C output, charges two devices simultaneously. Built-in LED indicator, airline carry-on approved.',
      price: 3499,
      comparePrice: 5999,
      stock: 25,
      images: JSON.stringify(['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&q=80']),
      colors: JSON.stringify(['Black', 'White', 'Navy']),
      specs: JSON.stringify({ 'Capacity': '10,000mAh', 'Output': '22.5W USB-C + 18W USB-A', 'Charges iPhone': '2× full charges', 'Weight': '220g', 'Dimensions': '150×70×14mm' }),
      tags: JSON.stringify(['power bank', 'portable charger', 'battery', 'accessories']),
      brand: 'Anker',
      featured: false,
      active: true,
    },
    {
      name: 'Wireless Earbuds — Noise Cancelling',
      category: 'Accessories',
      description: 'True wireless earbuds with active noise cancellation, 30-hour total playtime and IPX5 water resistance. Crystal-clear calls and rich bass for music lovers on the go.',
      price: 4999,
      comparePrice: 7999,
      stock: 20,
      images: JSON.stringify(['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80']),
      colors: JSON.stringify(['Black', 'White']),
      warrantyOptions: JSON.stringify(['1 Year', '2 Years']),
      specs: JSON.stringify({ 'Battery': '8h + 22h case', 'ANC': 'Active Noise Cancellation', 'Water Resistance': 'IPX5', 'Connectivity': 'Bluetooth 5.3', 'Drivers': '11mm dynamic' }),
      tags: JSON.stringify(['earbuds', 'wireless', 'ANC', 'TWS', 'accessories']),
      brand: 'JBL',
      featured: false,
      active: true,
    },
  ];

  for (const product of accessories) {
    const existing = await prisma.product.findFirst({ where: { name: product.name } });
    if (!existing) {
      await prisma.product.create({ data: product });
      console.log('Created:', product.name);
    } else {
      console.log('Already exists:', product.name);
    }
  }
  console.log('Done seeding accessories.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
