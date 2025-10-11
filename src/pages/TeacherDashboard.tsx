import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { StateInfo, SchoolClass } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  UserPlus,
  Search,
  Filter,
  Edit,
  Eye,
  Plus,
  BookOpen, 
  Target,
  TrendingUp,
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
  averageProgress: number;
}

export default function TeacherDashboard() {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State management
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats>({
    totalStudents: 0,
    activeStudents: 0,
    recentAdditions: 0,
    averageProgress: 0
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
  const [assessmentAnswers, setAssessmentAnswers] = useState<any[]>([]);

  // Help center dialogs
  const [chatOpen, setChatOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [teacherRow, setTeacherRow] = useState<{ id: string; state_id: string } | null>(null);

  // Removed per-activity resources quick view

  



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

      setStudents(data || []);
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

  const loadStudentStats = async () => {
    try {
      const totalStudents = students.length;
      const activeStudents = students.filter(s => s.enrollment_status === 'active').length;
      const recentAdditions = students.filter(s => {
        const daysDiff = (Date.now() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
      }).length;

      // Calculate average progress (placeholder for now)
      const averageProgress = 75; // This will be calculated from assessment data later

      setStudentStats({
        totalStudents,
        activeStudents,
        recentAdditions,
        averageProgress
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

      // Create user record directly in users table (this will work with teacher permissions)
      const isEmail = /@/.test(newStudent.contact);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          full_name: newStudent.fullName,
          email: isEmail ? newStudent.contact : null,
          mobile: !isEmail ? newStudent.contact : null,
          state_id: teacherData.state_id,
          role: 'student',
          password_hash: 'temporary123' // This will be a placeholder
        })
        .select()
        .single();

      if (userError) throw userError;

      // Create student record with the found class_id
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: userData.id,
          teacher_id: teacherData.id,
          class_id: classId,
          enrollment_status: 'active'
        });

      if (studentError) throw studentError;

      // Create authentication credentials for the student
      const { error: authError } = await supabase
        .from('student_auth_credentials')
        .insert({
          user_id: userData.id,
          email: isEmail ? newStudent.contact : null,
          mobile: !isEmail ? newStudent.contact : null,
          password_hash: 'temporary123',
          is_active: true
        });

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
    loadStudents();
    loadStudentStats();
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
  }, [userProfile?.id]);

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
      const { data: answers, error } = await supabase
        .from('assessment_responses')
        .select('assessment_type, assessment_title, responses, completed_at')
        .eq('student_id', activityStudentId)
        .eq('assessment_type', type)
        .order('completed_at', { ascending: false });
      if (error) throw error;
      setAssessmentAnswers(answers || []);
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

  const renderReadableAnswers = (assessmentType: string, responses: any) => (
    <pre className="text-xs whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-md">{JSON.stringify(responses, null, 2)}</pre>
  );

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
              <h1 className="text-xl font-bold text-gray-800">Vidya Saathi</h1>
            </div>

            {/* Profile Dropdown */}
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
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={()=> setChatOpen(true)}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  AI Chatbot
                </DropdownMenuItem>
                <DropdownMenuItem onClick={()=> setContactOpen(true)}>
                  <LifeBuoy className="w-4 h-4 mr-2" />
                  Contact ILP
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome, {userProfile?.full_name}!</h1>
          <p className="text-xl text-gray-600">
            Manage your students and guide them through their career journey
            </p>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Students</p>
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
                  <p className="text-green-600 text-sm font-medium">Active Students</p>
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
                  <p className="text-purple-600 text-sm font-medium">Recent Additions</p>
                  <p className="text-3xl font-bold text-purple-800">{studentStats.recentAdditions}</p>
                </div>
                <UserPlus className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Avg Progress</p>
                  <p className="text-3xl font-bold text-orange-800">{studentStats.averageProgress}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="students" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Students</span>
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Activities</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Resources</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
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
                    Add Student
                                </Button>
                                <Button onClick={() => setIsAddExistingOpen(true)} variant="outline">
                                  <Search className="w-4 h-4 mr-2" />
                                  Add Existing Student
                                </Button>
                                <Button onClick={()=> setImportOpen(true)} variant="outline">
                                  <Upload className="w-4 h-4 mr-2" />
                                  Import CSV
                                </Button>
                </div>
                <div className="text-xs text-gray-500 mt-2">Temporary password for new student accounts: <span className="font-semibold">temporary123</span></div>
                </CardContent>
              </Card>

            {/* Students List */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                <CardTitle className="text-xl text-gray-800">Student Management</CardTitle>
                <CardDescription>
                  Manage your enrolled students and track their progress
                </CardDescription>
                </CardHeader>
                <CardContent>
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm || selectedGrade !== 'all' || selectedStatus !== 'all' 
                        ? 'Try adjusting your search or filters'
                        : 'Get started by adding your first student'
                      }
                    </p>
                    {!searchTerm && selectedGrade === 'all' && selectedStatus === 'all' && (
                      <Button onClick={() => setIsAddStudentOpen(true)} className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Student
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
                                    const order = [
                                      { key: 'inspiration', title: 'MY INSPIRATION', seq: 1 },
                                      { key: 'dreams', title: 'MY DREAMS', seq: 2 },
                                      { key: 'school_learning', title: 'MY SCHOOL', seq: 3 },
                                      { key: 'role_models', title: 'MY ROLE MODELS', seq: 4 },
                                      { key: 'hobbies', title: 'MY HOBBIES', seq: 5 },
                                    ] as const;
                                    const { data: ar } = await supabase
                                      .from('assessment_responses')
                                      .select('assessment_type, completed_at')
                                      .eq('student_id', student.id);
                                    const latest: Record<string, string | undefined> = {};
                                    (ar||[]).forEach((r:any)=>{
                                      const prev = latest[r.assessment_type];
                                      if (!prev || new Date(r.completed_at) > new Date(prev)) latest[r.assessment_type] = r.completed_at;
                                    });
                                    const insp = !!latest['inspiration'];
                                    const dreams = !!latest['dreams'];
                                    const school = !!latest['school_learning'];
                                    const roles = !!latest['role_models'];
                                    const timeline = order.map(item => {
                                      let status = 'locked';
                                      if (item.key === 'inspiration') status = insp ? 'completed' : 'unlocked';
                                      if (item.key === 'dreams') status = insp ? (dreams ? 'completed' : 'unlocked') : 'locked';
                                      if (item.key === 'school_learning') status = (insp && dreams) ? (school ? 'completed' : 'unlocked') : 'locked';
                                      if (item.key === 'role_models') status = (insp && dreams && school) ? (roles ? 'completed' : 'unlocked') : 'locked';
                                      if (item.key === 'hobbies') status = (insp && dreams && school && roles) ? (latest['hobbies'] ? 'completed' : 'unlocked') : 'locked';
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
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
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
                                        const { data: answers, error: aerr } = await supabase
                                          .from('assessment_responses')
                                          .select('assessment_type, assessment_title, responses, completed_at')
                                          .eq('student_id', student.id)
                                          .order('completed_at', { ascending: false });
                                        if (aerr) throw aerr;
                                        setAssessmentAnswers(answers || []);
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
                                    
                                    <DropdownMenuItem>
                                      <FileText className="w-4 h-4 mr-2" />
                                      Add Note
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Target className="w-4 h-4 mr-2" />
                                      Assign Activity
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

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-6">
            <Card className="border-0 shadow-lg">
                <CardHeader>
                <CardTitle className="text-xl text-gray-800">Counselling Activities</CardTitle>
                <CardDescription>
                  Manage and track student activities and progress
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Student selector */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">Select Student</div>
                      <Select value={activityStudentId} onValueChange={setActivityStudentId}>
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

                  {/* Activities list */}
                  {!activityStudentId ? (
                    <div className="text-sm text-gray-500">Pick a student to manage activities.</div>
                  ) : (
                    <div className="space-y-3">
                      {activities.map(a => {
                        const prog = activityProgressMap[a.id] || { status: 'unlocked' };
                        const isSaving = activitySaving[a.id];
                          return (
                          <Card key={a.id} className="border shadow-sm">
                            <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                              <div>
                                <div className="text-sm text-gray-500">#{a.sequence_number}</div>
                                <div className="font-medium">{a.title}</div>
                                <div className="text-xs text-gray-500">Status: <span className="font-medium">{prog.status}</span>{prog.completed_at ? ` • Completed: ${new Date(prog.completed_at).toLocaleString()}` : ''}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isSaving}
                                  onClick={async ()=>{
                                    await upsertProgress(a.id, { status: 'unlocked', completed_at: null });
                                    await openAnswersForActivity(a);
                                  }}
                                >Start</Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isSaving || prog.status === 'completed'}
                                  onClick={()=> upsertProgress(a.id, { status: 'completed', completed_at: new Date().toISOString() })}
                                >Complete</Button>
                                {prog.status === 'completed' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={()=> upsertProgress(a.id, { status: 'unlocked', completed_at: null })}
                                  >Reopen</Button>
                                )}
                              </div>
                            </CardContent>
                            <CardContent className="pt-0">
                              <div className="text-sm text-gray-600 mb-1">Notes / Results</div>
                              <Textarea value={activityNotesMap[a.id] || ''} onChange={(e)=> setActivityNotesMap(prev=> ({ ...prev, [a.id]: e.target.value }))} placeholder="Enter results or notes for this activity" />
                              <div className="mt-2 flex justify-end">
                                <Button size="sm" disabled={isSaving} onClick={()=> upsertProgress(a.id, { results: activityNotesMap[a.id] || null })}>Save Notes</Button>
                            </div>
                            </CardContent>
                          </Card>
                          );
                        })}
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
      <ChatbotDialog open={chatOpen} onOpenChange={setChatOpen} />
      <ContactIlpDialog open={contactOpen} onOpenChange={setContactOpen} />

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
              {['inspiration','dreams','school_learning','role_models','hobbies'].map((t)=> (
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedStudent?.user?.full_name || 'Student'} – Assessment Answers</DialogTitle>
            <DialogDescription>Latest submissions across all assessments</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {assessmentAnswers.length === 0 ? (
              <div className="text-sm text-gray-500">No assessment submissions yet.</div>
            ) : (
              assessmentAnswers.map((r:any, idx:number)=> (
                <Card key={idx} className="border shadow-sm">
              <CardHeader>
                    <CardTitle className="text-base">
                      <span className="capitalize">{r.assessment_type.replace('_',' ')}</span> – {r.assessment_title}
                      <span className="ml-2 text-sm text-gray-500">{new Date(r.completed_at).toLocaleString()}</span>
                    </CardTitle>
              </CardHeader>
                  <CardContent>
                    {renderReadableAnswers(r.assessment_type, r.responses)}
                    </CardContent>
                  </Card>
              ))
            )}
                      </div>
          <div className="flex justify-end gap-2">
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