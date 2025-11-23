import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  Users,
  Heart,
  Star,
  Target,
  Lightbulb,
  TrendingUp,
  UserCheck,
  MessageCircle,
  Award,
  BookOpen,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import { ArrowLeft } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { KannadaKeyboard } from '@/components/ui/KannadaKeyboard';
import { checkAssessmentUnlock } from '@/utils/assessmentUnlock';

interface RoleModel {
  name: string;
  relationship: string;
  admirationReasons: string;
  profession: string;
  desiredQualities: string;
  careerDiscussed: string;
  opinion: string;
  willingToHelp: string;
  helpLookingFor: string;
  similarities: string;
  incorporatePlan: string;
}

interface RoleModelsAssessmentResponse {
  roleModel1: RoleModel;
  roleModel2: RoleModel;
  roleModel3: RoleModel;
  question12: string; // Similarities between personality traits
  question13: string; // How to cultivate and incorporate qualities
}

export default function MyRoleModelsAssessment() {
  const { userProfile } = useAuth();
  const { t, lang } = useLang();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const readOnlyView = ['1','true'].includes((searchParams.get('readonly')||searchParams.get('view')||'').toLowerCase());
  const [responses, setResponses] = useState<RoleModelsAssessmentResponse>({
    roleModel1: {
      name: '',
      relationship: '',
      admirationReasons: '',
      profession: '',
      desiredQualities: '',
      careerDiscussed: '',
      opinion: '',
      willingToHelp: '',
      helpLookingFor: '',
      similarities: '',
      incorporatePlan: ''
    },
    roleModel2: {
      name: '',
      relationship: '',
      admirationReasons: '',
      profession: '',
      desiredQualities: '',
      careerDiscussed: '',
      opinion: '',
      willingToHelp: '',
      helpLookingFor: '',
      similarities: '',
      incorporatePlan: ''
    },
    roleModel3: {
      name: '',
      relationship: '',
      admirationReasons: '',
      profession: '',
      desiredQualities: '',
      careerDiscussed: '',
      opinion: '',
      willingToHelp: '',
      helpLookingFor: '',
      similarities: '',
      incorporatePlan: ''
    },
    question12: '',
    question13: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentTab, setCurrentTab] = useState<'roleModel1' | 'roleModel2' | 'roleModel3'>('roleModel1');
  const [saving, setSaving] = useState(false);
  const [savedTabs, setSavedTabs] = useState<Partial<Record<keyof RoleModelsAssessmentResponse, string>>>({});
  const [q, setQ] = useState<Record<string, string>>({});

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

      const unlockResult = await checkAssessmentUnlock(studentId, 'role_models');
      
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

  useEffect(() => {
    checkExistingResponse();
  }, []);

  useEffect(() => {
    const loadI18n = async () => {
      try {
        const { data } = await supabase.rpc('get_role_models_questions_i18n', { p_lang: lang } as any);
        const arr = Array.isArray(data) ? data : (data?.data || []);
        const map: Record<string, string> = {};
        (arr || []).forEach((row: any) => { if (row?.key) map[row.key] = row.text; });
        setQ(map);
      } catch {}
    };
    loadI18n();
  }, [lang]);

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

  // Auto-save drafts on changes (debounced)
  useEffect(() => {
    if (loading || isCompleted) return;
    const t = setTimeout(async () => {
      try {
        if (!userProfile?.id) return;
        let studentId = userProfile.studentProfile?.id as string | undefined;
        if (!studentId) {
          const { data: row } = await supabase.from('students').select('id').eq('user_id', userProfile.id).maybeSingle();
          studentId = row?.id;
        }
        if (!studentId) return;
        await supabase.from('assessment_responses').upsert({
          student_id: studentId,
          assessment_type: 'role_models',
          assessment_title: 'My Role Models',
          responses,
          updated_at: new Date().toISOString(),
          completed_at: null
        });
      } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [responses, loading, isCompleted, userProfile]);

  const checkExistingResponse = async () => {
    if (!userProfile) return;

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

    if (!studentId) return;

    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_type', 'role_models')
        .eq('assessment_title', 'My Role Models')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setIsCompleted(!!data.completed_at);
        const loadedResponses = data.responses as any || {};
        setResponses({
          roleModel1: { ...responses.roleModel1, ...(loadedResponses.roleModel1 || {}) },
          roleModel2: { ...responses.roleModel2, ...(loadedResponses.roleModel2 || {}) },
          roleModel3: { ...responses.roleModel3, ...(loadedResponses.roleModel3 || {}) },
          question12: loadedResponses.question12 || '',
          question13: loadedResponses.question13 || ''
        });
      }
    } catch (error) {
      // No existing response found, which is fine
    } finally {
      setLoading(false);
    }
  };

  const isRoleModelComplete = (key: keyof RoleModelsAssessmentResponse) => {
    if (key === 'question12' || key === 'question13') {
      return responses[key].trim() !== '';
    }
    const roleModel = responses[key] as RoleModel;
    return Object.values(roleModel).every(v => v.trim() !== '');
  };

  const isRoleModelSaved = (key: keyof RoleModelsAssessmentResponse) => {
    return !!savedTabs[key];
  };

  const saveCurrentRoleModel = async () => {
    if (!userProfile) return;
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
      toast({ title: 'Error', description: 'Student profile not found.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('assessment_responses')
        .upsert({
          student_id: studentId,
          assessment_type: 'role_models',
          assessment_title: 'My Role Models',
          responses,
          updated_at: new Date().toISOString(),
          completed_at: null
        });
      if (error) throw error;
      const label = currentTab === 'roleModel1' 
        ? 'Role Model -1 (Preferably Closely Known Person)' 
        : currentTab === 'roleModel2' 
        ? 'Role Model -2 (Known Person)' 
        : 'Role Model -3 (Known/Famous Person)';
      toast({ title: 'Progress Saved', description: `${label} progress saved successfully.` });
      setSavedTabs(prev => ({ ...prev, [currentTab]: new Date().toISOString() }));
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save progress. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRoleModelChange = (roleModelKey: keyof RoleModelsAssessmentResponse, field: keyof RoleModel, value: string) => {
    setResponses(prev => ({
      ...prev,
      [roleModelKey]: {
        ...prev[roleModelKey],
        [field]: value
      }
    }));
  };

  const handleGeneralQuestionChange = (questionKey: 'question12' | 'question13', value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionKey]: value
    }));
  };

  const getProgressPercentage = () => {
    const totalQuestions = 35; // 11 questions × 3 role models + 2 general questions
    let answeredQuestions = 0;
    
    // Count answered questions for each role model
    ['roleModel1', 'roleModel2', 'roleModel3'].forEach(key => {
      const roleModel = responses[key as keyof RoleModelsAssessmentResponse] as RoleModel;
      answeredQuestions += Object.values(roleModel).filter(v => v.trim() !== '').length;
    });
    
    // Count general questions
    if (responses.question12.trim() !== '') answeredQuestions++;
    if (responses.question13.trim() !== '') answeredQuestions++;
    
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const canSubmit = () => {
    // Check all role models are complete
    const allRoleModelsComplete = ['roleModel1', 'roleModel2', 'roleModel3'].every(key => {
      const roleModel = responses[key as keyof RoleModelsAssessmentResponse] as RoleModel;
      return Object.values(roleModel).every(v => v.trim() !== '');
    });
    
    // Check general questions are complete
    const generalQuestionsComplete = responses.question12.trim() !== '' && responses.question13.trim() !== '';
    
    return allRoleModelsComplete && generalQuestionsComplete;
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
      const { data: assessmentData, error } = await supabase
        .from('assessment_responses')
        .upsert({
          student_id: studentId,
          assessment_type: 'role_models',
          assessment_title: 'My Role Models',
          responses: responses,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Role Models Assessment Completed! ❤️",
        description: "Your role models and inspirations have been captured successfully!",
      });

      setIsCompleted(true);

      // Generate AI summary in the background
      try {
        const { aiSummaryService } = await import('@/services/aiSummaryService');
        const summaryDatabaseService = (await import('@/services/summaryDatabaseService')).summaryDatabaseService;
        
        if (aiSummaryService.isConfigured() && assessmentData?.id) {
          console.log('🤖 Generating AI summary for Role Models assessment:', assessmentData.id);
          const summaryResult = await aiSummaryService.generateRoleModelsSummary(responses);

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
                description: "Your role models summary has been generated. Your teacher will review it.",
              });

              // Notify teacher(s) assigned to this student
              try {
                const { notificationService } = await import('@/services/notificationService');
                
                // Find teacher(s) for this student
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
                      title: `${userProfile?.full_name || 'Student'} completed My Role Models assessment`,
                      message: 'A new My Role Models assessment summary is ready for review.',
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your role models assessment...</p>
        </div>
      </div>
    );
  }

  if (isCompleted && !readOnlyView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-0 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-purple-50 to-pink-50">
              <Users className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-purple-800">Role Models Assessment Completed! 🎯</CardTitle>
              <CardDescription className="text-purple-600">
                You've successfully identified and analyzed your role models
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Thank you for sharing your role model insights! Your responses have been saved and your teacher can now review them to help guide your personal development.
                </p>
                <div className="flex justify-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('readonly', '1');
                      navigate(`/student/assessment/role-models?${params.toString()}`);
                    }}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    {lang === 'kn' ? 'ನನ್ನ ಉತ್ತರಗಳನ್ನು ವೀಕ್ಷಿಸಿ' : 'View My Answers'}
                  </Button>
                  <Button 
                    onClick={() => navigate('/student')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Back to Dashboard
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8" lang={lang} dir="auto">
      <div className="container mx-auto px-4">
        <TooltipProvider>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-left mb-2">
            <Button variant="ghost" onClick={() => navigate('/student')} className="text-purple-700 hover:text-purple-800 hover:bg-purple-50">
              <ArrowLeft className="w-4 h-4 mr-2" />{t('backToDashboard')}
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-purple-800 mb-4">🎯 6. My Role Models</h1>
          <div className="text-left max-w-4xl mx-auto space-y-4 text-gray-700">
            <p className="text-base leading-relaxed">
              In our lives, we often admire individuals for their personality traits, viewing them as role models. These individuals, be they influencers, inspiring figures, or those we know personally, contribute significantly to shaping our character.
            </p>
            <p className="text-base leading-relaxed">
              In this segment of our reflection, we will delve into the influential figures who have played a significant role in shaping our personalities. These individuals have contributed immensely to our development. If you happen to know such people personally, it's advantageous as you can observe them closely. Alternatively, you can also consider inspirational personalities as a source of inspiration and learning.
            </p>
            <p className="text-purple-600 italic mt-4">
              <strong>Suggestion:</strong> If possible, it might be beneficial to select a role model who has pursued the profession you're interested in. Their journey could provide valuable insights and inspiration for your own path.
            </p>
            <p className="text-gray-700 mt-3 font-medium">
              When responding to the questions provided, focus on highlighting their qualities, traits, and talents.
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
              <span>3 Role Models • 11 questions each • 2 General Questions</span>
              <span>{Math.round(getProgressPercentage())}% {t('completeSuffix')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Navigation */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-white rounded-lg p-1 shadow-md gap-1">
            <button
              onClick={() => setCurrentTab('roleModel1')}
              className={`px-3 py-2 rounded-md transition-all text-xs text-center min-w-[140px] ${
                currentTab === 'roleModel1'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <div>Role Model -1</div>
              <div className="text-[10px] mt-0.5">(Preferably Closely Known Person)</div>
            </button>
            <button
              onClick={() => setCurrentTab('roleModel2')}
              className={`px-3 py-2 rounded-md transition-all text-xs text-center min-w-[140px] ${
                currentTab === 'roleModel2'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <div>Role Model -2</div>
              <div className="text-[10px] mt-0.5">(Known Person)</div>
            </button>
            <button
              onClick={() => setCurrentTab('roleModel3')}
              className={`px-3 py-2 rounded-md transition-all text-xs text-center min-w-[140px] ${
                currentTab === 'roleModel3'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <div>Role Model -3</div>
              <div className="text-[10px] mt-0.5">(Known/Famous Person)</div>
            </button>
          </div>
        </div>

        {/* Current Tab Content */}
        <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-xl text-purple-800">
                {currentTab === 'roleModel1' 
                  ? 'Role Model -1 (Preferably Closely Known Person)' 
                  : currentTab === 'roleModel2' 
                  ? 'Role Model -2 (Known Person)' 
                  : 'Role Model -3 (Known/Famous Person)'}
              </CardTitle>
              <CardDescription className="text-purple-600">
                Answer all 11 questions for this role model
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-8">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        {q['rm_q1'] || '1. Name your role model.'}
                        <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>Enter the full name of your role model. This can be a person you know personally or a well-known figure who inspires you.</TooltipContent></Tooltip>
                      </label>
                      <Input
                        placeholder="Enter the full name of your role model"
                        value={responses[currentTab].name}
                        onChange={(e) => handleRoleModelChange(currentTab, 'name', e.target.value)}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        {q['rm_q2'] || '2. Are you personally related to this individual? If so, do they belong to your family, relatives, school, a broader community, or are they a familiar acquaintance?'}
                        <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>Describe your relationship with this person. Indicate if they are family, a relative, someone from school, part of your community, or a familiar acquaintance. If they are a public figure or celebrity you don't know personally, you can mention that as well.</TooltipContent></Tooltip>
                      </label>
                      <Input
                        placeholder="Family, relatives, school, community, acquaintance, or public figure..."
                        value={responses[currentTab].relationship}
                        onChange={(e) => handleRoleModelChange(currentTab, 'relationship', e.target.value)}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        {q['rm_q3'] || '3. What qualities about your role model do you admire the most? Please list the specific qualities that you appreciate, and also share what makes them special in your eyes.'}
                        <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>List specific traits such as kindness, resilience, intelligence, leadership, creativity, honesty, compassion, determination, or any other qualities. Explain why these qualities stand out to you and what makes this person unique and special in your eyes. Be detailed and specific about how these qualities have impacted you.</TooltipContent></Tooltip>
                      </label>
                      <Textarea
                        placeholder="List specific qualities you admire and explain what makes them special..."
                        value={responses[currentTab].admirationReasons}
                        onChange={(e) => handleRoleModelChange(currentTab, 'admirationReasons', e.target.value)}
                        rows={3}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        {q['rm_q4'] || '4. What is their occupation or profession?'}
                        <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>Describe their job or profession. If they are retired, mention what they used to do. If they are a student or in a different stage of life, describe their current role or career path.</TooltipContent></Tooltip>
                      </label>
                      <Input
                        placeholder="Describe their occupation or profession..."
                        value={responses[currentTab].profession}
                        onChange={(e) => handleRoleModelChange(currentTab, 'profession', e.target.value)}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        {q['rm_q5'] || '5. What talents or skills do you aspire to develop based on the abilities demonstrated by your role models?'}
                        <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>Think about the specific talents, skills, or abilities your role model possesses that you would like to develop in yourself. This could include technical skills, soft skills, personal qualities, or professional capabilities. Be specific about what you want to learn or develop.</TooltipContent></Tooltip>
                      </label>
                      <Input
                        placeholder="List the talents or skills you want to develop..."
                        value={responses[currentTab].desiredQualities}
                        onChange={(e) => handleRoleModelChange(currentTab, 'desiredQualities', e.target.value)}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        {q['rm_q6'] || '6. Have you had conversations with any of your role models regarding your career aspirations? If so, what have you discussed?'}
                        <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>If you have talked to your role model about your career goals or aspirations, describe those conversations. Share what advice, insights, or guidance they provided. If you haven't had such conversations, you can mention that and explain why.</TooltipContent></Tooltip>
                      </label>
                      <Textarea
                        placeholder="Describe your conversations about career aspirations, or mention if you haven't discussed this yet..."
                        value={responses[currentTab].careerDiscussed}
                        onChange={(e) => handleRoleModelChange(currentTab, 'careerDiscussed', e.target.value)}
                        rows={2}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                  </div>
            {/* Q7–Q11 for current tab */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                {q['rm_q7'] || '7. If not, have you thought about getting their opinion on your dream career?'}
                <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>If you haven't discussed your career aspirations with them yet, reflect on whether you would like to seek their opinion or advice. Explain why you think their perspective would be valuable, or why you might be hesitant to ask. Share your thoughts about approaching them for guidance.</TooltipContent></Tooltip>
              </label>
              <Textarea
                placeholder="Share your thoughts about seeking their opinion on your dream career..."
                value={responses[currentTab].opinion}
                onChange={(e) => handleRoleModelChange(currentTab, 'opinion', e.target.value)}
                rows={3}
                className="border-purple-200 focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                {q['rm_q8'] || '8. What is their perspective on your dream job or career aspiration?'}
                <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>Share what your role model thinks about your career aspirations. Include their advice, concerns, encouragement, or any feedback they have provided. If you haven't discussed this with them, you can describe what you imagine their perspective might be based on what you know about them.</TooltipContent></Tooltip>
              </label>
              <Textarea
                placeholder="Share their perspective on your dream job or career aspiration..."
                value={responses[currentTab].willingToHelp}
                onChange={(e) => handleRoleModelChange(currentTab, 'willingToHelp', e.target.value)}
                rows={3}
                className="border-purple-200 focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                {q['rm_q9'] || '9. Is there a possibility for any of your role models to assist you in choosing your career aspiration or profession?'}
                <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>Consider whether your role model could help guide you in your career choices. Think about their expertise, willingness to help, accessibility, and how their experience could benefit you. Answer yes, no, or maybe, and explain your reasoning.</TooltipContent></Tooltip>
              </label>
              <Textarea
                placeholder="Yes/No/Maybe - explain your reasoning..."
                value={responses[currentTab].helpLookingFor}
                onChange={(e) => handleRoleModelChange(currentTab, 'helpLookingFor', e.target.value)}
                rows={2}
                className="border-purple-200 focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                {q['rm_q10'] || '10. If your answer is yes to the above question, how do you think they can help your career choice?'}
                <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>If your role model can assist you, describe the specific ways they could help. This might include mentoring, providing information about their field, introducing you to opportunities, sharing their experiences, giving advice, or connecting you with others in the profession. Be concrete and practical about how their assistance could benefit you.</TooltipContent></Tooltip>
              </label>
              <Textarea
                placeholder="Describe the specific ways they could help your career choice..."
                value={responses[currentTab].similarities}
                onChange={(e) => handleRoleModelChange(currentTab, 'similarities', e.target.value)}
                rows={3}
                className="border-purple-200 focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                {q['rm_q11'] || '11. Anything that you want to mention apart from above questions.'}
                <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>Share any additional thoughts, stories, experiences, or insights about your role model that you haven't covered in the previous questions. This is an opportunity to express anything else that is important to you about this person and their influence on your life.</TooltipContent></Tooltip>
              </label>
              <Textarea
                placeholder="Share any additional thoughts or insights about your role model..."
                value={responses[currentTab].incorporatePlan}
                onChange={(e) => handleRoleModelChange(currentTab, 'incorporatePlan', e.target.value)}
                rows={3}
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Navigation and Submit */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentTab(currentTab === 'roleModel1' ? 'roleModel3' : currentTab === 'roleModel2' ? 'roleModel1' : 'roleModel2')}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            {currentTab === 'roleModel1' 
              ? '← Previous: Role Model -3 (Known/Famous Person)' 
              : currentTab === 'roleModel2' 
              ? '← Previous: Role Model -1 (Preferably Closely Known Person)' 
              : '← Previous: Role Model -2 (Known Person)'}
          </Button>

            {/* Save Role Model progress button only (no status pill) */}
            <div className="flex items-center">
              <Button
                onClick={saveCurrentRoleModel}
                disabled={!isRoleModelComplete(currentTab) || saving || isRoleModelSaved(currentTab)}
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                    {t('saving')}
                  </>
                ) : isRoleModelSaved(currentTab) ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('saved')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('saveProgress') || 'Save Progress'}
                  </>
                )}
              </Button>
            </div>
            {currentTab !== 'roleModel3' && (
              <Button
                onClick={() => setCurrentTab(currentTab === 'roleModel1' ? 'roleModel2' : 'roleModel3')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Next: {currentTab === 'roleModel1' 
                  ? 'Role Model -2 (Known Person)' 
                  : 'Role Model -3 (Known/Famous Person)'} →
              </Button>
            )}

          </div>

          {/* General Questions Section (Questions 12 & 13) */}
          {currentTab === 'roleModel3' && (
            <Card className="border-0 shadow-lg mt-8">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-xl text-purple-800">General Reflection Questions</CardTitle>
                <CardDescription className="text-purple-600">
                  Answer these questions about all your role models
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      {q['rm_q12'] || '12. Do you notice any similarities between your personality traits and those of your role models?'}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-purple-600">💬</button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Reflect on whether you see similarities between your personality, values, interests, or behaviors and those of your role models. Identify specific traits, characteristics, or qualities you share.
                        </TooltipContent>
                      </Tooltip>
                    </label>
                    <Textarea
                      placeholder="Reflect on similarities between your personality traits and those of your role models..."
                      value={responses.question12}
                      onChange={(e) => handleGeneralQuestionChange('question12', e.target.value)}
                      rows={5}
                      className="border-purple-200 focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      {q['rm_q13'] || '13. How do you intend to cultivate and incorporate some of the qualities exhibited by your role models into your own life?'}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-purple-600">💬</button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Describe your specific plan or steps to develop and practice the qualities you admire in your role models. This could include setting goals, seeking mentorship, practicing certain behaviors, or any concrete actions you plan to take.
                        </TooltipContent>
                      </Tooltip>
                    </label>
                    <Textarea
                      placeholder="Describe how you plan to cultivate and incorporate the qualities of your role models into your life..."
                      value={responses.question13}
                      onChange={(e) => handleGeneralQuestionChange('question13', e.target.value)}
                      rows={5}
                      className="border-purple-200 focus:border-purple-400"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button Section */}
          {currentTab === 'roleModel3' && (
            <div className="flex justify-end items-center mt-8">
              <Button
                onClick={submitAssessment}
                disabled={!canSubmit() || submitting}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('submitting')}
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    {t('submitAssessment')}
                  </>
                )}
              </Button>
            </div>
          )}
        </TooltipProvider>
      </div>
      <KannadaKeyboard lang={lang} />
    </div>
  );
}
