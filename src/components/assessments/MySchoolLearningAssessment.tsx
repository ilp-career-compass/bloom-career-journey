import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { School, Save, CheckCircle, ArrowLeft, Lock, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import { fetchTranslations } from '@/services/translationService';

import { IndicKeyboard } from '@/components/ui/IndicKeyboard';
import { checkAssessmentUnlock } from '@/utils/assessmentUnlock';

interface SchoolLearningAssessmentResponse {
  section1: {
    question1: string;
    question2: string;
    question3: string;
    question4: string;
  };
  section2: {
    question5: string;
    question6: string;
    question7: string;
    question8: string;
  };
  section3: {
    question9: string;
    question10: string;
    question11: {
      visual: boolean;
      audio: boolean;
      experimenting: boolean;
      discuss: boolean;
      groupDiscussions: boolean;
      presentation: boolean;
      rolePlay: boolean;
      teaching: boolean;
      other: string;
    };
    question12: string;
  };
  section4: {
    question13: string;
    question14: string;
    question15: string;
    question16: string;
  };
  section5: {
    question17: string;
    question18: string;
    question19: string;
    question20: string;
    question21: string;
  };
  section6: {
    question1: string;
    question2: string;
    question3: string;
    question4: string;
    question5: string;
    question6: string;
  };
}

export default function MySchoolLearningAssessment() {
  const { userProfile } = useAuth();
  const { t, lang } = useLang();
  const { toast } = useToast();
  const [responses, setResponses] = useState<SchoolLearningAssessmentResponse>({
    section1: {
      question1: '',
      question2: '',
      question3: '',
      question4: ''
    },
    section2: {
      question5: '',
      question6: '',
      question7: '',
      question8: ''
    },
    section3: {
      question9: '',
      question10: '',
      question11: {
        visual: false,
        audio: false,
        experimenting: false,
        discuss: false,
        groupDiscussions: false,
        presentation: false,
        rolePlay: false,
        teaching: false,
        other: ''
      },
      question12: ''
    },
    section4: {
      question13: '',
      question14: '',
      question15: '',
      question16: ''
    },
    section5: {
      question17: '',
      question18: '',
      question19: '',
      question20: '',
      question21: ''
    },
    section6: {
      question1: '',
      question2: '',
      question3: '',
      question4: '',
      question5: '',
      question6: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [summaryQuestions, setSummaryQuestions] = useState<any[]>([]);
  const [dbSummaryTitle, setDbSummaryTitle] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState<Record<string, boolean>>({});

  const toggleHelp = (key: string) => {
    setHelpOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentSection, setCurrentSection] = useState<'section1' | 'section2' | 'section3' | 'section4' | 'section5' | 'section6'>('section1');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewParam = (searchParams.get('readonly') || searchParams.get('view') || '').toLowerCase();
  const readOnlyView = viewParam === '1' || viewParam === 'true';
  const isReadOnly = isCompleted || readOnlyView;
  const [helpTranslations, setHelpTranslations] = useState<Record<string, string>>({});

  const [dbTitle, setDbTitle] = useState<string>('');
  const [dbIntro, setDbIntro] = useState<string>('');
  const [optionLabels, setOptionLabels] = useState<Record<string, string>>({});

  // Fetch module content (title, intro)
  useEffect(() => {
    const fetchModuleContent = async () => {
      try {
        const { data } = await supabase
          .from('content_translations')
          .select('resource_key, text')
          .eq('resource_type', 'school_learning_module')
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

  // Load localized help text from content_translations (school_learning_help)
  useEffect(() => {
    const loadHelpTranslations = async () => {
      try {
        const keys = Array.from({ length: 21 }, (_, i) => `question${i + 1}`);
        // Changed from 'school_help' to 'school_learning_help' to match DB
        const map = await fetchTranslations('school_learning_help', keys, lang);
        setHelpTranslations(map);
      } catch (error) {
        logger.warn('MySchoolLearningAssessment: failed to load help translations', error);
        setHelpTranslations({});
      }
    };

    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_school_learning_questions_i18n', { p_lang: lang });

        if (error) {
          logger.error('Error fetching questions:', error);
          return;
        }

        if (data) {
          setQuestions(data);
        }
      } catch (error) {
        logger.error('Error in fetchQuestions:', error);
      }
    };

    const fetchSummaryQuestions = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_school_learning_summary_questions_i18n', { p_lang: lang });

        if (error) {
          logger.error('Error fetching summary questions:', error);
          return;
        }

        if (data) {
          setSummaryQuestions(data);
        }
      } catch (error) {
        logger.error('Error in fetchSummaryQuestions:', error);
      }
    };

    loadHelpTranslations();
    fetchQuestions();
    fetchSummaryQuestions();

    fetchTranslations('school_learning_module', ['summary_title'], lang).then(map => {
      if (map['summary_title']) setDbSummaryTitle(map['summary_title']);
    }).catch(() => {});

    fetchTranslations('school_learning_option',
      ['visual', 'audio', 'experimenting', 'discuss', 'groupDiscussions', 'presentation', 'rolePlay', 'teaching', 'other'],
      lang
    ).then(map => setOptionLabels(map)).catch(() => {});
  }, [lang]);

  const getHelpText = (id: number, fallback: string) => {
    const key = `question${id}`;
    return helpTranslations[key] || fallback;
  };

  const OPTION_EN_LABELS: Record<string, string> = {
    visual: 'Observe the experiment and explain by relating it with suitable illustrative pictures (audio-visual medium).',
    audio: 'Oral explanation (audio medium).',
    experimenting: 'Learning through experiment / experiential learning.',
    discuss: 'Discussion / Reasoning.',
    groupDiscussions: 'Group discussion.',
    presentation: 'Presentation.',
    rolePlay: 'Oral practice through role play.',
    teaching: 'I learn by teaching others.'
  };

  // Helper to get question labels
  const qLabel = (id: number, en: string): string => {
    // Dynamic fetching for all languages
    const q = questions.find(i => i.sequence_number === id);
    // Fixed: RPC returns 'text' not 'question_text'
    return q?.text || en;
  };

  useEffect(() => {
    const checkUnlock = async () => {
      if (!userProfile) return;
      let studentId = userProfile.studentProfile?.id as string | undefined;
      if (!studentId) {
        const { data } = await supabase.from('students').select('id').eq('user_id', userProfile.id).maybeSingle();
        studentId = data?.id;
      }
      if (!studentId) return;
      const unlockResult = await checkAssessmentUnlock(studentId, 'school_learning');
      if (!unlockResult.isUnlocked) {
        toast({
          title: lang === 'kn' ? 'ಮೌಲ್ಯಮಾಪನ ಲಾಕ್ ಮಾಡಲಾಗಿದೆ' : lang === 'ta' ? 'செயல் பூட்டப்பட்டுள்ளது' : lang === 'hi' ? 'मूल्यांकन लॉक है' : 'Assessment Locked',
          description: lang === 'kn'
            ? `ದಯವಿಟ್ಟು ಮೊದಲು "${unlockResult.missingPrerequisites.join(', ')}" ಪೂರ್ಣಗೊಳಿಸಿ.`
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

  useEffect(() => {
    if (userProfile) {
      checkExistingResponse();
    }
  }, [userProfile]);

  const checkExistingResponse = async () => {
    if (!userProfile) {
      setLoading(false);
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
      setLoading(false);
      return;
    }
    try {
      // Get the most recent record (handle multiple records)
      const { data: records, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_type', 'school_learning')
        // Support both new and legacy titles
        .in('assessment_title', ['My School, My Learning and I', 'My School Learning'] as any)
        .order('updated_at', { ascending: false })
        .limit(1);

      const data = records && records.length > 0 ? records[0] : null;
      logger.log('📥 Loading existing response:', { data, error, recordsCount: records?.length });

      if (data && !error && data.responses) {
        // Only set completed if completed_at exists
        if (data.completed_at) {
          setIsCompleted(true);
        }
        // Merge saved responses with current structure
        const savedResponses = data.responses as any;
        logger.log('📋 Saved responses:', savedResponses);

        const mergedResponses: SchoolLearningAssessmentResponse = {
          section1: {
            question1: savedResponses.section1?.question1 || savedResponses.part1?.question1 || '',
            question2: savedResponses.section1?.question2 || savedResponses.part1?.question2 || '',
            question3: savedResponses.section1?.question3 || savedResponses.part1?.question3 || '',
            question4: savedResponses.section1?.question4 || savedResponses.part1?.question4 || ''
          },
          section2: {
            question5: savedResponses.section2?.question5 || savedResponses.part2?.question5 || '',
            question6: savedResponses.section2?.question6 || savedResponses.part2?.question6 || '',
            question7: savedResponses.section2?.question7 || savedResponses.part2?.question7 || '',
            question8: savedResponses.section2?.question8 || savedResponses.part2?.question8 || ''
          },
          section3: {
            question9: savedResponses.section3?.question9 || savedResponses.part2?.question9 || '',
            question10: savedResponses.section3?.question10 || savedResponses.part2?.question10 || '',
            question11: {
              visual: savedResponses.section3?.question11?.visual || savedResponses.part2?.question11?.lookingAtPictures || false,
              audio: savedResponses.section3?.question11?.audio || savedResponses.section3?.question11?.listening || false,
              experimenting: savedResponses.section3?.question11?.experimenting || savedResponses.part2?.question11?.experiment || false,
              discuss: savedResponses.section3?.question11?.discuss || savedResponses.part2?.question11?.discussions || false,
              groupDiscussions: savedResponses.section3?.question11?.groupDiscussions || savedResponses.part2?.question11?.groupSessions || false,
              presentation: savedResponses.section3?.question11?.presentation || false,
              rolePlay: savedResponses.section3?.question11?.rolePlay || false,
              teaching: savedResponses.section3?.question11?.teaching || false,
              other: savedResponses.section3?.question11?.other || savedResponses.part2?.question11?.others || ''
            },
            question12: savedResponses.section3?.question12 || savedResponses.part2?.question12 || ''
          },
          section4: {
            question13: savedResponses.section4?.question13 || savedResponses.part3?.question13 || '',
            question14: savedResponses.section4?.question14 || savedResponses.part3?.question14 || '',
            question15: savedResponses.section4?.question15 || savedResponses.part3?.question15 || '',
            question16: savedResponses.section4?.question16 || savedResponses.part3?.question16 || ''
          },
          section5: {
            question17: savedResponses.section5?.question17 || savedResponses.part3?.question17 || '',
            question18: savedResponses.section5?.question18 || '',
            question19: savedResponses.section5?.question19 || '',
            question20: savedResponses.section5?.question20 || '',
            question21: savedResponses.section5?.question21 || ''
          },
          section6: {
            question1: savedResponses.section6?.question1 || '',
            question2: savedResponses.section6?.question2 || '',
            question3: savedResponses.section6?.question3 || '',
            question4: savedResponses.section6?.question4 || '',
            question5: savedResponses.section6?.question5 || '',
            question6: savedResponses.section6?.question6 || ''
          }
        };

        logger.log('✅ Merged responses:', mergedResponses);
        setResponses(mergedResponses);
      } else {
        logger.log('ℹ️ No existing response found');
      }
    } catch (error) {
      logger.error('❌ Error loading existing response:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (section: keyof SchoolLearningAssessmentResponse, questionKey: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [questionKey]: value
      }
    }));
  };

  const handleLearningMethodChange = (method: string, value: boolean | string) => {
    if (isReadOnly) return;
    setResponses(prev => ({
      ...prev,
      section3: {
        ...prev.section3,
        question11: {
          ...prev.section3.question11,
          [method]: value
        }
      }
    }));
  };

  const saveSection = async (section: 'section1' | 'section2' | 'section3' | 'section4' | 'section5' | 'section6') => {
    if (!userProfile || isReadOnly) return;
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

    setSavingSection(section);
    try {
      logger.log('💾 Saving section:', section, 'with responses:', responses);

      // Fetch existing record to merge responses
      const { data: existingRecords, error: fetchError } = await supabase
        .from('assessment_responses')
        .select('id, responses')
        .eq('student_id', studentId)
        .eq('assessment_type', 'school_learning')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        logger.error('❌ Error fetching existing record:', fetchError);
        throw fetchError;
      }

      const existing = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;
      const existingResponses = (existing?.responses as any) || {};
      const mergedResponses = { ...existingResponses, ...responses };

      logger.log('🔄 Merging responses:', { existing: existingResponses, current: responses, merged: mergedResponses });

      const { error } = await supabase
        .from('assessment_responses')
        .upsert({
          student_id: studentId,
          assessment_type: 'school_learning',
          assessment_title: 'My School, My Learning and I',
          responses: mergedResponses,
          updated_at: new Date().toISOString(),
          completed_at: null
        }, { onConflict: 'student_id,assessment_type' });

      if (error) {
        logger.error('❌ Error saving record:', error);
        throw error;
      }
      logger.log('✅ Successfully saved record');

      toast({
        title:
          lang === 'kn'
            ? 'ಭಾಗವು ಉಳಿಸಲಾಗಿದೆ! ✅'
            : lang === 'ta'
              ? 'பகுதி சேமிக்கப்பட்டது! ✅'
              : lang === 'hi'
                ? 'भाग सहेजा गया! ✅'
                : 'Section Saved! ✅',
        description:
          lang === 'kn'
            ? `ನಿಮ್ಮ ${section.replace('section', 'ಭಾಗ ')} ಉತ್ತರಗಳನ್ನು ಉಳಿಸಲಾಗಿದೆ.`
            : lang === 'ta'
              ? `உங்கள் ${section.replace('section', 'பகுதி ')} பதில்கள் சேமிக்கப்பட்டுள்ளன.`
              : lang === 'hi'
                ? `आपके ${section.replace('section', 'भाग ')} के उत्तर सहेजे गए हैं।`
                : `Your ${section.replace('section', 'Section ')} responses have been saved.`,
      });
    } catch (error) {
      logger.error('Error saving section:', error);
      toast({
        title:
          lang === 'kn'
            ? 'ದೋಷ'
            : lang === 'ta'
              ? 'பிழை'
              : lang === 'hi'
                ? 'त्रुटि'
                : 'Error',
        description:
          lang === 'kn'
            ? 'ಭಾಗವನ್ನು ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
            : lang === 'ta'
              ? 'பகுதியை சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
              : lang === 'hi'
                ? 'भाग सहेजने में विफल। कृपया पुनः प्रयास करें।'
                : 'Failed to save section. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingSection(null);
    }
  };

  const areCoreSectionsComplete = () => {
    // Helper to safely check if a question is answered
    const isAnswered = (value: any): boolean => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim() !== '';
      return false;
    };

    const section1Complete =
      isAnswered(responses.section1.question1) &&
      isAnswered(responses.section1.question2) &&
      isAnswered(responses.section1.question3) &&
      isAnswered(responses.section1.question4);

    const section2Complete =
      isAnswered(responses.section2.question5) &&
      isAnswered(responses.section2.question6) &&
      isAnswered(responses.section2.question7) &&
      isAnswered(responses.section2.question8);

    const section3Q11Complete = Object.values(responses.section3.question11).some(val =>
      val === true || (typeof val === 'string' && val.trim() !== '')
    );
    const section3Complete =
      isAnswered(responses.section3.question9) &&
      isAnswered(responses.section3.question10) &&
      section3Q11Complete &&
      isAnswered(responses.section3.question12);

    const section4Complete =
      isAnswered(responses.section4.question13) &&
      isAnswered(responses.section4.question14) &&
      isAnswered(responses.section4.question15) &&
      isAnswered(responses.section4.question16);

    const section5Complete =
      isAnswered(responses.section5.question17) &&
      isAnswered(responses.section5.question18) &&
      isAnswered(responses.section5.question19) &&
      isAnswered(responses.section5.question20) &&
      isAnswered(responses.section5.question21);

    return section1Complete && section2Complete && section3Complete && section4Complete && section5Complete;
  };

  const getProgressPercentage = () => {
    const totalQuestions = 27; // Updated from 21 to 27 (+6 for Summary)
    let answeredQuestions = 0;
    Object.values(responses.section1).forEach(v => { if (typeof v === 'string' && v.trim()) answeredQuestions++; });
    Object.values(responses.section2).forEach(v => { if (typeof v === 'string' && v.trim()) answeredQuestions++; });
    Object.values(responses.section3).forEach((v, i) => {
      if (i === 2) {
        const methods = responses.section3.question11;
        if (Object.values(methods).some(val => val === true || (typeof val === 'string' && val.trim()))) answeredQuestions++;
      } else if (typeof v === 'string' && v.trim()) answeredQuestions++;
    });
    Object.values(responses.section4).forEach(v => { if (typeof v === 'string' && v.trim()) answeredQuestions++; });
    Object.values(responses.section5).forEach(v => { if (typeof v === 'string' && v.trim()) answeredQuestions++; });
    Object.values(responses.section6).forEach(v => { if (typeof v === 'string' && v.trim()) answeredQuestions++; });
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const canSubmit = () => {
    if (isReadOnly) return false;

    // Helper to safely check if a question is answered
    const isAnswered = (value: any): boolean => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim() !== '';
      return false;
    };

    // Check section 1 (4 questions)
    const section1Complete =
      isAnswered(responses.section1.question1) &&
      isAnswered(responses.section1.question2) &&
      isAnswered(responses.section1.question3) &&
      isAnswered(responses.section1.question4);

    // Check section 2 (4 questions)
    const section2Complete =
      isAnswered(responses.section2.question5) &&
      isAnswered(responses.section2.question6) &&
      isAnswered(responses.section2.question7) &&
      isAnswered(responses.section2.question8);

    // Check section 3 (4 items: question9, question10, question11, question12)
    const section3Q11Complete = Object.values(responses.section3.question11).some(val =>
      val === true || (typeof val === 'string' && val.trim() !== '')
    );
    const section3Complete =
      isAnswered(responses.section3.question9) &&
      isAnswered(responses.section3.question10) &&
      section3Q11Complete &&
      isAnswered(responses.section3.question12);

    // Check section 4 (4 questions)
    const section4Complete =
      isAnswered(responses.section4.question13) &&
      isAnswered(responses.section4.question14) &&
      isAnswered(responses.section4.question15) &&
      isAnswered(responses.section4.question16);

    // Check section 5 (5 questions)
    const section5Complete =
      isAnswered(responses.section5.question17) &&
      isAnswered(responses.section5.question18) &&
      isAnswered(responses.section5.question19) &&
      isAnswered(responses.section5.question20) &&
      isAnswered(responses.section5.question21);

    // Check section 6 (6 questions)
    const section6Complete =
      isAnswered(responses.section6.question1) &&
      isAnswered(responses.section6.question2) &&
      isAnswered(responses.section6.question3) &&
      isAnswered(responses.section6.question4) &&
      isAnswered(responses.section6.question5) &&
      isAnswered(responses.section6.question6);

    const allSectionsComplete = section1Complete && section2Complete && section3Complete && section4Complete && section5Complete && section6Complete;

    if (!allSectionsComplete) {
      logger.log('📋 Submission check:', {
        section1: section1Complete,
        section1Details: {
          q1: isAnswered(responses.section1.question1),
          q2: isAnswered(responses.section1.question2),
          q3: isAnswered(responses.section1.question3),
          q4: isAnswered(responses.section1.question4)
        },
        section2: section2Complete,
        section2Details: {
          q5: isAnswered(responses.section2.question5),
          q6: isAnswered(responses.section2.question6),
          q7: isAnswered(responses.section2.question7),
          q8: isAnswered(responses.section2.question8)
        },
        section3: section3Complete,
        section3Details: {
          q9: isAnswered(responses.section3.question9),
          q10: isAnswered(responses.section3.question10),
          q11: section3Q11Complete,
          q12: isAnswered(responses.section3.question12)
        },
        section4: section4Complete,
        section4Details: {
          q13: isAnswered(responses.section4.question13),
          q14: isAnswered(responses.section4.question14),
          q15: isAnswered(responses.section4.question15),
          q16: isAnswered(responses.section4.question16)
        },
        section5: section5Complete,
        section5Details: {
          q17: isAnswered(responses.section5.question17),
          q18: isAnswered(responses.section5.question18),
          q19: isAnswered(responses.section5.question19),
          q20: isAnswered(responses.section5.question20),
          q21: isAnswered(responses.section5.question21)
        }
      });
    } else {
      logger.log('✅ All sections complete! Submit button should be enabled.');
    }

    return allSectionsComplete;
  };

  const submitAssessment = async () => {
    if (isReadOnly || !userProfile) return;
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
        description: lang === 'kn' ? 'ವಿದ್ಯಾರ್ಥಿ ಪ್ರೊಫೈಲ್ ಕಂಡುಬಂದಿಲ್ಲ.' : lang === 'ta' ? 'மாணவர் சுயவிவரம் காணப்படவில்லை.' : lang === 'hi' ? 'छात्र प्रोफ़ाइल नहीं मिली।' : 'Student profile not found.',
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
          assessment_type: 'school_learning',
          assessment_title: 'My School, My Learning and I',
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
            ? 'ಮೌಲ್ಯಮಾಪನ ಪೂರ್ಣಗೊಂಡಿದೆ! 📚'
            : lang === 'ta'
              ? 'மதிப்பீடு முடிந்துவிட்டது! 📚'
              : lang === 'hi'
                ? 'मूल्यांकन पूर्ण! 📚'
                : 'Assessment Completed! 📚',
        description:
          lang === 'kn'
            ? 'ನಿಮ್ಮ ಉತ್ತರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!'
            : lang === 'ta'
              ? 'உங்கள் பதில்கள் வெற்றிகரமாக சேமிக்கப்பட்டுள்ளன!'
              : lang === 'hi'
                ? 'आपके उत्तर सफलतापूर्वक सहेजे गए हैं!'
                : 'Your responses have been saved successfully!',
      });

      setIsCompleted(true);
      setTimeout(() => navigate('/student/things-interest-me?from=school_learning'), 2000);

      // AI summary generation disabled — may re-enable later
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
        ? '"ನನ್ನ ಶಾಲೆ, ನನ್ನ ಕಲಿಕೆ ಮತ್ತು ನಾನು" ಮೌಲ್ಯಮಾಪನವನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...'
        : lang === 'ta'
          ? '"என் பள்ளி, என் கற்றல் மற்றும் நான்" மதிப்பீடு ஏற்றப்படுகிறது...'
          : lang === 'hi'
            ? '"मेरा विद्यालय, मेरी शिक्षा और मैं" मूल्यांकन लोड हो रहा है...'
            : 'Loading your school learning assessment...';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">{loadingText}</p>
        </div>
      </div>
    );
  }

  if (isCompleted && !readOnlyView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-0 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-green-50 to-emerald-50">
              <School className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-green-800">
                {lang === 'kn'
                  ? 'ಮೌಲ್ಯಮಾಪನ ಪೂರ್ಣಗೊಂಡಿದೆ! 🏫'
                  : lang === 'ta'
                    ? 'மதிப்பீடு முடிந்துவிட்டது! 🏫'
                    : lang === 'hi'
                      ? 'मूल्यांकन पूर्ण! 🏫'
                      : 'Assessment Completed! 🏫'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  {lang === 'kn'
                    ? 'ನಿಮ್ಮ ಆಲೋಚನೆಗಳನ್ನು ಹಂಚಿಕೊಂಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು!'
                    : lang === 'ta'
                      ? 'உங்கள் எண்ணங்களை எங்களுடன் பகிர்ந்ததற்கு நன்றி!'
                      : lang === 'hi'
                        ? 'अपने विचार साझा करने के लिए धन्यवाद!'
                        : 'Thank you for sharing your thoughts!'}
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('readonly', '1');
                      navigate(`/student/assessment/school-learning?${params.toString()}`);
                    }}
                  >
                    {lang === 'kn'
                      ? 'ನನ್ನ ಉತ್ತರಗಳನ್ನು ನೋಡಿ'
                      : lang === 'ta'
                        ? 'என் பதில்களை காண'
                        : lang === 'hi'
                          ? 'मेरे उत्तर देखें'
                          : 'View My Answers'}
                  </Button>
                  <Button onClick={() => navigate('/student')} className="bg-green-600 hover:bg-green-700">
                    {lang === 'kn'
                      ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ'
                      : lang === 'ta'
                        ? 'டாஷ்போர்டுக்கு திரும்ப செல்ல'
                        : lang === 'hi'
                          ? 'डैशबोर्ड पर वापस'
                          : 'Back to Dashboard'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const sectionOrder = ['section1', 'section2', 'section3', 'section4', 'section5', 'section6'] as const;
  const sectionNames = {
    section1: 'School Experience',
    section2: 'Subjects & Learning Preferences',
    section3: 'Academic Performance & Learning Methods',
    section4: 'School Relationships & Experiences',
    section5: 'Future & Reflection',
    section6: 'Summary'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-8" lang={lang} dir="auto">
      <div className="container mx-auto px-4 max-w-4xl">

        <div className="text-center mb-8">
          <div className="text-left mb-2">
            <Button variant="ghost" onClick={() => navigate('/student')} className="text-green-700 hover:text-green-800">
              <ArrowLeft className="w-4 h-4 mr-2" />{t('backToDashboard')}
            </Button>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-green-800 mb-2">
            {dbTitle || (lang === 'kn'
              ? '🏫 ನನ್ನ ಶಾಲೆ, ನನ್ನ ಕಲಿಕೆ ಮತ್ತು ನಾನು'
              : lang === 'ta'
                ? '🏫 என் பள்ளி, என் படிப்பு மற்றும் நான்'
                : lang === 'hi'
                  ? '🏫 मेरा विद्यालय, मेरी शिक्षा और मैं'
                  : '🏫 My School, My Learning and I')}
          </h1>
          <p className="text-gray-700 mt-4 whitespace-pre-wrap">
            {dbIntro || (lang === 'kn'
              ? 'ಶಾಲೆ, ಕಲಿಕೆ ಮತ್ತು ನಿಮ್ಮ ಅನುಭವಗಳ ಬಗ್ಗೆ ನಿಮ್ಮ ಆಲೋಚನೆಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ. ನಿಧಾನವಾಗಿ ಯೋಚಿಸಿ, ಸತ್ಯವಾಗಿ ಉತ್ತರಿಸಿ.'
              : lang === 'ta'
                ? 'பள்ளி, படிப்பு மற்றும் உங்கள் அனுபவங்களைப் பற்றி உங்கள் எண்ணங்களை பகிருங்கள். மெதுவாக யோசித்து நேர்மையாக பதில் எழுதுங்கள்.'
                : lang === 'hi'
                  ? 'विद्यालय, शिक्षा और अपने अनुभवों के बारे में अपने विचार साझा करें। समय लें और ईमानदारी से उत्तर दें।'
                  : 'Share your thoughts about school, learning, and your experiences. Take your time and answer honestly.')}
          </p>
        </div>

        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{t('yourProgress')}</h2>
              <Badge variant="secondary">
                {Math.round(getProgressPercentage())}% {t('completeSuffix')}
              </Badge>
            </div>
            <Progress value={getProgressPercentage()} className="h-3" />
          </CardContent>
        </Card>

        <div className="flex justify-center mb-6 gap-2 flex-wrap flex-col sm:flex-row">
          {(['section1', 'section2', 'section3', 'section4', 'section5', 'section6'] as const).map((section) => {
            const sectionNumber = Number(section.replace('section', ''));

            let label = '';
            if (sectionNumber === 6) {
              label = lang === 'kn' ? 'ಸಾರಾಂಶ' : lang === 'ta' ? 'சுருக்கம்' : lang === 'hi' ? 'सारांश' : 'Summary';
            } else {
              label =
                lang === 'kn'
                  ? `ಭಾಗ ${sectionNumber}`
                  : lang === 'ta'
                    ? `பகுதி ${sectionNumber}`
                    : lang === 'hi'
                      ? `भाग ${sectionNumber}`
                      : `Section ${sectionNumber}`;
            }
            const isSummary = sectionNumber === 6;
            const isLocked = isSummary && !areCoreSectionsComplete();

            return (
              <button
                key={section}
                onClick={() => !isLocked && setCurrentSection(section)}
                disabled={isLocked && !isReadOnly}
                className={`px-4 py-2 rounded-md transition-all text-sm w-full sm:w-auto flex items-center justify-center gap-2 ${currentSection === section
                  ? 'bg-green-600 text-white shadow-md'
                  : isLocked ? 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100' : 'bg-white text-gray-600 hover:text-green-600 border border-gray-200'
                  }`}
              >
                {isSummary && <Sparkles className={`w-3 h-3 ${isLocked ? 'text-gray-400' : 'text-yellow-500'}`} />}
                {label}
                {isSummary && isLocked && <Lock className="w-3 h-3 opacity-70" />}
              </button>
            );
          })}
        </div>

        {currentSection === 'section1' && (
          <Card className="border-0 shadow-lg mb-4">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-xl text-green-800">
                {lang === 'kn'
                  ? 'ಭಾಗ 1: ಶಾಲಾ ಅನುಭವ'
                  : lang === 'ta'
                    ? 'பகுதி 1: பள்ளி அனுபவம்'
                    : lang === 'hi'
                      ? 'भाग 1: विद्यालय अनुभव'
                      : 'Section 1: School Experience'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(1, '1. Do you like coming to school? Why?')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-green-700 hover:text-green-800 ml-2"
                    onClick={() => toggleHelp('q1')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q1'] && (
                  <div className="mb-2 p-3 rounded border bg-green-50 border-green-200 text-sm text-green-800">
                    {getHelpText(1, 'Write whether you like coming to school and give the reason.')}
                  </div>
                )}
                <Textarea
                  placeholder={getHelpText(1, 'Write whether you like coming to school and give the reason.')}
                  value={responses.section1.question1}
                  onChange={(e) => handleResponseChange('section1', 'question1', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-green-200 focus:border-green-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(2, '2. What do you like to learn at school?')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-green-700 hover:text-green-800 ml-2"
                    onClick={() => toggleHelp('q2')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q2'] && (
                  <div className="mb-2 p-3 rounded border bg-green-50 border-green-200 text-sm text-green-800">
                    {getHelpText(2, 'Write what you like to learn in school.')}
                  </div>
                )}
                <Textarea
                  placeholder={getHelpText(2, 'Write what you like to learn in school.')}
                  value={responses.section1.question2}
                  onChange={(e) => handleResponseChange('section1', 'question2', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-green-200 focus:border-green-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(3, "3. What are the reasons you do not like learning in school? Explain.")}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-green-700 hover:text-green-800 ml-2"
                    onClick={() => toggleHelp('q3')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q3'] && (
                  <div className="mb-2 p-3 rounded border bg-green-50 border-green-200 text-sm text-green-800">
                    {getHelpText(3, 'Clearly write the reasons why you do not like learning in school.')}
                  </div>
                )}
                <Textarea
                  placeholder={getHelpText(3, 'Clearly write the reasons why you do not like learning in school.')}
                  value={responses.section1.question3}
                  onChange={(e) => handleResponseChange('section1', 'question3', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-green-200 focus:border-green-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(4, '4. Who are your close friends in school? What qualities or traits in them have made them your close friends?')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-green-700 hover:text-green-800 ml-2"
                    onClick={() => toggleHelp('q4')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q4'] && (
                  <div className="mb-2 p-3 rounded border bg-green-50 border-green-200 text-sm text-green-800">
                    {getHelpText(4, 'Write about your close friends and the qualities that make them special.')}
                  </div>
                )}
                <Textarea
                  placeholder={getHelpText(4, 'Write about your close friends and the qualities that make them special.')}
                  value={responses.section1.question4}
                  onChange={(e) => handleResponseChange('section1', 'question4', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-green-200 focus:border-green-400"
                />
              </div>

            </CardContent>
          </Card>
        )}

        {currentSection === 'section2' && (
          <Card className="border-0 shadow-lg mb-4">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-xl text-blue-800">
                {lang === 'kn'
                  ? 'ಭಾಗ 2: ವಿಷಯಗಳು ಮತ್ತು ಕಲಿಕೆಯ ಮೆಚ್ಚುಗೆಗಳು'
                  : lang === 'ta'
                    ? 'பகுதி 2: பாடங்கள் மற்றும் கற்றல் விருப்பங்கள்'
                    : lang === 'hi'
                      ? 'भाग 2: विषय और सीखने की प्राथमिकताएँ'
                      : 'Section 2: Subjects & Learning Preferences'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(5, '5. Which subjects do you like the most? Write them.')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-blue-700 hover:text-blue-800 ml-2"
                    onClick={() => toggleHelp('q5')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q5'] && (
                  <div className="mb-2 p-3 rounded border bg-blue-50 border-blue-200 text-sm text-blue-800">
                    {getHelpText(5, 'List the subjects you like the most.')}
                  </div>
                )}
                <Textarea
                  placeholder={getHelpText(5, 'List the subjects you like the most.')}
                  value={responses.section2.question5}
                  onChange={(e) => handleResponseChange('section2', 'question5', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(6, '6. Why do you like this subject? Write the reason.')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-blue-700 hover:text-blue-800 ml-2"
                    onClick={() => toggleHelp('q6')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q6'] && (
                  <div className="mb-2 p-3 rounded border bg-blue-50 border-blue-200 text-sm text-blue-800">
                    {getHelpText(6, 'You may like the subject because it is easy, interesting, or taught well by the teacher.')}
                  </div>
                )}
                <Textarea
                  placeholder={getHelpText(6, 'You may like the subject because it is easy, interesting, or taught well by the teacher.')}
                  value={responses.section2.question6}
                  onChange={(e) => handleResponseChange('section2', 'question6', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(7, '7. Which subjects do you not like to study?')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-blue-700 hover:text-blue-800 ml-2"
                    onClick={() => toggleHelp('q7')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q7'] && (
                  <div className="mb-2 p-3 rounded border bg-blue-50 border-blue-200 text-sm text-blue-800">
                    {getHelpText(7, 'Some subjects may be disliked because they are difficult or hard to understand.')}
                  </div>
                )}
                <Textarea
                  placeholder={getHelpText(7, 'Some subjects may be disliked because they are difficult or hard to understand.')}
                  value={responses.section2.question7}
                  onChange={(e) => handleResponseChange('section2', 'question7', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(8, '8. Why do you have less interest in the above subjects? What help did you receive to learn these subjects?')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-blue-700 hover:text-blue-800 ml-2"
                    onClick={() => toggleHelp('q8')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q8'] && (
                  <div className="mb-2 p-3 rounded border bg-blue-50 border-blue-200 text-sm text-blue-800">
                    {getHelpText(8, 'Interest may be less because the subject is difficult, and help from teachers or friends supports learning.')}
                  </div>
                )}
                <Textarea
                  placeholder={getHelpText(8, 'Interest may be less because the subject is difficult, and help from teachers or friends supports learning.')}
                  value={responses.section2.question8}
                  onChange={(e) => handleResponseChange('section2', 'question8', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>

            </CardContent>
          </Card>
        )}

        {currentSection === 'section3' && (
          <Card className="border-0 shadow-lg mb-4">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-xl text-purple-800">
                {lang === 'kn'
                  ? 'ಭಾಗ 3: ಶೈಕ್ಷಣಿಕ ಸಾಧನೆ ಮತ್ತು ಕಲಿಕೆಯ ವಿಧಾನಗಳು'
                  : lang === 'ta'
                    ? 'பகுதி 3: கல்வி முன்னேற்றம் மற்றும் கற்றல் முறைகள்'
                    : lang === 'hi'
                      ? 'भाग 3: शैक्षणिक प्रदर्शन और सीखने के तरीके'
                      : 'Section 3: Academic Performance & Learning Methods'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(9, '9. Which subjects do you score the highest marks in?')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-purple-700 hover:text-purple-800 ml-2"
                    onClick={() => toggleHelp('q9')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q9'] && (
                  <div className="mb-2 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-800">
                    {getHelpText(9, 'Students usually score higher marks in subjects they understand well and like.')}
                  </div>
                )}
                <Textarea
                  placeholder={getHelpText(9, 'Students usually score higher marks in subjects they understand well and like.')}
                  value={responses.section3.question9}
                  onChange={(e) => handleResponseChange('section3', 'question9', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(10, '10. Which subjects do you score low marks in?')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-purple-700 hover:text-purple-800 ml-2"
                    onClick={() => toggleHelp('q10')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q10'] && (
                  <div className="mb-2 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-800">
                    {getHelpText(10, 'Low marks may be due to lack of understanding or insufficient practice.')}
                  </div>
                )}
                <Textarea
                  placeholder={getHelpText(10, 'Low marks may be due to lack of understanding or insufficient practice.')}
                  value={responses.section3.question10}
                  onChange={(e) => handleResponseChange('section3', 'question10', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(11, '11. Which learning methodologies from the following options resonate with you the most? (Mark with ✔ that applies to you)')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-purple-700 hover:text-purple-800 ml-2"
                    onClick={() => toggleHelp('q11')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q11'] && (
                  <div className="mb-2 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-800">
                    {getHelpText(11, 'Check all the ways you like to learn. You can choose more than one.')}
                  </div>
                )}
                <div className="space-y-3">
                  {[
                    'visual',
                    'audio',
                    'experimenting',
                    'discuss',
                    'groupDiscussions',
                    'presentation',
                    'rolePlay',
                    'teaching'
                  ].map((key) => (
                      <div key={key} className="flex items-start space-x-2">
                        <Checkbox
                          id={key}
                          checked={responses.section3.question11[key as keyof typeof responses.section3.question11] as boolean}
                          onCheckedChange={(checked) => handleLearningMethodChange(key, checked as boolean)}
                          disabled={isReadOnly}
                          className="mt-1"
                        />
                        <label htmlFor={key} className="text-sm font-medium text-gray-700 block">
                          {optionLabels[key] || OPTION_EN_LABELS[key] || key}
                        </label>
                      </div>
                  ))}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="other"
                      checked={responses.section3.question11.other !== ''}
                      onCheckedChange={(checked) => {
                        if (checked) handleLearningMethodChange('other', ' ');
                        else handleLearningMethodChange('other', '');
                      }}
                      disabled={isReadOnly}
                      className="mt-1"
                    />
                    <div className="space-y-1 w-full">
                      <label htmlFor="other" className="text-sm font-medium text-gray-700 block">
                        {lang === 'kn'
                          ? 'ಇನ್ನೊಂದು ವಿಧಾನ ಇದ್ದರೆ – ಅದರಿಂದ ನಾನು ಹೆಚ್ಚು ಚೆನ್ನಾಗಿ ಕಲಿಯುತ್ತೇನೆ (ವಿವರಿಸಿ)'
                          : lang === 'ta'
                            ? 'வேறு ஏதேனும் முறையில் நான் நன்றாக கற்றுக்கொள்கிறேன் – (அந்த முறையை எழுதுங்கள்)'
                            : lang === 'hi'
                              ? 'कोई अन्य तरीका जिससे मैं अच्छी तरह सीखता/सीखती हूँ (बताएं)'
                              : '____________________________ (Any other learning method applicable to you)'}
                      </label>
                      <p className="text-xs text-gray-500">
                        {lang === 'kn'
                          ? ''
                          : lang === 'ta'
                            ? ''
                            : lang === 'hi'
                              ? 'आपके लिए उपयुक्त कोई अन्य सीखने का तरीका लिखें।'
                              : 'Mention any other learning method that suits you.'}
                      </p>

                      {responses.section3.question11.other !== '' && (
                        <Textarea
                          placeholder={getHelpText(11, 'Mention any other learning method that suits you...')}
                          value={responses.section3.question11.other}
                          onChange={(e) => handleLearningMethodChange('other', e.target.value)}
                          rows={2}
                          readOnly={isReadOnly}
                          className="border-purple-200 focus:border-purple-400 mt-2"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(12, '12. Do you prefer to learn alone or in a group? Why? Write the reason.')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-purple-700 hover:text-purple-800 ml-2"
                    onClick={() => toggleHelp('q12')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q12'] && (
                  <div className="mb-2 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-800">
                    {getHelpText(12, 'Select your preferred learning method and write the reason.')}
                  </div>
                )}
                <Textarea
                  placeholder={getHelpText(12, 'Select your preferred learning method and write the reason.')}
                  value={responses.section3.question12}
                  onChange={(e) => handleResponseChange('section3', 'question12', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

            </CardContent>
          </Card>
        )}

        {currentSection === 'section4' && (
          <Card className="border-0 shadow-lg mb-4">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
              <CardTitle className="text-xl text-orange-800">
                {lang === 'kn'
                  ? 'ಭಾಗ 4: ಶಾಲೆಯ ಸಂಬಂಧಗಳು ಮತ್ತು ಅನುಭವಗಳು'
                  : lang === 'ta'
                    ? 'பகுதி 4: பள்ளியில் உள்ள உறவுகள் மற்றும் அனுபவங்கள்'
                    : lang === 'hi'
                      ? 'भाग 4: विद्यालय के संबंध और अनुभव'
                      : 'Section 4: School Relationships & Experiences'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(13, '13. Do you learn from your friends in school? List some of the things you have recently learned from friends at school.')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-orange-700 hover:text-orange-800 ml-2"
                    onClick={() => toggleHelp('q13')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q13'] && (
                  <div className="mb-2 p-3 rounded border bg-orange-50 border-orange-200 text-sm text-orange-800">
                    {getHelpText(13, 'Recall and list what you learned from your friends.')}
                  </div>
                )}

                <Textarea
                  placeholder={getHelpText(13, 'Recall and list what you learned from your friends.')}
                  value={responses.section4.question13}
                  onChange={(e) => handleResponseChange('section4', 'question13', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(14, '14. Apart from textbook subjects, what aspects attract you to school?')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-orange-700 hover:text-orange-800 ml-2"
                    onClick={() => toggleHelp('q14')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q14'] && (
                  <div className="mb-2 p-3 rounded border bg-orange-50 border-orange-200 text-sm text-orange-800">
                    {getHelpText(14, 'Write the other activities or aspects that make school appealing.')}
                  </div>
                )}
                <Textarea
                  placeholder={getHelpText(14, 'Write the other activities or aspects that make school appealing.')}
                  value={responses.section4.question14}
                  onChange={(e) => handleResponseChange('section4', 'question14', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(15, '15. Who are your two favourite teachers and why? How have these two teachers influenced you?')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-orange-700 hover:text-orange-800 ml-2"
                    onClick={() => toggleHelp('q15')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q15'] && (
                  <div className="mb-2 p-3 rounded border bg-orange-50 border-orange-200 text-sm text-orange-800">
                    {getHelpText(15, 'Write about your favourite teachers and how they influenced you.')}
                  </div>
                )}
                <Textarea
                  placeholder={getHelpText(15, 'Write about your favourite teachers and how they influenced you.')}
                  value={responses.section4.question15}
                  onChange={(e) => handleResponseChange('section4', 'question15', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(16, '16. Is there any specific incident or experience in school that gave you a great sense of success or satisfaction? What is it?')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-orange-700 hover:text-orange-800 ml-2"
                    onClick={() => toggleHelp('q16')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q16'] && (
                  <div className="mb-2 p-3 rounded border bg-orange-50 border-orange-200 text-sm text-orange-800">
                    {getHelpText(16, 'Write about a school incident that made you feel successful or satisfied.')}
                  </div>
                )}
                <Textarea
                  placeholder={getHelpText(16, 'Write about a school incident that made you feel successful or satisfied.')}
                  value={responses.section4.question16}
                  onChange={(e) => handleResponseChange('section4', 'question16', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>

            </CardContent>
          </Card>
        )}

        {currentSection === 'section5' && (
          <Card className="border-0 shadow-lg mb-4">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
              <CardTitle className="text-xl text-teal-800">
                {lang === 'kn'
                  ? 'ಭಾಗ 5: ಭವಿಷ್ಯ ಮತ್ತು ಚಿಂತನೆ'
                  : lang === 'ta'
                    ? 'பகுதி 5: எதிர்காலம் மற்றும் சிந்தனை'
                    : lang === 'hi'
                      ? 'भाग 5: भविष्य और चिंतन'
                      : 'Section 5: Future & Reflection'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(17, '17. How do the things you learned in school help you achieve your dreams and expectations?')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-teal-700 hover:text-teal-800 ml-2"
                    onClick={() => toggleHelp('q17')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q17'] && (
                  <div className="mb-2 p-3 rounded border bg-teal-50 border-teal-200 text-sm text-teal-800">
                    {getHelpText(17, 'Relate what you learned in school to your dreams and goals.')}
                  </div>
                )}
                <Textarea
                  placeholder={getHelpText(17, 'Relate what you learned in school to your dreams and goals.')}
                  value={responses.section5.question17}
                  onChange={(e) => handleResponseChange('section5', 'question17', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-teal-200 focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(18, '18. What are the things you want to be changed in your school? What is the reason for that?')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-teal-700 hover:text-teal-800 ml-2"
                    onClick={() => toggleHelp('q18')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q18'] && (
                  <div className="mb-2 p-3 rounded border bg-teal-50 border-teal-200 text-sm text-teal-800">
                    {getHelpText(18, 'Write the changes you want and the reasons for them.')}
                  </div>
                )}
                <Textarea
                  placeholder={getHelpText(18, 'Write the changes you want and the reasons for them.')}
                  value={responses.section5.question18}
                  onChange={(e) => handleResponseChange('section5', 'question18', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-teal-200 focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(19, '19. Do you have any special place to express yourself? Why is it necessary?')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-teal-700 hover:text-teal-800 ml-2"
                    onClick={() => toggleHelp('q19')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q19'] && (
                  <div className="mb-2 p-3 rounded border bg-teal-50 border-teal-200 text-sm text-teal-800">
                    {getHelpText(19, 'Write about a place where you express yourself and why it is necessary.')}
                  </div>
                )}
                <Textarea
                  placeholder={getHelpText(19, 'Write about a place where you express yourself and why it is necessary.')}
                  value={responses.section5.question19}
                  onChange={(e) => handleResponseChange('section5', 'question19', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-teal-200 focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(20, '20. Does the school play an important role in your life related to learning? Write your opinion.')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-teal-700 hover:text-teal-800 ml-2"
                    onClick={() => toggleHelp('q20')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q20'] && (
                  <div className="mb-2 p-3 rounded border bg-teal-50 border-teal-200 text-sm text-teal-800">
                    {getHelpText(20, 'Write your opinion about the role of school in your learning.')}
                  </div>
                )}
                <Textarea
                  placeholder={getHelpText(20, 'Write your opinion about the role of school in your learning.')}
                  value={responses.section5.question20}
                  onChange={(e) => handleResponseChange('section5', 'question20', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-teal-200 focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(21, '21. Do you like to discuss school activities and learning with your parents? What topics do you discuss with them?')}<span className="text-red-500 text-sm">*</span>
                  <button
                    type="button"
                    aria-label="Help"
                    className="text-teal-700 hover:text-teal-800 ml-2"
                    onClick={() => toggleHelp('q21')}
                  >
                    💬
                  </button>
                </label>
                {helpOpen['q21'] && (
                  <div className="mb-2 p-3 rounded border bg-teal-50 border-teal-200 text-sm text-teal-800">
                    {getHelpText(21, 'Write the school-related topics you discuss with your parents.')}
                  </div>
                )}
                <Textarea
                  placeholder={getHelpText(21, 'Write the school-related topics you discuss with your parents.')}
                  value={responses.section5.question21}
                  onChange={(e) => handleResponseChange('section5', 'question21', e.target.value)}
                  rows={3}
                  readOnly={isReadOnly}
                  className="border-teal-200 focus:border-teal-400"
                />
              </div>

            </CardContent>
          </Card>
        )}

        {currentSection === 'section6' && (
          <Card className="border-0 shadow-lg mb-4">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
              <CardTitle className="text-xl text-gray-800">
                {dbSummaryTitle || (lang === 'kn'
                  ? 'ಭಾಗ 6: ಸಾರಾಂಶ'
                  : lang === 'ta'
                    ? 'பகுதி 6: சுருக்கம்'
                    : lang === 'hi'
                      ? 'भाग 6: सारांश'
                      : 'Section 6: Summary')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {[1, 2, 3, 4, 5, 6].map((qNum) => {
                const qKey = `question${qNum}` as keyof typeof responses.section6;
                const sq = summaryQuestions.find(q => q.sequence_number === qNum);

                // Use translated fields from DB RPC, fallback to English defaults
                const defaultHeaders = [
                  "My future plan",
                  null, null, null, null, null
                ];
                const defaultQuestions = [
                  "Subjects I like",
                  "Careers I can pursue based on the subjects I like",
                  "Subjects I do not like",
                  "Careers I can pursue if I make progress in the subjects I do not like",
                  "Other activities / areas in which I perform well along with academic subjects",
                  "If I improve these skills, it will help me in choosing my job / career."
                ];

                const header = sq?.translated_header || sq?.section_header || defaultHeaders[qNum - 1];
                const questionText = sq?.translated_text || defaultQuestions[qNum - 1];

                return (
                  <div key={qKey} className="mb-6">
                    {header && (
                      <h3 className="text-lg font-bold text-gray-800 mb-3 bg-gray-100 p-2 rounded">
                        {header}
                      </h3>
                    )}
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {questionText}<span className="text-red-500 text-sm ml-1">*</span>
                    </label>
                    <Textarea
                      value={responses.section6[qKey]}
                      onChange={(e) => handleResponseChange('section6', qKey, e.target.value)}
                      rows={3}
                      readOnly={isReadOnly}
                      className="border-gray-200 focus:border-gray-400"
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Unified Navigation Footer */}
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-8 gap-4 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              const currentIndex = sectionOrder.indexOf(currentSection);
              if (currentIndex > 0) {
                setCurrentSection(sectionOrder[currentIndex - 1]);
                window.scrollTo(0, 0);
              }
            }}
            disabled={sectionOrder.indexOf(currentSection) === 0}
            className="w-full sm:w-auto border-green-200 text-green-700 hover:bg-green-50"
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
              onClick={() => saveSection(currentSection)}
              disabled={!!savingSection || isReadOnly}
              className="w-full sm:w-auto border-green-200 text-green-700 hover:bg-green-50"
            >
              {savingSection === currentSection ? (
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

            {sectionOrder.indexOf(currentSection) < sectionOrder.length - 1 ? (
              <Button
                variant="outline"
                onClick={() => {
                  const currentIndex = sectionOrder.indexOf(currentSection);
                  if (currentIndex < sectionOrder.length - 1) {
                    const nextSection = sectionOrder[currentIndex + 1];
                    if (nextSection === 'section6' && !areCoreSectionsComplete()) {
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
                    window.scrollTo(0, 0);
                  }
                }}
                className="w-full sm:w-auto border-green-200 text-green-700 hover:bg-green-50"
              >
                {lang === 'kn'
                  ? 'ಮುಂದಿನ ಭಾಗ'
                  : lang === 'ta'
                    ? 'அடுத்த பகுதி'
                    : lang === 'hi'
                      ? 'अगला भाग'
                      : 'Next Section'}
              </Button>
            ) : (
              <Button
                onClick={submitAssessment}
                disabled={!canSubmit() || submitting || isReadOnly}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {lang === 'kn'
                      ? 'ಸಲ್ಲಿಸುತ್ತಿದೆ...'
                      : lang === 'ta'
                        ? 'சமர்ப்பித்து கொண்டிருக்கிறது...'
                        : lang === 'hi'
                          ? 'जमा किया जा रहा है...'
                          : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <School className="w-4 h-4 mr-2" />
                    {lang === 'kn'
                      ? 'ಮೌಲ್ಯಮಾಪನವನ್ನು ಸಲ್ಲಿಸಿ'
                      : lang === 'ta'
                        ? 'மதிப்பீட்டை சமர்ப்பிக்கவும்'
                        : lang === 'hi'
                          ? 'मूल्यांकन जमा करें'
                          : 'Submit Assessment'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

      </div >
      <IndicKeyboard lang={lang} />
    </div >
  );
}

