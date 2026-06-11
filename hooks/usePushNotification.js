import { useState, useEffect } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BHhzC5b45DqsO5KoQfkYL6423RlAv_4yRe0f9874bylXpvV_GPQhhonzxQ6yyfIggeVuH2-eFe_FtcEpBJ3UE9w';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function usePushNotification() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSupported('serviceWorker' in navigator && 'PushManager' in window);
    // Check current subscription
    navigator.serviceWorker?.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub));
    });
  }, []);

  async function subscribe() {
    if (!supported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });
      setSubscribed(true);
    } catch (e) {
      console.error('[push] subscribe failed', e);
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    if (!supported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (e) {
      console.error('[push] unsubscribe failed', e);
    } finally {
      setLoading(false);
    }
  }

  return { supported, subscribed, loading, subscribe, unsubscribe };
}
