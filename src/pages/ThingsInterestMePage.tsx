import React, { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/hooks/useLang';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type EditableField = 'subject' | 'lesson_chapter' | 'why_factors' | 'compatible_career';

interface InterestRow {
  _key: string;        // stable client-side identity (DB id for loaded rows, UUID for new ones)
  id?: string;
  subject: string;
  lesson_chapter: string;
  why_factors: string;
  compatible_career: string;
  source_assessment?: string;
  _dirty?: boolean;
  _new?: boolean;
}

const MAX_ROWS = 20;

// Safe {key} interpolation — replaces all {word} placeholders, unknown keys left verbatim.
const interpolate = (template: string, vars: Record<string, string>): string =>
  template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);

const STRINGS: Record<string, Record<string, string>> = {
  en: {
    title: 'Things that Interest Me',
    col_subject: 'Subject',
    col_lesson: 'Lesson / Chapter',
    col_why: 'Why or What factors led you to like this lesson/chapter?',
    col_career: 'A compatible career',
    add_row: 'Add Row',
    saving: 'Saving...',
    saved: 'Saved',
    delete_confirm: 'Delete this row?',
    save_failed: 'Save failed',
    delete_failed: 'Delete failed',
    empty: 'No entries yet. Add your first interest!',
    row_limit: `You can add up to ${MAX_ROWS} entries.`,
    from_banner: 'Based on your {name} responses, add any subjects or topics that interest you.',
    assessment_inspiration: 'My Inspiration',
    assessment_about_me: 'About Me',
    assessment_dreams: 'My Dreams',
    assessment_school_learning: 'My School, My Learning and I',
    assessment_hobbies: 'My Talents and Hobbies',
    assessment_role_models: 'My Role Models',
    assessment_personality: 'Holland Code (RIASEC) Test',
    assessment_career_guidance_tools: 'Exploring Career Guidance Tools',
  },
  kn: {
    title: 'ನನಗೆ ಆಸಕ್ತಿ ಇರುವ ವಿಷಯಗಳು',
    col_subject: 'ವಿಷಯ',
    col_lesson: 'ಪಾಠ / ಅಧ್ಯಾಯ',
    col_why: 'ಈ ಪಾಠ/ಅಧ್ಯಾಯವನ್ನು ಇಷ್ಟಪಡಲು ಯಾವ ಅಂಶಗಳು ಕಾರಣ?',
    col_career: 'ಹೊಂದಿಕೆಯಾಗುವ ವೃತ್ತಿ',
    add_row: 'ಸಾಲು ಸೇರಿಸಿ',
    saving: 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...',
    saved: 'ಉಳಿಸಲಾಗಿದೆ',
    delete_confirm: 'ಈ ಸಾಲನ್ನು ಅಳಿಸುವುದೇ?',
    save_failed: 'ಉಳಿಸಲು ವಿಫಲವಾಯಿತು',
    delete_failed: 'ಅಳಿಸಲು ವಿಫಲವಾಯಿತು',
    empty: 'ಇನ್ನೂ ಯಾವುದೇ ನಮೂದುಗಳಿಲ್ಲ. ನಿಮ್ಮ ಮೊದಲ ಆಸಕ್ತಿಯನ್ನು ಸೇರಿಸಿ!',
    row_limit: `ನೀವು ಗರಿಷ್ಠ ${MAX_ROWS} ನಮೂದುಗಳನ್ನು ಸೇರಿಸಬಹುದು.`,
    from_banner: 'ನಿಮ್ಮ {name} ಉತ್ತರಗಳ ಆಧಾರದ ಮೇಲೆ, ನಿಮಗೆ ಆಸಕ್ತಿ ಇರುವ ವಿಷಯಗಳನ್ನು ಸೇರಿಸಿ.',
    assessment_inspiration: 'ನನ್ನ ಪ್ರೇರಣೆ',
    assessment_about_me: 'ನನ್ನ ಬಗ್ಗೆ',
    assessment_dreams: 'ನನ್ನ ಕನಸುಗಳು',
    assessment_school_learning: 'ನನ್ನ ಶಾಲೆ, ನನ್ನ ಕಲಿಕೆ',
    assessment_hobbies: 'ನನ್ನ ಪ್ರತಿಭೆಗಳು ಮತ್ತು ಹವ್ಯಾಸಗಳು',
    assessment_role_models: 'ನನ್ನ ಆದರ್ಶ ವ್ಯಕ್ತಿ',
    assessment_personality: 'ಹಾಲೆಂಡ್ ಕೋಡ್ (RIASEC) ಪರೀಕ್ಷೆ',
    assessment_career_guidance_tools: 'ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನ ಸಾಧನಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
  },
  ta: {
    title: 'எனக்கு ஆர்வமான விஷயங்கள்',
    col_subject: 'பாடம்',
    col_lesson: 'பாடம் / அத்தியாயம்',
    col_why: 'இந்த பாடம்/அத்தியாயத்தை ஏன் விரும்புகிறீர்கள்?',
    col_career: 'பொருத்தமான தொழில்',
    add_row: 'வரிசை சேர்',
    saving: 'சேமிக்கிறது...',
    saved: 'சேமிக்கப்பட்டது',
    delete_confirm: 'இந்த வரிசையை நீக்கவா?',
    save_failed: 'சேமிக்க தவறியது',
    delete_failed: 'நீக்கத் தவறியது',
    empty: 'இன்னும் எந்த பதிவும் இல்லை. உங்கள் முதல் ஆர்வத்தைச் சேர்க்கவும்!',
    row_limit: `நீங்கள் அதிகபட்சம் ${MAX_ROWS} பதிவுகளை சேர்க்கலாம்.`,
    from_banner: 'உங்கள் {name} பதில்களின் அடிப்படையில், உங்களுக்கு ஆர்வமான பாடங்களைச் சேர்க்கவும்.',
    assessment_inspiration: 'என் உத்வேகம்',
    assessment_about_me: 'என்னைப் பற்றி',
    assessment_dreams: 'என் கனவுகள்',
    assessment_school_learning: 'நானும், என் பள்ளியும், என் கற்றலும்',
    assessment_hobbies: 'என் திறமைகள் மற்றும் பொழுதுபோக்குகள்',
    assessment_role_models: 'என் முன்மாதிரி நபர்',
    assessment_personality: 'ஹாலண்ட் குறியீடு (RIASEC) தேர்வு',
    assessment_career_guidance_tools: 'தொழில் வழிகாட்டல் கருவிகளை அறிதல்',
  },
  hi: {
    title: 'मुझे जिन चीज़ों में रुचि है',
    col_subject: 'विषय',
    col_lesson: 'पाठ / अध्याय',
    col_why: 'इस पाठ/अध्याय को पसंद करने के क्या कारण हैं?',
    col_career: 'एक उपयुक्त करियर',
    add_row: 'पंक्ति जोड़ें',
    saving: 'सहेजा जा रहा है...',
    saved: 'सहेजा गया',
    delete_confirm: 'इस पंक्ति को हटाएं?',
    save_failed: 'सहेजने में विफल',
    delete_failed: 'हटाने में विफल',
    empty: 'अभी तक कोई प्रविष्टि नहीं। अपनी पहली रुचि जोड़ें!',
    row_limit: `आप अधिकतम ${MAX_ROWS} प्रविष्टियाँ जोड़ सकते हैं।`,
    from_banner: 'आपके {name} उत्तरों के आधार पर, अपनी रुचि के विषय जोड़ें।',
    assessment_inspiration: 'मेरी प्रेरणा',
    assessment_about_me: 'मेरे बारे में',
    assessment_dreams: 'मेरे सपने',
    assessment_school_learning: 'मेरा विद्यालय, मेरी पढ़ाई और मैं',
    assessment_hobbies: 'मेरी प्रतिभाएं और शौक',
    assessment_role_models: 'मेरे आदर्श',
    assessment_personality: 'हॉलैंड कोड (RIASEC) परीक्षा',
    assessment_career_guidance_tools: 'करियर मार्गदर्शन उपकरणों की खोज',
  },
};

const ASSESSMENT_NAME_KEYS: Record<string, string> = {
  inspiration: 'assessment_inspiration',
  about_me: 'assessment_about_me',
  dreams: 'assessment_dreams',
  school_learning: 'assessment_school_learning',
  hobbies: 'assessment_hobbies',
  role_models: 'assessment_role_models',
  personality: 'assessment_personality',
  career_guidance_tools: 'assessment_career_guidance_tools',
};

export default function ThingsInterestMePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile, loading: authLoading } = useAuth();
  const { lang } = useLang();
  const { toast } = useToast();

  const resolvedLang = (lang && ['en', 'kn', 'ta', 'hi'].includes(lang) ? lang : 'en') as string;
  const t = (key: string) => STRINGS[resolvedLang]?.[key] || STRINGS.en[key] || key;

  const [rows, setRows] = useState<InterestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  // Keyed by row._key so deletions cannot shift another row's timer.
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const fromAssessment = searchParams.get('from');

  // Clear all pending timers on unmount to avoid setState on an unmounted component.
  useEffect(() => {
    return () => { Object.values(debounceTimers.current).forEach(clearTimeout); };
  }, []);

  // Load existing entries.
  useEffect(() => {
    if (!userProfile?.id) {
      // Auth has finished loading but there is no profile — stop the spinner.
      if (!authLoading) setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase
          .from('things_that_interest_me')
          .select('*')
          .eq('student_id', userProfile.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setRows(data?.map(r => ({
          _key: r.id,
          id: r.id,
          subject: r.subject,
          lesson_chapter: r.lesson_chapter,
          why_factors: r.why_factors,
          compatible_career: r.compatible_career,
          source_assessment: r.source_assessment ?? undefined,
        })) ?? []);
      } catch (err) {
        logger.error('Error loading interests:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userProfile?.id, authLoading]);

  const saveRow = useCallback(async (key: string, row: InterestRow) => {
    if (!userProfile?.id) return;
    setSavingKeys(prev => new Set(prev).add(key));

    try {
      if (row.id && !row._new) {
        // Update existing — updated_at is handled by the DB trigger.
        const { error } = await supabase
          .from('things_that_interest_me')
          .update({
            subject: row.subject,
            lesson_chapter: row.lesson_chapter,
            why_factors: row.why_factors,
            compatible_career: row.compatible_career,
          })
          .eq('id', row.id);
        if (error) throw error;
      } else {
        // Insert new.
        const { data, error } = await supabase
          .from('things_that_interest_me')
          .insert({
            student_id: userProfile.id,
            subject: row.subject,
            lesson_chapter: row.lesson_chapter,
            why_factors: row.why_factors,
            compatible_career: row.compatible_career,
            source_assessment: row.source_assessment ?? null,
          })
          .select()
          .single();
        if (error) throw error;
        // Only update id and _new; preserve _dirty so keystrokes that arrived
        // while the insert was in-flight are not lost (C3 fix).
        setRows(prev => prev.map(r => r._key === key ? { ...r, id: data.id, _new: false } : r));
      }
    } catch (err) {
      logger.error('Error saving interest row:', err);
      toast({ title: t('save_failed'), variant: 'destructive' });
    } finally {
      setSavingKeys(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  }, [userProfile?.id, toast]);

  const handleChange = useCallback((key: string, field: EditableField, value: string) => {
    setRows(prev => prev.map(r => r._key === key ? { ...r, [field]: value, _dirty: true } : r));

    // Debounced save keyed by _key, not array index.
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(() => {
      setRows(prev => {
        const row = prev.find(r => r._key === key);
        if (row?._dirty) saveRow(key, row);
        return prev;
      });
    }, 1000);
  }, [saveRow]);

  const addRow = () => {
    if (rows.length >= MAX_ROWS) {
      toast({ title: t('row_limit'), variant: 'destructive' });
      return;
    }
    const key = crypto.randomUUID();
    setRows(prev => [...prev, {
      _key: key,
      subject: '', lesson_chapter: '', why_factors: '', compatible_career: '',
      source_assessment: fromAssessment || undefined, _new: true, _dirty: false,
    }]);
  };

  const deleteRow = async (key: string) => {
    if (!window.confirm(t('delete_confirm'))) return;

    const row = rows.find(r => r._key === key);
    if (!row) return;

    if (row.id && !row._new) {
      try {
        const { error } = await supabase
          .from('things_that_interest_me')
          .delete()
          .eq('id', row.id);
        if (error) throw error;
      } catch (err) {
        logger.error('Error deleting interest row:', err);
        toast({ title: t('delete_failed'), variant: 'destructive' });
        return;
      }
    }

    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
      delete debounceTimers.current[key];
    }
    setRows(prev => prev.filter(r => r._key !== key));
  };

  const fromBanner = fromAssessment && ASSESSMENT_NAME_KEYS[fromAssessment]
    ? interpolate(t('from_banner'), { name: t(ASSESSMENT_NAME_KEYS[fromAssessment]) })
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/student')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-800">{t('title')}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* From-assessment banner */}
        {fromBanner && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-indigo-50 border border-indigo-200 p-3 text-sm text-indigo-800">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{fromBanner}</span>
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-indigo-50 border-b border-indigo-100">
                <th className="px-3 py-3 text-left text-xs font-semibold text-indigo-700 w-[18%]">{t('col_subject')}</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-indigo-700 w-[20%]">{t('col_lesson')}</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-indigo-700 w-[37%]">{t('col_why')}</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-indigo-700 w-[20%]">{t('col_career')}</th>
                <th className="px-3 py-3 w-[5%]" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{t('empty')}</td></tr>
              )}
              {rows.map(row => (
                <tr key={row._key} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-2 py-2">
                    <Input value={row.subject} onChange={e => handleChange(row._key, 'subject', e.target.value)}
                      aria-label={t('col_subject')}
                      className="text-sm h-9" />
                  </td>
                  <td className="px-2 py-2">
                    <Input value={row.lesson_chapter} onChange={e => handleChange(row._key, 'lesson_chapter', e.target.value)}
                      aria-label={t('col_lesson')}
                      className="text-sm h-9" />
                  </td>
                  <td className="px-2 py-2">
                    <Input value={row.why_factors} onChange={e => handleChange(row._key, 'why_factors', e.target.value)}
                      aria-label={t('col_why')}
                      className="text-sm h-9" />
                  </td>
                  <td className="px-2 py-2">
                    <Input value={row.compatible_career} onChange={e => handleChange(row._key, 'compatible_career', e.target.value)}
                      aria-label={t('col_career')}
                      className="text-sm h-9" />
                  </td>
                  <td className="px-2 py-2 text-center">
                    {savingKeys.has(row._key) ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400 mx-auto" />
                    ) : (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => deleteRow(row._key)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards */}
        <div className="md:hidden space-y-4">
          {rows.length === 0 && (
            <div className="text-center text-gray-400 py-8">{t('empty')}</div>
          )}
          {rows.map(row => (
            <div key={row._key} className="bg-white rounded-lg shadow p-4 space-y-3 relative">
              <div className="absolute top-2 right-2">
                {savingKeys.has(row._key) ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600"
                    onClick={() => deleteRow(row._key)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <div>
                <label htmlFor={`${row._key}-subject`} className="text-xs font-medium text-gray-500">{t('col_subject')}</label>
                <Input id={`${row._key}-subject`} value={row.subject}
                  onChange={e => handleChange(row._key, 'subject', e.target.value)}
                  onFocus={e => { const el = e.currentTarget; setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); }}
                  className="text-sm mt-1" />
              </div>
              <div>
                <label htmlFor={`${row._key}-lesson`} className="text-xs font-medium text-gray-500">{t('col_lesson')}</label>
                <Input id={`${row._key}-lesson`} value={row.lesson_chapter}
                  onChange={e => handleChange(row._key, 'lesson_chapter', e.target.value)}
                  onFocus={e => { const el = e.currentTarget; setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); }}
                  className="text-sm mt-1" />
              </div>
              <div>
                <label htmlFor={`${row._key}-why`} className="text-xs font-medium text-gray-500">{t('col_why')}</label>
                <Input id={`${row._key}-why`} value={row.why_factors}
                  onChange={e => handleChange(row._key, 'why_factors', e.target.value)}
                  onFocus={e => { const el = e.currentTarget; setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); }}
                  className="text-sm mt-1" />
              </div>
              <div>
                <label htmlFor={`${row._key}-career`} className="text-xs font-medium text-gray-500">{t('col_career')}</label>
                <Input id={`${row._key}-career`} value={row.compatible_career}
                  onChange={e => handleChange(row._key, 'compatible_career', e.target.value)}
                  onFocus={e => { const el = e.currentTarget; setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); }}
                  className="text-sm mt-1" />
              </div>
            </div>
          ))}
        </div>

        {/* Add row button */}
        <div className="mt-4">
          <Button onClick={addRow} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            {t('add_row')}
          </Button>
        </div>
      </div>
    </div>
  );
}
