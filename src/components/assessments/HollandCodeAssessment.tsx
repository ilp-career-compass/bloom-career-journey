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
import { CheckCircle, ArrowLeft, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import { checkAssessmentUnlock } from '@/utils/assessmentUnlock';
import { AssessmentService } from '@/services/assessmentService';

type CategoryKey = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

interface HollandQuestion {
  id: string;
  category: CategoryKey;
  question_text: string;
  sequence_number: number;
}

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional',
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

      // Fetch latest existing data to merge
      const { data: existingRecords } = await supabase
        .from('assessment_responses')
        .select('responses')
        .eq('student_id', studentId)
        .eq('assessment_type', 'personality')
        .eq('assessment_title', 'Holland Code (RIASEC) Test')
        .order('updated_at', { ascending: false })
        .limit(1);

      const existing = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;

      const combinedResponses = {
        ...(existing?.responses as any || {}),
        ...currentResponses
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
        .eq('assessment_type', 'personality')
        .eq('assessment_title', 'Holland Code (RIASEC) Test')
        .select();

      let assessmentData = updateData && updateData.length > 0 ? updateData[0] : null;
      let error = updateError;

      // If no rows were updated (no existing record), insert a new one
      if (!updateError && (!updateData || updateData.length === 0)) {
        const { data: insertData, error: insertError } = await supabase
          .from('assessment_responses')
          .insert({
            student_id: studentId,
            assessment_type: 'personality',
            assessment_title: 'Holland Code (RIASEC) Test',
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

      if (error) throw error;

      toast({
        title: "Holland Code Assessment Completed! 🧭",
        description: "Your personality type has been identified successfully!",
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
          .eq('assessment_type', 'personality')
          .eq('assessment_title', 'Holland Code (RIASEC) Test')
          .order('updated_at', { ascending: false })
          .limit(1);

        const existing = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;

        const currentResponses: any = {};
        questions.forEach((q, index) => {
          const questionNum = index + 1;
          currentResponses[`question${questionNum}`] = answers[questionNum] || false;
        });
        currentResponses.scores = scores;
        currentResponses.topTwoTypes = topTwoTypes;
        currentResponses.reflection = reflection;

        const combinedResponses = {
          ...(existing?.responses as any || {}),
          ...currentResponses
        };

        // Update existing logic
        const { data: updateData, error: updateError } = await supabase
          .from('assessment_responses')
          .update({
            responses: combinedResponses,
            updated_at: new Date().toISOString()
          })
          .eq('student_id', studentId)
          .eq('assessment_type', 'personality')
          .eq('assessment_title', 'Holland Code (RIASEC) Test')
          .select();

        let error = updateError;

        if (!updateError && (!updateData || updateData.length === 0)) {
          const { error: insertError } = await supabase.from('assessment_responses').insert({
            student_id: studentId,
            assessment_type: 'personality',
            assessment_title: 'Holland Code (RIASEC) Test',
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
  }, [answers, scores, topTwoTypes, reflection, loading, isCompleted, userProfile, questions]);

  if (loading) {
    const loadingText =
      lang === 'kn'
        ? 'Holland Code ಮೌಲ್ಯಮಾಪನವನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...'
        : lang === 'ta'
          ? 'Holland Code மதிப்பீடு ஏற்றப்படுகிறது...'
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-0 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <CheckCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-blue-800">Holland Code Assessment Completed! 🧭</CardTitle>
              <CardDescription className="text-blue-600">
                Your personality type has been identified
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 mb-2">Your Top Two Personality Types:</p>
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
                    {lang === 'kn' ? 'ನನ್ನ ಉತ್ತರಗಳನ್ನು ವೀಕ್ಷಿಸಿ' : lang === 'ta' ? 'என் பதில்களை பார்' : 'View My Answers'}
                  </Button>
                  <Button onClick={() => navigate('/student')} className="bg-blue-600 hover:bg-blue-700">
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
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/student')} className="text-blue-700 hover:text-blue-800 hover:bg-blue-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToDashboard')}
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-4">{assessmentTitle || 'Holland Code (RIASEC) Test'}</h1>
          <div className="text-left max-w-4xl mx-auto space-y-4 text-gray-700">
            {description ? (
              <div className="text-base leading-relaxed whitespace-pre-line">{description}</div>
            ) : (
              <p className="text-base leading-relaxed">Loading description...</p>
            )}

            {/* Hardcoded generic explanation of RIASEC if needed, or rely on DB description containing it */}
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Realistic</li>
              <li>Investigative</li>
              <li>Artistic</li>
              <li>Social</li>
              <li>Enterprising</li>
              <li>Conventional</li>
            </ol>

            {instructions && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-800 mb-2">Instructions</p>
                <div className="text-sm text-gray-700 whitespace-pre-line space-y-2">
                  {instructions}
                </div>
              </div>
            )}
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
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-xl text-blue-800">1. Take your time and fill in these details</CardTitle>
            <CardDescription className="text-blue-600">
              Answer Yes or No for each statement
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
                        {question.question_text}
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
                          <span className="text-sm">Yes (✔)</span>
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
                          <span className="text-sm">No (✗)</span>
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
            <CardTitle className="text-xl text-blue-800">Scoreboard - Mark Your Responses</CardTitle>
            <CardDescription className="text-blue-600">
              Count the number of "Yes" responses for each category and enter the total
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="border border-blue-300 p-3 text-left font-semibold text-blue-800">Personality Type</th>
                    <th className="border border-blue-300 p-3 text-center font-semibold text-blue-800">Question Numbers</th>
                    <th className="border border-blue-300 p-3 text-center font-semibold text-blue-800">Total Yes Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((category) => {
                    const questionNums = SCOREBOARD_MAPPING[category];
                    const score = scores[category];
                    return (
                      <tr key={category} className="hover:bg-blue-50">
                        <td className="border border-blue-300 p-3 font-semibold text-gray-800">{category}</td>
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
                My two main areas are:
              </label>
              <Input
                type="text"
                value={topTwoTypes}
                onChange={(e) => setTopTwoTypes(e.target.value.toUpperCase())}
                disabled={isCompleted}
                placeholder="e.g., R, E"
                maxLength={2}
                className="max-w-xs font-bold text-lg"
              />
              {topTwoPersonalityTypes && (
                <p className="mt-2 text-sm text-gray-600">
                  Based on your scores: {topTwoPersonalityTypes}
                </p>
              )}
            </div>

            {/* Reflection Question */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Do you agree with your top personality types? If so, why? If not, why not?
              </label>
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                disabled={isCompleted}
                placeholder="Write your reflection here..."
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
      </div>
    </div>
  );
}

