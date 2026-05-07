import { useEffect, useState, useRef } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notificationService, AppNotification } from '@/services/notificationService';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';

interface Props {
  userId: string;
}

export default function NotificationBell({ userId }: Props) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { lang } = useLang();

  const notifLabel = lang === 'kn' ? 'ಅಧಿಸೂಚನೆಗಳು' : lang === 'ta' ? 'அறிவிப்புகள்' : lang === 'hi' ? 'सूचनाएं' : 'Notifications';
  const markAllLabel = lang === 'kn' ? 'ಎಲ್ಲವನ್ನೂ ಓದಿದಂತೆ ಗುರುತಿಸಿ' : lang === 'ta' ? 'அனைத்தையும் படித்ததாகக் குறி' : lang === 'hi' ? 'सभी पढ़ा हुआ चिह्नित करें' : 'Mark all read';
  const noNotifLabel = lang === 'kn' ? 'ಯಾವುದೇ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ' : lang === 'ta' ? 'அறிவிப்புகள் இல்லை' : lang === 'hi' ? 'कोई सूचना नहीं' : 'No notifications';

  // Close on outside click (mouse + touch) and Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        bellRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // Body scroll lock on mobile when panel is open
  useEffect(() => {
    if (open && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  // Move focus into panel on open
  useEffect(() => {
    if (open) {
      const first = panelRef.current?.querySelector<HTMLElement>('button:not([disabled])');
      first?.focus();
    }
  }, [open]);

  // Single DB call: derive count from items (limit 50 covers all practical cases)
  const refresh = async () => {
    const list = await notificationService.list(userId, 50);
    setItems(list);
    setCount(list.filter(i => !i.read_at).length);
  };

  // Close panel when the route changes (G24)
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Reset state when the logged-in user changes (G25)
  useEffect(() => {
    setOpen(false);
    refresh();
  }, [userId]);

  const markAllRead = async () => {
    const hasUnread = items.some(i => !i.read_at) || count > 0;
    if (!hasUnread) return;
    // Optimistic update — clear dots and count immediately
    const now = new Date().toISOString();
    setItems(prev => prev.map(i => i.read_at ? i : { ...i, read_at: now }));
    setCount(0);
    await notificationService.markAllReadForUser(userId);
    refresh();
  };

  const onClickItem = async (n: AppNotification) => {
    if (!n.read_at) {
      // Optimistic update — avoids calling refresh() after navigate (component may be unmounted)
      const now = new Date().toISOString();
      setItems(prev => prev.map(i => i.id === n.id ? { ...i, read_at: now } : i));
      setCount(prev => Math.max(0, prev - 1));
      await notificationService.markRead([n.id], userId);
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  // Tab trap: keep keyboard focus inside the open panel
  const handlePanelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusables = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled])')
    );
    if (focusables.length < 2) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={bellRef}
        type="button"
        className="relative p-2 rounded hover:bg-gray-100"
        onClick={() => {
          setOpen(!open);
          if (!open) refresh();
        }}
        aria-label={notifLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="notification-panel"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full px-1.5 py-[1px]">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          id="notification-panel"
          ref={panelRef}
          role="dialog"
          aria-label={notifLabel}
          onKeyDown={handlePanelKeyDown}
          className="fixed top-16 left-2 right-2 sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-80 z-[60] bg-white border rounded-lg shadow-xl animate-in fade-in zoom-in duration-200 origin-top-right"
        >
          <div className="flex items-center justify-between p-3 border-b bg-gray-50/50 rounded-t-lg">
            <span className="text-sm font-semibold text-gray-900">{notifLabel}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="h-6 px-2 text-xs hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <Check className="w-3 h-3 mr-1" /> {markAllLabel}
            </Button>
          </div>
          <div className="max-h-[80vh] overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">{noNotifLabel}</p>
              </div>
            ) : (
              items.map(n => (
                <button
                  key={n.id}
                  className={`w-full text-left p-3 border-b last:border-0 hover:bg-gray-50 transition-colors ${!n.read_at ? 'bg-blue-50/30' : ''}`}
                  onClick={() => onClickItem(n)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!n.read_at ? 'bg-blue-600' : 'bg-transparent'}`} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${!n.read_at ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {n.title}
                        </span>
                        {n.link && <ExternalLink className="w-3 h-3 text-gray-400" />}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed break-words">{n.message}</p>
                      <p className="text-[10px] text-gray-400">
                        {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
