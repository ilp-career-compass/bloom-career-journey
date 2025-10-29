import { useEffect, useState } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { notificationService, AppNotification } from '@/services/notificationService';
import { useNavigate } from 'react-router-dom';

interface Props {
  userId: string;
}

export default function NotificationBell({ userId }: Props) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const navigate = useNavigate();

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
    if (n.link) navigate(n.link);
    refresh();
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="relative p-2 rounded hover:bg-gray-100"
        onClick={() => { setOpen(!open); if (!open) refresh(); }}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full px-1.5 py-[1px]">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50">
          <div className="flex items-center justify-between p-2 border-b">
            <span className="text-sm font-medium">Notifications</span>
            <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 px-2 text-xs">
              <Check className="w-3 h-3 mr-1" /> Mark all read
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <div className="p-4 text-sm text-gray-500">No notifications</div>
            )}
            {items.map(n => (
              <button key={n.id} className={`w-full text-left p-3 border-b hover:bg-gray-50 ${!n.read_at ? 'bg-blue-50/40' : ''}`} onClick={() => onClickItem(n)}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{n.title}</span>
                  {!n.read_at && <Badge variant="secondary" className="text-[10px]">new</Badge>}
                </div>
                <div className="text-xs text-gray-600 mt-1">{n.message}</div>
                {n.link && (
                  <div className="text-[11px] text-blue-600 mt-1 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Open
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


