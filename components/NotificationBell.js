import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useNotifications } from '../context/NotificationContext';

const TYPE_ICON = {
  order_update: '📦',
  new_order: '🛒',
  repair_update: '🔧',
  low_stock: '⚠️',
};

function NotificationList({ notifications, markRead, markAllRead, unread, onClose, isSheet, onNavigate }) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Notifications</h3>
          {unread > 0 && (
            <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white">{unread}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-sky-600 hover:text-sky-800 font-medium">
              Mark all read
            </button>
          )}
          {isSheet && (
            <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800" style={{ maxHeight: isSheet ? '60vh' : '24rem' }}>
        {notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">All caught up!</p>
            <p className="text-xs text-slate-400 mt-0.5">No notifications yet</p>
          </div>
        ) : notifications.map(n => (
          <button
            key={n.id}
            onClick={() => { markRead(n.id); if (n.link) { onNavigate(n.link); } onClose(); }}
            className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${!n.read ? 'bg-sky-50/40 dark:bg-sky-900/20' : ''}`}
          >
            <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] || '🔔'}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>{n.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>
              <p className="text-[10px] text-slate-400 mt-1">
                {new Date(n.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {!n.read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-sky-500" />}
          </button>
        ))}
      </div>
    </>
  );
}

export default function NotificationBell() {
  const { notifications, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const ref = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    setIsMobile(mq.matches);
    const fn = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  // Close desktop dropdown on outside click
  useEffect(() => {
    if (isMobile) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMobile]);

  // Lock scroll when mobile sheet is open
  useEffect(() => {
    document.body.style.overflow = (open && isMobile) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open, isMobile]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Desktop dropdown */}
      {open && !isMobile && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden notif-anim">
          <NotificationList
            notifications={notifications}
            markRead={markRead}
            markAllRead={markAllRead}
            unread={unread}
            onClose={() => setOpen(false)}
            onNavigate={(href) => { setOpen(false); router.push(href); }}
          />
        </div>
      )}

      {/* Mobile bottom sheet */}
      {open && isMobile && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl overflow-hidden slide-up pb-safe">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-slate-300" />
            </div>
            <NotificationList
              notifications={notifications}
              markRead={markRead}
              markAllRead={markAllRead}
              unread={unread}
              onClose={() => setOpen(false)}
              isSheet
            />
            <div className="h-6" />
          </div>
        </div>
      )}
    </div>
  );
}
