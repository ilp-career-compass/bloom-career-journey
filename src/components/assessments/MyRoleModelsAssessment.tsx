import { useState, useEffect } from 'react';
import { fetchTranslations } from '@/services/translationService';
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
  const readOnlyView = ['1', 'true'].includes((searchParams.get('readonly') || searchParams.get('view') || '').toLowerCase());
  const isReadOnly = readOnlyView;
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
  const [helpText, setHelpText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentSection, setCurrentSection] = useState<'roleModel1' | 'roleModel2' | 'roleModel3' | 'reflection'>('roleModel1');
  const [saving, setSaving] = useState(false);
  const [savedTabs, setSavedTabs] = useState<Partial<Record<keyof RoleModelsAssessmentResponse, string>>>({});
  const [q, setQ] = useState<Record<string, string>>({});
  const [helpOpen, setHelpOpen] = useState<Record<string, boolean>>({});

  const toggleHelp = (key: string) => {
    setHelpOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

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

  useEffect(() => {
    checkExistingResponse();
  }, []);

  const [dbTitle, setDbTitle] = useState<string>('');
  const [dbIntro, setDbIntro] = useState<string>('');
  const [dbTabs, setDbTabs] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadI18n = async () => {
      try {
        // Fetch Questions
        const qKeys = Array.from({ length: 13 }, (_, i) => `rm_q${i + 1}`);
        const qMap = await fetchTranslations('role_models_questions', qKeys, lang);
        setQ(qMap);

        // Fetch Help Text
        const hKeys = Array.from({ length: 13 }, (_, i) => `rm_help_q${i + 1}`);
        const hMap = await fetchTranslations('role_models_help', hKeys, lang);
        setHelpText(hMap);

        // Fetch Module Content
        const { data: moduleData } = await supabase
          .from('content_translations')
          .select('resource_key, text')
          .eq('resource_type', 'role_models_module')
          .eq('lang', lang)
          .in('resource_key', ['title', 'intro', 'tab_rm1', 'tab_rm2', 'tab_rm3']);

        if (moduleData) {
          const tTitle = moduleData.find(i => i.resource_key === 'title')?.text;
          const tIntro = moduleData.find(i => i.resource_key === 'intro')?.text;

          if (tTitle) setDbTitle(tTitle);
          if (tIntro) setDbIntro(tIntro);

          const tabs: Record<string, string> = {};
          moduleData.forEach(item => {
            if (item.resource_key.startsWith('tab_')) {
              tabs[item.resource_key] = item.text;
            }
          });
          setDbTabs(tabs);
        }

      } catch (error) {
        console.warn('Failed to load translations', error);
      }
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
    } catch { }
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
      } catch { }
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

  const saveProgress = async () => {
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

      toast({
        title: lang === 'kn' ? 'ಪ್ರಗತಿಯನ್ನು ಉಳಿಸಲಾಗಿದೆ' : lang === 'ta' ? 'முன்னேற்றம் சேமிக்கப்பட்டது' : 'Progress Saved',
        description: lang === 'kn' ? 'ನಿಮ್ಮ ಉತ್ತರಗಳನ್ನು ಉಳಿಸಲಾಗಿದೆ.' : lang === 'ta' ? 'உங்கள் பதில்கள் சேமிக்கப்பட்டன.' : 'Your answers have been saved.',
      });

      // Update saved tabs timestamp if applicable, or just general success
      if (currentSection !== 'reflection') {
        setSavedTabs(prev => ({ ...prev, [currentSection]: new Date().toISOString() }));
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save progress. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRoleModelChange = (roleModelKey: keyof RoleModelsAssessmentResponse, field: keyof RoleModel, value: string) => {
    setResponses(prev => {
      const current = (prev[roleModelKey] as RoleModel) || {};
      return {
        ...prev,
        [roleModelKey]: {
          ...current,
          [field]: value,
        },
      };
    });
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
                title:
                  lang === 'kn'
                    ? 'ಸಾರಾಂಶ ಸಿದ್ಧವಾಗಿದೆ! 📝'
                    : lang === 'ta'
                      ? 'சுருக்கம் உருவாக்கப்பட்டது! 📝'
                      : 'Summary Generated! 📝',
                description:
                  lang === 'kn'
                    ? 'ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳ ಬಗ್ಗೆ ಬರೆದ ಉತ್ತರಗಳ ಸಾರಾಂಶ ಸಿದ್ಧವಾಗಿದೆ. ನಿಮ್ಮ ಶಿಕ್ಷಕರು ಅದನ್ನು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.'
                    : lang === 'ta'
                      ? 'உங்கள் முன்னுதாரணங்கள் பற்றிய சுருக்கம் உருவாக்கப்பட்டுள்ளது. உங்கள் ஆசிரியா் அதைப் பார்த்து மதிப்பாய்வு செய்வார்.'
                      : 'Your role models summary has been generated. Your teacher will review it.',
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
    const loadingText =
      lang === 'kn'
        ? 'ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳ ಮೌಲ್ಯಮಾಪನವನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...'
        : lang === 'ta'
          ? 'உங்கள் முன்மாதிரிகள் மதிப்பீடு ஏற்றப்படுகிறது...'
          : 'Loading your role models assessment...';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">{loadingText}</p>
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
              <CardTitle className="text-2xl text-purple-800">
                {lang === 'kn'
                  ? 'ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳ ಮೌಲ್ಯಮಾಪನ ಪೂರ್ಣಗೊಂಡಿದೆ! 🎯'
                  : lang === 'ta'
                    ? 'முன்மாதிரி மதிப்பீடு முடிந்துவிட்டது! 🎯'
                    : 'Role Models Assessment Completed! 🎯'}
              </CardTitle>
              <CardDescription className="text-purple-600">
                {lang === 'kn'
                  ? 'ನೀವು ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳನ್ನು ಗುರುತಿಸಿ, ಅವರ ಬಗ್ಗೆ ಮನನ ಮಾಡಿದ್ದಾರೆ.'
                  : lang === 'ta'
                    ? 'நீங்கள் உங்கள் முன்மாதிரி நபர்களை சிந்தித்து தேர்வு செய்து வெற்றிகரமாகப் பதிவு செய்துள்ளீர்கள்.'
                    : "You've successfully identified and analyzed your role models"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  {lang === 'kn'
                    ? 'ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳ ಬಗ್ಗೆ ನಿಮ್ಮ ಆಲೋಚನೆಗಳನ್ನು ಹಂಚಿಕೊಂಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಉತ್ತರಗಳನ್ನು ಉಳಿಸಲಾಗಿದೆ ಮತ್ತು ಈಗ ನಿಮ್ಮ ಶಿಕ್ಷಕರು ಅವನ್ನು ಓದಿ ನಿಮ್ಮ ಭವಿಷ್ಯದ ಬೆಳವಣಿಗೆಗೆ ಮಾರ್ಗದರ್ಶನ ನೀಡಬಹುದು.'
                    : lang === 'ta'
                      ? 'உங்கள் முன்மாதிரி நபர்கள் பற்றிய உங்கள் எண்ணங்களை நேர்மையாக பகிர்ந்ததற்கு நன்றி! உங்கள் பதில்கள் அனைத்தும் சேமிக்கப்பட்டுள்ளன, இப்போது உங்கள் ஆசிரியை அவற்றைப் பார்த்து உங்கள் வளர்ச்சிக்கு உதவும் வழிகாட்டுதலை வழங்க முடியும்.'
                      : 'Thank you for sharing your role model insights! Your responses have been saved and your teacher can now review them to help guide your personal development.'}
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
                    {lang === 'kn' ? 'ನನ್ನ ಉತ್ತರಗಳನ್ನು ವೀಕ್ಷಿಸಿ' : lang === 'ta' ? 'என் பதில்களை பார்' : 'View My Answers'}
                  </Button>
                  <Button
                    onClick={() => navigate('/student')}
                    className="bg-purple-600 hover:bg-purple-700"
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8" lang={lang} dir="auto">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-left mb-2">
            <Button variant="ghost" onClick={() => navigate('/student')} className="text-purple-700 hover:text-purple-800 hover:bg-purple-50">
              <ArrowLeft className="w-4 h-4 mr-2" />{t('backToDashboard')}
            </Button>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-purple-800 mb-4">
            {dbTitle || (lang === 'kn'
              ? '🎯 6. ನನ್ನ ಆದರ್ಶ ವ್ಯಕ್ತಿ ಯಾರು?'
              : lang === 'ta'
                ? '🎯 6. என் முன்மாதிரி நபர்'
                : '🎯 6. My Role Models')}
          </h1>
          <div className="text-left max-w-4xl mx-auto space-y-4 text-gray-700">
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {dbIntro || (lang === 'kn'
                ? 'ನಮ್ಮ ಜೀವನದಲ್ಲಿ, ನಾವು ಹಲವರಿಗೆ ಅವರ ಗುಣಗಳು ಮತ್ತು ವ್ಯಕ್ತಿತ್ವದ ಕಾರಣದಿಂದಾಗಿ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳೆಂದು ನೋಡುತ್ತೇವೆ. ಇಂತಹ ವ್ಯಕ್ತಿಗಳು – ಕುಟುಂಬದವರು, ಶಿಕ್ಷಕರು, ಅಥವಾ ಪ್ರೇರಣಾದಾಯಕ ವ್ಯಕ್ತಿಗಳು – ನಮ್ಮ ಸ್ವಭಾವ ಮತ್ತು ಆಲೋಚನೆಗಳನ್ನು ರೂಪಿಸುವಲ್ಲಿ ದೊಡ್ಡ ಪಾತ್ರವಹಿಸುತ್ತಾರೆ.'
                : lang === 'ta'
                  ? 'நம் வாழ்க்கையில் சிலரை அவர்களின் குணநலன்களாலும் நடத்தைகளாலும் முன்னுதாரணமாக பார்க்கிறோம். குடும்பத்தினர், ஆசிரியர்கள், தெரிந்தவர்கள் அல்லது பிரபல நபர்கள் என்றாலும், அவர்கள் நம்முடைய சிந்தனை மற்றும் பண்புகளை உருவாக்க பெரும் தாக்கம் செலுத்துகிறார்கள்.'
                  : 'In our lives, we often admire individuals for their personality traits, viewing them as role models. These individuals, be they influencers, inspiring figures, or those we know personally, contribute significantly to shaping our character.')}
            </p>
            {/* Show extra paragraphs only if dbIntro is NOT present, as dbIntro usually covers it all */}
            {!dbIntro && (
              <>
                <p className="text-base leading-relaxed">
                  {lang === 'kn'
                    ? 'ಈ ಭಾಗದಲ್ಲಿ, ನಿಮ್ಮ ವ್ಯಕ್ತಿತ್ವವನ್ನು ರೂಪಿಸಲು ಮಹತ್ವವಾದ ಪ್ರಭಾವ ಬೀರಿದ ವ್ಯಕ್ತಿಗಳ ಬಗ್ಗೆ ಆಲೋಚಿಸುತ್ತೀರಿ. ಇವರು ನಿಮ್ಮ ಬೆಳವಣಿಗೆಯ ಮೇಲೆ ತುಂಬಾ ಪ್ರಭಾವ ಬೀರಿದ್ದಾರೆ. ಅವರನ್ನು ನೀವು ಹತ್ತಿರದಿಂದ ನೋಡಲು ಸಾಧ್ಯವಾದರೆ ಇನ್ನೂ ಉತ್ತಮ; ಇಲ್ಲದಿದ್ದರೆ ಪ್ರೇರಣಾದಾಯಕ ವ್ಯಕ್ತಿಗಳು ಕೂಡ ನಿಮ್ಮ ಕಲಿಕೆಗೆ ಮಾದರಿಯಾಗಬಹುದು.'
                    : lang === 'ta'
                      ? 'இந்த பகுதியில், உங்கள் வாழ்க்கை மற்றும் நற்பண்புகளைக் கட்டியெழுப்ப முக்கிய பங்கு வகித்த முன்மாதிரி நபர்களைப் பற்றி சிந்திக்கப் போகிறீர்கள். அவர்களின் பயணம், போராட்டங்கள் மற்றும் வெற்றிகள், உங்களுக்கும் ஒரு வழிகாட்டியாக இருக்கலாம்.'
                      : 'In this segment of our reflection, we will delve into the influential figures who have played a significant role in shaping our personalities. These individuals have contributed immensely to our development. If you happen to know such people personally, it\'s advantageous as you can observe them closely. Alternatively, you can also consider inspirational personalities as a source of inspiration and learning.'}
                </p>
                <p className="text-purple-600 italic mt-4">
                  <strong>
                    {lang === 'kn'
                      ? 'ಸೂಚನೆ:'
                      : lang === 'ta'
                        ? 'குறிப்பு:'
                        : 'Suggestion:'}
                  </strong>{' '}
                  {lang === 'kn'
                    ? 'ನೀವು ಆಸಕ್ತಿ ಹೊಂದಿರುವ ವೃತ್ತಿಯನ್ನು ಅನುಸರಿಸಿದ ಆದರ್ಶ ವ್ಯಕ್ತಿಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿದರೆ ಉತ್ತಮ. ಅವರ ಅನುಭವಗಳು ಮತ್ತು ಪ್ರಯಾಣ ನಿಮ್ಮ ಭವಿಷ್ಯಕ್ಕೆ ಮಾರ್ಗದರ್ಶನ ಮತ್ತು ಪ್ರೇರಣೆ ನೀಡಬಹುದು.'
                    : lang === 'ta'
                      ? 'நீங்கள் விரும்பும் தொழிலை தொடர்ந்து சென்ற ஒருவர் உங்கள் முன்மாதிரியாக இருப்பது சிறந்தது. அவர்களின் பயணம், அனுபவங்கள் மற்றும் முடிவுகள், உங்கள் எதிர்காலத் தேர்வுகளுக்கு நல்ல வழிகாட்டியாக இருக்கும்.'
                      : 'If possible, it might be beneficial to select a role model who has pursued the profession you\'re interested in. Their journey could provide valuable insights and inspiration for your own path.'}
                </p>
                <p className="text-gray-700 mt-3 font-medium">
                  {lang === 'kn'
                    ? 'ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸುವಾಗ, ಅವರ ಗುಣಗಳು, ವರ್ತನೆಗಳು ಮತ್ತು ಪ್ರತಿಭೆಗಳ ಮೇಲೆ ವಿಶೇಷವಾಗಿ ಗಮನ ನೀಡಿ.'
                    : lang === 'ta'
                      ? 'கேள்விகளுக்குப் பதில் எழுதும்போது, அவர்கள் கொண்டிருக்கும் நல்ல குணங்கள், திறன்கள் மற்றும் முன்னுதாரணமான நடத்தைகளைப் பற்றி குறிப்பாக எழுதுங்கள்.'
                      : 'When responding to the questions provided, focus on highlighting their qualities, traits, and talents.'}
                </p>
              </>
            )}
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
                  ? '3 ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳು • ಪ್ರತಿ ವ್ಯಕ್ತಿಗೆ 11 ಪ್ರಶ್ನೆಗಳು • 2 ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆಗಳು'
                  : lang === 'ta'
                    ? '3 முன்மாதிரிகள் • ஒவ்வொருவருக்கும் 11 கேள்விகள் • 2 பொது கேள்விகள்'
                    : '3 Role Models • 11 questions each • 2 General Questions'}
              </span>
              <span>{Math.round(getProgressPercentage())}% {t('completeSuffix')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Section Navigation */}
        <div className="flex justify-center mb-6 gap-2 flex-wrap">
          <Button
            variant={currentSection === 'roleModel1' ? 'default' : 'outline'}
            onClick={() => setCurrentSection('roleModel1')}
            className={`border-purple-200 ${currentSection === 'roleModel1' ? 'bg-purple-600 hover:bg-purple-700' : 'text-purple-700 hover:bg-purple-50'}`}
          >
            {dbTabs['tab_rm1'] || (lang === 'kn' ? 'ಮಾದರಿ ವ್ಯಕ್ತಿ 1' : lang === 'ta' ? 'முன்மாதிரி 1' : 'Role Model 1')}
          </Button>
          <Button
            variant={currentSection === 'roleModel2' ? 'default' : 'outline'}
            onClick={() => setCurrentSection('roleModel2')}
            className={`border-purple-200 ${currentSection === 'roleModel2' ? 'bg-purple-600 hover:bg-purple-700' : 'text-purple-700 hover:bg-purple-50'}`}
          >
            {dbTabs['tab_rm2'] || (lang === 'kn' ? 'ಮಾದರಿ ವ್ಯಕ್ತಿ 2' : lang === 'ta' ? 'முன்மாதிரி 2' : 'Role Model 2')}
          </Button>
          <Button
            variant={currentSection === 'roleModel3' ? 'default' : 'outline'}
            onClick={() => setCurrentSection('roleModel3')}
            className={`border-purple-200 ${currentSection === 'roleModel3' ? 'bg-purple-600 hover:bg-purple-700' : 'text-purple-700 hover:bg-purple-50'}`}
          >
            {dbTabs['tab_rm3'] || (lang === 'kn' ? 'ಮಾದರಿ ವ್ಯಕ್ತಿ 3' : lang === 'ta' ? 'முன்மாதிரி 3' : 'Role Model 3')}
          </Button>
          <Button
            variant={currentSection === 'reflection' ? 'default' : 'outline'}
            onClick={() => setCurrentSection('reflection')}
            className={`border-purple-200 ${currentSection === 'reflection' ? 'bg-purple-600 hover:bg-purple-700' : 'text-purple-700 hover:bg-purple-50'}`}
          >
            {lang === 'kn' ? 'ಪ್ರತಿಫಲನೆ' : lang === 'ta' ? 'பிரதிபலிப்பு' : 'Reflection'}
          </Button>
        </div>

        {/* Role Model Sections */}
        {currentSection !== 'reflection' && (() => {
          const currentTab = currentSection as 'roleModel1' | 'roleModel2' | 'roleModel3';
          return (
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-xl text-purple-800">
                  {currentTab === 'roleModel1'
                    ? dbTabs['tab_rm1'] || (lang === 'kn'
                      ? 'ಮಾದರಿ ವ್ಯಕ್ತಿ -1 (ಹತ್ತಿರದಿಂದ ಪರಿಚಿತರಾದ ವ್ಯಕ್ತಿ)'
                      : lang === 'ta'
                        ? 'முன்மாதிரி -1 (அறிமுகமான / நெருக்கமாக அறிந்த நபர்)'
                        : 'Role Model -1 (Preferably Closely Known Person)')
                    : currentTab === 'roleModel2'
                      ? dbTabs['tab_rm2'] || (lang === 'kn'
                        ? 'ಮಾದರಿ ವ್ಯಕ್ತಿ -2 (ಪರಿಚಿತ ವ್ಯಕ್ತಿ)'
                        : lang === 'ta'
                          ? 'முன்மாதிரி -2 (நீங்கள் நன்கு அறிந்த நபர்)'
                          : 'Role Model -2 (Known Person)')
                      : dbTabs['tab_rm3'] || (lang === 'kn'
                        ? 'ಮಾದರಿ ವ್ಯಕ್ತಿ -3 (ಪರಿಚಿತ / ಪ್ರಸಿದ್ಧ ವ್ಯಕ್ತಿ)'
                        : lang === 'ta'
                          ? 'முன்மாதிரி -3 (நீங்கள் அறிந்த / பிரபலமான நபர்)'
                          : 'Role Model -3 (Known/Famous Person)')}
                </CardTitle>
                <CardDescription className="text-purple-600">
                  {lang === 'kn'
                    ? 'ಈ ಮಾದರಿ ವ್ಯಕ್ತಿ ಕುರಿತಾಗಿ ಎಲ್ಲಾ 11 ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ.'
                    : lang === 'ta'
                      ? 'இந்த முன்மாதிரி நபரைப் பற்றி உள்ள 11 கேள்விகளுக்கும் பதில் எழுதுங்கள்.'
                      : 'Answer all 11 questions for this role model'}
                </CardDescription>

              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        {q['rm_q1'] || '1. What is the name of your role model?'}
                        <button
                          type="button"
                          aria-label="Help"
                          className="text-purple-600 hover:text-purple-700 ml-2"
                          onClick={() => toggleHelp('rm_q1')}
                        >
                          💬
                        </button>
                      </label>
                      {helpOpen['rm_q1'] && (
                        <div className="mb-2 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-800">
                          {helpText['rm_help_q1'] || 'Write the full name of your role model.'}
                        </div>
                      )}
                      <Input
                        placeholder={helpText['rm_help_q1'] || 'Write the full name of your role model.'}
                        value={responses[currentTab].name}
                        onChange={(e) => handleRoleModelChange(currentTab, 'name', e.target.value)}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        {q['rm_q2'] || '2. Is the person a family member, relative, or someone you know?'}
                        <button
                          type="button"
                          aria-label="Help"
                          className="text-purple-600 hover:text-purple-700 ml-2"
                          onClick={() => toggleHelp('rm_q2')}
                        >
                          💬
                        </button>
                      </label>
                      {helpOpen['rm_q2'] && (
                        <div className="mb-2 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-800">
                          {helpText['rm_help_q2'] || 'Mention how the person is related to you.'}
                        </div>
                      )}
                      <Input
                        placeholder={helpText['rm_help_q2'] || 'Mention how the person is related to you.'}
                        value={responses[currentTab].relationship}
                        onChange={(e) => handleRoleModelChange(currentTab, 'relationship', e.target.value)}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        {q['rm_q3'] || '3. What qualities do you like in your role model? Why are they special to you?'}
                        <button
                          type="button"
                          aria-label="Help"
                          className="text-purple-600 hover:text-purple-700 ml-2"
                          onClick={() => toggleHelp('rm_q3')}
                        >
                          💬
                        </button>
                      </label>
                      {helpOpen['rm_q3'] && (
                        <div className="mb-2 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-800">
                          {helpText['rm_help_q3'] || 'Think about qualities like hard work, honesty, and courage.'}
                        </div>
                      )}
                      <Textarea
                        placeholder={helpText['rm_help_q3'] || 'Think about qualities like hard work, honesty, and courage.'}
                        value={responses[currentTab].admirationReasons}
                        onChange={(e) => handleRoleModelChange(currentTab, 'admirationReasons', e.target.value)}
                        rows={3}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        {q['rm_q4'] || '4. What work or profession does the person do?'}
                        <button
                          type="button"
                          aria-label="Help"
                          className="text-purple-600 hover:text-purple-700 ml-2"
                          onClick={() => toggleHelp('rm_q4')}
                        >
                          💬
                        </button>
                      </label>
                      {helpOpen['rm_q4'] && (
                        <div className="mb-2 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-800">
                          {helpText['rm_help_q4'] || 'Write their job or profession simply.'}
                        </div>
                      )}
                      <Input
                        placeholder={helpText['rm_help_q4'] || 'Write their job or profession simply.'}
                        value={responses[currentTab].profession}
                        onChange={(e) => handleRoleModelChange(currentTab, 'profession', e.target.value)}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        {q['rm_q5'] || '5. Which skill or talent of yours do you want to develop inspired by them?'}
                        <button
                          type="button"
                          aria-label="Help"
                          className="text-purple-600 hover:text-purple-700 ml-2"
                          onClick={() => toggleHelp('rm_q5')}
                        >
                          💬
                        </button>
                      </label>
                      {helpOpen['rm_q5'] && (
                        <div className="mb-2 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-800">
                          {helpText['rm_help_q5'] || 'Think about skills like studies, leadership, or communication.'}
                        </div>
                      )}
                      <Input
                        placeholder={helpText['rm_help_q5'] || 'Think about skills like studies, leadership, or communication.'}
                        value={responses[currentTab].desiredQualities}
                        onChange={(e) => handleRoleModelChange(currentTab, 'desiredQualities', e.target.value)}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        {q['rm_q6'] || '6. Have you discussed your chosen career or job with your role model? What did you discuss?'}
                        <button
                          type="button"
                          aria-label="Help"
                          className="text-purple-600 hover:text-purple-700 ml-2"
                          onClick={() => toggleHelp('rm_q6')}
                        >
                          💬
                        </button>
                      </label>
                      {helpOpen['rm_q6'] && (
                        <div className="mb-2 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-800">
                          {helpText['rm_help_q6'] || 'Write if you discussed career choice, education path, or future plans.'}
                        </div>
                      )}
                      <Textarea
                        placeholder={helpText['rm_help_q6'] || 'Write if you discussed career choice, education path, or future plans.'}
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
                      {q['rm_q7'] || '7. Have you taken advice or opinion from your role model about your dream plan?'}
                      <button
                        type="button"
                        aria-label="Help"
                        className="text-purple-600 hover:text-purple-700 ml-2"
                        onClick={() => toggleHelp('rm_q7')}
                      >
                        💬
                      </button>
                    </label>
                    {helpOpen['rm_q7'] && (
                      <div className="mb-2 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-800">
                        {helpText['rm_help_q7'] || 'Write whether you discussed your dream or future plan with them.'}
                      </div>
                    )}
                    <Textarea
                      placeholder={helpText['rm_help_q7'] || 'Write whether you discussed your dream or future plan with them.'}
                      value={responses[currentTab].opinion}
                      onChange={(e) => handleRoleModelChange(currentTab, 'opinion', e.target.value)}
                      rows={3}
                      className="border-purple-200 focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      {q['rm_q8'] || '8. What does your role model say about your dream job or career?'}
                      <button
                        type="button"
                        aria-label="Help"
                        className="text-purple-600 hover:text-purple-700 ml-2"
                        onClick={() => toggleHelp('rm_q8')}
                      >
                        💬
                      </button>
                    </label>
                    {helpOpen['rm_q8'] && (
                      <div className="mb-2 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-800">
                        {helpText['rm_help_q8'] || 'Mention whether they encouraged you or gave advice.'}
                      </div>
                    )}
                    <Textarea
                      placeholder={helpText['rm_help_q8'] || 'Mention whether they encouraged you or gave advice.'}
                      value={responses[currentTab].willingToHelp}
                      onChange={(e) => handleRoleModelChange(currentTab, 'willingToHelp', e.target.value)}
                      rows={3}
                      className="border-purple-200 focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      {q['rm_q9'] || '9. Has any role model helped you in choosing your dream career?'}
                      <button
                        type="button"
                        aria-label="Help"
                        className="text-purple-600 hover:text-purple-700 ml-2"
                        onClick={() => toggleHelp('rm_q9')}
                      >
                        💬
                      </button>
                    </label>
                    {helpOpen['rm_q9'] && (
                      <div className="mb-2 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-800">
                        {helpText['rm_help_q9'] || 'Write who helped you and how they helped you.'}
                      </div>
                    )}
                    <Textarea
                      placeholder={helpText['rm_help_q9'] || 'Write who helped you and how they helped you.'}
                      value={responses[currentTab].helpLookingFor}
                      onChange={(e) => handleRoleModelChange(currentTab, 'helpLookingFor', e.target.value)}
                      rows={2}
                      className="border-purple-200 focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      {q['rm_q10'] || '10. If yes, what kind of help do you expect?'}
                      <button
                        type="button"
                        aria-label="Help"
                        className="text-purple-600 hover:text-purple-700 ml-2"
                        onClick={() => toggleHelp('rm_q10')}
                      >
                        💬
                      </button>
                    </label>
                    {helpOpen['rm_q10'] && (
                      <div className="mb-2 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-800">
                        {helpText['rm_help_q10'] || 'Think about help like education, training, or guidance.'}
                      </div>
                    )}
                    <Textarea
                      placeholder={helpText['rm_help_q10'] || 'Think about help like education, training, or guidance.'}
                      value={responses[currentTab].similarities}
                      onChange={(e) => handleRoleModelChange(currentTab, 'similarities', e.target.value)}
                      rows={3}
                      className="border-purple-200 focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      {q['rm_q11'] || '11. Apart from the above questions, is there anything else you would like to say?'}
                      <button
                        type="button"
                        aria-label="Help"
                        className="text-purple-600 hover:text-purple-700 ml-2"
                        onClick={() => toggleHelp('rm_q11')}
                      >
                        💬
                      </button>
                    </label>
                    {helpOpen['rm_q11'] && (
                      <div className="mb-2 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-800">
                        {helpText['rm_help_q11'] || 'You may write any additional thoughts or opinions.'}
                      </div>
                    )}
                    <Textarea
                      placeholder={helpText['rm_help_q11'] || 'You may write any additional thoughts or opinions.'}
                      value={responses[currentTab].incorporatePlan}
                      onChange={(e) => handleRoleModelChange(currentTab, 'incorporatePlan', e.target.value)}
                      rows={3}
                      className="border-purple-200 focus:border-purple-400"
                    />
                  </div>

                </div>
              </CardContent>
            </Card>
          );
        })()}

        {currentSection === 'reflection' && (
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl text-purple-800 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  {lang === 'kn' ? 'ಪ್ರತಿಫಲನೆ ಮತ್ತು ಹೋಲಿಕೆ' : lang === 'ta' ? 'பிரதிபலிப்பு மற்றும் ஒப்பீடு' : 'Reflection & Comparison'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    {q['rm_q12'] || '12. Have you noticed any similarity or comparison between your personality and that of the above role models?'}
                    <button
                      type="button"
                      aria-label="Help"
                      className="text-purple-600 hover:text-purple-700 ml-2"
                      onClick={() => toggleHelp('rm_q12')}
                    >
                      💬
                    </button>
                  </label>
                  {helpOpen['rm_q12'] && (
                    <div className="mb-2 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-800">
                      {helpText['rm_help_q12'] || 'Think about common qualities, habits, or thoughts between you and your role model and write them.'}
                    </div>
                  )}
                  <Textarea
                    placeholder={helpText['rm_help_q12'] || 'Think about common qualities, habits, or thoughts between you and your role model and write them.'}
                    value={responses.question12}
                    onChange={(e) => handleGeneralQuestionChange('question12', e.target.value)}
                    rows={5}
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    {q['rm_q13'] || '13. How do you try to adopt the qualities of your role model in your life?'}
                    <button
                      type="button"
                      aria-label="Help"
                      className="text-purple-600 hover:text-purple-700 ml-2"
                      onClick={() => toggleHelp('rm_q13')}
                    >
                      💬
                    </button>
                  </label>
                  {helpOpen['rm_q13'] && (
                    <div className="mb-2 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-800">
                      {helpText['rm_help_q13'] || 'Write how you follow your role model\'s good habits, discipline, and hard work in your life.'}
                    </div>
                  )}
                  <Textarea
                    placeholder={helpText['rm_help_q13'] || 'Write how you follow your role model\'s good habits, discipline, and hard work in your life.'}
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



        {/* Navigation and Submit */}
        {/* Footer Navigation */}
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-8 gap-4 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              const sections = ['roleModel1', 'roleModel2', 'roleModel3', 'reflection'] as const;
              const idx = sections.indexOf(currentSection);
              if (idx > 0) {
                setCurrentSection(sections[idx - 1]);
                window.scrollTo(0, 0);
              }
            }}
            disabled={currentSection === 'roleModel1'}
            className="w-full sm:w-auto border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            {lang === 'kn' ? 'ಹಿಂದಿನ ಭಾಗ' : lang === 'ta' ? 'முந்தைய பகுதி' : 'Previous Section'}
          </Button>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={saveProgress}
              disabled={saving || isReadOnly}
              className="w-full sm:w-auto border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {lang === 'kn' ? 'ಪ್ರಗತಿಯನ್ನು ಉಳಿಸಿ' : lang === 'ta' ? 'முன்னேற்றத்தைச் சேமி' : 'Save Progress'}
                </>
              )}
            </Button>

            {currentSection !== 'reflection' ? (
              <Button
                variant="outline"
                onClick={() => {
                  const sections = ['roleModel1', 'roleModel2', 'roleModel3', 'reflection'] as const;
                  const idx = sections.indexOf(currentSection);
                  if (idx < sections.length - 1) {
                    setCurrentSection(sections[idx + 1]);
                    window.scrollTo(0, 0);
                  }
                }}
                className="w-full sm:w-auto border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                {lang === 'kn' ? 'ಮುಂದಿನ ಭಾಗ' : lang === 'ta' ? 'அடுத்த பகுதி' : 'Next Section'}
              </Button>
            ) : (
              <Button
                onClick={submitAssessment}
                disabled={!canSubmit() || submitting || isReadOnly}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {lang === 'kn' ? 'ಸಲ್ಲಿಸುತ್ತಿದೆ...' : lang === 'ta' ? 'சமர்ப்பிக்கிறது...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 mr-2" />
                    {lang === 'kn' ? 'ಮೌಲ್ಯಮಾಪನವನ್ನು ಸಲ್ಲಿಸಿ' : lang === 'ta' ? 'மதிப்பீட்டை சமர்ப்பிக்கவும்' : 'Submit Assessment'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

      </div>
      <KannadaKeyboard lang={lang} />
    </div>
  );
}
