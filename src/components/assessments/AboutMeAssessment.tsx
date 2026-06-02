import { logger } from '@/lib/logger';
import { useEffect, useMemo, useState } from 'react';
import { validateResponses } from '@/utils/englishValidation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, ArrowLeft, CheckCircle, Lock, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { handleDatabaseError, validateApiResponse } from '@/utils/errorHandler';
import { useLang } from '@/hooks/useLang';
import { checkAssessmentUnlock } from '@/utils/assessmentUnlock';
import { fetchTranslations } from '@/services/translationService';
import { aiSummaryService } from '@/services/aiSummaryService';
import { summaryDatabaseService } from '@/services/summaryDatabaseService';

interface AboutMeField {
  field_key: string;
  question_text: string;
  help_text: string;
  field_type: 'text' | 'textarea' | 'triple' | 'double';
  section: string;
  sequence_number: number;
}

type Triple = [string, string, string];
type Double = [string, string];

// Dynamic responses based on database fields
interface AboutMeResponses {
  [field_key: string]: string | Triple | Double | { [key: string]: string };
}

export default function AboutMeAssessment() {
  const { userProfile } = useAuth();
  const { t, lang } = useLang();
  const [searchParams] = useSearchParams();
  const readOnlyView = ['1', 'true'].includes((searchParams.get('readonly') || searchParams.get('view') || '').toLowerCase());
  const tabParam = searchParams.get('tab');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<AboutMeResponses>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [helpOpen, setHelpOpen] = useState<Record<string, boolean>>({});
  const [aboutMeFields, setAboutMeFields] = useState<AboutMeField[]>([]);
  const [currentSection, setCurrentSection] = useState<string>('');
  const [helpTranslations, setHelpTranslations] = useState<Record<string, string>>({});
  const [summaryQuestions, setSummaryQuestions] = useState<any[]>([]);
  const toggleHelp = (k: string) => setHelpOpen(prev => ({ ...prev, [k]: !prev[k] }));

  // Initialize responses based on database fields
  const initializeResponses = (fields: AboutMeField[]) => {
    const initialResponses: AboutMeResponses = {};
    fields.forEach(field => {
      if (field.field_type === 'triple') {
        initialResponses[field.field_key] = ['', '', ''] as Triple;
      } else if (field.field_type === 'double') {
        initialResponses[field.field_key] = ['', ''] as Double;
      } else {
        initialResponses[field.field_key] = '';
      }
    });

    // Handle summary questions
    const summary: Record<string, string> = {};
    if (summaryQuestions.length > 0) {
      summaryQuestions.forEach((_, i) => {
        summary[`question${i + 1}`] = '';
      });
    } else {
      // Fallback to default 3
      summary['question1'] = '';
      summary['question2'] = '';
      summary['question3'] = '';
    }
    initialResponses['summary'] = summary;

    return initialResponses;
  };

  // Group fields by section
  const fieldsBySection = useMemo(() => {
    const grouped: { [section: string]: AboutMeField[] } = {};
    aboutMeFields.forEach(field => {
      if (!grouped[field.section]) {
        grouped[field.section] = [];
      }
      grouped[field.section].push(field);
    });
    return grouped;
  }, [aboutMeFields]);

  // Get sorted sections
  const sections = useMemo(() => {
    const sectionsList = Object.keys(fieldsBySection).sort((a, b) => {
      const firstFieldA = fieldsBySection[a]?.[0];
      const firstFieldB = fieldsBySection[b]?.[0];
      return (firstFieldA?.sequence_number || 0) - (firstFieldB?.sequence_number || 0);
    });
    // Append Summary section only when real sections exist (fields loaded)
    if (sectionsList.length > 0) {
      sectionsList.push('Summary');
    }
    return sectionsList;
  }, [fieldsBySection]);

  // Set initial current section when sections are loaded
  useEffect(() => {
    if (sections.length > 0 && !currentSection) {
      setCurrentSection(sections[0]);
    }
  }, [sections, currentSection]);

  const areCoreSectionsComplete = () => {
    if (aboutMeFields.length === 0) return false;
    return aboutMeFields.every(field => {
      const value = responses[field.field_key];

      if (field.field_type === 'triple') {
        if (!Array.isArray(value)) return false;
        return value.every(v => strFor(v) !== '');
      }

      if (field.field_type === 'double') {
        if (!Array.isArray(value)) return false;
        return value.every(v => strFor(v) !== '');
      }

      return strFor(value) !== '';
    });
  };

  const isSummaryComplete = () => {
    const summary = responses['summary'] as any;
    if (!summary) return false;

    if (summaryQuestions.length > 0) {
      return summaryQuestions.every((_, i) => (summary[`question${i + 1}`] || '').trim() !== '');
    }

    return ['question1', 'question2', 'question3'].every(q => (summary[q] || '').trim() !== '');
  };

  const getProgressPercentage = () => {
    if (aboutMeFields.length === 0) return 0;

    const sCount = summaryQuestions.length > 0 ? summaryQuestions.length : 3;
    const total = aboutMeFields.length + sCount;

    const answeredCore = aboutMeFields.filter(field => {
      const value = responses[field.field_key];
      if (Array.isArray(value)) {
        return value.some(v => (v || '').trim() !== '');
      }
      return strFor(value) !== '';
    }).length;

    const summary = responses['summary'] as any;
    let answeredSummary = 0;

    if (summaryQuestions.length > 0) {
      answeredSummary = summaryQuestions.filter((_, i) =>
        summary && (summary[`question${i + 1}`] || '').trim() !== ''
      ).length;
    } else {
      answeredSummary = ['question1', 'question2', 'question3'].filter(q =>
        summary && (summary[q] || '').trim() !== ''
      ).length;
    }

    return ((answeredCore + answeredSummary) / total) * 100;
  };

  const setField = (key: string, value: any) => {
    setResponses(prev => ({ ...prev, [key]: value }));
  };

  const strFor = (v: any) => {
    if (v === null || v === undefined) return '';
    return String(v).trim();
  };

  const canSubmit = () => {
    if (readOnlyView) return false;
    if (aboutMeFields.length === 0) return false;

    // 1. Check core sections
    const coreComplete = aboutMeFields.every(field => {
      const value = responses[field.field_key];

      if (field.field_type === 'triple') {
        if (!Array.isArray(value)) return false;
        return value.every(v => strFor(v) !== '');
      }

      if (field.field_type === 'double') {
        if (!Array.isArray(value)) return false;
        return value.every(v => strFor(v) !== '');
      }

      return strFor(value) !== '';
    });

    if (!coreComplete) return false;

    // 2. Check summary section
    return isSummaryComplete();
  };

  const studentIdPromise = useMemo(async () => {
    if (!userProfile) return null;
    if (userProfile.studentProfile?.id) return userProfile.studentProfile.id as string;
    const { data } = await supabase.from('students').select('id').eq('user_id', userProfile.id).maybeSingle();
    return data?.id || null;
  }, [userProfile]);

  // Helper function to get student ID
  const getStudentId = async () => {
    if (!userProfile) return null;
    if (userProfile.studentProfile?.id) return userProfile.studentProfile.id as string;
    const { data } = await supabase.from('students').select('id').eq('user_id', userProfile.id).maybeSingle();
    return data?.id || null;
  };

  // Check if assessment is unlocked (only for non-read-only views)
  useEffect(() => {
    const checkUnlock = async () => {
      // Skip check if in read-only mode (teachers viewing completed assessments)
      if (readOnlyView) return;

      // Skip if no user profile
      if (!userProfile) return;

      const studentId = await getStudentId();
      if (!studentId) return;

      const unlockResult = await checkAssessmentUnlock(studentId, 'about_me');

      if (!unlockResult.isUnlocked) {
        toast({
          title: lang === 'kn' ? 'ಮೌಲ್ಯಮಾಪನ ಲಾಕ್ ಮಾಡಲಾಗಿದೆ' : lang === 'ta' ? 'செயல் பூட்டப்பட்டுள்ளது' : lang === 'hi' ? 'मूल्यांकन लॉक है' : 'Assessment Locked',
          description: lang === 'kn'
            ? `ದಯವಿಟ್ಟು ಮೊದಲು "${unlockResult.missingPrerequisites.join(', ')}" ಪೂರ್ಣಗೊಳಿಸಿ.`
            : lang === 'ta'
              ? `"${unlockResult.missingPrerequisites.join(', ')}" செயல்களை முதலில் முடித்தால் இந்த பகுதி திறக்கும்.`
              : lang === 'hi'
                ? `कृपया पहले "${unlockResult.missingPrerequisites.join(', ')}" पूरा करें।`
                : `Please complete "${unlockResult.missingPrerequisites.join(', ')}" first.`,
          variant: 'destructive',
        });
        navigate('/student');
      }
    };

    checkUnlock();
  }, [readOnlyView, userProfile, navigate, toast, lang]);

  // Load About Me fields from database using lang-aware RPC (fallback to base RPC)
  useEffect(() => {
    const loadFields = async () => {
      try {
        logger.log('🔄 Loading About Me fields from database...');
        let rows: any[] | null = null;
        try {
          const { data: i18nData } = await supabase.rpc('get_about_me_fields_i18n', { p_lang: lang } as any);
          if (Array.isArray(i18nData)) rows = i18nData as any[];
          if (i18nData && !Array.isArray(i18nData)) rows = (i18nData as any) as any[]; // in case PostgREST returns jsonb
          if (rows && typeof rows === 'object' && !Array.isArray(rows)) {
            // some postgrest versions wrap jsonb in { data: ... }
            const maybe = (rows as any).data;
            if (Array.isArray(maybe)) rows = maybe;
          }
        } catch { }

        if (!rows) {
          const { data, error } = await supabase.rpc('get_about_me_fields');
          if (error) {
            handleDatabaseError(error, 'AboutMeAssessment - Fields');
            throw error;
          }
          rows = data as any[];
        }

        if (validateApiResponse(rows, 'AboutMeAssessment - Fields')) {
          logger.log('✅ Database fields loaded:', (rows as any[]).length, 'fields');
          const fields = rows as AboutMeField[];
          setAboutMeFields(fields);
          // Initialize responses with database fields
          const initialResponses = initializeResponses(fields);
          setResponses(prev => ({ ...prev, ...initialResponses }));
        } else {
          logger.log('⚠️ No fields found in database, using fallback');
        }
      } catch (error) {
        handleDatabaseError(error, 'AboutMeAssessment - Fields');
        logger.log('🔄 Using hardcoded fallback fields');
      }
    };

    loadFields();
  }, [lang]);

  // Auto-select summary tab from URL param — only in read-only view to prevent bypassing lock for in-progress assessments
  useEffect(() => {
    if (tabParam === 'summary' && readOnlyView && aboutMeFields.length > 0) {
      setCurrentSection('Summary');
    }
  }, [tabParam, readOnlyView, aboutMeFields]);

  // Load localized help text overrides from content_translations (about_me_help)
  const [dbTitle, setDbTitle] = useState<string>('');
  const [dbIntro, setDbIntro] = useState<string>('');
  const [dbSummaryTitle, setDbSummaryTitle] = useState<string | null>(null);
  const [dbSectionATitle, setDbSectionATitle] = useState<string | null>(null);
  const [dbSectionBTitle, setDbSectionBTitle] = useState<string | null>(null);
  const [dbSectionCTitle, setDbSectionCTitle] = useState<string | null>(null);
  const [dbSectionDTitle, setDbSectionDTitle] = useState<string | null>(null);

  useEffect(() => {
    const loadSummaryQuestions = async () => {
      try {
        const { data, error } = await supabase.rpc('get_about_me_summary_questions_i18n', { p_lang: lang });
        if (error) throw error;
        if (data && Array.isArray(data)) {
          setSummaryQuestions(data);
          // Update responses to include these questions if missing
          setResponses(prev => {
            const summary = { ...(prev.summary as any || {}) };
            let changed = false;
            data.forEach((_, i) => {
              if (summary[`question${i + 1}`] === undefined) {
                summary[`question${i + 1}`] = '';
                changed = true;
              }
            });
            if (changed) return { ...prev, summary };
            return prev;
          });
        }
      } catch (err) {
        logger.error('Error loading about me summary questions:', err);
      }
    };
    loadSummaryQuestions();
  }, [lang]);

  useEffect(() => {
    const loadHelpTranslations = async () => {
      try {
        // Fetch help text
        if (aboutMeFields.length) {
          const keys = aboutMeFields.map(f => f.field_key);
          const map = await fetchTranslations('about_me_help', keys, lang);
          setHelpTranslations(map);
        }

        // Fetch Module Content
        const { data: moduleData } = await supabase
          .from('content_translations')
          .select('resource_key, text')
          .eq('resource_type', 'about_me_module')
          .eq('lang', lang)
          .in('resource_key', ['title', 'intro', 'summary_title', 'section_a_title', 'section_b_title', 'section_c_title', 'section_d_title']);

        if (moduleData) {
          const tTitle = moduleData.find(i => i.resource_key === 'title')?.text;
          const tIntro = moduleData.find(i => i.resource_key === 'intro')?.text;

          if (tTitle) setDbTitle(tTitle);
          if (tIntro) setDbIntro(tIntro);
          const tSummary = moduleData.find(i => i.resource_key === 'summary_title')?.text;
          if (tSummary) setDbSummaryTitle(tSummary);

          const tSecA = moduleData.find(i => i.resource_key === 'section_a_title')?.text;
          const tSecB = moduleData.find(i => i.resource_key === 'section_b_title')?.text;
          const tSecC = moduleData.find(i => i.resource_key === 'section_c_title')?.text;
          const tSecD = moduleData.find(i => i.resource_key === 'section_d_title')?.text;
          if (tSecA) setDbSectionATitle(tSecA);
          if (tSecB) setDbSectionBTitle(tSecB);
          if (tSecC) setDbSectionCTitle(tSecC);
          if (tSecD) setDbSectionDTitle(tSecD);
        }

      } catch (error) {
        logger.warn('AboutMeAssessment: failed to load translations', error);
        setHelpTranslations({});
      }
    };

    loadHelpTranslations();
  }, [aboutMeFields, lang]);

  // Keep URL ?lang in sync without re-rendering
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const current = url.searchParams.get('lang');
      if (current !== lang) {
        url.searchParams.set('lang', lang);
        const next = `${url.pathname}?${url.searchParams.toString()}${url.hash}`;
        const now = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (next !== now) window.history.replaceState(window.history.state, '', next);
      }
    } catch { }
  }, [lang]);

  useEffect(() => {
    const load = async () => {
      if (!userProfile || aboutMeFields.length === 0) return setLoading(false);
      const studentId = await studentIdPromise;
      if (!studentId) return setLoading(false);

      const { data } = await supabase
        .from('assessment_responses')
        .select('responses, completed_at')
        .eq('student_id', studentId)
        // Support both new and legacy records
        .in('assessment_type', ['about_me', 'personality'] as any)
        .eq('assessment_title', 'About Me')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.responses) {
        const saved = data.responses as any;
        const initialResponses = initializeResponses(aboutMeFields);

        // Merge saved responses, handling both new (field_key) and old (questionN) formats
        aboutMeFields.forEach((field) => {
          const byKey = saved[field.field_key];
          const bySeq =
            field.sequence_number != null
              ? saved[`question${field.sequence_number}`]
              : undefined;

          let value: any =
            byKey !== undefined && byKey !== null && byKey !== ''
              ? byKey
              : bySeq;

          if (value === undefined || value === null || value === '') {
            return;
          }

          if (field.field_type === 'triple') {
            if (Array.isArray(value)) {
              initialResponses[field.field_key] = [...value] as Triple;
            } else if (typeof value === 'string') {
              // Map legacy single-string answer into first slot
              initialResponses[field.field_key] = [value, '', ''] as Triple;
            }
          } else if (field.field_type === 'double') {
            if (Array.isArray(value)) {
              initialResponses[field.field_key] = [...value] as Double;
            } else if (typeof value === 'string') {
              initialResponses[field.field_key] = [value, ''] as Double;
            }
          } else {
            initialResponses[field.field_key] = String(value);
          }
        });

        // Restore saved summary responses if they exist
        if (saved.summary) {
          initialResponses.summary = { ...saved.summary };
        }

        setResponses(initialResponses);
        if (data.completed_at) {
          setIsCompleted(true);
        }
      }

      setLoading(false);
    };
    load();
  }, [userProfile, studentIdPromise, aboutMeFields]);

  // Expose debug information for browser console inspection
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        (window as any).__aboutMeDebug = {
          responses,
          aboutMeFields,
          readOnlyView,
          isCompleted,
          currentSection,
        };
      }
    } catch {
      // Ignore if window is not available
    }
  }, [responses, aboutMeFields, readOnlyView, isCompleted, currentSection]);

  // Auto-save drafts on changes (debounced)
  useEffect(() => {
    if (loading || isCompleted || readOnlyView || aboutMeFields.length === 0) return;
    const studentId = userProfile?.studentProfile?.id;
    if (!studentId) return;
    const timer = setTimeout(async () => {
      await supabase.from('assessment_responses').upsert({
        student_id: studentId,
        assessment_type: 'about_me',
        responses,
        completed_at: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id,assessment_type' });
    }, 800);
    return () => clearTimeout(timer);
  }, [responses, loading, isCompleted, readOnlyView, aboutMeFields]);

  const save = async (complete: boolean) => {
    if (readOnlyView) return;
    if (!userProfile) return;
    const studentId = await studentIdPromise;
    if (!studentId) return;
    
    if (!validateResponses(responses)) {
      toast({
        title: lang === 'kn' ? 'ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ' : lang === 'ta' ? 'சேமிக்க இயலவில்லை' : lang === 'hi' ? 'सहेजने में विफल' : 'Validation Error',
        description: "Answers should be entered only in English.",
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        student_id: studentId,
        assessment_type: 'about_me',
        assessment_title: 'About Me',
        responses,
        completed_at: complete ? new Date().toISOString() : null
      } as any;
      const { data: assessmentData, error } = await supabase
        .from('assessment_responses')
        .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: 'student_id,assessment_type' })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: complete
          ? (lang === 'kn' ? 'ಮೌಲ್ಯಮಾಪನವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ' : lang === 'ta' ? 'மதிப்பீடு வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது' : lang === 'hi' ? 'मूल्यांकन सफलतापूर्वक जमा किया गया' : 'Assessment submitted successfully')
          : (lang === 'kn' ? 'ಪ್ರಗತಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ' : lang === 'ta' ? 'முன்னேற்றம் வெற்றிகரமாக சேமிக்கப்பட்டது' : lang === 'hi' ? 'प्रगति सफलतापूर्वक सहेजी गई' : 'Progress saved successfully'),
      });

      if (complete) {
        if (aiSummaryService.isConfigured() && assessmentData?.id) {
          void (async () => {
            try {
              const summaryResult = await aiSummaryService.generateAboutMeSummary(responses, lang);
              if (summaryResult.success && summaryResult.summary) {
                await summaryDatabaseService.createAISummary(assessmentData.id, summaryResult.summary, userProfile.id);
              } else if (!summaryResult.success) {
                setTimeout(async () => {
                  try {
                    const retryResult = await aiSummaryService.generateAboutMeSummary(responses, lang);
                    if (retryResult.success && retryResult.summary) {
                      await summaryDatabaseService.createAISummary(assessmentData.id, retryResult.summary, userProfile.id);
                    }
                  } catch (e) { logger.warn('Summary retry failed (about_me):', e); }
                }, 5000);
              }
            } catch (e) { logger.warn('Summary generation failed (about_me):', e); }
          })();
        }
        aiSummaryService.generateAndCacheProfileCardKeywords('about_me', responses, userProfile.id, lang);
        setIsCompleted(true);
      }
    } catch (e) {
      logger.error('Error saving:', e);
      toast({ title: lang === 'kn' ? 'ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ' : lang === 'ta' ? 'சேமிக்க இயலவில்லை' : lang === 'hi' ? 'सहेजने में विफल' : 'Error', description: lang === 'kn' ? 'ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.' : lang === 'ta' ? 'மீண்டும் முயற்சிக்கவும்.' : lang === 'hi' ? 'कृपया पुनः प्रयास करें।' : 'Unable to save. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (isCompleted && !readOnlyView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-0 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <User className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-blue-800">{t('aboutMeCompleted')}</CardTitle>
              <CardDescription className="text-blue-600">
                {t('aboutMeCompletedDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  {lang === 'kn'
                    ? 'ನನ್ನ ಬಗ್ಗೆ ಮೌಲ್ಯಮಾಪನವನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಯೋಚನೆಗಳನ್ನು ಉಳಿಸಲಾಗಿದೆ ಮತ್ತು ನಿಮ್ಮ ಶಿಕ್ಷಕರು ಈಗ ನಿಮ್ಮ ವೃತ್ತಿ ಪ್ರಯಾಣದಲ್ಲಿ ಸಹಾಯ ಮಾಡಲು ಅವುಗಳನ್ನು ವಿಮರ್ಶೆ ಮಾಡಬಹುದು.'
                    : lang === 'ta'
                      ? '"என்னைப் பற்றி" மதிப்பீட்டை நிறைவு செய்ததற்கு நன்றி! உங்கள் பதில்கள் சேமிக்கப்பட்டுள்ளன, உங்கள் ஆசிரியர் உங்கள் தொழில் பயணத்தில் வழிகாட்ட அவற்றை மதிப்பாய்வு செய்வார்.'
                      : lang === 'hi'
                        ? '"मेरे बारे में" मूल्यांकन पूरा करने के लिए धन्यवाद! आपके विचार सहेजे गए हैं और आपके शिक्षक अब आपके करियर की यात्रा में मार्गदर्शन करने के लिए उनकी समीक्षा कर सकते हैं।'
                        : 'Thank you for completing the About Me assessment! Your reflections have been saved and your teacher can now review them to help guide your career journey.'}
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      if (!params.get('lang') && lang) {
                        params.set('lang', lang);
                      }
                      params.set('readonly', '1');
                      navigate(`/student/assessment/about-me?${params.toString()}`);
                    }}
                  >
                    {lang === 'kn' ? 'ನನ್ನ ಉತ್ತರಗಳನ್ನು ವೀಕ್ಷಿಸಿ' : lang === 'ta' ? 'என் பதில்களை பார்' : lang === 'hi' ? 'मेरे उत्तर देखें' : 'View My Answers'}
                  </Button>
                  <Button
                    onClick={() => navigate('/student')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {lang === 'kn' ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ' : lang === 'ta' ? 'முதல் பக்கத்திற்கு போ' : lang === 'hi' ? 'डैशबोर्ड पर वापस' : 'Back to Dashboard'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    const loadingText =
      lang === 'kn'
        ? '"ನನ್ನ ಬಗ್ಗೆ" ಮೌಲ್ಯಮಾಪನವನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...'
        : lang === 'ta'
          ? '"என்னைப் பற்றி" மதிப்பீடு ஏற்றப்படுகிறது...'
          : lang === 'hi'
            ? '"मेरे बारे में" लोड हो रहा है...'
            : 'Loading About Me...';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">{loadingText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8" lang={lang} dir="auto">
      <div className="container mx-auto px-4">
        {/* Header - match My Dreams */}
        <div className="text-center mb-8">
          <div className="text-left mb-2">
            <Button variant="ghost" onClick={() => navigate('/student')} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2" />{t('backToDashboard')}
            </Button>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-blue-800 mb-2">🧑 {dbTitle || t('aboutMeTitle')}</h1>
          <p className="text-blue-600 text-sm md:text-lg whitespace-pre-wrap">
            {dbIntro || t('aboutMeIntro')}
          </p>
        </div>

        {/* Progress Bar - match style */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{t('yourProgress')}</h2>
              <Badge variant="secondary">{Math.round(getProgressPercentage())}% {t('completeSuffix')}</Badge>
            </div>
            <Progress value={getProgressPercentage()} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>{lang === 'kn' ? 'ಒಂದೇ ಮಾಡ್ಯೂಲ್' : lang === 'ta' ? 'ஒற்றை தொகுதி' : lang === 'hi' ? 'एकल मॉड्यूल' : 'Single module'}</span>
              <span>{Math.round(getProgressPercentage())}% {t('completeSuffix')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 space-y-6">

            {/* Section Tabs */}
            {sections.length > 0 && (
              <div className="w-full">
                <div className="flex flex-wrap gap-2 mb-6">
                  {sections.map((sectionTitle) => {
                    const isSummary = sectionTitle === 'Summary';
                    const sectionLetter = sectionTitle.match(/^([A-D])\./)?.[1] || (isSummary ? '' : sectionTitle.charAt(0));
                    const isCurrent = currentSection === sectionTitle;

                    // Check if core sections are complete for Summary tab
                    const isLocked = isSummary && !readOnlyView && !loading && !areCoreSectionsComplete();

                    return (
                      <Button
                        key={sectionTitle}
                        variant={isCurrent ? "default" : "outline"}
                        size="sm"
                        onClick={() => !isLocked && setCurrentSection(sectionTitle)}
                        className={`${isCurrent ? "bg-blue-600" : "text-blue-600 border-blue-200 hover:bg-blue-50"}
                          ${isLocked ? "opacity-60 cursor-not-allowed" : ""} border-blue-400`}
                        disabled={isLocked && !readOnlyView}
                      >
                        {isSummary ? (
                          <div className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-yellow-500" />
                            {t('summary')}
                            {isSummaryComplete() && <CheckCircle className="w-3 h-3 text-green-500 ml-1" />}
                            {isLocked && <Lock className="w-3 h-3 ml-1 opacity-70" />}
                          </div>
                        ) : (
                          sectionLetter
                        )}
                      </Button>
                    );
                  })}
                </div>

                {/* Tab Contents */}
                {sections.map((sectionTitle) => {
                  if (sectionTitle !== currentSection) return null;

                  if (sectionTitle === 'Summary') {
                    const summaryData = (responses['summary'] as any) || {};
                    return (
                      <div key="summary-section" className="space-y-6 mt-0 animate-in fade-in duration-300">
                        <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                          <h3 className="text-xl font-bold text-blue-800">
                            {dbSummaryTitle || (lang === 'kn' ? 'ಸಾರಾಂಶ' : lang === 'ta' ? 'சுருக்கம்' : lang === 'hi' ? 'सारांश' : 'Summary')}
                          </h3>
                          <p className="text-blue-600 text-sm mt-1">
                            {lang === 'kn' ? 'ಸಾರಾಂಶದ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ' : lang === 'ta' ? 'சுருக்கமான கேள்விகளுக்கு பதிலளிக்கவும்' : lang === 'hi' ? 'कृपया इन अंतिम सारांश प्रश्नों का उत्तर दें' : 'Please answer these final summary questions'}
                          </p>
                        </div>

                        <div className="space-y-6">
                          {summaryQuestions.length > 0 ? (
                            summaryQuestions.map((sq, index) => {
                              const qKey = `question${index + 1}`;
                              return (
                                <div key={sq.id || qKey} className="space-y-2">
                                  {sq.section_header && (
                                    <div className="mb-4 pb-2 border-b border-gray-100">
                                      <h4 className="text-md font-semibold text-blue-700">{sq.section_header}</h4>
                                    </div>
                                  )}
                                  <label className="block text-base font-medium text-gray-800">
                                    {index + 1}. {sq.question_text}
                                    <span className="text-red-500 ml-1">*</span>
                                  </label>
                                  <Textarea
                                    placeholder={sq.help_text || sq.question_text || t('typeYourAnswerHere', 'Type your answer here...')}
                                    value={summaryData[qKey] || ''}
                                    onChange={(e) => {
                                      const newSummary = { ...summaryData, [qKey]: e.target.value };
                                      setResponses(prev => ({ ...prev, summary: newSummary }));
                                    }}
                                    readOnly={readOnlyView}
                                    rows={4}
                                    className={`text-base ${(summaryData[qKey] || '').trim() !== ''
                                      ? 'border-blue-200 focus:border-blue-400'
                                      : 'border-red-200 focus:border-red-400 bg-red-50'
                                      }`}
                                  />
                                </div>
                              );
                            })
                          ) : (
                            // Fallback to t() keys if DB fetch fails or is pending
                            ['question1', 'question2', 'question3'].map((qKey, index) => (
                              <div key={qKey} className="space-y-2">
                                {index === 0 && (
                                  <div className="mb-4 pb-2 border-b border-gray-100">
                                    <h4 className="text-md font-semibold text-blue-700">
                                      {lang === 'kn' ? 'ವೈಯಕ್ತಿಕ ಪ್ರೊಫೈಲ್ ಅಥವಾ ನಿಮ್ಮದೇ ವ್ಯಕ್ತಿಚಿತ್ರ ಸಿದ್ಧಪಡಿಸಿ...' :
                                        lang === 'ta' ? 'ஒரு தனிப்பட்ட சுயவிவரம் அல்லது உங்கள் சொந்த சுயப்படத்தை தயாரிக்கவும்...' :
                                          lang === 'hi' ? 'एक व्यक्तिगत प्रोफ़ाइल या अपना स्व-चित्र तैयार करें...' :
                                            'Prepare a personal profile or your own self-portrait...'}
                                    </h4>
                                  </div>
                                )}
                                <label className="block text-base font-medium text-gray-800">
                                  {index + 1}. {t(`aboutMeSummaryQ${index + 1}`)}
                                  <span className="text-red-500 ml-1">*</span>
                                </label>
                                <Textarea
                                  placeholder={t('typeYourAnswerHere', 'Type your answer here...')}
                                  value={summaryData[qKey] || ''}
                                  onChange={(e) => {
                                    const newSummary = { ...summaryData, [qKey]: e.target.value };
                                    setResponses(prev => ({ ...prev, summary: newSummary }));
                                  }}
                                  readOnly={readOnlyView}
                                  rows={4}
                                  className={`text-base ${(summaryData[qKey] || '').trim() !== ''
                                    ? 'border-blue-200 focus:border-blue-400'
                                    : 'border-red-200 focus:border-red-400 bg-red-50'
                                    }`}
                                />
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  }

                  const fields = fieldsBySection[sectionTitle] || [];
                  return (
                    <div key={sectionTitle} className="space-y-4 mt-0 animate-in fade-in duration-300">
                      <div className="mb-4 pb-3 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {sectionTitle.startsWith('A.') ? (dbSectionATitle || sectionTitle)
                            : sectionTitle.startsWith('B.') ? (dbSectionBTitle || sectionTitle)
                            : sectionTitle.startsWith('C.') ? (dbSectionCTitle || sectionTitle)
                            : sectionTitle.startsWith('D.') ? (dbSectionDTitle || sectionTitle)
                            : sectionTitle}
                        </h3>
                      </div>
                      {fields.map((field, index) => {
                        const fieldValue = responses[field.field_key];
                        const helpKey = field.field_key;
                        const isOpen = !!helpOpen[helpKey];

                        // Determine label - use question_text from database
                        const label = field.question_text?.startsWith(`${index + 1}. `)
                          ? field.question_text
                          : `${index + 1}. ${field.question_text}`;

                        // Use localized help text when available; otherwise fall back
                        // to the database help_text (usually English). When Tamil
                        // translations are added to `about_me_help`, they will
                        // automatically override the fallback.
                        const translatedHelp = helpTranslations[field.field_key];
                        const helpText =
                          translatedHelp !== undefined
                            ? translatedHelp
                            : (field.help_text || '');

                        if (field.field_type === 'triple') {
                          const tripleValue = (Array.isArray(fieldValue) && fieldValue.length === 3)
                            ? fieldValue as Triple
                            : ['', '', ''] as Triple;
                          return (
                            <TripleInput
                              key={field.field_key}
                              label={label}
                              help={helpText}
                              helpKey={helpKey}
                              open={isOpen}
                              onToggle={() => toggleHelp(helpKey)}
                              values={tripleValue}
                              onChange={(vals) => setField(field.field_key, vals)}
                              readOnly={readOnlyView}
                            />
                          );
                        } else if (field.field_type === 'double') {
                          const doubleValue = (Array.isArray(fieldValue) && fieldValue.length === 2)
                            ? fieldValue as Double
                            : ['', ''] as Double;
                          return (
                            <DoubleInput
                              key={field.field_key}
                              label={label}
                              help={helpText}
                              helpKey={helpKey}
                              open={isOpen}
                              onToggle={() => toggleHelp(helpKey)}
                              values={doubleValue}
                              onChange={(vals) => setField(field.field_key, vals)}
                              readOnly={readOnlyView}
                            />
                          );
                        } else {
                          // text or textarea
                          const stringValue = typeof fieldValue === 'string' ? fieldValue : '';
                          const isTextarea = field.field_type === 'textarea';
                          return (
                            <Question
                              key={field.field_key}
                              label={label}
                              help={helpText}
                              helpKey={helpKey}
                              open={isOpen}
                              onToggle={() => toggleHelp(helpKey)}
                              value={stringValue}
                              onChange={(v) => setField(field.field_key, v)}
                              area={isTextarea}
                              readOnly={readOnlyView}
                            />
                          );
                        }
                      })}
                    </div>
                  );
                })}
              </div>
            )
            }


            <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-8 pt-4 border-t border-gray-200 gap-4 sm:gap-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}>
              <Button
                variant="outline"
                onClick={() => {
                  const idx = sections.indexOf(currentSection);
                  if (idx > 0) setCurrentSection(sections[idx - 1]);
                }}
                disabled={sections.indexOf(currentSection) === 0}
                className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                {t('previous')}
              </Button>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => save(false)}
                  disabled={submitting}
                  className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('saveProgress')}
                </Button>

                {(() => {
                  const idx = sections.indexOf(currentSection);
                  const isLastContentSection = idx === sections.length - 2 && sections[sections.length - 1] === 'Summary';

                  if (isLastContentSection) {
                    return (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const nextSection = sections[idx + 1];
                          if (nextSection === 'Summary' && !areCoreSectionsComplete()) {
                            toast({
                              title: lang === 'kn' ? 'ಸಾರಾಂಶ ಲಾಕ್ ಆಗಿದೆ' : lang === 'ta' ? 'சுருக்கம் பூட்டப்பட்டுள்ளது' : lang === 'hi' ? 'सारांश लॉक है' : 'Summary Locked',
                              description: lang === 'kn'
                                ? 'ಸಾರಾಂಶವನ್ನು ವೀಕ್ಷಿಸಲು ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ.'
                                : lang === 'ta'
                                  ? 'சுருக்கத்தைப் பார்க்க அனைத்துக் கேள்விகளுக்கும் பதில் அளிக்கவும்.'
                                  : lang === 'hi'
                                    ? 'सारांश अनलॉक करने के लिए कृपया सभी मुख्य प्रश्नों का उत्तर दें।'
                                    : 'Please answer all core questions to unlock the summary.',
                              variant: 'destructive',
                            });
                            return;
                          }
                          setCurrentSection(nextSection);
                        }}
                        className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        {t('summary')}
                      </Button>
                    );
                  }

                  return idx < sections.length - 1 ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (idx < sections.length - 1) {
                          const nextSection = sections[idx + 1];
                          if (nextSection === 'Summary' && !areCoreSectionsComplete()) {
                            toast({
                              title: lang === 'kn' ? 'ಸಾರಾಂಶ ಲಾಕ್ ಆಗಿದೆ' : lang === 'ta' ? 'சுருக்கம் பூட்டப்பட்டுள்ளது' : lang === 'hi' ? 'सारांश लॉक है' : 'Summary Locked',
                              description: lang === 'kn'
                                ? 'ಸಾರಾಂಶವನ್ನು ವೀಕ್ಷಿಸಲು ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ.'
                                : lang === 'ta'
                                  ? 'சுருக்கத்தைப் பார்க்க அனைத்துக் கேள்விகளுக்கும் பதில் அளிக்கவும்.'
                                  : lang === 'hi'
                                    ? 'सारांश अनलॉक करने के लिए कृपया सभी मुख्य प्रश्नों का उत्तर दें।'
                                    : 'Please answer all core questions to unlock the summary.',
                              variant: 'destructive',
                            });
                            return;
                          }
                          setCurrentSection(nextSection);
                        }
                      }}

                      className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      {t('next')}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => save(true)}
                      disabled={submitting || !canSubmit()}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                    >
                      {submitting ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>{lang === 'kn' ? 'ಸಲ್ಲಿಸುತ್ತಿದೆ...' : lang === 'ta' ? 'சமர்ப்பிக்கிறது...' : lang === 'hi' ? 'जमा किया जा रहा है...' : 'Submitting...'}</span>
                        </div>
                      ) : (
                        <>
                          <Badge className="w-4 h-4 mr-2 bg-transparent border-0 p-0"><CheckCircle className="w-4 h-4" /></Badge>
                          {t('submitAssessment')}
                        </>
                      )}
                    </Button>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-2 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
      <h3 className="text-lg font-semibold text-blue-800">{title}</h3>
      {subtitle && <p className="text-sm text-blue-600">{subtitle}</p>}
    </div>
  );
}

function Question({ label, help, value, onChange, area, helpKey, open, onToggle, readOnly }: { label: string; help: string; value: string; onChange: (v: string) => void; area?: boolean; helpKey: string; open: boolean; onToggle: () => void; readOnly?: boolean }) {
  const { lang } = useLang();
  const placeholder = lang === 'kn' ? 'ನಿಮ್ಮ ಉತ್ತರ ಬರೆಯಿರಿ...' : lang === 'ta' ? 'உங்கள் பதிலை எழுதுங்கள்...' : lang === 'hi' ? 'अपना उत्तर लिखें...' : 'Type your answer here...';
  return (
    <div>
      <label className="block text-base font-medium text-gray-800 mb-2 flex items-center gap-2">
        {label}
        <span className="text-red-500 text-sm ml-1">*</span>
        <button type="button" aria-label="Help" className="text-blue-600 hover:text-blue-700" onClick={onToggle}>💬</button>
      </label>
      {open && (
        <div className="mb-2 p-3 rounded border bg-blue-50 border-blue-200 text-sm text-blue-800">{help}</div>
      )}
      {area ? (
        <Textarea
          value={value}
          readOnly={readOnly}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v);
            if (open && v.trim().length > 0) onToggle();
          }}
          rows={4}
          placeholder={placeholder}
        />
      ) : (
        <Input
          value={value}
          readOnly={readOnly}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v);
            if (open && v.trim().length > 0) onToggle();
          }}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function TripleInput({ label, help, values, onChange, helpKey, open, onToggle, readOnly }: { label: string; help: string; values: Triple; onChange: (v: Triple) => void; helpKey: string; open: boolean; onToggle: () => void; readOnly?: boolean }) {
  const [a, b, c] = values;
  const { lang } = useLang();
  const p1 = lang === 'kn' ? 'ಉತ್ತರ 1' : lang === 'ta' ? 'பதில் 1' : lang === 'hi' ? 'उत्तर 1' : 'Answer 1';
  const p2 = lang === 'kn' ? 'ಉತ್ತರ 2' : lang === 'ta' ? 'பதில் 2' : lang === 'hi' ? 'उत्तर 2' : 'Answer 2';
  const p3 = lang === 'kn' ? 'ಉತ್ತರ 3' : lang === 'ta' ? 'பதில் 3' : lang === 'hi' ? 'उत्தर 3' : 'Answer 3';
  return (
    <div>
      <label className="block text-base font-medium text-gray-800 mb-2 flex items-center gap-2">
        {label}
        <span className="text-red-500 text-sm ml-1">*</span>
        <button type="button" aria-label="Help" className="text-blue-600 hover:text-blue-700" onClick={onToggle}>💬</button>
      </label>
      {open && (
        <div className="mb-2 p-3 rounded border bg-blue-50 border-blue-200 text-sm text-blue-800">{help}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input readOnly={readOnly} value={a} onChange={(e) => { const v = e.target.value; onChange([v, b, c]); if (open && v.trim().length > 0) onToggle(); }} placeholder={p1} />
        <Input readOnly={readOnly} value={b} onChange={(e) => { const v = e.target.value; onChange([a, v, c]); if (open && v.trim().length > 0) onToggle(); }} placeholder={p2} />
        <Input readOnly={readOnly} value={c} onChange={(e) => { const v = e.target.value; onChange([a, b, v]); if (open && v.trim().length > 0) onToggle(); }} placeholder={p3} />
      </div>
    </div>
  );
}

function DoubleInput({ label, help, values, onChange, helpKey, open, onToggle, readOnly }: { label: string; help: string; values: Double; onChange: (v: Double) => void; helpKey: string; open: boolean; onToggle: () => void; readOnly?: boolean }) {
  const [a, b] = values;
  const { lang } = useLang();
  const p1 = lang === 'kn' ? 'ಉತ್ತರ 1' : lang === 'ta' ? 'பதில் 1' : lang === 'hi' ? 'उत्तर 1' : 'Answer 1';
  const p2 = lang === 'kn' ? 'ಉತ್ತர 2' : lang === 'ta' ? 'பதில் 2' : lang === 'hi' ? 'उत्तर 2' : 'Answer 2';
  return (
    <div>
      <label className="block text-base font-medium text-gray-800 mb-2 flex items-center gap-2">
        {label}
        <span className="text-red-500 text-sm ml-1">*</span>
        <button type="button" aria-label="Help" className="text-blue-600 hover:text-blue-700" onClick={onToggle}>💬</button>
      </label>
      {open && (
        <div className="mb-2 p-3 rounded border bg-blue-50 border-blue-200 text-sm text-blue-800">{help}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input readOnly={readOnly} value={a} onChange={(e) => { const v = e.target.value; onChange([v, b]); if (open && v.trim().length > 0) onToggle(); }} placeholder={p1} />
        <Input readOnly={readOnly} value={b} onChange={(e) => { const v = e.target.value; onChange([a, v]); if (open && v.trim().length > 0) onToggle(); }} placeholder={p2} />
      </div>
    </div>
  );
}


