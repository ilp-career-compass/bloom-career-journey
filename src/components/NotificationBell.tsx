import { useEffect, useState, useRef } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { notificationService, AppNotification } from '@/services/notificationService';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';

interface Props {
  userId: string;
}

export default function NotificationBell({ userId }: Props) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { lang } = useLang();

  const notifLabel = lang === 'kn' ? 'ಅಧಿಸೂಚನೆಗಳು' : lang === 'ta' ? 'அறிவிப்புகள்' : lang === 'hi' ? 'सूचनाएं' : 'Notifications';
  const markAllLabel = lang === 'kn' ? 'ಎಲ್ಲವನ್ನೂ ಓದಿದಂತೆ ಗುರುತಿಸಿ' : lang === 'ta' ? 'அனைத்தையும் படித்ததாகக் குறி' : lang === 'hi' ? 'सभी पढ़ा हुआ चिह्नित करें' : 'Mark all read';
  const noNewLabel = lang === 'kn' ? 'ಹೊಸ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ' : lang === 'ta' ? 'புதிய அறிவிப்புகள் இல்லை' : lang === 'hi' ? 'कोई नई सूचना नहीं' : 'No new notifications';

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const refresh = async () => {
    const [c, list] = await Promise.all([
      notificationService.getUnreadCount(userId),
      notificationService.list(userId),
    ]);
    setCount(c);
    setItems(list);
  };

  useEffect(() => { refresh(); }, [userId]);

  const markAllRead = async () => {
    const unreadIds = items.filter(i => !i.read_at).map(i => i.id);
    if (unreadIds.length) {
      await notificationService.markRead(unreadIds);
      refresh();
    }
  };

  const onClickItem = async (n: AppNotification) => {
    if (!n.read_at) await notificationService.markRead([n.id]);
    setOpen(false);
    if (n.link) navigate(n.link);
    refresh();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="relative p-2 rounded hover:bg-gray-100"
        onClick={() => {
          setOpen(!open);
          if (!open) refresh();
        }}
        aria-label={notifLabel}
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full px-1.5 py-[1px]">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm z-50 bg-white border rounded-lg shadow-xl animate-in fade-in zoom-in duration-200 origin-top-right">
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
                <p className="text-sm">{noNewLabel}</p>
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
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{n.message}</p>
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


