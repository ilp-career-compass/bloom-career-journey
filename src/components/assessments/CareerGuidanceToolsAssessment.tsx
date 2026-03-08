import { logger } from '@/lib/logger';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CheckCircle, ArrowLeft, Globe, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';

import { KannadaKeyboard } from '@/components/ui/KannadaKeyboard';
import { checkAssessmentUnlock } from '@/utils/assessmentUnlock';

interface CareerGuidanceQuestion {
  id: string;
  question_text: string;
  question_type: 'textarea' | 'checkbox' | 'input';
  help_text: string;
  sequence_number: number;
}

interface CareerGuidanceResponse {
  question1: string;
  question2: string;
  question3: string;
  question4: string;
  question5: string;
  question6: boolean;
  question7: string;
}

export default function CareerGuidanceToolsAssessment() {
  const { userProfile } = useAuth();
  const { t, lang } = useLang();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const readOnlyView = ['1', 'true'].includes((searchParams.get('readonly') || searchParams.get('view') || '').toLowerCase());
  const [questions, setQuestions] = useState<CareerGuidanceQuestion[]>([]);
  const [responses, setResponses] = useState<CareerGuidanceResponse>({
    question1: '',
    question2: '',
    question3: '',
    question4: '',
    question5: '',
    question6: false,
    question7: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [helpOpen, setHelpOpen] = useState<Record<string, boolean>>({});
  const toggleHelp = (k: string) => setHelpOpen(prev => ({ ...prev, [k]: !prev[k] }));



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

      const unlockResult = await checkAssessmentUnlock(studentId, 'career_guidance_tools');

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

  const [dbTitle, setDbTitle] = useState<string>('');
  const [dbIntro, setDbIntro] = useState<string>('');

  // Load questions from database with localization
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        logger.log('🔄 Loading Career Guidance Tools questions from database...');
        // Pass language to RPC
        const { data, error } = await supabase.rpc('get_career_guidance_tools_questions', { p_lang: lang } as any);
        if (error) {
          logger.error('Error loading Career Guidance Tools questions:', error);
          return;
        }
        if (data && Array.isArray(data) && data.length > 0) {
          logger.log('✅ Database questions loaded:', data.length, 'questions');
          setQuestions(data as CareerGuidanceQuestion[]);
        }

        // Fetch Module Content
        const { data: moduleData } = await supabase
          .from('content_translations')
          .select('resource_key, text')
          .eq('resource_type', 'career_guidance_tools_module')
          .eq('lang', lang)
          .in('resource_key', ['title', 'intro']);

        if (moduleData) {
          const tTitle = moduleData.find(i => i.resource_key === 'title')?.text;
          const tIntro = moduleData.find(i => i.resource_key === 'intro')?.text;

          if (tTitle) setDbTitle(tTitle);
          if (tIntro) setDbIntro(tIntro);
        }

      } catch (error) {
        logger.error('Error loading Career Guidance Tools questions:', error);
      } finally {
        setLoading(false);
      }
    };
    loadQuestions();
  }, [lang]); // Re-run when language changes

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
          .eq('assessment_type', 'career_guidance_tools')
          .eq('assessment_title', 'Exploring Career Guidance Tools')
          .maybeSingle();

        if (data && !error && data.responses) {
          const savedResponses = data.responses as Partial<CareerGuidanceResponse>;
          setResponses(prev => ({
            question1: savedResponses.question1 || prev.question1,
            question2: savedResponses.question2 || prev.question2,
            question3: savedResponses.question3 || prev.question3,
            question4: savedResponses.question4 || prev.question4,
            question5: savedResponses.question5 || prev.question5,
            question6: savedResponses.question6 !== undefined ? savedResponses.question6 : prev.question6,
            question7: savedResponses.question7 || prev.question7
          }));

          if (data.completed_at) {
            setIsCompleted(true);
          }
        }
      } catch (error) {
        logger.error('Error loading existing response:', error);
      }
    };

    loadExistingResponse();
  }, [questions, userProfile]);

  const handleResponseChange = (questionKey: keyof CareerGuidanceResponse, value: string | boolean) => {
    setResponses(prev => ({
      ...prev,
      [questionKey]: value
    }));
  };

  const getProgressPercentage = () => {
    if (questions.length === 0) return 0;
    const totalQuestions = questions.length;
    let answeredQuestions = 0;

    questions.forEach((q, index) => {
      const questionKey = `question${index + 1}` as keyof CareerGuidanceResponse;
      const response = responses[questionKey];
      if (q.question_type === 'checkbox') {
        if (typeof response === 'boolean') answeredQuestions++;
      } else {
        if (typeof response === 'string' && response.trim() !== '') answeredQuestions++;
      }
    });

    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const canSubmit = () => {
    if (questions.length === 0) return false;
    return questions.every((q, index) => {
      const questionKey = `question${index + 1}` as keyof CareerGuidanceResponse;
      const response = responses[questionKey];
      if (q.question_type === 'checkbox') {
        return typeof response === 'boolean';
      } else {
        return typeof response === 'string' && response.trim() !== '';
      }
    });
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

    setSubmitting(true);
    try {
      // Fetch latest existing data to merge
      const { data: existingRecords } = await supabase
        .from('assessment_responses')
        .select('responses')
        .eq('student_id', studentId)
        .eq('assessment_type', 'career_guidance_tools')
        .eq('assessment_title', 'Exploring Career Guidance Tools')
        .order('updated_at', { ascending: false })
        .limit(1);

      const existing = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;

      const combinedResponses = {
        ...(existing?.responses as any || {}),
        ...responses
      };

      // First try to update existing record
      const { data: updateData, error: updateError } = await supabase
        .from('assessment_responses')
        .update({
          responses: combinedResponses,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('student_id', studentId)
        .eq('assessment_type', 'career_guidance_tools')
        .eq('assessment_title', 'Exploring Career Guidance Tools')
        .select();

      let assessmentData = updateData && updateData.length > 0 ? updateData[0] : null;
      let error = updateError;

      // If no rows were updated (no existing record), insert a new one
      if (!updateError && (!updateData || updateData.length === 0)) {
        const { data: insertData, error: insertError } = await supabase
          .from('assessment_responses')
          .insert({
            student_id: studentId,
            assessment_type: 'career_guidance_tools',
            assessment_title: 'Exploring Career Guidance Tools',
            responses: combinedResponses,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        assessmentData = insertData;
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Career Guidance Tools Assessment Completed! 🌐",
        description: "Your responses have been captured successfully!",
      });

      setIsCompleted(true);
    } catch (error) {
      logger.error('Error submitting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-save drafts when answers change (debounced)
  useEffect(() => {
    if (loading || isCompleted || questions.length === 0) return;
    const timer = setTimeout(async () => {
      try {
        if (!userProfile?.id) return;
        let studentId = userProfile.studentProfile?.id as string | undefined;
        if (!studentId) {
          const { data: row } = await supabase.from('students').select('id').eq('user_id', userProfile.id).maybeSingle();
          studentId = row?.id;
        }
        if (!studentId) return;

        // Fetch latest data to avoid race conditions
        const { data: existingRecords } = await supabase
          .from('assessment_responses')
          .select('responses')
          .eq('student_id', studentId)
          .eq('assessment_type', 'career_guidance_tools')
          .eq('assessment_title', 'Exploring Career Guidance Tools')
          .order('updated_at', { ascending: false })
          .limit(1);

        const existing = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;

        const combinedResponses = {
          ...(existing?.responses as any || {}),
          ...responses
        };

        // First try to update existing record
        const { data: updateData, error: updateError } = await supabase
          .from('assessment_responses')
          .update({
            responses: combinedResponses,
            updated_at: new Date().toISOString()
          })
          .eq('student_id', studentId)
          .eq('assessment_type', 'career_guidance_tools')
          .eq('assessment_title', 'Exploring Career Guidance Tools')
          .select();

        let error = updateError;

        if (!updateError && (!updateData || updateData.length === 0)) {
          const { error: insertError } = await supabase.from('assessment_responses').insert({
            student_id: studentId,
            assessment_type: 'career_guidance_tools',
            assessment_title: 'Exploring Career Guidance Tools',
            responses: combinedResponses,
            updated_at: new Date().toISOString(),
            completed_at: null
          });
          error = insertError;
        }

        if (error) throw error;
      } catch { }
    }, 800);
    return () => clearTimeout(timer);
  }, [responses, loading, isCompleted, userProfile, questions]);

  if (loading) {
    const loadingText =
      lang === 'kn'
        ? 'Career Guidance Tools ಮೌಲ್ಯಮಾಪನವನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...'
        : lang === 'ta'
          ? 'Career Guidance Tools மதிப்பீடு ஏற்றப்படுகிறது...'
          : 'Loading Career Guidance Tools assessment...';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">{loadingText}</p>
        </div>
      </div>
    );
  }

  if (isCompleted && !readOnlyView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-0 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-purple-50 to-indigo-50">
              <CheckCircle className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-purple-800">Career Guidance Tools Assessment Completed! 🌐</CardTitle>
              <CardDescription className="text-purple-600">
                Your responses have been saved successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Thank you for completing the Career Guidance Tools assessment! Your responses have been saved and your teacher can review them.
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('readonly', '1');
                      navigate(`/student/assessment/career-guidance-tools?${params.toString()}`);
                    }}
                  >
                    {lang === 'kn' ? 'ನನ್ನ ಉತ್ತರಗಳನ್ನು ವೀಕ್ಷಿಸಿ' : lang === 'ta' ? 'என் பதில்களை பார்' : 'View My Answers'}
                  </Button>
                  <Button onClick={() => navigate('/student')} className="bg-purple-600 hover:bg-purple-700">
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8" lang={lang} dir="auto">
      <div className="container mx-auto px-4">

        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/student')} className="text-purple-700 hover:text-purple-800 hover:bg-purple-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToDashboard')}
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-800 mb-4">🌐 {dbTitle || '8. Exploring Career Guidance Tools'}</h1>
          <div className="text-left max-w-4xl mx-auto space-y-4 text-gray-700">
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {dbIntro || `(Career Guidance Chart, Career Planner, Website, Mobile App & WhatsApp Chatbot)

After your teacher guides you through the career chart, career guidance workbook, website and whatsapp chatbot, answer the following questions in this activity.`}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Your Progress</h2>
              <Badge variant="secondary">{Math.round(getProgressPercentage())}% Complete</Badge>
            </div>
            <Progress value={getProgressPercentage()} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>{questions.length} Questions Total</span>
              <span>{Math.round(getProgressPercentage())}% Complete</span>
            </div>
          </CardContent>
        </Card>

        {/* Questions Section */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardTitle className="text-xl text-purple-800">Assessment Questions</CardTitle>
            <CardDescription className="text-purple-600">
              Answer each question based on your exploration of career guidance tools
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {questions.map((question, index) => {
                const questionKey = `question${index + 1}` as keyof CareerGuidanceResponse;
                const response = responses[questionKey];
                const helpKey = question.id;
                const isOpen = !!helpOpen[helpKey];

                return (
                  <div key={question.id} className="border-l-4 border-purple-400 pl-6">
                    <label className="block text-base font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <span className="font-semibold">{index + 1}.</span>
                      {question.question_text}
                      <button
                        type="button"
                        aria-label="Help"
                        className="text-purple-600 hover:text-purple-700"
                        onClick={() => toggleHelp(helpKey)}
                      >
                        💬
                      </button>
                    </label>
                    {isOpen && (
                      <div className="mb-2 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-800">
                        {question.help_text}
                      </div>
                    )}
                    {question.question_type === 'textarea' && (
                      <Textarea
                        placeholder={question.help_text}
                        value={typeof response === 'string' ? response : ''}
                        onChange={(e) => handleResponseChange(questionKey, e.target.value)}
                        disabled={isCompleted}
                        rows={4}
                        className="text-base border-purple-200 focus:border-purple-400"
                      />
                    )}
                    {question.question_type === 'input' && (
                      <Input
                        type="text"
                        placeholder={question.help_text}
                        value={typeof response === 'string' ? response : ''}
                        onChange={(e) => handleResponseChange(questionKey, e.target.value)}
                        disabled={isCompleted}
                        className="text-base border-purple-200 focus:border-purple-400"
                      />
                    )}
                    {question.question_type === 'checkbox' && (
                      <div className="flex items-center gap-6 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={questionKey}
                            id={`${questionKey}-yes`}
                            checked={typeof response === 'boolean' && response === true}
                            onChange={() => handleResponseChange(questionKey, true)}
                            disabled={isCompleted}
                            className="w-4 h-4 text-purple-600 border-purple-300 focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={questionKey}
                            id={`${questionKey}-no`}
                            checked={typeof response === 'boolean' && response === false}
                            onChange={() => handleResponseChange(questionKey, false)}
                            disabled={isCompleted}
                            className="w-4 h-4 text-purple-600 border-purple-300 focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium text-gray-700">No</span>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center mt-8 mb-8">
          <Button
            onClick={submitAssessment}
            disabled={!canSubmit() || submitting}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 text-lg"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-3" />
                Submit Assessment
              </>
            )}
          </Button>
        </div>

        <KannadaKeyboard lang={lang} />
      </div>
    </div>
  );
}
