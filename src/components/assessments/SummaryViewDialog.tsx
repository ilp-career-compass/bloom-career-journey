// SummaryViewDialog - Student view and edit component for approved summaries

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Lightbulb,
  AlertCircle,
  Users,
  Edit3,
  Save,
  X,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLang } from '@/hooks/useLang';
import { KannadaKeyboard } from '@/components/ui/KannadaKeyboard';
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
  const { t, lang } = useLang();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const isAboutMeAssessment = assessmentType === 'about_me';
  const isDreamsAssessment = assessmentType === 'dreams';
  const isSchoolLearningAssessment = assessmentType === 'school_learning';
  const isHobbiesAssessment = assessmentType === 'hobbies';
  const isRoleModelsAssessment = assessmentType === 'role_models';
  const [questionTitles, setQuestionTitles] = useState<{ [key: string]: string }>({
    q1: lang === 'kn' ? '1. ಪ್ರಶ್ನೆ 1' : lang === 'ta' ? '1. கேள்வி 1' : '1. Question 1',
    q2: lang === 'kn' ? '2. ಪ್ರಶ್ನೆ 2' : lang === 'ta' ? '2. கேள்வி 2' : '2. Question 2',
    q3: lang === 'kn' ? '3. ಪ್ರಶ್ನೆ 3' : lang === 'ta' ? '3. கேள்வி 3' : '3. Question 3'
  });
  const [editedSummary, setEditedSummary] = useState<SummaryQuestions>({
    question1: '',
    question2: '',
    question3: ''
  });

  const parseAboutMeSummary = (content: string) => {
    return content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const [category, ...rest] = line.split(':');
        return {
          category: category?.trim() || '',
          detail: rest.join(':').trim()
        };
      })
      .filter(item => item.category || item.detail);
  };

  const parseDreamEntries = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => ({
          dream: entry?.dream ?? '',
          quality_value_strength: entry?.quality_value_strength ?? '',
          prevent_failure: entry?.prevent_failure ?? '',
          study_path: entry?.study_path ?? ''
        }));
      }
    } catch (error) {
      console.warn('Failed to parse dream portfolio:', error);
    }
    return [];
  };

  const parseHobbiesEntries = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => ({
          hobby: entry?.hobby ?? '',
          want_career: entry?.want_career ?? '',
          compatible_careers: entry?.compatible_careers ?? '',
          people_examples: entry?.people_examples ?? ''
        }));
      }
    } catch (error) {
      console.warn('Failed to parse hobbies portfolio:', error);
    }
    return [];
  };

  const parseTalentsEntries = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => ({
          talent: entry?.talent ?? '',
          want_career: entry?.want_career ?? '',
          matching_careers: entry?.matching_careers ?? '',
          people_examples: entry?.people_examples ?? ''
        }));
      }
    } catch (error) {
      console.warn('Failed to parse talents portfolio:', error);
    }
    return [];
  };

  // Fetch question titles from database template based on assessment type
  useEffect(() => {
    const fetchQuestionTitles = async () => {
      if (!assessmentType) return;

      try {
        const { data: template } = await supabase
          .from('assessment_summary_templates')
          .select('summary_questions')
          .eq('assessment_type', assessmentType)
          .maybeSingle();

        if (template?.summary_questions) {
          const questions = template.summary_questions as any;
          // Prefer exact language block (en | kn | ta), but always fall back to English if missing
          const preferredKey = lang === 'kn' ? 'kn' : lang === 'ta' ? 'ta' : 'en';
          const hasPreferred = questions[preferredKey];
          const langKey = hasPreferred ? preferredKey : 'en';

          if (questions[langKey]) {
            // Simplify: Just take all keys from the template for the appropriate language
            // This handles about_me (16 questions), school_learning (6-21), etc. automatically.
            const newTitles: { [key: string]: string } = {};

            // First populate from DB template
            Object.keys(questions[langKey]).forEach(key => {
              // Convert question1 -> q1
              const shortKey = key.replace('question', 'q');
              newTitles[shortKey] = questions[langKey][key];
            });

            // Apply special overrides if needed (e.g. Dreams hardcoded titles if not in DB)
            if (assessmentType === 'dreams') {
              newTitles.q1 = lang === 'kn' ? 'ಕನಸು ಪೋರ್ಟ್‌ಫೋಲಿಯೋ' : lang === 'ta' ? 'கனவு திட்டம்' : 'Dream Portfolio';
            } else if (assessmentType === 'hobbies') {
              newTitles.q1 = 'Hobbies';
              newTitles.q6 = 'Talents';
            } else if (assessmentType === 'role_models') {
              newTitles.q1 = lang === 'kn' ? 'ನಿಮ್ಮ ಪಾತ್ರ ಮಾದರಿಗಳಿಂದ ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನದ ಕುರಿತಾಗಿ ನೀವು ಕೇಳಲು ಬಯಸುವ 5 ರಿಂದ 10 ಪ್ರಶ್ನೆಗಳನ್ನು ಬರೆಯಿರಿ.' : lang === 'ta' ? 'தொழில் வழிகாட்டல் குறித்து உங்கள் முன்மாதிரி நபர்களிடம் கேட்க விரும்பும் 5 முதல் 10 கேள்விகளை எழுதுங்கள்.' : 'Write 5 to 10 questions you would like to ask your role model for career guidance.';
            }

            // Ensure we have at least q1..q3 for basic assessments if the DB template was empty/partial
            if (!newTitles.q1) newTitles.q1 = (lang === 'kn' ? '1. ಪ್ರಶ್ನೆ 1' : lang === 'ta' ? '1. கேள்வி 1' : '1. Question 1');
            if (!newTitles.q2 && !['dreams', 'school_learning', 'hobbies', 'role_models'].includes(assessmentType)) {
              newTitles.q2 = (lang === 'kn' ? '2. ಪ್ರಶ್ನೆ 2' : lang === 'ta' ? '2. கேள்வி 2' : '2. Question 2');
            }
            if (!newTitles.q3 && !['dreams', 'school_learning', 'hobbies', 'role_models'].includes(assessmentType)) {
              newTitles.q3 = (lang === 'kn' ? '3. ಪ್ರಶ್ನೆ 3' : lang === 'ta' ? '3. கேள்வி 3' : '3. Question 3');
            }

            setQuestionTitles(newTitles);
          }
        }
      } catch (error) {
        console.error('Error fetching question titles:', error);
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
      console.log('📝 SummaryViewDialog: Loaded/Updated summary content because not in edit mode');
    }
  }, [summary, open, isEditing]);

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

    // Filter out undefined and check if empty
    const allFilled = requiredQuestions.every(q => q && q.trim().length > 0);

    if (!allFilled) {
      const questionCount = isSchoolLearningAssessment ? 6 : isHobbiesAssessment ? 2 : isAboutMeAssessment ? 16 : 3;
      toast({
        title: lang === 'kn' ? "ಅಪೂರ್ಣ ಸಾರಾಂಶ" : lang === 'ta' ? 'சுருக்கம் இன்னும் முழுமை அடையவில்லை' : "Incomplete Summary",
        description:
          lang === 'kn'
            ? `ಉಳಿಸುವ ಮೊದಲು ಎಲ್ಲಾ ${questionCount} ಪ್ರಶ್ನೆಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.`
            : lang === 'ta'
              ? `சேமிக்க முன் எல்லா ${questionCount} கேள்விகளுக்கும் பதில் எழுதுங்கள்.`
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
          title: lang === 'kn' ? "ಸಾರಾಂಶ ನವೀಕರಿಸಲಾಗಿದೆ! ✨" : lang === 'ta' ? 'சுருக்கம் சேமிக்கப்பட்டது! ✨' : "Summary Updated! ✨",
          description:
            lang === 'kn'
              ? "ನಿಮ್ಮ ಪ್ರತಿಬಿಂಬ ಸಾರಾಂಶ ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ."
              : lang === 'ta'
                ? 'உங்கள் சுருக்கம் வெற்றிகரமாக சேமிக்கப்பட்டது.'
                : "Your reflection summary has been saved successfully."
        });
        setIsEditing(false);
        onSummaryUpdated?.();
      } else {
        throw new Error(result.error || 'Failed to update summary');
      }
    } catch (error) {
      console.error('Error saving summary:', error);
      toast({
        title: lang === 'kn' ? "ದೋಷ" : lang === 'ta' ? 'பிழை' : "Error",
        description:
          lang === 'kn'
            ? "ನಿಮ್ಮ ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
            : lang === 'ta'
              ? 'உங்கள் மாற்றங்களை சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
              : "Failed to save your changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!summary) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" lang={lang} dir="auto">
          <DialogHeader>
            <DialogTitle>{lang === 'kn' ? 'ಪ್ರತಿಬಿಂಬ ಸಾರಾಂಶ' : 'Reflection Summary'}</DialogTitle>
            <DialogDescription>
              {lang === 'kn' ? 'ನಿಮ್ಮ ಪ್ರತಿಬಿಂಬ ಸಾರಾಂಶ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.' : 'Your reflection summary is not yet available.'}
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">
              {lang === 'kn' ? 'ನಿಮ್ಮ ಸಾರಾಂಶವನ್ನು ನಿಮ್ಮ ಶಿಕ್ಷಕರು ವಿಮರ್ಶೆ ಮಾಡುತ್ತಿದ್ದಾರೆ ಮತ್ತು ಶೀಘ್ರದಲ್ಲೇ ಲಭ್ಯವಾಗುತ್ತದೆ.' : 'Your summary is being reviewed by your teacher and will be available soon.'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const displaySummary = getDisplaySummary(summary);
  const canEdit = canStudentEdit(summary);
  const isStudentEdited = summary.summary_type === 'student_edited';

  const dreamColumnHeadings = {
    dream: lang === 'kn' ? 'ಕನಸು' : lang === 'ta' ? 'கனவு' : 'Dream',
    quality: lang === 'kn'
      ? 'ಕನಸನ್ನು ಸಾಧಿಸಲು\nಸಹಾಯ ಮಾಡುವ ಗುಣ,\nಮೌಲ್ಯ, ಶಕ್ತಿ'
      : lang === 'ta'
        ? 'இந்த கனவை அடைய\nஉதவும் குணம்,\nமதிப்பு, பலம்'
        : 'Which quality,\nvalue, strength will\nhelp you achieve\nyou dream',
    prevent: lang === 'kn'
      ? 'ಕನಸು ವಿಫಲವಾಗದಂತೆ\nಮಾಡಲು ನೀನು ಏನು\nಮಾಡಬೇಕು'
      : lang === 'ta'
        ? 'கனவு தோல்வி\nஆகாமல் இருக்க\nநீ என்ன செய்ய வேண்டும்'
        : 'What you will have\nto do to ensure that\nthe dream doesn’t\nfail',
    study: lang === 'kn'
      ? 'ಈ ಕನಸನ್ನು ಸಾಧಿಸಲು\n10ನೇ ನಂತರ ಏನು\nಅಧ್ಯಯನ ಮಾಡಬೇಕು\n(ಬೇಕಿದ್ದರೆ)'
      : lang === 'ta'
        ? 'இந்த கனவை அடைய\n10ம் பிறகு என்ன\nபடிக்க வேண்டும்\n(தேவையெனில்)'
        : 'What should you\nstudy after 10th\nto achieve this dream\n(if applicable)'
  };

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
                      : 'Summary: About Me')
                  : assessmentType === 'dreams'
                    ? (lang === 'kn'
                      ? 'ನನ್ನ ಕನಸುಗಳು ಸಾರಾಂಶ'
                      : lang === 'ta'
                        ? 'சுருக்கம்: என் கனவுகள்'
                        : 'Summary: My Dreams')
                    : assessmentType === 'school_learning'
                      ? (lang === 'kn'
                        ? 'ಸಾರಾಂಶ: ನನ್ನ ಮುಂದಿನ ಯೋಜನೆ'
                        : lang === 'ta'
                          ? 'சுருக்கம்: என் எதிர்கால திட்டம்'
                          : 'Summary: My future plan')
                      : assessmentType === 'hobbies'
                        ? (lang === 'kn'
                          ? 'ನನ್ನ ಪ್ರತಿಭೆಗಳು ಮತ್ತು ಹವ್ಯಾಸಗಳು ಸಾರಾಂಶ'
                          : lang === 'ta'
                            ? 'சுருக்கம்: என் திறமைகள் மற்றும் பொழுதுபோக்குகள்'
                            : 'Summary: My Talents and Hobbies')
                        : assessmentType === 'role_models'
                          ? (lang === 'kn'
                            ? 'ಸಾರಾಂಶ: ನನ್ನ ಮುಂದಿನ ಯೋಜನೆ'
                            : lang === 'ta'
                              ? 'சுருக்கம்: என் எதிர்கால திட்டம்'
                              : 'Summary: My future plan')
                          : (lang === 'kn'
                            ? 'ನನ್ನನ್ನು ಪ್ರೇರೇಪಿಸಿದ ವಿಷಯಗಳು'
                            : lang === 'ta'
                              ? 'என்னை ஊக்கப்படுத்திய விஷயங்கள்'
                              : 'Things I Was Inspired By')}
              </DialogTitle>
              <DialogDescription>
                {assessmentType === 'about_me'
                  ? (lang === 'kn'
                    ? 'ನಿಮ್ಮ ಆತ್ಮ-ಪ್ರತಿಬಿಂಬ ಮತ್ತು ಬೆಳವಣಿಗೆಯ ಪ್ರದೇಶಗಳ ಬಗ್ಗೆ ಸಾರಾಂಶ'
                    : lang === 'ta'
                      ? 'உங்கள் சுய சிந்தனை மற்றும் வளர வேண்டிய பகுதிகளைச் சுருக்கமாகப் பார்க்கும் பகுதி.'
                      : 'Summary of your self-reflection and areas for growth')
                  : assessmentType === 'dreams'
                    ? (lang === 'kn'
                      ? 'ನಿಮ್ಮ ಕನಸುಗಳು ಮತ್ತು ಉದ್ದೇಶಗಳ ಬಗ್ಗೆ ಸಾರಾಂಶ'
                      : lang === 'ta'
                        ? 'உங்கள் கனவுகள் மற்றும் எதிர்கால இலக்குகளைச் சுருக்கமாகப் பதிவு செய்துள்ளது.'
                        : 'Summary of your dreams and aspirations')
                    : assessmentType === 'school_learning'
                      ? (lang === 'kn'
                        ? 'ನಿಮ್ಮ ಭವಿಷ್ಯದ ಯೋಜನೆಯನ್ನು ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಬರೆಯಿರಿ.'
                        : lang === 'ta'
                          ? 'உங்கள் எதிர்கால திட்டத்தை சுருக்கமாக எழுதுங்கள்.'
                          : 'Write a brief summary of your future plan.')
                      : assessmentType === 'hobbies'
                        ? (lang === 'kn'
                          ? 'ನಿಮ್ಮ ಪ್ರತಿಭೆಗಳು ಮತ್ತು ಹವ್ಯಾಸಗಳ ಬಗ್ಗೆ ಸಾರಾಂಶ'
                          : lang === 'ta'
                            ? 'உங்கள் திறமைகள் மற்றும் பொழுதுபோக்குகள் பற்றிய முக்கிய அம்சங்களின் சுருக்கம்.'
                            : 'Summary of your talents and hobbies')
                        : assessmentType === 'role_models'
                          ? (lang === 'kn'
                            ? 'ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳ ಬಗ್ಗೆ ಸಾರಾಂಶ'
                            : lang === 'ta'
                              ? 'உங்கள் எதிர்கால படிப்பு, வேலை, தொழில் தேர்வு குறித்து சந்தேகமாக உள்ள கேள்விகளை நினைத்து எழுதுங்கள்.'
                              : 'Think about questions related to your future studies, job, or career choice and write them.')
                          : (lang === 'kn'
                            ? 'ಪ್ರೇರಣಾದಾಯಕ ವೀಡಿಯೊಗಳು ಮತ್ತು ಅನುಭವಗಳ ಬಗ್ಗೆ ನಿಮ್ಮ ಪ್ರತಿಬಿಂಬ'
                            : lang === 'ta'
                              ? 'உங்களை ஊக்கப்படுத்திய வீடியோக்கள் மற்றும் அனுபவங்கள் குறித்து உங்கள் சிந்தனைகளின் சுருக்கம்.'
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

          {/* Questions 4, 5, 6 for School Learning Assessment */}
          {isSchoolLearningAssessment && questionTitles.q4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  {questionTitles.q4}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing ? (
                  <Textarea
                    lang={lang}
                    value={editedSummary.question4 || ''}
                    onChange={(e) => setEditedSummary({ ...editedSummary, question4: e.target.value })}
                    placeholder={lang === 'kn' ? 'ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಬರೆಯಿರಿ...' : 'Write your answer...'}
                    className="min-h-[150px] text-base"
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{displaySummary.question4 || ''}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {isSchoolLearningAssessment && questionTitles.q5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  {questionTitles.q5}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing ? (
                  <Textarea
                    lang={lang}
                    value={editedSummary.question5 || ''}
                    onChange={(e) => setEditedSummary({ ...editedSummary, question5: e.target.value })}
                    placeholder={lang === 'kn' ? 'ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಬರೆಯಿರಿ...' : 'Write your answer...'}
                    className="min-h-[150px] text-base"
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{displaySummary.question5 || ''}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {isSchoolLearningAssessment && questionTitles.q6 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-green-600" />
                  {questionTitles.q6}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing ? (
                  <Textarea
                    lang={lang}
                    value={editedSummary.question6 || ''}
                    onChange={(e) => setEditedSummary({ ...editedSummary, question6: e.target.value })}
                    placeholder={lang === 'kn' ? 'ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಬರೆಯಿರಿ...' : 'Write your answer...'}
                    className="min-h-[150px] text-base"
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{displaySummary.question6 || ''}</p>
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
                    {lang === 'kn' ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saving ? (
                      <>{lang === 'kn' ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'Saving...'}</>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {lang === 'kn' ? 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ' : 'Save Changes'}
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    {lang === 'kn' ? 'ಮುಚ್ಚಿ' : 'Close'}
                  </Button>
                  {canEdit && (
                    <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
                      <Edit3 className="h-4 w-4 mr-2" />
                      {lang === 'kn' ? 'ನನ್ನ ಸಾರಾಂಶವನ್ನು ಸಂಪಾದಿಸಿ' : 'Edit My Summary'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {(lang === 'kn' || lang === 'ta') && <KannadaKeyboard lang={lang} />}
      </DialogContent >
    </Dialog >
  );
}

