import { createContext, useContext, useReducer, useRef } from 'react';
import { useSession } from 'next-auth/react';

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const key = `${action.item.id}-${action.item.color}-${action.item.storage}`;
      const existing = state.items.find((i) => i.key === key);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: i.quantity + action.item.quantity } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, key }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.key !== action.key) };
    case 'UPDATE_QTY':
      return {
        ...state,
        items: state.items.map((i) =>
          i.key === action.key ? { ...i, quantity: action.quantity } : i
        ),
      };
    case 'CLEAR':
      return { ...state, items: [] };
    case 'TOGGLE_DRAWER':
      return { ...state, drawerOpen: !state.drawerOpen };
    case 'OPEN_DRAWER':
      return { ...state, drawerOpen: true };
    case 'CLOSE_DRAWER':
      return { ...state, drawerOpen: false };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], drawerOpen: false });
  const { data: session } = useSession();
  const syncTimer = useRef(null);

  function scheduleSync(items) {
    if (!session?.user) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      }).catch(() => {});
    }, 2000);
  }

  const addItem = (item) => {
    dispatch({ type: 'ADD_ITEM', item });
    dispatch({ type: 'OPEN_DRAWER' });
    // Compute new items for sync
    const key = `${item.id}-${item.color}-${item.storage}`;
    const existing = state.items.find((i) => i.key === key);
    let newItems;
    if (existing) {
      newItems = state.items.map((i) =>
        i.key === key ? { ...i, quantity: i.quantity + item.quantity } : i
      );
    } else {
      newItems = [...state.items, { ...item, key }];
    }
    scheduleSync(newItems);
  };

  const removeItem = (key) => {
    const newItems = state.items.filter((i) => i.key !== key);
    dispatch({ type: 'REMOVE_ITEM', key });
    scheduleSync(newItems);
  };

  const updateQty = (key, quantity) => {
    const newItems = state.items.map((i) =>
      i.key === key ? { ...i, quantity } : i
    );
    dispatch({ type: 'UPDATE_QTY', key, quantity });
    scheduleSync(newItems);
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR' });
    scheduleSync([]);
  };

  const toggleDrawer = () => dispatch({ type: 'TOGGLE_DRAWER' });
  const closeDrawer = () => dispatch({ type: 'CLOSE_DRAWER' });

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ ...state, addItem, removeItem, updateQty, clearCart, toggleDrawer, closeDrawer, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
