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
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import { ArrowLeft } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
          title: lang === 'kn' ? 'ಮೌಲ್ಯಮಾಪನ ಲಾಕ್ ಮಾಡಲಾಗಿದೆ' : 'Assessment Locked',
          description: lang === 'kn' 
            ? `ದಯವಿಟ್ಟು ಮೊದಲು "${unlockResult.missingPrerequisites.join(', ')}" ಪೂರ್ಣಗೊಳಿಸಿ.`
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
            const { data: i18nData } = await supabase.rpc('get_dreams_questions_i18n', { p_lang: lang } as any);
            if (i18nData && Array.isArray(i18nData)) {
              i18nData.forEach((item: any) => {
                if (item?.key && item?.text) {
                  questionTranslations[item.key] = item.text;
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
    } catch {}
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
      } catch {}
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

        if (data.completed_at) {
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
        title: "Dreams Assessment Completed! ⭐",
        description: "Your dreams and aspirations have been captured successfully!",
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
                title: "Summary Generated! 📝",
                description: "Your dream portfolio has been generated. Your teacher will review it.",
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your dreams assessment...</p>
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
              <CardTitle className="text-2xl text-blue-800">Dreams Assessment Completed! 🌟</CardTitle>
              <CardDescription className="text-blue-600">
                You've successfully captured your dreams and aspirations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Thank you for sharing your dreams! Your responses have been saved and your teacher can now review them to help guide your journey.
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
                    {lang === 'kn' ? 'ನನ್ನ ಉತ್ತರಗಳನ್ನು ವೀಕ್ಷಿಸಿ' : 'View My Answers'}
                  </Button>
                  <Button 
                    onClick={() => navigate('/student')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {lang === 'kn' ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ' : 'Back to Dashboard'}
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
        <TooltipProvider>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-4">🌟 My Dreams Assessment</h1>
          
          {/* Quote Box */}
          <div className="max-w-3xl mx-auto mb-6 p-6 border-2 border-gray-800 rounded-lg bg-white">
            <p className="text-lg font-bold text-gray-900 mb-2">
              "Dream is not that which you see while sleeping, it is something that does not let you sleep".
            </p>
            <p className="text-gray-700 italic">By Dr. A. P. J. Abdul Kalam</p>
          </div>
          
          {/* Description Text */}
          <div className="max-w-3xl mx-auto space-y-3 text-gray-700">
            <p className="text-base leading-relaxed">
              We all hold dreams for our future. What are your dreams? Is there a particular goal or aspiration that resonates strongly with you?
            </p>
            <p className="text-base leading-relaxed">
              In this exploratory section, we'll uncover your world of dreams and aspirations.
            </p>
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
              <span>Section {sections.indexOf(currentSection) + 1} of {sections.length}</span>
              <span>{Math.round(getProgressPercentage())}% {t('completeSuffix')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Section Navigation */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-white rounded-lg p-1 shadow-md">
            {sections.map((sectionKey, index) => {
              const sectionQuestions = questionsBySection[sectionKey] || [];
              const sectionNumber = index + 1;
              let sectionTitle = '';
              if (sectionKey === 'section1') sectionTitle = 'Section 1: Your Dreams & Future Goals';
              else if (sectionKey === 'section2') sectionTitle = 'Section 2: Career & Life Aspirations';
              else if (sectionKey === 'section3') sectionTitle = 'Section 3: Making Dreams Reality';
              else sectionTitle = `Section ${sectionNumber}`;
              
              return (
                <button
                  key={sectionKey}
                  onClick={() => setCurrentSection(sectionKey)}
                  className={`px-6 py-2 rounded-md transition-all ${
                    currentSection === sectionKey
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
            sectionTitle = 'Section 1: Your Dreams & Future Goals';
            sectionDescription = 'Express your dreams for the future and what you aspire to achieve';
          } else if (sectionKey === 'section2') {
            sectionTitle = 'Section 2: Career & Life Aspirations';
            sectionDescription = 'Explore your career and life goals, where you want to live, and how you want to contribute';
            headerColor = 'from-purple-50 to-pink-50';
            titleColor = 'text-purple-800';
            descColor = 'text-purple-600';
          } else if (sectionKey === 'section3') {
            sectionTitle = 'Section 3: Making Dreams Reality';
            sectionDescription = 'Plan the steps needed to achieve your dreams and identify potential obstacles';
            headerColor = 'from-green-50 to-emerald-50';
            titleColor = 'text-green-800';
            descColor = 'text-green-600';
          } else {
            sectionTitle = `Section ${sectionNumber}`;
            sectionDescription = 'Answer the questions in this section';
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
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button 
                                  type="button" 
                                  aria-label="Help" 
                                  className="text-blue-600 hover:text-blue-700"
                                  onClick={() => toggleHelp(helpKey)}
                                >
                                  💬
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">{helpText}</TooltipContent>
                            </Tooltip>
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
                            className="text-base border-blue-200 focus:border-blue-400"
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
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={() => {
              const currentIndex = sections.indexOf(currentSection);
              if (currentIndex > 0) {
                setCurrentSection(sections[currentIndex - 1]);
              }
            }}
            disabled={sections.indexOf(currentSection) === 0}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            Previous Section
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const currentIndex = sections.indexOf(currentSection);
                if (currentIndex < sections.length - 1) {
                  setCurrentSection(sections[currentIndex + 1]);
                }
              }}
              disabled={sections.indexOf(currentSection) === sections.length - 1}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              Next Section
            </Button>

            {sections.indexOf(currentSection) === sections.length - 1 && (
              <Button
                onClick={submitAssessment}
                disabled={!canSubmit() || submitting || isReadOnly}
                className="bg-blue-600 hover:bg-blue-700"
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
        </TooltipProvider>
      </div>
      <KannadaKeyboard lang={lang} />
    </div>
  );
}
