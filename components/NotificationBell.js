import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useNotifications } from '../context/NotificationContext';

const TYPE_ICON = {
  order_update: '📦',
  new_order: '🛒',
  repair_update: '🔧',
  low_stock: '⚠️',
};

function NotificationList({ notifications, markRead, markAllRead, unread, onClose }) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
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
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100 text-slate-400 sm:hidden">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="overflow-y-auto divide-y divide-slate-50" style={{ maxHeight: 'min(24rem, 60vh)' }}>
        {notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">All caught up!</p>
            <p className="text-xs text-slate-400 mt-0.5">No notifications yet</p>
          </div>
        ) : notifications.map(n => (
          <button
            key={n.id}
            onClick={() => { markRead(n.id); onClose(); }}
            className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 ${!n.read ? 'bg-sky-50/40' : ''}`}
          >
            <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] || '🔔'}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{n.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
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
  const ref = useRef(null);

  // Close on outside click (desktop)
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Prevent body scroll when mobile sheet is open
  useEffect(() => {
    if (open && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
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

      {/* ── Desktop dropdown ── */}
      {open && (
        <div className="hidden sm:block absolute right-0 top-full mt-2 w-80 rounded-2xl border border-slate-100 bg-white shadow-2xl z-50 overflow-hidden animate-in">
          <NotificationList
            notifications={notifications}
            markRead={markRead}
            markAllRead={markAllRead}
            unread={unread}
            onClose={() => setOpen(false)}
          />
        </div>
      )}

      {/* ── Mobile bottom sheet + backdrop ── */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Sheet */}
          <div className="relative bg-white rounded-t-3xl shadow-2xl pb-safe overflow-hidden slide-up">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-slate-300" />
            </div>
            <NotificationList
              notifications={notifications}
              markRead={markRead}
              markAllRead={markAllRead}
              unread={unread}
              onClose={() => setOpen(false)}
            />
            <div className="h-6" />
          </div>
        </div>
      )}
    </div>
  );
}
