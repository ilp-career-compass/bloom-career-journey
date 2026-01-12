import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { School, Save, CheckCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import { fetchTranslations } from '@/services/translationService';

import { KannadaKeyboard } from '@/components/ui/KannadaKeyboard';
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
    }
  });
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState<Record<string, boolean>>({});

  const toggleHelp = (key: string) => {
    setHelpOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentSection, setCurrentSection] = useState<'section1' | 'section2' | 'section3' | 'section4' | 'section5'>('section1');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewParam = (searchParams.get('readonly') || searchParams.get('view') || '').toLowerCase();
  const readOnlyView = viewParam === '1' || viewParam === 'true';
  const isReadOnly = isCompleted || readOnlyView;
  const [helpTranslations, setHelpTranslations] = useState<Record<string, string>>({});

  // Load localized help text from content_translations (school_help)
  // Load localized help text from content_translations (school_help)
  // Load localized help text from content_translations (school_help)
  useEffect(() => {
    const loadHelpTranslations = async () => {
      try {
        const keys = Array.from({ length: 21 }, (_, i) => `question${i + 1}`);
        const map = await fetchTranslations('school_help', keys, lang);
        setHelpTranslations(map);
      } catch (error) {
        console.warn('MySchoolLearningAssessment: failed to load help translations', error);
        setHelpTranslations({});
      }
    };

    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from('school_learning_questions')
          .select('*')
          .order('sequence_number');

        if (error) {
          console.error('Error fetching questions:', error);
          return;
        }

        if (data) {
          setQuestions(data);
        }
      } catch (error) {
        console.error('Error in fetchQuestions:', error);
      }
    };

    loadHelpTranslations();
    fetchQuestions();
  }, [lang]);

  const getHelpText = (id: number, fallback: string) => {
    const key = `question${id}`;
    return helpTranslations[key] || fallback;
  };

  const getLearningMethodOption = (key: string) => {
    const options: Record<string, { label: string; help: string }> = {
      visual: {
        label: 'Observe the experiment and explain by relating it with suitable illustrative pictures (audio-visual medium).',
        help: 'Observe and explain clearly using related pictures.'
      },
      audio: {
        label: 'Oral explanation (audio medium).',
        help: 'Explain clearly through oral explanation.'
      },
      experimenting: {
        label: 'Learning through experiment / experiential learning.',
        help: 'Learn through hands-on activity and experience.'
      },
      discuss: {
        label: 'Discussion / Reasoning.',
        help: 'Discuss ideas and explain logically.'
      },
      groupDiscussions: {
        label: 'Group discussion.',
        help: 'Share ideas and discuss as a group.'
      },
      presentation: {
        label: 'Presentation.',
        help: 'Present the topic clearly and in an organized manner.'
      },
      rolePlay: {
        label: 'Oral practice through role play.',
        help: 'Practice speaking through role play.'
      },
      teaching: {
        label: 'I learn by teaching others.',
        help: 'Write about how you learn by teaching others.'
      }
    };
    return options[key] || { label: key, help: '' };
  };

  const getLearningMethodLabel = (key: string): string => {
    return getLearningMethodOption(key).label;
  };

  // Helper to get Tamil question labels while preserving existing English structure
  const qLabel = (id: number, en: string): string => {
    if (lang === 'ta') {
      switch (id) {
        case 1:
          return '1. உங்களுக்கு பள்ளிக்கு வருவது பிடிக்கிறதா? ஏன்?';
        case 2:
          return '2. பள்ளியில் நீங்கள் என்ன கற்றுக்கொள்ள விரும்புகிறீர்கள்?';
        case 3:
          return '3. பள்ளியில் படிப்பது உங்களுக்கு பிடிக்காமல் இருக்கக் காரணங்கள் ஏதேனும் உள்ளனவா?';
        case 4:
          return '4. பள்ளியில் உங்கள் மிக நெருக்கமான நண்பர்கள் யார்? அவர்கள் எந்த குணங்கள்/அனுபவங்கள் காரணமாக உங்கள் நல்ல நண்பர்களாக இருக்கிறார்கள்?';
        case 5:
          return '5. நீங்கள் கற்றுக்கொள்ள விரும்பும் பாடங்கள்/தலைப்புகள் எவை? எழுதுங்கள்.';
        case 6:
          return '6. இந்த பாடங்கள் அல்லது தலைப்புகள் உங்களை ஏன் ஈர்க்கின்றன? காரணங்களை எழுதுங்கள்.';
        case 7:
          return '7. நீங்கள் கற்றுக்கொள்ள விரும்பாத பாடங்கள் எவை?';
        case 8:
          return '8. மேலே குறிப்பிடப்பட்ட பாடங்களில் உங்களுக்கு குறைந்த ஆர்வம் இருப்பதற்கு காரணம் என்ன? அவற்றை கற்றுக்கொள்ளும்போது எந்த சிரமங்களை எதிர்கொள்கிறீர்கள்?';
        case 9:
          return '9. நீங்கள் எத்தகைய பாடங்களில் நல்ல மதிப்பெண்கள் பெறுகிறீர்கள்?';
        case 10:
          return '10. எந்த பாடங்களில் அதிக மதிப்பெண்கள் பெறுவது உங்களுக்கு கஷ்டமாக இருக்கிறது?';
        case 11:
          return '11. கீழே கொடுக்கப்பட்டுள்ள எந்த வகை கற்றல் முறைகள் உங்களை அதிகம் ஈர்க்கின்றன? (உங்களுக்கு பொருந்தும் அனைத்தையும் ✔ வைத்து குறியிடுங்கள்)';
        case 12:
          return '12. நீங்கள் தனியாக படிப்பதற்கு விரும்புகிறீர்களா அல்லது குழுவில் படிப்பதற்கு விரும்புகிறீர்களா? ஏன்?';
        case 13:
          return '13. பள்ளியில் உங்கள் நண்பர்களிடமிருந்து நீங்கள் கற்றுக்கொள்கிறீர்களா? சமீபத்தில் அவர்களிடமிருந்து நீங்கள் கற்றுக் கொண்ட சில விஷயங்களை எழுதுங்கள்.';
        case 14:
          return '14. பாடங்களைக் காட்டிலும், பள்ளியில் உங்களுக்கு மிகவும் பிடித்த விஷயங்கள் எவை?';
        case 15:
          return '15. உங்களுக்கு மிகவும் பிடித்த ஆசிரியர் யார்? ஏன்? இந்த ஆசிரியர் உங்களை எப்படி பாதித்து உதவியுள்ளார்?';
        case 16:
          return '16. பள்ளியில் நீங்கள் மிகவும் வெற்றி பெற்றதாக அல்லது பெருமை பட்டதாக உணர்ந்த ஒரு நிகழ்வு இருந்ததா? அது என்ன?';
        case 17:
          return '17. பள்ளியில் நீங்கள் கற்றுக் கொண்ட விஷயங்கள் உங்கள் கனவுகள் மற்றும் இலக்குகளை அடைய எப்படி உதவும்? விளக்குங்கள்.';
        case 18:
          return '18. உங்கள் பள்ளியில் மாற்ற வேண்டும் என்று நீங்கள் விரும்பும் ஒரு விஷயம் என்ன? காரணங்களைக் குறிப்பிடுங்கள்.';
        case 19:
          return '19. உங்களுக்கு படிப்பு/பயிற்சி செய்ய தனி இடம் இருக்கிறதா? இருந்தால் அது ஏன் அவசியம் என்று நினைக்கிறீர்கள்?';
        case 20:
          return '20. உங்கள் வாழ்க்கையில் கற்றலுக்கு பள்ளி ஒரு முக்கிய பங்கு வகிக்கிறதா? உங்கள் கருத்தை எழுதுங்கள்.';
        case 21:
          return '21. பள்ளி செயல்பாடுகள் மற்றும் நீங்கள் கற்றுக் கொண்ட விஷயங்களைப் பற்றி உங்கள் பெற்றோருடன் பேச நீங்கள் விரும்புகிறீர்களா? அவர்களுடன் எந்த விஷயங்களைப் பற்றி பேசுகிறீர்கள்?';
        default:
          return en;
      }
    }


    // Dynamic fetching for English
    const q = questions.find(i => i.sequence_number === id);
    return q?.question_text || en;
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
      console.log('📥 Loading existing response:', { data, error, recordsCount: records?.length });

      if (data && !error && data.responses) {
        // Only set completed if completed_at exists
        if (data.completed_at) {
          setIsCompleted(true);
        }
        // Merge saved responses with current structure
        const savedResponses = data.responses as any;
        console.log('📋 Saved responses:', savedResponses);

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
          }
        };

        console.log('✅ Merged responses:', mergedResponses);
        setResponses(mergedResponses);
      } else {
        console.log('ℹ️ No existing response found');
      }
    } catch (error) {
      console.error('❌ Error loading existing response:', error);
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

  const saveSection = async (section: 'section1' | 'section2' | 'section3' | 'section4' | 'section5') => {
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
      console.log('💾 Saving section:', section, 'with responses:', responses);

      // First, check if a record exists - get the most recent one
      const { data: existingRecords, error: fetchError } = await supabase
        .from('assessment_responses')
        .select('id, responses')
        .eq('student_id', studentId)
        .eq('assessment_type', 'school_learning')
        .eq('assessment_title', 'My School, My Learning and I')
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
            assessment_type: 'school_learning',
            assessment_title: 'My School, My Learning and I',
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

      toast({
        title:
          lang === 'kn'
            ? 'ಭಾಗವು ಉಳಿಸಲಾಗಿದೆ! ✅'
            : lang === 'ta'
              ? 'பகுதி சேமிக்கப்பட்டது! ✅'
              : 'Section Saved! ✅',
        description:
          lang === 'kn'
            ? `ನಿಮ್ಮ ${section.replace('section', 'ಭಾಗ ')} ಉತ್ತರಗಳನ್ನು ಉಳಿಸಲಾಗಿದೆ.`
            : lang === 'ta'
              ? `உங்கள் ${section.replace('section', 'பகுதி ')} பதில்கள் சேமிக்கப்பட்டுள்ளன.`
              : `Your ${section.replace('section', 'Section ')} responses have been saved.`,
      });
    } catch (error) {
      console.error('Error saving section:', error);
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

  const getProgressPercentage = () => {
    const totalQuestions = 21;
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

    const allSectionsComplete = section1Complete && section2Complete && section3Complete && section4Complete && section5Complete;

    if (!allSectionsComplete) {
      console.log('📋 Submission check:', {
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
      console.log('✅ All sections complete! Submit button should be enabled.');
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
        title: "Error",
        description: "Student profile not found.",
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
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title:
          lang === 'kn'
            ? 'ಮೌಲ್ಯಮಾಪನ ಪೂರ್ಣಗೊಂಡಿದೆ! 📚'
            : lang === 'ta'
              ? 'மதிப்பீடு முடிந்துவிட்டது! 📚'
              : 'Assessment Completed! 📚',
        description:
          lang === 'kn'
            ? 'ನಿಮ್ಮ ಉತ್ತರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!'
            : lang === 'ta'
              ? 'உங்கள் பதில்கள் வெற்றிகரமாக சேமிக்கப்பட்டுள்ளன!'
              : 'Your responses have been saved successfully!',
      });

      setIsCompleted(true);

      try {
        const { aiSummaryService } = await import('@/services/aiSummaryService');
        const summaryDatabaseService = (await import('@/services/summaryDatabaseService')).summaryDatabaseService;

        if (aiSummaryService.isConfigured() && assessmentData?.id) {
          console.log('🤖 Generating AI summary for School Learning assessment:', assessmentData.id);
          const summaryResult = await aiSummaryService.generateSchoolLearningSummary(responses);

          if (summaryResult.success && summaryResult.summary) {
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
                    ? 'ನಿಮ್ಮ “ನನ್ನ ಶಾಲೆ, ನನ್ನ ಕಲಿಕೆ ಮತ್ತು ನಾನು” ಮೌಲ್ಯಮಾಪನದ ಸಾರಾಂಶವನ್ನು ನಿಮ್ಮ ಶಿಕ್ಷಕರು ಪರಿಶೀಲಿಸಲಿದ್ದಾರೆ.'
                    : lang === 'ta'
                      ? '“என் பள்ளி, என் படிப்பு மற்றும் நான்” மதிப்பீட்டின் சுருக்கத்தை உங்கள் ஆசிரியா் விரைவில் பார்வையிடுவார்.'
                      : 'Your teacher will review it.',
              });

              try {
                const { notificationService } = await import('@/services/notificationService');
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
                      title: `${userProfile?.full_name || 'Student'} completed My School, My Learning and I assessment`,
                      message: 'A new assessment summary is ready for review.',
                      link: '/teacher/ai-summary-review'
                    });
                  }
                }
              } catch (notifError) {
                console.error('Error notifying teacher:', notifError);
              }
            }
          }
        }
      } catch (summaryError) {
        console.error('Error in summary generation:', summaryError);
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
        ? '"ನನ್ನ ಶಾಲೆ, ನನ್ನ ಕಲಿಕೆ ಮತ್ತು ನಾನು" ಮೌಲ್ಯಮಾಪನವನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...'
        : lang === 'ta'
          ? '"என் பள்ளி, என் கற்றல் மற்றும் நான்" மதிப்பீடு ஏற்றப்படுகிறது...'
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
                        : 'View My Answers'}
                  </Button>
                  <Button onClick={() => navigate('/student')} className="bg-green-600 hover:bg-green-700">
                    {lang === 'kn'
                      ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ'
                      : lang === 'ta'
                        ? 'டாஷ்போர்டுக்கு திரும்ப செல்ல'
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

  const sectionOrder = ['section1', 'section2', 'section3', 'section4', 'section5'] as const;
  const sectionNames = {
    section1: 'School Experience',
    section2: 'Subjects & Learning Preferences',
    section3: 'Academic Performance & Learning Methods',
    section4: 'School Relationships & Experiences',
    section5: 'Future & Reflection'
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
            {lang === 'kn'
              ? '🏫 ನನ್ನ ಶಾಲೆ, ನನ್ನ ಕಲಿಕೆ ಮತ್ತು ನಾನು'
              : lang === 'ta'
                ? '🏫 என் பள்ளி, என் படிப்பு மற்றும் நான்'
                : '🏫 My School, My Learning and I'}
          </h1>
          <p className="text-gray-700 mt-4">
            {lang === 'kn'
              ? 'ಶಾಲೆ, ಕಲಿಕೆ ಮತ್ತು ನಿಮ್ಮ ಅನುಭವಗಳ ಬಗ್ಗೆ ನಿಮ್ಮ ಆಲೋಚನೆಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ. ನಿಧಾನವಾಗಿ ಯೋಚಿಸಿ, ಸತ್ಯವಾಗಿ ಉತ್ತರಿಸಿ.'
              : lang === 'ta'
                ? 'பள்ளி, படிப்பு மற்றும் உங்கள் அனுபவங்களைப் பற்றி உங்கள் எண்ணங்களை பகிருங்கள். மெதுவாக யோசித்து நேர்மையாக பதில் எழுதுங்கள்.'
                : 'Share your thoughts about school, learning, and your experiences. Take your time and answer honestly.'}
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
          {(['section1', 'section2', 'section3', 'section4', 'section5'] as const).map((section) => {
            const sectionNumber = Number(section.replace('section', ''));
            const label =
              lang === 'kn'
                ? `ಭಾಗ ${sectionNumber}`
                : lang === 'ta'
                  ? `பகுதி ${sectionNumber}`
                  : `Section ${sectionNumber}`;
            return (
              <button
                key={section}
                onClick={() => setCurrentSection(section)}
                className={`px-4 py-2 rounded-md transition-all text-sm w-full sm:w-auto ${currentSection === section
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:text-green-600 border border-gray-200'
                  }`}
              >
                {label}
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
                    : 'Section 1: School Experience'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(1, '1. Do you like coming to school? Why?')}
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
                  {qLabel(2, '2. What do you like to learn at school?')}
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
                  {qLabel(3, "3. What are the reasons you do not like learning in school? Explain.")}
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
                  {qLabel(4, '4. Who are your close friends in school? What qualities or traits in them have made them your close friends?')}
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
                    : 'Section 2: Subjects & Learning Preferences'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(5, '5. Which subjects do you like the most? Write them.')}
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
                  {qLabel(6, '6. Why do you like this subject? Write the reason.')}
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
                  {qLabel(7, '7. Which subjects do you not like to study?')}
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
                  {qLabel(8, '8. Why do you have less interest in the above subjects? What help did you receive to learn these subjects?')}
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
                    : 'Section 3: Academic Performance & Learning Methods'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(9, '9. Which subjects do you score the highest marks in?')}
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
                  {qLabel(10, '10. Which subjects do you score low marks in?')}
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
                  {qLabel(11, '11. Which learning methodologies from the following options resonate with you the most? (Mark with ✔ that applies to you)')}
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
                  ].map((key) => {
                    const option = getLearningMethodOption(key);
                    return (
                      <div key={key} className="flex items-start space-x-2">
                        <Checkbox
                          id={key}
                          checked={responses.section3.question11[key as keyof typeof responses.section3.question11] as boolean}
                          onCheckedChange={(checked) => handleLearningMethodChange(key, checked as boolean)}
                          disabled={isReadOnly}
                          className="mt-1"
                        />
                        <div className="space-y-1">
                          <label htmlFor={key} className="text-sm font-medium text-gray-700 block">
                            {option.label}
                          </label>
                          <p className="text-xs text-gray-500">
                            {option.help}
                          </p>
                        </div>
                      </div>
                    )
                  })}
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
                            : '____________________________ (Any other learning method applicable to you)'}
                      </label>
                      <p className="text-xs text-gray-500">
                        {lang === 'kn'
                          ? ''
                          : lang === 'ta'
                            ? ''
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
                  {qLabel(12, '12. Do you prefer to learn alone or in a group? Why? Write the reason.')}
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
                    : 'Section 4: School Relationships & Experiences'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(13, '13. Do you learn from your friends in school? List some of the things you have recently learned from friends at school.')}
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
                  {qLabel(14, '14. Apart from textbook subjects, what aspects attract you to school?')}
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
                  {qLabel(15, '15. Who are your two favourite teachers and why? How have these two teachers influenced you?')}
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
                  {qLabel(16, '16. Is there any specific incident or experience in school that gave you a great sense of success or satisfaction? What is it?')}
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
                    : 'Section 5: Future & Reflection'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {qLabel(17, '17. How do the things you learned in school help you achieve your dreams and expectations?')}
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
                  {qLabel(18, '18. What are the things you want to be changed in your school? What is the reason for that?')}
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
                  {qLabel(19, '19. Do you have any special place to express yourself? Why is it necessary?')}
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
                  {qLabel(20, '20. Does the school play an important role in your life related to learning? Write your opinion.')}
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
                  {qLabel(21, '21. Do you like to discuss school activities and learning with your parents? What topics do you discuss with them?')}
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

            {sectionOrder.indexOf(currentSection) < sectionOrder.length - 1 ? (
              <Button
                variant="outline"
                onClick={() => {
                  const currentIndex = sectionOrder.indexOf(currentSection);
                  if (currentIndex < sectionOrder.length - 1) {
                    setCurrentSection(sectionOrder[currentIndex + 1]);
                    window.scrollTo(0, 0);
                  }
                }}
                className="w-full sm:w-auto border-green-200 text-green-700 hover:bg-green-50"
              >
                {lang === 'kn'
                  ? 'ಮುಂದಿನ ಭಾಗ'
                  : lang === 'ta'
                    ? 'அடுத்த பகுதி'
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
                        : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <School className="w-4 h-4 mr-2" />
                    {lang === 'kn'
                      ? 'ಮೌಲ್ಯಮಾಪನವನ್ನು ಸಲ್ಲಿಸಿ'
                      : lang === 'ta'
                        ? 'மதிப்பீட்டை சமர்ப்பிக்கவும்'
                        : 'Submit Assessment'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

      </div >
      <KannadaKeyboard lang={lang} />
    </div >
  );
}

