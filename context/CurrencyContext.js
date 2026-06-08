import { createContext, useContext, useState, useEffect } from 'react';

const BASE_RATES = { RWF: 1475, USD: 1, EUR: 0.92, GBP: 0.79, KES: 130, UGX: 3750 };
const SYMBOLS = { RWF: 'RWF ', USD: '$', EUR: '€', GBP: '£', KES: 'KSh ', UGX: 'USh ' };
const NAMES = { RWF: 'Rwandan Franc', USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', KES: 'Kenyan Shilling', UGX: 'Ugandan Shilling' };

const CurrencyContext = createContext({
  currency: 'RWF', setCurrency: () => {},
  format: (cents) => `RWF ${Math.round((cents / 100) * 1475).toLocaleString()}`,
  symbol: 'RWF ',
});

function getInitialCurrency() {
  if (typeof window === 'undefined') return 'RWF';
  const saved = localStorage.getItem('currency');
  // RWF is primary — only honour an explicit non-USD switch
  if (!saved || saved === 'USD') return 'RWF';
  return BASE_RATES[saved] ? saved : 'RWF';
}

export function CurrencyProvider({ children }) {
  const [rates, setRates] = useState(BASE_RATES);
  const [currency, setCurrencyState] = useState(getInitialCurrency);

  useEffect(() => {
    fetch('/api/rates')
      .then(r => r.json())
      .then(d => {
        if (d.usdToRwf && d.usdToRwf > 0) {
          setRates(prev => ({ ...prev, RWF: Number(d.usdToRwf) }));
        }
      })
      .catch(() => {});
  }, []);

  function setCurrency(c) {
    setCurrencyState(c);
    localStorage.setItem('currency', c);
  }

  function format(cents) {
    const symbol = SYMBOLS[currency] || 'RWF ';
    const rate = rates[currency] || rates.RWF;
    const value = (cents / 100) * rate;
    if (currency === 'RWF' || currency === 'UGX' || currency === 'KES') {
      return `${symbol}${Math.round(value).toLocaleString()}`;
    }
    return `${symbol}${value.toFixed(2)}`;
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format, symbol: SYMBOLS[currency], rates, names: NAMES }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
export { BASE_RATES as RATES, SYMBOLS, NAMES };
