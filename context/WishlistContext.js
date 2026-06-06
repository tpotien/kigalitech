import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const WishlistContext = createContext({ ids: new Set(), toggle: () => {}, loading: false });

export function WishlistProvider({ children }) {
  const { data: session } = useSession();
  const [ids, setIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) { setIds(new Set()); return; }
    fetch('/api/account/wishlist')
      .then(r => r.json())
      .then(data => setIds(new Set(Array.isArray(data) ? data.map(w => w.productId) : [])))
      .catch(() => {});
  }, [session]);

  const toggle = useCallback(async (productId) => {
    if (!session) return false;
    const wasIn = ids.has(productId);
    // Optimistic update
    setIds(prev => {
      const next = new Set(prev);
      wasIn ? next.delete(productId) : next.add(productId);
      return next;
    });
    try {
      if (wasIn) {
        await fetch(`/api/account/wishlist/${productId}`, { method: 'DELETE' });
      } else {
        await fetch('/api/account/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });
      }
    } catch {
      // Revert on error
      setIds(prev => {
        const next = new Set(prev);
        wasIn ? next.add(productId) : next.delete(productId);
        return next;
      });
    }
    return !wasIn;
  }, [session, ids]);

  return (
    <WishlistContext.Provider value={{ ids, toggle, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
