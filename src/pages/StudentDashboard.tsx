import { logger } from '@/lib/logger';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Zap, Activity, Sparkles, School, Users, Palette, Lock, CheckCircle,
  Play, Star, BookOpen, Heart, Target, User, Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProfileDialog from '@/components/ProfileDialog';
import ChatBubble from '@/components/chat/ChatBubble';
// AI summary flow disabled — SummaryViewDialog, AssessmentSummary, summaryDatabaseService retained for potential re-enable
import { useLang } from '@/hooks/useLang';
import { aiChatService } from '@/services/aiChatService';
import LanguageSelectionDialog from '@/components/LanguageSelectionDialog';

// Sub-components
import { useStudentStrings, StudentLang } from '@/components/student/studentStrings';
import StudentDashboardHeader from '@/components/student/StudentDashboardHeader';
import IlpFooter from '@/components/IlpFooter';
import AssessmentGrid, { AssessmentCardData, SummaryState } from '@/components/student/AssessmentGrid';
import CareerChatSection from '@/components/student/CareerChatSection';

export default function StudentDashboard() {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { lang } = useLang();
  const resolvedLang = (lang || 'en') as StudentLang;
  const { t } = useStudentStrings(resolvedLang);

  // ── Profile state ─────────────────────────────────────────────────
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '', email: '', bio: '', interests: '', careerGoals: '', strengths: '', areasForGrowth: ''
  });

  // ── Mentor ────────────────────────────────────────────────────────
  const [mentorName, setMentorName] = useState<string | null>(null);
  const [mentorIds, setMentorIds] = useState<{ studentId: string | null; teacherId: string | null }>({ studentId: null, teacherId: null });

  // ── Refresh guard ────────────────────────────────────────────────
  // isRefreshingRef removed — summary polling disabled

  // ── CareerChat LM ─────────────────────────────────────────────────
  type ChatMsg = { id: string; role: 'user' | 'model'; text: string };
  const [ccMessages, setCcMessages] = useState<ChatMsg[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [ccLoading, setCcLoading] = useState(false);
  const ccListRef = useRef<HTMLDivElement | null>(null);
  const roadmapRedirectedRef = useRef<Set<string>>(
    new Set<string>(JSON.parse(sessionStorage.getItem('roadmap_redirected') ?? '[]'))
  );
  const ccCanSend = useMemo(() => !!ccInput.trim() && !ccLoading, [ccInput, ccLoading]);

  const handleCareerChatSend = async () => {
    if (!ccCanSend) return;
    const content = ccInput.trim();
    setCcInput('');
    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: 'user', text: content };
    setCcMessages(prev => [...prev, userMsg]);
    setCcLoading(true);
    try {
      const history = ccMessages.slice(-20).map(m => ({ id: m.id, role: m.role, text: m.text }));
      const response = await aiChatService.sendMessage(history, content);
      if (response.success && response.text) {
        setCcMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: response.text! }]);
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch {
      const errorText =
        resolvedLang === 'kn' ? 'ಸದ್ಯ ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.' :
        resolvedLang === 'ta' ? 'இப்போது இணைக்க முடியவில்லை. தயவு செய்து மீண்டும் முயற்சிக்கவும்.' :
        resolvedLang === 'hi' ? 'अभी जुड़ने में समस्या है। कृपया बाद में पुनः प्रयास करें।' :
        'Having trouble connecting right now. Please try again later.';
      setCcMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: errorText }]);
    } finally { setCcLoading(false); }
  };

  // ── Summary state (disabled — AI summary flow disconnected) ──────

  // ── Language prompt ───────────────────────────────────────────────
  const [langPromptOpen, setLangPromptOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (userProfile?.role === 'student' && userProfile?.has_selected_language === false) {
      logger.log('Language prompt disabled via code');
    }
  }, [userProfile?.role, userProfile?.has_selected_language]);

  // ── Progress loaded flag — roadmap redirect must not fire until confirmed ──
  const [progressLoaded, setProgressLoaded] = useState(false);

  // ── Assessment progress ───────────────────────────────────────────
  const [assessmentProgress, setAssessmentProgress] = useState<Record<string, any> | null>(null);
  const [aboutMeProgress, setAboutMeProgress] = useState<Record<string, any> | null>(null);
  const [dreamsProgress, setDreamsProgress] = useState<Record<string, any> | null>(null);
  const [stateLearningProgress, setSchoolLearningProgress] = useState<Record<string, any> | null>(null);
  const [hobbiesProgress, setHobbiesProgress] = useState<Record<string, any> | null>(null);
  const [roleModelsProgress, setRoleModelsProgress] = useState<Record<string, any> | null>(null);
  const [hollandCodeProgress, setHollandCodeProgress] = useState<Record<string, any> | null>(null);
  const [careerGuidanceToolsProgress, setCareerGuidanceToolsProgress] = useState<Record<string, any> | null>(null);

  // ── Completion status ─────────────────────────────────────────────
  const [inspirationCompleted, setInspirationCompleted] = useState(false);
  const [aboutMeCompleted, setAboutMeCompleted] = useState(false);
  const [dreamsCompleted, setDreamsCompleted] = useState(false);
  const [stateLearningCompleted, setSchoolLearningCompleted] = useState(false);
  const [hobbiesCompleted, setHobbiesCompleted] = useState(false);
  const [roleModelsCompleted, setRoleModelsCompleted] = useState(false);
  const [hollandCodeCompleted, setHollandCodeCompleted] = useState(false);
  const [careerGuidanceToolsCompleted, setCareerGuidanceToolsCompleted] = useState(false);

  // ═══════════════════════════════════════════════════════════════════
  //  BUSINESS LOGIC
  // ═══════════════════════════════════════════════════════════════════

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: resolvedLang === 'kn' ? "ಲಾಗ್ ಔಟ್ ಮಾಡಲಾಗಿದೆ" : resolvedLang === 'ta' ? "வெளியேறப்பட்டது" : resolvedLang === 'hi' ? "लॉग आउट हो गया" : "Logged Out",
        description: resolvedLang === 'kn' ? "ನೀವು ಯಶಸ್ವಿಯಾಗಿ ಲಾಗ್ ಔಟ್ ಮಾಡಲಾಗಿದೆ." : resolvedLang === 'ta' ? "நீங்கள் வெற்றிகரமாக வெளியேறியுள்ளீர்கள்." : resolvedLang === 'hi' ? "आप सफलतापूर्वक लॉग आउट हो गए हैं।" : "You have been successfully logged out.",
      });
    } catch (error) { logger.error('Logout error:', error); }
  };

  const getStudentId = async () => {
    if (!userProfile) return null;
    if (userProfile.studentProfile?.id) return userProfile.studentProfile.id;
    const { data } = await supabase.from('students').select('id').eq('user_id', userProfile.id).maybeSingle();
    return data?.id || null;
  };

  // ── View Summary — navigates to assessment with summary tab open ──
  const handleViewSummary = (type: string) => {
    const routes: Record<string, string> = {
      'inspiration': 'inspiration', 'about_me': 'about-me', 'dreams': 'dreams',
      'school_learning': 'school-learning', 'role_models': 'role-models', 'hobbies': 'hobbies',
    };
    const route = routes[type];
    if (route) navigate(`/student/assessment/${route}?lang=${resolvedLang}&tab=summary&readonly=1`);
  };

  // ── Progress checking ─────────────────────────────────────────────

  const checkAssessmentProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;
    try {
      const { data, error } = await supabase.from('assessment_responses').select('*')
        .eq('student_id', studentId).eq('assessment_type', 'inspiration')
        .order('completed_at', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (data && !error) { setAssessmentProgress(data); }
    } catch { }
  };

  const checkAboutMeProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;
    try {
      const { data, error } = await supabase.from('assessment_responses').select('*')
        .eq('student_id', studentId).eq('assessment_type', 'about_me')
        .order('completed_at', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (data && !error) { setAboutMeProgress(data); }
    } catch { }
  };

  const checkDreamsProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;
    try {
      const { data, error } = await supabase.from('assessment_responses').select('*')
        .eq('student_id', studentId).eq('assessment_type', 'dreams')
        .order('completed_at', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (data && !error) { setDreamsProgress(data); }
    } catch { }
  };

  const checkSchoolLearningProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;
    try {
      const { data, error } = await supabase.from('assessment_responses').select('*')
        .eq('student_id', studentId).eq('assessment_type', 'school_learning')
        .order('completed_at', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (data && !error) { setSchoolLearningProgress(data); }
    } catch { }
  };

  const checkRoleModelsProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;
    try {
      const { data, error } = await supabase.from('assessment_responses').select('*')
        .eq('student_id', studentId).eq('assessment_type', 'role_models')
        .order('completed_at', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (data && !error) { setRoleModelsProgress(data); }
    } catch { }
  };

  const checkHobbiesProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;
    try {
      const { data, error } = await supabase.from('assessment_responses').select('*')
        .eq('student_id', studentId).eq('assessment_type', 'hobbies')
        .order('completed_at', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (data && !error) { setHobbiesProgress(data); }
    } catch { }
  };

  const checkHollandCodeProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;
    try {
      const { data, error } = await supabase.from('assessment_responses').select('*')
        .eq('student_id', studentId).eq('assessment_type', 'personality')
        .order('completed_at', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (data && !error) { setHollandCodeProgress(data); }
    } catch { }
  };

  const checkCareerGuidanceToolsProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;
    try {
      const { data, error } = await supabase.from('assessment_responses').select('*')
        .eq('student_id', studentId).eq('assessment_type', 'career_guidance_tools')
        .order('completed_at', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (data && !error) setCareerGuidanceToolsProgress(data);
    } catch { }
  };

  const fetchData = async () => {
    if (!userProfile?.id) return;
    try {
      const { data: studentData, error: studentError } = await supabase.from('students')
        .select(`*, classes:class_id(name, states:state_id(name)), teachers:teacher_id(id, users:user_id(full_name))`)
        .eq('user_id', userProfile.id).single();
      if (studentError) throw studentError;
      setMentorName(studentData?.teachers?.users?.full_name || 'ILP Mentor');
      setMentorIds({ studentId: studentData?.id || null, teacherId: studentData?.teachers?.id || null });
    } catch (error) { logger.error('Error fetching student data:', error); }
  };

  // ── useEffects ────────────────────────────────────────────────────

  useEffect(() => {
    if (!userProfile?.id) return;
    setProgressLoaded(false);
    fetchData();
    Promise.all([
      checkAssessmentProgress(),
      checkAboutMeProgress(),
      checkDreamsProgress(),
      checkSchoolLearningProgress(),
      checkHobbiesProgress(),
      checkRoleModelsProgress(),
      checkHollandCodeProgress(),
      checkCareerGuidanceToolsProgress(),
    ]).finally(() => setProgressLoaded(true));
  }, [userProfile?.id]);

  // Real-time summary subscription + periodic refresh disabled (AI summary flow disconnected)

  // Completion status
  useEffect(() => {
    setInspirationCompleted(!!assessmentProgress?.completed_at);
    setAboutMeCompleted(!!aboutMeProgress?.completed_at);
    setDreamsCompleted(!!dreamsProgress?.completed_at);
    setSchoolLearningCompleted(!!stateLearningProgress?.completed_at);
    setHobbiesCompleted(!!hobbiesProgress?.completed_at);
    setRoleModelsCompleted(!!roleModelsProgress?.completed_at);
    setHollandCodeCompleted(!!hollandCodeProgress?.completed_at);
    setCareerGuidanceToolsCompleted(!!careerGuidanceToolsProgress?.completed_at);
  }, [assessmentProgress, aboutMeProgress, dreamsProgress, stateLearningProgress, hobbiesProgress, roleModelsProgress, hollandCodeProgress, careerGuidanceToolsProgress]);

  // ── Auto-open summary from URL params — redirects to assessment directly ──
  useEffect(() => {
    if (!progressLoaded) return;
    const assessment = searchParams.get('assessment');
    const tab = searchParams.get('tab');
    if (!assessment || tab !== 'summary') return;

    const validTypes = ['inspiration', 'about_me', 'dreams', 'school_learning', 'hobbies', 'role_models'] as const;
    type ValidType = typeof validTypes[number];
    if (!validTypes.includes(assessment as ValidType)) {
      setSearchParams({}, { replace: true });
      return;
    }
    if (!getCompletionStatus(assessment)) return;

    setSearchParams({}, { replace: true });
    handleViewSummary(assessment);
  }, [searchParams, progressLoaded]);

  // ── Auto-open chat from URL param (?openChat=true) ────────────────
  useEffect(() => {
    if (searchParams.get('openChat') === 'true') {
      setIsChatOpen(true);
      setSearchParams(prev => {
        prev.delete('openChat');
        return prev;
      });
    }
  }, [searchParams]);

  // ── Assessment helpers ────────────────────────────────────────────

  const isAssessmentUnlocked = (_assessmentType: string) => true; // TESTING: All unlocked

  const getAssessmentIcon = (assessmentType: string) => {
    switch (assessmentType) {
      case 'inspiration': return Play;
      case 'about_me': return User;
      case 'dreams': return Star;
      case 'school_learning': return BookOpen;
      case 'hobbies': return Target;
      case 'role_models': return Heart;
      case 'holland_code': return Activity;
      case 'career_guidance_tools': return Globe;
      default: return Activity;
    }
  };

  const getCompletionStatus = (assessmentType: string) => {
    switch (assessmentType) {
      case 'inspiration': return !!assessmentProgress?.completed_at;
      case 'about_me': return !!aboutMeProgress?.completed_at;
      case 'dreams': return !!dreamsProgress?.completed_at;
      case 'school_learning': return !!stateLearningProgress?.completed_at;
      case 'hobbies': return !!hobbiesProgress?.completed_at;
      case 'role_models': return !!roleModelsProgress?.completed_at;
      case 'holland_code': return !!hollandCodeProgress?.completed_at;
      case 'career_guidance_tools': return !!careerGuidanceToolsProgress?.completed_at;
      default: return false;
    }
  };

  const getAssessmentStatus = (assessmentType: string) => {
    const isUnlocked = isAssessmentUnlocked(assessmentType);
    const isCompleted = getCompletionStatus(assessmentType);
    if (isCompleted) return { status: 'completed', icon: CheckCircle, className: 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:shadow-lg transition-all duration-200 cursor-pointer', iconColor: 'text-green-600', textColor: 'text-green-800', descriptionColor: 'text-green-600' };
    if (isUnlocked) return { status: 'unlocked', icon: getAssessmentIcon(assessmentType), className: 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 hover:shadow-lg transition-all duration-200 cursor-pointer', iconColor: 'text-blue-600', textColor: 'text-blue-800', descriptionColor: 'text-blue-600' };
    return { status: 'locked', icon: Lock, className: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 opacity-60 cursor-not-allowed', iconColor: 'text-gray-400', textColor: 'text-gray-500', descriptionColor: 'text-gray-500' };
  };

  // First-time assessment triggers → redirect to career roadmap
  const ROADMAP_TRIGGERS: Record<string, string> = {
    'inspiration': 'beginning_9th',
    'hobbies': 'midterm_9th',
    'career_guidance_tools': 'end_9th',
  };

  const hasProgress = (assessmentType: string): boolean => {
    switch (assessmentType) {
      case 'inspiration': return !!assessmentProgress;
      case 'about_me': return !!aboutMeProgress;
      case 'dreams': return !!dreamsProgress;
      case 'school_learning': return !!stateLearningProgress;
      case 'hobbies': return !!hobbiesProgress;
      case 'role_models': return !!roleModelsProgress;
      case 'holland_code': return !!hollandCodeProgress;
      case 'career_guidance_tools': return !!careerGuidanceToolsProgress;
      default: return false;
    }
  };

  const startAssessment = (assessmentType: string) => {
    if (!isAssessmentUnlocked(assessmentType)) {
      toast({ title: resolvedLang === 'kn' ? "ಮೌಲ್ಯಮಾಪನ ಲಾಕ್ ಮಾಡಲಾಗಿದೆ" : resolvedLang === 'ta' ? "செயல் பூட்டப்பட்டுள்ளது" : resolvedLang === 'hi' ? "मूल्यांकन लॉक है" : "Assessment Locked", description: resolvedLang === 'kn' ? "ಇದನ್ನು ಅನ್ಲಾಕ್ ಮಾಡಲು ಹಿಂದಿನ ಮೌಲ್ಯಮಾಪನವನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ." : resolvedLang === 'ta' ? "இந்த செயலியைத் திறக்க முன் உள்ள செயலையை முடிக்கவும்." : resolvedLang === 'hi' ? "इसे अनलॉक करने के लिए पिछला मूल्यांकन पूरा करें।" : "Complete the previous assessment to unlock this one.", variant: "destructive" });
      return;
    }

    // First-time open: redirect to career roadmap to fill milestone first.
    // Guard on progressLoaded — hasProgress() is meaningless while queries are still running.
    const milestone = ROADMAP_TRIGGERS[assessmentType];
    if (progressLoaded && milestone && !hasProgress(assessmentType) && !roadmapRedirectedRef.current.has(assessmentType)) {
      roadmapRedirectedRef.current.add(assessmentType);
      sessionStorage.setItem('roadmap_redirected', JSON.stringify([...roadmapRedirectedRef.current]));
      navigate(`/student/career-roadmap?highlight=${milestone}`);
      return;
    }

    const qp = `?lang=${resolvedLang}`;
    const routes: Record<string, string> = {
      'inspiration': 'inspiration', 'about_me': 'about-me', 'dreams': 'dreams',
      'school_learning': 'school-learning', 'role_models': 'role-models', 'hobbies': 'hobbies',
      'holland_code': 'holland-code', 'career_guidance_tools': 'career-guidance-tools',
    };
    const route = routes[assessmentType];
    if (route) {
      const completed = getCompletionStatus(assessmentType);
      navigate(completed ? `/student/assessment/${route}${qp}&readonly=1` : `/student/assessment/${route}${qp}`);
    }
  };

  const getOverallProgress = () => {
    const completedAssessments = [inspirationCompleted, aboutMeCompleted, dreamsCompleted, stateLearningCompleted, hobbiesCompleted, roleModelsCompleted, hollandCodeCompleted, careerGuidanceToolsCompleted].filter(Boolean).length;
    return (completedAssessments / 8) * 100;
  };

  // ═══════════════════════════════════════════════════════════════════
  //  BUILD SUB-COMPONENT DATA
  // ═══════════════════════════════════════════════════════════════════

  const assessmentCards: AssessmentCardData[] = [
    { key: 'inspiration', number: 1, titleKey: 'assessment_inspiration', descriptionEn: 'Discover what inspires you', descriptionKn: 'ನಿಮ್ಮನ್ನು ಪ್ರೇರೇಪಿಸುವುವುದನ್ನು ಹುಡುಕಿ', descriptionTa: 'உங்களை ஊக்கப்படுத்தும் விஷயங்களை கண்டறியுங்கள்', descriptionHi: 'जानें कि आपको क्या प्रेरित करता है', assessmentStatus: getAssessmentStatus('inspiration'), isCompleted: getCompletionStatus('inspiration'), isUnlocked: isAssessmentUnlocked('inspiration'), hasProgress: !!assessmentProgress, hasSummary: true, summaryState: 'none' as SummaryState },
    { key: 'about_me', number: 2, titleKey: 'assessment_about_me', descriptionEn: 'Reflect about yourself and your strengths', descriptionKn: 'ನಿಮ್ಮ ಬಗ್ಗೆ ಮತ್ತು ನಿಮ್ಮ ಬಲಗಳನ್ನು ಆಲೋಚಿಸಿ', descriptionTa: 'உங்களைப் பற்றியும் உங்கள் பலங்களைப் பற்றியும் சிந்தியுங்கள்', descriptionHi: 'अपने बारे में और अपनी ताकतों पर विचार करें', assessmentStatus: getAssessmentStatus('about_me'), isCompleted: getCompletionStatus('about_me'), isUnlocked: isAssessmentUnlocked('about_me'), hasProgress: hasProgress('about_me'), hasSummary: true, summaryState: 'none' as SummaryState },
    { key: 'dreams', number: 3, titleKey: 'assessment_dreams', descriptionEn: 'Explore your future aspirations', descriptionKn: 'ನಿಮ್ಮ ಭವಿಷ್ಯದ ಆಸೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ', descriptionTa: 'உங்கள் எதிர்கால கனவுகள் மற்றும் இலக்குகளை ஆராயுங்கள்', descriptionHi: 'अपने भविष्य की आकांक्षाओं को जानें', assessmentStatus: getAssessmentStatus('dreams'), isCompleted: getCompletionStatus('dreams'), isUnlocked: isAssessmentUnlocked('dreams'), hasProgress: hasProgress('dreams'), hasSummary: true, summaryState: 'none' as SummaryState },
    { key: 'school_learning', number: 4, titleKey: 'assessment_school_learning', descriptionEn: 'Reflect on your learning journey', descriptionKn: 'ನಿಮ್ಮ ಕಲಿಕೆಯ ಪ್ರಯಾಣದ ಬಗ್ಗೆ ಚಿಂತಿಸಿರಿ', descriptionTa: 'உங்கள் கற்றல் பயணத்தை பற்றிச் சிந்தியுங்கள்', descriptionHi: 'अपनी सीखने की यात्रा पर विचार करें', assessmentStatus: getAssessmentStatus('school_learning'), isCompleted: getCompletionStatus('school_learning'), isUnlocked: isAssessmentUnlocked('school_learning'), hasProgress: hasProgress('school_learning'), hasSummary: true, summaryState: 'none' as SummaryState },
    { key: 'hobbies', number: 5, titleKey: 'assessment_hobbies', descriptionEn: 'Discover career paths from your interests', descriptionKn: 'ನಿಮ್ಮ ಆಸಕ್ತಿಗಳಿಂದ ವೃತ್ತಿ ಮಾರ್ಗಗಳನ್ನು ಅನ್ವೇಷಿಸಿ', descriptionTa: 'உங்கள் ஆர்வங்களிலிருந்து தொழில் பாதைகளை அறியுங்கள்', descriptionHi: 'अपनी रुचियों से करियर पथ खोजें', assessmentStatus: getAssessmentStatus('hobbies'), isCompleted: getCompletionStatus('hobbies'), isUnlocked: isAssessmentUnlocked('hobbies'), hasProgress: hasProgress('hobbies'), hasSummary: true, summaryState: 'none' as SummaryState },
    { key: 'role_models', number: 6, titleKey: 'assessment_role_models', descriptionEn: 'Identify your inspiring role models', descriptionKn: 'ನಿಮ್ಮನ್ನು ಪ್ರೇರೇಪಿಸುವ ಮಾದರಿಗಳನ್ನು ಗುರುತಿಸಿ', descriptionTa: 'உங்களை ஊக்கப்படுத்தும் முன்னுதாரணங்களை கண்டறியுங்கள்', descriptionHi: 'अपने प्रेरणादायक आदर्शों को पहचानें', assessmentStatus: getAssessmentStatus('role_models'), isCompleted: getCompletionStatus('role_models'), isUnlocked: isAssessmentUnlocked('role_models'), hasProgress: hasProgress('role_models'), hasSummary: true, summaryState: 'none' as SummaryState },
    { key: 'holland_code', number: 7, titleKey: 'assessment_holland_code', descriptionEn: 'Identify your personality type', descriptionKn: 'ನಿಮ್ಮ ವ್ಯಕ್ತಿತ್ವದ ಪ್ರಕಾರವನ್ನು ಗುರುತಿಸಿ', descriptionTa: 'உங்கள் நற்பண்பு வகையை அறியுங்கள்', descriptionHi: 'अपने व्यक्तित्व का प्रकार पहचानें', assessmentStatus: getAssessmentStatus('holland_code'), isCompleted: getCompletionStatus('holland_code'), isUnlocked: isAssessmentUnlocked('holland_code'), hasProgress: hasProgress('holland_code'), hasSummary: false, summaryState: 'none' as SummaryState },
    { key: 'career_guidance_tools', number: 8, titleKey: 'assessment_career_guidance', descriptionEn: 'Explore career guidance tools and resources', descriptionKn: 'ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನ ಸಾಧನಗಳನ್ನು ಅನ್ವೇಷಿಸಿ', descriptionTa: 'தொழில் வழிகாட்டல் கருவிகள் மற்றும் ஆதாரங்களை ஆராயுங்கள்', descriptionHi: 'करियर मार्गदर्शन उपकरणों और संसाधनों की खोज करें', assessmentStatus: getAssessmentStatus('career_guidance_tools'), isCompleted: getCompletionStatus('career_guidance_tools'), isUnlocked: isAssessmentUnlocked('career_guidance_tools'), hasProgress: hasProgress('career_guidance_tools'), hasSummary: false, summaryState: 'none' as SummaryState },
  ];

  // ═══════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50" lang={resolvedLang} dir="auto">
      <StudentDashboardHeader
        userProfile={userProfile}
        t={t}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
      />

      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8 px-2">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2 md:mb-4">{t('welcome_title')}</h1>
          <p className="mt-2 md:mt-4 text-sm md:text-base text-gray-700 max-w-4xl mx-auto leading-relaxed">{t('welcome_body')}</p>
        </div>

        {/* Overall Progress */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{t('progress_title')}</h2>
              {!progressLoaded
                ? <Skeleton className="h-6 w-24 rounded-full" />
                : <Badge variant="secondary">{Math.round(getOverallProgress())}% {t('complete_suffix')}</Badge>
              }
            </div>
            {!progressLoaded
              ? <Skeleton className="h-3 w-full rounded" />
              : <Progress value={getOverallProgress()} className="h-3" />
            }
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>8 {t('assessments_total')}</span>
              {!progressLoaded
                ? <Skeleton className="h-4 w-16 rounded" />
                : <span>{Math.round(getOverallProgress())}% {t('complete_suffix')}</span>
              }
            </div>
          </CardContent>
        </Card>

        {/* Assessment Cards */}
        {!progressLoaded ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-white p-6 space-y-3">
                <Skeleton className="h-12 w-12 rounded-full mx-auto" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6 mx-auto" />
                <Skeleton className="h-6 w-20 mx-auto rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <AssessmentGrid
            cards={assessmentCards}
            resolvedLang={resolvedLang}
            t={t}
            onStartAssessment={startAssessment}
            onViewSummary={handleViewSummary}
          />
        )}

        {/* Career Spotlight + Chat */}
        <CareerChatSection
          resolvedLang={resolvedLang}
          t={t}
          ccMessages={ccMessages}
          ccInput={ccInput}
          setCcInput={setCcInput}
          ccCanSend={ccCanSend}
          ccLoading={ccLoading}
          onSend={handleCareerChatSend}
          ccListRef={ccListRef as any}
        />
      </div>

      <ChatBubble role="student" isOpen={isChatOpen} onOpenChange={setIsChatOpen} hideTrigger={true} />
      <ProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
      {/* SummaryViewDialog removed from student flow — AI summary disabled */}
      <LanguageSelectionDialog open={langPromptOpen} onOpenChange={setLangPromptOpen} />
      <IlpFooter />
    </div>
  );
}