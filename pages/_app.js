import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '../context/CartContext';
import { LanguageProvider } from '../context/LanguageContext';
import { NotificationProvider } from '../context/NotificationContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import WhatsAppButton from '../components/WhatsAppButton';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <LanguageProvider>
        <CurrencyProvider>
          <CartProvider>
            <NotificationProvider>
              <Component {...pageProps} />
              <WhatsAppButton />
            </NotificationProvider>
          </CartProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
