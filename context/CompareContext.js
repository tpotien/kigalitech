import { createContext, useContext, useState, useCallback } from 'react';

const CompareContext = createContext({ items: [], add: () => {}, remove: () => {}, has: () => false, clear: () => {} });

export function CompareProvider({ children }) {
  const [items, setItems] = useState([]);

  const add = useCallback((product) => {
    setItems(prev => {
      if (prev.find(p => p.id === product.id)) return prev;
      if (prev.length >= 3) return [...prev.slice(1), product];
      return [...prev, product];
    });
  }, []);

  const remove = useCallback((id) => {
    setItems(prev => prev.filter(p => p.id !== id));
  }, []);

  const has = useCallback((id) => items.some(p => p.id === id), [items]);
  const clear = useCallback(() => setItems([]), []);

  return (
    <CompareContext.Provider value={{ items, add, remove, has, clear }}>
      {children}
    </CompareContext.Provider>
  );
}

export const useCompare = () => useContext(CompareContext);
