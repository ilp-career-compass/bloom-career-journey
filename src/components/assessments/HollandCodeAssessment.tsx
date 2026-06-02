import { logger } from '@/lib/logger';
import { useState, useEffect, useMemo, useRef } from 'react';
import { validateResponses } from '@/utils/englishValidation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CheckCircle, ArrowLeft, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import { checkAssessmentUnlock } from '@/utils/assessmentUnlock';
import { AssessmentService } from '@/services/assessmentService';
import { getTranslatedHollandQuestion } from '@/utils/hollandTranslations';

type CategoryKey = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

interface HollandQuestion {
  id: string;
  category: CategoryKey;
  question_text: string;
  sequence_number: number;
}

const CATEGORY_LABELS: Record<'en' | 'kn' | 'ta' | 'hi', Record<CategoryKey, string>> = {
  en: {
    R: 'Realistic',
    I: 'Investigative',
    A: 'Artistic',
    S: 'Social',
    E: 'Enterprising',
    C: 'Conventional',
  },
  kn: {
    R: 'ವಾಸ್ತವಿಕ',
    I: 'ವಿಚಾರಣಾತ್ಮಕ',
    A: 'ಕಲಾತ್ಮಕ',
    S: 'ಸಾಮಾಜಿಕ',
    E: 'ಉದ್ಯಮಶೀಲ',
    C: 'ಸಾಂಪ್ರದಾಯಿಕ',
  },
  ta: {
    R: 'நடைமுறை வேலைகள்',
    I: 'ஆராயும் வேலைகள்',
    A: 'கலை சார்ந்த வேலைகள்',
    S: 'மக்களுக்கு உதவும் வேலைகள்',
    E: 'வியாபாரம் / தலைமை வேலைகள்',
    C: 'அலுவலக வேலைகள்',
  },
  hi: {
    R: 'व्यावहारिक',
    I: 'विश्लेषणात्मक',
    A: 'कलात्मक',
    S: 'सामाजिक',
    E: 'उद्यमशील',
    C: 'पारंपरिक',
  },
};

// Scoreboard mapping: which question numbers belong to which category
const SCOREBOARD_MAPPING: Record<CategoryKey, number[]> = {
  R: [1, 7, 13, 19, 25, 31, 37],
  I: [2, 8, 14, 20, 26, 32, 38],
  A: [3, 9, 15, 21, 27, 33, 39],
  S: [4, 10, 16, 22, 28, 34, 40],
  E: [5, 11, 17, 23, 29, 35, 41],
  C: [6, 12, 18, 24, 30, 36, 42],
};

export default function HollandCodeAssessment() {
  const { userProfile } = useAuth();
  const { t, lang } = useLang();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const readOnlyView = ['1', 'true'].includes((searchParams.get('readonly') || searchParams.get('view') || '').toLowerCase());
  const [questions, setQuestions] = useState<HollandQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [topTwoTypes, setTopTwoTypes] = useState<string>('');
  const [reflection, setReflection] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [assessmentTitle, setAssessmentTitle] = useState<string>('');

  // Check if assessment is unlocked
  useEffect(() => {
    const checkUnlock = async () => {
      if (!userProfile) return;

      let studentId = userProfile.studentProfile?.id as string | undefined;
      if (!studentId) {
        const { data } = await supabase.from('students').select('id').eq('user_id', userProfile.id).maybeSingle();
        studentId = data?.id;
      }
      if (!studentId) return;

      const unlockResult = await checkAssessmentUnlock(studentId, 'holland_code');

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
  }, [userProfile, navigate, toast, lang]);

  // Load questions and template from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load template for text content
        const template = await AssessmentService.getAssessmentTemplate('personality');
        if (template) {
          setAssessmentTitle(template.title);
          setDescription(template.description || '');
          setInstructions(template.instructions || '');
        }

        logger.log('🔄 Loading Holland Code questions from database...');
        const { data, error } = await supabase.rpc('get_holland_code_questions');
        if (error) {
          logger.error('Error loading Holland Code questions:', error);
          return;
        }
        if (data && Array.isArray(data) && data.length > 0) {
          logger.log('✅ Database questions loaded:', data.length, 'questions');
          // Sort by sequence_number to ensure correct order
          const sorted = (data as HollandQuestion[]).sort((a, b) => a.sequence_number - b.sequence_number);
          setQuestions(sorted);
        }
      } catch (error) {
        logger.error('Error loading Holland Code data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load existing response
  useEffect(() => {
    if (questions.length === 0 || !userProfile) return;

    const loadExistingResponse = async () => {
      let studentId = userProfile.studentProfile?.id as string | undefined;
      if (!studentId) {
        const { data: row } = await supabase.from('students').select('id').eq('user_id', userProfile.id).maybeSingle();
        studentId = row?.id;
      }
      if (!studentId) return;

      try {
        const { data, error } = await supabase
          .from('assessment_responses')
          .select('*')
          .eq('student_id', studentId)
          .eq('assessment_type', 'personality')
          .eq('assessment_title', 'Holland Code (RIASEC) Test')
          // Prefer completed records first, then latest draft
          .order('completed_at', { ascending: false, nullsFirst: false })
          .order('updated_at', { ascending: false })
          .limit(1);

        const row = Array.isArray(data) && data.length > 0 ? data[0] : null;

        if (row && !error && row.responses) {
          let responses = row.responses as any;

          // Supabase jsonb may come back as a JSON string; parse if needed
          if (typeof responses === 'string') {
            try {
              responses = JSON.parse(responses);
            } catch {
              logger.warn('⚠️ Failed to parse Holland responses JSON string, using raw value');
            }
          }

          // Load answers
          const loadedAnswers: Record<number, boolean> = {};
          questions.forEach((q, index) => {
            const questionNum = index + 1;
            if (responses[`question${questionNum}`] !== undefined) {
              loadedAnswers[questionNum] = responses[`question${questionNum}`];
            }
          });
          setAnswers(loadedAnswers);

          // Load top two types and reflection
          if (responses.topTwoTypes) setTopTwoTypes(responses.topTwoTypes);
          if (responses.reflection) setReflection(responses.reflection);

          if (row.completed_at) {
            setIsCompleted(true);
          }
        }
      } catch (error) {
        logger.error('Error loading existing response:', error);
      }
    };

    loadExistingResponse();
  }, [questions, userProfile]);

  // Calculate scores by category
  const scores = useMemo(() => {
    const categoryScores: Record<CategoryKey, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    questions.forEach((q, index) => {
      const questionNum = index + 1;
      if (answers[questionNum]) {
        categoryScores[q.category] += 1;
      }
    });

    return categoryScores;
  }, [answers, questions]);

  // Calculate top two personality types
  const topTwoPersonalityTypes = useMemo(() => {
    const entries = Object.entries(scores) as Array<[CategoryKey, number]>;
    entries.sort((a, b) => b[1] - a[1]);
    const topTwo = entries.slice(0, 2);
    return topTwo.map(([key, score]) => `${key} (${score})`).join(', ');
  }, [scores]);

  // Update top two types when scores change
  useEffect(() => {
    if (topTwoPersonalityTypes) {
      setTopTwoTypes(topTwoPersonalityTypes.split(', ').map(t => t.split(' ')[0]).join(''));
    }
  }, [topTwoPersonalityTypes]);

  const handleToggle = (questionNum: number, value: boolean) => {
    if (isCompleted) return;
    isDirtyRef.current = true;
    setAnswers(prev => ({ ...prev, [questionNum]: value }));
  };

  const getProgressPercentage = () => {
    if (questions.length === 0) return 0;
    const answered = Object.keys(answers).filter(k => answers[Number(k)]).length;
    return (answered / questions.length) * 100;
  };

  const canSubmit = () => {
    return questions.length > 0 && Object.keys(answers).length === questions.length && topTwoTypes.length === 2;
  };

  const submitAssessment = async () => {
    if (!userProfile) {
      toast({
        title: "Error",
        description: "User profile not found. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

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

    const currentResponses: any = {};
    questions.forEach((q, index) => {
      const questionNum = index + 1;
      currentResponses[`question${questionNum}`] = answers[questionNum] || false;
    });
    currentResponses.scores = scores;
    currentResponses.topTwoTypes = topTwoTypes;
    currentResponses.reflection = reflection;

    if (!validateResponses(currentResponses)) {
      toast({
        title: lang === 'kn' ? 'ದೋಷ' : lang === 'ta' ? 'பிழை' : 'Validation Error',
        description: "Answers should be entered only in English.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Prepare responses object
      const currentResponses: any = {};
      questions.forEach((q, index) => {
        const questionNum = index + 1;
        currentResponses[`question${questionNum}`] = answers[questionNum] || false;
      });
      currentResponses.scores = scores;
      currentResponses.topTwoTypes = topTwoTypes;
      currentResponses.reflection = reflection;

      const { error } = await supabase
        .from('assessment_responses')
        .upsert({
          student_id: studentId,
          assessment_type: 'personality',
          assessment_title: 'Holland Code (RIASEC) Test',
          responses: currentResponses,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,assessment_type' });

      if (error) throw error;

      toast({
        title: lang === 'kn' ? 'Holland Code ಮೌಲ್ಯಮಾಪನ ಪೂರ್ಣಗೊಂಡಿದೆ! 🧭' : lang === 'ta' ? 'Holland Code மதிப்பீடு முடிந்தது! 🧭' : lang === 'hi' ? 'Holland Code मूल्यांकन पूर्ण! 🧭' : 'Holland Code Assessment Completed! 🧭',
        description: lang === 'kn' ? 'ನಿಮ್ಮ ವ್ಯಕ್ತಿತ್ವ ಪ್ರಕಾರ ಯಶಸ್ವಿಯಾಗಿ ಗುರುತಿಸಲಾಗಿದೆ!' : lang === 'ta' ? 'உங்கள் ஆளுமை வகை வெற்றிகரமாக அடையாளம் காணப்பட்டுள்ளது!' : lang === 'hi' ? 'आपका व्यक्तित्व प्रकार सफलतापूर्वक पहचाना गया!' : 'Your personality type has been identified successfully!',
      });

      setIsCompleted(true);

      // After successful completion, navigate to the next assessment module
      try {
        const qp = lang ? `?lang=${lang}` : '';
        navigate(`/student/assessment/career-guidance-tools${qp}`);
      } catch {
        // If navigation fails for any reason, stay on the completion screen
      }
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

  const autoSaveErrorRef = useRef(false);
  const isDirtyRef = useRef(false);

  // Auto-save drafts when answers change (debounced)
  useEffect(() => {
    if (loading || isCompleted || readOnlyView || questions.length === 0 || !isDirtyRef.current) return;
    const timer = setTimeout(async () => {
      try {
        if (!userProfile?.id) return;
        let studentId = userProfile.studentProfile?.id as string | undefined;
        if (!studentId) {
          const { data: row } = await supabase.from('students').select('id').eq('user_id', userProfile.id).maybeSingle();
          studentId = row?.id;
        }
        if (!studentId) return;

        const currentResponses: any = {};
        questions.forEach((q, index) => {
          const questionNum = index + 1;
          currentResponses[`question${questionNum}`] = answers[questionNum] || false;
        });
        currentResponses.scores = scores;
        currentResponses.topTwoTypes = topTwoTypes;
        currentResponses.reflection = reflection;

        const { error } = await supabase
          .from('assessment_responses')
          .upsert({
            student_id: studentId,
            assessment_type: 'personality',
            assessment_title: 'Holland Code (RIASEC) Test',
            responses: currentResponses,
            updated_at: new Date().toISOString(),
            completed_at: null
          }, { onConflict: 'student_id,assessment_type' });

        if (error) throw error;
        autoSaveErrorRef.current = false;
      } catch (e) {
        logger.warn('Auto-save failed (personality):', e);
        if (!autoSaveErrorRef.current) {
          autoSaveErrorRef.current = true;
          toast({
            title: lang === 'kn' ? 'ಸ್ವಯಂ-ಉಳಿಕೆ ವಿಫಲ' : lang === 'ta' ? 'தானியங்கி சேமிப்பு தோல்வி' : lang === 'hi' ? 'स्वतः-सहेजना विफल' : 'Auto-save failed',
            description: lang === 'kn' ? 'ನಿಮ್ಮ ಡ್ರಾಫ್ಟ್ ಉಳಿಸಲಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ.' : lang === 'ta' ? 'உங்கள் வரைவு சேமிக்கப்படவில்லை. உங்கள் இணைப்பை சரிபார்க்கவும்.' : lang === 'hi' ? 'आपका ड्राफ़्ट सहेजा नहीं जा रहा। कृपया अपना कनेक्शन जांचें।' : 'Your draft is not being saved. Please check your connection.',
            variant: 'destructive',
          });
        }
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [answers, scores, topTwoTypes, reflection, loading, isCompleted, userProfile, questions]);

  if (loading) {
    const loadingText =
      lang === 'kn'
        ? 'Holland Code ಮೌಲ್ಯಮಾಪನವನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...'
        : lang === 'ta'
          ? 'Holland Code மதிப்பீடு ஏற்றப்படுகிறது...'
          : lang === 'hi'
            ? 'हॉलैंड कोड मूल्यांकन लोड हो रहा है...'
            : 'Loading Holland Code assessment...';

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
    const completedTitle =
      lang === 'kn' ? 'ಹಾಲೆಂಡ್ ಕೋಡ್ ಮೌಲ್ಯಮಾಪನ ಪೂರ್ಣಗೊಂಡಿದೆ! 🧭' :
      lang === 'ta' ? 'ஹாலண்ட் குறியீடு மதிப்பீடு முடிந்தது! 🧭' :
      lang === 'hi' ? 'हॉलैंड कोड मूल्यांकन पूरा हुआ! 🧭' :
      'Holland Code Assessment Completed! 🧭';

    const completedDesc =
      lang === 'kn' ? 'ನಿಮ್ಮ ವ್ಯಕ್ತಿತ್ವದ ಪ್ರಕಾರವನ್ನು ಗುರುತಿಸಲಾಗಿದೆ' :
      lang === 'ta' ? 'உங்கள் ஆளுமை வகை அடையாளம் காணப்பட்டுள்ளது' :
      lang === 'hi' ? 'आपके व्यक्तित्व प्रकार की पहचान की गई है' :
      'Your personality type has been identified';

    const topTypesLabel =
      lang === 'kn' ? 'ನಿಮ್ಮ ಉನ್ನತ ಎರಡು ವ್ಯಕ್ತಿತ್ವ ಪ್ರಕಾರಗಳು:' :
      lang === 'ta' ? 'உங்கள் சிறந்த இரண்டு ஆளுமை வகைகள்:' :
      lang === 'hi' ? 'आपके शीर्ष दो व्यक्तित्व प्रकार:' :
      'Your Top Two Personality Types:';

    const viewAnswersLabel =
      lang === 'kn' ? 'ನನ್ನ ಉತ್ತರಗಳನ್ನು ವೀಕ್ಷಿಸಿ' :
      lang === 'ta' ? 'என் பதில்களைப் பார்க்க' :
      lang === 'hi' ? 'मेरे उत्तर देखें' :
      'View My Answers';

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-0 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <CheckCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-blue-800">{completedTitle}</CardTitle>
              <CardDescription className="text-blue-600">
                {completedDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 mb-2">{topTypesLabel}</p>
                  <p className="text-2xl font-bold text-blue-900">{topTwoTypes}</p>
                </div>
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('readonly', '1');
                      navigate(`/student/assessment/holland-code?${params.toString()}`);
                    }}
                  >
                    {viewAnswersLabel}
                  </Button>
                  <Button onClick={() => navigate('/student')} className="bg-blue-600 hover:bg-blue-700">
                    {t('backToDashboard')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Localized module text
  const localizedTitle = t('assessment_holland_code');

  const localizedDescription =
    lang === 'kn' ? 'ನಿಮ್ಮ ವ್ಯಕ್ತಿತ್ವದ ಪ್ರಕಾರ ಮತ್ತು ವೃತ್ತಿ ಆಸಕ್ತಿಗಳನ್ನು ಅನ್ವೇಷಿಸಿ.' :
    lang === 'ta' ? 'உங்கள் ஆளுமை வகை மற்றும் தொழில் சார்ந்த ஆர்வங்களை கண்டறியுங்கள்.' :
    lang === 'hi' ? 'अपने व्यक्तित्व के प्रकार और करियर रुचियों को जानें।' :
    description || 'Discover your personality type and career interests';

  const localizedInstructions =
    lang === 'kn' ? 'ನಿಮ್ಮ ಆದ್ಯತೆಗಳು ಮತ್ತು ಆಸಕ್ತಿಗಳ ಬಗ್ಗೆ ಪ್ರಾಮಾಣಿಕವಾಗಿ ಉತ್ತರಿಸಿ.' :
    lang === 'ta' ? 'உங்கள் விருப்பங்கள் மற்றும் ஆர்வங்கள் குறித்து உண்மையாக பதிலளிக்கவும்.' :
    lang === 'hi' ? 'अपनी प्राथमिकताओं और रुचियों के बारे में ईमानदारी से उत्तर दें।' :
    instructions || 'Answer honestly about your preferences and interests.';

  const instructionsHeader =
    lang === 'kn' ? 'ಸೂಚನೆಗಳು' :
    lang === 'ta' ? 'அறிவுறுத்தல்கள்' :
    lang === 'hi' ? 'निर्देश' :
    'Instructions';

  const questionsSectionTitle =
    lang === 'kn' ? '1. ನಿಧಾನವಾಗಿ ಯೋಚಿಸಿ ಮತ್ತು ಈ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ' :
    lang === 'ta' ? '1. நிதானமாக யோசித்து இந்த விவரங்களை நிரப்பவும்' :
    lang === 'hi' ? '1. अपना समय लें और इन विवरणों को भरें' :
    '1. Take your time and fill in these details';

  const questionsSectionDesc =
    lang === 'kn' ? 'ಪ್ರತಿ ಹೇಳಿಕೆಗೆ ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಉತ್ತರಿಸಿ' :
    lang === 'ta' ? 'ஒவ்வொரு கூற்றிற்கும் ஆம் அல்லது இல்லை என்று பதிலளிக்கவும்' :
    lang === 'hi' ? 'प्रत्येक कथन के लिए हाँ या नहीं में उत्तर दें' :
    'Answer Yes or No for each statement';

  const yesLabel =
    lang === 'kn' ? 'ಹೌದು (✔)' :
    lang === 'ta' ? 'ஆம் (✔)' :
    lang === 'hi' ? 'हाँ (✔)' :
    'Yes (✔)';

  const noLabel =
    lang === 'kn' ? 'ಇಲ್ಲ (✗)' :
    lang === 'ta' ? 'இல்லை (✗)' :
    lang === 'hi' ? 'नहीं (✗)' :
    'No (✗)';

  const scoreboardTitle =
    lang === 'kn' ? 'ಅಂಕಪಟ್ಟಿ - ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಗಳನ್ನು ಗುರುತಿಸಿ' :
    lang === 'ta' ? 'மதிப்பெண் பலகை - உங்கள் பதில்களைக் குறிக்கவும்' :
    lang === 'hi' ? 'स्कोरबोर्ड - अपनी प्रतिक्रियाएँ अंकित करें' :
    'Scoreboard - Mark Your Responses';

  const scoreboardDesc =
    lang === 'kn' ? 'ಪ್ರತಿ ವರ್ಗಕ್ಕೆ "ಹೌದು" ಪ್ರತಿಕ್ರಿಯೆಗಳ ಸಂಖ್ಯೆಯನ್ನು ಎಣಿಸಿ ಮತ್ತು ಒಟ್ಟು ನಮೂದಿಸಿ' :
    lang === 'ta' ? 'ஒவ்வொரு வகைக்கும் "ஆம்" பதில்களின் எண்ணிக்கையை எண்ணி மொத்தத்தை உள்ளிடவும்' :
    lang === 'hi' ? 'प्रत्येक श्रेणी के लिए "हाँ" प्रतिक्रियाओं की संख्या गिनें और कुल दर्ज करें' :
    'Count the number of "Yes" responses for each category and enter the total';

  const tableHeaderCol1 =
    lang === 'kn' ? 'ವ್ಯಕ್ತಿತ್ವದ ಪ್ರಕಾರ' :
    lang === 'ta' ? 'ஆளுமை வகை' :
    lang === 'hi' ? 'व्यक्तित्व प्रकार' :
    'Personality Type';

  const tableHeaderCol2 =
    lang === 'kn' ? 'ಪ್ರಶ್ನೆ ಸಂಖ್ಯೆಗಳು' :
    lang === 'ta' ? 'கேள்வி எண்கள்' :
    lang === 'hi' ? 'प्रश्न संख्या' :
    'Question Numbers';

  const tableHeaderCol3 =
    lang === 'kn' ? 'ಒಟ್ಟು "ಹೌದು" ಅಂಕಗಳು' :
    lang === 'ta' ? 'மொத்த "ஆம்" மதிப்பெண்கள்' :
    lang === 'hi' ? 'कुल "हाँ" अंक' :
    'Total Yes Marks';

  const myTwoMainAreasLabel =
    lang === 'kn' ? 'ನನ್ನ ಎರಡು ಮುಖ್ಯ ಕ್ಷೇತ್ರಗಳು:' :
    lang === 'ta' ? 'எனது இரண்டு முக்கிய பகுதிகள்:' :
    lang === 'hi' ? 'मेरे दो मुख्य क्षेत्र हैं:' :
    'My two main areas are:';

  const basedOnYourScoresLabel =
    lang === 'kn' ? 'ನಿಮ್ಮ ಅಂಕಗಳ ಆಧಾರದ ಮೇಲೆ:' :
    lang === 'ta' ? 'உங்கள் மதிப்பெண்களின் அடிப்படையில்:' :
    lang === 'hi' ? 'आपके अंकों के आधार पर:' :
    'Based on your scores:';

  const reflectionLabel =
    lang === 'kn' ? 'ನಿಮ್ಮ ಉನ್ನತ ವ್ಯಕ್ತಿತ್ವ ಪ್ರಕಾರಗಳನ್ನು ನೀವು ಒಪ್ಪುತ್ತೀರಾ? ಹಾಗಿದ್ದರೆ, ಏಕೆ? ಇಲ್ಲದಿದ್ದರೆ, ಏಕೆ ಇಲ್ಲ?' :
    lang === 'ta' ? 'உங்கள் சிறந்த ஆளுமை வகைகளை நீங்கள் ஒப்புக்கொள்கிறீர்களா? ஆம் என்றால், ஏன்? இல்லையென்றால், ஏன் இல்லை?' :
    lang === 'hi' ? 'क्या आप अपने शीर्ष व्यक्तित्व प्रकारों से सहमत हैं? यदि हाँ, तो क्यों? यदि नहीं, तो क्यों नहीं?' :
    'Do you agree with your top personality types? If so, why? If not, why not?';

  const reflectionPlaceholder =
    lang === 'kn' ? 'ನಿಮ್ಮ ಚಿಂತನೆಗಳನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ...' :
    lang === 'ta' ? 'உங்கள் கருத்தை இங்கே எழுதவும்...' :
    lang === 'hi' ? 'अपने विचार यहाँ लिखें...' :
    'Write your reflection here...';

  const submittingLabel =
    lang === 'kn' ? 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...' :
    lang === 'ta' ? 'அனுப்புகிறது...' :
    lang === 'hi' ? 'जमा किया जा रहा है...' :
    'Submitting...';

  const submitAssessmentLabel =
    lang === 'kn' ? 'ಮೌಲ್ಯಮಾಪನ ಸಲ್ಲಿಸಿ' :
    lang === 'ta' ? 'மதிப்பீடு சமர்ப்பிக்கவும்' :
    lang === 'hi' ? 'मूल्यांकन सबमिट करें' :
    'Submit Assessment';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8" lang={lang} dir="auto">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/student')} className="text-blue-700 hover:text-blue-800 hover:bg-blue-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToDashboard')}
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-4">{localizedTitle || assessmentTitle || 'Holland Code (RIASEC) Test'}</h1>
          <div className="text-left max-w-4xl mx-auto space-y-4 text-gray-700">
            {localizedDescription ? (
              <div className="text-base leading-relaxed whitespace-pre-line">{localizedDescription}</div>
            ) : (
              <p className="text-base leading-relaxed">Loading description...</p>
            )}

            {/* Hardcoded generic explanation of RIASEC if needed, or rely on DB description containing it */}
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>{CATEGORY_LABELS[lang as 'en' | 'kn' | 'ta' | 'hi']?.R || CATEGORY_LABELS.en.R}</li>
              <li>{CATEGORY_LABELS[lang as 'en' | 'kn' | 'ta' | 'hi']?.I || CATEGORY_LABELS.en.I}</li>
              <li>{CATEGORY_LABELS[lang as 'en' | 'kn' | 'ta' | 'hi']?.A || CATEGORY_LABELS.en.A}</li>
              <li>{CATEGORY_LABELS[lang as 'en' | 'kn' | 'ta' | 'hi']?.S || CATEGORY_LABELS.en.S}</li>
              <li>{CATEGORY_LABELS[lang as 'en' | 'kn' | 'ta' | 'hi']?.E || CATEGORY_LABELS.en.E}</li>
              <li>{CATEGORY_LABELS[lang as 'en' | 'kn' | 'ta' | 'hi']?.C || CATEGORY_LABELS.en.C}</li>
            </ol>

            {localizedInstructions && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-800 mb-2">{instructionsHeader}</p>
                <div className="text-sm text-gray-700 whitespace-pre-line space-y-2">
                  {localizedInstructions}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{t('yourProgress', 'Your Progress')}</h2>
              <Badge variant="secondary">{Math.round(getProgressPercentage())}% {t('completeSuffix', 'Complete')}</Badge>
            </div>
            <Progress value={getProgressPercentage()} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>
                {lang === 'kn'
                  ? `ಒಟ್ಟು ${questions.length} ಪ್ರಶ್ನೆಗಳು`
                  : lang === 'ta'
                    ? `மொத்தம் ${questions.length} கேள்விகள்`
                    : lang === 'hi'
                      ? `कुल ${questions.length} प्रश्न`
                      : `${questions.length} Questions Total`}
              </span>
              <span>{Math.round(getProgressPercentage())}% {t('completeSuffix', 'Complete')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Questions Section */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-xl text-blue-800">{questionsSectionTitle}</CardTitle>
            <CardDescription className="text-blue-600">
              {questionsSectionDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {questions.map((question, index) => {
                const questionNum = index + 1;
                const isYes = answers[questionNum] === true;
                const isNo = answers[questionNum] === false;

                return (
                  <div key={question.id} className="flex items-start gap-4 p-4 bg-white rounded-lg border hover:border-blue-200 transition-colors">
                    <div className="flex-shrink-0 w-12 text-center font-semibold text-gray-600 pt-1">
                      {questionNum}.
                    </div>
                    <div className="flex-1">
                      <label className="block text-base text-gray-800 mb-2 cursor-pointer">
                        {getTranslatedHollandQuestion(question.sequence_number, lang, question.question_text)}
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${questionNum}`}
                            checked={isYes}
                            onChange={() => handleToggle(questionNum, true)}
                            disabled={isCompleted}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm">{yesLabel}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${questionNum}`}
                            checked={isNo}
                            onChange={() => handleToggle(questionNum, false)}
                            disabled={isCompleted}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm">{noLabel}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Scoreboard */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-xl text-blue-800">{scoreboardTitle}</CardTitle>
            <CardDescription className="text-blue-600">
              {scoreboardDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="border border-blue-300 p-3 text-left font-semibold text-blue-800">{tableHeaderCol1}</th>
                    <th className="border border-blue-300 p-3 text-center font-semibold text-blue-800">{tableHeaderCol2}</th>
                    <th className="border border-blue-300 p-3 text-center font-semibold text-blue-800">{tableHeaderCol3}</th>
                  </tr>
                </thead>
                <tbody>
                  {(['R', 'I', 'A', 'S', 'E', 'C'] as CategoryKey[]).map((category) => {
                    const questionNums = SCOREBOARD_MAPPING[category];
                    const score = scores[category];
                    const categoryLabel = (CATEGORY_LABELS[lang as 'en' | 'kn' | 'ta' | 'hi'] || CATEGORY_LABELS.en)[category];
                    return (
                      <tr key={category} className="hover:bg-blue-50">
                        <td className="border border-blue-300 p-3 font-semibold text-gray-800">{categoryLabel} ({category})</td>
                        <td className="border border-blue-300 p-3 text-center text-gray-700">
                          {questionNums.join(', ')}
                        </td>
                        <td className="border border-blue-300 p-3 text-center">
                          <div className="font-bold text-lg text-blue-700">{score}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Top Two Types */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <label className="block text-sm font-semibold text-blue-800 mb-2">
                {myTwoMainAreasLabel}
              </label>
              <Input
                type="text"
                value={topTwoTypes}
                onChange={(e) => { isDirtyRef.current = true; setTopTwoTypes(e.target.value.toUpperCase()); }}
                disabled={isCompleted}
                placeholder="e.g., R, E"
                maxLength={2}
                className="max-w-xs font-bold text-lg"
              />
              {topTwoPersonalityTypes && (
                <p className="mt-2 text-sm text-gray-600">
                  {basedOnYourScoresLabel} {topTwoPersonalityTypes}
                </p>
              )}
            </div>

            {/* Reflection Question */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                {reflectionLabel}
              </label>
              <Textarea
                value={reflection}
                onChange={(e) => { isDirtyRef.current = true; setReflection(e.target.value); }}
                disabled={isCompleted}
                placeholder={reflectionPlaceholder}
                rows={4}
                className="text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={submitAssessment}
            disabled={!canSubmit() || submitting}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                {submittingLabel}
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-3" />
                {submitAssessmentLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

