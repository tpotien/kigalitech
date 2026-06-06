import { useState, useEffect } from 'react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    const goOffline = () => { setOffline(true); setWasOffline(true); };
    const goOnline = () => {
      setOffline(false);
      setShowBack(true);
      setTimeout(() => setShowBack(false), 3000);
    };

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (offline) {
    return (
      <div className="fixed top-16 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-slate-900 px-5 py-2.5 shadow-xl text-white text-sm font-medium animate-in">
          <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
          No internet connection
        </div>
      </div>
    );
  }

  if (showBack) {
    return (
      <div className="fixed top-16 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-emerald-600 px-5 py-2.5 shadow-xl text-white text-sm font-medium animate-in">
          <span className="h-2 w-2 rounded-full bg-emerald-200 flex-shrink-0" />
          Back online ✓
        </div>
      </div>
    );
  }

  return null;
}
