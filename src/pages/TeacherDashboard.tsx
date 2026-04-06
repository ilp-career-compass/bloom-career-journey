import { logger } from '@/lib/logger';
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { StateInfo, SchoolClass } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Activity, BookOpen } from 'lucide-react';

// Sub-components
import { useTeacherStrings, TeacherLang } from '@/components/teacher/teacherStrings';
import TeacherDashboardHeader from '@/components/teacher/TeacherDashboardHeader';
import TeacherStatsCards from '@/components/teacher/TeacherStatsCards';
import StudentsTab, { Student } from '@/components/teacher/StudentsTab';
import {
  AddStudentModal,
  StudentDetailsModal,
  ViewProgressModal,
  AssessmentAnswersModal,
  AddExistingStudentModal,
} from '@/components/teacher/StudentModals';
import AssessmentResponsesView from '@/components/teacher/AssessmentResponsesView';
import ResourcesSection from '@/components/teacher/ResourcesSection';
import ChatbotDialog from '@/components/ChatbotDialog';
import ChatBubble from '@/components/chat/ChatBubble';
import ContactIlpDialog from '@/components/ContactIlpDialog';
import ProfileDialog from '@/components/ProfileDialog';
import ImportStudentsDialog from '@/components/ImportStudentsDialog';
import IlpFooter from '@/components/IlpFooter';

interface StudentStats {
  totalStudents: number;
  activeStudents: number;
  recentAdditions: number;
}

export default function TeacherDashboard() {
  const { user, userProfile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Language ──────────────────────────────────────────────────────
  const urlLang = useMemo(() => new URLSearchParams(location.search).get('lang') as (TeacherLang | null), [location.search]);
  const lang: TeacherLang = (urlLang || userProfile?.preferred_language || (localStorage.getItem('lang') as TeacherLang | null) || 'en') as TeacherLang;
  useEffect(() => { try { localStorage.setItem('lang', lang); } catch { } }, [lang]);
  const { t, welcomeMessage } = useTeacherStrings(lang);

  // ── Student state ─────────────────────────────────────────────────
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats>({ totalStudents: 0, activeStudents: 0, recentAdditions: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // ── Add Student state ─────────────────────────────────────────────
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddExistingOpen, setIsAddExistingOpen] = useState(false);
  const teacherLang = userProfile?.preferred_language || 'en';
  const [newStudent, setNewStudent] = useState({ fullName: '', phone: '', grade: '', stateId: '', preferredLanguage: teacherLang });
  const [states, setStates] = useState<StateInfo[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [existingQuery, setExistingQuery] = useState('');
  const [existingResults, setExistingResults] = useState<any[]>([]);
  const [enrollTarget, setEnrollTarget] = useState<{ userId: string; name: string } | null>(null);
  const [enrollClassId, setEnrollClassId] = useState<string>('');
  const [isClassLocked, setIsClassLocked] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // ── Student detail/progress state ─────────────────────────────────
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isAnswersOpen, setIsAnswersOpen] = useState(false);
  const [progressSummary, setProgressSummary] = useState<{ [k: string]: { count: number; last?: string } }>({});
  const [activityTimeline, setActivityTimeline] = useState<Array<{ id: string; title: string; seq: number; status: string; completed_at?: string }>>([]);
  const [assessmentAnswers, setAssessmentAnswers] = useState<any[]>([]);

  // ── Reviews state ─────────────────────────────────────────────────
  const [reviewOverview, setReviewOverview] = useState<{ unreviewed_count: number; reviewed_count: number; needs_revision_count: number; flagged_count: number; followups_due_this_week: number }>({ unreviewed_count: 0, reviewed_count: 0, needs_revision_count: 0, flagged_count: 0, followups_due_this_week: 0 });
  const [studentReviewMap, setStudentReviewMap] = useState<Record<string, { reviewed: number; total: number }>>({});

  // ── Dialogs ───────────────────────────────────────────────────────
  const [contactOpen, setContactOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [teacherRow, setTeacherRow] = useState<{ id: string; state_id: string } | null>(null);

  // ═══════════════════════════════════════════════════════════════════
  //  DATA LOADING
  // ═══════════════════════════════════════════════════════════════════

  // Filter students
  useEffect(() => {
    let filtered = students;
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user?.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parent_guardian_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedGrade !== 'all') {
      filtered = filtered.filter(student => student.class?.name === selectedGrade);
    }
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(student => student.enrollment_status === selectedStatus);
    }
    setFilteredStudents(filtered);
  }, [students, searchTerm, selectedGrade, selectedStatus]);

  // Backup stats recalc
  useEffect(() => {
    if (students.length > 0) loadStudentStats(students);
  }, [students.length]);

  const loadStudentStats = async (studentsData?: any[]) => {
    try {
      const studentsToCount = studentsData || students;
      const totalStudents = studentsToCount.length;
      const activeStudents = studentsToCount.filter(s => (s.enrollment_status === 'active' || !s.enrollment_status)).length;
      const recentAdditions = studentsToCount.filter(s => {
        const dateToUse = s.enrollment_date || s.created_at;
        if (!dateToUse) return false;
        return (Date.now() - new Date(dateToUse).getTime()) / (1000 * 60 * 60 * 24) <= 7;
      }).length;
      logger.log('📊 Student stats calculated:', { totalStudents, activeStudents, recentAdditions });
      setStudentStats({ totalStudents, activeStudents, recentAdditions });
    } catch (error) {
      logger.error('Error loading stats:', error);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      let { data: teacherData, error: teacherError } = await supabase
        .from('teachers').select('id, state_id').eq('user_id', userProfile?.id).maybeSingle();
      if (teacherError) throw teacherError;

      if (!teacherData && userProfile?.state_id) {
        logger.log('⚠️ Teacher profile missing, attempting to create...');
        try {
          const { data: newTeacher, error: createError } = await supabase
            .from('teachers').insert({ user_id: userProfile.id, state_id: userProfile.state_id, is_active: true, joining_date: new Date().toISOString() })
            .select('id, state_id').single();
          if (!createError && newTeacher) { teacherData = newTeacher; logger.log('✅ Teacher profile auto-created'); }
          else logger.error('Failed to auto-create teacher profile:', createError);
        } catch (err) { logger.error('Error during teacher profile auto-creation:', err); }
      }

      if (!teacherData) { logger.warn('Could not load teacher profile'); setLoading(false); return; }

      const { data, error } = await supabase
        .from('students').select(`*, user:users(full_name, email, mobile, preferred_language), class:classes(name), teacher:teachers(users(full_name))`)
        .eq('teacher_id', teacherData.id).order('created_at', { ascending: false });
      if (error) throw error;
      setStudents(data || []);
      await loadStudentStats(data || []);
    } catch (error) {
      logger.error('Error loading students:', error);
      toast({ title: "Error", description: "Failed to load students. Please try again.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleAddStudent = async () => {
    try {
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers').select('id, state_id').eq('user_id', userProfile?.id).single();
      if (teacherError) throw teacherError;

      const { data: result, error: fnError } = await supabase.functions.invoke('create-student', {
        body: {
          students: [{
            fullName: newStudent.fullName,
            phone: newStudent.phone,
            grade: newStudent.grade,
            preferredLanguage: newStudent.preferredLanguage || teacherLang || 'en',
            teacherId: teacherData.id,
            stateId: teacherData.state_id,
          }],
          teacherUserId: userProfile?.id,
        },
      });

      if (fnError) throw new Error(fnError.message || 'Edge Function call failed');

      if (result.errors?.length > 0) {
        toast({ title: "Error", description: result.errors[0].reason, variant: "destructive" });
      }
      if (result.created?.length > 0) {
        const tempPassword = result.created[0].tempPassword; // TEMP: remove in PR 2b when OTP activation is implemented
        toast({ title: "Student Added!", description: `Student added. Temporary password: ${tempPassword}` });
        setIsAddStudentOpen(false);
        setNewStudent({ fullName: '', phone: '', grade: '', stateId: '', preferredLanguage: teacherLang });
        loadStudents();
      }
    } catch (error: any) {
      logger.error('Error adding student:', error);
      toast({ title: "Error", description: `Failed to add student: ${error.message}`, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) { logger.error('Logout error:', error); }
  };

  const loadStates = async () => {
    try {
      setLoadingStates(true);
      const { data: tableCheck, error: tableError } = await supabase.from('states').select('count').limit(1);
      if (tableError) {
        logger.error('TeacherDashboard: States table error:', tableError);
        setStates([
          { state_id: 'temp-1', state_name: 'ILP-Tamil Nadu', state_code: 'ILP-TN', org_name: 'ILP' },
          { state_id: 'temp-2', state_name: 'ILP-Karnataka', state_code: 'ILP-KA', org_name: 'ILP' },
          { state_id: 'temp-3', state_name: 'ILP-Andhra Pradesh', state_code: 'ILP-AP', org_name: 'ILP' },
          { state_id: 'temp-4', state_name: 'ILP-Telangana', state_code: 'ILP-TG', org_name: 'ILP' },
          { state_id: 'temp-5', state_name: 'ILP-Bihar', state_code: 'ILP-BH', org_name: 'ILP' },
          { state_id: 'temp-6', state_name: 'ILP-Jharkhand', state_code: 'ILP-JH', org_name: 'ILP' },
          { state_id: 'temp-7', state_name: 'ILP-Odisha', state_code: 'ILP-OD', org_name: 'ILP' },
        ]);
        return;
      }
      const { data, error } = await supabase.from('states').select('id, state_name, state_code, orgs(name)').order('state_name');
      if (error) throw error;
      setStates(data?.map(state => ({ state_id: state.id, state_name: state.state_name, state_code: state.state_code, org_name: state.orgs?.name || 'ILP' })) || []);
    } catch (error) {
      logger.error('TeacherDashboard: Error loading states:', error);
      setStates([]);
    } finally { setLoadingStates(false); }
  };

  const loadClasses = async (stateId: string) => {
    try {
      const { data: tableCheck, error: tableError } = await supabase.from('classes').select('count').limit(1);
      if (tableError) {
        setClasses([
          { class_id: 'temp-8', class_name: 'Class 8' },
          { class_id: 'temp-9', class_name: 'Class 9' },
          { class_id: 'temp-10', class_name: 'Class 10' },
          { class_id: 'temp-11', class_name: 'Class 11' },
          { class_id: 'temp-12', class_name: 'Class 12' },
        ]);
        return;
      }
      const { data, error } = await supabase.from('classes').select('id, name').eq('state_id', stateId).order('name');
      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      logger.error('TeacherDashboard: Error loading classes:', error);
      setClasses([]);
    }
  };

  const refreshReviewOverview = async () => {
    try {
      if (!userProfile?.id) return;
      const { data: teacherRecord } = await supabase.from('teachers').select('id').eq('user_id', userProfile.id).single();
      if (!teacherRecord) {
        setReviewOverview({ unreviewed_count: 0, reviewed_count: 0, needs_revision_count: 0, flagged_count: 0, followups_due_this_week: 0 });
        return;
      }
      const { data: studs } = await supabase.from('students').select('id').eq('teacher_id', teacherRecord.id);
      if (!studs || studs.length === 0) {
        setReviewOverview({ unreviewed_count: 0, reviewed_count: 0, needs_revision_count: 0, flagged_count: 0, followups_due_this_week: 0 });
        return;
      }
      const studentIds = studs.map(s => s.id);
      const { data: assessments } = await supabase.from('assessment_responses').select('id, student_id, assessment_type, assessment_title, review_status, completed_at').in('student_id', studentIds).order('completed_at', { ascending: false }).limit(500);
      if (!assessments) {
        setReviewOverview({ unreviewed_count: 0, reviewed_count: 0, needs_revision_count: 0, flagged_count: 0, followups_due_this_week: 0 });
        return;
      }
      const uniqueAssessments = new Map<string, typeof assessments[0]>();
      assessments.forEach(a => { const key = `${a.student_id}_${a.assessment_type}_${a.assessment_title}`; if (!uniqueAssessments.has(key)) uniqueAssessments.set(key, a); });
      const counts = { unreviewed_count: 0, reviewed_count: 0, needs_revision_count: 0, flagged_count: 0, followups_due_this_week: 0 };
      uniqueAssessments.forEach(a => {
        const status = a.review_status || 'unreviewed';
        if (status === 'reviewed') counts.reviewed_count++;
        else if (status === 'needs_revision') counts.needs_revision_count++;
        else if (status === 'flagged') counts.flagged_count++;
        else counts.unreviewed_count++;
      });
      setReviewOverview(counts);
      const perStudent: Record<string, { reviewed: number; total: number }> = {};
      uniqueAssessments.forEach(a => {
        if (!perStudent[a.student_id]) perStudent[a.student_id] = { reviewed: 0, total: 0 };
        perStudent[a.student_id].total++;
        if ((a.review_status || 'unreviewed') === 'reviewed') perStudent[a.student_id].reviewed++;
      });
      setStudentReviewMap(perStudent);
    } catch (err) { logger.error('Error refreshing review overview:', err); }
  };

  // ── Initial data load ─────────────────────────────────────────────
  useEffect(() => {
    if (!userProfile?.id) return;
    loadStudents();
    loadStates();
    supabase.from('teachers').select('id, state_id').eq('user_id', userProfile.id).maybeSingle()
      .then(({ data }) => setTeacherRow((data as any) || null));
    refreshReviewOverview();
  }, [userProfile]);

  useEffect(() => {
    if (newStudent.stateId) loadClasses(newStudent.stateId);
    else setClasses([]);
  }, [newStudent.stateId]);

  useEffect(() => {
    if (teacherRow?.state_id) loadClasses(teacherRow.state_id);
  }, [teacherRow?.state_id]);

  // ═══════════════════════════════════════════════════════════════════
  //  HANDLERS (for sub-components)
  // ═══════════════════════════════════════════════════════════════════

  const handleViewDetails = async (student: Student) => {
    setSelectedStudent(student);
    try {
      const order = [
        { key: 'inspiration', title: t('inspirationTitle'), seq: 1 },
        { key: 'about_me', title: t('aboutMeTitle'), seq: 2 },
        { key: 'dreams', title: 'MY DREAMS', seq: 3 },
        { key: 'school_learning', title: 'MY SCHOOL', seq: 4 },
        { key: 'hobbies', title: 'MY HOBBIES', seq: 5 },
        { key: 'role_models', title: 'MY ROLE MODELS', seq: 6 },
      ] as const;
      const { data: ar } = await supabase.from('assessment_responses').select('assessment_type, completed_at').eq('student_id', student.id);
      const latest: Record<string, string | undefined> = {};
      (ar || []).forEach((r: any) => { if (r.completed_at) { const prev = latest[r.assessment_type]; if (!prev || new Date(r.completed_at) > new Date(prev)) latest[r.assessment_type] = r.completed_at; } });
      const insp = !!latest['inspiration'], aboutMe = !!latest['about_me'], dreams = !!latest['dreams'], school = !!latest['school_learning'], hobbies = !!latest['hobbies'];
      const timeline = order.map(item => {
        let isCompleted = false;
        if (item.key === 'inspiration') isCompleted = insp;
        else if (item.key === 'about_me') isCompleted = aboutMe;
        else if (item.key === 'dreams') isCompleted = dreams;
        else if (item.key === 'school_learning') isCompleted = school;
        else if (item.key === 'hobbies') isCompleted = hobbies;
        else if (item.key === 'role_models') isCompleted = !!latest['role_models'];
        let status = 'locked';
        if (item.key === 'inspiration') status = isCompleted ? 'completed' : 'unlocked';
        else if (item.key === 'about_me') status = insp ? (isCompleted ? 'completed' : 'unlocked') : 'locked';
        else if (item.key === 'dreams') status = (insp && aboutMe) ? (isCompleted ? 'completed' : 'unlocked') : 'locked';
        else if (item.key === 'school_learning') status = (insp && aboutMe && dreams) ? (isCompleted ? 'completed' : 'unlocked') : 'locked';
        else if (item.key === 'hobbies') status = (insp && aboutMe && dreams && school) ? (isCompleted ? 'completed' : 'unlocked') : 'locked';
        else if (item.key === 'role_models') status = (insp && aboutMe && dreams && school && hobbies) ? (isCompleted ? 'completed' : 'unlocked') : 'locked';
        return { id: item.key, title: item.title, seq: item.seq, status, completed_at: latest[item.key] } as any;
      });
      setActivityTimeline(timeline);
    } catch (err) { logger.error('Timeline load error:', err); setActivityTimeline([]); }
    setIsDetailsOpen(true);
  };

  const handleViewProgress = async (student: Student) => {
    setSelectedStudent(student);
    try {
      const { data, error } = await supabase.from('assessment_responses').select('assessment_type, completed_at').eq('student_id', student.id);
      if (error) throw error;
      const summary: { [k: string]: { count: number; last?: string } } = {};
      (data || []).forEach((r: any) => {
        const t = r.assessment_type;
        if (!summary[t]) summary[t] = { count: 0, last: undefined };
        summary[t].count += 1;
        if (!summary[t].last || new Date(r.completed_at) > new Date(summary[t].last!)) summary[t].last = r.completed_at;
      });
      setProgressSummary(summary);
      setIsProgressOpen(true);
    } catch (err) {
      logger.error('Load progress error:', err);
      toast({ title: 'Failed to load progress', variant: 'destructive' });
    }
  };

  const handleUnenroll = async (student: Student) => {
    if (!confirm('Unenroll this student from your list?')) return;
    try {
      const { error } = await supabase.from('students').delete().eq('id', student.id);
      if (error) throw error;
      toast({ title: 'Student unenrolled', description: 'Student has been removed from your list.' });
      loadStudents();
    } catch (err) {
      logger.error('Unenroll error:', err);
      toast({ title: 'Unenroll failed', description: 'Could not remove student', variant: 'destructive' });
    }
  };

  const handleSearchExisting = async () => {
    try {
      const { data, error } = await supabase.rpc('search_students', { teacher_user_id: user?.id, query: existingQuery });
      if (error) throw error;
      setExistingResults(data || []);
    } catch (err) {
      logger.error('Search error:', err);
      toast({ title: 'Search failed', description: 'Could not search students', variant: 'destructive' });
    }
  };

  const handleEnrollExisting = async () => {
    try {
      setEnrolling(true);
      const { error } = await supabase.rpc('enroll_student_by_user_id', {
        teacher_user_id: user?.id, student_user_id: enrollTarget?.userId, class_id: enrollClassId || null,
      });
      if (error) throw error;
      toast({ title: 'Student enrolled', description: 'Student has been linked to you.' });
      setIsAddExistingOpen(false);
      setEnrollTarget(null);
      loadStudents();
    } catch (err) {
      logger.error('Enroll error:', err);
      toast({ title: 'Enrollment failed', description: 'Could not enroll student', variant: 'destructive' });
    } finally { setEnrolling(false); }
  };

  const renderReadableAnswers = (assessmentType: string, responses: any) => {
    if (!responses || typeof responses !== 'object') {
      return <div className="text-sm text-gray-500">No responses available.</div>;
    }
    if (assessmentType === 'about_me') {
      return (
        <div className="space-y-4">
          {Object.entries(responses).map(([fieldKey, value]: [string, any]) => {
            if (!value || (Array.isArray(value) && value.every(v => !v || v.trim() === '')) || (typeof value === 'string' && value.trim() === '')) return null;
            return (
              <div key={fieldKey} className="border-b border-gray-200 pb-3 last:border-b-0">
                <div className="font-medium text-sm text-gray-700 mb-1 capitalize">{fieldKey.replace(/_/g, ' ')}</div>
                <div className="text-sm text-gray-900 whitespace-pre-wrap break-words pl-2">
                  {Array.isArray(value) ? (
                    <ul className="list-disc list-inside space-y-1">
                      {value.map((item: string, idx: number) => (item && item.trim() ? <li key={idx}>{item}</li> : null))}
                    </ul>
                  ) : (<div>{String(value)}</div>)}
                </div>
              </div>
            );
          })}
          {Object.keys(responses).length === 0 && (<div className="text-sm text-gray-500">No responses submitted yet.</div>)}
        </div>
      );
    }
    return (
      <pre className="text-xs whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-md border">
        {JSON.stringify(responses, null, 2)}
      </pre>
    );
  };

  // ═══════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-green-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <TeacherDashboardHeader
        userProfile={userProfile}
        t={t}
        onLogout={handleLogout}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenContact={() => setContactOpen(true)}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8 px-2">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2 md:mb-4">{welcomeMessage(userProfile?.full_name || '')}</h1>
          <p className="text-base md:text-xl text-gray-600 leading-relaxed">{t('manageStudents')}</p>
        </div>

        <TeacherStatsCards studentStats={studentStats} reviewOverview={reviewOverview} t={t} />

        {/* Main Content Tabs */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-white shadow-sm h-auto p-1">
            <TabsTrigger value="students" className="flex items-center space-x-2 py-2">
              <Users className="w-4 h-4" /><span>{t('studentsTab')}</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center space-x-2 py-2">
              <Activity className="w-4 h-4" /><span>{t('reviewsTab')}</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center space-x-2 py-2">
              <BookOpen className="w-4 h-4" /><span>{t('resourcesTab')}</span>
            </TabsTrigger>
            {/* Analytics tab hidden — placeholder, not functional yet */}
          </TabsList>

          <TabsContent value="students" className="space-y-6">
            <StudentsTab
              students={students}
              filteredStudents={filteredStudents}
              studentReviewMap={studentReviewMap}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedGrade={selectedGrade}
              setSelectedGrade={setSelectedGrade}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              t={t}
              onAddStudent={() => setIsAddStudentOpen(true)}
              onAddExisting={() => setIsAddExistingOpen(true)}
              onImportCsv={() => setImportOpen(true)}
              onViewDetails={handleViewDetails}
              onViewProgress={handleViewProgress}
              onUnenroll={handleUnenroll}
              loadStudents={loadStudents}
            />
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <AssessmentResponsesView onReviewUpdate={refreshReviewOverview} />
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <ResourcesSection />
          </TabsContent>

          {/* Analytics content hidden — placeholder, not functional yet */}
        </Tabs>
      </div>

      {/* Dialogs & Modals */}
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      {teacherRow && (
        <ImportStudentsDialog
          open={importOpen} onOpenChange={setImportOpen}
          classes={classes} teacherId={teacherRow.id} stateId={teacherRow.state_id} onImported={loadStudents}
        />
      )}
      <ChatbotDialog open={false} onOpenChange={() => { }} />
      <ContactIlpDialog open={contactOpen} onOpenChange={setContactOpen} />
      <ChatBubble role="teacher" />

      <AddStudentModal
        open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}
        newStudent={newStudent} setNewStudent={setNewStudent as any} onSubmit={handleAddStudent}
      />
      <StudentDetailsModal
        open={isDetailsOpen} onOpenChange={setIsDetailsOpen}
        selectedStudent={selectedStudent} activityTimeline={activityTimeline}
      />
      <ViewProgressModal
        open={isProgressOpen} onOpenChange={setIsProgressOpen}
        selectedStudent={selectedStudent} progressSummary={progressSummary}
      />
      <AssessmentAnswersModal
        open={isAnswersOpen} onOpenChange={setIsAnswersOpen}
        selectedStudent={selectedStudent} assessmentAnswers={assessmentAnswers}
        renderReadableAnswers={renderReadableAnswers}
      />
      <AddExistingStudentModal
        open={isAddExistingOpen} onOpenChange={setIsAddExistingOpen}
        existingQuery={existingQuery} setExistingQuery={setExistingQuery}
        existingResults={existingResults} enrollTarget={enrollTarget} setEnrollTarget={setEnrollTarget}
        enrollClassId={enrollClassId} setEnrollClassId={setEnrollClassId}
        isClassLocked={isClassLocked} setIsClassLocked={setIsClassLocked}
        enrolling={enrolling} classes={classes} userId={user?.id}
        onSearch={handleSearchExisting} onEnroll={handleEnrollExisting}
      />
      <IlpFooter />
    </div>
  );
}