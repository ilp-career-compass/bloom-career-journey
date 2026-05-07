import { logger } from '@/lib/logger';

// SummaryViewDialog - Student view and edit component for approved summaries

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Lightbulb, User,
  Sparkles,
  Building,
  Briefcase,
  GraduationCap,
  AlertCircle,
  Users,
  Edit3,
  Save,
  X,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLang } from '@/hooks/useLang';
import { parseTalentsEntries, parseDreamEntries, parseHobbiesEntries, parseSchoolLearningEntries } from '../../utils/summaryParsers';
import {
  AssessmentSummary,
  SummaryQuestions,
  getDisplaySummary,
  canStudentEdit,
  getSummaryStatusColor,
  getSummaryStatusLabel
} from '@/types/assessmentSummary';
import { summaryDatabaseService } from '@/services/summaryDatabaseService';
import { supabase } from '@/integrations/supabase/client';

interface SummaryViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: AssessmentSummary | null;
  studentUserId: string;
  onSummaryUpdated?: () => void;
  assessmentType?: string; // Assessment type (inspiration, about_me, etc.)
}

export default function SummaryViewDialog({
  open,
  onOpenChange,
  summary,
  studentUserId,
  onSummaryUpdated,
  assessmentType = 'inspiration'
}: SummaryViewDialogProps) {
  const { toast } = useToast();
  const { lang } = useLang();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const isAboutMeAssessment = assessmentType === 'about_me';
  const isDreamsAssessment = assessmentType === 'dreams';
  const isSchoolLearningAssessment = assessmentType === 'school_learning';
  const isHobbiesAssessment = assessmentType === 'hobbies';
  const isRoleModelsAssessment = assessmentType === 'role_models';
  const [questionTitles, setQuestionTitles] = useState<{ [key: string]: string }>({
    q1: lang === 'kn' ? '1. ಪ್ರಶ್ನೆ 1' : lang === 'ta' ? '1. கேள்வி 1' : lang === 'hi' ? '1. प्रश्न 1' : '1. Question 1',
    q2: lang === 'kn' ? '2. ಪ್ರಶ್ನೆ 2' : lang === 'ta' ? '2. கேள்வி 2' : lang === 'hi' ? '2. प्रश्न 2' : '2. Question 2',
    q3: lang === 'kn' ? '3. ಪ್ರಶ್ನೆ 3' : lang === 'ta' ? '3. கேள்வி 3' : lang === 'hi' ? '3. प्रश्न 3' : '3. Question 3',
  });
  const [editedSummary, setEditedSummary] = useState<SummaryQuestions>({
    question1: '',
    question2: '',
    question3: ''
  });

  const [dreamHeadings, setDreamHeadings] = useState({
    dream: lang === 'kn' ? 'ಕನಸು' : lang === 'ta' ? 'கனவு' : lang === 'hi' ? 'सपना' : 'Dream',
    quality: lang === 'kn'
      ? 'ನಿಮ್ಮಲ್ಲಿ ಈಗಾಗಲೇ ಕಂಡುಕೊಂಡಿರುವ ಯಾವ ಗುಣ/ ಮೌಲ್ಯ/ ಸಾರ್ಥ್ಯ ನಿಮ್ಮ ಕನಸನ್ನು ಸಾಧಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.'
      : lang === 'ta'
        ? 'உங்களிடம் ஏற்கனவே உள்ள எந்த குணம் / மதிப்பு / திறன் இந்த கனவை அடைய உங்களுக்கு உதவும்?'
        : lang === 'hi'
          ? 'आपके पास पहले से कौन सा गुण / मूल्य / क्षमता है जो इस सपने को पूरा करने में मदद करेगी?'
          : 'Which quality/ value/ ability that you already have will help you achieve your dream?',
    prevent: lang === 'kn'
      ? 'ಕನಸು ವಿಫಲವಾಗುವುದಿಲ್ಲ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು ನೀವು ಏನು ಮಾಡಬೇಕಾಗುತ್ತದೆ'
      : lang === 'ta'
        ? 'இந்த கனவு தோல்வியடையாமல் இருக்க நீங்கள் என்ன செய்ய வேண்டும்?'
        : lang === 'hi'
          ? 'यह सुनिश्चित करने के लिए आपको क्या करना होगा कि यह सपना विफल न हो?'
          : 'What do you need to do to make sure this dream does not fail?',
    study: lang === 'kn'
      ? 'ಈ ಕನಸನ್ನುಸಾಧಿಸಲು ೧೦ನೇ ತರಗತಿಯ ನಂತರ ನೀವು ಏನು ಅಧ್ಯಯನ ಮಾಡಬೇಕು? (ಅನ್ವಯಿಸಿದರೆ)'
      : lang === 'ta'
        ? 'இந்த கனவை அடைய 10ஆம் வகுப்பிற்குப் பிறகு நீங்கள் என்ன படிக்க வேண்டும்? (தேவையானால்)'
        : lang === 'hi'
          ? 'इस सपने को पूरा करने के लिए 10वीं के बाद आपको क्या पढ़ना होगा? (यदि लागू हो)'
          : 'To achieve this dream, what do you need to study after Class 10? (if applicable)',
  });

  const schoolLearningColumnHeadings = {
    q1: lang === 'kn' ? 'ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳು' : lang === 'ta' ? '1.நான் விரும்பும் பாடங்கள்' : lang === 'hi' ? 'मुझे पसंद विषय' : 'Subjects I like',
    q2: lang === 'kn' ? 'ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳಿಂದ ನಾನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು' : lang === 'ta' ? '2.நான் விரும்பும் பாடங்களின் மூலம் நான் அடையக்கூடிய தொழில்கள்' : lang === 'hi' ? 'पसंदीदा विषयों से मिलने वाले करियर' : 'Careers I can pursue based on the subjects I like',
    q3: lang === 'kn' ? 'ನಾನು ಇಷ್ಟಪಡದ ವಿಷಯಗಳು' : lang === 'ta' ? '3.நான் விரும்பாத பாடங்கள்' : lang === 'hi' ? 'कठिन लगने वाले विषय' : 'Subjects I do not like',
    q4: lang === 'kn' ? 'ಇಷ್ಟಪಡದ ವಿಷಯಗಳಲ್ಲಿ ನಾನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು' : lang === 'ta' ? '4.நான் விரும்பாத பாடங்களில் முன்னேற்றம் பெற்றால் ನಾನு அடையக்கூடிய தொழில்கள்' : lang === 'hi' ? 'कठिन विषयों में सुधार से मिलने वाले करियर' : 'Careers I can pursue if I make progress in the subjects I do not like',
    q5: lang === 'kn' ? 'ಪಠ್ಯ ವಿಷಯಗಳ ಜೊತೆಗೆ, ನಾನು ಉತ್ತಮ ಸಾಧನೆ ಮಾಡುವ ಇತರ ಚಟುವಟಿಕೆಗಳು / ವಿಷಯಗಳು' : lang === 'ta' ? '5.பாடப்பிரிவுகளுடன் சேர்த்து, நான் சிறப்பாக சாதனை புரியும் பிற செயல்பாடுகள் / விஷயங்கள்' : lang === 'hi' ? 'पाठ्यक्रम के अलावा अन्य गतिविधियाँ जिनमें मैं अच्छा हूँ' : 'Other activities / areas in which I perform well along with academic subjects',
    q6: lang === 'kn' ? 'ನಾನು ಈ ಕೌಶಲ್ಯಗಳನ್ನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ನನ್ನ ಕೆಲಸ / ವೃತ್ತಿಯ ಆಯ್ಕೆಗೆ ಸಹಾಯವಾಗುತ್ತದೆ.' : lang === 'ta' ? '6.இந்த திறன்களில் நான் மேம்பட்டால், என் வேலை / தொழில் தேர்வுக்கு உதவியாக இருக்கும்.' : lang === 'hi' ? 'इन कौशलों में सुधार से करियर चुनाव में मदद मिलेगी।' : 'If I improve these skills, it will help me in choosing my job / career.',
  };

  // Effect to update dreamHeadings from fetched titles (questionTitles is populated from content_translations)
  useEffect(() => {
    if (assessmentType === 'dreams' && questionTitles) {
      setDreamHeadings(prev => {
        const next = { ...prev };
        if (questionTitles['col_dream']) next.dream = questionTitles['col_dream'];
        if (questionTitles['col_quality']) next.quality = questionTitles['col_quality'];
        if (questionTitles['col_prevent']) next.prevent = questionTitles['col_prevent'];
        if (questionTitles['col_study']) next.study = questionTitles['col_study'];
        return next;
      });
    }
  }, [questionTitles, assessmentType]);

  // Fetch question titles from database template based on assessment type
  useEffect(() => {
    const fetchQuestionTitles = async () => {
      if (!assessmentType) return;

      try {
        // 1. Fetch from template table
        const { data: template } = await supabase
          .from('summary_templates')
          .select('summary_questions')
          .eq('assessment_type', assessmentType)
          .maybeSingle();

        let newTitles: { [key: string]: string } = {};

        if (template?.summary_questions) {
          const questions = template.summary_questions as any;
          const preferredKey = lang === 'kn' ? 'kn' : lang === 'ta' ? 'ta' : lang === 'hi' ? 'hi' : 'en';
          const hasPreferred = questions[preferredKey];
          const langKey = hasPreferred ? preferredKey : 'en';

          if (questions[langKey]) {
            Object.keys(questions[langKey]).forEach(key => {
              const shortKey = key.replace('question', 'q');
              newTitles[shortKey] = questions[langKey][key];
            });
          }
        }

        // 2. Fetch specific translations from content_translations (overrides)
        const { data: translations } = await supabase
          .from('content_translations')
          .select('resource_key, text')
          .eq('resource_type', `${assessmentType}_summary_question`)
          .eq('lang', lang);


        if (assessmentType === 'dreams' && questionTitles.col_dream) {
          // ... (handled in render)
        }

        // For School Learning, if we have dynamic summary title/subtitle (from 'title'/'subtitle' keys), 
        // they are already in questionTitles if we allowed them.
        // But fetchQuestionTitles currently filters for 'question' prefix.
        // Let's update the fetch loop to allow 'title' and 'subtitle' keys.
        if (translations && translations.length > 0) {
          translations.forEach(t => {
            if (t.resource_key.startsWith('question')) {
              const shortKey = t.resource_key.replace('question', 'q');
              newTitles[shortKey] = t.text;
            } else if (t.resource_key === 'title') {
              newTitles.title = t.text;
            } else if (t.resource_key === 'subtitle') {
              newTitles.subtitle = t.text;
            } else {
              // Allow other keys (like col_dream)
              newTitles[t.resource_key] = t.text;
            }
          });
        }

        // ... rest of the function


        // Apply special overrides if needed (e.g. Dreams hardcoded titles if not in DB)
        if (assessmentType === 'dreams') {
          newTitles.q1 = lang === 'kn' ? 'ಕನಸು ಪೋರ್ಟ್‌ಫೋಲಿಯೋ' : lang === 'ta' ? 'கனவு திட்டம்' : 'Dream Portfolio';
        } else if (assessmentType === 'hobbies') {
          newTitles.q1 = 'Hobbies';
          newTitles.q6 = 'Talents';
        } else if (assessmentType === 'role_models') {
          newTitles.q1 = lang === 'kn' ? 'ನಿಮ್ಮ ಪಾತ್ರ ಮಾದರಿಗಳಿಂದ ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನದ ಕುರಿತಾಗಿ ನೀವು ಕೇಳಲು ಬಯಸುವ 5 ರಿಂದ 10 ಪ್ರಶ್ನೆಗಳನ್ನು ಬರೆಯಿರಿ.' : lang === 'ta' ? 'தொழில் வழிகாட்டல் குறித்து உங்கள் முன்மாதிரி நபர்களிடம் கேட்க விரும்பும் 5 முதல் 10 கேள்விகளை எழுதுங்கள்.' : 'Write 5 to 10 questions you would like to ask your role model for career guidance.';
        }

        // Ensure we have at least q1..q3 for basic assessments
        if (!newTitles.q1) newTitles.q1 = (lang === 'kn' ? '1. ಪ್ರಶ್ನೆ 1' : lang === 'ta' ? '1. கேள்வி 1' : '1. Question 1');
        if (!newTitles.q2 && !['dreams', 'school_learning', 'hobbies', 'role_models'].includes(assessmentType)) {
          newTitles.q2 = (lang === 'kn' ? '2. ಪ್ರಶ್ನೆ 2' : lang === 'ta' ? '2. கேள்வி 2' : '2. Question 2');
        }
        if (!newTitles.q3 && !['dreams', 'school_learning', 'hobbies', 'role_models'].includes(assessmentType)) {
          newTitles.q3 = (lang === 'kn' ? '3. ಪ್ರಶ್ನೆ 3' : lang === 'ta' ? '3. கேள்வி 3' : '3. Question 3');
        }

        setQuestionTitles(newTitles);

      } catch (error) {
        logger.error('Error fetching question titles:', error);
      }
    };

    if (open && assessmentType) {
      fetchQuestionTitles();
    }
  }, [assessmentType, open, lang]);

  // Load current summary content when dialog opens or summary changes
  useEffect(() => {
    // Only load the summary if:
    // 1. The summary exists and dialog is open
    // 2. AND we are not currently in edit mode (to avoid overwriting student's unsaved changes)
    if (summary && open && !isEditing) {
      const displaySummary = getDisplaySummary(summary);
      const newEditedSummary: any = { ...displaySummary };
      setEditedSummary(newEditedSummary);
      logger.log('📝 SummaryViewDialog: Loaded/Updated summary content because not in edit mode');
    }
  }, [summary, open, isEditing]);

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen && isEditing) {
      setIsEditing(false);
    }
    onOpenChange(newOpen);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (summary) {
      const displaySummary = getDisplaySummary(summary);
      setEditedSummary({
        question1: displaySummary.question1,
        question2: displaySummary.question2,
        question3: displaySummary.question3,
        question4: displaySummary.question4 || '',
        question5: displaySummary.question5 || '',
        question6: displaySummary.question6 || ''
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!summary) return;

    // Validate that all fields have content
    const requiredQuestions: string[] = [];

    if (isSchoolLearningAssessment) {
      requiredQuestions.push(editedSummary.question1, editedSummary.question2, editedSummary.question3, editedSummary.question4, editedSummary.question5, editedSummary.question6);
    } else if (isHobbiesAssessment) {
      requiredQuestions.push(editedSummary.question1, editedSummary.question6);
    } else if (isAboutMeAssessment) {
      // Require all 16 questions for About Me
      for (let i = 1; i <= 16; i++) {
        requiredQuestions.push(editedSummary[`question${i}`] || '');
      }
    } else {
      // Default (Inspiration, etc) - 3 questions
      requiredQuestions.push(editedSummary.question1, editedSummary.question2, editedSummary.question3);
    }

    // For Dreams and Hobbies, validate that portfolio fields are valid JSON arrays
    const jsonFields: Array<{ value: string; label: string }> = [];
    if (isDreamsAssessment) {
      jsonFields.push({ value: editedSummary.question1 || '', label: 'Dream Portfolio' });
    } else if (isHobbiesAssessment) {
      jsonFields.push({ value: editedSummary.question1 || '', label: 'Hobbies Portfolio' });
      jsonFields.push({ value: editedSummary.question6 || '', label: 'Skills Portfolio' });
    }
    for (const field of jsonFields) {
      try {
        const parsed = JSON.parse(field.value);
        if (!Array.isArray(parsed)) throw new Error('not an array');
      } catch {
        toast({
          title: lang === 'kn' ? "ತಪ್ಪಾದ ಸ್ವರೂಪ" : lang === 'ta' ? 'தவறான வடிவம்' : lang === 'hi' ? 'अमान्य स्वरूप' : "Invalid Format",
          description:
            lang === 'kn' ? `${field.label} ಮಾನ್ಯ JSON ಪಟ್ಟಿಯಾಗಿರಬೇಕು.`
              : lang === 'ta' ? `${field.label} சரியான JSON பட்டியலாக இருக்க வேண்டும்.`
              : lang === 'hi' ? `${field.label} एक मान्य JSON सूची होनी चाहिए।`
              : `${field.label} must be a valid JSON array.`,
          variant: "destructive"
        });
        return;
      }
    }

    // Filter out undefined and check if empty
    const allFilled = requiredQuestions.every(q => q && q.trim().length > 0);

    if (!allFilled) {
      const questionCount = isSchoolLearningAssessment ? 6 : isHobbiesAssessment ? 2 : isAboutMeAssessment ? 16 : 3;
      toast({
        title: lang === 'kn' ? "ಅಪೂರ್ಣ ಸಾರಾಂಶ" : lang === 'ta' ? 'சுருக்கம் இன்னும் முழுமை அடையவில்லை' : lang === 'hi' ? 'सारांश अधूरा है' : "Incomplete Summary",
        description:
          lang === 'kn'
            ? `ಉಳಿಸುವ ಮೊದಲು ಎಲ್ಲಾ ${questionCount} ಪ್ರಶ್ನೆಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.`
            : lang === 'ta'
              ? `சேமிக்க முன் எல்லா ${questionCount} கேள்விகளுக்கும் பதில் எழுதுங்கள்.`
              : lang === 'hi'
                ? `सहेजने से पहले सभी ${questionCount} प्रश्नों के उत्तर भरें।`
                : `Please fill in all ${questionCount} questions before saving.`,
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const result = await summaryDatabaseService.updateStudentSummary(
        summary.id,
        studentUserId,
        editedSummary
      );

      if (result.success) {
        toast({
          title: lang === 'kn' ? "ಸಾರಾಂಶ ನವೀಕರಿಸಲಾಗಿದೆ! ✨" : lang === 'ta' ? 'சுருக்கம் சேமிக்கப்பட்டது! ✨' : lang === 'hi' ? 'सारांश सहेजा गया! ✨' : "Summary Updated! ✨",
          description:
            lang === 'kn'
              ? "ನಿಮ್ಮ ಪ್ರತಿಬಿಂಬ ಸಾರಾಂಶ ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ."
              : lang === 'ta'
                ? 'உங்கள் சுருக்கம் வெற்றிகரமாக சேமிக்கப்பட்டது.'
                : lang === 'hi'
                  ? 'आपका सारांश सफलतापूर्वक सहेजा गया।'
                  : "Your reflection summary has been saved successfully."
        });
        setIsEditing(false);
        onSummaryUpdated?.();
      } else {
        throw new Error(result.error || 'Failed to update summary');
      }
    } catch (error) {
      logger.error('Error saving summary:', error);
      toast({
        title: lang === 'kn' ? "ದೋಷ" : lang === 'ta' ? 'பிழை' : lang === 'hi' ? 'त्रुटि' : "Error",
        description:
          lang === 'kn'
            ? "ನಿಮ್ಮ ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
            : lang === 'ta'
              ? 'உங்கள் மாற்றங்களை சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
              : lang === 'hi'
                ? 'आपके बदलाव सहेजे नहीं जा सके। कृपया पुनः प्रयास करें।'
                : "Failed to save your changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!summary || (summary.approval_status !== 'approved' && summary.approval_status !== 'revision_requested')) {
    return (
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" lang={lang} dir="auto">
          {/* Summary Header */}
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-center text-blue-900">
              {questionTitles.title || (lang === 'kn' ? 'ಸಾರಾಂಶ' : lang === 'ta' ? 'சுருக்கம்' : 'Summary')}
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              {questionTitles.subtitle || (lang === 'kn' ? 'ನಿಮ್ಮ ಮೌಲ್ಯಮಾಪನ ಸಾರಾಂಶವನ್ನು ಪರಿಶೀಲಿಸಿ' : lang === 'ta' ? 'உங்கள் மதிப்பீட்டு சுருக்கத்தை மதிப்பாய்வு செய்யவும்' : 'Review your assessment summary')}
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">
              {lang === 'kn' ? 'ನಿಮ್ಮ ಸಾರಾಂಶವನ್ನು ನಿಮ್ಮ ಶಿಕ್ಷಕರು ವಿಮರ್ಶೆ ಮಾಡುತ್ತಿದ್ದಾರೆ ಮತ್ತು ಶೀಘ್ರದಲ್ಲೇ ಲಭ್ಯವಾಗುತ್ತದೆ.' : lang === 'ta' ? 'உங்கள் சுருக்கம் ஆசிரியரால் ஆய்வு செய்யப்படுகிறது, விரைவில் கிடைக்கும்.' : lang === 'hi' ? 'आपका सारांश शिक्षक द्वारा समीक्षा में है, जल्द ही उपलब्ध होगा।' : 'Your summary is being reviewed by your teacher and will be available soon.'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const displaySummary = getDisplaySummary(summary);
  const canEdit = canStudentEdit(summary);
  const isStudentEdited = summary.summary_type === 'student_edited';



  const dreamColumnHeadings = dreamHeadings;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" lang={lang} dir="auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                {assessmentType === 'about_me'
                  ? (lang === 'kn'
                    ? 'ನನ್ನ ಬಗ್ಗೆ ಸಾರಾಂಶ'
                    : lang === 'ta'
                      ? 'சுருக்கம்: என்னைப் பற்றி'
                      : lang === 'hi'
                        ? 'सारांश: मेरे बारे में'
                        : 'Summary: About Me')
                  : assessmentType === 'dreams'
                    ? (lang === 'kn'
                      ? 'ನನ್ನ ಕನಸುಗಳು ಸಾರಾಂಶ'
                      : lang === 'ta'
                        ? 'சுருக்கம்: என் கனவுகள்'
                        : lang === 'hi'
                          ? 'सारांश: मेरे सपने'
                          : 'Summary: My Dreams')
                    : assessmentType === 'school_learning'
                      ? (lang === 'kn'
                        ? 'ಸಾರಾಂಶ: ನನ್ನ ಮುಂದಿನ ಯೋಜನೆ'
                        : lang === 'ta'
                          ? 'சுருக்கம்: என் எதிர்கால திட்டம்'
                          : lang === 'hi'
                            ? 'सारांश: मेरी भविष्य की योजना'
                            : 'Summary: My future plan')
                      : assessmentType === 'hobbies'
                        ? (lang === 'kn'
                          ? 'ನನ್ನ ಪ್ರತಿಭೆಗಳು ಮತ್ತು ಹವ್ಯಾಸಗಳು ಸಾರಾಂಶ'
                          : lang === 'ta'
                            ? 'சுருக்கம்: என் திறமைகள் மற்றும் பொழுதுபோக்குகள்'
                            : lang === 'hi'
                              ? 'सारांश: मेरी प्रतिभाएँ और शौक'
                              : 'Summary: My Talents and Hobbies')
                        : assessmentType === 'role_models'
                          ? (lang === 'kn'
                            ? 'ಸಾರಾಂಶ: ನನ್ನ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳು'
                            : lang === 'ta'
                              ? 'சுருக்கம்: என் முன்மாதிரிகள்'
                              : lang === 'hi'
                                ? 'सारांश: मेरे आदर्श'
                                : 'Summary: My Role Models')
                          : (lang === 'kn'
                            ? 'ನನ್ನನ್ನು ಪ್ರೇರೇಪಿಸಿದ ವಿಷಯಗಳು'
                            : lang === 'ta'
                              ? 'என்னை ஊக்கப்படுத்திய விஷயங்கள்'
                              : lang === 'hi'
                                ? 'जिन चीज़ों ने मुझे प्रेरित किया'
                                : 'Things I Was Inspired By')}
              </DialogTitle>
              <DialogDescription>
                {assessmentType === 'about_me'
                  ? (lang === 'kn'
                    ? 'ನಿಮ್ಮ ಆತ್ಮ-ಪ್ರತಿಬಿಂಬ ಮತ್ತು ಬೆಳವಣಿಗೆಯ ಪ್ರದೇಶಗಳ ಬಗ್ಗೆ ಸಾರಾಂಶ'
                    : lang === 'ta'
                      ? 'உங்கள் சுய சிந்தனை மற்றும் வளர வேண்டிய பகுதிகளைச் சுருக்கமாகப் பார்க்கும் பகுதி.'
                      : lang === 'hi'
                        ? 'आत्म-चिंतन और विकास के क्षेत्रों का सारांश'
                        : 'Summary of your self-reflection and areas for growth')
                  : assessmentType === 'dreams'
                    ? (lang === 'kn'
                      ? 'ನಿಮ್ಮ ಕನಸುಗಳು ಮತ್ತು ಉದ್ದೇಶಗಳ ಬಗ್ಗೆ ಸಾರಾಂಶ'
                      : lang === 'ta'
                        ? 'உங்கள் கனவுகள் மற்றும் எதிர்கால இலக்குகளைச் சுருக்கமாகப் பதிவு செய்துள்ளது.'
                        : lang === 'hi'
                          ? 'आपके सपनों और आकांक्षाओं का सारांश'
                          : 'Summary of your dreams and aspirations')
                    : assessmentType === 'school_learning'
                      ? (lang === 'kn'
                        ? 'ನಿಮ್ಮ ಭವಿಷ್ಯದ ಯೋಜನೆಯನ್ನು ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಬರೆಯಿರಿ.'
                        : lang === 'ta'
                          ? 'உங்கள் எதிர்கால திட்டத்தை சுருக்கமாக எழுதுங்கள்.'
                          : lang === 'hi'
                            ? 'अपनी भविष्य की योजना का संक्षिप्त विवरण लिखें।'
                            : 'Write a brief summary of your future plan.')
                      : assessmentType === 'hobbies'
                        ? (lang === 'kn'
                          ? 'ನಿಮ್ಮ ಪ್ರತಿಭೆಗಳು ಮತ್ತು ಹವ್ಯಾಸಗಳ ಬಗ್ಗೆ ಸಾರಾಂಶ'
                          : lang === 'ta'
                            ? 'உங்கள் திறமைகள் மற்றும் பொழுதுபோக்குகள் பற்றிய முக்கிய அம்சங்களின் சுருக்கம்.'
                            : lang === 'hi'
                              ? 'आपकी प्रतिभाओं और शौकों का सारांश'
                              : 'Summary of your talents and hobbies')
                        : assessmentType === 'role_models'
                          ? (lang === 'kn'
                            ? 'ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳ ಬಗ್ಗೆ ಸಾರಾಂಶ'
                            : lang === 'ta'
                              ? 'உங்கள் எதிர்கால படிப்பு, வேலை, தொழில் தேர்வு குறித்து சந்தேகமாக உள்ள கேள்விகளை நினைத்து எழுதுங்கள்.'
                              : lang === 'hi'
                                ? 'भविष्य की पढ़ाई, नौकरी और करियर से जुड़े सवाल सोचकर लिखें।'
                                : 'Think about questions related to your future studies, job, or career choice and write them.')
                          : (lang === 'kn'
                            ? 'ಪ್ರೇರಣಾದಾಯಕ ವೀಡಿಯೊಗಳು ಮತ್ತು ಅನುಭವಗಳ ಬಗ್ಗೆ ನಿಮ್ಮ ಪ್ರತಿಬಿಂಬ'
                            : lang === 'ta'
                              ? 'உங்களை ஊக்கப்படுத்திய வீடியோக்கள் மற்றும் அனுபவங்கள் குறித்து உங்கள் சிந்தனைகளின் சுருக்கம்.'
                              : lang === 'hi'
                                ? 'प्रेरणादायक वीडियो और अनुभवों पर आपके विचारों का सारांश'
                                : 'Your reflection on inspirational videos and experiences')}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getSummaryStatusColor(summary.approval_status)}>
                {getSummaryStatusLabel(summary.approval_status)}
              </Badge>
              {isStudentEdited && (
                <Badge variant="outline" className="bg-blue-50">
                  <Edit3 className="h-3 w-3 mr-1" />
                  {lang === 'kn' ? 'ನೀವು ಸಂಪಾದಿಸಿದ್ದೀರಿ' : 'Edited by You'}
                </Badge>
              )}
              {summary.summary_type === 'teacher_edited' && (
                <Badge variant="outline" className="bg-purple-50">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {lang === 'kn' ? 'ಶಿಕ್ಷಕರು ವಿಮರ್ಶಿಸಿದ್ದಾರೆ' : 'Reviewed by Teacher'}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Revision request banner — shown when teacher has asked student to revise */}
          {summary.approval_status === 'revision_requested' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="font-medium text-sm text-orange-800">
                {lang === 'kn' ? 'ಶಿಕ್ಷಕರ ಸೂಚನೆ:' : lang === 'ta' ? 'ஆசிரியர் குறிப்பு:' : lang === 'hi' ? 'शिक्षक की टिप्पणी:' : "Teacher's revision notes:"}
              </p>
              {summary.rejection_reason && (
                <p className="text-sm text-orange-700 mt-1">{summary.rejection_reason}</p>
              )}
              <p className="text-xs text-orange-600 mt-2">
                {lang === 'kn' ? 'ಕೆಳಗಿನ ಸಾರಾಂಶವನ್ನು ಸಂಪಾದಿಸಿ ಮತ್ತು ಉಳಿಸಿ.' : lang === 'ta' ? 'கீழே உள்ள சுருக்கத்தை திருத்தி சேமிக்கவும்.' : lang === 'hi' ? 'नीचे दिए गए सारांश को संपादित करें और सहेजें।' : 'Please edit the summary below and save your changes for teacher re-review.'}
              </p>
            </div>
          )}
          {/* Question 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                {isAboutMeAssessment
                  ? (lang === 'kn' ? '1. ಕುಟುಂಬದ ಹೊರಗಿನ ನನ್ನ ಸ್ನೇಹಿತರು ಯಾರು?' : '1. Who are my friends outside my family?')
                  : isDreamsAssessment
                    ? (lang === 'kn' ? 'ಕನಸು ಪೋರ್ಟ್‌ಫೋಲಿಯೋ' : 'Dream Portfolio')
                    : questionTitles.q1}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <Textarea
                  lang={lang}
                  value={editedSummary.question1}
                  onChange={(e) => setEditedSummary({ ...editedSummary, question1: e.target.value })}
                  placeholder={lang === 'kn' ? 'ನಿಮ್ಮನ್ನು ಏನು ಪ್ರೇರೇಪಿಸಿತು ಎಂದು ಬರೆಯಿರಿ...' : 'Write about what inspired you...'}
                  className="min-h-[150px] text-base"
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  {isDreamsAssessment ? (
                    <table className="w-full text-sm border border-gray-200 rounded-md overflow-hidden">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-700 whitespace-pre-line">{dreamColumnHeadings.dream}</th>
                          <th className="text-left px-3 py-2 text-gray-700 whitespace-pre-line">{dreamColumnHeadings.quality}</th>
                          <th className="text-left px-3 py-2 text-gray-700 whitespace-pre-line">{dreamColumnHeadings.prevent}</th>
                          <th className="text-left px-3 py-2 text-gray-700 whitespace-pre-line">{dreamColumnHeadings.study}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseDreamEntries(displaySummary.question1).map((row, index) => (
                          <tr key={`${row.dream}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-2 text-gray-700 align-top">{row.dream}</td>
                            <td className="px-3 py-2 text-gray-700 align-top">{row.quality_value_strength}</td>
                            <td className="px-3 py-2 text-gray-700 align-top">{row.prevent_failure}</td>
                            <td className="px-3 py-2 text-gray-700 align-top">{row.study_path}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : isHobbiesAssessment ? (
                    <table className="w-full text-sm border border-gray-200 rounded-md overflow-hidden">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-700 whitespace-pre-line">{questionTitles.q2}</th>
                          <th className="text-left px-3 py-2 text-gray-700 whitespace-pre-line">{questionTitles.q3}</th>
                          <th className="text-left px-3 py-2 text-gray-700 whitespace-pre-line">{questionTitles.q4}</th>
                          <th className="text-left px-3 py-2 text-gray-700 whitespace-pre-line">{questionTitles.q5}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseHobbiesEntries(displaySummary.question1).map((row, index) => (
                          <tr key={`${row.hobby}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-2 text-gray-700 align-top">{row.hobby}</td>
                            <td className="px-3 py-2 text-gray-700 align-top">{row.want_career}</td>
                            <td className="px-3 py-2 text-gray-700 align-top">{row.compatible_careers}</td>
                            <td className="px-3 py-2 text-gray-700 align-top">{row.people_examples}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">{displaySummary.question1}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dynamic Loop for About Me Questions 2-16 */}
          {isAboutMeAssessment && Object.keys(questionTitles)
            .filter(key => key.startsWith('q') && key !== 'q1')
            .sort((a, b) => {
              const numA = parseInt(a.replace('q', ''), 10);
              const numB = parseInt(b.replace('q', ''), 10);
              return numA - numB;
            })
            .map(key => {
              const qNum = key.replace('q', '');
              const propParam = `question${qNum}`;
              return (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Lightbulb className="h-5 w-5 text-blue-600" />
                      {questionTitles[key]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isEditing ? (
                      <Textarea
                        lang={lang}
                        value={editedSummary[propParam] || ''}
                        onChange={(e) => setEditedSummary({ ...editedSummary, [propParam]: e.target.value })}
                        placeholder={lang === 'kn' ? 'ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಬರೆಯಿರಿ...' : 'Write your answer...'}
                        className="min-h-[120px] text-base"
                      />
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">{displaySummary[propParam] || ''}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

          {/* Talents Portfolio for Hobbies Assessment */}
          {isHobbiesAssessment && questionTitles.q6 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  {questionTitles.q6}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing ? (
                  <Textarea
                    lang={lang}
                    value={editedSummary.question6 || ''}
                    onChange={(e) => setEditedSummary({ ...editedSummary, question6: e.target.value })}
                    placeholder={lang === 'kn' ? 'ನಿಮ್ಮ ಪ್ರತಿಭೆಗಳ ಬಗ್ಗೆ ಬರೆಯಿರಿ...' : 'Write about your talents...'}
                    className="min-h-[150px] text-base"
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <table className="w-full text-sm border border-gray-200 rounded-md overflow-hidden">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-700 whitespace-pre-line">{questionTitles.q7}</th>
                          <th className="text-left px-3 py-2 text-gray-700 whitespace-pre-line">{questionTitles.q8}</th>
                          <th className="text-left px-3 py-2 text-gray-700 whitespace-pre-line">{questionTitles.q9}</th>
                          <th className="text-left px-3 py-2 text-gray-700 whitespace-pre-line">{questionTitles.q10}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseTalentsEntries(displaySummary.question6 || '').map((row, index) => (
                          <tr key={`${row.talent}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-2 text-gray-700 align-top">{row.talent}</td>
                            <td className="px-3 py-2 text-gray-700 align-top">{row.want_career}</td>
                            <td className="px-3 py-2 text-gray-700 align-top">{row.matching_careers}</td>
                            <td className="px-3 py-2 text-gray-700 align-top">{row.people_examples}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!isDreamsAssessment && !isHobbiesAssessment && !isRoleModelsAssessment && !isAboutMeAssessment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  {questionTitles.q2}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing ? (
                  <Textarea
                    lang={lang}
                    value={editedSummary.question2}
                    onChange={(e) => setEditedSummary({ ...editedSummary, question2: e.target.value })}
                    placeholder={lang === 'kn' ? 'ತಪ್ಪಿಸಬೇಕಾದ ನಡವಳಿಕೆಗಳ ಬಗ್ಗೆ ಬರೆಯಿರಿ...' : 'Write about behaviors to avoid...'}
                    className="min-h-[150px] text-base"
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{displaySummary.question2}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!isDreamsAssessment && !isHobbiesAssessment && !isRoleModelsAssessment && !isAboutMeAssessment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                  {questionTitles.q3}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing ? (
                  <Textarea
                    lang={lang}
                    value={editedSummary.question3}
                    onChange={(e) => setEditedSummary({ ...editedSummary, question3: e.target.value })}
                    placeholder={lang === 'kn' ? 'ಹೋಲಿಕೆಗಳ ಬಗ್ಗೆ ಬರೆಯಿರಿ...' : 'Write about the similarities...'}
                    className="min-h-[150px] text-base"
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{displaySummary.question3}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* General School Learning (Not nested) */}
          {isSchoolLearningAssessment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-green-600" />
                  {questionTitles.title || 'My future plan'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing ? (
                  <Textarea
                    lang={lang}
                    value={editedSummary.question1}
                    onChange={(e) => setEditedSummary({ ...editedSummary, question1: e.target.value })}
                    placeholder={lang === 'kn' ? 'ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಬರೆಯಿರಿ...' : 'Write your answer...'}
                    className="min-h-[150px] text-base"
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <table className="w-full text-sm border border-gray-200 rounded-md overflow-hidden">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-700 whitespace-pre-line">{schoolLearningColumnHeadings.q1}</th>
                          <th className="text-left px-3 py-2 text-gray-700 whitespace-pre-line">{schoolLearningColumnHeadings.q2}</th>
                          <th className="text-left px-3 py-2 text-gray-700 whitespace-pre-line">{schoolLearningColumnHeadings.q3}</th>
                          <th className="text-left px-3 py-2 text-gray-700 whitespace-pre-line">{schoolLearningColumnHeadings.q4}</th>
                          <th className="text-left px-3 py-2 text-gray-700 whitespace-pre-line">{schoolLearningColumnHeadings.q5}</th>
                          <th className="text-left px-3 py-2 text-gray-700 whitespace-pre-line">{schoolLearningColumnHeadings.q6}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseSchoolLearningEntries(displaySummary.question1 || '').map((row, index) => (
                          <tr key={`sl-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-2 text-gray-700 align-top">{row.liked_subjects}</td>
                            <td className="px-3 py-2 text-gray-700 align-top">{row.liked_careers}</td>
                            <td className="px-3 py-2 text-gray-700 align-top">{row.disliked_subjects}</td>
                            <td className="px-3 py-2 text-gray-700 align-top">{row.disliked_careers}</td>
                            <td className="px-3 py-2 text-gray-700 align-top">{row.other_activities}</td>
                            <td className="px-3 py-2 text-gray-700 align-top">{row.skills_improvement}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              {summary.approved_at && (
                <span>{lang === 'kn' ? 'ಅನುಮೋದಿಸಲಾಗಿದೆ' : 'Approved'} {new Date(summary.approved_at).toLocaleDateString()}</span>
              )}
              {isStudentEdited && summary.updated_at && (
                <span className="ml-4">
                  {lang === 'kn' ? 'ಕೊನೆಯ ಬಾರಿ ಸಂಪಾದಿಸಲಾಗಿದೆ' : 'Last edited'}: {new Date(summary.updated_at).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {lang === 'kn' ? 'ರದ್ದುಮಾಡಿ' : lang === 'ta' ? 'ரத்து செய்' : lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saving ? (
                      <>{lang === 'kn' ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : lang === 'ta' ? 'சேமிக்கிறது...' : lang === 'hi' ? 'सहेज रहे हैं...' : 'Saving...'}</>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {lang === 'kn' ? 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ' : lang === 'ta' ? 'மாற்றங்களை சேமி' : lang === 'hi' ? 'बदलाव सहेजें' : 'Save Changes'}
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    {lang === 'kn' ? 'ಮುಚ್ಚಿ' : lang === 'ta' ? 'மூடு' : lang === 'hi' ? 'बंद करें' : 'Close'}
                  </Button>
                  {canEdit && (
                    <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
                      <Edit3 className="h-4 w-4 mr-2" />
                      {lang === 'kn' ? 'ನನ್ನ ಸಾರಾಂಶವನ್ನು ಸಂಪಾದಿಸಿ' : lang === 'ta' ? 'என் சுருக்கத்தை திருத்து' : lang === 'hi' ? 'मेरा सारांश संपादित करें' : 'Edit My Summary'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent >
    </Dialog >
  );
}

