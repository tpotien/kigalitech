const ITEMS = [
  '⚡ Free Shipping on Orders over RWF 150,000',
  '🔥 Up to 40% Off Gaming Laptops',
  '🎧 New ANC Headphones In Stock',
  '📦 Same-Day Delivery Available',
  '💳 0% APR Financing — 12 Months',
  '🛡️ 2-Year Warranty on All Devices',
  '🌍 Ships Worldwide',
  '📱 iPhone 16 Pro — Now Available',
];

export default function MarqueeBanner() {
  const repeated = [...ITEMS, ...ITEMS];

  return (
    <div className="bg-sky-600 text-white overflow-hidden py-2.5">
      <div className="flex animate-marquee whitespace-nowrap">
        {repeated.map((item, i) => (
          <span key={i} className="mx-8 text-sm font-medium tracking-wide">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
