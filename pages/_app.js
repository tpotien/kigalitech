import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '../context/CartContext';
import { LanguageProvider } from '../context/LanguageContext';
import { NotificationProvider } from '../context/NotificationContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import { WishlistProvider } from '../context/WishlistContext';
import { CompareProvider } from '../context/CompareContext';
import WhatsAppButton from '../components/WhatsAppButton';
import CompareBar from '../components/CompareBar';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <LanguageProvider>
        <CurrencyProvider>
          <CartProvider>
            <NotificationProvider>
              <WishlistProvider>
                <CompareProvider>
                  <Component {...pageProps} />
                  <WhatsAppButton />
                  <CompareBar />
                </CompareProvider>
              </WishlistProvider>
            </NotificationProvider>
          </CartProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
