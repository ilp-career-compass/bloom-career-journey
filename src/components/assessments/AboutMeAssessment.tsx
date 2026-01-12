import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { handleDatabaseError, validateApiResponse } from '@/utils/errorHandler';
import { useLang } from '@/hooks/useLang';
import { KannadaKeyboard } from '@/components/ui/KannadaKeyboard';
import { checkAssessmentUnlock } from '@/utils/assessmentUnlock';
import { fetchTranslations } from '@/services/translationService';

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
  [field_key: string]: string | Triple | Double;
}

export default function AboutMeAssessment() {
  const { userProfile } = useAuth();
  const { t, lang } = useLang();
  const [searchParams] = useSearchParams();
  const readOnlyView = ['1', 'true'].includes((searchParams.get('readonly') || searchParams.get('view') || '').toLowerCase());
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
    return sectionsList;
  }, [fieldsBySection]);

  // Set initial current section when sections are loaded
  useEffect(() => {
    if (sections.length > 0 && !currentSection) {
      setCurrentSection(sections[0]);
    }
  }, [sections, currentSection]);

  const getProgressPercentage = () => {
    if (aboutMeFields.length === 0) return 0;
    const total = aboutMeFields.length;
    const answered = aboutMeFields.filter(field => {
      const value = responses[field.field_key];
      if (Array.isArray(value)) {
        return value.some(v => (v || '').trim() !== '');
      }
      return (value || '').trim() !== '';
    }).length;
    return total > 0 ? (answered / total) * 100 : 0;
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

    // Check if every required field has a value
    return aboutMeFields.every(field => {
      const value = responses[field.field_key];

      if (field.field_type === 'triple') {
        if (!Array.isArray(value)) return false;
        // For triple, check if at least one field is filled (or all? usually all slots for triple are placeholders, but usually just checking if some content exists is enough, but typically we want full completion)
        // Based on other assessments, usually we want strict non-empty. 
        // Let's assume strict: if triple, all 3 are fields.
        return value.every(v => strFor(v) !== '');
      }

      if (field.field_type === 'double') {
        if (!Array.isArray(value)) return false;
        return value.every(v => strFor(v) !== '');
      }

      return strFor(value) !== '';
    });
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
          title: lang === 'kn' ? 'ಮೌಲ್ಯಮಾಪನ ಲಾಕ್ ಮಾಡಲಾಗಿದೆ' : lang === 'ta' ? 'செயல் பூட்டப்பட்டுள்ளது' : 'Assessment Locked',
          description: lang === 'kn'
            ? `ದಯವಿಟ್ಟು ಮೊದಲು "${unlockResult.missingPrerequisites.join(', ')}" ಪೂರ್ಣಗೊಳಿಸಿ.`
            : lang === 'ta'
              ? `"${unlockResult.missingPrerequisites.join(', ')}" செயல்களை முதலில் முடித்தால் இந்த பகுதி திறக்கும்.`
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
        console.log('🔄 Loading About Me fields from database...');
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
          console.log('✅ Database fields loaded:', (rows as any[]).length, 'fields');
          const fields = rows as AboutMeField[];
          setAboutMeFields(fields);
          // Initialize responses with database fields
          const initialResponses = initializeResponses(fields);
          setResponses(prev => ({ ...prev, ...initialResponses }));
        } else {
          console.log('⚠️ No fields found in database, using fallback');
        }
      } catch (error) {
        handleDatabaseError(error, 'AboutMeAssessment - Fields');
        console.log('🔄 Using hardcoded fallback fields');
      }
    };

    loadFields();
  }, [lang]);

  // Load localized help text overrides from content_translations (about_me_help)
  useEffect(() => {
    const loadHelpTranslations = async () => {
      try {
        if (!aboutMeFields.length) {
          setHelpTranslations({});
          return;
        }
        const keys = aboutMeFields.map(f => f.field_key);
        const map = await fetchTranslations('about_me_help', keys, lang);
        setHelpTranslations(map);
      } catch (error) {
        console.warn('AboutMeAssessment: failed to load help translations', error);
        setHelpTranslations({});
      }
    };

    loadHelpTranslations();
  }, [aboutMeFields, lang]);

  // Localize section titles for display while keeping original section keys
  const getLocalizedSectionTitle = (sectionTitle: string) => {
    if (lang === 'kn') {
      if (sectionTitle.startsWith('A.')) return 'A. ನನ್ನ ವೈಯಕ್ತಿಕ ಸ್ಥಳ';
      if (sectionTitle.startsWith('B.')) return 'B. ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆಗಳು';
      if (sectionTitle.startsWith('C.')) return 'C. ನನಗೆ ಸವಾಲಾಗಿರುವ ಕೆಲಸಗಳು';
      if (sectionTitle.startsWith('D.')) return 'D. ನನ್ನ ಬಗ್ಗೆ ಇನ್ನಷ್ಟು ತಿಳಿದುಕೊಳ್ಳೋಣ';
      return sectionTitle;
    }
    if (lang === 'ta') {
      if (sectionTitle.startsWith('A.')) return 'A. என் தனிப்பட்ட இடம்';
      if (sectionTitle.startsWith('B.')) return 'B. நான் விரும்பும் செயல்கள்';
      if (sectionTitle.startsWith('C.')) return 'C. எனக்கு சிரமமாக இருக்கும் வேலைகள்';
      if (sectionTitle.startsWith('D.')) return 'D. என்னைப் பற்றி ஆழமாக அறிதல்';
      return sectionTitle;
    }
    return sectionTitle;
  };

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

  const save = async (complete: boolean) => {
    if (readOnlyView) return;
    if (!userProfile) return;
    const studentId = await studentIdPromise;
    if (!studentId) return;
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
        .upsert({ ...payload, updated_at: new Date().toISOString() })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: complete ? 'Submitted!' : 'Saved',
        description: complete ? 'About Me submitted successfully.' : 'Progress saved.'
      });

      if (complete) {
        setIsCompleted(true);

        // Generate AI summary in the background
        try {
          const { aiSummaryService } = await import('@/services/aiSummaryService');
          const summaryDatabaseService = (await import('@/services/summaryDatabaseService')).summaryDatabaseService;

          if (aiSummaryService.isConfigured() && assessmentData?.id) {
            console.log('🤖 Generating AI summary for About Me assessment:', assessmentData.id);
            const summaryResult = await aiSummaryService.generateAboutMeSummary(responses);

            if (summaryResult.success && summaryResult.summary) {
              // Save summary to database
              const saveResult = await summaryDatabaseService.createAISummary(
                assessmentData.id,
                summaryResult.summary,
                userProfile.id
              );

              if (saveResult.success) {
                console.log('✅ AI summary saved successfully:', saveResult.summaryId);
                toast({
                  title:
                    lang === 'kn'
                      ? 'ಸಾರಾಂಶ ಸಿದ್ಧವಾಗಿದೆ! 📝'
                      : lang === 'ta'
                        ? 'சுருக்கம் உருவாக்கப்பட்டது! 📝'
                        : 'Summary Generated! 📝',
                  description:
                    lang === 'kn'
                      ? 'ನಿಮ್ಮ “ನನ್ನ ಬಗ್ಗೆ” ಉತ್ತರಗಳ ಸಾರಾಂಶವನ್ನು ನಿಮ್ಮ ಶಿಕ್ಷಕರು ಪರಿಶೀಲಿಸಲಿದ್ದಾರೆ.'
                      : lang === 'ta'
                        ? 'உங்கள் “என்னைப் பற்றி” பதில்களின் சுருக்கத்தை உங்கள் ஆசிரியா் விரைவில் பார்வையிடுவார்.'
                        : 'Your teacher will review your reflection summary.',
                });

                // Notify teacher(s) assigned to this student
                try {
                  const { notificationService } = await import('@/services/notificationService');

                  // Find teacher(s) for this student
                  const studentId = await getStudentId();
                  if (studentId) {
                    const { data: studentRow } = await supabase
                      .from('students')
                      .select('teachers:teacher_id(user_id, users:user_id(full_name))')
                      .eq('id', studentId)
                      .maybeSingle();

                    const teacherUserId = (studentRow as any)?.teachers?.user_id;
                    if (teacherUserId) {
                      await notificationService.create({
                        userId: teacherUserId,
                        type: 'assessment_submitted',
                        title: `${userProfile?.full_name || 'Student'} completed About Me assessment`,
                        message: 'A new About Me assessment summary is ready for review.',
                        link: '/teacher/ai-summary-review'
                      });
                    }
                  }
                } catch (notifError) {
                  console.error('Error notifying teacher:', notifError);
                  // Don't fail the whole submission if notification fails
                }
              } else {
                console.error('Failed to save summary:', saveResult.error);
                toast({
                  title: "Summary Generation Issue",
                  description: "Your assessment is saved, but summary generation needs attention.",
                  variant: "destructive",
                });
              }
            } else {
              console.error('Failed to generate summary:', summaryResult.error);
              toast({
                title: "Summary Generation Issue",
                description: "Your assessment is saved. Summary will be generated later.",
                variant: "destructive",
              });
            }
          } else {
            console.warn('⚠️ Gemini API not configured, skipping summary generation');
          }
        } catch (summaryError) {
          console.error('Error in summary generation:', summaryError);
          // Don't show error to user - assessment is already saved
        }
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Unable to save. Please try again.', variant: 'destructive' });
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
                    {lang === 'kn' ? 'ನನ್ನ ಉತ್ತರಗಳನ್ನು ವೀಕ್ಷಿಸಿ' : lang === 'ta' ? 'என் பதில்களை பார்' : 'View My Answers'}
                  </Button>
                  <Button
                    onClick={() => navigate('/student')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {lang === 'kn' ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ' : lang === 'ta' ? 'முதல் பக்கத்திற்கு போ' : 'Back to Dashboard'}
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
          <h1 className="text-2xl md:text-3xl font-bold text-blue-800 mb-2">🧑 {t('aboutMeTitle')}</h1>
          <p className="text-blue-600 text-sm md:text-lg">
            {t('aboutMeIntro')}
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
              <span>{lang === 'kn' ? 'ಒಂದೇ ಮಾಡ್ಯೂಲ್' : 'Single module'}</span>
              <span>{Math.round(getProgressPercentage())}% {t('completeSuffix')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 space-y-6">

            {/* Section Tabs */}
            {sections.length > 0 && (
              <div className="w-full">
                <div className="flex flex-wrap gap-2 mb-6 justify-center">
                  {sections.map((sectionTitle) => {
                    const sectionLetter = sectionTitle.match(/^([A-D])\./)?.[1] || sectionTitle.charAt(0);
                    const isCurrent = currentSection === sectionTitle;
                    return (
                      <Button
                        key={sectionTitle}
                        variant={isCurrent ? "default" : "outline"}
                        onClick={() => setCurrentSection(sectionTitle)}
                        className={isCurrent ? "bg-blue-600" : "text-blue-600 border-blue-200 hover:bg-blue-50"}
                      >
                        {sectionLetter}
                      </Button>
                    );
                  })}
                </div>

                {/* Tab Contents */}
                {sections.map((sectionTitle) => {
                  if (sectionTitle !== currentSection) return null;
                  const fields = fieldsBySection[sectionTitle] || [];
                  return (
                    <div key={sectionTitle} className="space-y-4 mt-0 animate-in fade-in duration-300">
                      <div className="mb-4 pb-3 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {getLocalizedSectionTitle(sectionTitle)}
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
            )}


            <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-8 pt-4 border-t border-gray-200 gap-4 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  const idx = sections.indexOf(currentSection);
                  if (idx > 0) setCurrentSection(sections[idx - 1]);
                }}
                disabled={sections.indexOf(currentSection) === 0}
                className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                {lang === 'kn' ? 'ಹಿಂದಿನ ವಿಭಾಗ' : lang === 'ta' ? 'முந்தைய பிரிவு' : 'Previous Section'}
              </Button>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => save(false)}
                  disabled={submitting}
                  className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {lang === 'kn' ? 'ಪ್ರಗತಿಯನ್ನು ಉಳಿಸಿ' : lang === 'ta' ? 'முன்னேற்றத்தைச் சேமி' : 'Save Progress'}
                </Button>

                {sections.indexOf(currentSection) < sections.length - 1 ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const idx = sections.indexOf(currentSection);
                      if (idx < sections.length - 1) setCurrentSection(sections[idx + 1]);
                    }}
                    className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    {lang === 'kn' ? 'ಮುಂದಿನ ವಿಭಾಗ' : lang === 'ta' ? 'அடுத்த பிரிவு' : 'Next Section'}
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
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      <>
                        <Badge className="w-4 h-4 mr-2 bg-transparent border-0 p-0"><CheckCircle className="w-4 h-4" /></Badge>
                        {lang === 'kn' ? 'ಸಲ್ಲಿಸಿ' : lang === 'ta' ? 'சமர்ப்பிக்கவும்' : 'Submit Assessment'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <KannadaKeyboard lang={lang} />
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
  return (
    <div>
      <label className="block text-base font-medium text-gray-800 mb-2 flex items-center gap-2">
        {label}
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
          placeholder={help}
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
          placeholder={help}
        />
      )}
    </div>
  );
}

function TripleInput({ label, help, values, onChange, helpKey, open, onToggle, readOnly }: { label: string; help: string; values: Triple; onChange: (v: Triple) => void; helpKey: string; open: boolean; onToggle: () => void; readOnly?: boolean }) {
  const [a, b, c] = values;
  const { lang } = useLang();
  const p1 = lang === 'kn' ? 'ಉತ್ತರ 1' : lang === 'ta' ? 'பதில் 1' : 'Answer 1';
  const p2 = lang === 'kn' ? 'ಉತ್ತರ 2' : lang === 'ta' ? 'பதில் 2' : 'Answer 2';
  const p3 = lang === 'kn' ? 'ಉತ್ತರ 3' : lang === 'ta' ? 'பதில் 3' : 'Answer 3';
  return (
    <div>
      <label className="block text-base font-medium text-gray-800 mb-2 flex items-center gap-2">
        {label}
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
  const p1 = lang === 'kn' ? 'ಉತ್ತರ 1' : lang === 'ta' ? 'பதில் 1' : 'Answer 1';
  const p2 = lang === 'kn' ? 'ಉತ್ತರ 2' : lang === 'ta' ? 'பதில் 2' : 'Answer 2';
  return (
    <div>
      <label className="block text-base font-medium text-gray-800 mb-2 flex items-center gap-2">
        {label}
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


