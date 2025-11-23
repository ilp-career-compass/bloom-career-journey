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
  Palette,
  Heart,
  Star,
  Target,
  Lightbulb,
  TrendingUp,
  Music,
  Camera,
  BookOpen,
  Gamepad2,
  Paintbrush,
  Dumbbell,
  Code,
  CameraIcon,
  Award,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { KannadaKeyboard } from '@/components/ui/KannadaKeyboard';
import { checkAssessmentUnlock } from '@/utils/assessmentUnlock';

interface HobbyQuestion {
  id: string;
  section: string;
  question_text: string;
  help_text: string;
  sequence_number: number;
}

// Dynamic responses based on question IDs
interface HobbiesAssessmentResponse {
  [questionId: string]: string;
}

export default function MyHobbiesAssessment() {
  const { userProfile } = useAuth();
  const { t, lang } = useLang();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [hobbiesQuestions, setHobbiesQuestions] = useState<HobbyQuestion[]>([]);
  const [responses, setResponses] = useState<HobbiesAssessmentResponse>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentSection, setCurrentSection] = useState<string>('section1');
  const [helpOpen, setHelpOpen] = useState<Record<string, boolean>>({});
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const toggleHelp = (k: string) => setHelpOpen(prev => ({ ...prev, [k]: !prev[k] }));
  const [searchParams] = useSearchParams();
  const viewParam = (searchParams.get('readonly') || searchParams.get('view') || '').toLowerCase();
  const readOnlyView = viewParam === '1' || viewParam === 'true';
  const isReadOnly = isCompleted || readOnlyView;

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

      const unlockResult = await checkAssessmentUnlock(studentId, 'hobbies');
      
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
    const grouped: { [section: string]: HobbyQuestion[] } = {};
    hobbiesQuestions.forEach(question => {
      if (!grouped[question.section]) {
        grouped[question.section] = [];
      }
      grouped[question.section].push(question);
    });
    return grouped;
  }, [hobbiesQuestions]);
  
  const sections = useMemo(() => {
    const sectionsList = Object.keys(questionsBySection).sort((a, b) => {
      const order: { [key: string]: number } = { 'section1': 1, 'section2': 2, 'section3': 3 };
      return (order[a] || 99) - (order[b] || 99);
    });
    return sectionsList;
  }, [questionsBySection]);

  // Load questions from database with i18n support
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        console.log('🔄 Loading Hobbies questions from database...');
        // First, get the full question structure
        const { data, error } = await supabase.rpc('get_hobbies_questions');
        if (error) {
          console.error('Error loading hobbies questions:', error);
          return;
        }
        if (data && Array.isArray(data) && data.length > 0) {
          // Try to get translations for questions and help text
          let questionTranslations: Record<string, string> = {};
          let helpTranslations: Record<string, string> = {};
          try {
            const { data: i18nData } = await supabase.rpc('get_hobbies_questions_i18n', { p_lang: lang } as any);
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
              .eq('resource_type', 'hobbies_help')
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
          const questionsWithTranslations = (data as HobbyQuestion[]).map(q => {
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
          setHobbiesQuestions(questionsWithTranslations);
          // Initialize responses based on questions
          const initialResponses: HobbiesAssessmentResponse = {};
          questionsWithTranslations.forEach(q => {
            initialResponses[q.id] = '';
          });
          setResponses(prev => ({ ...prev, ...initialResponses }));
          
          // Set initial section
          const firstSection = questionsWithTranslations[0]?.section || 'section1';
          setCurrentSection(firstSection);
        }
      } catch (error) {
        console.error('Error loading hobbies questions:', error);
      }
    };
    loadQuestions();
  }, [lang]);

  useEffect(() => {
    if (hobbiesQuestions.length > 0) {
      checkExistingResponse();
    }
  }, [hobbiesQuestions]);

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

  // Save section function
  const saveSection = async (section: string) => {
    if (isReadOnly || !userProfile) return;
    
    const studentId = await getStudentId();
    if (!studentId) {
      toast({
        title: "Error",
        description: "Student profile not found. Please contact your teacher or support.",
        variant: "destructive",
      });
      return;
    }

    setSavingSection(section);
    try {
      console.log('💾 Saving section:', section, 'with responses:', responses);
      
      // First, check if a record exists - get the most recent one
      const { data: existingRecords, error: fetchError } = await supabase
        .from('assessment_responses')
        .select('id, responses')
        .eq('student_id', studentId)
        .eq('assessment_type', 'hobbies')
        .eq('assessment_title', 'My Talents and Hobbies')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('❌ Error fetching existing record:', fetchError);
        throw fetchError;
      }

      const existing = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;
      console.log('📋 Existing record:', existing);

      if (existing) {
        // Update existing record, merge responses
        const existingResponses = existing.responses as any || {};
        const mergedResponses = {
          ...existingResponses,
          ...responses
        };

        console.log('🔄 Merging responses:', { existing: existingResponses, current: responses, merged: mergedResponses });

        const { error } = await supabase
          .from('assessment_responses')
          .update({
            responses: mergedResponses,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        if (error) {
          console.error('❌ Error updating record:', error);
          throw error;
        }
        console.log('✅ Successfully updated existing record');
      } else {
        // Create new record
        console.log('📝 Creating new record with responses:', responses);
        const { error } = await supabase
          .from('assessment_responses')
          .insert({
            student_id: studentId,
            assessment_type: 'hobbies',
            assessment_title: 'My Talents and Hobbies',
            responses,
            updated_at: new Date().toISOString(),
            completed_at: null
          });
        
        if (error) {
          console.error('❌ Error inserting new record:', error);
          throw error;
        }
        console.log('✅ Successfully created new record');
      }

      const sectionNumber = section.replace('section', '');
      const sectionNames: Record<string, string> = {
        '1': 'Hobbies & Interests',
        '2': 'Talents & Practice',
        '3': 'Support & Career Connection'
      };

      toast({
        title: "Section Saved! ✅",
        description: `Your ${sectionNames[sectionNumber] || section} responses have been saved.`,
      });
    } catch (error) {
      console.error('Error saving section:', error);
      toast({
        title: "Error",
        description: "Failed to save section. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingSection(null);
    }
  };

  const checkExistingResponse = async () => {
    if (!userProfile || hobbiesQuestions.length === 0) {
      setLoading(false);
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
      setLoading(false);
      return;
    }

    try {
      // Get the most recent record
      const { data: existingRecords, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_type', 'hobbies')
        .eq('assessment_title', 'My Talents and Hobbies')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (existingRecords && existingRecords.length > 0 && !error) {
        const data = existingRecords[0];
        if (data.responses) {
          // Merge saved responses with initialized responses
          const savedResponses = data.responses as Partial<HobbiesAssessmentResponse>;
          const initialResponses: HobbiesAssessmentResponse = {};
          hobbiesQuestions.forEach(q => {
            initialResponses[q.id] = savedResponses[q.id] || '';
          });
          setResponses(initialResponses);
          
          if (data.completed_at) {
            setIsCompleted(true);
          }
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
    if (hobbiesQuestions.length === 0) return 0;
    const totalQuestions = hobbiesQuestions.length;
    const answeredQuestions = hobbiesQuestions.filter(q => {
      const response = responses[q.id];
      return response && response.trim() !== '';
    }).length;
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const canSubmit = () => {
    if (isReadOnly) return false;
    if (hobbiesQuestions.length === 0) return false;
    return hobbiesQuestions.every(q => {
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
      // Find existing record first (same approach as saveSection)
      const { data: existingRecords, error: fetchError } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_type', 'hobbies')
        .eq('assessment_title', 'My Talents and Hobbies')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('❌ Error fetching existing record:', fetchError);
        throw fetchError;
      }

      const existing = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;
      let assessmentData;

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('assessment_responses')
          .update({
            responses: responses,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        assessmentData = data;
      } else {
        // Create new record if none exists
        const { data, error } = await supabase
          .from('assessment_responses')
          .insert({
            student_id: studentId,
            assessment_type: 'hobbies',
            assessment_title: 'My Talents and Hobbies',
            responses: responses,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        assessmentData = data;
      }

      toast({
        title: "Talents and Hobbies Assessment Completed! 🎨",
        description: "Your hobbies and talents have been captured successfully!",
      });

      setIsCompleted(true);

      // Generate AI summary in the background
      try {
        const { aiSummaryService } = await import('@/services/aiSummaryService');
        const summaryDatabaseService = (await import('@/services/summaryDatabaseService')).summaryDatabaseService;
        
        if (aiSummaryService.isConfigured()) {
          console.log('🤖 Generating AI summary for Hobbies assessment:', assessmentData.id);
          const summaryResult = await aiSummaryService.generateHobbiesSummary(responses);

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
                description: "Your talents and hobbies summary has been generated. Your teacher will review it.",
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
                      title: `${userProfile?.full_name || 'Student'} completed My Talents and Hobbies assessment`,
                      message: 'A new My Talents and Hobbies assessment summary is ready for review.',
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your hobbies assessment...</p>
        </div>
      </div>
    );
  }

  if (isCompleted && !readOnlyView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-0 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-orange-50 to-pink-50">
              <Palette className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-orange-800">Talents and Hobbies Assessment Completed! 🎨</CardTitle>
              <CardDescription className="text-orange-600">
                You've successfully shared your hobbies and talents
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Thank you for sharing your hobbies and talents! Your responses have been saved and your teacher can now review them to help identify potential career paths based on your interests.
                </p>
                <div className="flex justify-center gap-4">
                  <Button 
                    variant="outline" 
                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      if (!params.get('lang') && lang) {
                        params.set('lang', lang);
                      }
                      params.set('readonly', '1');
                      navigate(`/student/assessment/hobbies?${params.toString()}`);
                    }}
                  >
                    {lang === 'kn' ? 'ನನ್ನ ಉತ್ತರಗಳನ್ನು ವೀಕ್ಷಿಸಿ' : 'View My Answers'}
                  </Button>
                  <Button 
                    onClick={() => navigate('/student')}
                    className="bg-orange-600 hover:bg-orange-700"
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
		<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 py-8" lang={lang} dir="auto">
			<div className="container mx-auto px-4">
				<TooltipProvider>
        <div className="text-left mb-2">
          <Button variant="ghost" onClick={() => navigate('/student')} className="text-orange-700 hover:text-orange-800 hover:bg-orange-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-2"><path fillRule="evenodd" d="M12.53 3.47a.75.75 0 010 1.06L6.31 10.75H21a.75.75 0 010 1.5H6.31l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" clipRule="evenodd" /></svg>
            {t('backToDashboard')}
          </Button>
        </div>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-800 mb-2">🎨 My Talents and Hobbies</h1>
          
          {/* Description Text */}
          <div className="max-w-3xl mx-auto space-y-4 text-gray-700 mt-4">
            <p className="text-base leading-relaxed">
              In this practice section, we delve into your interests, hobbies, pastimes, and activities that bring you joy, exploring the depths of your creativity. By delving into your hobbies and interests, you can not only find happiness but also identify your unique learning style and potential professions aligned with your passions.
            </p>
            <p className="text-base leading-relaxed">
              Through this activity, you will explore your talents, hobbies, and the work/activities that bring you joy. This will help you understand your interests, hobbies, and areas of talent, and guide you in identifying careers that suit your personality, interests, and passions.
            </p>
            <p className="text-base leading-relaxed italic text-orange-700 font-medium">
              "Hobbies bring out our talents and inspire us to pursue our dreams."
            </p>
            
            {/* Definitions Section */}
            <div className="mt-6 space-y-4 text-left bg-orange-50 p-6 rounded-lg border border-orange-200">
              <div>
                <h3 className="font-semibold text-orange-800 mb-2">Section I: What is a hobby?</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>It is an activity that we do for fun, after our daily chores.</li>
                  <li>Work done to pass the time or to give pleasure to the mind.</li>
                  <li>A hobby is something that can be learnt and developed over time.</li>
                </ul>
                <p className="mt-2 text-gray-600">
                  <strong>Examples:</strong> Drawing, singing, reading, dancing, bird watching, gardening, etc.
                </p>
              </div>
              
              <div className="mt-4">
                <h3 className="font-semibold text-orange-800 mb-2">Section II: What is talent?</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>A natural ability that we are born with.</li>
                  <li>A skill that can be done easily without much practice.</li>
                  <li>This can lead to immense achievement with more practice.</li>
                </ul>
                <p className="mt-2 text-gray-600">
                  <strong>Examples:</strong> The ability to sing naturally, communicate clearly, answer questions quickly in math, learn quickly, etc.
                </p>
              </div>
            </div>
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
              <span>Section {sections.indexOf(currentSection) + 1} of {sections.length} • {hobbiesQuestions.length} Questions Total</span>
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
              if (sectionKey === 'section1') sectionTitle = 'Section 1: Hobbies & Interests';
              else if (sectionKey === 'section2') sectionTitle = 'Section 2: Talents & Practice';
              else if (sectionKey === 'section3') sectionTitle = 'Section 3: Support & Career Connection';
              else sectionTitle = `Section ${sectionNumber}`;
              
              return (
                <button
                  key={sectionKey}
                  onClick={() => setCurrentSection(sectionKey)}
                  className={`px-6 py-2 rounded-md transition-all ${
                    currentSection === sectionKey
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-orange-600'
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
          let headerColor = 'from-orange-50 to-pink-50';
          let titleColor = 'text-orange-800';
          let descColor = 'text-orange-600';
          
          if (sectionKey === 'section1') {
            sectionTitle = 'Section 1: Hobbies & Interests';
            sectionDescription = 'Share your thoughts about your hobbies and what inspires them';
          } else if (sectionKey === 'section2') {
            sectionTitle = 'Section 2: Talents & Practice';
            sectionDescription = 'Explore your natural talents and how you develop them';
            headerColor = 'from-pink-50 to-purple-50';
            titleColor = 'text-pink-800';
            descColor = 'text-pink-600';
          } else if (sectionKey === 'section3') {
            sectionTitle = 'Section 3: Support & Career Connection';
            sectionDescription = 'Reflect on support systems and career possibilities from your hobbies';
            headerColor = 'from-purple-50 to-indigo-50';
            titleColor = 'text-purple-800';
            descColor = 'text-purple-600';
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
                      
                      // Format label with number
                      const hasNumber = /^\d+\.\s/.test(question.question_text || '');
                      const label = hasNumber 
                        ? question.question_text 
                        : `${questionNumber}. ${question.question_text}`;
                      
                      // Get icon based on section
                      const icons = [
                        Palette, Heart, Star, TrendingUp, Lightbulb, Target, Award,
                        Award, TrendingUp, BookOpen, Users, CheckCircle, Target, Award
                      ];
                      const IconComponent = icons[index % icons.length] || Palette;
                      
                      return (
                        <div key={question.id} className="border-l-4 border-orange-400 pl-6">
                          <label className="block text-base font-medium text-gray-800 mb-2 flex items-center gap-2">
                            <IconComponent className="w-5 h-5 text-orange-500" />
                            {label}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button 
                                  type="button" 
                                  aria-label="Help" 
                                  className="text-orange-600 hover:text-orange-700"
                                  onClick={() => toggleHelp(helpKey)}
                                >
                                  💬
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">{helpText}</TooltipContent>
                            </Tooltip>
                          </label>
                          {isOpen && (
                            <div className="mb-2 p-3 rounded border bg-orange-50 border-orange-200 text-sm text-orange-800">
                              {helpText}
                            </div>
                          )}
                          <Textarea
                            placeholder={helpText || `Write your answer here...`}
                            value={questionValue}
                            onChange={(e) => handleResponseChange(question.id, e.target.value)}
                            readOnly={isReadOnly || isCompleted}
                            rows={4}
                            className="text-base border-orange-200 focus:border-orange-400"
                          />
                        </div>
                      );
                    })}
                    
                    {/* Save Section Button */}
                    {!isReadOnly && !isCompleted && (
                      <div className="flex justify-end mt-6 pt-4 border-t border-orange-200">
                        <Button
                          onClick={() => saveSection(sectionKey)}
                          disabled={savingSection === sectionKey || savingSection !== null}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          {savingSection === sectionKey ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Save Section
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}

        {/* Submit Button */}
        <div className="flex justify-center mt-8">
          <Button
            onClick={submitAssessment}
            disabled={!canSubmit() || submitting || isReadOnly}
            size="lg"
            className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white px-8 py-3 text-lg"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                {t('submitting')}
              </>
            ) : (
              <>
                <Palette className="w-5 h-5 mr-3" />
                {t('submitAssessment')}
              </>
            )}
          </Button>
        </div>

        {/* Hobby Icons Inspiration */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Common Hobby Categories</h3>
          <div className="flex flex-wrap justify-center gap-6 text-gray-500">
            <div className="flex flex-col items-center gap-2">
              <Music className="w-8 h-8" />
              <span className="text-sm">Music</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Camera className="w-8 h-8" />
              <span className="text-sm">Photography</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <BookOpen className="w-8 h-8" />
              <span className="text-sm">Reading</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Gamepad2 className="w-8 h-8" />
              <span className="text-sm">Gaming</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Paintbrush className="w-8 h-8" />
              <span className="text-sm">Art</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Dumbbell className="w-8 h-8" />
              <span className="text-sm">Sports</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Code className="w-8 h-8" />
              <span className="text-sm">Technology</span>
            </div>
          </div>
        </div>
				</TooltipProvider>
			</div>
      <KannadaKeyboard lang={lang} />
    </div>
  );
}
