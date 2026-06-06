import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

const NotifContext = createContext({ notifications: [], unread: 0, markRead: () => {}, markAllRead: () => {} });

export function NotificationProvider({ children }) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState([]);
  const esRef = useRef(null);

  useEffect(() => {
    if (!session) return;

    // Load initial
    fetch('/api/notifications').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setNotifications(data);
    });

    // SSE stream
    const es = new EventSource('/api/notifications/sse');
    esRef.current = es;
    es.onmessage = (e) => {
      try {
        const notif = JSON.parse(e.data);
        if (notif.type === 'ping') return;
        setNotifications(prev => {
          const exists = prev.find(n => n.id === notif.id);
          if (exists) return prev;
          return [notif, ...prev].slice(0, 50);
        });
      } catch {}
    };
    return () => { es.close(); };
  }, [session?.user?.id]);

  async function markRead(id) {
    await fetch(`/api/notifications?id=${id}`, { method: 'PATCH' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    await fetch('/api/notifications/all-read', { method: 'POST' });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  const unread = notifications.filter(n => !n.read).length;

  return (
    <NotifContext.Provider value={{ notifications, unread, markRead, markAllRead }}>
      {children}
    </NotifContext.Provider>
  );
}

export const useNotifications = () => useContext(NotifContext);
