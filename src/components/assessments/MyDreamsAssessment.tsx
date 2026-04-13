import { logger } from '@/lib/logger';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { aiSummaryService } from '@/services/aiSummaryService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  Star,
  Target,
  Heart,
  BookOpen,
  Music,
  MapPin,
  Palette,
  TrendingUp,
  AlertTriangle,
  Play,
  ExternalLink,
  Save,
  Lock,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import { fetchTranslations } from '@/services/translationService';

import { checkAssessmentUnlock } from '@/utils/assessmentUnlock';

interface DreamQuestion {
  id: string;
  section: string;
  question_text: string;
  help_text: string;
  sequence_number: number;
}

// Dynamic responses based on question IDs
interface DreamAssessmentResponse {
  [questionId: string]: string;
}

export default function MyDreamsAssessment() {
  const { userProfile } = useAuth();
  const { t, lang } = useLang();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dreamsQuestions, setDreamsQuestions] = useState<DreamQuestion[]>([]);
  const [responses, setResponses] = useState<DreamAssessmentResponse>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const viewParam = (searchParams.get('readonly') || searchParams.get('view') || '').toLowerCase();
  const readOnlyView = viewParam === '1' || viewParam === 'true';
  const tabParam = searchParams.get('tab');
  const isReadOnly = isCompleted || readOnlyView;
  const [currentSection, setCurrentSection] = useState<string>('section1');
  const [helpOpen, setHelpOpen] = useState<Record<string, boolean>>({});
  const toggleHelp = (k: string) => setHelpOpen(prev => ({ ...prev, [k]: !prev[k] }));
  const [saving, setSaving] = useState(false);

  // Summary questions state
  const [summaryQuestions, setSummaryQuestions] = useState<{ id: string, text: string }[]>([]);
  const [dbSummaryTitle, setDbSummaryTitle] = useState<string | null>(null);

  const saveProgress = async () => {
    if (isReadOnly) return;
    const studentId = await getStudentId();
    if (!studentId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('assessment_responses')
        .upsert({
          student_id: studentId,
          assessment_type: 'dreams',
          assessment_title: 'My Dreams',
          responses: responses,
          updated_at: new Date().toISOString(),
          completed_at: null
        }, { onConflict: 'student_id,assessment_type' });

      if (error) throw error;

      toast({
        title: lang === 'kn' ? 'ಪ್ರಗತಿಯನ್ನು ಉಳಿಸಲಾಗಿದೆ' : lang === 'ta' ? 'முன்னேற்றம் சேமிக்கப்பட்டது' : lang === 'hi' ? 'प्रगति सहेजी गई' : 'Progress Saved',
        description: lang === 'kn' ? 'ನಿಮ್ಮ ಉತ್ತರಗಳನ್ನು ಉಳಿಸಲಾಗಿದೆ.' : lang === 'ta' ? 'உங்கள் பதில்கள் சேமிக்கப்பட்டன.' : lang === 'hi' ? 'आपके उत्तर सहेजे गए हैं।' : 'Your answers have been saved.',
      });
    } catch (error) {
      logger.error('Error saving progress:', error);
      toast({
        title: lang === 'kn' ? 'ದೋಷ' : lang === 'ta' ? 'பிழை' : lang === 'hi' ? 'त्रुटि' : 'Error',
        description: lang === 'kn' ? 'ಪ್ರಗತಿ ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ.' : lang === 'ta' ? 'முன்னேற்றத்தை சேமிக்க முடியவில்லை.' : lang === 'hi' ? 'प्रगति सहेजने में विफल।' : 'Failed to save progress.',
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Debug helper: expose state in the browser console for troubleshooting
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        (window as any).__dreamsDebug = {
          responses,
          dreamsQuestions,
          readOnlyView,
          isCompleted,
          isReadOnly,
          currentSection,
        };
      }
    } catch {
      // ignore if window is not available
    }
  }, [responses, dreamsQuestions, readOnlyView, isCompleted, isReadOnly, currentSection]);

  // Helper function to get student ID
  const getStudentId = async () => {
    if (!userProfile) return null;
    if (userProfile.studentProfile?.id) return userProfile.studentProfile.id as string;
    const { data } = await supabase.from('students').select('id').eq('user_id', userProfile.id).maybeSingle();
    return data?.id || null;
  };

  // Check if assessment is unlocked
  useEffect(() => {
    const checkUnlock = async () => {
      if (!userProfile) return;

      const studentId = await getStudentId();
      if (!studentId) return;

      const unlockResult = await checkAssessmentUnlock(studentId, 'dreams');

      if (!unlockResult.isUnlocked) {
        toast({
          title: lang === 'kn' ? 'ಮೌಲ್ಯಮಾಪನ ಲಾಕ್ ಮಾಡಲಾಗಿದೆ' : lang === 'ta' ? 'செயல் பூட்டப்பட்டுள்ளது' : lang === 'hi' ? 'मूल्यांकन लॉक है' : 'Assessment Locked',
          description: lang === 'kn'
            ? `ದಾಯವಿಟ್ಟು ಮೊದಲು "${unlockResult.missingPrerequisites.join(', ')}" ಪೂರ್ಣಗೊಳಿಸಿ.`
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
  }, [userProfile, navigate, toast, lang]);

  // Group questions by section
  const questionsBySection = useMemo(() => {
    const grouped: { [section: string]: DreamQuestion[] } = {};
    dreamsQuestions.forEach(question => {
      if (!grouped[question.section]) {
        grouped[question.section] = [];
      }
      grouped[question.section].push(question);
    });
    return grouped;
  }, [dreamsQuestions]);

  const sections = useMemo(() => {
    const sectionsList = Object.keys(questionsBySection).sort((a, b) => {
      const order: { [key: string]: number } = { 'section1': 1, 'section2': 2, 'section3': 3, 'part1': 1, 'part2': 2 };
      return (order[a] || 99) - (order[b] || 99);
    });
    // Add Summary section at the end
    sectionsList.push('Summary');
    return sectionsList;
  }, [questionsBySection]);

  const [dbTitle, setDbTitle] = useState<string>('');
  const [dbQuote, setDbQuote] = useState<string>('');
  const [dbIntro, setDbIntro] = useState<string>('');

  // Fetch module content (title, quote, intro)
  useEffect(() => {
    const fetchModuleContent = async () => {
      try {
        const { data } = await supabase
          .from('content_translations')
          .select('resource_key, text')
          .eq('resource_type', 'dreams_module')
          .eq('lang', lang)
          .in('resource_key', ['title', 'quote', 'intro']);

        if (data) {
          const tTitle = data.find(i => i.resource_key === 'title')?.text;
          const tQuote = data.find(i => i.resource_key === 'quote')?.text;
          const tIntro = data.find(i => i.resource_key === 'intro')?.text;
          if (tTitle) setDbTitle(tTitle);
          if (tQuote) setDbQuote(tQuote);
          if (tIntro) setDbIntro(tIntro);
        }
      } catch (e) {
        logger.error('Error fetching module content:', e);
      }
    };
    fetchModuleContent();
  }, [lang]);

  // Load questions from database with i18n support
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        logger.log('🔄 Loading Dreams questions from database...');
        // First, get the full question structure
        const { data, error } = await supabase.rpc('get_dreams_questions');
        if (error) {
          logger.error('Error loading dreams questions:', error);
          return;
        }
        if (data && Array.isArray(data) && data.length > 0) {
          // Try to get translations for questions and help text
          let questionTranslations: Record<string, string> = {};
          let helpTranslations: Record<string, string> = {};
          try {
            // 1. Try generic RPC
            const { data: i18nData } = await supabase.rpc('get_dreams_questions_i18n', { p_lang: lang } as any);
            if (i18nData && Array.isArray(i18nData)) {
              i18nData.forEach((item: any) => {
                if (item?.key && item?.text) {
                  questionTranslations[item.key] = item.text;
                }
              });
            }

            // 2. Override with specific content_translations for questions
            const { data: qData } = await supabase
              .from('content_translations')
              .select('resource_key, text')
              .eq('resource_type', 'dreams_question')
              .eq('lang', lang);

            if (qData && Array.isArray(qData)) {
              qData.forEach((item: any) => {
                if (item?.resource_key && item?.text) {
                  questionTranslations[item.resource_key] = item.text;
                }
              });
            }

            // Fetch help text translations
            const { data: helpData } = await supabase
              .from('content_translations')
              .select('resource_key, text')
              .eq('resource_type', 'dreams_help')
              .eq('lang', lang);

            if (helpData && Array.isArray(helpData)) {
              helpData.forEach((item: any) => {
                if (item?.resource_key && item?.text) {
                  helpTranslations[item.resource_key] = item.text;
                }
              });
            }

            // Fetch summary questions specifically via RPC
            const { data: summaryData } = await supabase.rpc('get_dreams_summary_questions_i18n', { p_lang: lang } as any);
            if (summaryData && Array.isArray(summaryData)) {
              const formattedSummaryQuestions = summaryData.map((item: any, index: number) => ({
                id: `summary_q${item.sequence_number || index + 1}`,
                text: item.translated_text || item.question_text || ''
              }));
              setSummaryQuestions(formattedSummaryQuestions);
            }

            // Fetch summary title from content_translations
            const titleRows = await fetchTranslations('dreams_module', ['summary_title'], lang);
            const tTitle = titleRows.find(r => r.resource_key === 'summary_title')?.text;
            if (tTitle) setDbSummaryTitle(tTitle);
          } catch (e) {
            logger.warn('Could not load i18n translations, using default:', e);
          }

          // Apply translations to questions and help text
          const questionsWithTranslations = (data as DreamQuestion[]).map(q => {
            const questionNum = q.sequence_number;
            const translationKey = `question${questionNum}`;
            const translatedQuestion = questionTranslations[translationKey] || q.question_text;
            const translatedHelp = helpTranslations[translationKey] || q.help_text || '';
            return {
              ...q,
              question_text: translatedQuestion,
              help_text: translatedHelp
            };
          });

          logger.log('✅ Database questions loaded:', questionsWithTranslations.length, 'questions');
          setDreamsQuestions(questionsWithTranslations);
          // Initialize responses based on questions
          const initialResponses: DreamAssessmentResponse = {};
          questionsWithTranslations.forEach(q => {
            initialResponses[q.id] = '';
          });
          setResponses(prev => ({ ...prev, ...initialResponses }));

          // Set initial section
          const firstSection = questionsWithTranslations[0]?.section || 'section1';
          setCurrentSection(firstSection);
        }
      } catch (error) {
        logger.error('Error loading dreams questions:', error);
      }
    };
    loadQuestions();
  }, [lang]);

  // Auto-select summary tab from URL param
  useEffect(() => {
    if (tabParam === 'summary' && dreamsQuestions.length > 0) {
      setCurrentSection('Summary');
    }
  }, [tabParam, dreamsQuestions]);

  useEffect(() => {
    // Wait until both userProfile and questions are ready before loading saved responses
    if (!userProfile || dreamsQuestions.length === 0) return;
    checkExistingResponse();
  }, [userProfile, dreamsQuestions]);

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

  // Auto-save draft when responses change (debounced)
  useEffect(() => {
    if (loading || isReadOnly) return;
    const t = setTimeout(async () => {
      try {
        if (!userProfile?.id) return;
        // Resolve student_id
        let studentId = userProfile.studentProfile?.id as string | undefined;
        if (!studentId) {
          const { data: row } = await supabase.from('students').select('id').eq('user_id', userProfile.id).maybeSingle();
          studentId = row?.id;
        }
        if (!studentId) return;
        await supabase.from('assessment_responses').upsert({
          student_id: studentId,
          assessment_type: 'dreams',
          assessment_title: 'My Dreams',
          responses,
          updated_at: new Date().toISOString(),
          completed_at: null
        }, { onConflict: 'student_id,assessment_type' });
      } catch { }
    }, 800);
    return () => clearTimeout(t);
  }, [responses, loading, isReadOnly, userProfile]);

  const checkExistingResponse = async () => {
    // Resolve student_id from students table; do not fallback to users.id
    let studentId = userProfile.studentProfile?.id as string | undefined;
    if (!studentId) {
      const { data: studentRow } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userProfile.id)
        .maybeSingle();
      studentId = studentRow?.id;
    }

    if (!studentId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_type', 'dreams')
        // Prefer the most recently updated/completed record
        .order('updated_at', { ascending: false })
        .limit(1);

      const row = Array.isArray(data) && data.length > 0 ? data[0] : null;

      if (row && !error && row.responses) {
        let saved = row.responses as any;

        // Supabase may return jsonb as already-parsed object or as a JSON string
        if (typeof saved === 'string') {
          try {
            saved = JSON.parse(saved);
          } catch {
            logger.warn('⚠️ Failed to parse dreams responses JSON string, using raw value');
          }
        }
        const initialResponses: DreamAssessmentResponse = {};

        // Detect old DB structure: { part1: { question1: "...", ... }, part2: {...} }
        const hasPartStructure = Object.keys(saved || {}).some((key) =>
          key.startsWith('part')
        );

        if (hasPartStructure) {
          // Group questions by section so we can map partN.questionM -> question.id
          const questionsBySection: Record<string, DreamQuestion[]> = {};
          dreamsQuestions.forEach((q) => {
            const section = q.section || 'section1';
            if (!questionsBySection[section]) {
              questionsBySection[section] = [];
            }
            questionsBySection[section].push(q);
          });

          (['section1', 'section2', 'section3'] as const).forEach((sectionKey) => {
            const partKey = sectionKey.replace('section', 'part'); // section1 -> part1
            const partResponses = saved[partKey] || {};
            const sectionQuestions = questionsBySection[sectionKey] || [];

            // Sort questions in the order they were shown to the student
            const sortedQuestions = [...sectionQuestions].sort(
              (a, b) => (a.sequence_number || 0) - (b.sequence_number || 0)
            );

            sortedQuestions.forEach((question, index) => {
              const questionKey = `question${index + 1}`;
              const raw = partResponses[questionKey];
              if (typeof raw === 'string' && raw.trim()) {
                initialResponses[question.id] = raw;
              }
            });
          });
        } else {
          // New flat structure: { [questionId]: "answer", ... }
          dreamsQuestions.forEach((q) => {
            const byId = saved[q.id];
            const bySeq =
              q.sequence_number != null
                ? saved[`question${q.sequence_number}`]
                : undefined;
            const value = typeof byId === 'string' && byId.trim()
              ? byId
              : typeof bySeq === 'string'
                ? bySeq
                : '';
            initialResponses[q.id] = value;
          });
        }

        // Restore summary responses (summary_q1, summary_q2, etc.)
        Object.keys(saved).forEach((key) => {
          if (key.startsWith('summary_q') && typeof saved[key] === 'string') {
            initialResponses[key] = saved[key];
          }
        });

        setResponses((prev) => ({
          ...prev,
          ...initialResponses,
        }));

        if (row.completed_at) {
          setIsCompleted(true);
        }
      }
    } catch (error) {
      // No existing response found, which is fine
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const getProgressPercentage = () => {
    if (dreamsQuestions.length === 0) return 0;
    const totalQuestions = dreamsQuestions.length;
    const answeredQuestions = dreamsQuestions.filter(q => {
      const response = responses[q.id];
      return response && response.trim() !== '';
    }).length;
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const areCoreSectionsComplete = () => {
    if (dreamsQuestions.length === 0) return false;
    return dreamsQuestions.every(q => {
      const response = responses[q.id];
      return response && response.trim() !== '';
    });
  };

  const canSubmit = () => {
    if (isReadOnly) return false;
    return areCoreSectionsComplete();
  };

  const submitAssessment = async () => {
    if (isReadOnly) return;
    if (!userProfile) {
      toast({
        title: lang === 'kn' ? 'ದೋಷ' : lang === 'ta' ? 'பிழை' : lang === 'hi' ? 'त्रुटि' : 'Error',
        description: lang === 'kn' ? 'ಬಳಕೆದಾರ ಪ್ರೊಫೈಲ್ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಲಾಗಿನ್ ಮಾಡಿ.' : lang === 'ta' ? 'பயனர் சுயவிவரம் கிடைக்கவில்லை. மீண்டும் உள்நுழையவும்.' : lang === 'hi' ? 'उपयोगकर्ता प्रोफ़ाइल नहीं मिली। कृपया फिर से लॉगिन करें।' : 'User profile not found. Please try logging in again.',
        variant: "destructive",
      });
      return;
    }

    // Resolve student_id from students table; do not fallback to users.id
    let studentId = userProfile.studentProfile?.id as string | undefined;
    if (!studentId) {
      const { data: studentRow } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userProfile.id)
        .maybeSingle();
      studentId = studentRow?.id;
    }

    if (!studentId) {
      toast({
        title: lang === 'kn' ? 'ದೋಷ' : lang === 'ta' ? 'பிழை' : lang === 'hi' ? 'त्रुटि' : 'Error',
        description: lang === 'kn' ? 'ವಿದ್ಯಾರ್ಥಿ ಪ್ರೊಫೈಲ್ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಶಿಕ್ಷಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.' : lang === 'ta' ? 'மாணவர் சுயவிவரம் கிடைக்கவில்லை. உங்கள் ஆசிரியரை தொடர்பு கொள்ளவும்.' : lang === 'hi' ? 'छात्र प्रोफ़ाइल नहीं मिली। कृपया अपने शिक्षक से संपर्क करें।' : 'Student profile not found. Please contact your teacher or support.',
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Save assessment responses
      const { data: assessmentData, error } = await supabase
        .from('assessment_responses')
        .upsert({
          student_id: studentId,
          assessment_type: 'dreams',
          assessment_title: 'My Dreams',
          responses: responses,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,assessment_type' })
        .select()
        .single();

      if (error) throw error;

      toast({
        title:
          lang === 'kn'
            ? 'ಕನಸುಗಳ ಮೌಲ್ಯಮಾಪನ ಪೂರ್ಣಗೊಂಡಿದೆ! ⭐'
            : lang === 'ta'
              ? 'கனவுகள் மதிப்பீடு முடிந்தது! ⭐'
              : lang === 'hi'
                ? 'सपनों का मूल्यांकन पूर्ण! ⭐'
                : 'Dreams Assessment Completed! ⭐',
        description:
          lang === 'kn'
            ? 'ನಿಮ್ಮ ಕನಸುಗಳು ಮತ್ತು ಆಶಯಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಿಸಲಾಗಿದೆ.'
            : lang === 'ta'
              ? 'உங்கள் கனவுகளும் எதிர்கால ஆசைகளும் வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளன.'
              : lang === 'hi'
                ? 'आपके सपने और आकांक्षाएं सफलतापूर्वक दर्ज की गई हैं!'
                : 'Your dreams and aspirations have been captured successfully!',
      });

      aiSummaryService.generateAndCacheProfileCardKeywords('dreams', responses, userProfile.id, lang);
      setIsCompleted(true);
      setTimeout(() => navigate('/student/things-interest-me?from=dreams'), 2000);
    } catch (error) {
      logger.error('Error submitting assessment:', error);
      toast({
        title: lang === 'kn' ? 'ದೋಷ' : lang === 'ta' ? 'பிழை' : lang === 'hi' ? 'त्रुटि' : 'Error',
        description: lang === 'kn' ? 'ಮೌಲ್ಯಮಾಪನ ಸಲ್ಲಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.' : lang === 'ta' ? 'மதிப்பீடு சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.' : lang === 'hi' ? 'मूल्यांकन जमा करने में विफल। कृपया पुनः प्रयास करें।' : 'Failed to submit assessment. Please try again.',
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    const loadingText =
      lang === 'kn'
        ? 'ನಿಮ್ಮ ಕನಸುಗಳ ಮೌಲ್ಯಮಾಪನವನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...'
        : lang === 'ta'
          ? 'உங்கள் கனவுகள் மதிப்பீடு ஏற்றப்படுகிறது...'
          : lang === 'hi'
            ? 'आपका सपनों का मूल्यांकन लोड हो रहा है...'
            : 'Loading your dreams assessment...';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">{loadingText}</p>
        </div>
      </div>
    );
  }

  if (isCompleted && !readOnlyView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-0 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <Star className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-blue-800">
                {lang === 'kn'
                  ? 'ಕನಸುಗಳ ಮೌಲ್ಯಮಾಪನ ಪೂರ್ಣಗೊಂಡಿದೆ! 🌟'
                  : lang === 'ta'
                    ? 'கனவுகள் மதிப்பீடு முடிந்தது! 🌟'
                    : lang === 'hi'
                      ? 'सपनों का मूल्यांकन पूर्ण! 🌟'
                      : 'Dreams Assessment Completed! 🌟'}
              </CardTitle>
              <CardDescription className="text-blue-600">
                {lang === 'kn'
                  ? 'ನಿಮ್ಮ ಕನಸುಗಳು ಮತ್ತು ಆಶಯಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಹಂಚಿಕೊಂಡಿದ್ದೀರಿ.'
                  : lang === 'ta'
                    ? 'உங்கள் கனவுகளையும் எதிர்கால ஆசைகளையும் வெற்றிகரமாக பதிவு செய்துள்ளீர்கள்.'
                    : lang === 'hi'
                      ? 'आपके सपने और आकांक्षाएं सफलतापूर्वक दर्ज की गई हैं।'
                      : "You've successfully captured your dreams and aspirations"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  {lang === 'kn'
                    ? 'ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ಹಂಚಿಕೊಂಡದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಉತ್ತರಗಳು ಉಳಿಸಲ್ಪಟ್ಟಿವೆ ಮತ್ತು ಈಗ ನಿಮ್ಮ ಶಿಕ್ಷಕರು ಅವುಗಳನ್ನು ನೋಡಿ ನಿಮ್ಮ ಪ್ರಯಾಣಕ್ಕೆ ಮಾರ್ಗದರ್ಶನ ನೀಡಬಹುದು.'
                    : lang === 'ta'
                      ? 'உங்கள் கனவுகளை பகிர்ந்ததற்கு நன்றி! உங்கள் பதில்கள் சேமிக்கப்பட்டுள்ளன; இப்போது உங்கள் ஆசிரியா் அவற்றைப் பார்த்து உங்கள் பயணத்துக்கு வழிகாட்ட முடியும்.'
                      : lang === 'hi'
                        ? 'अपने सपने साझा करने के लिए धन्यवाद! आपके उत्तर सहेजे गए हैं और अब आपके शिक्षक आपकी यात्रा में मार्गदर्शन के लिए उनकी समीक्षा कर सकते हैं।'
                        : 'Thank you for sharing your dreams! Your responses have been saved and your teacher can now review them to help guide your journey.'}
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
                      navigate(`/student/assessment/dreams?${params.toString()}`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8" lang={lang} dir="auto">
      <div className="container mx-auto px-4">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/student')}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToDashboard')}
          </Button>
        </div>








        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-800 mb-4">
            {dbTitle || (lang === 'kn'
              ? '🌟 ನನ್ನ ಕನಸುಗಳ ಮೌಲ್ಯಮಾಪನ'
              : lang === 'ta'
                ? '🌟 என் கனவுகள் மதிப்பீடு'
                : lang === 'hi'
                  ? '🌟 मेरे सपनों का मूल्यांकन'
                  : '🌟 My Dreams Assessment')}
          </h1>

          {/* Quote Box */}
          <div className="max-w-3xl mx-auto mb-6 p-4 md:p-6 border-2 border-gray-800 rounded-lg bg-white">
            <p className="text-lg font-bold text-gray-900 mb-2">
              {dbQuote || (lang === 'kn'
                ? '”ನೀವು ನಿದ್ರಿಸುವಾಗ ಕಾಣುವದನ್ನು ಅಲ್ಲ ಕನಸು, ನಿಮ್ಮನ್ನು ನಿದ್ರಿಸದಂತೆ 만드는 ಆಲೋಚನೆಯೇ ನಿಜವಾದ ಕನಸು.”'
                : lang === 'ta'
                  ? '”நீங்கள் தூங்கும்போது காண்பது கனவு அல்ல; உங்களைத் தூங்க விடாமல் செய்யும் எண்ணங்களே உண்மையான கனவுகள்.”'
                  : lang === 'hi'
                    ? '”सपना वह नहीं जो आप सोते हुए देखते हैं, सपना वह है जो आपको सोने नहीं देता।”'
                    : '”Dream is not that which you see while sleeping, it is something that does not let you sleep”.')}
            </p>
            {!dbQuote && <p className="text-gray-700 italic">
              {lang === 'kn'
                ? 'ಡಾ. ಎ. ಪಿ. ಜೇ. ಅಬ್ದುಲ್ ಕಲಾಂ'
                : lang === 'ta'
                  ? 'டாக்டர் ஏ. பி. ஜே. அப்துல் கலாம்'
                  : lang === 'hi'
                    ? 'डॉ. ए. पी. जे. अब्दुल कलाम'
                    : 'By Dr. A. P. J. Abdul Kalam'}
            </p>}
          </div>

          {/* Description Text */}
          <div className="max-w-3xl mx-auto space-y-3 text-gray-700">
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {dbIntro || (lang === 'kn'
                ? 'ನಮ್ಮ ಭವಿಷ್ಯದ ಬಗ್ಗೆ ಪ್ರತಿಯೊಬ್ಬರಿಗೂ ಹಲವು ಕನಸುಗಳು ಇವೆ. ನಿಮ್ಮ ಕನಸುಗಳು ಯಾವುವು? ನಿಮಗೆ ಬಹಳ ಮುಖ್ಯವಾಗಿ ಅನಿಸುವ ಯಾವುದೇ ಗುರಿ ಅಥವಾ ಆಶೆ ಇದೆಯೇ?'
                : lang === 'ta'
                  ? 'நாம் ஒவ்வொருவரும் எங்கள் எதிர்காலத்தைப் பற்றி பல கனவுகளை வைத்திருக்கிறோம். உங்கள் கனவுகள் என்ன? உங்களுக்கு மிகவும் நெருக்கமாக உணரப்படும் ஒரு இலக்கு அல்லது ஆசை இருக்கிறதா?'
                  : lang === 'hi'
                    ? 'हम सभी अपने भविष्य के लिए सपने रखते हैं। आपके सपने क्या हैं? क्या कोई विशेष लक्ष्य या आकांक्षा है जो आपको प्रेरित करती है?'
                    : 'We all hold dreams for our future. What are your dreams? Is there a particular goal or aspiration that resonates strongly with you?')}
            </p>
            {!dbIntro && <p className="text-base leading-relaxed">
              {lang === 'kn'
                ? 'ಈ பகுತಿಯಲ್ಲಿ, ನಿಮ್ಮ ಕನಸುಗಳು ಮತ್ತು ಆಶೆಗಳ ಪ್ರಪಂಚವನ್ನು ನಿಧಾನವಾಗಿ ಅನ್ವೇಷಿಸೋಣ.'
                : lang === 'ta'
                  ? 'இந்த ஆராய்ச்சி பகுதியின் மூலம், உங்கள் கனவுகள் மற்றும் ஆசைகளின் உலகத்தை மெதுவாக ஆராயப் போகிறோம்.'
                  : lang === 'hi'
                    ? 'इस खोज भाग में, हम आपके सपनों और आकांक्षाओं की दुनिया को धीरे-धीरे जानेंगे।'
                    : "In this exploratory section, we'll uncover your world of dreams and aspirations."}
            </p>}
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{t('yourProgress')}</h2>
              <Badge variant="secondary">{Math.round(getProgressPercentage())}% {t('completeSuffix')}</Badge>
            </div>
            <Progress value={getProgressPercentage()} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>
                {lang === 'kn'
                  ? `ವಿಭಾಗ ${sections.indexOf(currentSection) + 1} / ${sections.length}`
                  : lang === 'ta'
                    ? `பகுதி ${sections.indexOf(currentSection) + 1} / ${sections.length}`
                    : lang === 'hi'
                      ? `भाग ${sections.indexOf(currentSection) + 1} / ${sections.length}`
                      : `Section ${sections.indexOf(currentSection) + 1} of ${sections.length}`}
              </span>
              <span>{Math.round(getProgressPercentage())}% {t('completeSuffix')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Section Navigation */}
        <div className="flex justify-center mb-6">
          <div className="flex flex-col md:flex-row bg-white rounded-lg p-1 shadow-md w-full md:w-auto">
            {sections.map((sectionKey, index) => {
              const sectionQuestions = questionsBySection[sectionKey] || [];
              const sectionNumber = index + 1;
              let sectionTitle = '';
              if (sectionKey === 'section1') {
                sectionTitle =
                  lang === 'kn'
                    ? 'ಭಾಗ 1: ನಿಮ್ಮ ಕನಸುಗಳು ಮತ್ತು ಭವಿಷ್ಯದ ಗುರಿಗಳು'
                    : lang === 'ta'
                      ? 'பகுதி 1: உங்கள் கனவுகள் மற்றும் எதிர்கால இலக்குகள்'
                      : lang === 'hi'
                        ? 'भाग 1: आपके सपने और भविष्य के लक्ष्य'
                        : 'Section 1: Your Dreams & Future Goals';
              } else if (sectionKey === 'section2') {
                sectionTitle =
                  lang === 'kn'
                    ? 'ಭಾಗ 2: ವೃತ್ತಿ ಮತ್ತು ಜೀವನದ ಆಶೆಗಳು'
                    : lang === 'ta'
                      ? 'பகுதி 2: தொழில் மற்றும் வாழ்க்கை ஆசைகள்'
                      : lang === 'hi'
                        ? 'भाग 2: करियर और जीवन की आकांक्षाएं'
                        : 'Section 2: Career & Life Aspirations';
              } else if (sectionKey === 'section3') {
                sectionTitle =
                  lang === 'kn'
                    ? 'ಭಾಗ 3: ಕನಸುಗಳನ್ನು ನಿಜವಾಗಿಸುವುದು'
                    : lang === 'ta'
                      ? 'பகுதி 3: கனவுகளை நனவாக்குதல்'
                      : lang === 'hi'
                        ? 'भाग 3: सपनों को साकार करना'
                        : 'Section 3: Making Dreams Reality';
              } else if (sectionKey === 'Summary') {
                sectionTitle =
                  lang === 'kn'
                    ? 'ಸಾರಾಂಶ'
                    : lang === 'ta'
                      ? 'சுருக்கம்'
                      : lang === 'hi'
                        ? 'सारांश'
                        : 'Summary';
              } else {
                sectionTitle =
                  lang === 'kn'
                    ? `ಭಾಗ ${sectionNumber}`
                    : lang === 'ta'
                      ? `பகுதி ${sectionNumber}`
                      : lang === 'hi'
                        ? `भाग ${sectionNumber}`
                        : `Section ${sectionNumber}`;
              }

              const isSummary = sectionKey === 'Summary';
              const isLocked = isSummary && !areCoreSectionsComplete();

              return (
                <button
                  key={sectionKey}
                  onClick={() => !isLocked && setCurrentSection(sectionKey)}
                  disabled={isLocked && !isReadOnly}
                  className={`px-6 py-2 rounded-md transition-all flex items-center gap-2 ${currentSection === sectionKey
                    ? 'bg-blue-600 text-white shadow-md'
                    : isLocked ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'
                    }`}
                >
                  {isSummary && <Sparkles className={`w-3 h-3 ${isLocked ? 'text-gray-400' : 'text-yellow-500'}`} />}
                  {sectionTitle}
                  {isSummary && isLocked && <Lock className="w-3 h-3 opacity-70" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamically render sections from database */}
        {sections.map((sectionKey) => {
          if (sectionKey === 'Summary') {
            return (
              <div key={sectionKey} style={{ display: currentSection === sectionKey ? 'block' : 'none' }}>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50">
                    <CardTitle className="text-xl text-teal-800">
                      {dbSummaryTitle || (lang === 'kn' ? 'ಸಾರಾಂಶ' : lang === 'ta' ? 'சுருக்கம்' : lang === 'hi' ? 'सारांश' : 'Summary')}
                    </CardTitle>
                    <CardDescription className="text-teal-600">
                      {lang === 'kn'
                        ? 'ಮುಖ್ಯವಾದ ವಿಷಯಗಳನ್ನು ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಬರೆಯಿರಿ'
                        : lang === 'ta'
                          ? 'முக்கியமான விஷயங்களை சுருக்கமாக எழுதுங்கள்'
                          : lang === 'hi'
                            ? 'अपने मुख्य बिंदुओं का सारांश लिखें'
                            : 'Summarize your key points'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {summaryQuestions.map((q) => (
                        <div key={q.id}>
                          <label className="block text-base font-medium text-gray-800 mb-2">
                            {q.text}<span className="text-red-500 text-sm ml-1">*</span>
                          </label>
                          <Textarea
                            value={responses[q.id] || ''}
                            onChange={(e) => handleResponseChange(q.id, e.target.value)}
                            readOnly={isReadOnly}
                            rows={4}
                            className={`text-base border-teal-200 focus:border-teal-400 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed opacity-80' : 'bg-white'}`}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          }

          const sectionQuestions = questionsBySection[sectionKey] || [];
          if (sectionQuestions.length === 0) return null;

          const sectionNumber = sections.indexOf(sectionKey) + 1;
          let sectionTitle = '';
          let sectionDescription = '';
          let headerColor = 'from-blue-50 to-indigo-50';
          let titleColor = 'text-blue-800';
          let descColor = 'text-blue-600';

          if (sectionKey === 'section1') {
            sectionTitle =
              lang === 'kn'
                ? 'ಭಾಗ 1: ನಿಮ್ಮ ಕನಸುಗಳು ಮತ್ತು ಭವಿಷ್ಯದ ಗುರಿಗಳು'
                : lang === 'ta'
                  ? 'பகுதி 1: உங்கள் கனவுகள் மற்றும் எதிர்கால இலக்குகள்'
                  : lang === 'hi'
                    ? 'भाग 1: आपके सपने और भविष्य के लक्ष्य'
                    : 'Section 1: Your Dreams & Future Goals';
            sectionDescription =
              lang === 'kn'
                ? 'ನಿಮ್ಮ ಭವಿಷ್ಯದ ಕನಸುಗಳು ಮತ್ತು ನೀವು ಸಾಧಿಸಲು ಬಯಸುವ ಗುರಿಗಳನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ.'
                : lang === 'ta'
                  ? 'எதிர்காலத்தில் நீங்கள் அடைய விரும்பும் கனவுகளையும் இலக்குகளையும் இங்கே எழுதுங்கள்.'
                  : lang === 'hi'
                    ? 'अपने भविष्य के सपनों और लक्ष्यों को यहां लिखें।'
                    : 'Express your dreams for the future and what you aspire to achieve';
          } else if (sectionKey === 'section2') {
            sectionTitle =
              lang === 'kn'
                ? 'ಭಾಗ 2: ವೃತ್ತಿ ಮತ್ತು ಜೀವನದ ಆಶೆಗಳು'
                : lang === 'ta'
                  ? 'பகுதி 2: தொழில் மற்றும் வாழ்க்கை ஆசைகள்'
                  : lang === 'hi'
                    ? 'भाग 2: करियर और जीवन की आकांक्षाएं'
                    : 'Section 2: Career & Life Aspirations';
            sectionDescription =
              lang === 'kn'
                ? 'ನೀವು ಯಾವ ವೃತ್ತಿಯಲ್ಲಿ/ಜೀವನ ಶೈಲಿಯಲ್ಲಿ ಇರಬೇಕೆಂದುಕೊಳ್ಳುತ್ತೀರಿ ಮತ್ತು ಸಮಾಜಕ್ಕೆ ಹೇಗೆ ಕೊಡುಗೆ ನೀಡಲು ಬಯಸುತ್ತೀರಿ ಎಂಬುದನ್ನು ಅನ್ವೇಷಿಸಿ.'
                : lang === 'ta'
                  ? 'எந்த தொழிலில் செல்ல வேண்டும், எங்கு வாழ வேண்டும், சமுதாயத்திற்கு எப்படி பங்களிக்க வேண்டும் என்பதை இங்கே எண்ணிப் பார்க்கவும்.'
                  : lang === 'hi'
                    ? 'आप किस करियर/जीवनशैली में रहना चाहते हैं और समाज में कैसे योगदान देना चाहते हैं, यह जानें।'
                    : 'Explore your career and life goals, where you want to live, and how you want to contribute';
            headerColor = 'from-purple-50 to-pink-50';
            titleColor = 'text-purple-800';
            descColor = 'text-purple-600';
          } else if (sectionKey === 'section3') {
            sectionTitle =
              lang === 'kn'
                ? 'ಭಾಗ 3: ಕನಸುಗಳನ್ನು ನಿಜವಾಗಿಸುವುದು'
                : lang === 'ta'
                  ? 'பகுதி 3: கனவுகளை நனவாக்குதல்'
                  : lang === 'hi'
                    ? 'भाग 3: सपनों को साकार करना'
                    : 'Section 3: Making Dreams Reality';
            sectionDescription =
              lang === 'kn'
                ? 'ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ನಿಜವಾಗಿಸಲು ಬೇಕಾದ ಹೆಜ್ಜೆಗಳು ಮತ್ತು ಮಧ್ಯದಲ್ಲಿರಬಹುದಾದ ಅಡಚಣೆಗಳನ್ನು ಇಲ್ಲಿ ಯೋಜಿಸಿ.'
                : lang === 'ta'
                  ? 'உங்கள் கனவுகளை நனவாக்க எவ்வாறு படிப்படியாக செயல்படலாம், வரும் சிரமங்களை எப்படி சமாளிக்கலாம் என்பதைக் குறித்து இங்கே திட்டமிடுங்கள்.'
                  : lang === 'hi'
                    ? 'अपने सपनों को साकार करने के लिए आवश्यक कदमों और संभावित बाधाओं की योजना बनाएं।'
                    : 'Plan the steps needed to achieve your dreams and identify potential obstacles';
            headerColor = 'from-green-50 to-emerald-50';
            titleColor = 'text-green-800';
            descColor = 'text-green-600';
          } else {
            sectionTitle =
              lang === 'kn'
                ? `ಭಾಗ ${sectionNumber}`
                : lang === 'ta'
                  ? `பகுதி ${sectionNumber}`
                  : lang === 'hi'
                    ? `भाग ${sectionNumber}`
                    : `Section ${sectionNumber}`;
            sectionDescription =
              lang === 'kn'
                ? 'ಈ ಭಾಗದಲ್ಲಿನ ಪ್ರಶ್ನೆಗಳಿಗೆ ನಿಮ್ಮ ಆಲೋಚನೆಗಳನ್ನು ಬರೆಯಿರಿ.'
                : lang === 'ta'
                  ? 'இந்த பகுதியில் உள்ள கேள்விகளுக்கு உங்கள் எண்ணங்களை எழுதுங்கள்.'
                  : lang === 'hi'
                    ? 'इस भाग के प्रश्नों के उत्तर लिखें।'
                    : 'Answer the questions in this section';
          }

          return (
            <div key={sectionKey} style={{ display: currentSection === sectionKey ? 'block' : 'none' }}>
              <Card className="border-0 shadow-lg">
                <CardHeader className={`bg-gradient-to-r ${headerColor}`}>
                  <CardTitle className={`text-xl ${titleColor}`}>{sectionTitle}</CardTitle>
                  <CardDescription className={descColor}>
                    {sectionDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {sectionQuestions.map((question, index) => {
                      const questionNumber = index + 1;
                      const questionValue = responses[question.id] || '';
                      const helpKey = question.id;
                      const isOpen = !!helpOpen[helpKey];
                      const helpText = question.help_text || '';

                      // Format label - don't add number if already present
                      const hasNumber = /^\d+\.\s/.test(question.question_text || '');
                      const label = hasNumber
                        ? question.question_text
                        : `${questionNumber}. ${question.question_text}`;

                      return (
                        <div key={question.id}>
                          <label className="block text-base font-medium text-gray-800 mb-2 flex items-center gap-2">
                            {label}<span className="text-red-500 text-sm">*</span>
                            <button
                              type="button"
                              aria-label="Help"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => toggleHelp(helpKey)}
                            >
                              💬
                            </button>
                          </label>
                          {isOpen && (
                            <div className="mb-2 p-3 rounded border bg-blue-50 border-blue-200 text-sm text-blue-800">
                              {helpText}
                            </div>
                          )}
                          <Textarea
                            placeholder={lang === 'kn' ? 'ನಿಮ್ಮ ಉತ್ತರ ಬರೆಯಿರಿ...' : lang === 'ta' ? 'உங்கள் பதிலை எழுதுங்கள்...' : lang === 'hi' ? 'अपना उत्तर लिखें...' : 'Type your answer here...'}
                            value={questionValue}
                            onChange={(e) => handleResponseChange(question.id, e.target.value)}
                            readOnly={isReadOnly}
                            rows={4}
                            className={`text-base border-blue-200 focus:border-blue-400 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed opacity-80' : 'bg-white'}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}

        {/* Navigation and Submit */}
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-8 gap-4 sm:gap-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}>
          <Button
            variant="outline"
            onClick={() => {
              const currentIndex = sections.indexOf(currentSection);
              if (currentIndex > 0) {
                setCurrentSection(sections[currentIndex - 1]);
              }
            }}
            disabled={sections.indexOf(currentSection) === 0}
            className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            {lang === 'kn'
              ? 'ಹಿಂದಿನ ಭಾಗ'
              : lang === 'ta'
                ? 'முந்தைய பகுதி'
                : lang === 'hi'
                  ? 'पिछला भाग'
                  : 'Previous Section'}
          </Button>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={saveProgress}
              disabled={saving || isReadOnly}
              className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              {saving ? (
                <>{lang === 'kn' ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : lang === 'ta' ? 'சேமிக்கிறது...' : lang === 'hi' ? 'सहेजा जा रहा है...' : 'Saving...'}</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {lang === 'kn'
                    ? 'ಪ್ರಗತಿಯನ್ನು ಉಳಿಸಿ'
                    : lang === 'ta'
                      ? 'முன்னேற்றத்தைச் சேமி'
                      : lang === 'hi'
                        ? 'प्रगति सहेजें'
                        : 'Save Progress'}
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                const currentIndex = sections.indexOf(currentSection);
                if (currentIndex < sections.length - 1) {
                  const nextSection = sections[currentIndex + 1];
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
              disabled={sections.indexOf(currentSection) === sections.length - 1}
              className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              {lang === 'kn'
                ? 'ಮುಂದಿನ ಭಾಗ'
                : lang === 'ta'
                  ? 'அடுத்த பகுதி'
                  : lang === 'hi'
                    ? 'अगला भाग'
                    : 'Next Section'}
            </Button>

            {sections.indexOf(currentSection) === sections.length - 1 && (
              <Button
                onClick={submitAssessment}
                disabled={!canSubmit() || submitting || isReadOnly}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('submitting')}
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 mr-2" />
                    {t('submitDreams')}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

      </div>
    </div >
  );
}
