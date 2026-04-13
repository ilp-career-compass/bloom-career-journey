import React, { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/hooks/useLang';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, Check, AlertCircle, Info, Loader2, ArrowRight } from 'lucide-react';
import { useStudentStrings } from '@/components/student/studentStrings';

type MilestoneKey =
  | 'beginning_9th' | 'midterm_9th' | 'end_9th' | 'beginning_10th'
  | 'midterm_10th' | 'post_exam_10th' | 'before_results_10th' | 'final_decision';

interface MilestoneConfig {
  key: MilestoneKey;
  labelEn: string;
  labelKn: string;
  labelTa: string;
  labelHi: string;
  editable: boolean;
}

const MILESTONES: MilestoneConfig[] = [
  { key: 'beginning_9th', labelEn: 'Beginning of 9th Standard', labelKn: '9ನೇ ತರಗತಿಯ ಆರಂಭ', labelTa: '9ஆம் வகுப்பின் ஆரம்பம்', labelHi: '9वीं कक्षा की शुरुआत', editable: true },
  { key: 'midterm_9th', labelEn: 'Midterm of 9th Standard', labelKn: '9ನೇ ತರಗತಿಯ ಮಧ್ಯಾವಧಿ', labelTa: '9ஆம் வகுப்பின் இடைப்பருவம்', labelHi: '9वीं कक्षा का मध्यावधि', editable: true },
  { key: 'end_9th', labelEn: 'End of 9th Standard', labelKn: '9ನೇ ತರಗತಿಯ ಅಂತ್ಯ', labelTa: '9ஆம் வகுப்பின் முடிவு', labelHi: '9वीं कक्षा का अंत', editable: true },
  { key: 'beginning_10th', labelEn: 'Beginning of 10th Standard', labelKn: '10ನೇ ತರಗತಿಯ ಆರಂಭ', labelTa: '10ஆம் வகுப்பின் ஆரம்பம்', labelHi: '10वीं कक्षा की शुरुआत', editable: false },
  { key: 'midterm_10th', labelEn: 'Mid-term of 10th Standard', labelKn: '10ನೇ ತರಗತಿಯ ಮಧ್ಯಾವಧಿ', labelTa: '10ஆம் வகுப்பின் இடைப்பருவம்', labelHi: '10वीं कक्षा का मध्यावधि', editable: false },
  { key: 'post_exam_10th', labelEn: 'Post exams of 10th Standard', labelKn: '10ನೇ ತರಗತಿ ಪರೀಕ್ಷೆಗಳ ನಂತರ', labelTa: '10ஆம் வகுப்பு தேர்வுக்குப் பிறகு', labelHi: '10वीं कक्षा की परीक्षा के बाद', editable: false },
  { key: 'before_results_10th', labelEn: 'Before results of 10th Standard', labelKn: '10ನೇ ತರಗತಿ ಫಲಿತಾಂಶಗಳ ಮೊದಲು', labelTa: '10ஆம் வகுப்பு தேர்வு முடிவுகளுக்கு முன்', labelHi: '10वीं कक्षा के परिणाम से पहले', editable: false },
  { key: 'final_decision', labelEn: 'Finally decided Career choices', labelKn: 'ಅಂತಿಮವಾಗಿ ನಿರ್ಧರಿಸಿದ ವೃತ್ತಿ ಆಯ್ಕೆಗಳು', labelTa: 'இறுதியாக முடிவு செய்த தொழில் தேர்வுகள்', labelHi: 'अंतिम रूप से तय किए गए करियर विकल्प', editable: false },
];

const PAGE_TITLE: Record<string, string> = {
  en: 'My Career Roadmap',
  kn: 'ನನ್ನ ವೃತ್ತಿ ರೋಡ್‌ಮ್ಯಾಪ್',
  ta: 'என் தொழில் வழிகாட்டி',
  hi: 'मेरा करियर रोडमैप',
};

const INTRO_TEXT: Record<string, string> = {
  en: 'Enter your career choices at different stages in the table below to track how your thoughts evolve over time. First, write down the careers you are considering in columns A, B, and C, in order of preference.',
  kn: 'ನಿಮ್ಮ ಆಲೋಚನೆಗಳು ಕಾಲಾನುಕ್ರಮದಲ್ಲಿ ಹೇಗೆ ಬದಲಾಗುತ್ತವೆ ಎಂದು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಕೆಳಗಿನ ಕೋಷ್ಟಕದಲ್ಲಿ ವಿವಿಧ ಹಂತಗಳಲ್ಲಿ ನಿಮ್ಮ ವೃತ್ತಿ ಆಯ್ಕೆಗಳನ್ನು ನಮೂದಿಸಿ. ಮೊದಲಿಗೆ, ನೀವು ಪರಿಗಣಿಸುತ್ತಿರುವ ವೃತ್ತಿಗಳನ್ನು A, B ಮತ್ತು C ಕಾಲಮ್‌ಗಳಲ್ಲಿ ಆದ್ಯತೆಯ ಕ್ರಮದಲ್ಲಿ ಬರೆಯಿರಿ.',
  ta: 'உங்கள் எண்ணங்கள் காலப்போக்கில் எவ்வாறு மாறுகின்றன என்பதைக் கண்காணிக்க, கீழே உள்ள அட்டவணையில் வெவ்வேறு நிலைகளில் உங்கள் தொழில் தேர்வுகளை உள்ளிடவும். முதலில், நீங்கள் பரிசீலிக்கும் தொழில்களை A, B, C நெடுவரிசைகளில் விருப்ப வரிசையில் எழுதுங்கள்.',
  hi: 'समय के साथ अपने विचारों के विकास को ट्रैक करने के लिए नीचे दी गई तालिका में विभिन्न चरणों में अपने करियर विकल्प दर्ज करें। सबसे पहले, A, B और C कॉलम में अपनी पसंद के क्रम में करियर लिखें।',
};

const COLUMN_LABELS: Record<string, { milestone: string; planA: string; planB: string; planC: string }> = {
  en: { milestone: 'Milestone', planA: 'Plan A', planB: 'Plan B', planC: 'Plan C' },
  kn: { milestone: 'ಮೈಲಿಗಲ್ಲು', planA: 'ಯೋಜನೆ A', planB: 'ಯೋಜನೆ B', planC: 'ಯೋಜನೆ C' },
  ta: { milestone: 'நிலை', planA: 'திட்டம் A', planB: 'திட்டம் B', planC: 'திட்டம் C' },
  hi: { milestone: 'पड़ाव', planA: 'योजना A', planB: 'योजना B', planC: 'योजना C' },
};

// Milestone → assessment route mapping (for "Continue to Assessment" button)
const MILESTONE_ASSESSMENT_ROUTE: Partial<Record<MilestoneKey, string>> = {
  beginning_9th: '/student/assessment/inspiration',
  midterm_9th: '/student/assessment/hobbies',
  end_9th: '/student/assessment/career-guidance-tools',
};

const CONTINUE_LABEL: Record<string, string> = {
  en: 'Continue to Assessment',
  kn: 'ಮೌಲ್ಯಮಾಪನಕ್ಕೆ ಮುಂದುವರಿಯಿರಿ',
  ta: 'மதிப்பீட்டிற்கு தொடரவும்',
  hi: 'मूल्यांकन जारी रखें',
};

const FILL_PROMPT: Record<string, string> = {
  en: 'Before starting this assessment, please fill in your career plans for this milestone.',
  kn: 'ಈ ಮೌಲ್ಯಮಾಪನವನ್ನು ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು, ದಯವಿಟ್ಟು ಈ ಮೈಲಿಗಲ್ಲಿಗಾಗಿ ನಿಮ್ಮ ವೃತ್ತಿ ಯೋಜನೆಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.',
  ta: 'இந்த மதிப்பீட்டைத் தொடங்குவதற்கு முன், இந்த நிலைக்கான உங்கள் தொழில் திட்டங்களை நிரப்பவும்.',
  hi: 'इस मूल्यांकन को शुरू करने से पहले, कृपया इस पड़ाव के लिए अपनी करियर योजनाएं भरें।',
};

type RoadmapRow = { plan_a: string; plan_b: string; plan_c: string };

export default function CareerRoadmapPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { lang: currentLang } = useLang();
  const lang = (currentLang || 'en') as 'en' | 'kn' | 'ta' | 'hi';
  const { t } = useStudentStrings(lang);
  const studentId = user?.id || '';

  const highlightMilestone = searchParams.get('highlight') as MilestoneKey | null;
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  const [rows, setRows] = useState<Record<MilestoneKey, RoadmapRow>>(() => {
    const init: Record<string, RoadmapRow> = {};
    for (const m of MILESTONES) init[m.key] = { plan_a: '', plan_b: '', plan_c: '' };
    return init as Record<MilestoneKey, RoadmapRow>;
  });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSavesRef = useRef<Map<string, RoadmapRow>>(new Map());
  const isSavingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('career_roadmap')
        .select('milestone, plan_a, plan_b, plan_c')
        .eq('student_id', studentId);

      if (error) {
        logger.error('Error fetching roadmap:', error);
        return;
      }

      if (data && data.length > 0) {
        setRows(prev => {
          const next = { ...prev };
          for (const row of data) {
            const key = row.milestone as MilestoneKey;
            if (next[key]) {
              next[key] = { plan_a: row.plan_a || '', plan_b: row.plan_b || '', plan_c: row.plan_c || '' };
            }
          }
          return next;
        });
      }
    } catch (err) {
      logger.error('Error loading roadmap data:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Scroll to highlighted row after data loads
  useEffect(() => {
    if (!loading && highlightMilestone && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [loading, highlightMilestone]);

  const debouncedSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;
      const pending = new Map(pendingSavesRef.current);
      pendingSavesRef.current.clear();
      if (pending.size === 0) return;

      isSavingRef.current = true;
      setSaveStatus('saving');
      try {
        const upserts = Array.from(pending.entries()).map(([milestone, row]) => ({
          student_id: studentId,
          milestone,
          plan_a: row.plan_a,
          plan_b: row.plan_b,
          plan_c: row.plan_c,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from('career_roadmap')
          .upsert(upserts, { onConflict: 'student_id,milestone' });

        if (error) {
          logger.error('Save error:', error);
          setSaveStatus('error');
        } else {
          setSaveStatus('saved');
        }
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        logger.error('Save failed:', err);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } finally {
        isSavingRef.current = false;
      }
    }, 1000);
  }, [studentId]);

  const handleChange = (milestone: MilestoneKey, field: 'plan_a' | 'plan_b' | 'plan_c', value: string) => {
    setRows(prev => {
      const updated = { ...prev, [milestone]: { ...prev[milestone], [field]: value } };
      pendingSavesRef.current.set(milestone, updated[milestone]);
      return updated;
    });
    debouncedSave();
  };

  const getMilestoneLabel = (m: MilestoneConfig) =>
    lang === 'kn' ? m.labelKn : lang === 'ta' ? m.labelTa : lang === 'hi' ? m.labelHi : m.labelEn;

  const handleContinueToAssessment = () => {
    if (!highlightMilestone) return;
    const route = MILESTONE_ASSESSMENT_ROUTE[highlightMilestone];
    if (route) {
      setSearchParams({}, { replace: true });
      navigate(`${route}?lang=${lang}`);
    }
  };

  const cols = COLUMN_LABELS[lang] || COLUMN_LABELS.en;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl md:text-2xl font-bold">{PAGE_TITLE[lang] || PAGE_TITLE.en}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Highlighted milestone prompt */}
        {highlightMilestone && (
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 animate-in fade-in duration-300">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-gray-700 text-sm md:text-base leading-relaxed">{FILL_PROMPT[lang] || FILL_PROMPT.en}</p>
          </div>
        )}

        {/* Intro callout box */}
        <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-gray-700 text-sm md:text-base leading-relaxed">{INTRO_TEXT[lang] || INTRO_TEXT.en}</p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl shadow-sm bg-white border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="text-left px-6 py-4 font-semibold rounded-tl-xl w-48">{cols.milestone}</th>
                <th className="text-left px-6 py-4 font-semibold">{cols.planA}</th>
                <th className="text-left px-6 py-4 font-semibold">{cols.planB}</th>
                <th className="text-left px-6 py-4 font-semibold rounded-tr-xl">{cols.planC}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MILESTONES.map(m => {
                const row = rows[m.key];
                const isEditable = m.editable;
                const isHighlighted = highlightMilestone === m.key;
                return (
                  <tr
                    key={m.key}
                    ref={isHighlighted ? highlightRef : undefined}
                    className={`
                      ${isEditable ? 'border-l-4 border-l-blue-400' : 'border-l-4 border-l-gray-200 bg-gray-50'}
                      ${isHighlighted ? 'ring-2 ring-blue-400 ring-inset bg-blue-50 animate-pulse' : ''}
                    `}
                  >
                    <td className="px-6 py-4 bg-gray-50 font-medium text-gray-800 align-top w-48">
                      <div className="flex items-center gap-2">
                        {!isEditable && <Lock className="h-3.5 w-3.5 text-gray-400 shrink-0" />}
                        <span className={!isEditable ? 'text-gray-500' : ''}>{getMilestoneLabel(m)}</span>
                      </div>
                    </td>
                    {(['plan_a', 'plan_b', 'plan_c'] as const).map(field => (
                      <td key={field} className="px-4 py-3 align-top">
                        {isEditable ? (
                          <textarea
                            value={row[field]}
                            onChange={e => handleChange(m.key, field, e.target.value)}
                            rows={2}
                            className="w-full min-h-[60px] border-0 bg-transparent rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-colors"
                            placeholder={t('roadmap_enter_career')}
                          />
                        ) : (
                          <div className="p-2 text-gray-400 italic text-sm">
                            {row[field] || t('roadmap_available_later')}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Autosave indicator */}
        <div className="mt-3 text-right min-h-[24px]">
          {saveStatus === 'saving' && (
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('roadmap_saving')}
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <Check className="h-3.5 w-3.5" />
              {t('roadmap_all_saved')} ✓
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="inline-flex items-center gap-1.5 text-sm text-red-600 font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              {t('roadmap_save_failed')}
            </span>
          )}
        </div>

        {/* Continue to Assessment button (only when redirected from dashboard) */}
        {highlightMilestone && MILESTONE_ASSESSMENT_ROUTE[highlightMilestone] && (
          <div className="mt-6 text-center">
            <Button
              onClick={handleContinueToAssessment}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2"
            >
              {CONTINUE_LABEL[lang] || CONTINUE_LABEL.en}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
