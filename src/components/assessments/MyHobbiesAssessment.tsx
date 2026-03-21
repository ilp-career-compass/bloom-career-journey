import { logger } from '@/lib/logger';
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
  Users,
  Lock,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import { fetchTranslations } from '@/services/translationService';

import { IndicKeyboard } from '@/components/ui/IndicKeyboard';
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
  const [summaryQuestions, setSummaryQuestions] = useState<any[]>([]);
  const [dbSummaryTitle, setDbSummaryTitle] = useState<string | null>(null);
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
    // Append the summary tab if there are questions loaded
    if (sectionsList.length > 0) {
      sectionsList.push('summary');
    }
    return sectionsList;
  }, [questionsBySection]);

  const [dbTitle, setDbTitle] = useState<string>('');
  const [dbIntro, setDbIntro] = useState<string>('');

  // Fetch module content (title, intro)
  useEffect(() => {
    const fetchModuleContent = async () => {
      try {
        const { data } = await supabase
          .from('content_translations')
          .select('resource_key, text')
          .eq('resource_type', 'hobbies_module')
          .eq('lang', lang)
          .in('resource_key', ['title', 'intro']);

        if (data) {
          const tTitle = data.find(i => i.resource_key === 'title')?.text;
          const tIntro = data.find(i => i.resource_key === 'intro')?.text;
          if (tTitle) setDbTitle(tTitle);
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
        logger.log('🔄 Loading Hobbies questions from database...');
        // First, get the full question structure
        const { data, error } = await supabase.rpc('get_hobbies_questions');
        if (error) {
          logger.error('Error loading hobbies questions:', error);
          return;
        }
        if (data && Array.isArray(data) && data.length > 0) {
          // Try to get translations for questions and help text
          const questionTranslations: Record<string, string> = {};
          const helpTranslations: Record<string, string> = {};
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
            logger.warn('Could not load i18n translations, using default:', e);
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

          logger.log('✅ Database questions loaded:', questionsWithTranslations.length, 'questions');
          setHobbiesQuestions(questionsWithTranslations);
          // Initialize responses based on questions
          const initialResponses: HobbiesAssessmentResponse = {};
          questionsWithTranslations.forEach(q => {
            initialResponses[q.id] = '';
          });
          // Load summary questions
          const summaryInitialResponses: Record<string, string> = {};
          try {
            const { data: summaryData, error: summaryError } = await supabase.rpc('get_hobbies_summary_questions_i18n', { p_lang: lang } as any);
            if (!summaryError && summaryData && Array.isArray(summaryData)) {
              setSummaryQuestions(summaryData);
              summaryData.forEach((sq: any) => {
                summaryInitialResponses[`summary_${sq.sequence_number}`] = '';
              });
            }
          } catch (e) {
            logger.error('Error loading summary questions:', e);
          }

          // Fetch summary title from content_translations (future-proofing)
          try {
            const titleRows = await fetchTranslations('hobbies_module', ['summary_title'], lang);
            const tTitle = titleRows.find(r => r.resource_key === 'summary_title')?.text;
            if (tTitle) setDbSummaryTitle(tTitle);
          } catch (e) { /* no-op */ }

          setResponses(prev => ({ ...prev, ...initialResponses, ...summaryInitialResponses }));

          // Set initial section
          const firstSection = questionsWithTranslations[0]?.section || 'section1';
          setCurrentSection(firstSection);
        }
      } catch (error) {
        logger.error('Error loading hobbies questions:', error);
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
    } catch {
      // Ignore URL parsing errors
    }
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
      logger.log('💾 Saving section:', section, 'with responses:', responses);

      // First, check if a record exists - get the most recent one
      const { data: existingRecords, error: fetchError } = await supabase
        .from('assessment_responses')
        .select('id, responses')
        .eq('student_id', studentId)
        .eq('assessment_type', 'hobbies')
                .order('updated_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        logger.error('❌ Error fetching existing record:', fetchError);
        throw fetchError;
      }

      const existing = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;
      logger.log('📋 Existing record:', existing);

      if (existing) {
        // Update existing record, merge responses
        const existingResponses = existing.responses as any || {};
        const mergedResponses = {
          ...existingResponses,
          ...responses
        };

        logger.log('🔄 Merging responses:', { existing: existingResponses, current: responses, merged: mergedResponses });

        const { error } = await supabase
          .from('assessment_responses')
          .update({
            responses: mergedResponses,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) {
          logger.error('❌ Error updating record:', error);
          throw error;
        }
        logger.log('✅ Successfully updated existing record');
      } else {
        // Create new record
        logger.log('📝 Creating new record with responses:', responses);
        const { error } = await supabase
          .from('assessment_responses')
          .upsert({
            student_id: studentId,
            assessment_type: 'hobbies',
            assessment_title: 'My Talents and Hobbies',
            responses,
            updated_at: new Date().toISOString(),
            completed_at: null
          }, { onConflict: 'student_id,assessment_type' });

        if (error) {
          logger.error('❌ Error inserting new record:', error);
          throw error;
        }
        logger.log('✅ Successfully created new record');
      }

      const sectionNumber = section.replace('section', '');
      const sectionNamesEn: Record<string, string> = {
        '1': 'Hobbies & Interests',
        '2': 'Talents & Practice',
        '3': 'Support & Career Connection'
      };

      const sectionDisplayName =
        section === 'summary'
          ? lang === 'kn' ? 'ಸಾರಾಂಶ' : lang === 'ta' ? 'சுருக்கம்' : 'Summary'
          : lang === 'kn'
            ? sectionNumber === '1'
              ? 'ಹವ್ಯಾಸಗಳು ಮತ್ತು ಆಸಕ್ತಿಗಳು'
              : sectionNumber === '2'
                ? 'ಸಾಮರ್ಥ್ಯಗಳು ಮತ್ತು ಅಭ್ಯಾಸ'
                : sectionNumber === '3'
                  ? 'ಬೆಂಬಲ ಮತ್ತು ವೃತ್ತಿ ಸಂಪರ್ಕ'
                  : `ಭಾಗ ${sectionNumber}`
            : lang === 'ta'
              ? sectionNumber === '1'
                ? 'பொழுதுபோக்குகள் மற்றும் ஆர்வங்கள்'
                : sectionNumber === '2'
                  ? 'திறமைகள் மற்றும் பயிற்சி'
                  : sectionNumber === '3'
                    ? 'ஆதரவு மற்றும் தொழில் இணைப்பு'
                    : `பகுதி ${sectionNumber}`
              : sectionNamesEn[sectionNumber] || section;

      toast({
        title:
          lang === 'kn'
            ? 'ಭಾಗವು ಉಳಿಸಲಾಗಿದೆ! ✅'
            : lang === 'ta'
              ? 'பகுதி சேமிக்கப்பட்டது! ✅'
              : 'Section Saved! ✅',
        description:
          lang === 'kn'
            ? `ನಿಮ್ಮ "${sectionDisplayName}" ವಿಭಾಗದ ಉತ್ತರಗಳನ್ನು ಉಳಿಸಲಾಗಿದೆ.`
            : lang === 'ta'
              ? `உங்கள் "${sectionDisplayName}" பகுதியின் பதில்கள் சேமிக்கப்பட்டுள்ளன.`
              : `Your ${sectionDisplayName} responses have been saved.`,
      });
    } catch (error) {
      logger.error('Error saving section:', error);
      toast({
        title:
          lang === 'kn'
            ? 'ದೋಷ'
            : lang === 'ta'
              ? 'பிழை'
              : 'Error',
        description:
          lang === 'kn'
            ? 'ಭಾಗವನ್ನು ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
            : lang === 'ta'
              ? 'பகுதியை சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
              : 'Failed to save section. Please try again.',
        variant: 'destructive',
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
    const studentId = await getStudentId();
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
          summaryQuestions.forEach(sq => {
            const key = `summary_${sq.sequence_number}`;
            initialResponses[key] = savedResponses[key] || '';
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
    const totalQuestions = hobbiesQuestions.length + summaryQuestions.length;
    let answeredQuestions = hobbiesQuestions.filter(q => {
      const response = responses[q.id];
      return response && response.trim() !== '';
    }).length;
    answeredQuestions += summaryQuestions.filter(sq => {
      const response = responses[`summary_${sq.sequence_number}`];
      return response && response.trim() !== '';
    }).length;
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const canSubmit = () => {
    if (isReadOnly) return false;
    if (hobbiesQuestions.length === 0) return false;
    const mainComplete = hobbiesQuestions.every(q => {
      const response = responses[q.id];
      return response && response.trim() !== '';
    });
    const summaryComplete = summaryQuestions.length === 0 || summaryQuestions.every(sq => {
      const response = responses[`summary_${sq.sequence_number}`];
      return response && response.trim() !== '';
    });
    return mainComplete && summaryComplete;
  };

  const areCoreSectionsComplete = () => {
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
                .order('updated_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        logger.error('❌ Error fetching existing record:', fetchError);
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
          .upsert({
            student_id: studentId,
            assessment_type: 'hobbies',
            assessment_title: 'My Talents and Hobbies',
            responses: responses,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'student_id,assessment_type' })
          .select()
          .single();

        if (error) throw error;
        assessmentData = data;
      }

      toast({
        title:
          lang === 'kn'
            ? 'ಪ್ರತಿಭೆಗಳು ಮತ್ತು ಹವ್ಯಾಸಗಳ ಮೌಲ್ಯಮಾಪನ ಪೂರ್ಣಗೊಂಡಿದೆ! 🎨'
            : lang === 'ta'
              ? 'திறமைகள் மற்றும் பொழுதுபோக்குகள் மதிப்பீடு முடிந்தது! 🎨'
              : 'Talents and Hobbies Assessment Completed! 🎨',
        description:
          lang === 'kn'
            ? 'ನಿಮ್ಮ ಹವ್ಯಾಸಗಳು ಮತ್ತು ಪ್ರತಿಭೆಗಳು ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಿಸಲಾಗಿದೆ.'
            : lang === 'ta'
              ? 'உங்கள் பொழுதுபோக்குகள் மற்றும் திறமைகள் வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளன.'
              : 'Your hobbies and talents have been captured successfully!',
      });

      setIsCompleted(true);

      // Generate AI summary in the background
      try {
        const { aiSummaryService } = await import('@/services/aiSummaryService');
        const summaryDatabaseService = (await import('@/services/summaryDatabaseService')).summaryDatabaseService;

        if (aiSummaryService.isConfigured()) {
          logger.log('🤖 Generating AI summary for Hobbies assessment:', assessmentData.id);
          const summaryResult = await aiSummaryService.generateHobbiesSummary(responses);

          if (summaryResult.success && summaryResult.summary) {
            // Save summary to database
            const saveResult = await summaryDatabaseService.createAISummary(
              assessmentData.id,
              summaryResult.summary,
              userProfile.id
            );

            if (saveResult.success) {
              logger.log('✅ AI summary saved successfully:', saveResult.summaryId);
              toast({
                title:
                  lang === 'kn'
                    ? 'ಸಾರಾಂಶ ಸಿದ್ಧವಾಗಿದೆ! 📝'
                    : lang === 'ta'
                      ? 'சுருக்கம் உருவாக்கப்பட்டது! 📝'
                      : 'Summary Generated! 📝',
                description:
                  lang === 'kn'
                    ? 'ನಿಮ್ಮ ಹವ್ಯಾಸಗಳು ಮತ್ತು ಸಾಮರ್ಥ್ಯಗಳ ಸಾರಾಂಶ ಸಿದ್ಧವಾಗಿದೆ. ನಿಮ್ಮ ಶಿಕ್ಷಕರು ಅದನ್ನು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.'
                    : lang === 'ta'
                      ? 'உங்கள் திறமைகள் மற்றும் பொழுதுபோக்குகள் பற்றிய சுருக்கம் உருவாக்கப்பட்டுள்ளது. உங்கள் ஆசிரியா் அதைப் பார்த்து மதிப்பாய்வு செய்வார்.'
                      : 'Your talents and hobbies summary has been generated. Your teacher will review it.',
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
                logger.error('Error notifying teacher:', notifError);
                // Don't fail the whole submission if notification fails
              }
            } else {
              logger.error('Failed to save summary:', saveResult.error);
              toast({
                title: "Summary Generation Issue",
                description: "Your assessment is saved, but summary generation needs attention.",
                variant: "destructive",
              });
            }
          } else {
            logger.error('Failed to generate summary:', summaryResult.error);
            toast({
              title: "Summary Generation Issue",
              description: "Your assessment is saved. Summary will be generated later.",
              variant: "destructive",
            });
          }
        } else {
          logger.warn('⚠️ Gemini API not configured, skipping summary generation');
        }
      } catch (summaryError) {
        logger.error('Error in summary generation:', summaryError);
        // Don't fail the entire submission if summary generation fails
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

  if (loading) {
    const loadingText =
      lang === 'kn'
        ? 'ನಿಮ್ಮ ಆಸಕ್ತಿ ಮತ್ತು ಹವ್ಯಾಸಗಳ ಮೌಲ್ಯಮಾಪನವನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...'
        : lang === 'ta'
          ? 'உங்கள் திறமைகள் மற்றும் பொழுதுபோக்குகள் மதிப்பீடு ஏற்றப்படுகிறது...'
          : 'Loading your hobbies assessment...';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">{loadingText}</p>
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
              <CardTitle className="text-2xl text-orange-800">
                {lang === 'kn'
                  ? 'ಪ್ರತಿಭೆಗಳು ಮತ್ತು ಹವ್ಯಾಸಗಳ ಮೌಲ್ಯಮಾಪನ ಪೂರ್ಣಗೊಂಡಿದೆ! 🎨'
                  : lang === 'ta'
                    ? 'திறமைகள் மற்றும் பொழுதுபோக்குகள் மதிப்பீடு முடிந்தது! 🎨'
                    : 'Talents and Hobbies Assessment Completed! 🎨'}
              </CardTitle>
              <CardDescription className="text-orange-600">
                {lang === 'kn'
                  ? 'ನೀವು ನಿಮ್ಮ ಹವ್ಯಾಸಗಳು ಮತ್ತು ಪ್ರತಿಭೆಗಳ ಬಗ್ಗೆ ಯಶಸ್ವಿಯಾಗಿ ಹಂಚಿಕೊಂಡಿದ್ದೀರಿ.'
                  : lang === 'ta'
                    ? 'உங்கள் பொழுதுபோக்குகள் மற்றும் திறமைகள் பற்றிய தகவலை நீங்கள் வெற்றிகரமாக பகிர்ந்துள்ளீர்கள்.'
                    : "You've successfully shared your hobbies and talents"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  {lang === 'kn'
                    ? 'ನಿಮ್ಮ ಹವ್ಯಾಸಗಳು ಮತ್ತು ಪ್ರತಿಭೆಗಳ ಬಗ್ಗೆ ಹಂಚಿಕೊಂಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಉತ್ತರಗಳು ಉಳಿಸಲಾಗಿದ್ದು, ನಿಮ್ಮ ಆಸಕ್ತಿಗಳನ್ನು ಆಧರಿಸಿ ಸಾಧ್ಯವಾದ ವೃತ್ತಿ ಮಾರ್ಗಗಳನ್ನು ಗುರುತಿಸಲು ನಿಮ್ಮ ಶಿಕ್ಷಕರು ಅವನ್ನು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.'
                    : lang === 'ta'
                      ? 'உங்கள் பொழுதுபோக்குகள் மற்றும் திறமைகள் பற்றிய உங்கள் எண்ணங்களை திறந்த மனதுடன் பகிர்ந்ததற்கு நன்றி! உங்கள் பதில்கள் சேமிக்கப்பட்டுள்ளன; உங்கள் ஆர்வங்களை அடிப்படையாகக் கொண்டு உங்களுக்கு பொருந்தக்கூடிய தொழில் பாதைகளை கண்டறிய உங்கள் ஆசிரியா் அவற்றைப் பரிசீலிப்பார்.'
                      : 'Thank you for sharing your hobbies and talents! Your responses have been saved and your teacher can now review them to help identify potential career paths based on your interests.'}
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
                    {lang === 'kn' ? 'ನನ್ನ ಉತ್ತರಗಳನ್ನು ವೀಕ್ಷಿಸಿ' : lang === 'ta' ? 'என் பதில்களை பார்' : 'View My Answers'}
                  </Button>
                  <Button
                    onClick={() => navigate('/student')}
                    className="bg-orange-600 hover:bg-orange-700"
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 py-8" lang={lang} dir="auto">
      <div className="container mx-auto px-4">

        <div className="text-left mb-2">
          <Button variant="ghost" onClick={() => navigate('/student')} className="text-orange-700 hover:text-orange-800 hover:bg-orange-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-2"><path fillRule="evenodd" d="M12.53 3.47a.75.75 0 010 1.06L6.31 10.75H21a.75.75 0 010 1.5H6.31l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" clipRule="evenodd" /></svg>
            {t('backToDashboard')}
          </Button>
        </div>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-orange-800 mb-2">
            {dbTitle || (lang === 'kn'
              ? '🎨 ನನ್ನ ಪ್ರತಿಭೆಗಳು ಮತ್ತು ಹವ್ಯಾಸಗಳು'
              : lang === 'ta'
                ? '🎨 என் திறமைகள் மற்றும் பொழுதுபோக்குகள்'
                : '🎨 My Talents and Hobbies')}
          </h1>

          {/* Description Text */}
          <div className="max-w-3xl mx-auto space-y-4 text-gray-700 mt-4">
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {dbIntro || (lang === 'kn'
                ? 'ಈ ಅಭ್ಯಾಸ ಭಾಗದಲ್ಲಿ, ನಿಮ್ಮ ಆಸಕ್ತಿಗಳು, ಹವ್ಯಾಸಗಳು ಮತ್ತು ನಿಮಗೆ ಸಂತೋಷ ನೀಡುವ ಚಟುವಟಿಕೆಗಳನ್ನು ಅನ್ವೇಷಿಸುತ್ತೇವೆ. ನಿಮ್ಮ ಹವ್ಯಾಸಗಳನ್ನು ಆಳವಾಗಿ ನೋಡಿದಾಗ, ಸಂತೋಷದ ಜೊತೆಗೆ ನಿಮ್ಮ ಕಲಿಕೆಯ ಶೈಲಿ ಮತ್ತು ಭವಿಷ್ಯದ ವೃತ್ತಿ ಸಾಧ್ಯತೆಗಳನ್ನು ಸಹ ಗುರುತಿಸಬಹುದು.'
                : lang === 'ta'
                  ? 'இந்த பயிற்சி பகுதியில், உங்களுக்கு மகிழ்ச்சி தரும் உங்கள் ஆர்வங்கள், பொழுதுபோக்குகள் மற்றும் செயல்பாடுகளை ஆராய்கிறோம். உங்கள் பொழுதுபோக்குகள் மற்றும் ஆர்வங்களை ஆழமாக ஆராய்வதன் மூலம், நீங்கள் மகிழ்ச்சியையும், உங்கள் தனிப்பட்ட கற்றல் முறையையும், உங்களுக்கு பொருந்தும் தொழில் வாய்ப்புகளையும் கண்டறிய முடியும்.'
                  : 'In this practice section, we delve into your interests, hobbies, pastimes, and activities that bring you joy, exploring the depths of your creativity. By delving into your hobbies and interests, you can not only find happiness but also identify your unique learning style and potential professions aligned with your passions.')}
            </p>

            {!dbIntro && (
              <>
                <p className="text-base leading-relaxed italic text-orange-700 font-medium">
                  {lang === 'kn'
                    ? '“ಹವ್ಯಾಸಗಳು ನಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ಹೊರತರುತ್ತವೆ ಮತ್ತು ನಮ್ಮ ಕನಸುಗಳನ್ನು ಹಿಂಬಾಲಿಸಲು ಪ್ರೇರಣೆ ನೀಡುತ್ತವೆ.”'
                    : lang === 'ta'
                      ? '“பொழுதுபோக்குகள் நம்முடைய திறமைகளை வெளிக்கொண்டு வந்து, எங்கள் கனவுகளை நோக்கி செல்ல ஊக்குவிக்கின்றன.”'
                      : '"Hobbies bring out our talents and inspire us to pursue our dreams."'}
                </p>

                <div className="mt-6 space-y-4 text-left bg-orange-50 p-6 rounded-lg border border-orange-200">
                  <div>
                    <h3 className="font-semibold text-orange-800 mb-2">
                      {lang === 'kn'
                        ? 'ಭಾಗ I: ಹವ್ಯಾಸ (Hobby) ಎಂದರೆ ಏನು?'
                        : lang === 'ta'
                          ? 'பகுதி I: பொழுதுபோக்கு (Hobby) என்றால் என்ன?'
                          : 'Section I: What is a hobby?'}
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      {lang === 'kn' ? (
                        <>
                          <li>ಕೇವಲ ಸಂತೋಷ ಮತ್ತು ವಿಶ್ರಾಂತಿಗಾಗಿ ಬಿಡುವಿನ ವೇಳೆಯಲ್ಲಿ ಮಾಡುವ ಚಟುವಟಿಕೆ.</li>
                          <li>ಇದು ನಮಗೆ ಖುಷಿ ನೀಡುತ್ತದೆ ಮತ್ತು ಒತ್ತಡವನ್ನು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.</li>
                          <li>ಹವ್ಯಾಸವನ್ನು ಸಮಯ ಕಳೆದಂತೆ ಕಲಿಯಬಹುದು ಮತ್ತು ಅಭಿವೃದ್ಧಿಪಡಿಸಬಹುದು.</li>
                        </>
                      ) : lang === 'ta' ? (
                        <>
                          <li>மகிழ்ச்சிக்காகவும் ஓய்வுக்காகவும் ஓய்வு நேரத்தில் செய்யும் ஒரு செயல்பாடு.</li>
                          <li>இது நமக்கு மகிழ்ச்சியைத் தருகிறது மற்றும் மன அழுத்தத்தைக் குறைக்கிறது.</li>
                          <li>ஒரு பொழுதுபோக்கை காலப்போக்கில் கற்றுக் கொள்ளலாம் மற்றும் வளர்த்துக் கொள்ளலாம்.</li>
                        </>
                      ) : (
                        <>
                          <li>An activity done in leisure time for pleasure and relaxation.</li>
                          <li>It brings us joy and reduces stress.</li>
                          <li>A hobby is something that can be learnt and developed over time. </li>
                        </>
                      )}
                    </ul>
                    <p className="mt-2 text-gray-600">
                      <strong>
                        {lang === 'kn' ? 'ಉದಾಹರಣೆಗಳು:' : lang === 'ta' ? 'உதாரணங்கள்:' : 'Examples:'}
                      </strong>{' '}
                      {lang === 'kn'
                        ? 'ಚಿತ್ರ ಬಿಡಿಸುವುದು, ಹಾಡು ಹಾಡುವುದು, ಓದು, ನೃತ್ಯ, ಟಿವಿಯನ್ನು ನೋಡುವುದು, ತೋಟಗಾರಿಕೆ ಇತ್ಯಾದಿ.'
                        : lang === 'ta'
                          ? 'ஓவியம், பாட்டு, நடனம், தோட்டக்கலை, புத்தகம் வாசிப்பது.'
                          : 'Drawing, Singing, Reading, Dancing, Watching TV, Gardening etc.'}
                    </p>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-semibold text-orange-800 mb-2">
                      {lang === 'kn'
                        ? 'ಭಾಗ II: ಪ್ರತಿಭೆ (Talent) ಎಂದರೆ ಏನು?'
                        : lang === 'ta'
                          ? 'பகுதி II: திறமை (Talent) என்றால் என்ன?'
                          : 'Section II: What is talent?'}
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      {lang === 'kn' ? (
                        <>
                          <li>ಹುಟ್ಟಿನಿಂದಲೇ ನಮಗೆ ಇರುವ ಒಂದು ನೈಸರ್ಗಿಕ ಸಾಮರ್ಥ್ಯ.</li>
                          <li>ಹೆಚ್ಚು ಅಭ್ಯಾಸ ಮಾಡದೆ ಸಹ ಸುಲಭವಾಗಿ ಮಾಡಬಹುದಾದ ಕೌಶಲ್ಯ.</li>
                          <li>ಇದನ್ನು ಇನ್ನಷ್ಟು ಅಭ್ಯಾಸದಿಂದ ಅಪಾರ ಸಾಧನೆಗೆ ದಾರಿ ಮಾಡಬಹುದು.</li>
                        </>
                      ) : lang === 'ta' ? (
                        <>
                          <li>பிறப்பிலிருந்தே நமக்கு உள்ள இயற்கையான திறன்.</li>
                          <li>அதிக பயிற்சி இல்லாமலேயே எளிதாக செய்யக்கூடிய திறமை.</li>
                          <li>இதை மேலும் பயிற்சி செய்வதன் மூலம் பெரிய சாதனைகளை அடையலாம்.</li>
                        </>
                      ) : (
                        <>
                          <li>A natural ability that we are born with.</li>
                          <li>A skill that can be done easily without much practice.</li>
                          <li>This can lead to immense achievement with more practice.</li>
                        </>
                      )}
                    </ul>
                    <p className="mt-2 text-gray-600">
                      <strong>
                        {lang === 'kn' ? 'ಉದಾಹರಣೆಗಳು:' : lang === 'ta' ? 'ಉದಾಹರಣೆಗಳು:' : 'Examples:'}
                      </strong>{' '}
                      {lang === 'kn'
                        ? 'ಸುಲಭವಾಗಿ ಹಾಡುವಂತಹುದು, ಸ್ಪಷ್ಟವಾಗಿ ಭಾಷಣ ಮಾಡುವಂತಹುದು, ಗಣಿತದಲ್ಲಿ ವೇಗವಾಗಿ ಉತ್ತರ ನೀಡುವಂತಹುದು, ತ್ವರಿತವಾಗಿ ಕಲಿಯುವ ಸಾಮರ್ಥ್ಯ ಇತ್ಯಾದಿ.'
                        : lang === 'ta'
                          ? 'எளிதாக பாடும் திறன், தெளிவாக பேசும் திறன், கணிதத்தில் வேகமாக விடை அளிக்கும் திறன், விரைவாக கற்றுக்கொள்ளும் திறன் போன்றவை.'
                          : 'The ability to sing naturally, communicate clearly, answer questions quickly in math, learn quickly, etc.'}
                    </p>
                  </div>
                </div>
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
                  ? `ವಿಭಾಗ ${sections.indexOf(currentSection) + 1} / ${sections.length} • ಒಟ್ಟು ${hobbiesQuestions.length} ಪ್ರಶ್ನೆಗಳು`
                  : lang === 'ta'
                    ? `பகுதி ${sections.indexOf(currentSection) + 1} / ${sections.length} • மொத்தம் ${hobbiesQuestions.length} கேள்விகள்`
                    : `Section ${sections.indexOf(currentSection) + 1} of ${sections.length} • ${hobbiesQuestions.length} Questions Total`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Section Navigation */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex bg-white p-1 rounded-lg border border-orange-100 min-w-max">
            {sections.map((sectionKey) => {
              const sectionNumber = sections.indexOf(sectionKey) + 1;
              let sectionTitle = '';
              if (sectionKey === 'section1') {
                sectionTitle = lang === 'kn' ? 'ಹವ್ಯಾಸಗಳು' : lang === 'ta' ? 'பொழுதுபோக்குகள்' : 'Hobbies';
              } else if (sectionKey === 'section2') {
                sectionTitle = lang === 'kn' ? 'ಸಾಮರ್ಥ್ಯಗಳು' : lang === 'ta' ? 'திறமைகள்' : 'Talents';
              } else if (sectionKey === 'section3') {
                sectionTitle = lang === 'kn' ? 'ಬೆಂಬಲ' : lang === 'ta' ? 'ஆதரவு' : 'Support';
              } else if (sectionKey === 'summary') {
                sectionTitle = lang === 'kn' ? 'ಸಾರಾಂಶ' : lang === 'ta' ? 'சுருக்கம்' : 'Summary';
              } else {
                sectionTitle = lang === 'kn' ? `ಭಾಗ ${sectionNumber}` : lang === 'ta' ? `பகுதி ${sectionNumber}` : `Section ${sectionNumber}`;
              }

              const isSummary = sectionKey === 'summary';
              const isLocked = isSummary && !areCoreSectionsComplete();

              return (
                <button
                  key={sectionKey}
                  onClick={() => !isLocked && setCurrentSection(sectionKey)}
                  disabled={isLocked && !isReadOnly}
                  className={`px-6 py-2 rounded-md transition-all flex items-center gap-2 ${currentSection === sectionKey
                    ? 'bg-orange-600 text-white shadow-md'
                    : isLocked ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-orange-600'
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
          const sectionQuestions = sectionKey === 'summary' ? summaryQuestions : (questionsBySection[sectionKey] || []);
          if (sectionQuestions.length === 0) return null;

          const sectionNumber = sections.indexOf(sectionKey) + 1;
          let sectionTitle = '';
          let sectionDescription = '';
          let headerColor = 'from-orange-50 to-pink-50';
          let titleColor = 'text-orange-800';
          let descColor = 'text-orange-600';

          if (sectionKey === 'section1') {
            sectionTitle =
              lang === 'kn'
                ? 'ಭಾಗ 1: ಹವ್ಯಾಸಗಳು ಮತ್ತು ಆಸಕ್ತಿಗಳು'
                : lang === 'ta'
                  ? 'பகுதி 1: பொழுதுபோக்குகள் மற்றும் ஆர்வங்கள்'
                  : 'Section 1: Hobbies & Interests';
            sectionDescription =
              lang === 'kn'
                ? 'ನಿಮ್ಮ ಹವ್ಯಾಸಗಳು ಮತ್ತು ಅವುಗಳಿಗೆ ಪ್ರೇರಣೆ ನೀಡುವ ವಿಷಯಗಳ ಬಗ್ಗೆ ಬರೆಯಿರಿ.'
                : lang === 'ta'
                  ? 'உங்கள் பொழுதுபோக்குகள் மற்றும் அதற்கு உங்களை ஊக்கப்படுத்தும் விஷயங்களை பற்றி பகிருங்கள்.'
                  : 'Share your thoughts about your hobbies and what inspires them';
          } else if (sectionKey === 'section2') {
            sectionTitle =
              lang === 'kn'
                ? 'ಭಾಗ 2: ಸಾಮರ್ಥ್ಯಗಳು ಮತ್ತು ಅಭ್ಯಾಸ'
                : lang === 'ta'
                  ? 'பகுதி 2: திறமைகள் மற்றும் பயிற்சி'
                  : 'Section 2: Talents & Practice';
            sectionDescription =
              lang === 'kn'
                ? 'ನಿಮ್ಮ ಸಹಜ ಸಾಮರ್ಥ್ಯಗಳು ಯಾವುವು ಮತ್ತು ಅವನ್ನು ಹೇಗೆ ಅಭ್ಯಾಸ ಮಾಡುತ್ತೀರಿ ಎಂಬುದನ್ನು ಅನ್ವೇಷಿಸಿ.'
                : lang === 'ta'
                  ? 'உங்களிடம் உள்ள இயல்பான திறமைகள் என்ன, அதை நீங்கள் எப்படி வளர்த்துக் கொள்கிறீர்கள் என்பதை எழுதுங்கள்.'
                  : 'Explore your natural talents and how you develop them';
            headerColor = 'from-pink-50 to-purple-50';
            titleColor = 'text-pink-800';
            descColor = 'text-pink-600';
          } else if (sectionKey === 'section3') {
            sectionTitle =
              lang === 'kn'
                ? 'ಭಾಗ 3: ಬೆಂಬಲ ಮತ್ತು ವೃತ್ತಿ ಸಂಪರ್ಕ'
                : lang === 'ta'
                  ? 'பகுதி 3: ஆதரவு மற்றும் தொழில் இணைப்பு'
                  : 'Section 3: Support & Career Connection';
            sectionDescription =
              lang === 'kn'
                ? 'ನಿಮ್ಮ ಹವ್ಯಾಸಗಳಿಗೆ ಕುಟುಂಬ/ಶಾಲೆಯಿಂದ ಸಿಗುವ ಬೆಂಬಲ ಮತ್ತು ಭವಿಷ್ಯದ ವೃತ್ತಿ ಅವಕಾಶಗಳ ಬಗ್ಗೆ ಚಿಂತಿಸಿ.'
                : lang === 'ta'
                  ? 'உங்கள் பொழுதுபோக்குகளை வளர்க்க வீட்டிலும் பள்ளியிலும் கிடைக்கும் ஆதரவு மற்றும் அதிலிருந்து உருவாகும் தொழில் வாய்ப்புகளை பற்றி சிந்தியுங்கள்.'
                  : 'Reflect on support systems and career possibilities from your hobbies';
            headerColor = 'from-purple-50 to-indigo-50';
            titleColor = 'text-purple-800';
            descColor = 'text-purple-600';
          } else if (sectionKey === 'summary') {
            sectionTitle = dbSummaryTitle || (
              lang === 'kn'
                ? 'ಸಾರಾಂಶ'
                : lang === 'ta'
                  ? 'சுருக்கம்'
                  : 'Summary');
            sectionDescription =
              lang === 'kn'
                ? 'ನಿಮ್ಮ ಉತ್ತರಗಳನ್ನು ಇಲ್ಲಿ ಸಾರಾಂಶ ಮಾಡಿ.'
                : lang === 'ta'
                  ? 'உங்கள் பதில்களை இங்கே ಕಾಣவும்.'
                  : 'A summarized overview of your talents and hobbies responses.';
            headerColor = 'from-orange-50 to-amber-50';
            titleColor = 'text-orange-800';
            descColor = 'text-orange-600';
          } else {
            sectionTitle =
              lang === 'kn'
                ? `ಭಾಗ ${sectionNumber}`
                : lang === 'ta'
                  ? `பகுதி ${sectionNumber}`
                  : `Section ${sectionNumber}`;
            sectionDescription =
              lang === 'kn'
                ? 'ಈ ಭಾಗದಲ್ಲಿರುವ ಪ್ರಶ್ನೆಗಳಿಗೆ ನಿಮ್ಮ ಆಲೋಚನೆಗಳನ್ನು ಬರೆಯಿರಿ.'
                : lang === 'ta'
                  ? 'ಈ ಭಾಗದಲ್ಲಿರುವ ಪ್ರಶ್ನೆಗಳಿಗೆ ನಿಮ್ಮ ಆಲೋಚನೆಗಳನ್ನು ಬರೆಯಿರಿ.'
                  : 'Answer the questions in this section';
          }

          return (
            <div key={sectionKey} style={{ display: currentSection === sectionKey ? 'block' : 'none' }}>
              <Card className="border-0 shadow-lg">
                <CardHeader className={`bg-gradient-to-r ${headerColor}`}>
                  <CardTitle className={`text-xl ${titleColor}`}>{sectionTitle}</CardTitle>
                  <CardDescription className={descColor}>{sectionDescription}</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-8">
                    {sectionQuestions.map((q: any, qIdx: number) => {
                      const qText = sectionKey === 'summary' ? q.text : q.question_text;
                      const hasNumber = /^\d+\.\s/.test(qText || '');
                      const label = hasNumber ? qText : `${qIdx + 1}. ${qText}`;
                      return (
                      <div key={q.id} className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <label className="text-base font-medium text-gray-800 leading-relaxed">
                            {label}
                          </label>
                          {q.help_text && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleHelp(q.id)}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 -mt-1 shrink-0"
                            >
                              <Lightbulb className="w-4 h-4 mr-1" />
                              {lang === 'kn' ? 'ಸಹಾಯ' : lang === 'ta' ? 'உதவி' : 'Help'}
                            </Button>
                          )}
                        </div>

                        {helpOpen[q.id] && q.help_text && (
                          <div className="bg-orange-50 p-4 rounded-md text-sm text-orange-800 border border-orange-100 animate-in fade-in slide-in-from-top-1">
                            <p className="font-semibold mb-1">{lang === 'kn' ? 'ಸಲಹೆ:' : lang === 'ta' ? 'குறிப்பு:' : 'Tip:'}</p>
                            <p>{q.help_text}</p>
                          </div>
                        )}

                        <Textarea
                          placeholder={q.help_text || (lang === 'kn' ? 'ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ...' : lang === 'ta' ? 'உங்கள் பதிலை இங்கே எழுதுங்கள்...' : lang === 'hi' ? 'अपना उत्तर यहाँ लिखें...' : 'Type your answer here...')}
                          className="min-h-[120px] text-base border-orange-100 focus:border-orange-300 focus:ring-orange-200"
                          value={responses[sectionKey === 'summary' ? `summary_${q.sequence_number}` : q.id] || ''}
                          onChange={(e) => handleResponseChange(sectionKey === 'summary' ? `summary_${q.sequence_number}` : q.id, e.target.value)}
                          readOnly={isReadOnly}
                        />
                      </div>
                      );
                    })}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="mt-10 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-orange-100 pt-6">
                    <Button
                      variant="outline"
                      onClick={() => saveSection(currentSection)}
                      disabled={savingSection !== null || isReadOnly}
                      className="w-full sm:w-auto border-orange-200 text-orange-700 hover:bg-orange-50"
                    >
                      {savingSection ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          {lang === 'kn' ? 'ಉಳಿಸುತ್ತಿದೆ...' : lang === 'ta' ? 'சேமித்து கொண்டிருக்கிறது...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {lang === 'kn' ? 'ಪ್ರಗತಿಯನ್ನು ಉಳಿಸಿ' : lang === 'ta' ? 'முன்னೇற்றத்தைச் சேಮಿ' : 'Save Progress'}
                        </>
                      )}
                    </Button>

                    {sections.indexOf(currentSection) < sections.length - 1 ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const idx = sections.indexOf(currentSection);
                          if (idx < sections.length - 1) {
                            const nextSection = sections[idx + 1];
                            if (nextSection === 'summary' && !areCoreSectionsComplete()) {
                              toast({
                                title: lang === 'kn' ? 'ಸಾರಾಂಶ ಲಾಕ್ ಆಗಿದೆ' : lang === 'ta' ? 'சுருக்கம் பூட்டப்பட்டுள்ளது' : 'Summary Locked',
                                description: lang === 'kn'
                                  ? 'ಸಾರಾಂಶವನ್ನು ವೀಕ್ಷಿಸಲು ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ.'
                                  : lang === 'ta'
                                    ? 'சுருக்கத்தைப் பார்க்க அனைத்துக் கேள்விகளுக்கும் பதில் அளிக்கவும்.'
                                    : 'Please answer all core questions to unlock the summary.',
                                variant: 'destructive',
                              });
                              return;
                            }
                            setCurrentSection(nextSection);
                            window.scrollTo(0, 0);
                          }
                        }}
                        className="w-full sm:w-auto border-orange-200 text-orange-700 hover:bg-orange-50"
                      >
                        {lang === 'kn' ? 'ಮುಂದಿನ ಭಾಗ' : lang === 'ta' ? 'அடுத்த பகுதி' : 'Next Section'}
                      </Button>
                    ) : (
                      <Button
                        onClick={submitAssessment}
                        disabled={!canSubmit() || submitting || isReadOnly}
                        className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {t('submitting')}
                          </>
                        ) : (
                          <>
                            <Palette className="w-4 h-4 mr-2" />
                            {t('submitAssessment')}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}

        {/* Hobby Icons Inspiration */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            {lang === 'kn'
              ? 'ಸಾಮಾನ್ಯ ಹವ್ಯಾಸ ವಿಭಾಗಗಳು'
              : lang === 'ta'
                ? 'பொதுவான பொழுதுபோக்கு வகைகள்'
                : 'Common Hobby Categories'}
          </h3>
          <div className="flex flex-wrap justify-center gap-6 text-gray-500">
            <div className="flex flex-col items-center gap-2">
              <Music className="w-8 h-8" />
              <span className="text-sm">
                {lang === 'kn' ? 'ಸಂಗೀತ' : lang === 'ta' ? 'இசை' : 'Music'}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Camera className="w-8 h-8" />
              <span className="text-sm">
                {lang === 'kn' ? 'ಛಾಯಾಗ್ರಹಣ' : lang === 'ta' ? 'புகைப்படம்' : 'Photography'}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <BookOpen className="w-8 h-8" />
              <span className="text-sm">
                {lang === 'kn' ? 'ಓದು' : lang === 'ta' ? 'ವಾಸಿಪ್ಪು' : 'Reading'}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Gamepad2 className="w-8 h-8" />
              <span className="text-sm">
                {lang === 'kn' ? 'ಗೇಮಿಂಗ್' : lang === 'ta' ? 'ವಿளையாட்டு (கேಮಿಂಗ್)' : 'Gaming'}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Paintbrush className="w-8 h-8" />
              <span className="text-sm">
                {lang === 'kn' ? 'ಕಲೆ' : lang === 'ta' ? 'ಕಲೆ' : 'Art'}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Dumbbell className="w-8 h-8" />
              <span className="text-sm">
                {lang === 'kn' ? 'ಕ್ರೀಡೆ' : lang === 'ta' ? 'ವಿளையாட்டு' : 'Sports'}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Code className="w-8 h-8" />
              <span className="text-sm">
                {lang === 'kn' ? 'ತಂತ್ರಜ್ಞಾನ' : lang === 'ta' ? 'தொழಿಲ್நுட்பಂ' : 'Technology'}
              </span>
            </div>
          </div>
        </div>
      </div>
      <IndicKeyboard lang={lang} />
    </div>
  );
}
