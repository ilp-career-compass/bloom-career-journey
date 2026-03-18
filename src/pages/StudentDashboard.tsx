import { logger } from '@/lib/logger';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Zap, Activity, Sparkles, School, Users, Palette, Lock, CheckCircle,
  Play, Star, BookOpen, Heart, Target, User, Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProfileDialog from '@/components/ProfileDialog';
import ChatBubble from '@/components/chat/ChatBubble';
import SummaryViewDialog from '@/components/assessments/SummaryViewDialog';
import { AssessmentSummary } from '@/types/assessmentSummary';
import { summaryDatabaseService } from '@/services/summaryDatabaseService';
import { IndicKeyboard } from '@/components/ui/IndicKeyboard';
import { useLang } from '@/hooks/useLang';
import { aiChatService } from '@/services/aiChatService';
import LanguageSelectionDialog from '@/components/LanguageSelectionDialog';

// Sub-components
import { useStudentStrings, StudentLang } from '@/components/student/studentStrings';
import StudentDashboardHeader from '@/components/student/StudentDashboardHeader';
import AssessmentGrid, { AssessmentCardData, SummaryState } from '@/components/student/AssessmentGrid';
import ProgressSection, { ProgressRowData } from '@/components/student/ProgressSection';
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

  // ── CareerChat LM ─────────────────────────────────────────────────
  type ChatMsg = { id: string; role: 'user' | 'model'; text: string };
  const [ccMessages, setCcMessages] = useState<ChatMsg[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [ccLoading, setCcLoading] = useState(false);
  const ccListRef = useRef<HTMLDivElement | null>(null);
  const ccCanSend = useMemo(() => !!ccInput.trim() && !ccLoading, [ccInput, ccLoading]);

  const ccScrollToBottom = () => {
    requestAnimationFrame(() => {
      ccListRef.current?.scrollTo({ top: ccListRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  const handleCareerChatSend = async () => {
    if (!ccCanSend) return;
    const content = ccInput.trim();
    setCcInput('');
    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: 'user', text: content };
    const newMessages = [...ccMessages, userMsg];
    setCcMessages(newMessages);
    ccScrollToBottom();
    setCcLoading(true);
    try {
      const history = ccMessages.map(m => ({ id: m.id, role: m.role, text: m.text }));
      const response = await aiChatService.sendMessage(history, content);
      if (response.success && response.text) {
        setCcMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: response.text! }]);
      } else {
        throw new Error(response.error || 'Unknown error');
      }
      ccScrollToBottom();
    } catch (err: any) {
      setCcMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'model',
        text: `I'm having trouble connecting right now. (${err.message || 'Network error'}). Please try again later.`
      }]);
    } finally { setCcLoading(false); }
  };

  // ── Summary state ─────────────────────────────────────────────────
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [summaryType, setSummaryType] = useState<'inspiration' | 'about_me' | 'dreams' | 'school_learning' | 'hobbies' | 'role_models' | null>(null);
  const [inspirationSummary, setInspirationSummary] = useState<AssessmentSummary | null>(null);
  const [aboutMeSummary, setAboutMeSummary] = useState<AssessmentSummary | null>(null);
  const [dreamsSummary, setDreamsSummary] = useState<AssessmentSummary | null>(null);
  const [schoolLearningSummary, setSchoolLearningSummary] = useState<AssessmentSummary | null>(null);
  const [hobbiesSummary, setHobbiesSummary] = useState<AssessmentSummary | null>(null);
  const [roleModelsSummary, setRoleModelsSummary] = useState<AssessmentSummary | null>(null);
  const [assessmentResponseId, setAssessmentResponseId] = useState<string | null>(null);
  const [aboutMeAssessmentResponseId, setAboutMeAssessmentResponseId] = useState<string | null>(null);
  const [dreamsAssessmentResponseId, setDreamsAssessmentResponseId] = useState<string | null>(null);
  const [schoolLearningAssessmentResponseId, setSchoolLearningAssessmentResponseId] = useState<string | null>(null);
  const [hobbiesAssessmentResponseId, setHobbiesAssessmentResponseId] = useState<string | null>(null);
  const [roleModelsAssessmentResponseId, setRoleModelsAssessmentResponseId] = useState<string | null>(null);
  const [summaryNotified, setSummaryNotified] = useState(false);

  // ── Language prompt ───────────────────────────────────────────────
  const [langPromptOpen, setLangPromptOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (userProfile?.role === 'student' && userProfile?.has_selected_language === false) {
      logger.log('Language prompt disabled via code');
    }
  }, [userProfile?.role, userProfile?.has_selected_language]);

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
        title: resolvedLang === 'kn' ? "ಲಾಗ್ ಔಟ್ ಮಾಡಲಾಗಿದೆ" : resolvedLang === 'ta' ? "வெளியேறப்பட்டது" : "Logged Out",
        description: resolvedLang === 'kn' ? "ನೀವು ಯಶಸ್ವಿಯಾಗಿ ಲಾಗ್ ಔಟ್ ಮಾಡಲಾಗಿದೆ." : resolvedLang === 'ta' ? "நீங்கள் வெற்றிகரமாக வெளியேறியுள்ளீர்கள்." : "You have been successfully logged out.",
      });
    } catch (error) { logger.error('Logout error:', error); }
  };

  const getStudentId = async () => {
    if (!userProfile) return null;
    if (userProfile.studentProfile?.id) return userProfile.studentProfile.id;
    const { data } = await supabase.from('students').select('id').eq('user_id', userProfile.id).maybeSingle();
    return data?.id || null;
  };

  // ── Summary fetching ──────────────────────────────────────────────

  const fetchInspirationSummary = useCallback(async (rid: string) => {
    if (!userProfile?.id || !rid) return;
    try {
      const result = await summaryDatabaseService.getSummaryByAssessment(rid, userProfile.id);
      if (result.success && result.summary) setInspirationSummary(result.summary);
      else setInspirationSummary(null);
    } catch (error) { logger.error('Error fetching Inspiration summary:', error); setInspirationSummary(null); }
  }, [userProfile?.id]);

  const fetchAboutMeSummary = useCallback(async (rid: string) => {
    if (!userProfile?.id) return;
    try {
      const result = await summaryDatabaseService.getSummaryByAssessment(rid, userProfile.id);
      if (result.success && result.summary) setAboutMeSummary(result.summary);
      else setAboutMeSummary(null);
    } catch (error) { logger.error('Error fetching About Me summary:', error); }
  }, [userProfile?.id]);

  const fetchSummary = useCallback(async (rid: string, assessmentType: string) => {
    if (!userProfile?.id) return;
    try {
      const result = await summaryDatabaseService.getSummaryByAssessment(rid, userProfile.id);
      if (result.success && result.summary) {
        switch (assessmentType) {
          case 'inspiration': setInspirationSummary(result.summary); break;
          case 'about_me': setAboutMeSummary(result.summary); break;
          case 'dreams': setDreamsSummary(result.summary); break;
          case 'school_learning': setSchoolLearningSummary(result.summary); break;
          case 'hobbies': setHobbiesSummary(result.summary); break;
          case 'role_models': setRoleModelsSummary(result.summary); break;
        }
      }
    } catch (error) { logger.error(`Error fetching ${assessmentType} summary:`, error); }
  }, [userProfile?.id]);

  const handleViewSummary = (type: 'inspiration' | 'about_me' | 'dreams' | 'school_learning' | 'hobbies' | 'role_models') => {
    setSummaryType(type);
    setSummaryDialogOpen(true);
  };

  const handleSummaryUpdated = () => {
    if (summaryType === 'inspiration' && assessmentResponseId) fetchInspirationSummary(assessmentResponseId);
    else if (summaryType === 'about_me' && aboutMeAssessmentResponseId) fetchAboutMeSummary(aboutMeAssessmentResponseId);
    else if (summaryType === 'dreams' && dreamsAssessmentResponseId) fetchSummary(dreamsAssessmentResponseId, 'dreams');
    else if (summaryType === 'school_learning' && schoolLearningAssessmentResponseId) fetchSummary(schoolLearningAssessmentResponseId, 'school_learning');
    else if (summaryType === 'hobbies' && hobbiesAssessmentResponseId) fetchSummary(hobbiesAssessmentResponseId, 'hobbies');
    else if (summaryType === 'role_models' && roleModelsAssessmentResponseId) fetchSummary(roleModelsAssessmentResponseId, 'role_models');
  };

  // ── Progress checking ─────────────────────────────────────────────

  const checkAssessmentProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;
    try {
      const { data, error } = await supabase.from('assessment_responses').select('*')
        .eq('student_id', studentId).eq('assessment_type', 'inspiration').eq('assessment_title', 'My Inspiration')
        .order('completed_at', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (data && !error) { setAssessmentProgress(data); setAssessmentResponseId(data.id); fetchInspirationSummary(data.id); }
    } catch { }
  };

  const checkAboutMeProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;
    try {
      const { data, error } = await supabase.from('assessment_responses').select('*')
        .eq('student_id', studentId).eq('assessment_type', 'about_me').eq('assessment_title', 'About Me')
        .order('completed_at', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (data && !error) { setAboutMeProgress(data); setAboutMeAssessmentResponseId(data.id); fetchAboutMeSummary(data.id); }
    } catch { }
  };

  const checkDreamsProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;
    try {
      const { data, error } = await supabase.from('assessment_responses').select('*')
        .eq('student_id', studentId).eq('assessment_type', 'dreams').eq('assessment_title', 'My Dreams')
        .order('completed_at', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (data && !error) { setDreamsProgress(data); setDreamsAssessmentResponseId(data.id); fetchSummary(data.id, 'dreams'); }
    } catch { }
  };

  const checkSchoolLearningProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;
    try {
      const { data, error } = await supabase.from('assessment_responses').select('*')
        .eq('student_id', studentId).eq('assessment_type', 'school_learning').eq('assessment_title', 'My School, My Learning and I')
        .order('completed_at', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (data && !error) { setSchoolLearningProgress(data); setSchoolLearningAssessmentResponseId(data.id); fetchSummary(data.id, 'school_learning'); }
    } catch { }
  };

  const checkRoleModelsProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;
    try {
      const { data, error } = await supabase.from('assessment_responses').select('*')
        .eq('student_id', studentId).eq('assessment_type', 'role_models').eq('assessment_title', 'My Role Models')
        .order('updated_at', { ascending: false }).limit(5);
      if (data && !error && data.length > 0) {
        const completedRecord = data.find(r => r.completed_at);
        const activeRecord = completedRecord || data[0];
        setRoleModelsProgress(activeRecord); setRoleModelsAssessmentResponseId(activeRecord.id); fetchSummary(activeRecord.id, 'role_models');
      }
    } catch { }
  };

  const checkHobbiesProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;
    try {
      const { data, error } = await supabase.from('assessment_responses').select('*')
        .eq('student_id', studentId).eq('assessment_type', 'hobbies').eq('assessment_title', 'My Talents and Hobbies')
        .not('completed_at', 'is', null).order('completed_at', { ascending: false }).limit(1).maybeSingle();
      if (data && !error) { setHobbiesProgress(data); setHobbiesAssessmentResponseId(data.id); fetchSummary(data.id, 'hobbies'); }
    } catch { }
  };

  const checkHollandCodeProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;
    try {
      const { data, error } = await supabase.from('assessment_responses').select('*')
        .eq('student_id', studentId).eq('assessment_type', 'personality').eq('assessment_title', 'Holland Code (RIASEC) Test')
        .order('updated_at', { ascending: false }).limit(5);
      if (data && !error && data.length > 0) {
        const completedRecord = data.find(r => r.completed_at);
        setHollandCodeProgress(completedRecord || data[0]);
      }
    } catch { }
  };

  const checkCareerGuidanceToolsProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;
    try {
      const { data, error } = await supabase.from('assessment_responses').select('*')
        .eq('student_id', studentId).eq('assessment_type', 'career_guidance_tools').eq('assessment_title', 'Exploring Career Guidance Tools')
        .order('updated_at', { ascending: false }).limit(1).maybeSingle();
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
    fetchData();
    checkAssessmentProgress();
    checkAboutMeProgress();
    checkDreamsProgress();
    checkSchoolLearningProgress();
    checkHobbiesProgress();
    checkRoleModelsProgress();
    checkHollandCodeProgress();
    checkCareerGuidanceToolsProgress();
  }, [userProfile?.id]);

  // Real-time subscription
  useEffect(() => {
    if (!userProfile?.id) return;
    const channel = supabase
      .channel(`summary-status-updates-${userProfile.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'assessment_summaries', filter: `student_user_id=eq.${userProfile.id}` },
        async (payload) => {
          const updatedSummary = payload.new as any;
          const targetId = updatedSummary.assessment_response_id as string | null;
          if (targetId) {
            const { data } = await supabase.from('assessment_responses').select('assessment_type').eq('id', targetId).maybeSingle();
            if (data) {
              const at = data.assessment_type;
              if (at === 'inspiration') { setInspirationSummary(null); await new Promise(r => setTimeout(r, 100)); await fetchInspirationSummary(targetId); }
              else if (at === 'about_me') { setAboutMeSummary(null); await new Promise(r => setTimeout(r, 100)); await fetchAboutMeSummary(targetId); }
              else if (at === 'dreams') { setDreamsSummary(null); await new Promise(r => setTimeout(r, 100)); await fetchSummary(targetId, 'dreams'); }
              else if (at === 'school_learning') { setSchoolLearningSummary(null); await new Promise(r => setTimeout(r, 100)); await fetchSummary(targetId, 'school_learning'); }
              else if (at === 'hobbies') { setHobbiesSummary(null); await new Promise(r => setTimeout(r, 100)); await fetchSummary(targetId, 'hobbies'); }
              else if (at === 'role_models') { setRoleModelsSummary(null); await new Promise(r => setTimeout(r, 100)); await fetchSummary(targetId, 'role_models'); }
              else if (at === 'personality') checkHollandCodeProgress();
            }
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id, assessmentResponseId, aboutMeAssessmentResponseId, dreamsAssessmentResponseId, schoolLearningAssessmentResponseId, hobbiesAssessmentResponseId, roleModelsAssessmentResponseId, fetchInspirationSummary, fetchAboutMeSummary, fetchSummary]);

  useEffect(() => {
    if (assessmentResponseId && userProfile?.id) fetchInspirationSummary(assessmentResponseId);
  }, [assessmentResponseId, userProfile?.id, fetchInspirationSummary]);

  useEffect(() => {
    if (aboutMeAssessmentResponseId && userProfile?.id) fetchAboutMeSummary(aboutMeAssessmentResponseId);
  }, [aboutMeAssessmentResponseId, userProfile?.id, fetchAboutMeSummary]);

  // Periodic refresh
  useEffect(() => {
    if (!userProfile?.id) return;
    const refreshSummaries = async () => {
      if (assessmentResponseId) await fetchInspirationSummary(assessmentResponseId);
      if (aboutMeAssessmentResponseId) await fetchAboutMeSummary(aboutMeAssessmentResponseId);
      if (dreamsAssessmentResponseId) await fetchSummary(dreamsAssessmentResponseId, 'dreams');
      if (schoolLearningAssessmentResponseId) await fetchSummary(schoolLearningAssessmentResponseId, 'school_learning');
      if (hobbiesAssessmentResponseId) await fetchSummary(hobbiesAssessmentResponseId, 'hobbies');
      if (roleModelsAssessmentResponseId) await fetchSummary(roleModelsAssessmentResponseId, 'role_models');
    };
    const interval = setInterval(refreshSummaries, 10000);
    const handleFocus = () => refreshSummaries();
    const handleVisibilityChange = () => { if (!document.hidden) refreshSummaries(); };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => { clearInterval(interval); window.removeEventListener('focus', handleFocus); document.removeEventListener('visibilitychange', handleVisibilityChange); };
  }, [userProfile?.id, assessmentResponseId, aboutMeAssessmentResponseId, dreamsAssessmentResponseId, schoolLearningAssessmentResponseId, hobbiesAssessmentResponseId, roleModelsAssessmentResponseId, fetchInspirationSummary, fetchAboutMeSummary, fetchSummary]);

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

  // ── Auto-open summary from URL params (e.g. from Profile Card click) ──
  const autoOpenHandled = useRef(false);
  useEffect(() => {
    if (autoOpenHandled.current) return;
    const assessment = searchParams.get('assessment');
    const tab = searchParams.get('tab');
    if (!assessment || tab !== 'summary') return;

    const validTypes = ['inspiration', 'about_me', 'dreams', 'school_learning', 'hobbies', 'role_models'] as const;
    type ValidType = typeof validTypes[number];
    if (!validTypes.includes(assessment as ValidType)) return;

    const summaryMap: Record<string, AssessmentSummary | null> = {
      inspiration: inspirationSummary,
      about_me: aboutMeSummary,
      dreams: dreamsSummary,
      school_learning: schoolLearningSummary,
      hobbies: hobbiesSummary,
      role_models: roleModelsSummary,
    };

    const summary = summaryMap[assessment];
    if (summary) {
      autoOpenHandled.current = true;
      setSummaryType(assessment as ValidType);
      setSummaryDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, inspirationSummary, aboutMeSummary, dreamsSummary, schoolLearningSummary, hobbiesSummary, roleModelsSummary]);

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

  const startAssessment = (assessmentType: string) => {
    if (!isAssessmentUnlocked(assessmentType)) {
      toast({ title: resolvedLang === 'kn' ? "ಮೌಲ್ಯಮಾಪನ ಲಾಕ್ ಮಾಡಲಾಗಿದೆ" : resolvedLang === 'ta' ? "செயல் பூட்டப்பட்டுள்ளது" : "Assessment Locked", description: resolvedLang === 'kn' ? "ಇದನ್ನು ಅನ್ಲಾಕ್ ಮಾಡಲು ಹಿಂದಿನ ಮೌಲ್ಯಮಾಪನವನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ." : resolvedLang === 'ta' ? "இந்த செயலியைத் திறக்க முன் உள்ள செயலையை முடிக்கவும்." : "Complete the previous assessment to unlock this one.", variant: "destructive" });
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

  const getSummaryState = (summary: AssessmentSummary | null): SummaryState => {
    if (!summary) return 'none';
    return summary.approval_status === 'approved' ? 'approved' : 'pending';
  };

  const assessmentCards: AssessmentCardData[] = [
    { key: 'inspiration', number: 1, titleKey: 'assessment_inspiration', descriptionEn: 'Discover what inspires you', descriptionKn: 'ನಿಮ್ಮನ್ನು ಪ್ರೇರೇಪಿಸುವುವುದನ್ನು ಹುಡುಕಿ', descriptionTa: 'உங்களை ஊக்கப்படுத்தும் விஷயங்களை கண்டறியுங்கள்', assessmentStatus: getAssessmentStatus('inspiration'), isCompleted: getCompletionStatus('inspiration'), isUnlocked: isAssessmentUnlocked('inspiration'), hasProgress: !!assessmentProgress, summaryState: getSummaryState(inspirationSummary) },
    { key: 'about_me', number: 2, titleKey: 'assessment_about_me', descriptionEn: 'Reflect about yourself and your strengths', descriptionKn: 'ನಿಮ್ಮ ಬಗ್ಗೆ ಮತ್ತು ನಿಮ್ಮ ಬಲಗಳನ್ನು ಆಲೋಚಿಸಿ', descriptionTa: 'உங்களைப் பற்றியும் உங்கள் பலங்களைப் பற்றியும் சிந்தியுங்கள்', assessmentStatus: getAssessmentStatus('about_me'), isCompleted: getCompletionStatus('about_me'), isUnlocked: isAssessmentUnlocked('about_me'), hasProgress: false, summaryState: getSummaryState(aboutMeSummary) },
    { key: 'dreams', number: 3, titleKey: 'assessment_dreams', descriptionEn: 'Explore your future aspirations', descriptionKn: 'ನಿಮ್ಮ ಭವಿಷ್ಯದ ಆಸೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ', descriptionTa: 'உங்கள் எதிர்கால கனவுகள் மற்றும் இலக்குகளை ஆராயுங்கள்', assessmentStatus: getAssessmentStatus('dreams'), isCompleted: getCompletionStatus('dreams'), isUnlocked: isAssessmentUnlocked('dreams'), hasProgress: false, summaryState: getSummaryState(dreamsSummary) },
    { key: 'school_learning', number: 4, titleKey: 'assessment_school_learning', descriptionEn: 'Reflect on your learning journey', descriptionKn: 'ನಿಮ್ಮ ಕಲಿಕೆಯ ಪ್ರಯಾಣದ ಬಗ್ಗೆ ಚಿಂತಿಸಿರಿ', descriptionTa: 'உங்கள் கற்றல் பயணத்தை பற்றிச் சிந்தியுங்கள்', assessmentStatus: getAssessmentStatus('school_learning'), isCompleted: getCompletionStatus('school_learning'), isUnlocked: isAssessmentUnlocked('school_learning'), hasProgress: false, summaryState: getSummaryState(schoolLearningSummary) },
    { key: 'hobbies', number: 5, titleKey: 'assessment_hobbies', descriptionEn: 'Discover career paths from your interests', descriptionKn: 'ನಿಮ್ಮ ಆಸಕ್ತಿಗಳಿಂದ ವೃತ್ತಿ ಮಾರ್ಗಗಳನ್ನು ಅನ್ವೇಷಿಸಿ', descriptionTa: 'உங்கள் ஆர்வங்களிலிருந்து தொழில் பாதைகளை அறியுங்கள்', assessmentStatus: getAssessmentStatus('hobbies'), isCompleted: getCompletionStatus('hobbies'), isUnlocked: isAssessmentUnlocked('hobbies'), hasProgress: false, summaryState: getSummaryState(hobbiesSummary) },
    { key: 'role_models', number: 6, titleKey: 'assessment_role_models', descriptionEn: 'Identify your inspiring role models', descriptionKn: 'ನಿಮ್ಮನ್ನು ಪ್ರೇರೇಪಿಸುವ ಮಾದರಿಗಳನ್ನು ಗುರುತಿಸಿ', descriptionTa: 'உங்களை ஊக்கப்படுத்தும் முன்னுதாரணங்களை கண்டறியுங்கள்', assessmentStatus: getAssessmentStatus('role_models'), isCompleted: getCompletionStatus('role_models'), isUnlocked: isAssessmentUnlocked('role_models'), hasProgress: false, summaryState: getSummaryState(roleModelsSummary) },
    { key: 'holland_code', number: 7, titleKey: 'assessment_holland_code', descriptionEn: 'Identify your personality type', descriptionKn: 'ನಿಮ್ಮ ವ್ಯಕ್ತಿತ್ವದ ಪ್ರಕಾರವನ್ನು ಗುರುತಿಸಿ', descriptionTa: 'உங்கள் நற்பண்பு வகையை அறியுங்கள்', assessmentStatus: getAssessmentStatus('holland_code'), isCompleted: getCompletionStatus('holland_code'), isUnlocked: isAssessmentUnlocked('holland_code'), hasProgress: false, summaryState: 'none' as SummaryState },
    { key: 'career_guidance_tools', number: 8, titleKey: 'assessment_career_guidance', descriptionEn: 'Explore career guidance tools and resources', descriptionKn: 'ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನ ಸಾಧನಗಳನ್ನು ಅನ್ವೇಷಿಸಿ', descriptionTa: 'தொழில் வழிகாட்டல் கருவிகள் மற்றும் ஆதாரங்களை ஆராயுங்கள்', assessmentStatus: getAssessmentStatus('career_guidance_tools'), isCompleted: getCompletionStatus('career_guidance_tools'), isUnlocked: isAssessmentUnlocked('career_guidance_tools'), hasProgress: false, summaryState: 'none' as SummaryState },
  ];

  const progressRows: ProgressRowData[] = [
    { number: 1, titleKey: 'assessment_inspiration', assessmentType: 'inspiration', bgColor: 'bg-green-50', textColor: 'text-green-800', isCompleted: inspirationCompleted, previousCompleted: true },
    { number: 2, titleKey: 'assessment_about_me', assessmentType: 'about_me', bgColor: 'bg-blue-50', textColor: 'text-blue-800', isCompleted: aboutMeCompleted, previousCompleted: inspirationCompleted },
    { number: 3, titleKey: 'assessment_dreams', assessmentType: 'dreams', bgColor: 'bg-blue-50', textColor: 'text-blue-800', isCompleted: dreamsCompleted, previousCompleted: aboutMeCompleted },
    { number: 4, titleKey: 'assessment_school_learning', assessmentType: 'school_learning', bgColor: 'bg-purple-50', textColor: 'text-purple-800', isCompleted: stateLearningCompleted, previousCompleted: dreamsCompleted },
    { number: 5, titleKey: 'assessment_hobbies', assessmentType: 'hobbies', bgColor: 'bg-orange-50', textColor: 'text-orange-800', isCompleted: hobbiesCompleted, previousCompleted: stateLearningCompleted },
    { number: 6, titleKey: 'assessment_role_models', assessmentType: 'role_models', bgColor: 'bg-pink-50', textColor: 'text-pink-800', isCompleted: roleModelsCompleted, previousCompleted: hobbiesCompleted },
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
              <Badge variant="secondary">{Math.round(getOverallProgress())}% {t('complete_suffix')}</Badge>
            </div>
            <Progress value={getOverallProgress()} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>8 {t('assessments_total')}</span>
              <span>{Math.round(getOverallProgress())}% {t('complete_suffix')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Cards */}
        <AssessmentGrid
          cards={assessmentCards}
          resolvedLang={resolvedLang}
          t={t}
          onStartAssessment={startAssessment}
          onViewSummary={handleViewSummary}
        />

        {/* Progress Summary */}
        <ProgressSection
          rows={progressRows}
          resolvedLang={resolvedLang}
          t={t}
          hollandCodeCompleted={hollandCodeCompleted}
          roleModelsCompleted={roleModelsCompleted}
          careerGuidanceToolsCompleted={careerGuidanceToolsCompleted}
          hollandCodeCompleted2={hollandCodeCompleted}
        />

        {/* Career Spotlight + Chat */}
        <CareerChatSection
          resolvedLang={resolvedLang}
          t={t}
          ccMessages={ccMessages as any}
          ccInput={ccInput}
          setCcInput={setCcInput}
          ccCanSend={ccCanSend}
          ccLoading={ccLoading}
          onSend={handleCareerChatSend}
          ccListRef={ccListRef as any}
        />
      </div>

      {(['kn', 'ta', 'hi'].includes(resolvedLang)) && <IndicKeyboard lang={resolvedLang} />}
      <ChatBubble role="student" isOpen={isChatOpen} onOpenChange={setIsChatOpen} hideTrigger={true} />
      <ProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
      <SummaryViewDialog
        open={summaryDialogOpen}
        onOpenChange={setSummaryDialogOpen}
        summary={
          summaryType === 'inspiration' ? inspirationSummary :
            summaryType === 'about_me' ? aboutMeSummary :
              summaryType === 'dreams' ? dreamsSummary :
                summaryType === 'school_learning' ? schoolLearningSummary :
                  summaryType === 'hobbies' ? hobbiesSummary :
                    summaryType === 'role_models' ? roleModelsSummary : null
        }
        studentUserId={userProfile?.id || ''}
        onSummaryUpdated={handleSummaryUpdated}
        assessmentType={summaryType || 'inspiration'}
      />
      <LanguageSelectionDialog open={langPromptOpen} onOpenChange={setLangPromptOpen} />
    </div>
  );
}