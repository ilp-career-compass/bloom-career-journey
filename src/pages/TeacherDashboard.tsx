import { logger } from '@/lib/logger';

function toE164Indian(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return phone;
}
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { StateInfo, SchoolClass } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Activity, BookOpen } from 'lucide-react';

// Sub-components
import { useTeacherStrings, TeacherLang } from '@/components/teacher/teacherStrings';
import { useLang } from '@/hooks/useLang';
import TeacherDashboardHeader from '@/components/teacher/TeacherDashboardHeader';
import TeacherStatsCards from '@/components/teacher/TeacherStatsCards';
import StudentsTab, { Student } from '@/components/teacher/StudentsTab';
import {
  AddStudentModal,
  StudentDetailsModal,
  AddExistingStudentModal,
} from '@/components/teacher/StudentModals';
import AssessmentResponsesView from '@/components/teacher/AssessmentResponsesView';
import ResourcesSection from '@/components/teacher/ResourcesSection';
import ChatBubble from '@/components/chat/ChatBubble';
import ContactIlpDialog from '@/components/ContactIlpDialog';
import ProfileDialog from '@/components/ProfileDialog';
import ImportStudentsDialog from '@/components/ImportStudentsDialog';
import IlpFooter from '@/components/IlpFooter';

interface StudentStats {
  totalStudents: number;
}

export default function TeacherDashboard() {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { lang: rawLang } = useLang();
  const lang = rawLang as TeacherLang;
  const { t, welcomeMessage } = useTeacherStrings(lang);

  // ── Student state ─────────────────────────────────────────────────
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats>({ totalStudents: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // ── Add Student state ─────────────────────────────────────────────
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddExistingOpen, setIsAddExistingOpen] = useState(false);
  const teacherLang = userProfile?.preferred_language || 'en';
  const [newStudent, setNewStudent] = useState({ fullName: '', phone: '', grade: '', preferredLanguage: teacherLang });
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
  const [activityTimeline, setActivityTimeline] = useState<Array<{ id: string; title: string; seq: number; status: string; completed_at?: string }>>([]);

  // ── Reviews state ─────────────────────────────────────────────────
  const [reviewOverview, setReviewOverview] = useState<{ unreviewed_count: number; reviewed_count: number; needs_revision_count: number; flagged_count: number; followups_due_this_week: number }>({ unreviewed_count: 0, reviewed_count: 0, needs_revision_count: 0, flagged_count: 0, followups_due_this_week: 0 });
  const [studentReviewMap, setStudentReviewMap] = useState<Record<string, { reviewed: number; total: number }>>({});
  const [pendingProfileCardMap, setPendingProfileCardMap] = useState<Record<string, number>>({});

  // ── Dialogs ───────────────────────────────────────────────────────
  const [contactOpen, setContactOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [teacherRow, setTeacherRow] = useState<{ id: string; state_id: string } | null>(null);

  // Auto-open chat bubble from notification deep link (?openChat=true)
  useEffect(() => {
    if (searchParams.get('openChat') === 'true') {
      setIsChatOpen(true);
      setSearchParams(prev => { prev.delete('openChat'); return prev; });
    }
  }, [searchParams]);

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
      filtered = filtered.filter(student => student.class?.name?.match(/\d+/)?.[0] === selectedGrade);
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
      logger.log('📊 Student stats calculated:', { totalStudents });
      setStudentStats({ totalStudents });
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

      // Fetch pending profile card counts for student row badges
      const studsData = data || [];
      const userIds = studsData.map((s: any) => s.user_id).filter(Boolean);
      if (userIds.length > 0) {
        supabase
          .from('profile_card_cache')
          .select('student_id, assessment_type')
          .eq('approval_status', 'pending')
          .in('student_id', userIds)
          .then(({ data: pendingCards }) => {
            if (pendingCards && pendingCards.length > 0) {
              const userIdToStudentId: Record<string, string> = {};
              studsData.forEach((s: any) => { if (s.user_id) userIdToStudentId[s.user_id] = s.id; });
              const map: Record<string, number> = {};
              pendingCards.forEach((c: any) => {
                const sId = userIdToStudentId[c.student_id];
                if (sId) map[sId] = (map[sId] || 0) + 1;
              });
              setPendingProfileCardMap(map);
            } else {
              setPendingProfileCardMap({});
            }
          })
          .catch((err: any) => logger.error('Error fetching pending profile cards:', err));
      } else {
        setPendingProfileCardMap({});
      }

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
            phone: toE164Indian(newStudent.phone),
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
        toast({ title: "Student Added!", description: "Student added successfully." });
        setIsAddStudentOpen(false);
        setNewStudent({ fullName: '', phone: '', grade: '', preferredLanguage: teacherLang });
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
      const logoutToasts: Record<string, { title: string; description: string }> = {
        en: { title: 'Logged Out', description: 'You have been successfully logged out.' },
        ta: { title: 'வெளியேறினீர்கள்', description: 'நீங்கள் வெற்றிகரமாக வெளியேறினீர்கள்.' },
        kn: { title: 'ಲಾಗ್ ಔಟ್ ಆಗಿದೆ', description: 'ನೀವು ಯಶಸ್ವಿಯಾಗಿ ಲಾಗ್ ಔಟ್ ಆಗಿದ್ದೀರಿ.' },
        hi: { title: 'लॉग आउट', description: 'आप सफलतापूर्वक लॉग आउट हो गए हैं।' },
      };
      const logoutMsg = logoutToasts[lang] || logoutToasts['en'];
      toast({ title: logoutMsg.title, description: logoutMsg.description });
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
      const zero = { unreviewed_count: 0, reviewed_count: 0, needs_revision_count: 0, flagged_count: 0, followups_due_this_week: 0 };
      const { data: teacherRecord } = await supabase.from('teachers').select('id').eq('user_id', userProfile.id).single();
      if (!teacherRecord) { setReviewOverview(zero); return; }

      const { data: studs } = await supabase.from('students').select('id').eq('teacher_id', teacherRecord.id);
      if (!studs || studs.length === 0) { setReviewOverview(zero); return; }
      const studentIds = studs.map(s => s.id);

      // Fetch response IDs (no row limit — only IDs, small payload)
      const { data: responses } = await supabase
        .from('assessment_responses')
        .select('id, student_id')
        .in('student_id', studentIds);
      if (!responses || responses.length === 0) { setReviewOverview(zero); return; }

      const responseIds = responses.map(r => r.id);
      const responseToStudent: Record<string, string> = {};
      responses.forEach(r => { responseToStudent[r.id] = r.student_id; });

      // Count from assessment_summaries.approval_status — aligns with the Reviews tab
      const { data: summaries } = await supabase
        .from('assessment_summaries')
        .select('approval_status, assessment_response_id')
        .in('assessment_response_id', responseIds);

      const counts = { ...zero };
      const perStudent: Record<string, { reviewed: number; total: number }> = {};

      (summaries || []).forEach(s => {
        const studentId = responseToStudent[s.assessment_response_id];
        if (!perStudent[studentId]) perStudent[studentId] = { reviewed: 0, total: 0 };
        perStudent[studentId].total++;
        switch (s.approval_status) {
          case 'approved':            counts.reviewed_count++;       perStudent[studentId].reviewed++; break;
          case 'pending_approval':    counts.unreviewed_count++;     break;
          case 'revision_requested':  counts.needs_revision_count++; break;
          case 'rejected':            counts.flagged_count++;        break;
        }
      });

      setReviewOverview(counts);
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
    if (teacherRow?.state_id) loadClasses(teacherRow.state_id);
  }, [teacherRow?.state_id]);

  // Reset all stale state when AddExistingStudentModal closes (G17)
  useEffect(() => {
    if (!isAddExistingOpen) {
      setExistingQuery('');
      setExistingResults([]);
      setEnrollTarget(null);
      setEnrollClassId('');
      setIsClassLocked(false);
    }
  }, [isAddExistingOpen]);

  // ═══════════════════════════════════════════════════════════════════
  //  HANDLERS (for sub-components)
  // ═══════════════════════════════════════════════════════════════════

  const handleViewDetails = async (student: Student) => {
    setSelectedStudent(student);
    try {
      const order = [
        { key: 'inspiration',           title: t('inspirationTitle'), seq: 1 },
        { key: 'about_me',              title: t('aboutMeTitle'),     seq: 2 },
        { key: 'dreams',                title: 'MY DREAMS',           seq: 3 },
        { key: 'school_learning',       title: 'MY SCHOOL',           seq: 4 },
        { key: 'hobbies',               title: 'MY HOBBIES',          seq: 5 },
        { key: 'role_models',           title: 'MY ROLE MODELS',      seq: 6 },
        { key: 'personality',           title: 'HOLLAND CODE',        seq: 7 },
        { key: 'career_guidance_tools', title: 'CAREER GUIDANCE',     seq: 8 },
      ] as const;
      const { data: ar } = await supabase.from('assessment_responses').select('assessment_type, completed_at').eq('student_id', student.id);
      const latest: Record<string, string | undefined> = {};
      (ar || []).forEach((r: any) => {
        if (r.completed_at) {
          const prev = latest[r.assessment_type];
          if (!prev || new Date(r.completed_at) > new Date(prev)) latest[r.assessment_type] = r.completed_at;
        }
      });
      const timeline = order.map(item => {
        const isCompleted = !!latest[item.key];
        // personality and career_guidance_tools are always unlocked (not sequentially gated)
        const alwaysUnlocked = item.key === 'personality' || item.key === 'career_guidance_tools';
        let status: string;
        if (alwaysUnlocked) {
          status = isCompleted ? 'completed' : 'unlocked';
        } else {
          const insp = !!latest['inspiration'], aboutMe = !!latest['about_me'],
                dreams = !!latest['dreams'], school = !!latest['school_learning'], hobbies = !!latest['hobbies'];
          const prereqs: Record<string, boolean> = {
            inspiration: true,
            about_me: insp,
            dreams: insp && aboutMe,
            school_learning: insp && aboutMe && dreams,
            hobbies: insp && aboutMe && dreams && school,
            role_models: insp && aboutMe && dreams && school && hobbies,
          };
          const unlocked = prereqs[item.key] ?? true;
          status = isCompleted ? 'completed' : unlocked ? 'unlocked' : 'locked';
        }
        return { id: item.key, title: item.title, seq: item.seq, status, completed_at: latest[item.key] } as any;
      });
      setActivityTimeline(timeline);
    } catch (err) { logger.error('Timeline load error:', err); setActivityTimeline([]); }
    setIsDetailsOpen(true);
  };

  const handleUnenroll = async (student: Student) => {
    if (!confirm('Mark this student as inactive? Their data and assessments will be preserved.')) return;
    try {
      const { error } = await supabase.from('students').update({ enrollment_status: 'inactive' }).eq('id', student.id);
      if (error) throw error;
      toast({ title: 'Student unenrolled', description: 'Student marked as inactive. Their data is preserved.' });
      loadStudents();
    } catch (err) {
      logger.error('Unenroll error:', err);
      toast({ title: 'Unenroll failed', description: 'Could not unenroll student', variant: 'destructive' });
    }
  };

  const handleSearchExisting = async () => {
    const normalizedQuery = existingQuery.trim();
    if (!normalizedQuery) {
      toast({ title: 'Search', description: 'Please enter a name or mobile number to search.', variant: 'destructive' });
      return;
    }
    try {
      const { data, error } = await supabase.rpc('search_students', {
        teacher_user_id: user?.id,
        query: normalizedQuery,
      });
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

        <TeacherStatsCards
          totalStudents={studentStats.totalStudents}
          reviewOverview={reviewOverview}
          pendingProfileCardMap={pendingProfileCardMap}
          onTabChange={setActiveTab}
        />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
              pendingProfileCardMap={pendingProfileCardMap}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedGrade={selectedGrade}
              setSelectedGrade={setSelectedGrade}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              t={t}
              onAddStudent={() => setIsAddStudentOpen(true)}
              onAddExisting={() => setIsAddExistingOpen(true)}
              onImportCsv={() => {
                if (!teacherRow) {
                  toast({ title: 'Not ready', description: 'Teacher profile still loading. Please try again.', variant: 'destructive' });
                  return;
                }
                setImportOpen(true);
              }}
              onViewDetails={handleViewDetails}
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
      <ImportStudentsDialog
        open={importOpen && !!teacherRow}
        onOpenChange={setImportOpen}
        classes={classes}
        teacherId={teacherRow?.id ?? ''}
        stateId={teacherRow?.state_id ?? ''}
        onImported={loadStudents}
      />
      <ContactIlpDialog open={contactOpen} onOpenChange={setContactOpen} />
      <ChatBubble role="teacher" isOpen={isChatOpen} onOpenChange={setIsChatOpen} />

      <AddStudentModal
        open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}
        newStudent={newStudent} setNewStudent={setNewStudent as any} onSubmit={handleAddStudent}
      />
      <StudentDetailsModal
        open={isDetailsOpen} onOpenChange={setIsDetailsOpen}
        selectedStudent={selectedStudent} activityTimeline={activityTimeline}
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