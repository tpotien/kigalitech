import '../styles/globals.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Analytics } from '@vercel/analytics/react';
import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '../context/CartContext';
import { LanguageProvider, useLang } from '../context/LanguageContext';
import { NotificationProvider } from '../context/NotificationContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import { WishlistProvider } from '../context/WishlistContext';
import { CompareProvider } from '../context/CompareContext';
import { ToastProvider } from '../context/ToastContext';
import { ThemeProvider } from '../context/ThemeContext';
import WhatsAppButton from '../components/WhatsAppButton';
import CompareBar from '../components/CompareBar';
import PageProgress from '../components/PageProgress';
import BackToTop from '../components/BackToTop';
import OfflineBanner from '../components/OfflineBanner';
import { WhatsAppProvider } from '../context/WhatsAppContext';

function PageTracker() {
  const router = useRouter();
  useEffect(() => {
    const track = (url) => fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: url }) }).catch(() => {});
    track(router.asPath);
    router.events.on('routeChangeComplete', track);
    return () => router.events.off('routeChangeComplete', track);
  }, [router]);
  return null;
}

// Re-applies DOM translation after each SPA route change
function TranslationReapply() {
  const { lang } = useLang();
  const router = useRouter();
  useEffect(() => {
    if (lang === 'en') return;
    const handle = () => {
      // Wait for React to finish rendering the new page before walking the DOM
      setTimeout(async () => {
        const { translateDOM, getCurrentLang } = await import('../lib/translate');
        if (getCurrentLang() === lang) await translateDOM(lang);
      }, 400);
    };
    router.events.on('routeChangeComplete', handle);
    return () => router.events.off('routeChangeComplete', handle);
  }, [lang, router]);
  return null;
}

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <ThemeProvider>
    <SessionProvider session={session}>
      <WhatsAppProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <CartProvider>
            <NotificationProvider>
              <WishlistProvider>
                <CompareProvider>
                  <ToastProvider>
                    <PageTracker />
                    <TranslationReapply />
                    <PageProgress />
                    <OfflineBanner />
                    <Component {...pageProps} />
                    <WhatsAppButton />
                    <CompareBar />
                    <BackToTop />
                    <Analytics />
                  </ToastProvider>
                </CompareProvider>
              </WishlistProvider>
            </NotificationProvider>
          </CartProvider>
        </CurrencyProvider>
      </LanguageProvider>
      </WhatsAppProvider>
    </SessionProvider>
    </ThemeProvider>
  );
}
