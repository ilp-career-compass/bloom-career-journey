import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { StateInfo, SchoolClass } from '@/integrations/supabase/types';
import AssessmentResponsesView from '@/components/teacher/AssessmentResponsesView';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/NotificationBell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  UserPlus,
  Search,
  Filter,
  Eye,
  Plus,
  BookOpen, 
  Target,
  Calendar,
  Clock,
  Star,
  Award,
  GraduationCap,
  School,
  Home,
  Phone,
  Mail,
  MapPin,
  User,
  LogOut,
  Settings, 
  ChevronDown,
  Crown,
  Activity,
  BarChart3,
  FileText,
  Download,
  Upload,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  LifeBuoy,
  Clock as ClockIcon,
  Users as UsersIcon,
  BookOpen as BookOpenIcon,
  Target as TargetIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatbotDialog from '@/components/ChatbotDialog';
import ChatBubble from '@/components/chat/ChatBubble';
import ResourcesSection from '@/components/teacher/ResourcesSection';
import ContactIlpDialog from '@/components/ContactIlpDialog';
import ProfileDialog from '@/components/ProfileDialog';
import ImportStudentsDialog from '@/components/ImportStudentsDialog';

// Marker: Help Center (AI Chatbot + Contact ILP) is integrated – redeploy check

interface Student {
  id: string;
  user_id: string;
  class_id: string;
  teacher_id: string;
  enrollment_date: string;
  enrollment_status: string;
  previous_state?: string;
  special_needs?: string;
  parent_guardian_name?: string;
  parent_guardian_phone?: string;
  parent_guardian_email?: string;
  parent_guardian_occupation?: string;
  family_income_range?: string;
  academic_performance?: string;
  attendance_percentage?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    email: string;
    mobile?: string;
  };
  class?: {
    name: string;
  };
}

interface StudentStats {
  totalStudents: number;
  activeStudents: number;
  recentAdditions: number;
}

export default function TeacherDashboard() {
  const { user, userProfile, signOut } = useAuth();
  const location = useLocation();
  const urlLang = useMemo(() => new URLSearchParams(location.search).get('lang') as ('en'|'kn'|'ta'|null), [location.search]);
  const lang = (urlLang || userProfile?.preferred_language || (localStorage.getItem('lang') as 'en'|'kn'|'ta'|null) || 'en') as 'en'|'kn'|'ta';
  useEffect(()=>{ try{ localStorage.setItem('lang', lang); }catch{} }, [lang]);

  const strings: Record<'en'|'kn'|'ta', Record<string,string>> = {
    en: {
      brand: 'Vidya Saathi',
      welcome: (name: string) => `Welcome, ${name}!`,
      manageStudents: 'Manage your students and guide them through their career journey',
      totalStudents: 'Total Students',
      activeStudents: 'Active Students',
      recentAdditions: 'Recent Additions',
      studentsTab: 'Students',
      reviewsTab: 'Reviews',
      resourcesTab: 'Resources',
      analyticsTab: 'Analytics',
      addStudent: 'Add Student',
      addExisting: 'Add Existing Student',
      importCsv: 'Import CSV',
      studentManagement: 'Student Management',
      studentListEmpty: 'No students found',
      tryAdjustFilters: 'Try adjusting your search or filters',
      getStartedAdding: 'Get started by adding your first student',
      startFirstStudent: 'Add Your First Student',
      temporaryPassword: 'Temporary password for new student accounts:',
      reviewedLabel: 'reviewed',
      logout: 'Logout',
      myProfile: 'My Profile',
      contactIlp: 'Contact ILP',
    },
    kn: {
      brand: 'ವಿದ್ಯಾ ಸಾಥಿ',
      welcome: (name: string) => `ಸ್ವಾಗತ, ${name}!`,
      manageStudents: 'ನಿಮ್ಮ ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ನಿರ್ವಹಿಸಿ ಮತ್ತು ಅವರ ವೃತ್ತಿ ಪ್ರಯಾಣಕ್ಕೆ ಮಾರ್ಗದರ್ಶನ ನೀಡಿ',
      totalStudents: 'ಒಟ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳು',
      activeStudents: 'ಸಕ್ರಿಯ ವಿದ್ಯಾರ್ಥಿಗಳು',
      recentAdditions: 'ಇತ್ತೀಚಿನ ಸೇರಿಕೆಗಳು',
      studentsTab: 'ವಿದ್ಯಾರ್ಥಿಗಳು',
      reviewsTab: 'ಪರಿಶೀಲನೆಗಳು',
      resourcesTab: 'ಸಂಪನ್ಮೂಲಗಳು',
      analyticsTab: 'ವಿಶ್ಲೇಷಣೆ',
      addStudent: 'ವಿದ್ಯಾರ್ಥಿಯನ್ನು ಸೇರಿಸಿ',
      addExisting: 'ಇದ್ದ ವಿದ್ಯಾರ್ಥಿಯನ್ನು ಸೇರಿಸಿ',
      importCsv: 'CSV ಆಮದು',
      studentManagement: 'ವಿದ್ಯಾರ್ಥಿ ನಿರ್ವಹಣೆ',
      studentListEmpty: 'ಯಾವುದೇ ವಿದ್ಯಾರ್ಥಿಗಳು ಕಂಡುಬರಲಿಲ್ಲ',
      tryAdjustFilters: 'ಹುಡುಕಾಟ ಅಥವಾ ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಪರಿಷ್ಕರಿಸಿ ಪ್ರಯತ್ನಿಸಿ',
      getStartedAdding: 'ಮೊದಲ ವಿದ್ಯಾರ್ಥಿಯನ್ನು ಸೇರಿಸುವುದರಿಂದ ಪ್ರಾರಂಭಿಸಿ',
      startFirstStudent: 'ಮೊದಲ ವಿದ್ಯಾರ್ಥಿಯನ್ನು ಸೇರಿಸಿ',
      temporaryPassword: 'ಹೊಸ ವಿದ್ಯಾರ್ಥಿಗಳ ತಾತ್ಕಾಲಿಕ ಪಾಸ್ವರ್ಡ್:',
      reviewedLabel: 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
      logout: 'ಲಾಗ್ ಔಟ್',
      myProfile: 'ನನ್ನ ಪ್ರೊಫೈಲ್',
      contactIlp: 'ILP ಸಂಪರ್ಕಿಸಿ',
    },
    ta: {
      brand: 'வித்யா சாதி',
      welcome: (name: string) => `வணக்கம், ${name}!`,
      manageStudents: 'உங்கள் மாணவர்களை பார்த்து அவர்களுக்கு உதவுங்கள்',
      totalStudents: 'மொத்த மாணவர்கள்',
      activeStudents: 'படிக்கும் மாணவர்கள்',
      recentAdditions: 'புதிதாக சேர்க்கப்பட்டவர்கள்',
      studentsTab: 'மாணவர்கள்',
      reviewsTab: 'பார்வைகள்',
      resourcesTab: 'பயனுள்ள விஷயங்கள்',
      analyticsTab: 'விவரங்கள்',
      addStudent: 'மாணவரை சேர்',
      addExisting: 'இருக்கும் மாணவரை சேர்',
      importCsv: 'CSV பட்டியலை சேர்',
      studentManagement: 'மாணவர்களை பார்த்தல்',
      studentListEmpty: 'மாணவர்கள் இல்லை',
      tryAdjustFilters: 'தேடலை மாற்றி முயற்சிக்கவும்',
      getStartedAdding: 'முதல் மாணவரை சேர்த்து தொடங்குங்கள்',
      startFirstStudent: 'முதல் மாணவரை சேர்',
      temporaryPassword: 'புதிய மாணவர் கடவுச்சொல்:',
      reviewedLabel: 'பார்த்துவிட்டது',
      logout: 'வெளியேறு',
      myProfile: 'என் விவரம்',
      contactIlp: 'ILP தொடர்பு',
    },
  };
  const t = (k: string) => (strings[lang] as any)[k] || (strings.en as any)[k] || k;
  const navigate = useNavigate();
  const { toast } = useToast();

  // State management
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats>({
    totalStudents: 0,
    activeStudents: 0,
    recentAdditions: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Add Student Modal State
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddExistingOpen, setIsAddExistingOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    fullName: '',
    contact: '', // mobile number or email
    grade: '',
    stateId: ''
  });

  // State and class data for add student modal
  const [states, setStates] = useState<StateInfo[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [existingQuery, setExistingQuery] = useState('');
  const [existingResults, setExistingResults] = useState<any[]>([]);
  const [enrollTarget, setEnrollTarget] = useState<{ userId: string; name: string } | null>(null);
  const [enrollClassId, setEnrollClassId] = useState<string>('');
  const [enrolling, setEnrolling] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  // removed summary dialog per request
  const [isAnswersOpen, setIsAnswersOpen] = useState(false);
  const [progressSummary, setProgressSummary] = useState<{[k:string]: {count:number; last?: string}}>({});
  const [activityTimeline, setActivityTimeline] = useState<Array<{id:string; title:string; seq:number; status:string; completed_at?: string}>>([]);
  const [activities, setActivities] = useState<Array<{id:string; title:string; sequence_number:number}>>([]);
  const [activityStudentId, setActivityStudentId] = useState<string>('');
  const [activityProgressMap, setActivityProgressMap] = useState<Record<string, {status:string; completed_at?: string; results?: string}>>({});
  const [activityNotesMap, setActivityNotesMap] = useState<Record<string, string>>({});
  const [activitySaving, setActivitySaving] = useState<Record<string, boolean>>({});
  // Reviews tab state
  const [reviewStudentId, setReviewStudentId] = useState<string>('');
  const [studentAssessments, setStudentAssessments] = useState<Array<{ id:string; assessment_type:string; assessment_title:string; completed_at:string|null; review_status?:string|null; reviewed_at?:string|null; reviewer_name?:string|null; needs_follow_up?: boolean; follow_up_status?: string|null; follow_up_due_at?: string|null }>>([]);
  const [reviewSaving, setReviewSaving] = useState<Record<string, boolean>>({});
  const [assessmentAnswers, setAssessmentAnswers] = useState<any[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});
  const [reviewOverview, setReviewOverview] = useState<{unreviewed_count:number;reviewed_count:number;needs_revision_count:number;flagged_count:number;followups_due_this_week:number}>({unreviewed_count:0,reviewed_count:0,needs_revision_count:0,flagged_count:0,followups_due_this_week:0});
  const [studentReviewMap, setStudentReviewMap] = useState<Record<string, {reviewed:number; total:number}>>({});

  // Help center dialogs
  const [contactOpen, setContactOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [teacherRow, setTeacherRow] = useState<{ id: string; state_id: string } | null>(null);

  // Removed per-activity resources quick view

  



  // Update stats when students array changes (backup in case loadStudents doesn't trigger it)
  useEffect(() => {
    if (students.length > 0) {
      loadStudentStats(students);
    }
  }, [students.length]); // Only trigger when count changes to avoid infinite loops

  // Filter students based on search and filters
  useEffect(() => {
    let filtered = students;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parent_guardian_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Grade filter
    if (selectedGrade !== 'all') {
      filtered = filtered.filter(student => student.class?.name === selectedGrade);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(student => student.enrollment_status === selectedStatus);
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm, selectedGrade, selectedStatus]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      
      // First get the teacher row
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id, state_id')
        .eq('user_id', userProfile?.id)
        .single();

      if (teacherError) throw teacherError;

      // Get students from the teacher's state using the new state-based approach
      const { data, error } = await supabase
        .from('students')
          .select(`
            *,
          user:users(full_name, email, mobile),
          class:classes(name)
        `)
        .eq('teacher_id', teacherData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = data || [];
      setStudents(rows);
      // Load unread flags per student
      try {
        const studentIds = rows.map((r:any)=> r.id);
        // removed chat unread fetch per request
      } catch {}
      
      // Load stats after students are loaded
      await loadStudentStats(rows);
    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: "Error",
        description: "Failed to load students. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStudentStats = async (studentsData?: any[]) => {
    try {
      // Use provided data or fall back to students state
      const studentsToCount = studentsData || students;
      
      const totalStudents = studentsToCount.length;
      const activeStudents = studentsToCount.filter(s => 
        (s.enrollment_status === 'active' || !s.enrollment_status)
      ).length;
      
      // Recent additions: students added in the last 7 days
      // Use enrollment_date if available, otherwise use created_at
      const recentAdditions = studentsToCount.filter(s => {
        const dateToUse = s.enrollment_date || s.created_at;
        if (!dateToUse) return false;
        const daysDiff = (Date.now() - new Date(dateToUse).getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
      }).length;

      console.log('📊 Student stats calculated:', {
        totalStudents,
        activeStudents,
        recentAdditions,
        studentsCount: studentsToCount.length,
        enrollmentStatuses: studentsToCount.map(s => s.enrollment_status)
      });

      setStudentStats({
        totalStudents,
        activeStudents,
        recentAdditions
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAddStudent = async () => {
    try {
      // First get the teacher's state_id
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id, state_id')
        .eq('user_id', userProfile?.id)
        .single();

      if (teacherError) throw teacherError;

      // Find the class based on the selected grade
      let classId = null;
      if (newStudent.grade) {
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('id')
          .eq('name', `Class ${newStudent.grade}`)
          .eq('state_id', teacherData.state_id)
          .single();
        
        if (!classError && classData) {
          classId = classData.id;
        } else {
          console.warn(`Class ${newStudent.grade} not found for state ${teacherData.state_id}`);
        }
      }

      // Check if a user already exists with this email/mobile
      const isEmail = /@/.test(newStudent.contact);
      let existingUser: any = null;
      if (isEmail) {
        const { data } = await supabase
          .from('users')
          .select('id, full_name, email, mobile')
          .eq('email', newStudent.contact)
          .maybeSingle();
        existingUser = data || null;
      } else {
        const { data } = await supabase
          .from('users')
          .select('id, full_name, email, mobile')
          .eq('mobile', newStudent.contact)
          .maybeSingle();
        existingUser = data || null;
      }

      // Create or reuse the user
      let userData: any = existingUser;
      if (!userData) {
        const insertRes = await supabase
          .from('users')
          .insert({
            full_name: newStudent.fullName,
            email: isEmail ? newStudent.contact : null,
            mobile: !isEmail ? newStudent.contact : null,
            state_id: teacherData.state_id,
            role: 'student',
            password_hash: 'temporary123'
          })
          .select()
          .single();
        if (insertRes.error) throw insertRes.error;
        userData = insertRes.data;
      } else {
        // Ensure name/state/role are up to date for existing user (non-blocking)
        try {
          await supabase
            .from('users')
            .update({
              full_name: newStudent.fullName || userData.full_name,
              state_id: userData.state_id || teacherData.state_id,
              role: 'student',
            })
            .eq('id', userData.id);
        } catch {}
      }

      // Upsert student record with the found class_id
      const { error: studentError } = await supabase
        .from('students')
        .upsert({
          user_id: userData.id,
          teacher_id: teacherData.id,
          class_id: classId,
          enrollment_status: 'active'
        } as any, { onConflict: 'user_id' as any });
      if (studentError) throw studentError;

      // Upsert authentication credentials for the student
      const { error: authError } = await supabase
        .from('student_auth_credentials')
        .upsert({
          user_id: userData.id,
          email: isEmail ? newStudent.contact : existingUser?.email || null,
          mobile: !isEmail ? newStudent.contact : existingUser?.mobile || null,
          password_hash: 'temporary123',
          is_active: true
        } as any, { onConflict: 'user_id' as any });

      if (authError) {
        console.warn('Auth credentials creation failed, but student was created:', authError);
        // Don't fail the entire operation if auth setup fails
      }

      toast({
        title: "Student Added! ✨",
        description: `${newStudent.fullName} has been successfully enrolled${classId ? ` to Class ${newStudent.grade}` : ''}. Login: ${isEmail ? newStudent.contact : newStudent.contact}, Password: temporary123`,
      });

      setIsAddStudentOpen(false);
      setNewStudent({ fullName: '', contact: '', grade: '' });

      // Reload students
      loadStudents();
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast({
        title: "Error",
        description: `Failed to add student: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Load states and classes for add student modal
  const loadStates = async () => {
    try {
      console.log('TeacherDashboard: Loading states...');
      setLoadingStates(true);
      
      // First check if states table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('states')
        .select('count')
        .limit(1);
      
      if (tableError) {
        console.error('TeacherDashboard: States table error:', tableError);
        console.log('TeacherDashboard: States table does not exist - using fallback data');
        
        // Fallback states data for testing until migration is applied
        const fallbackStates = [
          { state_id: 'temp-1', state_name: 'ILP-Tamil Nadu', state_code: 'ILP-TN', org_name: 'ILP' },
          { state_id: 'temp-2', state_name: 'ILP-Karnataka', state_code: 'ILP-KA', org_name: 'ILP' },
          { state_id: 'temp-3', state_name: 'ILP-Andhra Pradesh', state_code: 'ILP-AP', org_name: 'ILP' },
          { state_id: 'temp-4', state_name: 'ILP-Telangana', state_code: 'ILP-TG', org_name: 'ILP' },
          { state_id: 'temp-5', state_name: 'ILP-Bihar', state_code: 'ILP-BH', org_name: 'ILP' },
          { state_id: 'temp-6', state_name: 'ILP-Jharkhand', state_code: 'ILP-JH', org_name: 'ILP' },
          { state_id: 'temp-7', state_name: 'ILP-Odisha', state_code: 'ILP-OD', org_name: 'ILP' }
        ];
        
        setStates(fallbackStates);
        return;
      }
      
      console.log('TeacherDashboard: States table exists, fetching data...');
      
      const { data, error } = await supabase
        .from('states')
        .select('id, state_name, state_code, orgs(name)')
        .order('state_name');
      
      if (error) {
        console.error('TeacherDashboard: Error fetching states:', error);
        throw error;
      }
      
      console.log('TeacherDashboard: States data received:', data);
      
      const statesData = data?.map(state => ({
        state_id: state.id,
        state_name: state.state_name,
        state_code: state.state_code,
        org_name: state.orgs?.name || 'ILP'
      })) || [];
      
      console.log('TeacherDashboard: Processed states data:', statesData);
      setStates(statesData);
    } catch (error) {
      console.error('TeacherDashboard: Error loading states:', error);
      setStates([]);
    } finally {
      setLoadingStates(false);
    }
  };

  const loadClasses = async (stateId: string) => {
    try {
      console.log('TeacherDashboard: Loading classes for state:', stateId);
      
      // Check if classes table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('classes')
        .select('count')
        .limit(1);
      
      if (tableError) {
        console.error('TeacherDashboard: Classes table error:', tableError);
        console.log('TeacherDashboard: Classes table does not exist - using fallback data');
        
        // Fallback classes data for testing until migration is applied
        const fallbackClasses = [
          { class_id: 'temp-8', class_name: 'Class 8' },
          { class_id: 'temp-9', class_name: 'Class 9' },
          { class_id: 'temp-10', class_name: 'Class 10' },
          { class_id: 'temp-11', class_name: 'Class 11' },
          { class_id: 'temp-12', class_name: 'Class 12' }
        ];
        
        setClasses(fallbackClasses);
        return;
      }
      
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('state_id', stateId)
        .order('name');
      
      if (error) throw error;
      console.log('TeacherDashboard: Classes data received:', data);
      setClasses(data || []);
    } catch (error) {
      console.error('TeacherDashboard: Error loading classes:', error);
      setClasses([]);
    }
  };

  // Load students data after functions are defined
  useEffect(() => {
    if (!userProfile?.id) return;
    loadStudents(); // loadStudentStats is called inside loadStudents after data is loaded
    loadStates(); // Load states for add student modal
    // Preload activities for Activities tab
    supabase
      .from('activities')
      .select('id, title, sequence_number')
      .order('sequence_number')
      .then(({ data, error }) => { if (!error) setActivities(data || []); });
    supabase
      .from('teachers')
      .select('id, state_id')
      .eq('user_id', userProfile.id)
      .maybeSingle()
      .then(({ data }) => setTeacherRow((data as any) || null));
    // Load review overview and per-student review progress
    refreshReviewOverview();
  }, [userProfile]);

  const refreshReviewOverview = async () => {
    try {
      if (!userProfile?.id) return;
      
      // Get teacher's student IDs
      // First get the teacher record
      const { data: teacherRecord } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', userProfile.id)
        .single();

      if (!teacherRecord) {
        console.warn('⚠️ No teacher record found for user:', userProfile.id);
        setReviewOverview({
          unreviewed_count: 0,
          reviewed_count: 0,
          needs_revision_count: 0,
          flagged_count: 0,
          followups_due_this_week: 0
        });
        return;
      }

      console.log('👨‍🏫 Teacher ID:', teacherRecord.id);

      const { data: students } = await supabase
        .from('students')
        .select('id')
        .eq('teacher_id', teacherRecord.id);
      
      console.log('👥 Found students:', students?.length || 0);
      
      if (!students || students.length === 0) {
        setReviewOverview({
          unreviewed_count: 0,
          reviewed_count: 0,
          needs_revision_count: 0,
          flagged_count: 0,
          followups_due_this_week: 0
        });
        return;
      }

      const studentIds = students.map(s => s.id);

      // Get all assessments for these students
      const { data: assessments } = await supabase
        .from('assessment_responses')
        .select('id, student_id, assessment_type, review_status, completed_at')
        .in('student_id', studentIds)
        .order('completed_at', { ascending: false });

      if (!assessments) {
        setReviewOverview({
          unreviewed_count: 0,
          reviewed_count: 0,
          needs_revision_count: 0,
          flagged_count: 0,
          followups_due_this_week: 0
        });
        return;
      }

      // Filter to keep only the latest unique assessment per student per type
      const uniqueAssessments = new Map<string, typeof assessments[0]>();
      
      assessments.forEach(assessment => {
        const key = `${assessment.student_id}_${assessment.assessment_type}`;
        // Only keep the first one (latest due to ordering)
        if (!uniqueAssessments.has(key)) {
          uniqueAssessments.set(key, assessment);
        }
      });

      console.log(`📊 Total assessments: ${assessments.length}, Unique assessments: ${uniqueAssessments.size}`);

      // Count by status (only counting unique assessments)
      const counts = {
        unreviewed_count: 0,
        reviewed_count: 0,
        needs_revision_count: 0,
        flagged_count: 0,
        followups_due_this_week: 0
      };

      uniqueAssessments.forEach(assessment => {
        const status = assessment.review_status || 'unreviewed';
        if (status === 'reviewed') counts.reviewed_count++;
        else if (status === 'needs_revision') counts.needs_revision_count++;
        else if (status === 'flagged') counts.flagged_count++;
        else counts.unreviewed_count++;
      });

      console.log('📊 Refreshed review overview:', counts);
      setReviewOverview(counts);

    } catch (err) {
      console.error('Error refreshing review overview:', err);
    }
  };

  // Load assessments for selected student in Reviews tab
  useEffect(() => {
    const loadStudentAssessments = async () => {
      if (!reviewStudentId) return setStudentAssessments([]);
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('id, assessment_type, assessment_title, completed_at, updated_at, review_status, reviewed_at, needs_follow_up, follow_up_status, follow_up_due_at')
        .eq('student_id', reviewStudentId)
        .order('completed_at', { ascending: false })
        .order('updated_at', { ascending: false });
      if (!error) {
        const rows: any[] = (data as any) || [];
        // Keep only the latest row per assessment_type (by completed_at then updated_at)
        const seen = new Set<string>();
        const latest: any[] = [];
        for (const r of rows) {
          const key = r.assessment_type;
          if (!seen.has(key)) {
            seen.add(key);
            latest.push(r);
          }
        }
        setStudentAssessments(latest);
      }
    };
    loadStudentAssessments();
  }, [reviewStudentId]);

  // Ensure classes are loaded for the teacher's state so CSV import can validate class_name
  useEffect(() => {
    if (teacherRow?.state_id) {
      loadClasses(teacherRow.state_id);
    }
  }, [teacherRow?.state_id]);

  const loadProgressForStudent = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_activity_progress')
        .select('activity_id, status, completed_at, results')
        .eq('student_id', studentId);
      if (error) throw error;
      const map: Record<string, {status:string; completed_at?: string; results?: string}> = {};
      const notes: Record<string, string> = {};
      (data||[]).forEach((p:any)=>{ map[p.activity_id] = { status: p.status, completed_at: p.completed_at || undefined, results: p.results || undefined }; if (p.results) notes[p.activity_id] = p.results; });
      setActivityProgressMap(map);
      setActivityNotesMap(notes);
    } catch (err) {
      console.error('Load progress error:', err);
      setActivityProgressMap({});
      setActivityNotesMap({});
    }
  };

  useEffect(() => {
    if (activityStudentId) {
      loadProgressForStudent(activityStudentId);
    }
  }, [activityStudentId]);

  const upsertProgress = async (activityId: string, data: Partial<{status:string; completed_at:string|null; results:string|null}>) => {
    if (!activityStudentId) return;
    setActivitySaving(prev => ({ ...prev, [activityId]: true }));
    try {
      const payload: any = { student_id: activityStudentId, activity_id: activityId, status: activityProgressMap[activityId]?.status || 'unlocked', completed_at: activityProgressMap[activityId]?.completed_at || null, results: activityProgressMap[activityId]?.results || null, ...data };
      const { error, status } = await supabase
        .from('student_activity_progress')
        .upsert(payload, { onConflict: 'student_id,activity_id' as any });
      if (error) throw error;
      // 204 on update, 201 on insert
      await loadProgressForStudent(activityStudentId);
      toast({ title: 'Saved', description: status === 201 ? 'Activity created' : 'Activity updated' });
    } catch (err: any) {
      console.error('Update progress error:', err?.message || err);
      // Show a compact, non-blocking message
      toast({ title: 'Save failed', description: 'Please check teacher/student linkage and permissions.', variant: 'destructive' });
    } finally {
      setActivitySaving(prev => ({ ...prev, [activityId]: false }));
    }
  };

  // Map an activity row to its assessment_type key
  const getAssessmentTypeForActivity = (a: { title: string; sequence_number: number }): 'inspiration' | 'dreams' | 'school_learning' | 'role_models' | 'hobbies' => {
    if (/inspiration/i.test(a.title) || a.sequence_number === 1) return 'inspiration';
    if (/dreams/i.test(a.title) || a.sequence_number === 2) return 'dreams';
    if (/school/i.test(a.title) || a.sequence_number === 3) return 'school_learning';
    if (/role\s*models?/i.test(a.title) || a.sequence_number === 4) return 'role_models';
    return 'hobbies';
  };

  const openAnswersForActivity = async (a: { id:string; title:string; sequence_number:number }) => {
    try {
      const student = students.find(s => s.id === activityStudentId);
      if (student) setSelectedStudent(student);
      const type = getAssessmentTypeForActivity(a);
      const { data: allAnswers, error } = await supabase
        .from('assessment_responses')
        .select('assessment_type, assessment_title, responses, completed_at, updated_at')
        .eq('student_id', activityStudentId)
        .eq('assessment_type', type)
        .order('completed_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false });
      if (error) throw error;
      
      // Get only the latest submission for this assessment type
      if (allAnswers && allAnswers.length > 0) {
        // Already filtered by type, so just get the first (latest) one
        setAssessmentAnswers([allAnswers[0]]);
      } else {
        setAssessmentAnswers([]);
      }
      setIsAnswersOpen(true);
    } catch (err) {
      console.error('Load activity answers error:', err);
      toast({ title: 'Could not load answers', variant: 'destructive' });
    }
  };

  // Load classes when state is selected in add student modal
  useEffect(() => {
    if (newStudent.stateId) {
      loadClasses(newStudent.stateId);
    } else {
      setClasses([]);
    }
  }, [newStudent.stateId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'graduated': return 'bg-blue-100 text-blue-800';
      case 'transferred': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (performance?: string) => {
    switch (performance) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'average': return 'text-yellow-600';
      case 'below_average': return 'text-orange-600';
      case 'needs_improvement': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const renderReadableAnswers = (assessmentType: string, responses: any) => {
    if (!responses || typeof responses !== 'object') {
      return <div className="text-sm text-gray-500">No responses available.</div>;
    }

    // For About Me, display in a more readable format
    if (assessmentType === 'about_me') {
      return (
        <div className="space-y-4">
          {Object.entries(responses).map(([fieldKey, value]: [string, any]) => {
            // Skip empty values
            if (!value || (Array.isArray(value) && value.every(v => !v || v.trim() === '')) || (typeof value === 'string' && value.trim() === '')) {
              return null;
            }
            
            return (
              <div key={fieldKey} className="border-b border-gray-200 pb-3 last:border-b-0">
                <div className="font-medium text-sm text-gray-700 mb-1 capitalize">
                  {fieldKey.replace(/_/g, ' ')}
                </div>
                <div className="text-sm text-gray-900 whitespace-pre-wrap break-words pl-2">
                  {Array.isArray(value) ? (
                    <ul className="list-disc list-inside space-y-1">
                      {value.map((item: string, idx: number) => (
                        item && item.trim() ? <li key={idx}>{item}</li> : null
                      ))}
                    </ul>
                  ) : (
                    <div>{String(value)}</div>
                  )}
                </div>
              </div>
            );
          })}
          {Object.keys(responses).length === 0 && (
            <div className="text-sm text-gray-500">No responses submitted yet.</div>
          )}
        </div>
      );
    }

    // For other assessments, display as formatted JSON
    return (
      <pre className="text-xs whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-md border">
        {JSON.stringify(responses, null, 2)}
      </pre>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
          </div>
              <h1 className="text-xl font-bold text-gray-800">{t('brand')}</h1>
            </div>

            {/* Notifications + Profile */}
            <div className="flex items-center gap-2">
              {userProfile?.id && <NotificationBell userId={userProfile.id} />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
                  {userProfile?.profile_picture_url ? (
                    <img 
                      src={userProfile.profile_picture_url} 
                      alt={userProfile?.full_name || 'Teacher'}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        console.log('❌ Image failed to load:', userProfile.profile_picture_url);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => console.log('✅ Image loaded successfully:', userProfile.profile_picture_url)}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'T'}
                      </span>
                    </div>
                  )}
                  <span className="text-gray-700 font-medium">{userProfile?.full_name || 'Teacher'}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem onClick={()=> setProfileOpen(true)}>
                  <User className="w-4 h-4 mr-2" />
                  {t('myProfile')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={()=> setContactOpen(true)}>
                  <LifeBuoy className="w-4 h-4 mr-2" />
                  {t('contactIlp')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{(strings[lang].welcome as any)(userProfile?.full_name || '')}</h1>
          <p className="text-xl text-gray-600">{t('manageStudents')}</p>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">{t('totalStudents')}</p>
                  <p className="text-3xl font-bold text-blue-800">{studentStats.totalStudents}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">{t('activeStudents')}</p>
                  <p className="text-3xl font-bold text-green-800">{studentStats.activeStudents}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">{t('recentAdditions')}</p>
                  <p className="text-3xl font-bold text-purple-800">{studentStats.recentAdditions}</p>
                </div>
                <UserPlus className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Review Overview Counters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-sm text-gray-600">Unreviewed</div>
              <div className="text-2xl font-bold text-gray-800">{reviewOverview.unreviewed_count}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-sm text-gray-600">Reviewed</div>
              <div className="text-2xl font-bold text-blue-700">{reviewOverview.reviewed_count}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-sm text-gray-600">Needs Revision</div>
              <div className="text-2xl font-bold text-yellow-600">{reviewOverview.needs_revision_count}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-sm text-gray-600">Flagged</div>
              <div className="text-2xl font-bold text-red-600">{reviewOverview.flagged_count}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-sm text-gray-600">Follow-ups Due This Week</div>
              <div className="text-2xl font-bold text-rose-600">{reviewOverview.followups_due_this_week}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="students" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="students" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>{t('studentsTab')}</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>{t('reviewsTab')}</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>{t('resourcesTab')}</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>{t('analyticsTab')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            {/* Search and Filters */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search students by name, email, or parent..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Grades</SelectItem>
                        <SelectItem value="8">Grade 8</SelectItem>
                        <SelectItem value="9">Grade 9</SelectItem>
                        <SelectItem value="10">Grade 10</SelectItem>
                        <SelectItem value="11">Grade 11</SelectItem>
                        <SelectItem value="12">Grade 12</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="graduated">Graduated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                      
                                <Button
                    onClick={() => setIsAddStudentOpen(true)}
                    className="bg-green-600 hover:bg-green-700"
                                >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('addStudent')}
                                </Button>
                                <Button onClick={() => setIsAddExistingOpen(true)} variant="outline">
                                  <Search className="w-4 h-4 mr-2" />
                                  {t('addExisting')}
                                </Button>
                                <Button onClick={()=> setImportOpen(true)} variant="outline">
                                  <Upload className="w-4 h-4 mr-2" />
                                  {t('importCsv')}
                                </Button>
                </div>
                <div className="text-xs text-gray-500 mt-2">{t('temporaryPassword')} <span className="font-semibold">temporary123</span></div>
                </CardContent>
              </Card>

            {/* Students List */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                <CardTitle className="text-xl text-gray-800">{t('studentManagement')}</CardTitle>
                <CardDescription>
                  Manage your enrolled students and track their progress
                </CardDescription>
                </CardHeader>
                <CardContent>
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('studentListEmpty')}</h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm || selectedGrade !== 'all' || selectedStatus !== 'all' 
                        ? t('tryAdjustFilters')
                        : t('getStartedAdding')
                      }
                    </p>
                    {!searchTerm && selectedGrade === 'all' && selectedStatus === 'all' && (
                      <Button onClick={() => setIsAddStudentOpen(true)} className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" />
                        {t('startFirstStudent')}
                                </Button>
                              )}
                        </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Student</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Grade</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Performance</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Enrolled</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student) => (
                          <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-medium text-gray-900">{student.user?.full_name}</p>
                                <p className="text-sm text-gray-500">{student.user?.email}</p>
                                <div className="mt-1">
                                  <Badge variant="outline">
                                    {studentReviewMap[student.id]?.reviewed || 0}/{studentReviewMap[student.id]?.total || 0} {t('reviewedLabel')}
                                  </Badge>
                                </div>
                                {student.parent_guardian_name && (
                                  <p className="text-xs text-gray-400">Parent: {student.parent_guardian_name}</p>
                                )}
                      </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant="outline">{student.class?.name}</Badge>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={getStatusColor(student.enrollment_status)}>
                                {student.enrollment_status}
                        </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <span className={getPerformanceColor(student.academic_performance)}>
                                {student.academic_performance || 'Not set'}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-gray-600">
                                {new Date(student.enrollment_date).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm" onClick={async ()=>{ 
                                  setSelectedStudent(student); 
                                  try {
                                    // Build assessment-based timeline according to unlock rules
                                    // Must match StudentDashboard.tsx unlock logic exactly
                                    const order = [
                                      { key: 'inspiration', title: 'MY INSPIRATION', seq: 1 },
                                      { key: 'about_me', title: 'ABOUT ME', seq: 2 },
                                      { key: 'dreams', title: 'MY DREAMS', seq: 3 },
                                      { key: 'school_learning', title: 'MY SCHOOL', seq: 4 },
                                      { key: 'hobbies', title: 'MY HOBBIES', seq: 5 },
                                      { key: 'role_models', title: 'MY ROLE MODELS', seq: 6 },
                                    ] as const;
                                    const { data: ar } = await supabase
                                      .from('assessment_responses')
                                      .select('assessment_type, completed_at')
                                      .eq('student_id', student.id);
                                    const latest: Record<string, string | undefined> = {};
                                    (ar||[]).forEach((r:any)=>{
                                      // Only consider responses with completed_at for completion status
                                      if (r.completed_at) {
                                        const prev = latest[r.assessment_type];
                                        if (!prev || new Date(r.completed_at) > new Date(prev)) {
                                          latest[r.assessment_type] = r.completed_at;
                                        }
                                      }
                                    });
                                    // Check completion status - must match StudentDashboard logic
                                    const insp = !!latest['inspiration'];
                                    const aboutMe = !!latest['about_me'];
                                    const dreams = !!latest['dreams'];
                                    const school = !!latest['school_learning'];
                                    const hobbies = !!latest['hobbies'];
                                    const roles = !!latest['role_models'];
                                    
                                    const timeline = order.map(item => {
                                      let status = 'locked';
                                      let isCompleted = false;
                                      
                                      // Determine completion status first
                                      if (item.key === 'inspiration') isCompleted = insp;
                                      else if (item.key === 'about_me') isCompleted = aboutMe;
                                      else if (item.key === 'dreams') isCompleted = dreams;
                                      else if (item.key === 'school_learning') isCompleted = school;
                                      else if (item.key === 'hobbies') isCompleted = hobbies;
                                      else if (item.key === 'role_models') isCompleted = roles;
                                      
                                      // Determine unlock status based on prerequisites (matching StudentDashboard.tsx)
                                      if (item.key === 'inspiration') {
                                        // Always unlocked
                                        status = isCompleted ? 'completed' : 'unlocked';
                                      } else if (item.key === 'about_me') {
                                        // Requires: inspiration completed
                                        status = insp ? (isCompleted ? 'completed' : 'unlocked') : 'locked';
                                      } else if (item.key === 'dreams') {
                                        // Requires: inspiration AND about_me completed
                                        status = (insp && aboutMe) ? (isCompleted ? 'completed' : 'unlocked') : 'locked';
                                      } else if (item.key === 'school_learning') {
                                        // Requires: inspiration AND about_me AND dreams completed
                                        status = (insp && aboutMe && dreams) ? (isCompleted ? 'completed' : 'unlocked') : 'locked';
                                      } else if (item.key === 'hobbies') {
                                        // Requires: inspiration AND about_me AND dreams AND school_learning completed
                                        status = (insp && aboutMe && dreams && school) ? (isCompleted ? 'completed' : 'unlocked') : 'locked';
                                      } else if (item.key === 'role_models') {
                                        // Requires: inspiration AND about_me AND dreams AND school_learning AND hobbies completed
                                        status = (insp && aboutMe && dreams && school && hobbies) ? (isCompleted ? 'completed' : 'unlocked') : 'locked';
                                      }
                                      
                                      return { id: item.key, title: item.title, seq: item.seq, status, completed_at: latest[item.key] } as any;
                                    });
                                    setActivityTimeline(timeline);
                                  } catch(err){
                                    console.error('Timeline load error:', err);
                                    setActivityTimeline([]);
                                  }
                                  setIsDetailsOpen(true); 
                                }}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {/* Chat button removed as per request */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={()=> navigate(`/student/${student.id}/summary`)}>
                                      <FileText className="w-4 h-4 mr-2" />
                                      View Summary
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={async ()=>{
                                      setSelectedStudent(student);
                                      try {
                                        const { data, error } = await supabase
                                          .from('assessment_responses')
                                          .select('assessment_type, completed_at')
                                          .eq('student_id', student.id);
                                        if (error) throw error;
                                        const summary: {[k:string]: {count:number; last?: string}} = {};
                                        (data||[]).forEach((r:any)=>{
                                          const t = r.assessment_type;
                                          if(!summary[t]) summary[t] = {count:0, last: undefined};
                                          summary[t].count += 1;
                                          if (!summary[t].last || new Date(r.completed_at) > new Date(summary[t].last!)) {
                                            summary[t].last = r.completed_at;
                                          }
                                        });
                                        setProgressSummary(summary);
                                        setIsProgressOpen(true);
                                      } catch (err) {
                                        console.error('Load progress error:', err);
                                        toast({ title: 'Failed to load progress', variant: 'destructive' });
                                      }
                                    }}>
                                      <Activity className="w-4 h-4 mr-2" />
                                      View Progress
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={async ()=>{
                                      setSelectedStudent(student);
                                      try {
                                        // Fetch all assessment responses
                                        const { data: allAnswers, error: aerr } = await supabase
                                          .from('assessment_responses')
                                          .select('assessment_type, assessment_title, responses, completed_at, updated_at')
                                          .eq('student_id', student.id)
                                          .order('completed_at', { ascending: false, nullsFirst: false })
                                          .order('updated_at', { ascending: false });
                                        if (aerr) throw aerr;
                                        
                                        // Get only the LATEST submission for each assessment type
                                        const latestByType: Record<string, any> = {};
                                        (allAnswers || []).forEach((answer: any) => {
                                          const existing = latestByType[answer.assessment_type];
                                          const answerTimestamp = new Date(answer.completed_at || answer.updated_at || 0).getTime();
                                          
                                          if (!existing) {
                                            latestByType[answer.assessment_type] = answer;
                                            return;
                                          }
                                          
                                          const existingTimestamp = new Date(existing.completed_at || existing.updated_at || 0).getTime();
                                          if (answerTimestamp > existingTimestamp) {
                                            latestByType[answer.assessment_type] = answer;
                                          }
                                        });
                                        
                                        // Convert to array and order by assessment sequence
                                        const assessmentOrder = ['inspiration', 'about_me', 'dreams', 'school_learning', 'hobbies', 'role_models'];
                                        const orderedAnswers = assessmentOrder
                                          .map(type => latestByType[type])
                                          .filter(Boolean)
                                          .filter((answer, index, self) => {
                                            // Remove duplicates by assessment_type
                                            return index === self.findIndex(a => a.assessment_type === answer.assessment_type);
                                          });
                                        
                                        console.log('📋 Latest assessment answers:', {
                                          total: orderedAnswers.length,
                                          types: orderedAnswers.map(a => a.assessment_type),
                                          details: orderedAnswers.map(a => ({
                                            type: a.assessment_type,
                                            title: a.assessment_title,
                                            hasResponses: !!a.responses,
                                            responseKeys: a.responses ? Object.keys(a.responses) : [],
                                            completedAt: a.completed_at,
                                            updatedAt: a.updated_at
                                          }))
                                        });
                                        
                                        // Verify no duplicates
                                        const typeSet = new Set(orderedAnswers.map(a => a.assessment_type));
                                        if (typeSet.size !== orderedAnswers.length) {
                                          console.warn('⚠️ Duplicate assessment types detected!', {
                                            unique: typeSet.size,
                                            total: orderedAnswers.length,
                                            duplicates: orderedAnswers.filter((a, i, arr) => 
                                              arr.findIndex(x => x.assessment_type === a.assessment_type) !== i
                                            ).map(a => a.assessment_type)
                                          });
                                        }
                                        
                                        setAssessmentAnswers(orderedAnswers);
                                        setIsAnswersOpen(true);
                                      } catch (err) {
                                        console.error('Load answers error:', err);
                                        toast({ title: 'Failed to load answers', variant: 'destructive' });
                                      }
                                    }}>
                                      <FileText className="w-4 h-4 mr-2" />
                                      View Assessment Answers
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600"
                                      onClick={async ()=>{
                                        if (!confirm('Unenroll this student from your list?')) return;
                                        try {
                                          const { error } = await supabase
                                            .from('students')
                                            .delete()
                                            .eq('id', student.id);
                                          if (error) throw error;
                                          toast({ title: 'Student unenrolled', description: 'Student has been removed from your list.' });
                                          loadStudents();
                                        } catch (err) {
                                          console.error('Unenroll error:', err);
                                          toast({ title: 'Unenroll failed', description: 'Could not remove student', variant: 'destructive' });
                                        }
                                      }}
                                    >
                                      Remove / Unenroll
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                      </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <AssessmentResponsesView onReviewUpdate={refreshReviewOverview} />
          </TabsContent>
          
          <TabsContent value="reviews_old" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800">Reviews (Old)</CardTitle>
                <CardDescription>Read answers and set review status for your students</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">Select Student</div>
                    <Select value={reviewStudentId} onValueChange={(v)=>{ setReviewStudentId(v); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.user?.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!reviewStudentId ? (
                  <div className="text-sm text-gray-500">Pick a student to review assessments.</div>
                ) : (
                  <div className="space-y-3">
                    {studentAssessments.length === 0 ? (
                      <div className="text-sm text-gray-500">No submissions yet.</div>
                    ) : (
                      studentAssessments.map(ar => {
                        const isSaving = !!reviewSaving[ar.id];
                        const status = (ar.review_status || 'unreviewed') as string;
                        const badgeClass = status === 'reviewed' ? 'bg-blue-600 text-white' : status === 'needs_revision' ? 'bg-yellow-500 text-white' : status === 'flagged' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800';
                        return (
                          <Card key={ar.id} className="border shadow-sm">
                            <CardContent className="p-4">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                  <div className="text-sm text-gray-500 capitalize">{ar.assessment_type.replace('_',' ')}</div>
                                  <div className="font-medium">{ar.assessment_title}</div>
                                  <div className="text-xs text-gray-500">Submitted: {ar.completed_at ? new Date(ar.completed_at).toLocaleString() : '—'}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded text-xs ${badgeClass}`}>{status.replace('_',' ')}</span>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    disabled={isSaving || status === 'reviewed'}
                                    onClick={async ()=>{
                                      setReviewSaving(prev=>({ ...prev, [ar.id]: true }));
                                      try {
                                        const { error } = await supabase.rpc('update_assessment_review', {
                                          teacher_user_id: userProfile?.id,
                                          assessment_response_id: ar.id,
                                          review: { review_status: 'reviewed' }
                                        } as any);
                                        if (error) throw error;
                                        setStudentAssessments(prev=> prev.map(x=> x.id===ar.id ? { ...x, review_status: 'reviewed', reviewed_at: new Date().toISOString(), reviewer_name: userProfile?.full_name || null } : x));
                                        // refresh counters
                                        const { data: ov } = await supabase.rpc('get_review_overview', { teacher_user_id: userProfile?.id });
                                        if (ov && ov[0]) setReviewOverview(ov[0] as any);
                                        const { data: sp } = await supabase.rpc('get_student_review_progress', { teacher_user_id: userProfile?.id });
                                        const map: Record<string, {reviewed:number; total:number}> = {};
                                        (sp||[]).forEach((row:any) => { map[row.student_id] = { reviewed: Number(row.reviewed_count||0), total: Number(row.total_count||0) }; });
                                        setStudentReviewMap(map);
                                      } catch (err) {
                                        console.error('Mark reviewed failed', err);
                                      } finally {
                                        setReviewSaving(prev=>({ ...prev, [ar.id]: false }));
                                      }
                                    }}
                                  >Mark Reviewed</Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isSaving}
                                    onClick={async ()=>{
                                      setReviewSaving(prev=>({ ...prev, [ar.id]: true }));
                                      try {
                                        const { error } = await supabase.rpc('update_assessment_review', {
                                          teacher_user_id: userProfile?.id,
                                          assessment_response_id: ar.id,
                                          review: { review_status: 'needs_revision' }
                                        } as any);
                                        if (error) throw error;
                                        setStudentAssessments(prev=> prev.map(x=> x.id===ar.id ? { ...x, review_status: 'needs_revision' } : x));
                                      } finally {
                                        setReviewSaving(prev=>({ ...prev, [ar.id]: false }));
                                      }
                                    }}
                                  >Needs Revision</Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isSaving}
                                    onClick={async ()=>{
                                      setReviewSaving(prev=>({ ...prev, [ar.id]: true }));
                                      try {
                                        const { error } = await supabase.rpc('update_assessment_review', {
                                          teacher_user_id: userProfile?.id,
                                          assessment_response_id: ar.id,
                                          review: { review_status: 'flagged' }
                                        } as any);
                                        if (error) throw error;
                                        setStudentAssessments(prev=> prev.map(x=> x.id===ar.id ? { ...x, review_status: 'flagged' } : x));
                                      } finally {
                                        setReviewSaving(prev=>({ ...prev, [ar.id]: false }));
                                      }
                                    }}
                                  >Flag</Button>
                                </div>
                              </div>
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div className="text-xs text-gray-600">Follow-up</div>
                                <div className="flex items-center gap-2">
                                  <Select value={(ar.follow_up_status || 'pending') as any} onValueChange={async (v)=>{
                                    setReviewSaving(prev=>({ ...prev, [ar.id]: true }));
                                    try {
                                      const { error } = await supabase.rpc('update_assessment_review', {
                                        teacher_user_id: userProfile?.id,
                                        assessment_response_id: ar.id,
                                        review: { needs_follow_up: true, follow_up_status: v }
                                      } as any);
                                      if (error) throw error;
                                      setStudentAssessments(prev=> prev.map(x=> x.id===ar.id ? { ...x, needs_follow_up: true, follow_up_status: v } : x));
                                    } finally {
                                      setReviewSaving(prev=>({ ...prev, [ar.id]: false }));
                                    }
                                  }}>
                                    <SelectTrigger className="w-40">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">pending</SelectItem>
                                      <SelectItem value="contacted">contacted</SelectItem>
                                      <SelectItem value="resolved">resolved</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <input type="date" className="border rounded px-2 py-1 text-sm"
                                    value={ar.follow_up_due_at ? new Date(ar.follow_up_due_at).toISOString().slice(0,10) : ''}
                                    onChange={async (e)=>{
                                      const date = e.target.value ? new Date(e.target.value).toISOString() : null;
                                      setReviewSaving(prev=>({ ...prev, [ar.id]: true }));
                                      try {
                                        const { error } = await supabase.rpc('update_assessment_review', {
                                          teacher_user_id: userProfile?.id,
                                          assessment_response_id: ar.id,
                                          review: { follow_up_due_at: date }
                                        } as any);
                                        if (error) throw error;
                                        setStudentAssessments(prev=> prev.map(x=> x.id===ar.id ? { ...x, follow_up_due_at: date } : x));
                                      } finally {
                                        setReviewSaving(prev=>({ ...prev, [ar.id]: false }));
                                      }
                                    }} />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <ResourcesSection />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="border-0 shadow-lg">
                <CardHeader>
                <CardTitle className="text-xl text-gray-800">Student Analytics</CardTitle>
                <CardDescription>
                  View detailed insights and progress reports
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
                  <p className="text-gray-500">
                    Analytics and reporting system will be implemented in the next phase
                  </p>
                  </div>
                </CardContent>
              </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Help Center */}
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      {teacherRow && (
        <ImportStudentsDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          classes={classes}
          teacherId={teacherRow.id}
          schoolId={teacherRow.state_id}
          onImported={loadStudents}
        />
      )}
      {/* Keep ChatbotDialog unrelated to mentor chat */}
      <ChatbotDialog open={false} onOpenChange={()=>{}} />
      <ContactIlpDialog open={contactOpen} onOpenChange={setContactOpen} />

      {/* Chat Bubble */}
      <ChatBubble role="teacher" />

      {/* Add Student Modal */}
      <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gray-800">Add New Student</DialogTitle>
            <DialogDescription>
              Enroll a new student and create their account. They will receive login credentials.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Student Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Student Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={newStudent.fullName}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter student's full name"
                  />
                  </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact">Mobile Number / Email *</Label>
                  <Input
                    id="contact"
                    value={newStudent.contact}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, contact: e.target.value }))}
                    placeholder="Enter mobile number or email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">Grade *</Label>
                  <Select value={newStudent.grade} onValueChange={(value) => setNewStudent(prev => ({ ...prev, grade: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">Grade 8</SelectItem>
                      <SelectItem value="9">Grade 9</SelectItem>
                      <SelectItem value="10">Grade 10</SelectItem>
                      <SelectItem value="11">Grade 11</SelectItem>
                      <SelectItem value="12">Grade 12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* School & Class Selection removed per request - teacher's school is implied; class can be derived from grade later */}

            
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsAddStudentOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddStudent}
              className="bg-green-600 hover:bg-green-700"
              disabled={!newStudent.fullName || !newStudent.contact || !newStudent.grade}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Details Drawer (read-only) */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedStudent?.user?.full_name || 'Student Details'}</DialogTitle>
            <DialogDescription>Basic profile and current status</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Name</div>
                <div className="font-medium">{selectedStudent?.user?.full_name}</div>
              </div>
              <div>
                <div className="text-gray-500">Mobile</div>
                <div className="font-medium">{selectedStudent?.user?.mobile || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500">Email</div>
                <div className="font-medium">{selectedStudent?.user?.email || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500">Class</div>
                <div className="font-medium">{selectedStudent?.class?.name || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500">Status</div>
                <div><Badge className={getStatusColor(selectedStudent?.enrollment_status || 'pending')}>{selectedStudent?.enrollment_status}</Badge></div>
              </div>
            </div>
            {/* Activity timeline */}
            <div className="pt-2">
              <div className="text-sm font-medium mb-2">Activities</div>
              {activityTimeline.length === 0 ? (
                <div className="text-sm text-gray-500">No activity data yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 pr-2">Sequence</th>
                        <th className="text-left py-2 pr-2">Title</th>
                        <th className="text-left py-2 pr-2">Status</th>
                        <th className="text-left py-2">Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityTimeline.map(a => (
                        <tr key={a.id} className="border-b border-gray-100">
                          <td className="py-2 pr-2">{a.seq}</td>
                          <td className="py-2 pr-2">{a.title}</td>
                          <td className="py-2 pr-2">
                            <Badge className={getStatusColor(a.status)}>{a.status}</Badge>
                          </td>
                          <td className="py-2">{a.completed_at ? new Date(a.completed_at).toLocaleString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={()=>{ setIsDetailsOpen(false); }}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Progress Modal */}
      <Dialog open={isProgressOpen} onOpenChange={setIsProgressOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedStudent?.user?.full_name || 'Student'} – Progress</DialogTitle>
            <DialogDescription>Latest assessment status and counts</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['inspiration','about_me','dreams','school_learning','hobbies','role_models'].map((t)=> (
                <Card key={t} className="border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base capitalize">{t.replace('_',' ')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-gray-600">Submissions: <span className="font-medium">{progressSummary[t]?.count || 0}</span></div>
                    <div className="text-sm text-gray-600">Last completed: <span className="font-medium">{progressSummary[t]?.last ? new Date(progressSummary[t]!.last!).toLocaleString() : '—'}</span></div>
                </CardContent>
              </Card>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={()=> window.print()}>Print</Button>
            <Button onClick={()=> setIsProgressOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assessment Answers Modal */}
      <Dialog open={isAnswersOpen} onOpenChange={setIsAnswersOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" data-print-content>
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedStudent?.user?.full_name || 'Student'} – Assessment Answers</DialogTitle>
            <DialogDescription>Latest submissions across all assessments</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {assessmentAnswers.length === 0 ? (
              <div className="text-sm text-gray-500">No assessment submissions yet.</div>
            ) : (
              assessmentAnswers.map((r:any) => (
                <Card key={`${r.assessment_type}-${r.completed_at || r.updated_at}`} className="border shadow-sm" data-assessment-card>
              <CardHeader>
                    <CardTitle className="text-base">
                      <span className="capitalize">{r.assessment_type.replace('_',' ')}</span> – {r.assessment_title}
                      {r.completed_at && (
                        <span className="ml-2 text-sm text-gray-500">{new Date(r.completed_at).toLocaleString()}</span>
                      )}
                    </CardTitle>
              </CardHeader>
                  <CardContent>
                    {renderReadableAnswers(r.assessment_type, r.responses)}
                    </CardContent>
                  </Card>
              ))
            )}
                      </div>
          <div className="flex justify-end gap-2 print:hidden">
            <Button variant="outline" onClick={()=> window.print()}>Print</Button>
            <Button onClick={()=> setIsAnswersOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Add Existing Student Modal */}
      <Dialog open={isAddExistingOpen} onOpenChange={(v)=>{ setIsAddExistingOpen(v); setExistingResults([]); setExistingQuery(''); setEnrollTarget(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gray-800">Add Existing Student</DialogTitle>
            <DialogDescription>
              Search by mobile, email, or name and enroll the student into your class.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input placeholder="Enter student mobile / email / name" value={existingQuery} onChange={(e)=>setExistingQuery(e.target.value)} />
              <Button onClick={async ()=>{
                try {
                  const { data, error } = await supabase.rpc('search_students', { teacher_user_id: user?.id, query: existingQuery });
                  if (error) throw error;
                  setExistingResults(data || []);
                } catch (err) {
                  console.error('Search error:', err);
                  toast({ title: 'Search failed', description: 'Could not search students', variant: 'destructive' });
                }
              }}>
                <Search className="w-4 h-4 mr-2" /> Search
              </Button>
                </div>

            {existingResults.length === 0 ? (
              <div className="text-sm text-gray-500">No student found. You can create a new one instead.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3">Name</th>
                      <th className="text-left py-2 px-3">Mobile / Email</th>
                      <th className="text-left py-2 px-3">Current Class</th>
                      <th className="text-left py-2 px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingResults.map((row:any)=> (
                      <tr key={row.student_user_id} className="border-b border-gray-100">
                        <td className="py-2 px-3">{row.full_name}</td>
                        <td className="py-2 px-3">{row.mobile || row.email}</td>
                        <td className="py-2 px-3">{row.current_class || '—'}</td>
                        <td className="py-2 px-3">
                          <Button size="sm" variant="outline" onClick={()=>{ setEnrollTarget({ userId: row.student_user_id, name: row.full_name }); setEnrollClassId(row.current_class_id || ''); }}>
                            Enroll
                  </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
            )}

            {enrollTarget && (
              <div className="mt-4 space-y-3 rounded-md border p-3 bg-white">
                <div className="text-sm text-gray-700">Enroll <span className="font-medium">{enrollTarget.name}</span></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                  <div className="space-y-1 md:col-span-2">
                    <div className="text-sm text-gray-600">Select Class (required)</div>
                    <Select value={enrollClassId} onValueChange={setEnrollClassId}>
                      <SelectTrigger>
                        <SelectValue placeholder={classes.length ? 'Choose class' : 'No classes available'} />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c: any) => (
                          <SelectItem key={c.id || c.class_id} value={(c.id || c.class_id) as string}>{c.name || c.class_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 justify-end md:justify-start">
                    <Button disabled={enrolling || !enrollClassId} onClick={async ()=>{
                      try {
                        setEnrolling(true);
                        const { error } = await supabase.rpc('enroll_student_by_user_id', {
                          teacher_user_id: user?.id,
                          student_user_id: enrollTarget?.userId,
                          class_id: enrollClassId || null,
                        });
                        if (error) throw error;
                        toast({ title: 'Student enrolled', description: 'Student has been linked to you.' });
                        setIsAddExistingOpen(false);
                        setEnrollTarget(null);
                        loadStudents();
                      } catch (err) {
                        console.error('Enroll error:', err);
                        toast({ title: 'Enrollment failed', description: 'Could not enroll student', variant: 'destructive' });
                      } finally {
                        setEnrolling(false);
                      }
                    }}>
                      Confirm Enroll
                    </Button>
                    <Button variant="ghost" onClick={()=> setEnrollTarget(null)}>Cancel</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=> setIsAddExistingOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}