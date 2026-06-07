import { createContext, useContext, useState } from 'react';

// Exchange rates relative to USD (updated periodically in production)
const RATES = { USD: 1, RWF: 1340, EUR: 0.92, GBP: 0.79, KES: 130, UGX: 3750 };
const SYMBOLS = { USD: '$', RWF: 'RWF ', EUR: '€', GBP: '£', KES: 'KSh ', UGX: 'USh ' };
const NAMES = { USD: 'US Dollar', RWF: 'Rwandan Franc', EUR: 'Euro', GBP: 'British Pound', KES: 'Kenyan Shilling', UGX: 'Ugandan Shilling' };

const CurrencyContext = createContext({
  currency: 'RWF', setCurrency: () => {},
  format: (cents) => `RWF ${Math.round((cents / 100) * 1340).toLocaleString()}`,
  symbol: 'RWF ',
});

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    if (typeof window === 'undefined') return 'RWF';
    const saved = localStorage.getItem('currency');
    return saved && RATES[saved] ? saved : 'RWF';
  });

  function setCurrency(c) {
    setCurrencyState(c);
    localStorage.setItem('currency', c);
  }

  function format(cents) {
    const symbol = SYMBOLS[currency] || '$';
    const rate = RATES[currency] || 1;
    const value = (cents / 100) * rate;
    if (currency === 'RWF' || currency === 'UGX' || currency === 'KES') {
      return `${symbol}${Math.round(value).toLocaleString()}`;
    }
    return `${symbol}${value.toFixed(2)}`;
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format, symbol: SYMBOLS[currency], rates: RATES, names: NAMES }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
export { RATES, SYMBOLS, NAMES };
