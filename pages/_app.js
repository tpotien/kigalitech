import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '../context/CartContext';
import { LanguageProvider } from '../context/LanguageContext';
import { NotificationProvider } from '../context/NotificationContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import { WishlistProvider } from '../context/WishlistContext';
import { CompareProvider } from '../context/CompareContext';
import { ToastProvider } from '../context/ToastContext';
import WhatsAppButton from '../components/WhatsAppButton';
import CompareBar from '../components/CompareBar';
import PageProgress from '../components/PageProgress';
import BackToTop from '../components/BackToTop';
import OfflineBanner from '../components/OfflineBanner';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <LanguageProvider>
        <CurrencyProvider>
          <CartProvider>
            <NotificationProvider>
              <WishlistProvider>
                <CompareProvider>
                  <ToastProvider>
                    <PageProgress />
                    <OfflineBanner />
                    <Component {...pageProps} />
                    <WhatsAppButton />
                    <CompareBar />
                    <BackToTop />
                  </ToastProvider>
                </CompareProvider>
              </WishlistProvider>
            </NotificationProvider>
          </CartProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
