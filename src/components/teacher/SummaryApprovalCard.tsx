import { logger } from '@/lib/logger';

// SummaryApprovalCard - Teacher component to review and approve AI-generated summaries

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  Edit3,
  Save,
  X,
  Lightbulb,
  AlertCircle,
  Users,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AssessmentSummary,
  SummaryQuestions,
  getDisplaySummary,
  getSummaryStatusColor,
  getSummaryStatusLabel
} from '@/types/assessmentSummary';
import { summaryDatabaseService } from '@/services/summaryDatabaseService';
import { notificationService } from '@/services/notificationService';
import { aiSummaryService } from '@/services/aiSummaryService';
import { supabase } from '@/integrations/supabase/client';
import { parseDreamEntries, parseHobbiesEntries, parseTalentsEntries, parseSchoolLearningEntries } from '../../utils/summaryParsers';

interface SummaryApprovalCardProps {
  summary: AssessmentSummary;
  studentResponses: any; // Raw assessment responses from student
  teacherUserId: string;
  studentName: string;
  assessmentType?: string; // Assessment type (about_me, inspiration, dreams, etc.)
  onSummaryUpdated?: (updatedData?: any) => void;
}

export default function SummaryApprovalCard({
  summary,
  studentResponses,
  teacherUserId,
  studentName,
  assessmentType,
  onSummaryUpdated
}: SummaryApprovalCardProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showStudentResponses, setShowStudentResponses] = useState(false);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [aboutMeFields, setAboutMeFields] = useState<Array<{ field_key: string; question_text: string }>>([]);
  const [questionTitles, setQuestionTitles] = useState<{ [key: string]: string }>({
    q1: '1. What Inspired You?',
    q2: '2. Behaviors to Avoid',
    q3: '3. Similarities Between Inspirations'
  });
  const [editedSummary, setEditedSummary] = useState<SummaryQuestions>({
    question1: '',
    question2: '',
    question3: ''
  });

  const isAboutMeAssessment = assessmentType === 'about_me' || summary.summary_type === 'about_me_edited';
  const isHobbiesAssessment = assessmentType === 'hobbies' || summary.summary_type === 'hobbies_edited';
  const isDreamsAssessment = assessmentType === 'dreams' || summary.summary_type === 'dreams_edited';
  const isSchoolLearningAssessment = assessmentType === 'school_learning' || summary.summary_type === 'school_learning_edited';
  const isRoleModelsAssessment = assessmentType === 'role_models' || summary.summary_type === 'role_models_edited';

  const detectLangKeyFromSummary = (): 'en' | 'ta' | 'kn' => {
    try {
      const content = JSON.stringify(getDisplaySummary(summary));
      if (/[ಅ-ಹ]/u.test(content)) return 'kn';
      if (/[அ-ஹ]/u.test(content)) return 'ta';
    } catch {
      // Fallback to English
    }
    return 'en';
  };

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



  // Load summary content when it changes
  useEffect(() => {
    const displaySummary = getDisplaySummary(summary);
    setEditedSummary({
      question1: displaySummary.question1,
      question2: displaySummary.question2,
      question3: displaySummary.question3,
      question4: displaySummary.question4 || '',
      question5: displaySummary.question5 || '',
      question6: displaySummary.question6 || ''
    });
    setIsEditing(false);

    // Fetch question titles from database template based on assessment type
    const fetchQuestionTitles = async () => {
      let assessmentTypeToUse = assessmentType;
      if (!assessmentTypeToUse) {
        // Fetch assessment type from database
        const { data: assessmentResponse } = await supabase
          .from('assessment_responses')
          .select('assessment_type')
          .eq('id', summary.assessment_response_id)
          .maybeSingle();

        assessmentTypeToUse = assessmentResponse?.assessment_type || 'inspiration';
      }

      try {
        const { data: template } = await supabase
          .from('assessment_summary_templates')
          .select('summary_questions')
          .eq('assessment_type', assessmentTypeToUse)
          .maybeSingle();

        if (template?.summary_questions) {
          const questions = template.summary_questions as any;
          const langKey = detectLangKeyFromSummary();
          const isTa = langKey === 'ta';
          const isKn = langKey === 'kn';

          const baseBlock = questions.en || questions[langKey] || {};
          const defaultTitles = {
            q1: baseBlock.question1 || '1. Question 1',
            q2: baseBlock.question2 || '2. Question 2',
            q3: baseBlock.question3 || '3. Question 3',
            q4: baseBlock.question4 || '4. Question 4',
            q5: baseBlock.question5 || '5. Question 5',
            q6: baseBlock.question6 || '6. Question 6',
            q7: baseBlock.question7 || '7. Question 7',
            q8: baseBlock.question8 || '8. Question 8',
            q9: baseBlock.question9 || '9. Question 9',
            q10: baseBlock.question10 || '10. Question 10'
          };

          if (assessmentTypeToUse === 'about_me') {
            const newTitles: { [key: string]: string } = {};
            // Map question1..question16 from baseBlock to q1..q16
            for (let i = 1; i <= 16; i++) {
              const qKey = `question${i}`;
              if (baseBlock[qKey]) {
                newTitles[`q${i}`] = baseBlock[qKey];
              }
            }

            // Fallback for key sections if DB update hasn't propagated or failed
            if (!newTitles.q1) newTitles.q1 = isTa ? '1. ಕುಟುಂಬದ ಹೊರಗಿನ ನನ್ನ ಸ್ನೇಹಿತರು ಯಾರು?' : (isKn ? '1. ಕುಟುಂಬದ ಹೊರಗಿನ ನನ್ನ ಸ್ನೇಹಿತರು ಯಾರು?' : '1. Who are my friends outside my family?');

            setQuestionTitles(newTitles);
          } else if (assessmentTypeToUse === 'dreams') {
            if (isTa) {
              setQuestionTitles({
                q1: 'கனவுகள் திட்டம்',
                q2: 'என் கனவுகளை நிறைவேற்ற உதவும் திறன்கள் / மதிப்புகள்',
                q3: 'என் கனவுகளை அடைய படிப்பு மற்றும் அடுத்த படிகள்'
              });
            } else if (isKn) {
              setQuestionTitles({
                q1: 'ಕನಸಿನ ಪೋರ್ಟ್‌ಫೋಲಿಯೋ',
                q2: 'ನನ್ನ ಕನಸಿಗೆ ಸಹಾಯ ಮಾಡುವ ಗುಣಗಳು / ಮೌಲ್ಯಗಳು / ಸಾಮರ್ಥ್ಯಗಳು',
                q3: 'ಕನಸನ್ನು ಸಾಕಾರಗೊಳಿಸಲು ಅಗತ್ಯವಾದ ಅಧ್ಯಯನ ಮತ್ತು ಮುಂದಿನ ಹೆಜ್ಜೆಗಳು'
              });
            } else {
              setQuestionTitles({
                q1: 'Dream Portfolio',
                q2: defaultTitles.q2,
                q3: defaultTitles.q3
              });
            }
          } else if (assessmentTypeToUse === 'school_learning') {
            if (isTa) {
              setQuestionTitles({
                q1: 'நான் விரும்பும் பாடங்கள்',
                q2: 'நான் விரும்பும் பாடங்களின் மூலம் நான் அடையக்கூடிய தொழில்கள்',
                q3: 'நான் விரும்பாத பாடங்கள்',
                q4: 'நான் விரும்பாத பாடங்களில் முன்னேற்றம் பெற்றால் நான் அடையக்கூடிய தொழில்கள்',
                q5: 'பாடப்பிரிவுகளுடன் சேர்த்து, நான் சிறப்பாக சாதனை புரியும் பிற செயல்பாடுகள் / விஷயங்கள்',
                q6: 'இந்த திறன்களில் நான் மேம்பட்டால், என் வேலை / தொழில் தேர்வுக்கு உதவியாக இருக்கும்.'
              });
            } else if (isKn) {
              setQuestionTitles({
                q1: 'ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳು',
                q2: 'ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳಿಂದ ನಾನು ಪಡೆಯಲು ಸಾಧ್ಯವಾದ ವೃತ್ತಿಗಳು',
                q3: 'ನಾನು ಇಷ್ಟಪಡದ ವಿಷಯಗಳು',
                q4: 'ನಾನು ಇಷ್ಟಪಡದ ವಿಷಯಗಳಲ್ಲಿ ನಾನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ಪಡೆಯಲು ಸಾಧ್ಯವಾದ ವೃತ್ತಿಗಳು',
                q5: 'ಪಠ್ಯ ವಿಷಯಗಳ ಜೊತೆಗೆ, ನಾನು ಉತ್ತಮ ಸಾಧನೆ ಮಾಡುತ್ತಿರುವ ಇತರ ಚಟುವಟಿಕೆಗಳು / ವಿಷಯಗಳು',
                q6: 'ನಾನು ಈ ಕೌಶಲ್ಯಗಳಲ್ಲಿ ಸುಧಾರಿಸಿಕೊಂಡರೆ ನನ್ನ ಕೆಲಸ / ವೃತ್ತಿಯ ಆಯ್ಕೆಗೆ ಸಹಾಯವಾಗುತ್ತದೆ.'
              });
            } else {
              setQuestionTitles({
                q1: 'Subjects I like',
                q2: 'Careers that are possible of the subjects that I like',
                q3: "Subjects I don't like",
                q4: "Careers that are possible if I improve in those subjects which I don't like",
                q5: 'Things I am good at besides academics at school',
                q6: 'How will improving these skills help me with my career'
              });
            }
          } else if (assessmentTypeToUse === 'hobbies') {
            if (isTa) {
              setQuestionTitles({
                q1: 'பொழுதுபோக்கு திட்டம்',
                q2: 'பொழுதுபோக்குகள்',
                q3: 'இந்தப் பொழுதுபோக்கை ஒரு தொழிலாக மாற்ற விரும்புகிறீர்களா?',
                q4: 'இந்தப் பொழுதுபோக்குக்கு பொருத்தமான தொழில்கள்',
                q5: 'இந்தப் பொழுதுபோக்கை தொழிலாக மாற்றியவர் யாரை நீங்கள் அறிவீர்கள்?',
                q6: 'திறமைகள் திட்டம்',
                q7: 'திறமைகள்',
                q8: 'இந்த திறமையை ஒரு தொழிலாக மாற்ற விரும்புகிறீர்களா?',
                q9: 'இந்த திறமைக்கு பொருத்தமான தொழில்கள்',
                q10: 'இந்த திறமையை தொழிலாக மாற்றியவர் யாரை நீங்கள் அறிவீர்கள்?'
              });
            } else if (isKn) {
              setQuestionTitles({
                q1: 'ಹವ್ಯಾಸಗಳ ಪೋರ್ಟ್‌ಫೋಲಿಯೋ',
                q2: 'ಹವ್ಯಾಸಗಳು',
                q3: 'ಈ ಹವ್ಯಾಸವನ್ನು ವೃತ್ತಿಯಾಗಿಸಲು ನೀವು ಬಯಸುವಿರಾ?',
                q4: 'ಈ ಹವ್ಯಾಸಗಳಿಗೆ ಹೊಂದುವ ವೃತ್ತಿಗಳು',
                q5: 'ತಮ ಹವ್ಯಾಸವನ್ನು ವೃತ್ತಿಯಾಗಿಸಿಕೊಂಡಿರುವವರಲ್ಲಿ ನೀವು ಯಾರನ್ನು ತಿಳಿದಿದ್ದೀರಿ?',
                q6: 'ಪ್ರತಿಭೆಗಳ ಪೋರ್ಟ್‌ಫೋಲಿಯೋ',
                q7: 'ಪ್ರತಿಭೆಗಳು',
                q8: 'ಈ ಪ್ರತಿಭೆಯನ್ನು ವೃತ್ತಿಯಾಗಿಸಲು ನೀವು ಬಯಸುವಿರಾ?',
                q9: 'ನಿಮ್ಮ ಪ್ರತಿಭೆಗೆ ಹೊಂದುವ ವೃತ್ತಿಗಳು',
                q10: 'ತಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ವೃತ್ತಿಯಾಗಿಸಿಕೊಂಡವರಲ್ಲಿ ನೀವು ಯಾರನ್ನು ತಿಳಿದಿದ್ದೀರಿ?'
              });
            } else {
              setQuestionTitles({
                q1: 'Hobbies',
                q2: 'Hobbies',
                q3: 'I would like to turn this hobby into a career',
                q4: 'Careers that are compatible with these hobbies',
                q5: 'People you know who have turned their hobbies into careers',
                q6: 'Talents',
                q7: 'Talents',
                q8: 'Do you want to turn your talent into a career?',
                q9: 'Careers that match your talents',
                q10: 'People you know who have turned their talents into careers'
              });
            }
          } else if (assessmentTypeToUse === 'role_models') {
            if (isTa) {
              setQuestionTitles(prev => ({
                ...prev,
                q1: 'உங்கள் முன்மாதிரி நபரிடம் உங்கள் தொழில் வழிகாட்டலுக்காக நீங்கள் கேட்க விரும்பும் 5 முதல் 10 கேள்விகளை எழுதுங்கள்.'
              }));
            } else if (isKn) {
              setQuestionTitles(prev => ({
                ...prev,
                q1: 'ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಯೊಂದಿಗೆ ನಿಮ್ಮ ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ನೀವು ಕೇಳಲು ಬಯಸುವ 5 ರಿಂದ 10 ಪ್ರಶ್ನೆಗಳನ್ನು ಬರೆಯಿರಿ.'
              }));
            } else {
              setQuestionTitles(prev => ({
                ...prev,
                q1: 'Write 5 to 10 questions you would like to ask your role model for career guidance.'
              }));
            }
          } else if (assessmentTypeToUse === 'inspiration') {
            if (isTa) {
              setQuestionTitles(prev => ({
                ...prev,
                q1: 'என்னை ஊக்கப்படுத்தியவை',
                q2: 'தவிர்க்க வேண்டிய நடத்தைகள்',
                q3: 'ஊக்கமூட்டும் நபர்கள் / நிகழ்வுகளுக்கு இடையிலான ஒற்றுமைகள்'
              }));
            } else if (isKn) {
              setQuestionTitles(prev => ({
                ...prev,
                q1: 'ನನಗೆ ಪ್ರೇರಣೆ ನೀಡಿದವು',
                q2: 'ತಪ್ಪಿಸಿಕೊಳ್ಳಬೇಕಾದ ವರ್ತನೆಗಳು',
                q3: 'ಪ್ರೇರಣಾದಾಯಕ ವ್ಯಕ್ತಿಗಳು / ಘಟನೆಗಳ ನಡುವಿನ ಸಾಮ್ಯತೆಗಳು'
              }));
            } else {
              setQuestionTitles(prev => ({
                ...prev,
                q1: defaultTitles.q1,
                q2: defaultTitles.q2,
                q3: defaultTitles.q3
              }));
            }
          } else {
            setQuestionTitles(defaultTitles);
          }
        }
      } catch (error) {
        logger.error('Error fetching question titles:', error);
        // Keep default titles on error
      }
    };

    fetchQuestionTitles();
  }, [summary, assessmentType]);

  // Load About Me fields for better labels in Student's Original Responses
  useEffect(() => {
    if (assessmentType === 'about_me') {
      const loadAboutMeFields = async () => {
        try {
          const { data, error } = await supabase.rpc('get_about_me_fields');
          if (!error && data && Array.isArray(data)) {
            setAboutMeFields(data.map((f: any) => ({
              field_key: f.field_key,
              question_text: f.question_text
            })));
            logger.log('✅ Loaded About Me fields for labels:', data.length);
          }
        } catch (err) {
          logger.warn('Could not load About Me fields:', err);
        }
      };
      loadAboutMeFields();
    }
  }, [assessmentType]);

  const handleApprove = async () => {
    setSaving(true);
    try {
      // If teacher has edited, save those edits first
      if (isEditing && summary.teacher_edited_summary) {
        await summaryDatabaseService.updateTeacherSummary(
          summary.id,
          teacherUserId,
          editedSummary
        );
      }

      // Approve the summary
      logger.log('🔄 Calling approveSummary:', {
        summaryId: summary.id,
        teacherUserId,
        currentStatus: summary.approval_status
      });

      const result = await summaryDatabaseService.approveSummary(
        summary.id,
        teacherUserId
      );

      logger.log('📊 Approval result:', result);

      if (result.success) {
        toast({
          title: "Summary Approved! ✅",
          description: `${studentName}'s reflection summary is now visible to them.`
        });
        // Notify student (best-effort)
        try {
          // Get assessment type for dynamic notification
          let assessmentTypeToUse = assessmentType;
          if (!assessmentTypeToUse) {
            const { data: assessmentResponse } = await supabase
              .from('assessment_responses')
              .select('assessment_type')
              .eq('id', summary.assessment_response_id)
              .maybeSingle();
            assessmentTypeToUse = assessmentResponse?.assessment_type || 'inspiration';
          }

          // Get assessment title based on type
          const assessmentTitles: Record<string, { en: string; kn: string; ta?: string }> = {
            'inspiration': { en: 'My Inspiration', kn: 'ನನ್ನ ಪ್ರೇರಣೆ' },
            'about_me': { en: 'About Me', kn: 'ನನ್ನ ಬಗ್ಗೆ', ta: 'என்னைப் பற்றி' },
            'dreams': { en: 'My Dreams', kn: 'ನನ್ನ ಕನಸುಗಳು' },
            'school_learning': { en: 'My School, My Learning and I', kn: 'ನನ್ನ ಶಾಲೆ, ನನ್ನ ಕಲಿಕೆ ಮತ್ತು ನಾನು' },
            'hobbies': { en: 'My Talents and Hobbies', kn: 'ನನ್ನ ಪ್ರತಿಭೆಗಳು ಮತ್ತು ಹವ್ಯಾಸಗಳು', ta: 'என் திறமைகள் மற்றும் பொழுதுபோக்குகள்' },
            'role_models': { en: 'My Role Models', kn: 'ನನ್ನ ಆದರ್ಶ ವ್ಯಕ್ತಿ ಯಾರು?', ta: 'என் முன்மாதிரி நபர்' }
          };

          const titleMap = assessmentTitles[assessmentTypeToUse] || { en: 'Assessment', kn: 'ಮೌಲ್ಯಮಾಪನ' };
          const assessmentTitle = titleMap.en; // Default to English for notification

          let targetStudentUserId = summary.student_user_id;

          if (!targetStudentUserId) {
            const { data: studentLookup, error: studentLookupError } = await supabase
              .from('assessment_responses')
              .select('students:student_id(user_id)')
              .eq('id', summary.assessment_response_id)
              .maybeSingle();

            if (studentLookupError) {
              logger.error('Failed to resolve student user id for notification:', studentLookupError);
            }

            targetStudentUserId = (studentLookup as any)?.students?.user_id || null;
          }

          if (!targetStudentUserId) {
            logger.warn('Unable to send approval notification: student_user_id is missing');
          } else {
            const notifResult = await notificationService.create({
              userId: targetStudentUserId,
              type: 'summary_approved',
              title: `${assessmentTitle} summary approved`,
              message: 'Your mentor approved your AI summary. Tap to view.',
              link: '/student'
            });

            if (!notifResult.success) {
              logger.error('Failed to create notification:', notifResult.error);
            } else {
              logger.log('✅ Notification sent to student:', targetStudentUserId);
            }
          }
        } catch (error) {
          logger.error('Error creating notification:', error);
        }
        setIsEditing(false);
        onSummaryUpdated?.();
      } else {
        throw new Error(result.error || 'Failed to approve summary');
      }
    } catch (error) {
      logger.error('Error approving summary:', error);
      toast({
        title: "Error",
        description: "Failed to approve summary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    // Prevent rejecting approved summaries
    if (summary.approval_status === 'approved') {
      toast({
        title: "Cannot Reject",
        description: "This summary has been approved and cannot be rejected.",
        variant: "destructive"
      });
      setShowRejectDialog(false);
      return;
    }

    // Validate rejection reason
    const trimmedReason = rejectionReason.trim();
    if (!trimmedReason) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive"
      });
      return;
    }

    // Minimum length validation
    if (trimmedReason.length < 5) {
      toast({
        title: "Reason Too Short",
        description: "Please provide a more detailed reason (at least 5 characters).",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      logger.log('🔄 Rejecting summary:', {
        summaryId: summary.id,
        teacherUserId,
        reasonLength: trimmedReason.length
      });

      const result = await summaryDatabaseService.rejectSummary(
        summary.id,
        teacherUserId,
        trimmedReason
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to reject summary');
      }

      logger.log('✅ Summary rejected successfully, triggering regeneration...');

      toast({
        title: "Summary Rejected",
        description: "The summary will be regenerated automatically."
      });
      setShowRejectDialog(false);
      setRejectionReason('');

      // Trigger regeneration - pass the summary's student_user_id if available
      await handleRegenerate();

      // Refresh the summary after regeneration
      onSummaryUpdated?.();
    } catch (error) {
      logger.error('❌ Error rejecting summary:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject summary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    // Prevent regeneration of approved summaries
    if (summary.approval_status === 'approved') {
      toast({
        title: "Cannot Regenerate",
        description: "This summary has been approved and cannot be regenerated.",
        variant: "destructive"
      });
      return;
    }

    // Check if AI service is configured
    if (!aiSummaryService.isConfigured()) {
      toast({
        title: "API Not Configured",
        description: "Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.",
        variant: "destructive"
      });
      return;
    }

    // Validate student responses are available
    if (!studentResponses || (typeof studentResponses === 'object' && Object.keys(studentResponses).length === 0)) {
      toast({
        title: "No Student Responses",
        description: "Student responses are not available. Cannot regenerate summary.",
        variant: "destructive"
      });
      return;
    }

    setRegenerating(true);
    try {
      // Get assessment type if not provided
      let assessmentTypeToUse = assessmentType;
      if (!assessmentTypeToUse) {
        // Fetch assessment type from database
        const { data: assessmentResponse, error } = await supabase
          .from('assessment_responses')
          .select('assessment_type')
          .eq('id', summary.assessment_response_id)
          .maybeSingle();

        if (error) {
          logger.error('Error fetching assessment type:', error);
          throw new Error(`Failed to fetch assessment type: ${error.message}`);
        }

        if (!assessmentResponse) {
          throw new Error('Assessment response not found');
        }

        assessmentTypeToUse = assessmentResponse.assessment_type || 'inspiration';
      }

      logger.log('🔄 Regenerating summary for assessment type:', assessmentTypeToUse);
      logger.log('📊 Student responses:', studentResponses);

      // Determine which summary generator to use based on assessment type
      let summaryResult;
      if (assessmentTypeToUse === 'about_me') {
        summaryResult = await aiSummaryService.generateAboutMeSummary(studentResponses);
      } else if (assessmentTypeToUse === 'dreams') {
        summaryResult = await aiSummaryService.generateDreamsSummary(studentResponses);
      } else if (assessmentTypeToUse === 'school_learning') {
        summaryResult = await aiSummaryService.generateSchoolLearningSummary(studentResponses);
      } else if (assessmentTypeToUse === 'hobbies') {
        summaryResult = await aiSummaryService.generateHobbiesSummary(studentResponses);
      } else if (assessmentTypeToUse === 'role_models') {
        summaryResult = await aiSummaryService.generateRoleModelsSummary(studentResponses);
      } else {
        // Default to inspiration summary
        summaryResult = await aiSummaryService.generateInspirationSummary(studentResponses);
      }

      if (!summaryResult.success || !summaryResult.summary) {
        throw new Error(summaryResult.error || 'Failed to regenerate summary');
      }

      logger.log('✅ AI summary generated successfully');

      // Get student_user_id - use from summary if available, otherwise fetch it
      let studentUserId = summary.student_user_id;

      logger.log('🔍 Looking for student_user_id:', {
        fromSummary: studentUserId,
        assessmentResponseId: summary.assessment_response_id
      });

      if (!studentUserId) {
        // Try multiple approaches to get student_user_id

        // Approach 1: Direct query to assessment_responses with students join
        try {
          const { data: assessmentResponse, error: fetchError } = await supabase
            .from('assessment_responses')
            .select(`
              student_id,
              students!inner(user_id)
            `)
            .eq('id', summary.assessment_response_id)
            .maybeSingle();

          if (!fetchError && assessmentResponse) {
            const studentsData = assessmentResponse.students as any;
            if (Array.isArray(studentsData) && studentsData.length > 0) {
              studentUserId = studentsData[0]?.user_id || null;
            } else if (studentsData && typeof studentsData === 'object') {
              studentUserId = studentsData.user_id || null;
            }

            if (studentUserId) {
              logger.log('✅ Found student_user_id via assessment_responses join');
            }
          }
        } catch (err) {
          logger.warn('⚠️ Approach 1 failed, trying alternative:', err);
        }

        // Approach 2: If still not found, get student_id first, then query students table
        if (!studentUserId) {
          try {
            const { data: arData, error: arError } = await supabase
              .from('assessment_responses')
              .select('student_id')
              .eq('id', summary.assessment_response_id)
              .maybeSingle();

            if (!arError && arData?.student_id) {
              const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select('user_id')
                .eq('id', arData.student_id)
                .maybeSingle();

              if (!studentError && studentData) {
                studentUserId = studentData.user_id || null;
                if (studentUserId) {
                  logger.log('✅ Found student_user_id via students table');
                }
              }
            }
          } catch (err) {
            logger.warn('⚠️ Approach 2 failed:', err);
          }
        }

        if (!studentUserId) {
          logger.error('❌ Could not find student_user_id after all attempts', {
            assessmentResponseId: summary.assessment_response_id,
            summaryId: summary.id
          });
          throw new Error('Assessment response not found. The assessment may have been deleted or the summary data is corrupted. Please contact support.');
        }
      } else {
        logger.log('✅ Using student_user_id from summary object');
      }

      logger.log('💾 Saving regenerated summary with student_user_id:', studentUserId);

      // Save the regenerated summary
      const saveResult = await summaryDatabaseService.createAISummary(
        summary.assessment_response_id,
        summaryResult.summary,
        studentUserId
      );

      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save regenerated summary');
      }

      logger.log('✅ Summary saved successfully');

      toast({
        title: "Summary Regenerated! 🔄",
        description: "A new AI summary has been generated for review."
      });

      onSummaryUpdated?.();
    } catch (error) {
      logger.error('❌ Error regenerating summary:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to regenerate summary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveEdits = async () => {
    // Prevent saving edits to approved summaries
    if (summary.approval_status === 'approved') {
      toast({
        title: "Cannot Edit",
        description: "This summary has been approved and cannot be edited.",
        variant: "destructive"
      });
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      const result = await summaryDatabaseService.updateTeacherSummary(
        summary.id,
        teacherUserId,
        editedSummary
      );

      if (result.success) {
        toast({
          title: "Edits Saved! ✏️",
          description: "Your changes have been saved. You can now approve the summary."
        });
        setIsEditing(false);
        onSummaryUpdated?.({ teacher_edited_summary: editedSummary });
      } else {
        throw new Error(result.error || 'Failed to save edits');
      }
    } catch (error) {
      logger.error('Error saving edits:', error);
      toast({
        title: "Error",
        description: "Failed to save edits. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Prevent canceling edits if summary is approved (shouldn't be editing anyway)
    if (summary.approval_status === 'approved') {
      setIsEditing(false);
      return;
    }

    const displaySummary = getDisplaySummary(summary);
    setEditedSummary({
      question1: displaySummary.question1,
      question2: displaySummary.question2,
      question3: displaySummary.question3,
      question4: displaySummary.question4 || '',
      question5: displaySummary.question5 || '',
      question6: displaySummary.question6 || ''
    });
    setIsEditing(false);
  };

  const displaySummary = getDisplaySummary(summary);
  const isPending = summary.approval_status === 'pending_approval' || summary.approval_status === 'revision_requested';

  // Debug: Check actual database status
  const checkDatabaseStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_summaries')
        .select('id, approval_status, approved_at, approved_by, updated_at')
        .eq('id', summary.id)
        .maybeSingle();

      if (error) {
        logger.error('❌ Error checking database status:', error);
        toast({
          title: "Error",
          description: `Failed to check database status: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      if (data) {
        logger.log('📊 Database Status:', {
          id: data.id,
          approval_status: data.approval_status,
          approved_at: data.approved_at,
          approved_by: data.approved_by,
          updated_at: data.updated_at
        });

        toast({
          title: "Database Status",
          description: `Status: ${data.approval_status} | Updated: ${new Date(data.updated_at).toLocaleString()}`,
        });

        // If database shows approved but UI shows pending, refresh
        if (data.approval_status === 'approved' && summary.approval_status !== 'approved') {
          logger.log('🔄 Status mismatch detected - refreshing summary...');
          onSummaryUpdated?.();
        }
      } else {
        logger.warn('⚠️ Summary not found in database');
        toast({
          title: "Warning",
          description: "Summary not found in database",
          variant: "destructive"
        });
      }
    } catch (error) {
      logger.error('❌ Exception checking database status:', error);
      toast({
        title: "Error",
        description: "Failed to check database status",
        variant: "destructive"
      });
    }
  };

  const summaryLangKey = detectLangKeyFromSummary();

  const dreamColumnHeadings = {
    dream: summaryLangKey === 'kn' ? 'ಕನಸು' : summaryLangKey === 'ta' ? 'கனவு' : 'Dream',
    quality: summaryLangKey === 'kn'
      ? 'ನಿಮ್ಮಲ್ಲಿ ಈಗಾಗಲೇ ಕಂಡುಕೊಂಡಿರುವ ಯಾವ ಗುಣ/ ಮೌಲ್ಯ/ ಸಾರ್ಥ್ಯ ನಿಮ್ಮ ಕನಸನ್ನು ಸಾಧಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.'
      : summaryLangKey === 'ta'
        ? 'உங்களிடம் ஏற்கனவே உள்ள எந்த குணம் / மதிப்பு / திறன் இந்த கனவை அடைய உங்களுக்கு உதவும்?'
        : 'Which quality/ value/ ability that you already have will help you achieve your dream?',
    prevent: summaryLangKey === 'kn'
      ? 'ಕನಸು ವಿಫಲವಾಗುವುದಿಲ್ಲ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು ನೀವು ಏನು ಮಾಡಬೇಕಾಗುತ್ತದೆ'
      : summaryLangKey === 'ta'
        ? 'இந்த கனவு தோல்வியடையாமல் இருக்க நீங்கள் என்ன செய்ய வேண்டும்?'
        : 'What do you need to do to make sure this dream does not fail?',
    study: summaryLangKey === 'kn'
      ? 'ಈ ಕನಸನ್ನುಸಾಧಿಸಲು ೧೦ನೇ ತರಗತಿಯ ನಂತರ ನೀವು ಏನು ಅಧ್ಯಯನ ಮಾಡಬೇಕು? (ಅನ್ವಯಿಸಿದರೆ)'
      : summaryLangKey === 'ta'
        ? 'இந்த கனவை அடைய 10ஆம் வகுப்பிற்குப் பிறகு நீங்கள் என்ன படிக்க வேண்டும்? (தேவையானால்)'
        : 'To achieve this dream, what do you need to study after Class 10? (if applicable)'
  };

  return (
    <div className="space-y-4">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold">AI-Generated Reflection Summary</h3>
            <p className="text-sm text-gray-600">Review and approve for {studentName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getSummaryStatusColor(summary.approval_status)}>
            {getSummaryStatusLabel(summary.approval_status)}
          </Badge>
          {summary.summary_type === 'teacher_edited' && (
            <Badge variant="outline" className="bg-purple-50">
              <Edit3 className="h-3 w-3 mr-1" />
              You Edited This
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={checkDatabaseStatus}
            title="Check actual database status"
            className="h-7 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Check DB
          </Button>
        </div>
      </div >

      {/* Student Responses (Collapsible) */}
      < Collapsible >
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded">
                <div className="flex items-center gap-2">
                  {showStudentResponses ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                  <CardTitle className="text-base">Student's Original Responses</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStudentResponses(!showStudentResponses)}
                >
                  {showStudentResponses ? 'Hide' : 'Show'}
                </Button>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-2 text-sm">
                {(() => {
                  // Handle inspiration assessment structure: { video1: { question1: "...", ... }, video2: {...} }
                  if (assessmentType === 'inspiration' && studentResponses) {
                    const videoKeys = Object.keys(studentResponses).filter(key => key.startsWith('video'));

                    if (videoKeys.length === 0) {
                      return <div className="text-gray-500">No video responses found</div>;
                    }

                    return videoKeys.map((videoKey) => {
                      const videoData = studentResponses[videoKey];
                      if (!videoData || typeof videoData !== 'object') return null;

                      const isExpanded = expandedVideo === videoKey;
                      const questionKeys = Object.keys(videoData)
                        .filter(key => key.startsWith('question'))
                        .filter(key => {
                          const num = parseInt(key.replace('question', ''), 10);
                          return !isNaN(num) && num <= 10;
                        });

                      return (
                        <div key={videoKey} className="border rounded-lg overflow-hidden">
                          <div
                            className="p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                            onClick={() => setExpandedVideo(isExpanded ? null : videoKey)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700 capitalize">
                                {videoKey.replace('video', 'Video ')}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {questionKeys.length} {questionKeys.length === 1 ? 'response' : 'responses'}
                              </Badge>
                            </div>
                            <Button variant="ghost" size="sm" className="h-auto p-1">
                              {isExpanded ? '▼' : '▶'}
                            </Button>
                          </div>

                          {isExpanded && (
                            <div className="p-3 bg-white border-t space-y-3">
                              {questionKeys.length === 0 ? (
                                <div className="text-gray-400 italic text-sm">No responses for this video</div>
                              ) : (
                                questionKeys.sort((a, b) => {
                                  const numA = parseInt(a.replace('question', ''), 10);
                                  const numB = parseInt(b.replace('question', ''), 10);
                                  return numA - numB;
                                }).map((qKey) => {
                                  const answer = videoData[qKey];
                                  const questionNum = qKey.replace('question', '');

                                  return (
                                    <div key={qKey} className="border-l-2 border-blue-300 pl-3">
                                      <div className="font-medium text-gray-700 mb-1">
                                        Question {questionNum}
                                      </div>
                                      <div className="text-gray-600 whitespace-pre-wrap">
                                        {answer && String(answer).trim() ? (
                                          <p>{String(answer)}</p>
                                        ) : (
                                          <span className="text-gray-400 italic">No response provided</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  }

                  // Handle school_learning and hobbies (section-based structure)
                  if ((assessmentType === 'school_learning' || assessmentType === 'hobbies') && studentResponses) {
                    const sectionKeys = Object.keys(studentResponses).filter(key => key.startsWith('section'));

                    if (sectionKeys.length === 0) {
                      return <div className="text-gray-500">No section responses found</div>;
                    }

                    return sectionKeys.map((sectionKey) => {
                      const sectionData = studentResponses[sectionKey];
                      if (!sectionData || typeof sectionData !== 'object') return null;

                      const isExpanded = expandedVideo === sectionKey;
                      const questionKeys = Object.keys(sectionData);

                      return (
                        <div key={sectionKey} className="border rounded-lg overflow-hidden mb-3">
                          <div
                            className="p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                            onClick={() => setExpandedVideo(isExpanded ? null : sectionKey)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700 capitalize">
                                {sectionKey.replace('section', 'Section ')}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {questionKeys.length} {questionKeys.length === 1 ? 'question' : 'questions'}
                              </Badge>
                            </div>
                            <Button variant="ghost" size="sm" className="h-auto p-1">
                              {isExpanded ? '▼' : '▶'}
                            </Button>
                          </div>

                          {isExpanded && (
                            <div className="p-3 bg-white border-t space-y-3">
                              {questionKeys.length === 0 ? (
                                <div className="text-gray-400 italic text-sm">No responses for this section</div>
                              ) : (
                                questionKeys.sort().map((qKey) => {
                                  const answer = sectionData[qKey];

                                  // Handle nested objects (like question11 in school_learning)
                                  if (answer && typeof answer === 'object' && !Array.isArray(answer)) {
                                    return (
                                      <div key={qKey} className="border-l-2 border-green-300 pl-3">
                                        <div className="font-medium text-gray-700 mb-1 capitalize">
                                          {qKey.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-gray-600 space-y-1 ml-2">
                                          {Object.entries(answer).map(([subKey, subValue]) => (
                                            <div key={subKey} className="text-sm">
                                              <span className="font-medium capitalize">{subKey.replace(/_/g, ' ')}:</span>{' '}
                                              {typeof subValue === 'boolean' ? (subValue ? 'Yes' : 'No') : String(subValue)}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div key={qKey} className="border-l-2 border-blue-300 pl-3">
                                      <div className="font-medium text-gray-700 mb-1 capitalize">
                                        {qKey.replace(/_/g, ' ')}
                                      </div>
                                      <div className="text-gray-600 whitespace-pre-wrap">
                                        {answer && String(answer).trim() ? (
                                          <p>{String(answer)}</p>
                                        ) : (
                                          <span className="text-gray-400 italic">No response provided</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  }

                  // Handle about_me (field_key based with triple/double arrays)
                  if (assessmentType === 'about_me' && studentResponses) {
                    const fieldKeys = Object.keys(studentResponses).filter(key => {
                      const value = studentResponses[key];
                      // Only show fields that have non-empty values
                      if (value === null || value === undefined) return false;
                      if (Array.isArray(value)) {
                        return value.some(item => item && String(item).trim());
                      }
                      return String(value).trim() !== '';
                    });

                    if (fieldKeys.length === 0) {
                      return <div className="text-gray-500">No field responses found</div>;
                    }

                    return fieldKeys.map((fieldKey) => {
                      const value = studentResponses[fieldKey];
                      if (value === null || value === undefined) return null;

                      // Get question text from loaded fields, fallback to formatted field_key
                      const fieldInfo = aboutMeFields.find(f => f.field_key === fieldKey);
                      const displayLabel = fieldInfo?.question_text || fieldKey.replace(/_/g, ' ');

                      const isExpanded = expandedVideo === fieldKey;
                      const hasValue = Array.isArray(value)
                        ? value.some(item => item && String(item).trim())
                        : String(value).trim() !== '';

                      return (
                        <div key={fieldKey} className="border rounded-lg overflow-hidden mb-2">
                          <div
                            className="p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                            onClick={() => setExpandedVideo(isExpanded ? null : fieldKey)}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="font-medium text-gray-700 text-sm line-clamp-2" title={displayLabel}>
                                {displayLabel}
                              </span>
                              {hasValue && (
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  {Array.isArray(value) ? `${value.filter(v => v && String(v).trim()).length} items` : 'answered'}
                                </Badge>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="h-auto p-1 flex-shrink-0">
                              {isExpanded ? '▼' : '▶'}
                            </Button>
                          </div>

                          {isExpanded && (
                            <div className="p-3 bg-white border-t">
                              {!hasValue ? (
                                <div className="text-gray-400 italic text-sm">No response provided</div>
                              ) : Array.isArray(value) ? (
                                <ul className="list-disc list-inside space-y-2">
                                  {value.map((item: any, idx: number) => (
                                    item && String(item).trim() ? (
                                      <li key={idx} className="text-gray-600 whitespace-pre-wrap">{String(item)}</li>
                                    ) : null
                                  ))}
                                </ul>
                              ) : (
                                <div className="text-gray-600 whitespace-pre-wrap">
                                  {String(value)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  }

                  // Handle dreams, role_models, and other simple key-value assessments
                  if (!studentResponses || typeof studentResponses !== 'object') {
                    return <div className="text-gray-500">No responses available</div>;
                  }

                  return Object.entries(studentResponses).map(([key, value]) => {
                    if (value === null || value === undefined) return null;

                    // Skip video keys if they somehow appear (should be handled by inspiration check)
                    if (key.startsWith('video')) return null;

                    return (
                      <div key={key} className="border-l-2 border-blue-300 pl-3 py-2 mb-2">
                        <div className="font-medium text-gray-700 mb-1 capitalize">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-gray-600 whitespace-pre-wrap">
                          {Array.isArray(value) ? (
                            <ul className="list-disc list-inside space-y-1">
                              {value.map((item: any, idx: number) => (
                                item && String(item).trim() ? <li key={idx}>{String(item)}</li> : null
                              ))}
                            </ul>
                          ) : typeof value === 'object' ? (
                            <div className="ml-2 space-y-1 text-sm">
                              {Object.entries(value).map(([subKey, subValue]) => (
                                <div key={subKey}>
                                  <span className="font-medium capitalize">{subKey.replace(/_/g, ' ')}:</span>{' '}
                                  {typeof subValue === 'boolean' ? (subValue ? 'Yes' : 'No') : String(subValue)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p>{String(value)}</p>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible >

      {/* Summary Questions */}
      < Card >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            {isDreamsAssessment ? 'Dream Portfolio' : questionTitles.q1}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing && (summary.approval_status as string) !== 'approved' ? (
            <Textarea
              value={editedSummary.question1}
              onChange={(e) => setEditedSummary({ ...editedSummary, question1: e.target.value })}
              className="min-h-[120px]"
              disabled={(summary.approval_status as string) === 'approved'}
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
      </Card >

      {/* Dynamic About Me Questions (Questions 2-16) */}
      {
        isAboutMeAssessment && Object.keys(questionTitles)
          .filter(key => key !== 'q1' && key.startsWith('q'))
          .sort((a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1)))
          .map((key) => {
            const qNum = parseInt(key.substring(1));
            const summaryKey = `question${qNum}` as keyof SummaryQuestions;
            const title = questionTitles[key];

            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-indigo-600" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing && (summary.approval_status as string) !== 'approved' ? (
                    <Textarea
                      value={editedSummary[summaryKey] || ''}
                      onChange={(e) => setEditedSummary({ ...editedSummary, [summaryKey]: e.target.value })}
                      className="min-h-[120px]"
                      disabled={(summary.approval_status as string) === 'approved'}
                    />
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{displaySummary[summaryKey] || ''}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
      }

      {/* Talents Portfolio for Hobbies Assessment */}
      {
        isHobbiesAssessment && questionTitles.q6 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-purple-600" />
                {questionTitles.q6}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing && (summary.approval_status as string) !== 'approved' ? (
                <Textarea
                  value={editedSummary.question6 || ''}
                  onChange={(e) => setEditedSummary({ ...editedSummary, question6: e.target.value })}
                  className="min-h-[120px]"
                  disabled={(summary.approval_status as string) === 'approved'}
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
        )
      }

      {
        !isDreamsAssessment && !isHobbiesAssessment && !isRoleModelsAssessment && !isAboutMeAssessment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                {questionTitles.q2}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing && (summary.approval_status as string) !== 'approved' ? (
                <Textarea
                  value={editedSummary.question2}
                  onChange={(e) => setEditedSummary({ ...editedSummary, question2: e.target.value })}
                  className="min-h-[120px]"
                  disabled={(summary.approval_status as string) === 'approved'}
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{displaySummary.question2}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      }

      {
        !isDreamsAssessment && !isHobbiesAssessment && !isRoleModelsAssessment && !isAboutMeAssessment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                {questionTitles.q3}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing && (summary.approval_status as string) !== 'approved' ? (
                <Textarea
                  value={editedSummary.question3}
                  onChange={(e) => setEditedSummary({ ...editedSummary, question3: e.target.value })}
                  className="min-h-[120px]"
                  disabled={(summary.approval_status as string) === 'approved'}
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{displaySummary.question3}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      }

      {/* Questions 4, 5, 6 for School Learning Assessment */}
      {
        isSchoolLearningAssessment && questionTitles.q4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                {questionTitles.q4}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing && (summary.approval_status as string) !== 'approved' ? (
                <Textarea
                  value={editedSummary.question4 || ''}
                  onChange={(e) => setEditedSummary({ ...editedSummary, question4: e.target.value })}
                  className="min-h-[120px]"
                  disabled={(summary.approval_status as string) === 'approved'}
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{displaySummary.question4 || ''}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      }

      {
        isSchoolLearningAssessment && questionTitles.q5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                {questionTitles.q5}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing && (summary.approval_status as string) !== 'approved' ? (
                <Textarea
                  value={editedSummary.question5 || ''}
                  onChange={(e) => setEditedSummary({ ...editedSummary, question5: e.target.value })}
                  className="min-h-[120px]"
                  disabled={(summary.approval_status as string) === 'approved'}
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{displaySummary.question5 || ''}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      }

      {
        isSchoolLearningAssessment && questionTitles.q6 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-green-600" />
                {questionTitles.q6}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing && (summary.approval_status as string) !== 'approved' ? (
                <Textarea
                  value={editedSummary.question6 || ''}
                  onChange={(e) => setEditedSummary({ ...editedSummary, question6: e.target.value })}
                  className="min-h-[120px]"
                  disabled={(summary.approval_status as string) === 'approved'}
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{displaySummary.question6 || ''}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      }

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t gap-4 pb-20 sm:pb-0">
        <div className="flex flex-wrap justify-center sm:justify-start gap-2 w-full sm:w-auto">
          {isPending && (
            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={regenerating || saving}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
              Regenerate AI Summary
            </Button>
          )}
        </div>

        <div className="flex flex-wrap justify-center sm:justify-end gap-2 w-full sm:w-auto">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancelEdit} disabled={saving} className="flex-1 sm:flex-none">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveEdits} disabled={saving} className="flex-1 sm:flex-none">
                <Save className="h-4 w-4 mr-2" />
                Save Edits
              </Button>
            </>
          ) : (
            <>
              {isPending && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Prevent editing approved summaries
                      if (summary.approval_status === 'approved') {
                        toast({
                          title: "Cannot Edit",
                          description: "This summary has been approved and cannot be edited.",
                          variant: "destructive"
                        });
                        return;
                      }
                      setIsEditing(true);
                    }}
                    disabled={saving}
                    className="flex-1 sm:flex-none"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={saving}
                    className="flex-1 sm:flex-none"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  >
                    {saving ? 'Approving...' : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rejection Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Summary</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this summary. A new AI summary will be automatically generated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="rejection-reason">Reason for Rejection</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Summary doesn't capture the student's voice, needs more specific examples... (minimum 5 characters)"
              className="mt-2 min-h-[100px]"
            />
            {rejectionReason.trim() && rejectionReason.trim().length < 5 && (
              <p className="text-sm text-red-600 mt-1">Reason must be at least 5 characters long</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowRejectDialog(false); setRejectionReason(''); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectionReason.trim() || rejectionReason.trim().length < 5 || saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? 'Rejecting...' : 'Reject & Regenerate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}

