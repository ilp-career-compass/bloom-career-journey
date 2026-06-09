import { useEffect, useState, useRef } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notificationService, AppNotification } from '@/services/notificationService';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';

const getLocalizedNotification = (n: AppNotification, lang: string): { title: string; message: string } => {
  const t = n.type;
  
  if (t === 'chat_message') {
    // Extract sender name by stripping suffixes
    let senderName = 'Someone';
    const msg = n.message || '';
    if (msg.endsWith(' sent you a message')) {
      senderName = msg.replace(' sent you a message', '');
    } else if (msg.endsWith(' ನಿಮಗೆ ಒಂದು ಸಂದೇಶ ಕಳುಹಿಸಿದ್ದಾರೆ')) {
      senderName = msg.replace(' ನಿಮಗೆ ಒಂದು ಸಂದೇಶ ಕಳುಹಿಸಿದ್ದಾರೆ', '');
    } else if (msg.endsWith(' உங்களுக்கு ஒரு செய்தி அனுப்பியுள்ளார்')) {
      senderName = msg.replace(' உங்களுக்கு ஒரு செய்தி அனுப்பியுள்ளார்', '');
    } else if (msg.endsWith(' ने आपको एक संदेश भेजा है')) {
      senderName = msg.replace(' ने आपको एक संदेश भेजा है', '');
    } else {
      // Fallback: take the first word or word before punctuation
      const parts = msg.split(/\s+/);
      if (parts.length > 0 && parts[0]) {
        senderName = parts[0];
      }
    }

    const title =
      lang === 'kn' ? 'ಹೊಸ ಸಂದೇಶ' :
      lang === 'ta' ? 'புதிய செய்தி' :
      lang === 'hi' ? 'नया संदेश' :
      'New message';

    const message =
      lang === 'kn' ? `${senderName} ನಿಮಗೆ ಒಂದು ಸಂದೇಶ ಕಳುಹಿಸಿದ್ದಾರೆ` :
      lang === 'ta' ? `${senderName} உங்களுக்கு ஒரு செய்தி அனுப்பியுள்ளார்` :
      lang === 'hi' ? `${senderName} ने आपको एक संदेश भेजा है` :
      `${senderName} sent you a message`;

    return { title, message };
  }

  if (t === 'profile_card_approved') {
    const title =
      lang === 'kn' ? 'ಪ್ರೊಫೈಲ್ ಕಾರ್ಡ್ ಮಾಡ್ಯೂಲ್ ಅನುಮೋದಿಸಲಾಗಿದೆ' :
      lang === 'ta' ? 'சுயவிவர அட்டை தொகுதி அனுமதிக்கப்பட்டது' :
      lang === 'hi' ? 'प्रोफाइल कार्ड मॉड्यूल अनुमोदित' :
      'Profile card module approved';
    const message =
      lang === 'kn' ? 'ನಿಮ್ಮ ಶಿಕ್ಷಕರು ನಿಮ್ಮ ಕರಿಯರ್ ಕಾಂಪಾಸ್‌ನಲ್ಲಿ ಒಂದು ವಿಭಾಗವನ್ನು ಅನುಮೋದಿಸಿದ್ದಾರೆ.' :
      lang === 'ta' ? 'உங்கள் ஆசிரியர் உங்கள் கரியர் காம்பஸ்ஸில் ஒரு பகுதியை அனுமதித்துள்ளார்.' :
      lang === 'hi' ? 'आपके शिक्षक ने आपके करियर कम्पास में एक मॉड्यूल अनुमोदित किया है।' :
      'Your teacher has approved a module in your Career Compass.';
    return { title, message };
  }

  if (t === 'profile_card_rejected') {
    const title =
      lang === 'kn' ? 'ಪ್ರೊಫೈಲ್ ಕಾರ್ಡ್ ಮಾಡ್ಯೂಲ್ ಪರಿಷ್ಕರಣೆ ಅಗತ್ಯವಿದೆ' :
      lang === 'ta' ? 'சுயவிவர அட்டை தொகுதி திருத்தம் தேவை' :
      lang === 'hi' ? 'प्रोफाइल कार्ड मॉड्यूल में संशोधन आवश्यक' :
      'Profile card module needs revision';
    const message =
      lang === 'kn' ? 'ನಿಮ್ಮ ಶಿಕ್ಷಕರು ನಿಮ್ಮ ಕರಿಯರ್ ಕಾಂಪಾಸ್‌ನಲ್ಲಿ ಒಂದು ವಿಭಾಗದಲ್ಲಿ ಬದಲಾವಣೆ ಕೋರಿದ್ದಾರೆ. ಪ್ರತಿಕ್ರಿಯೆ ನೋಡಲು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಕಾರ್ಡ್ ನೋಡಿ.' :
      lang === 'ta' ? 'உங்கள் ஆசிரியர் உங்கள் கரியர் காம்பஸ்ஸில் ஒரு பகுதியில் மாற்றம் கோரியுள்ளார். கருத்துக்களை பார்க்க உங்கள் சுயவிவர அட்டையை பார்வையிடுங்கள்.' :
      lang === 'hi' ? 'आपके शिक्षक ने आपके करियर कम्पास में एक मॉड्यूल में बदलाव का अनुरोध किया है। कृपया अपना प्रोफाइल कार्ड देखें।' :
      'Your teacher has requested changes to a module in your Career Compass. Please visit your profile card to see the feedback.';
    return { title, message };
  }

  if (t === 'summary_approved' || t === 'summary_rejected' || t === 'revision_requested') {
    // Extract assessment key from message
    const msg = n.message || '';
    let assessmentKey = 'inspiration';
    const quoteMatch = msg.match(/"([^"]+)"/);
    const titleStr = quoteMatch ? quoteMatch[1] : msg;

    if (titleStr.includes('Inspiration') || titleStr.includes('ಪ್ರೇರಣೆ') || titleStr.includes('ஊக்கப்படுத்தியவை') || titleStr.includes('ಪ್ರೇರಣಾದಾಯಕ') || titleStr.includes('ಪ್ರೇರಣೆಗಳು') || titleStr.includes('प्रेरणा')) {
      assessmentKey = 'inspiration';
    } else if (titleStr.includes('About Me') || titleStr.includes('ನನ್ನ ಬಗ್ಗೆ') || titleStr.includes('ಎன்னை பற்றி') || titleStr.includes('என்னை பற்றி') || titleStr.includes('मेरे बारे में')) {
      assessmentKey = 'about_me';
    } else if (titleStr.includes('Dream') || titleStr.includes('ಕನಸುಗಳು') || titleStr.includes('ಕನಸು') || titleStr.includes('கனவுகள்') || titleStr.includes('கனவு') || titleStr.includes('सपने')) {
      assessmentKey = 'dreams';
    } else if (titleStr.includes('School') || titleStr.includes('ಶಾಲೆ') || titleStr.includes('ಪಠ್ಯ') || titleStr.includes('பள்ளி') || titleStr.includes('கற்றல்') || titleStr.includes('स्कूल')) {
      assessmentKey = 'school_learning';
    } else if (titleStr.includes('Talent') || titleStr.includes('Hobby') || titleStr.includes('ಪ್ರತಿಭೆ') || titleStr.includes('ಹವ್ಯಾಸ') || titleStr.includes('ಹವ್ಯಾಸಗಳು') || titleStr.includes('திறமைகள்') || titleStr.includes('பொழுதுபோக்கு') || titleStr.includes('प्रतिभा') || titleStr.includes('शौक')) {
      assessmentKey = 'hobbies';
    } else if (titleStr.includes('Role Model') || titleStr.includes('ಆದರ್ಶ') || titleStr.includes('ಆದರ್ಶಗಳು') || titleStr.includes('முன்மாதிரி') || titleStr.includes('முன்மாதிரிகள்') || titleStr.includes('आदर्श')) {
      assessmentKey = 'role_models';
    }

    // Localize the titleStr
    const localizedTitle =
      lang === 'kn' ? (
        assessmentKey === 'inspiration' ? 'ನನಗೆ ಪ್ರೇರಣೆ ನೀಡಿದವು' :
        assessmentKey === 'about_me' ? 'ನನ್ನ ಬಗ್ಗೆ' :
        assessmentKey === 'dreams' ? 'ನನ್ನ ಕನಸುಗಳು' :
        assessmentKey === 'school_learning' ? 'ನನ್ನ ಶಾಲೆ, ನನ್ನ ಕಲಿಕೆ ಮತ್ತು ನಾನು' :
        assessmentKey === 'hobbies' ? 'ನನ್ನ ಪ್ರತಿಭೆಗಳು ಮತ್ತು ಹವ್ಯಾಸಗಳು' :
        'ನನ್ನ ಆದರ್ಶಗಳು'
      ) : lang === 'ta' ? (
        assessmentKey === 'inspiration' ? 'என்னை ஊக்கப்படுத்தியவை' :
        assessmentKey === 'about_me' ? 'என்னை பற்றி' :
        assessmentKey === 'dreams' ? 'என் கனவுகள்' :
        assessmentKey === 'school_learning' ? 'என் பள்ளி, என் கற்றல் மற்றும் நான்' :
        assessmentKey === 'hobbies' ? 'என் திறமைகள் மற்றும் பொழுதுபோக்குகள்' :
        'என் முன்மாதிரிகள்'
      ) : lang === 'hi' ? (
        assessmentKey === 'inspiration' ? 'मेरी प्रेरणा' :
        assessmentKey === 'about_me' ? 'मेरे बारे में' :
        assessmentKey === 'dreams' ? 'मेरे सपने' :
        assessmentKey === 'school_learning' ? 'मेरा स्कूल, मेरी सीख और मैं' :
        assessmentKey === 'hobbies' ? 'मेरी प्रतिभाएं और शौक' :
        'मेरे आदर्श'
      ) : (
        assessmentKey === 'inspiration' ? 'My Inspiration' :
        assessmentKey === 'about_me' ? 'About Me' :
        assessmentKey === 'dreams' ? 'My Dreams' :
        assessmentKey === 'school_learning' ? 'My School, My Learning and I' :
        assessmentKey === 'hobbies' ? 'My Talents and Hobbies' :
        'My Role Models'
      );

    if (t === 'summary_approved') {
      const title =
        lang === 'kn' ? 'ಸಾರಾಂಶ ಅನುಮೋದಿಸಲಾಗಿದೆ ✅' :
        lang === 'ta' ? 'சுருக்கம் அனுமதிக்கப்பட்டது ✅' :
        lang === 'hi' ? 'सारांश अनुमोदित ✅' :
        'Summary Approved ✅';
      const message =
        lang === 'kn' ? `ನಿಮ್ಮ "${localizedTitle}" ಸಾರಾಂಶ ಶಿಕ್ಷಕರಿಂದ ಅನುಮೋದಿಸಲ್ಪಟ್ಟಿದೆ.` :
        lang === 'ta' ? `உங்கள் "${localizedTitle}" சுருக்கம் ஆசிரியரால் அனுமதிக்கப்பட்டது.` :
        lang === 'hi' ? `आपकी "${localizedTitle}" सारांश शिक्षक द्वारा अनुमोदित की गई है।` :
        `Your "${localizedTitle}" summary has been approved by your teacher.`;
      return { title, message };
    }

    if (t === 'summary_rejected') {
      const title =
        lang === 'kn' ? 'ಸಾರಾಂಶ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ' :
        lang === 'ta' ? 'சுருக்கம் நிராகரிக்கப்பட்டது' :
        lang === 'hi' ? 'सारांश अस्वीकृत' :
        'Summary Rejected';
      const message =
        lang === 'kn' ? `ನಿಮ್ಮ "${localizedTitle}" ಸಾರಾಂಶ ತಿರಸ್ಕರಿಸಲ್ಪಟ್ಟಿದೆ. ಹೊಸ ಸಾರಾಂಶ ರಚಿಸಲಾಗುತ್ತಿದೆ.` :
        lang === 'ta' ? `உங்கள் "${localizedTitle}" சுருக்கம் நிராகரிக்கப்பட்டது. புதிய சுருக்கம் உருவாக்கப்படுகிறது.` :
        lang === 'hi' ? `आपकी "${localizedTitle}" सारांश अस्वीकृत की गई है। एक नई सारांश तैयार की जा रही है।` :
        `Your "${localizedTitle}" summary was rejected. A new summary is being generated.`;
      return { title, message };
    }

    // t === 'revision_requested'
    const isAssessmentRevision = !msg.includes('summary') && !msg.includes('ಸಾರಾಂಶ') && !msg.includes('சுருக்கம்') && !msg.includes('सारांश');

    if (isAssessmentRevision) {
      const title =
        lang === 'kn' ? 'ಮಾಡ್ಯೂಲ್ ಪರಿಷ್ಕರಣೆ ಅಗತ್ಯವಿದೆ ⚠️' :
        lang === 'ta' ? 'தொகுதி திருத்தம் தேவை ⚠️' :
        lang === 'hi' ? 'मॉड्यूल संशोधन आवश्यक ⚠️' :
        'Module Revision Requested ⚠️';
      const message =
        lang === 'kn' ? `ನಿಮ್ಮ "${localizedTitle}" ಮಾಡ್ಯೂಲ್ ಅನ್ನು ಪರಿಷ್ಕರಿಸಲು ಶಿಕ್ಷಕರು ಕೋರಿದ್ದಾರೆ. ದಯವಿಟ್ಟು ಈ ಮಾಡ್ಯೂಲ್ ಅನ್ನು ಮರುಸಲ್ಲಿಸಿ.` :
        lang === 'ta' ? `உங்கள் "${localizedTitle}" தொகுதியில் திருத்தம் செய்ய ஆசிரியர் கோரியுள்ளார். தயவுசெய்து இந்த தொகுதியை மீண்டும் சமர்ப்பிக்கவும்.` :
        lang === 'hi' ? `आपके शिक्षक ने आपके "${localizedTitle}" मॉड्यूल में संशोधन का अनुरोध किया है। कृपया इस मॉड्यूल को पुनः सबमिट करें।` :
        `Your teacher has requested revisions to your "${localizedTitle}" module. Please resubmit this module.`;
      return { title, message };
    }

    const title =
      lang === 'kn' ? 'ಸಾರಾಂಶ ಪರಿಷ್ಕರಣೆ ಅಗತ್ಯವಿದೆ' :
      lang === 'ta' ? 'சுருக்கம் திருத்தம் தேவை' :
      lang === 'hi' ? 'सारांश संशोधन आवश्यक' :
      'Summary Revision Requested';
    const message =
      lang === 'kn' ? `ಶಿಕ್ಷಕರು "${localizedTitle}" ಸಾರಾಂಶ ಪರಿಷ್ಕರಿಸಲು ಕೋರಿದ್ದಾರೆ.` :
      lang === 'ta' ? `ஆசிரியர் "${localizedTitle}" சுருக்கத்தில் திருத்தம் கோரியுள்ளார்.` :
      lang === 'hi' ? `शिक्षक ने "${localizedTitle}" सारांश में संशोधन का अनुरोध किया है।` :
      `Your teacher has requested revisions to your "${localizedTitle}" summary.`;
    return { title, message };
  }

  // Fallback for custom or unknown types: return raw title/message
  return { title: n.title || '', message: n.message || '' };
};

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
              items.map(n => {
                const loc = getLocalizedNotification(n, lang);
                return (
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
                            {loc.title}
                          </span>
                          {n.link && <ExternalLink className="w-3 h-3 text-gray-400" />}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed break-words">{loc.message}</p>
                        <p className="text-[10px] text-gray-400">
                          {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Just now'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
