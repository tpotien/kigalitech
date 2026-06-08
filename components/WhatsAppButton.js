import { useRouter } from 'next/router';
import { useWhatsAppCtx } from '../context/WhatsAppContext';
import { useState } from 'react';

const SITE = 'https://electronics-shop-amber.vercel.app';
const NUMBER = '250786276555';

function buildMessage(pathname, asPath, ctx) {
  if (ctx) {
    switch (ctx.type) {
      case 'product':
        return `Hi KigaliTech! 👋\n\nI'm interested in *${ctx.name}* and have some questions.\n\n🔗 View product: ${SITE}/products/${ctx.id}\n\nCould you help me with more details or availability?`;
      case 'order':
        return `Hi KigaliTech! 👋\n\nI have a question about my *Order #${ctx.id}*.\n\n🔗 ${SITE}/orders/${ctx.id}\n\nCould you please assist me?`;
      case 'repair':
        return `Hi KigaliTech! 👋\n\nI'd like to book a *device repair service*.\n\n🔗 ${SITE}/repairs\n\nWhen can I bring my device in?`;
      case 'cart':
        return `Hi KigaliTech! 👋\n\nI need help completing my purchase on your website.\n\n🔗 ${SITE}/checkout\n\nCan you assist me?`;
      default:
        return ctx.message || defaultMessage(pathname, asPath);
    }
  }
  return defaultMessage(pathname, asPath);
}

function defaultMessage(pathname, asPath) {
  if (pathname === '/checkout') {
    return `Hi KigaliTech! 👋\n\nI'm trying to complete an order and need some help.\n\n🔗 ${SITE}/checkout\n\nPlease assist me!`;
  }
  if (pathname === '/cart') {
    return `Hi KigaliTech! 👋\n\nI have some questions about items in my cart.\n\n🔗 ${SITE}/cart\n\nCan you help me?`;
  }
  if (pathname.startsWith('/orders/')) {
    return `Hi KigaliTech! 👋\n\nI have a question about my order.\n\n🔗 ${SITE}${asPath}\n\nPlease help me.`;
  }
  if (pathname.startsWith('/products/')) {
    return `Hi KigaliTech! 👋\n\nI'm interested in a product and need more details.\n\n🔗 ${SITE}${asPath}\n\nCould you help me?`;
  }
  if (pathname === '/products') {
    return `Hi KigaliTech! 👋\n\nI'm browsing your products and would love some recommendations!\n\n🔗 ${SITE}/products`;
  }
  if (pathname === '/repairs') {
    return `Hi KigaliTech! 👋\n\nI need to book a *device repair service*.\n\n🔗 ${SITE}/repairs\n\nCan we schedule an appointment?`;
  }
  if (pathname === '/contact') {
    return `Hi KigaliTech! 👋\n\nI need customer support.\n\n🔗 ${SITE}/contact\n\nPlease assist me.`;
  }
  if (pathname.startsWith('/account')) {
    return `Hi KigaliTech! 👋\n\nI have a question about my account.\n\n🔗 ${SITE}\n\nCan you help?`;
  }
  return `Hi KigaliTech! 👋\n\nI'm visiting your website and need some help.\n\n🔗 ${SITE}\n\nCould you assist me?`;
}

export default function WhatsAppButton() {
  const router = useRouter();
  const { whatsappCtx } = useWhatsAppCtx();
  const [showTooltip, setShowTooltip] = useState(false);

  const message = buildMessage(router.pathname, router.asPath, whatsappCtx);
  const url = `https://wa.me/${NUMBER}?text=${encodeURIComponent(message)}`;

  // On product pages mobile, the sticky bar already has a WhatsApp button — hide this one
  const isProductPage = router.pathname === '/products/[id]';

  return (
    <div className={`fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex-col items-end gap-2 ${isProductPage ? 'hidden sm:flex' : 'flex'}`}>
      {showTooltip && (
        <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-xl shadow-xl whitespace-nowrap pointer-events-none">
          <span className="font-semibold">Chat with us</span>
          <br />
          <span className="text-gray-400 text-[10px]">+250 786 276 555</span>
        </div>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-green-400/30 hover:bg-[#20bf5b] hover:scale-110 transition-all duration-200"
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 32 32" className="h-6 w-6 sm:h-8 sm:w-8 fill-white">
          <path d="M16.004 2C8.276 2 2 8.268 2 15.986c0 2.458.64 4.866 1.856 6.98L2 30l7.236-1.822A14.022 14.022 0 0016.004 30C23.724 30 30 23.732 30 16.014 30 8.268 23.724 2 16.004 2zm7.414 19.878c-.316.886-1.564 1.622-2.56 1.836-.68.144-1.568.258-4.552-1.004C12.624 21.162 9.98 17.6 9.778 17.338c-.198-.26-1.664-2.21-1.664-4.222 0-2.012 1.048-2.992 1.42-3.402.37-.412.808-.514 1.078-.514.27 0 .542.002.78.014.248.012.584-.096.914.696l1.31 3.184c.13.314.216.682.04 1.098-.174.414-.26.67-.522.99-.258.32-.546.716-.778.962-.258.272-.526.566-.228 1.11.3.544 1.33 2.192 2.858 3.55 1.964 1.75 3.62 2.29 4.13 2.548.512.258.81.216 1.108-.13.298-.344 1.276-1.492 1.616-2.006.34-.512.68-.43 1.146-.258.466.174 2.974 1.4 3.484 1.656.51.258.85.386.974.6.126.214.126 1.104-.19 1.99z"/>
        </svg>
      </a>
    </div>
  );
}
