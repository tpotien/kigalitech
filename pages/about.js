import Link from 'next/link';
import Layout from '../components/Layout';

const STATS = [
  { value: '200+',   label: 'Products Active in Our Store' },
  { value: '33k',    label: 'Monthly Product Sales' },
  { value: '5,000+', label: 'Customers Active on Our Site' },
  { value: '5+',     label: 'Years in Business' },
];

const TEAM = [
  { name: 'Tom Potien',   role: 'Founder & CEO',       img: '/founder.jpg',  social: { twitter: '#', instagram: '#', linkedin: '#' } },
  { name: 'Tech Team',   role: 'Head of Technology',   img: null,            social: { twitter: '#', instagram: '#', linkedin: '#' } },
  { name: 'Support Team',role: 'Customer Experience',  img: null,            social: { twitter: '#', instagram: '#', linkedin: '#' } },
];

const SERVICES = [
  { icon: '🚚', title: 'FREE AND FAST DELIVERY',  desc: 'Free delivery for all orders over RWF 75,000' },
  { icon: '🎧', title: '24/7 CUSTOMER SERVICE',   desc: 'Friendly 24/7 customer support' },
  { icon: '🔒', title: 'MONEY BACK GUARANTEE',    desc: 'We return money within 30 days' },
  { icon: '✅', title: '100% GENUINE',             desc: 'Every product is 100% original with warranty' },
];

const TwitterIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
  </svg>
);
const InstagramIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 19.5h11a2 2 0 002-2v-11a2 2 0 00-2-2h-11a2 2 0 00-2 2v11a2 2 0 002 2z"/>
  </svg>
);
const LinkedinIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

export default function AboutPage() {
  return (
    <Layout>
      <div className="max-w-container mx-auto px-4 lg:px-6 py-10">

        {/* Breadcrumb */}
        <nav className="text-sm text-ex-muted flex items-center gap-2 mb-14">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-ex-text font-medium">About</span>
        </nav>

        {/* ══════════════════════════════
            OUR STORY
        ══════════════════════════════ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          {/* Text */}
          <div>
            <h1 className="text-4xl font-semibold text-ex-text mb-6">Our Story</h1>
            <p className="text-ex-muted text-sm leading-relaxed mb-4">
              KigaliTech was founded with one clear mission: make premium, genuine electronics
              accessible to everyone in Rwanda. We started small — a single vision in Kigali — and
              grew into Rwanda&apos;s most trusted tech destination.
            </p>
            <p className="text-ex-muted text-sm leading-relaxed mb-4">
              We stock the latest flagships from Apple, Samsung, Sony, and more — all 100% authentic,
              with full local warranty support. From the newest iPhones to professional laptops,
              noise-cancelling headphones, and smart TVs, we carry it all with the same promise:
              genuine products, fast delivery, real support.
            </p>
            <p className="text-ex-muted text-sm leading-relaxed">
              Today, KigaliTech serves thousands of customers across Rwanda, offering same-day
              delivery in Kigali, nationwide shipping, and a dedicated repair & support team.
              Our commitment to authenticity and customer satisfaction has made us the #1 choice
              for tech buyers in the country.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-5">
            {STATS.map((s, i) => (
              <div key={s.label}
                className={`rounded p-7 text-center border transition-all cursor-default ${
                  i % 2 === 1
                    ? 'bg-primary border-primary text-white'
                    : 'border-ex-border text-ex-text hover:bg-primary hover:border-primary hover:text-white group'
                }`}>
                <p className="text-4xl font-bold mb-2">{s.value}</p>
                <p className="text-sm leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════
            TEAM
        ══════════════════════════════ */}
        <section className="mb-24">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {TEAM.map(member => (
              <div key={member.name} className="text-center">
                {/* Avatar */}
                <div className="mx-auto mb-5 h-52 w-full max-w-[210px] rounded overflow-hidden bg-ex-gray flex items-center justify-center">
                  {member.img ? (
                    <img
                      src={member.img}
                      alt={member.name}
                      className="h-full w-full object-cover"
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div
                    className="h-full w-full flex items-center justify-center text-6xl"
                    style={{ display: member.img ? 'none' : 'flex' }}
                  >
                    {member.name === 'Tech Team' ? '👨‍💻' : '🎧'}
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-ex-text mb-1">{member.name}</h3>
                <p className="text-sm text-ex-muted mb-4">{member.role}</p>

                {/* Social icons */}
                <div className="flex items-center justify-center gap-3">
                  {[
                    { icon: <TwitterIcon />, href: member.social.twitter },
                    { icon: <InstagramIcon />, href: member.social.instagram },
                    { icon: <LinkedinIcon />, href: member.social.linkedin },
                  ].map((s, i) => (
                    <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                      className="h-8 w-8 rounded-full border border-ex-border flex items-center justify-center text-ex-muted hover:bg-primary hover:border-primary hover:text-white transition-colors">
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════
            SERVICES BAR
        ══════════════════════════════ */}
        <section className="py-16 border-t border-ex-border">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 text-center">
            {SERVICES.map(s => (
              <div key={s.title} className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-[#1D2026] flex items-center justify-center text-2xl ring-[6px] ring-gray-200">
                  {s.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-ex-text text-sm mb-1">{s.title}</h4>
                  <p className="text-ex-muted text-xs">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </Layout>
  );
}
