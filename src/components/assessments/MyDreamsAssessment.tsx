import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import { ArrowLeft } from 'lucide-react';

import { KannadaKeyboard } from '@/components/ui/KannadaKeyboard';
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
  const isReadOnly = isCompleted || readOnlyView;
  const [currentSection, setCurrentSection] = useState<string>('section1');
  const [helpOpen, setHelpOpen] = useState<Record<string, boolean>>({});
  const toggleHelp = (k: string) => setHelpOpen(prev => ({ ...prev, [k]: !prev[k] }));
  const [saving, setSaving] = useState(false);

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
        });

      if (error) throw error;

      toast({
        title: lang === 'kn' ? 'ಪ್ರಗತಿಯನ್ನು ಉಳಿಸಲಾಗಿದೆ' : lang === 'ta' ? 'முன்னேற்றம் சேமிக்கப்பட்டது' : 'Progress Saved',
        description: lang === 'kn' ? 'ನಿಮ್ಮ ಉತ್ತರಗಳನ್ನು ಉಳಿಸಲಾಗಿದೆ.' : lang === 'ta' ? 'உங்கள் பதில்கள் சேமிக்கப்பட்டன.' : 'Your answers have been saved.',
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Error",
        description: "Failed to save progress.",
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
          title: lang === 'kn' ? 'ಮೌಲ್ಯಮಾಪನ ಲಾಕ್ ಮಾಡಲಾಗಿದೆ' : lang === 'ta' ? 'செயல் பூட்டப்பட்டுள்ளது' : 'Assessment Locked',
          description: lang === 'kn'
            ? `ದಾಯವಿಟ್ಟು ಮೊದಲು "${unlockResult.missingPrerequisites.join(', ')}" ಪೂರ್ಣಗೊಳಿಸಿ.`
            : lang === 'ta'
              ? `"${unlockResult.missingPrerequisites.join(', ')}" செயல்களை முதலில் முடித்தால் இந்த பகுதி திறக்கும்.`
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
        console.error('Error fetching module content:', e);
      }
    };
    fetchModuleContent();
  }, [lang]);

  // Load questions from database with i18n support
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        console.log('🔄 Loading Dreams questions from database...');
        // First, get the full question structure
        const { data, error } = await supabase.rpc('get_dreams_questions');
        if (error) {
          console.error('Error loading dreams questions:', error);
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
          } catch (e) {
            console.warn('Could not load i18n translations, using default:', e);
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

          console.log('✅ Database questions loaded:', questionsWithTranslations.length, 'questions');
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
        console.error('Error loading dreams questions:', error);
      }
    };
    loadQuestions();
  }, [lang]);

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
        });
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
        .eq('assessment_title', 'My Dreams')
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
            console.warn('⚠️ Failed to parse dreams responses JSON string, using raw value');
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

  const canSubmit = () => {
    if (isReadOnly) return false;
    if (dreamsQuestions.length === 0) return false;
    return dreamsQuestions.every(q => {
      const response = responses[q.id];
      return response && response.trim() !== '';
    });
  };

  const submitAssessment = async () => {
    if (isReadOnly) return;
    if (!userProfile) {
      toast({
        title: "Error",
        description: "User profile not found. Please try logging in again.",
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
        title: "Error",
        description: "Student profile not found. Please contact your teacher or support.",
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
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title:
          lang === 'kn'
            ? 'ಕನಸುಗಳ ಮೌಲ್ಯಮಾಪನ ಪೂರ್ಣಗೊಂಡಿದೆ! ⭐'
            : lang === 'ta'
              ? 'கனவுகள் மதிப்பீடு முடிந்தது! ⭐'
              : 'Dreams Assessment Completed! ⭐',
        description:
          lang === 'kn'
            ? 'ನಿಮ್ಮ ಕನಸುಗಳು ಮತ್ತು ಆಶಯಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಿಸಲಾಗಿದೆ.'
            : lang === 'ta'
              ? 'உங்கள் கனவுகளும் எதிர்கால ஆசைகளும் வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளன.'
              : 'Your dreams and aspirations have been captured successfully!',
      });

      setIsCompleted(true);

      // Generate AI summary in the background
      try {
        const { aiSummaryService } = await import('@/services/aiSummaryService');
        const summaryDatabaseService = (await import('@/services/summaryDatabaseService')).summaryDatabaseService;

        if (aiSummaryService.isConfigured()) {
          console.log('🤖 Generating AI summary for Dreams assessment:', assessmentData.id);
          const summaryResult = await aiSummaryService.generateDreamsSummary(responses);

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
                    ? 'ನಿಮ್ಮ ಕನಸುಗಳ ಪೋರ್ಟ್ಫೋಲಿಯೊ ಸಿದ್ಧವಾಗಿದೆ. ನಿಮ್ಮ ಶಿಕ್ಷಕರು ಅದನ್ನು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.'
                    : lang === 'ta'
                      ? 'உங்கள் கனவு குறிப்பேடு உருவாக்கப்பட்டுள்ளது. உங்கள் ஆசிரியா் அதைப் பார்த்து மதிப்பாய்வு செய்வார்.'
                      : 'Your dream portfolio has been generated. Your teacher will review it.',
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
                      title: `${userProfile?.full_name || 'Student'} completed My Dreams assessment`,
                      message: 'A new My Dreams assessment summary is ready for review.',
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
        // Don't fail the entire submission if summary generation fails
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
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
                    : 'Dreams Assessment Completed! 🌟'}
              </CardTitle>
              <CardDescription className="text-blue-600">
                {lang === 'kn'
                  ? 'ನಿಮ್ಮ ಕನಸುಗಳು ಮತ್ತು ಆಶಯಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಹಂಚಿಕೊಂಡಿದ್ದೀರಿ.'
                  : lang === 'ta'
                    ? 'உங்கள் கனவுகளையும் எதிர்கால ஆசைகளையும் வெற்றிகரமாக பதிவு செய்துள்ளீர்கள்.'
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
                : '🌟 My Dreams Assessment')}
          </h1>

          {/* Quote Box */}
          <div className="max-w-3xl mx-auto mb-6 p-4 md:p-6 border-2 border-gray-800 rounded-lg bg-white">
            <p className="text-lg font-bold text-gray-900 mb-2">
              {dbQuote || (lang === 'kn'
                ? '“ನೀವು ನಿದ್ರಿಸುವಾಗ ಕಾಣುವದನ್ನು ಅಲ್ಲ ಕನಸು, ನಿಮ್ಮನ್ನು ನಿದ್ರಿಸದಂತೆ 만드는 ಆಲೋಚನೆಯೇ ನಿಜವಾದ ಕನಸು.”'
                : lang === 'ta'
                  ? '“நீங்கள் தூங்கும்போது காண்பது கனவு அல்ல; உங்களைத் தூங்க விடாமல் செய்யும் எண்ணங்களே உண்மையான கனவுகள்.”'
                  : '“Dream is not that which you see while sleeping, it is something that does not let you sleep”.')}
            </p>
            {!dbQuote && <p className="text-gray-700 italic">
              {lang === 'kn'
                ? 'ಡಾ. ಎ. ಪಿ. ಜೇ. ಅಬ್ದುಲ್ ಕಲಾಂ'
                : lang === 'ta'
                  ? 'டாக்டர் ஏ. பி. ஜே. அப்துல் கலாம்'
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
                  : 'We all hold dreams for our future. What are your dreams? Is there a particular goal or aspiration that resonates strongly with you?')}
            </p>
            {!dbIntro && <p className="text-base leading-relaxed">
              {lang === 'kn'
                ? 'ಈ பகுತಿಯಲ್ಲಿ, ನಿಮ್ಮ ಕನಸುಗಳು ಮತ್ತು ಆಶೆಗಳ ಪ್ರಪಂಚವನ್ನು ನಿಧಾನವಾಗಿ ಅನ್ವೇಷಿಸೋಣ.'
                : lang === 'ta'
                  ? 'இந்த ஆராய்ச்சி பகுதியின் மூலம், உங்கள் கனவுகள் மற்றும் ஆசைகளின் உலகத்தை மெதுவாக ஆராயப் போகிறோம்.'
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
                      : 'Section 1: Your Dreams & Future Goals';
              } else if (sectionKey === 'section2') {
                sectionTitle =
                  lang === 'kn'
                    ? 'ಭಾಗ 2: ವೃತ್ತಿ ಮತ್ತು ಜೀವನದ ಆಶೆಗಳು'
                    : lang === 'ta'
                      ? 'பகுதி 2: தொழில் மற்றும் வாழ்க்கை ஆசைகள்'
                      : 'Section 2: Career & Life Aspirations';
              } else if (sectionKey === 'section3') {
                sectionTitle =
                  lang === 'kn'
                    ? 'ಭಾಗ 3: ಕನಸುಗಳನ್ನು ನಿಜವಾಗಿಸುವುದು'
                    : lang === 'ta'
                      ? 'பகுதி 3: கனவுகளை நனவாக்குதல்'
                      : 'Section 3: Making Dreams Reality';
              } else {
                sectionTitle =
                  lang === 'kn'
                    ? `ಭಾಗ ${sectionNumber}`
                    : lang === 'ta'
                      ? `பகுதி ${sectionNumber}`
                      : `Section ${sectionNumber}`;
              }

              return (
                <button
                  key={sectionKey}
                  onClick={() => setCurrentSection(sectionKey)}
                  className={`px-6 py-2 rounded-md transition-all ${currentSection === sectionKey
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-blue-600'
                    }`}
                >
                  {sectionTitle}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamically render sections from database */}
        {sections.map((sectionKey) => {
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
                  : 'Section 1: Your Dreams & Future Goals';
            sectionDescription =
              lang === 'kn'
                ? 'ನಿಮ್ಮ ಭವಿಷ್ಯದ ಕನಸುಗಳು ಮತ್ತು ನೀವು ಸಾಧಿಸಲು ಬಯಸುವ ಗುರಿಗಳನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ.'
                : lang === 'ta'
                  ? 'எதிர்காலத்தில் நீங்கள் அடைய விரும்பும் கனவுகளையும் இலக்குகளையும் இங்கே எழுதுங்கள்.'
                  : 'Express your dreams for the future and what you aspire to achieve';
          } else if (sectionKey === 'section2') {
            sectionTitle =
              lang === 'kn'
                ? 'ಭಾಗ 2: ವೃತ್ತಿ ಮತ್ತು ಜೀವನದ ಆಶೆಗಳು'
                : lang === 'ta'
                  ? 'பகுதி 2: தொழில் மற்றும் வாழ்க்கை ஆசைகள்'
                  : 'Section 2: Career & Life Aspirations';
            sectionDescription =
              lang === 'kn'
                ? 'ನೀವು ಯಾವ ವೃತ್ತಿಯಲ್ಲಿ/ಜೀವನ ಶೈಲಿಯಲ್ಲಿ ಇರಬೇಕೆಂದುಕೊಳ್ಳುತ್ತೀರಿ ಮತ್ತು ಸಮಾಜಕ್ಕೆ ಹೇಗೆ ಕೊಡುಗೆ ನೀಡಲು ಬಯಸುತ್ತೀರಿ ಎಂಬುದನ್ನು ಅನ್ವೇಷಿಸಿ.'
                : lang === 'ta'
                  ? 'எந்த தொழிலில் செல்ல வேண்டும், எங்கு வாழ வேண்டும், சமுதாயத்திற்கு எப்படி பங்களிக்க வேண்டும் என்பதை இங்கே எண்ணிப் பார்க்கவும்.'
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
                  : 'Section 3: Making Dreams Reality';
            sectionDescription =
              lang === 'kn'
                ? 'ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ನಿಜವಾಗಿಸಲು ಬೇಕಾದ ಹೆಜ್ಜೆಗಳು ಮತ್ತು ಮಧ್ಯದಲ್ಲಿರಬಹುದಾದ ಅಡಚಣೆಗಳನ್ನು ಇಲ್ಲಿ ಯೋಜಿಸಿ.'
                : lang === 'ta'
                  ? 'உங்கள் கனவுகளை நனவாக்க எவ்வாறு படிப்படியாக செயல்படலாம், வரும் சிரமங்களை எப்படி சமாளிக்கலாம் என்பதைக் குறித்து இங்கே திட்டமிடுங்கள்.'
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
                  : `Section ${sectionNumber}`;
            sectionDescription =
              lang === 'kn'
                ? 'ಈ ಭಾಗದಲ್ಲಿನ ಪ್ರಶ್ನೆಗಳಿಗೆ ನಿಮ್ಮ ಆಲೋಚನೆಗಳನ್ನು ಬರೆಯಿರಿ.'
                : lang === 'ta'
                  ? 'இந்த பகுதியில் உள்ள கேள்விகளுக்கு உங்கள் எண்ணங்களை எழுதுங்கள்.'
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
                            {label}
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
                            placeholder={helpText}
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
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-8 gap-4 sm:gap-0">
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
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {lang === 'kn'
                    ? 'ಪ್ರಗತಿಯನ್ನು ಉಳಿಸಿ'
                    : lang === 'ta'
                      ? 'முன்னேற்றத்தைச் சேமி'
                      : 'Save Progress'}
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                const currentIndex = sections.indexOf(currentSection);
                if (currentIndex < sections.length - 1) {
                  setCurrentSection(sections[currentIndex + 1]);
                }
              }}
              disabled={sections.indexOf(currentSection) === sections.length - 1}
              className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              {lang === 'kn'
                ? 'ಮುಂದಿನ ಭಾಗ'
                : lang === 'ta'
                  ? 'அடுத்த பகுதி'
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
      <KannadaKeyboard lang={lang} />
    </div >
  );
}
