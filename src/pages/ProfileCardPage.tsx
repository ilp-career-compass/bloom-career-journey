import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/hooks/useLang';
import { supabase } from '@/integrations/supabase/client';
import { aiSummaryService } from '@/services/aiSummaryService';
import { geminiTranslationService } from '@/services/geminiTranslationService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, Loader2, Play, User, Star,
  BookOpen, Heart, Users, Compass, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { useStudentStrings } from '@/components/student/studentStrings';
import { useToast } from '@/hooks/use-toast';
import { flattenResponses } from '@/utils/flattenResponses';

type ModuleConfig = {
  key: string;
  assessmentType: string;
  titleKey: string;
  stripColor: string;
  dotColor: string;
  titleColor: string;
  icon: React.ComponentType<{ className?: string }>;
};

const MODULES: ModuleConfig[] = [
  { key: 'inspiration', assessmentType: 'inspiration', titleKey: 'assessment_inspiration', stripColor: 'bg-indigo-500', dotColor: 'bg-indigo-400', titleColor: 'text-indigo-700', icon: Play },
  { key: 'about_me', assessmentType: 'about_me', titleKey: 'assessment_about_me', stripColor: 'bg-blue-500', dotColor: 'bg-blue-400', titleColor: 'text-blue-700', icon: User },
  { key: 'dreams', assessmentType: 'dreams', titleKey: 'assessment_dreams', stripColor: 'bg-purple-500', dotColor: 'bg-purple-400', titleColor: 'text-purple-700', icon: Star },
  { key: 'school_learning', assessmentType: 'school_learning', titleKey: 'assessment_school_learning', stripColor: 'bg-green-500', dotColor: 'bg-green-400', titleColor: 'text-green-700', icon: BookOpen },
  { key: 'hobbies', assessmentType: 'hobbies', titleKey: 'assessment_hobbies', stripColor: 'bg-orange-500', dotColor: 'bg-orange-400', titleColor: 'text-orange-700', icon: Heart },
  { key: 'role_models', assessmentType: 'role_models', titleKey: 'assessment_role_models', stripColor: 'bg-rose-500', dotColor: 'bg-rose-400', titleColor: 'text-rose-700', icon: Users },
];

const buildProfileCardApprovedNotif = (lang: string) => {
  if (lang === 'kn') return { title: 'ಪ್ರೊಫೈಲ್ ಕಾರ್ಡ್ ಮಾಡ್ಯೂಲ್ ಅನುಮೋದಿಸಲಾಗಿದೆ', message: 'ನಿಮ್ಮ ಶಿಕ್ಷಕರು ನಿಮ್ಮ ಕರಿಯರ್ ಕಾಂಪಾಸ್‌ನಲ್ಲಿ ಒಂದು ವಿಭಾಗವನ್ನು ಅನುಮೋದಿಸಿದ್ದಾರೆ.' };
  if (lang === 'ta') return { title: 'சுயவிவர அட்டை தொகுதி அனுமதிக்கப்பட்டது', message: 'உங்கள் ஆசிரியர் உங்கள் கரியர் காம்பஸ்ஸில் ஒரு பகுதியை அனுமதித்துள்ளார்.' };
  if (lang === 'hi') return { title: 'प्रोफाइल कार्ड मॉड्यूल अनुमोदित', message: 'आपके शिक्षक ने आपके करियर कम्पास में एक मॉड्यूल अनुमोदित किया है।' };
  return { title: 'Profile card module approved', message: 'Your teacher has approved a module in your Career Compass.' };
};

const buildProfileCardRejectedNotif = (lang: string) => {
  if (lang === 'kn') return { title: 'ಪ್ರೊಫೈಲ್ ಕಾರ್ಡ್ ಮಾಡ್ಯೂಲ್ ಪರಿಷ್ಕರಣೆ ಅಗತ್ಯವಿದೆ', message: 'ನಿಮ್ಮ ಶಿಕ್ಷಕರು ನಿಮ್ಮ ಕರಿಯರ್ ಕಾಂಪಾಸ್‌ನಲ್ಲಿ ಒಂದು ವಿಭಾಗದಲ್ಲಿ ಬದಲಾವಣೆ ಕೋರಿದ್ದಾರೆ. ಪ್ರತಿಕ್ರಿಯೆ ನೋಡಲು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಕಾರ್ಡ್ ನೋಡಿ.' };
  if (lang === 'ta') return { title: 'சுயவிவர அட்டை தொகுதி திருத்தம் தேவை', message: 'உங்கள் ஆசிரியர் உங்கள் கரியர் காம்பஸ்ஸில் ஒரு பகுதியில் மாற்றம் கோரியுள்ளார். கருத்துக்களை பார்க்க உங்கள் சுயவிவர அட்டையை பார்வையிடுங்கள்.' };
  if (lang === 'hi') return { title: 'प्रोफाइल कार्ड मॉड्यूल में संशोधन आवश्यक', message: 'आपके शिक्षक ने आपके करियर कम्पास में एक मॉड्यूल में बदलाव का अनुरोध किया है। कृपया अपना प्रोफाइल कार्ड देखें।' };
  return { title: 'Profile card module needs revision', message: 'Your teacher has requested changes to a module in your Career Compass. Please visit your profile card to see the feedback.' };
};

const PAGE_TITLE: Record<string, string> = {
  en: 'My Career Compass',
  kn: 'ನನ್ನ ವೃತ್ತಿ ದಿಕ್ಸೂಚಿ',
  ta: 'என் தொழில் திசைகாட்டி',
  hi: 'मेरा करियर कम्पास',
};

const CAREER_DIR_TITLE: Record<string, string> = {
  en: 'My Career Direction',
  kn: 'ನನ್ನ ವೃತ್ತಿ ದಿಕ್ಕು',
  ta: 'என் தொழில் திசை',
  hi: 'मेरी करियर दिशा',
};

const SECTIONS_COMPLETE: Record<string, (n: number) => string> = {
  en: (n) => `${n} of 6 modules approved`,
  kn: (n) => `6 ರಲ್ಲಿ ${n} ಮಾಡ್ಯೂಲ್‌ಗಳು ಅನುಮೋದಿತ`,
  ta: (n) => `6 இல் ${n} பிரிவுகள் அங்கீகரிக்கப்பட்டவை`,
  hi: (n) => `6 में से ${n} मॉड्यूल स्वीकृत`,
};

const PCP_DICT: Record<string, Record<string, string>> = {
  en: {
    approve: 'Approve',
    requestChanges: 'Request Changes',
    cancel: 'Cancel',
    submitFeedback: 'Submit Feedback',
    submitting: 'Submitting...',
    teacherFeedback: 'Teacher feedback:',
    provideFeedbackDesc: 'Provide feedback for the student on what to improve.',
    rejectionPlaceholder: 'e.g. Please provide more specific answers...',
    studentPendingReview: 'Your profile card is being reviewed by your teacher.',
    careerPendingReview: 'Your career direction is being reviewed by your teacher.',
    approvedBadge: 'Approved',
    pendingBadge: 'Pending Review',
    changesRequested: 'Revision Requested',
    regenerating: 'Regenerating...',
    toastModuleApproved: 'Module approved',
    toastApprovalFailed: 'Approval failed',
    toastMaxFeedback: 'Maximum feedback rounds reached — please approve or discuss with student directly',
    toastFeedbackSubmitted: 'Feedback submitted',
    toastRejectionFailed: 'Rejection failed',
  },
  kn: {
    approve: 'ಅನುಮೋದಿಸಿ',
    requestChanges: 'ಬದಲಾವಣೆಗಳನ್ನು ಕೋರಿ',
    cancel: 'ರದ್ದುಗೊಳಿಸಿ',
    submitFeedback: 'ಪ್ರತಿಕ್ರಿಯೆ ಸಲ್ಲಿಸಿ',
    submitting: 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...',
    teacherFeedback: 'ಶಿಕ್ಷಕರ ಪ್ರತಿಕ್ರಿಯೆ:',
    provideFeedbackDesc: 'ವಿದ್ಯಾರ್ಥಿಗೆ ಸುಧಾರಿಸಲು ಪ್ರತಿಕ್ರಿಯೆ ನೀಡಿ.',
    rejectionPlaceholder: 'ಉದಾ: ದಯವಿಟ್ಟು ಹೆಚ್ಚು ನಿರ್ದಿಷ್ಟವಾದ ಉತ್ತರಗಳನ್ನು ನೀಡಿ...',
    studentPendingReview: 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಕಾರ್ಡ್ ಅನ್ನು ನಿಮ್ಮ ಶಿಕ್ಷಕರು ಪರಿಶೀಲಿಸುತ್ತಿದ್ದಾರೆ.',
    careerPendingReview: 'ನಿಮ್ಮ ವೃತ್ತಿಜೀವನದ ದಿಕ್ಕನ್ನು ನಿಮ್ಮ ಶಿಕ್ಷಕರು ಪರಿಶೀಲಿಸುತ್ತಿದ್ದಾರೆ.',
    approvedBadge: 'ಅನುಮೋದಿಸಲಾಗಿದೆ',
    pendingBadge: 'ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ',
    changesRequested: 'ಪರಿಷ್ಕರಣೆ ಕೋರಲಾಗಿದೆ',
    regenerating: 'ಮರುಉತ್ಪಾದಿಸಲಾಗುತ್ತಿದೆ...',
    toastModuleApproved: 'ಮಾಡ್ಯೂಲ್ ಅನುಮೋದಿಸಲಾಗಿದೆ',
    toastApprovalFailed: 'ಅನುಮೋದನೆ ವಿಫಲವಾಗಿದೆ',
    toastMaxFeedback: 'ಗರಿಷ್ಠ ಪ್ರತಿಕ್ರಿಯೆ ಸುತ್ತುಗಳನ್ನು ತಲುಪಲಾಗಿದೆ — ದಯವಿಟ್ಟು ನೇರವಾಗಿ ವಿದ್ಯಾರ್ಥಿಯೊಂದಿಗೆ ಚರ್ಚಿಸಿ',
    toastFeedbackSubmitted: 'ಪ್ರತಿಕ್ರಿಯೆ ಸಲ್ಲಿಸಲಾಗಿದೆ',
    toastRejectionFailed: 'ಪ್ರತಿಕ್ರಿಯೆ ಸಲ್ಲಿಕೆ ವಿಫಲವಾಗಿದೆ',
  },
  ta: {
    approve: 'அங்கீகரி',
    requestChanges: 'திருத்தங்கள் தேவை',
    cancel: 'ரத்து செய்',
    submitFeedback: 'கருத்தை சமர்ப்பிக்கவும்',
    submitting: 'சமர்ப்பிக்கிறது...',
    teacherFeedback: 'ஆசிரியர் கருத்து:',
    provideFeedbackDesc: 'மாணவர் எதை மேம்படுத்த வேண்டும் என்பதற்கான கருத்தை வழங்கவும்.',
    rejectionPlaceholder: 'உதாரணம்: தயவுசெய்து இன்னும் தெளிவான பதில்களை வழங்கவும்...',
    studentPendingReview: 'உங்கள் சுயவிவர அட்டை உங்கள் ஆசிரியரால் மதிப்பாய்வு செய்யப்படுகிறது.',
    careerPendingReview: 'உங்கள் தொழில் திசை உங்கள் ஆசிரியரால் மதிப்பாய்வு செய்யப்படுகிறது.',
    approvedBadge: 'அங்கீகரிக்கப்பட்டது',
    pendingBadge: 'மதிப்பாய்வில் உள்ளது',
    changesRequested: 'திருத்தம் கோரப்பட்டுள்ளது',
    regenerating: 'மீண்டும் உருவாக்கப்படுகிறது...',
    toastModuleApproved: 'தொகுதி அங்கீகரிக்கப்பட்டது',
    toastApprovalFailed: 'அங்கீகரிப்பு தோல்வியடைந்தது',
    toastMaxFeedback: 'அதிகபட்ச கருத்துச் சுற்றுகள் எட்டப்பட்டுள்ளன — தயவுசெய்து நேரடியாக மாணவருடன் கலந்துரையாடவும்',
    toastFeedbackSubmitted: 'கருத்து சமர்ப்பிக்கப்பட்டது',
    toastRejectionFailed: 'கருத்து சமர்ப்பிப்பு தோல்வி அடைந்தது',
  },
  hi: {
    approve: 'अनुमोदित करें',
    requestChanges: 'बदलाव का अनुरोध करें',
    cancel: 'रद्द करें',
    submitFeedback: 'फीडबैक सबमिट करें',
    submitting: 'सबमिट हो रहा है...',
    teacherFeedback: 'शिक्षक फीडबैक:',
    provideFeedbackDesc: 'छात्र को सुधार के लिए फीडबैक दें।',
    rejectionPlaceholder: 'उदा. कृपया अधिक विशिष्ट उत्तर प्रदान करें...',
    studentPendingReview: 'आपके प्रोफाइल कार्ड की समीक्षा आपके शिक्षक द्वारा की जा रही है।',
    careerPendingReview: 'आपकी career दिशा की समीक्षा आपके शिक्षक द्वारा की जा रही है।',
    approvedBadge: 'अनुमोदित',
    pendingBadge: 'समीक्षा के लिए लंबित',
    changesRequested: 'संशोधन का अनुरोध किया गया',
    regenerating: 'पुनरुत्पादित हो रहा है...',
    toastModuleApproved: 'मॉड्यूल अनुमोदित',
    toastApprovalFailed: 'अनुमोदन विफल',
    toastMaxFeedback: 'अधिकतम फीडबैक सीमा समाप्त — कृपया सीधे छात्र से चर्चा करें',
    toastFeedbackSubmitted: 'फीडबैक सबमिट किया गया',
    toastRejectionFailed: 'अस्वीकृति विफल',
  },
};

type ProfileCardAnswers = Record<string, string>;
type ProfileCardQuestionLabels = { key: string; label: string }[];

interface ProfileCardPageProps {
  readOnly?: boolean;
  studentIdOverride?: string;
}

export default function ProfileCardPage({ readOnly, studentIdOverride }: ProfileCardPageProps) {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { lang: currentLang } = useLang();
  const params = useParams<{ studentId?: string }>();

  // assessment_responses.student_id → students(id)
  // profile_card_cache.student_id → users(id)
  // These are different FKs, so we need separate IDs for each table.
  const studentId = studentIdOverride || params.studentId || userProfile?.studentProfile?.id || '';
  const userId = user?.id || '';
  const lang = (currentLang || 'en') as 'en' | 'kn' | 'ta' | 'hi';
  const { t } = useStudentStrings(lang);
  const pcp = PCP_DICT[lang] || PCP_DICT.en;

  // cacheUserId is the users.id used for all profile_card_cache operations.
  // Student view: userId (= user?.id = users.id) is available directly.
  // Teacher view: resolved from students table in fetchData.
  const [cacheUserId, setCacheUserId] = useState<string>('');
  const [completedModules, setCompletedModules] = useState<Record<string, { responses: any; updated_at: string } | null>>({});
  const [answers, setAnswers] = useState<Record<string, ProfileCardAnswers>>({});
  const [questionLabels, setQuestionLabels] = useState<Record<string, ProfileCardQuestionLabels>>({});
  const [careerDirection, setCareerDirection] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generatingKeys, setGeneratingKeys] = useState<Set<string>>(new Set());
  const [generatingDirection, setGeneratingDirection] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<Record<string, string>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [rejectingModule, setRejectingModule] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [savingApproval, setSavingApproval] = useState(false);
  const [regeneratingModules, setRegeneratingModules] = useState<Set<string>>(new Set());
  const [rejectionCounts, setRejectionCounts] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const [studentName, setStudentName] = useState('');
  const [studentLang, setStudentLang] = useState<string>('en');
  const [cacheTimestamps, setCacheTimestamps] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      // Resolve users.id for profile_card_cache and student name
      let resolvedCacheUserId = '';
      if (studentIdOverride || params.studentId) {
        // Teacher view: params.studentId is students.id — resolve to users.id
        const { data: stu } = await supabase.from('students').select('user_id').eq('id', studentId).maybeSingle();
        if (!stu?.user_id) { setLoading(false); return; }
        resolvedCacheUserId = stu.user_id;
        const { data: u } = await supabase.from('users').select('full_name, preferred_language').eq('id', stu.user_id).single();
        if (u) {
          setStudentName(u.full_name || '');
          setStudentLang((u as any).preferred_language || 'en');
        }
      } else {
        // Student view: userId is already users.id
        resolvedCacheUserId = userId;
        const { data: profile } = await supabase.from('users').select('full_name, preferred_language').eq('id', userId).single();
        if (profile) {
          setStudentName(profile.full_name || '');
          setStudentLang((profile as any).preferred_language || 'en');
        }
      }
      setCacheUserId(resolvedCacheUserId);

      const responseMap: Record<string, { responses: any; updated_at: string; review_status?: string } | null> = {};
      for (const mod of MODULES) {
        const { data: resp } = await supabase
          .from('assessment_responses')
          .select('responses, updated_at, review_status')
          .eq('student_id', studentId)
          .eq('assessment_type', mod.assessmentType)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        responseMap[mod.key] = resp ? { responses: resp.responses, updated_at: resp.updated_at, review_status: resp.review_status } : null;
      }
      setCompletedModules(responseMap as any);

      // Fetch cached profile card answers
      const { data: cachedRows } = await supabase
        .from('profile_card_cache')
        .select('assessment_type, keywords, generated_at, approval_status, rejection_reason')
        .eq('student_id', resolvedCacheUserId);

      const answerMap: Record<string, ProfileCardAnswers> = {};
      const tsMap: Record<string, string> = {};
      const statusMap: Record<string, string> = {};
      const reasonMap: Record<string, string> = {};
      if (cachedRows) {
        for (const row of cachedRows) {
          if (row.generated_at) {
            tsMap[row.assessment_type] = row.generated_at;
          }
          if ((row as any).approval_status) {
            statusMap[row.assessment_type] = (row as any).approval_status;
          }
          if ((row as any).rejection_reason) {
            reasonMap[row.assessment_type] = (row as any).rejection_reason;
          }
          if (row.assessment_type === 'career_direction') {
            const kw = row.keywords as any;
            if (typeof kw === 'object' && kw.direction) {
              try {
                const translatedDirection = await geminiTranslationService.translateStructure(kw.direction, lang);
                setCareerDirection(translatedDirection);
              } catch (err) {
                logger.error('Failed to translate cached career direction:', err);
                setCareerDirection(kw.direction);
              }
            }
          } else {
            const kw = row.keywords as any;
            if (kw && typeof kw === 'object' && !Array.isArray(kw) && Object.keys(kw).length > 0) {
              try {
                const translatedKw = await geminiTranslationService.translateStructure(kw, lang);
                answerMap[row.assessment_type] = translatedKw as ProfileCardAnswers;
              } catch (err) {
                logger.error(`Failed to translate cached keywords for ${row.assessment_type}:`, err);
                answerMap[row.assessment_type] = kw as ProfileCardAnswers;
              }
            }
          }
        }
      }

      // Fallback/Sync with assessment_responses review_status
      for (const mod of MODULES) {
        const resp = responseMap[mod.key];
        if (resp) {
          const rStatus = resp.review_status;
          const hasExplicitStatus = statusMap[mod.key] === 'approved' || statusMap[mod.key] === 'rejected';
          if (!hasExplicitStatus) {
            if (rStatus === 'reviewed') {
              statusMap[mod.key] = 'approved';
            } else if (rStatus === 'needs_revision' || rStatus === 'flagged') {
              statusMap[mod.key] = 'rejected';
            } else if (!statusMap[mod.key]) {
              statusMap[mod.key] = 'pending';
            }
          }
        }
      }

      // Fallback to raw responses if keyword cache is missing or empty
      for (const mod of MODULES) {
        if (!answerMap[mod.key] && responseMap[mod.key]?.responses) {
          const rawResp = responseMap[mod.key].responses;
          const fallbackAns: Record<string, string> = {};
          
          if (mod.key === 'inspiration') {
            const videoKeys = Object.keys(rawResp).filter(k => k.startsWith('video')).sort();
            if (videoKeys.length > 0) {
              const firstVid = rawResp[videoKeys[0]] || {};
              fallbackAns.question1 = firstVid.question1 || firstVid.question2 || firstVid.question3 || '';
              fallbackAns.question2 = firstVid.question4 || firstVid.question5 || '';
              fallbackAns.question3 = firstVid.question6 || firstVid.question7 || firstVid.question8 || '';
            }
          } else if (mod.key === 'about_me') {
            fallbackAns.question1 = rawResp.question1 || rawResp.question2 || rawResp.question3 || '';
            fallbackAns.question2 = rawResp.question12 || rawResp.question13 || '';
            fallbackAns.question3 = rawResp.question14 || rawResp.question11 || '';
          } else if (mod.key === 'dreams') {
            fallbackAns.question1 = rawResp.summary_q1 || '';
            fallbackAns.question2 = rawResp.summary_q2 || '';
            fallbackAns.question3 = rawResp.summary_q3 || '';

            if (!fallbackAns.question1 || !fallbackAns.question2 || !fallbackAns.question3) {
              const partKeys = Object.keys(rawResp).filter(k => k.startsWith('part')).sort();
              if (partKeys.length > 0) {
                const firstPart = rawResp[partKeys[0]] || {};
                fallbackAns.question1 = fallbackAns.question1 || firstPart.question1 || '';
                fallbackAns.question2 = fallbackAns.question2 || firstPart.question3 || '';
                fallbackAns.question3 = fallbackAns.question3 || firstPart.question5 || '';
              }
            }
          } else if (mod.key === 'school_learning') {
            const p1 = rawResp.part1 || {};
            const p2 = rawResp.part2 || {};
            const p3 = rawResp.part3 || {};
            fallbackAns.question1 = p1.question1 || '';
            fallbackAns.question2 = p2.question1 || '';
            fallbackAns.question3 = p3.question2 || '';
          } else if (mod.key === 'hobbies') {
            const p1 = rawResp.part1 || {};
            const p2 = rawResp.part2 || {};
            
            const hobbies: string[] = [];
            const talents: string[] = [];
            
            Object.keys(p1).forEach(k => {
              const item = p1[k] || {};
              if (item.question1) hobbies.push(item.question1);
            });
            Object.keys(p2).forEach(k => {
              const item = p2[k] || {};
              if (item.question1) talents.push(item.question1);
            });
            
            fallbackAns.question1 = hobbies.join(', ') || '—';
            fallbackAns.question2 = talents.join(', ') || '—';
            fallbackAns.question3 = p1.hobby1?.question3 || p2.talent1?.question3 || '—';
          } else if (mod.key === 'role_models') {
            const p1 = rawResp.part1 || {};
            const questions: string[] = [];
            Object.keys(p1).forEach(k => {
              const item = p1[k] || {};
              if (item.question3) questions.push(item.question3);
            });
            fallbackAns.question1 = questions.slice(0, 2).join('\n') || '—';
          }
          
          if (Object.keys(fallbackAns).length > 0) {
            answerMap[mod.key] = fallbackAns as any;
          }
        }
      }

      setAnswers(answerMap);
      setCacheTimestamps(tsMap);
      setApprovalStatus(statusMap);
      setRejectionReasons(reasonMap);

      // Fetch profile card question labels from content_translations
      const labelMap: Record<string, ProfileCardQuestionLabels> = {};
      for (const mod of MODULES) {
        const resourceType = `profile_card_${mod.assessmentType}`;
        const questionKeys = Array.from({ length: 10 }, (_, i) => `question${i + 1}`);
        const { data: qRows } = await supabase
          .from('content_translations')
          .select('resource_key,text')
          .eq('resource_type', resourceType)
          .eq('lang', lang)
          .in('resource_key', questionKeys);

        if (qRows && qRows.length > 0) {
          labelMap[mod.key] = qRows
            .sort((a, b) => {
              const aNum = parseInt(a.resource_key.replace('question', ''));
              const bNum = parseInt(b.resource_key.replace('question', ''));
              return aNum - bNum;
            })
            .map(r => ({ key: r.resource_key, label: r.text }));
        }
      }
      setQuestionLabels(labelMap);
    } catch (err) {
      logger.error('Error fetching profile card data:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId, userId, lang]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (loading || readOnly) return;
    for (const mod of MODULES) {
      const completed = completedModules[mod.key];
      if (!completed) continue;

      const cachedAt = cacheTimestamps[mod.key];
      const responseUpdatedAt = completed.updated_at;

      // Skip if cache exists and is newer than the response update
      if (answers[mod.key] && cachedAt && responseUpdatedAt && new Date(cachedAt) >= new Date(responseUpdatedAt)) {
        continue;
      }

      // Regenerate: no cache, or response was updated after cache
      regenerateAnswers(mod.key, completed.responses);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, completedModules, cacheTimestamps]);

  const regenerateAnswers = async (assessmentType: string, responses: any, teacherFeedback?: string) => {
    if (generatingKeys.has(assessmentType)) return;
    setGeneratingKeys(prev => new Set(prev).add(assessmentType));
    try {
      const text = flattenResponses(responses);
      if (!text) return;
      const result = await aiSummaryService.generateProfileCardKeywords(assessmentType, '', lang, text, teacherFeedback);
      if (result.success && result.keywords) {
        const now = new Date().toISOString();
        setAnswers(prev => ({ ...prev, [assessmentType]: result.keywords! }));
        setCacheTimestamps(prev => ({ ...prev, [assessmentType]: now }));
        // Preserve existing approval_status — don't reset teacher decisions
        const currentStatus = approvalStatus[assessmentType];
        const isExplicit = currentStatus === 'approved' || currentStatus === 'rejected';
        const upsertPayload: any = {
          student_id: cacheUserId,
          assessment_type: assessmentType,
          keywords: result.keywords,
          generated_at: now,
        };
        if (!isExplicit) {
          upsertPayload.approval_status = 'pending';
          upsertPayload.approved_by = null;
          upsertPayload.approved_at = null;
          upsertPayload.rejection_reason = null;
          setApprovalStatus(prev => ({ ...prev, [assessmentType]: 'pending' }));
        }
        const { error } = await supabase.from('profile_card_cache').upsert(upsertPayload, { onConflict: 'student_id,assessment_type' });
        if (error) logger.error('Profile card cache upsert error:', error);
      }
    } catch (err) {
      logger.error('Profile card answer generation failed for', assessmentType, err);
    } finally {
      setGeneratingKeys(prev => { const s = new Set(prev); s.delete(assessmentType); return s; });
    }
  };

  const completedCount = MODULES.filter(m => !!completedModules[m.key]).length;
  const allComplete = completedCount === 6;
  const approvedCount = MODULES.filter(m => approvalStatus[m.key] === 'approved').length;
  const progressPercent = Math.round((approvedCount / 6) * 100);
  const dirStatus = (approvalStatus['career_direction'] || 'pending') as string;
  const showCareerDirection = readOnly || dirStatus === 'approved';

  useEffect(() => {
    if (!allComplete || generatingDirection || loading || readOnly) return;

    // All 3 source modules must have at least one non-empty keyword before synthesising
    // the direction — prevents partial synthesis while sibling modules are still generating.
    const sourceModulesReady = (['dreams', 'hobbies', 'role_models'] as const).every(
      key => answers[key] && Object.values(answers[key]).some(v => v?.trim())
    );
    if (!sourceModulesReady) return;

    const dirCachedAt = cacheTimestamps['career_direction'];
    const latestResponseUpdate = MODULES
      .map(m => completedModules[m.key]?.updated_at)
      .filter(Boolean)
      .sort()
      .pop();

    // Skip if cached direction exists and is newer than the latest response update
    if (careerDirection && dirCachedAt && latestResponseUpdate && new Date(dirCachedAt) >= new Date(latestResponseUpdate)) {
      return;
    }

    generateDirection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allComplete, careerDirection, loading, cacheTimestamps]);

  const generateDirection = async () => {
    setGeneratingDirection(true);
    try {
      const dreamsAns = answers['dreams'] || {};
      const hobbiesAns = answers['hobbies'] || {};
      const roleModelsAns = answers['role_models'] || {};
      const result = await aiSummaryService.generateCareerDirection(
        dreamsAns, hobbiesAns, roleModelsAns, studentName, lang
      );
      if (result.success && result.direction) {
        const now = new Date().toISOString();
        setCareerDirection(result.direction);
        setCacheTimestamps(prev => ({ ...prev, career_direction: now }));
        const { error } = await supabase.from('profile_card_cache').upsert({
          student_id: cacheUserId,
          assessment_type: 'career_direction',
          keywords: { direction: result.direction },
          generated_at: now,
          approval_status: 'pending',
          approved_by: null,
          approved_at: null,
          rejection_reason: null,
        } as any, { onConflict: 'student_id,assessment_type' });
        if (error) logger.error('Career direction cache upsert error:', error);
        setApprovalStatus(prev => ({ ...prev, career_direction: 'pending' }));
      }
    } catch (err) {
      logger.error('Career direction generation failed:', err);
    } finally {
      setGeneratingDirection(false);
    }
  };

  const handleApproveModule = async (assessmentType: string) => {
    if (!user?.id || !cacheUserId) return;
    setSavingApproval(true);
    try {
      const { error } = await supabase.from('profile_card_cache').upsert({
        student_id: cacheUserId,
        assessment_type: assessmentType,
        approval_status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: null,
        keywords: answers[assessmentType] || null,
      } as any, { onConflict: 'student_id,assessment_type' });
      if (error) throw error;

      setApprovalStatus(prev => ({ ...prev, [assessmentType]: 'approved' }));
      toast({ title: pcp.toastModuleApproved });

      if (cacheUserId) {
        const approvedNotif = buildProfileCardApprovedNotif(studentLang);
        supabase.rpc('create_notification_secure', {
          p_user_id: cacheUserId,
          p_type: 'profile_card_approved',
          p_title: approvedNotif.title,
          p_message: approvedNotif.message,
          p_link: '/student/profile-card',
        }).then(({ error: notifError }) => {
          if (notifError) logger.error('Profile card approval notification error:', notifError);
        });
      }
    } catch (err) {
      toast({ title: pcp.toastApprovalFailed, variant: 'destructive' });
    } finally {
      setSavingApproval(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingModule || !user?.id || !cacheUserId) return;
    setSavingApproval(true);
    try {
      const feedback = rejectReason.trim() || 'Changes requested';
      const moduleBeingRejected = rejectingModule;

      const currentCount = rejectionCounts[moduleBeingRejected] || 0;
      if (currentCount >= 3) {
        setRejectingModule(null);
        setRejectReason('');
        toast({ title: pcp.toastMaxFeedback });
        return;
      }

      const { error: rejectError } = await supabase.from('profile_card_cache').upsert({
        student_id: cacheUserId,
        assessment_type: moduleBeingRejected,
        approval_status: 'rejected',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: feedback,
        keywords: answers[moduleBeingRejected] || null,
      } as any, { onConflict: 'student_id,assessment_type' });
      if (rejectError) throw rejectError;

      setApprovalStatus(prev => ({ ...prev, [moduleBeingRejected]: 'rejected' }));
      setRejectionReasons(prev => ({ ...prev, [moduleBeingRejected]: feedback }));
      setRejectingModule(null);
      setRejectReason('');

      if (cacheUserId) {
        const rejectedNotif = buildProfileCardRejectedNotif(studentLang);
        supabase.rpc('create_notification_secure', {
          p_user_id: cacheUserId,
          p_type: 'profile_card_rejected',
          p_title: rejectedNotif.title,
          p_message: rejectedNotif.message,
          p_link: '/student/profile-card',
        }).then(({ error: notifError }) => {
          if (notifError) logger.error('Profile card rejection notification error:', notifError);
        });
      }

      setRejectionCounts(prev => ({ ...prev, [moduleBeingRejected]: currentCount + 1 }));
      toast({ title: pcp.toastFeedbackSubmitted });
    } catch (err) {
      toast({ title: pcp.toastRejectionFailed, variant: 'destructive' });
    } finally {
      setSavingApproval(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10" onClick={() => readOnly ? navigate(`/teacher?lang=${lang}`) : navigate(`/student?lang=${lang}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="text-center">
            <Compass className="h-12 w-12 mx-auto mb-3 opacity-90" />
            <h1 className="text-2xl md:text-3xl font-bold mb-1">{PAGE_TITLE[lang] || PAGE_TITLE.en}</h1>
            <p className="text-indigo-200 text-sm mb-2">{t('compass_subtitle')}</p>
            <p className="text-xl font-semibold mt-3">{studentName}</p>

            {/* Progress bar */}
            <div className="mt-5 max-w-xs mx-auto">
              <div className="flex items-center justify-between text-xs text-indigo-200 mb-1.5">
                <span>{(SECTIONS_COMPLETE[lang] || SECTIONS_COMPLETE.en)(approvedCount)}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden" role="progressbar" aria-valuenow={approvedCount} aria-valuemin={0} aria-valuemax={6} aria-label="Profile approval progress">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module cards grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES.map(mod => {
            const isComplete = !!completedModules[mod.key];
            const ans = answers[mod.key];
            const labels = questionLabels[mod.key] || [];
            const isGenerating = generatingKeys.has(mod.key);
            const isRegenerating = regeneratingModules.has(mod.assessmentType);
            const IconComp = mod.icon;
            const status = approvalStatus[mod.key] || 'pending';
            const reason = rejectionReasons[mod.key];
            // Student view: show answers only if approved (or if readOnly teacher view)
            const showAnswers = readOnly || status === 'approved';

            return (
              <Card
                key={mod.key}
                className={`rounded-xl shadow-md hover:shadow-lg border bg-white transition-all duration-200 overflow-hidden ${!readOnly ? 'cursor-pointer' : ''} focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none ${status === 'rejected' ? 'border-red-200' : 'border-gray-100'}`}
                role={!readOnly ? 'button' : undefined}
                tabIndex={!readOnly ? 0 : undefined}
                onClick={!readOnly ? () => navigate(`/student?assessment=${mod.assessmentType}&tab=summary`) : undefined}
                onKeyDown={!readOnly ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/student?assessment=${mod.assessmentType}&tab=summary`); } } : undefined}
              >
                {/* Colored top strip */}
                <div className={`h-1 ${mod.stripColor}`} />
                <CardContent className="p-6">
                  {/* Icon + Title + Status badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex items-center gap-2.5 ${mod.titleColor}`}>
                      <IconComp className="h-5 w-5" />
                      <h3 className="font-semibold text-base">{t(mod.titleKey)}</h3>
                    </div>
                    {isComplete && ans && (
                      isRegenerating ? (
                        <Badge className="bg-blue-100 text-blue-700 text-[10px]"><Loader2 className="h-3 w-3 mr-1 animate-spin" />{pcp.regenerating}</Badge>
                      ) : status === 'approved' ? (
                        <Badge className="bg-green-100 text-green-700 text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />{pcp.approvedBadge}</Badge>
                      ) : status === 'rejected' ? (
                        <Badge className="bg-red-100 text-red-700 text-[10px]"><XCircle className="h-3 w-3 mr-1" />{pcp.changesRequested}</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700 text-[10px]"><Clock className="h-3 w-3 mr-1" />{pcp.pendingBadge}</Badge>
                      )
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100 mb-3" />

                  {/* Rejection reason (student view) */}
                  {!readOnly && status === 'rejected' && reason && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      <strong>{pcp.teacherFeedback}</strong> {reason}
                    </div>
                  )}

                  {/* Student pending message */}
                  {!readOnly && isComplete && ans && status === 'pending' && (
                    <p className="text-xs text-yellow-600 italic mb-3">{pcp.studentPendingReview}</p>
                  )}

                  {/* Content: question label → answer */}
                  {isComplete ? (
                    isGenerating ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{t('generating_keywords')}</span>
                      </div>
                    ) : ans ? (
                      showAnswers ? (
                        <dl className="space-y-2.5">
                          {labels.length > 0
                            ? labels.map(({ key, label }) => (
                              <div key={key}>
                                <dt className="text-xs text-gray-400 leading-snug">{label}</dt>
                                <dd className="text-sm font-medium text-gray-700 mt-0.5">
                                  {ans[key] || '—'}
                                </dd>
                              </div>
                            ))
                            : Object.entries(ans).filter(([, v]) => v && String(v).trim()).map(([key, value]) => (
                              <div key={key}>
                                <dt className="text-xs text-gray-400 leading-snug capitalize">{key.replace(/_/g, ' ')}</dt>
                                <dd className="text-sm font-medium text-gray-700 mt-0.5">{String(value)}</dd>
                              </div>
                            ))
                          }
                        </dl>
                      ) : (
                        <dl className="space-y-2.5">
                          {(labels.length > 0 ? labels : Object.keys(ans).map(k => ({ key: k, label: k }))).map(({ key, label }) => (
                            <div key={key}>
                              <dt className="text-xs text-gray-400 leading-snug">{label}</dt>
                              <dd className="text-sm text-gray-300 mt-0.5">—</dd>
                            </div>
                          ))}
                        </dl>
                      )
                    ) : (
                      <p className="text-sm text-gray-400 italic">{t('generating_keywords')}</p>
                    )
                  ) : (
                    <>
                      {labels.length > 0 && (
                        <dl className="space-y-2 mb-3">
                          {labels.map(({ key, label }) => (
                            <div key={key}>
                              <dt className="text-xs text-gray-400 leading-snug">{label}</dt>
                              <dd className="text-sm text-gray-300 mt-0.5">—</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      <p className="text-xs text-gray-400 italic mt-2">
                        {t('complete_module_nudge')}
                      </p>
                    </>
                  )}

                  {/* Teacher: per-module action buttons */}
                  {readOnly && isComplete && ans && !isRegenerating && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                      {status !== 'approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50 text-xs"
                          onClick={(e) => { e.stopPropagation(); handleApproveModule(mod.assessmentType); }}
                          disabled={savingApproval}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> {pcp.approve}
                        </Button>
                      )}
                      {status !== 'rejected' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                          onClick={(e) => { e.stopPropagation(); setRejectingModule(mod.assessmentType); }}
                        >
                          <XCircle className="h-3 w-3 mr-1" /> {pcp.requestChanges}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 7th card — My Career Direction */}
        <div className="mt-8">
          <Card className={`rounded-xl shadow-md hover:shadow-lg border bg-white overflow-hidden ${careerDirection && dirStatus === 'rejected' ? 'border-red-200' : 'border-gray-100'}`}>
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <Compass className={`h-6 w-6 ${allComplete ? 'text-indigo-600' : 'text-gray-400 animate-pulse'}`} />
                  <h3 className={`text-lg font-bold ${allComplete ? 'text-indigo-800' : 'text-gray-500'}`}>
                    {CAREER_DIR_TITLE[lang] || CAREER_DIR_TITLE.en}
                  </h3>
                </div>
                {allComplete && careerDirection && !generatingDirection && (
                  dirStatus === 'approved' ? (
                    <Badge className="bg-green-100 text-green-700 text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />{pcp.approvedBadge}</Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-700 text-[10px]"><Clock className="h-3 w-3 mr-1" />{pcp.pendingBadge}</Badge>
                  )
                )}
              </div>

              <div className="border-t border-gray-100 mb-4" />

              {!readOnly && allComplete && careerDirection && !generatingDirection && dirStatus === 'pending' && (
                <p className="text-xs text-yellow-600 italic mb-3">{pcp.careerPendingReview}</p>
              )}

              {allComplete ? (
                generatingDirection ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('generating_direction')}</span>
                  </div>
                ) : careerDirection ? (
                  showCareerDirection ? (
                    <blockquote className="border-l-4 border-indigo-400 pl-4 text-gray-700 leading-relaxed italic">
                      {careerDirection}
                    </blockquote>
                  ) : (
                    <p className="text-sm text-gray-300 italic">—</p>
                  )
                ) : (
                  <p className="text-sm text-gray-400 italic">{t('generating_direction')}</p>
                )
              ) : (
                <div className="text-center py-4">
                  <Compass className="h-8 w-8 mx-auto text-gray-300 animate-pulse mb-3" />
                  <p className="text-sm text-gray-400">
                    {t('career_direction_motivational')}
                  </p>
                </div>
              )}

              {readOnly && allComplete && careerDirection && !generatingDirection && dirStatus !== 'approved' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-200 hover:bg-green-50 text-xs"
                    onClick={(e) => { e.stopPropagation(); handleApproveModule('career_direction'); }}
                    disabled={savingApproval}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" /> {pcp.approve}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rejection reason dialog (inline) */}
        {rejectingModule && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setRejectingModule(null)}>
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{pcp.requestChanges}</h3>
              <p className="text-sm text-gray-600 mb-4">{pcp.provideFeedbackDesc}</p>
              <Textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder={pcp.rejectionPlaceholder}
                rows={3}
                className="mb-4"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setRejectingModule(null); setRejectReason(''); }}>{pcp.cancel}</Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleReject} disabled={savingApproval}>
                  {savingApproval ? pcp.submitting : pcp.submitFeedback}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
