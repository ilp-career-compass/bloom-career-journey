import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Zap,
  Activity,
  Sparkles,
  School,
  Users,
  Palette,
  Lock,
  CheckCircle,
  Play,
  Star,
  BookOpen,
  Heart,
  Target,
  User,
  LogOut,
  Settings,
  Edit,
  MessageSquare,
  Bot,
  ChevronDown,
  Crown,
  Briefcase,
  GraduationCap
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
import ProfileDialog from '@/components/ProfileDialog';
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

export default function StudentDashboard() {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Profile dialog state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    bio: '',
    interests: '',
    careerGoals: '',
    strengths: '',
    areasForGrowth: ''
  });

  // Mentor display name (assigned teacher)
  const [mentorName, setMentorName] = useState<string | null>(null);

  // CareerChat LM state (no persistence)
  type ChatMsg = { id: string; role: 'user' | 'model'; text: string };
  const [ccMessages, setCcMessages] = useState<ChatMsg[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [ccLoading, setCcLoading] = useState(false);
  const ccApiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
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
    setCcMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', text: content }]);
    ccScrollToBottom();

    if (!ccApiKey) {
      setCcMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: 'Gemini API key is not configured. Please set VITE_GEMINI_API_KEY.' }]);
      return;
    }
    setCcLoading(true);
    try {
      const history = ccMessages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
      const body = { contents: [...history, { role: 'user', parts: [{ text: content }] }] };
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ccApiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
      setCcMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text }]);
      ccScrollToBottom();
    } catch (err) {
      setCcMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: 'Failed to get a response. Please try again later.' }]);
    } finally {
      setCcLoading(false);
    }
  };

  // Load profile data when modal opens
  const loadProfileData = async () => {
    if (!userProfile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name, email, bio, interests, career_goals, strengths, areas_for_growth')
        .eq('id', userProfile.id)
        .single();

      if (data && !error) {
        setProfileData({
          fullName: data.full_name || '',
          email: data.email || '',
          bio: data.bio || '',
          interests: data.interests || '',
          careerGoals: data.career_goals || '',
          strengths: data.strengths || '',
          areasForGrowth: data.areas_for_growth || ''
        });
      }
    } catch (error) {
      console.log('No existing profile data found, using defaults');
    }
  };

  // Assessment progress states
  const [assessmentProgress, setAssessmentProgress] = useState<Record<string, any> | null>(null);
  const [dreamsProgress, setDreamsProgress] = useState<Record<string, any> | null>(null);
  const [stateLearningProgress, setSchoolLearningProgress] = useState<Record<string, any> | null>(null);
  const [roleModelsProgress, setRoleModelsProgress] = useState<Record<string, any> | null>(null);
  const [hobbiesProgress, setHobbiesProgress] = useState<Record<string, any> | null>(null);

  // Assessment completion status
  const [inspirationCompleted, setInspirationCompleted] = useState(false);
  const [dreamsCompleted, setDreamsCompleted] = useState(false);
  const [stateLearningCompleted, setSchoolLearningCompleted] = useState(false);
  const [roleModelsCompleted, setRoleModelsCompleted] = useState(false);
  const [hobbiesCompleted, setHobbiesCompleted] = useState(false);

  // Profile management functions
  const handleProfileSave = async () => {
    setIsSavingProfile(true);
    try {
      // Update all profile fields in the users table
      const { error } = await supabase
        .from('users')
        .update({
          full_name: profileData.fullName,
          email: profileData.email,
          bio: profileData.bio,
          interests: profileData.interests,
          career_goals: profileData.careerGoals,
          strengths: profileData.strengths,
          areas_for_growth: profileData.areasForGrowth,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile?.id);

      if (error) throw error;

      toast({
        title: "Profile Updated! ✨",
        description: "Your profile has been saved successfully.",
      });
      setIsProfileOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
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

  // Helper function to get student ID (students.id only)
  const getStudentId = async () => {
    if (!userProfile) return null;
    if (userProfile.studentProfile?.id) return userProfile.studentProfile.id;
    const { data } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userProfile.id)
      .maybeSingle();
    return data?.id || null;
  };

  const checkAssessmentProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;

    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_type', 'inspiration')
        .eq('assessment_title', 'My Inspiration')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setAssessmentProgress(data);
      }
    } catch (error) {
      // No existing response found, which is fine
    }
  };

  const checkDreamsProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;

    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_type', 'dreams')
        .eq('assessment_title', 'My Dreams')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setDreamsProgress(data);
      }
    } catch (error) {
      // No existing response found, which is fine
    }
  };

  const checkSchoolLearningProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;

    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_type', 'state_learning')
        .eq('assessment_title', 'My School, My Learning and I')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) setSchoolLearningProgress(data);
    } catch (error) {
      // No existing response found, which is fine
    }
  };

  const checkRoleModelsProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;

    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_type', 'role_models')
        .eq('assessment_title', 'My Role Models')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setRoleModelsProgress(data);
      }
    } catch (error) {
      // No existing response found, which is fine
    }
  };

  const checkHobbiesProgress = async () => {
    const studentId = await getStudentId();
    if (!studentId) return;

    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_type', 'hobbies')
        .eq('assessment_title', 'My Hobbies')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setHobbiesProgress(data);
      }
    } catch (error) {
      // No existing response found, which is fine
    }
  };

  // Load progress once user profile is available
  useEffect(() => {
    if (!userProfile?.id) return;
    fetchData();
    checkAssessmentProgress();
    checkDreamsProgress();
    checkSchoolLearningProgress();
    checkRoleModelsProgress();
    checkHobbiesProgress();
  }, [userProfile?.id]);

  // Update completion status when progress changes
  useEffect(() => {
    const insp = !!assessmentProgress?.completed_at;
    const dreams = !!dreamsProgress?.completed_at;
    const state = !!stateLearningProgress?.completed_at;
    const roles = !!roleModelsProgress?.completed_at;
    const hobbies = !!hobbiesProgress?.completed_at;
    setInspirationCompleted(insp);
    setDreamsCompleted(dreams);
    setSchoolLearningCompleted(state);
    setRoleModelsCompleted(roles);
    setHobbiesCompleted(hobbies);
  }, [assessmentProgress, dreamsProgress, stateLearningProgress, roleModelsProgress, hobbiesProgress]);

  const fetchData = async () => {
    if (!userProfile?.id) return;

    try {
      // Fetch student data
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          classes:class_id(name, states:state_id(name)),
          teachers:teacher_id(users:user_id(full_name))
        `)
        .eq('user_id', userProfile.id)
        .single();

      if (studentError) throw studentError;
      // Set mentor name for student-facing UI
      setMentorName(studentData?.teachers?.users?.full_name || 'ILP Mentor');
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };



  // Check if assessment is unlocked based on previous completion
  const isAssessmentUnlocked = (assessmentType: string) => {
    switch (assessmentType) {
      case 'inspiration':
        return true; // Always unlocked
      case 'dreams':
        return inspirationCompleted;
      case 'state_learning':
        return inspirationCompleted && dreamsCompleted;
      case 'role_models':
        return inspirationCompleted && dreamsCompleted && stateLearningCompleted;
      case 'hobbies':
        return inspirationCompleted && dreamsCompleted && stateLearningCompleted && roleModelsCompleted;
      default:
        return false;
    }
  };

  // Get assessment status and styling
  const getAssessmentStatus = (assessmentType: string) => {
    const isUnlocked = isAssessmentUnlocked(assessmentType);
    const isCompleted = getCompletionStatus(assessmentType);
    
    if (isCompleted) {
      return {
        status: 'completed',
        icon: CheckCircle,
        className: 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:shadow-lg transition-all duration-200 cursor-pointer',
        iconColor: 'text-green-600',
        textColor: 'text-green-800',
        descriptionColor: 'text-green-600'
      };
    } else if (isUnlocked) {
      return {
        status: 'unlocked',
        icon: getAssessmentIcon(assessmentType),
        className: 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 hover:shadow-lg transition-all duration-200 cursor-pointer',
        iconColor: 'text-blue-600',
        textColor: 'text-blue-800',
        descriptionColor: 'text-blue-600'
      };
    } else {
      return {
        status: 'locked',
        icon: Lock,
        className: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 opacity-60 cursor-not-allowed',
        iconColor: 'text-gray-400',
        textColor: 'text-gray-500',
        descriptionColor: 'text-gray-500'
      };
    }
  };

  // Get completion status for an assessment
  const getCompletionStatus = (assessmentType: string) => {
    switch (assessmentType) {
      case 'inspiration':
        return !!assessmentProgress?.completed_at;
      case 'dreams':
        return !!dreamsProgress?.completed_at;
      case 'state_learning':
        return !!stateLearningProgress?.completed_at;
      case 'role_models':
        return !!roleModelsProgress?.completed_at;
      case 'hobbies':
        return !!hobbiesProgress?.completed_at;
      default:
        return false;
    }
  };

  // Get assessment icon
  const getAssessmentIcon = (assessmentType: string) => {
    switch (assessmentType) {
      case 'inspiration':
        return Play;
      case 'dreams':
        return Star;
      case 'state_learning':
        return BookOpen;
      case 'role_models':
        return Heart;
      case 'hobbies':
        return Target;
      default:
        return Activity;
    }
  };

  const startAssessment = (assessmentType: string) => {
    if (!isAssessmentUnlocked(assessmentType)) {
      toast({
        title: "Assessment Locked",
        description: "Complete the previous assessment to unlock this one.",
        variant: "destructive",
      });
      return;
    }

    if (assessmentType === 'inspiration') {
      navigate('/assessment/inspiration');
    } else if (assessmentType === 'dreams') {
      navigate('/assessment/dreams');
    } else if (assessmentType === 'state_learning') {
      navigate('/assessment/state-learning');
    } else if (assessmentType === 'role_models') {
      navigate('/assessment/role-models');
    } else if (assessmentType === 'hobbies') {
      navigate('/assessment/hobbies');
    }
  };

  // Calculate overall progress
  const getOverallProgress = () => {
    const totalAssessments = 5;
    const completedAssessments = [inspirationCompleted, dreamsCompleted, stateLearningCompleted, roleModelsCompleted, hobbiesCompleted]
      .filter(Boolean).length;
    return (completedAssessments / totalAssessments) * 100;
  };

    return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
        </div>
              <h1 className="text-xl font-bold text-gray-800">CareerCompass</h1>
      </div>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
                  {userProfile?.profile_picture_url ? (
                    <img 
                      src={userProfile.profile_picture_url} 
                      alt={userProfile?.full_name || 'Student'}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        console.log('❌ Image failed to load:', userProfile.profile_picture_url);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => console.log('✅ Image loaded successfully:', userProfile.profile_picture_url)}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
                      </span>
                    </div>
                  )}
                  <span className="text-gray-700 font-medium">{userProfile?.full_name || 'Student'}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Your Career Journey</h1>
          <p className="text-xl text-gray-600">
            Complete assessments in sequence to unlock your full potential
          </p>
          <div className="mt-3 text-sm text-gray-700">
            <span className="font-medium">Your Mentor:</span> {mentorName || 'ILP Mentor'}
          </div>
        </div>

        {/* Overall Progress */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Your Journey Progress</h2>
              <Badge variant="secondary">{Math.round(getOverallProgress())}% Complete</Badge>
                          </div>
            <Progress value={getOverallProgress()} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>5 Assessments Total</span>
              <span>{Math.round(getOverallProgress())}% Complete</span>
                        </div>
          </CardContent>
        </Card>

        {/* Assessment Cards - Sequential Unlocking */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* 1. My Inspiration - Always Unlocked */}
          <Card
            className={getAssessmentStatus('inspiration').className}
            onClick={() => startAssessment('inspiration')}
          >
            <CardContent className="p-6 text-center">
              {React.createElement(getAssessmentStatus('inspiration').icon, {
                className: `w-12 h-12 ${getAssessmentStatus('inspiration').iconColor} mx-auto mb-3`
              })}
              <h3 className={`font-semibold ${getAssessmentStatus('inspiration').textColor} mb-2`}>
                1. My Inspiration
              </h3>
              <p className={`text-sm ${getAssessmentStatus('inspiration').descriptionColor} mb-2`}>
                Discover what inspires you
              </p>
              {getCompletionStatus('inspiration') && (
                <Badge variant="default" className="mt-2 bg-green-600">Completed ✓</Badge>
              )}
              {!getCompletionStatus('inspiration') && assessmentProgress && (
                <Badge variant="outline" className="mt-2 border-yellow-500 text-yellow-600">In Progress</Badge>
              )}
              {!getCompletionStatus('inspiration') && !assessmentProgress && (
                <Badge variant="secondary" className="mt-2">Start Here</Badge>
              )}
                    </CardContent>
                  </Card>

          {/* 2. My Dreams - Unlocked after Inspiration */}
          <Card
            className={getAssessmentStatus('dreams').className}
            onClick={() => startAssessment('dreams')}
          >
            <CardContent className="p-6 text-center">
              {React.createElement(getAssessmentStatus('dreams').icon, {
                className: `w-12 h-12 ${getAssessmentStatus('dreams').iconColor} mx-auto mb-3`
              })}
              <h3 className={`font-semibold ${getAssessmentStatus('dreams').textColor} mb-2`}>
                2. My Dreams
              </h3>
              <p className={`text-sm ${getAssessmentStatus('dreams').descriptionColor} mb-2`}>
                Explore your future aspirations
              </p>
              {getCompletionStatus('dreams') && (
                <Badge variant="default" className="mt-2 bg-green-600">Completed ✓</Badge>
              )}
              {!getCompletionStatus('dreams') && isAssessmentUnlocked('dreams') && (
                <Badge variant="secondary" className="mt-2">Available</Badge>
              )}
              {!isAssessmentUnlocked('dreams') && (
                <Badge variant="outline" className="mt-2">Locked 🔒</Badge>
              )}
            </CardContent>
          </Card>

          {/* 3. My School & Learning - Unlocked after Dreams */}
          <Card
            className={getAssessmentStatus('state_learning').className}
            onClick={() => startAssessment('state_learning')}
          >
            <CardContent className="p-6 text-center">
              {React.createElement(getAssessmentStatus('state_learning').icon, {
                className: `w-12 h-12 ${getAssessmentStatus('state_learning').iconColor} mx-auto mb-3`
              })}
              <h3 className={`font-semibold ${getAssessmentStatus('state_learning').textColor} mb-2`}>
                3. My School & Learning
              </h3>
              <p className={`text-sm ${getAssessmentStatus('state_learning').descriptionColor} mb-2`}>
                Reflect on your learning journey
              </p>
              {getCompletionStatus('state_learning') && (
                <Badge variant="default" className="mt-2 bg-green-600">Completed ✓</Badge>
              )}
              {!getCompletionStatus('state_learning') && isAssessmentUnlocked('state_learning') && (
                <Badge variant="secondary" className="mt-2">Available</Badge>
              )}
              {!isAssessmentUnlocked('state_learning') && (
                <Badge variant="outline" className="mt-2">Locked 🔒</Badge>
              )}
              </CardContent>
            </Card>

          {/* 4. My Role Models - Unlocked after School Learning */}
          <Card
            className={getAssessmentStatus('role_models').className}
            onClick={() => startAssessment('role_models')}
          >
            <CardContent className="p-6 text-center">
              {React.createElement(getAssessmentStatus('role_models').icon, {
                className: `w-12 h-12 ${getAssessmentStatus('role_models').iconColor} mx-auto mb-3`
              })}
              <h3 className={`font-semibold ${getAssessmentStatus('role_models').textColor} mb-2`}>
                4. My Role Models
              </h3>
              <p className={`text-sm ${getAssessmentStatus('role_models').descriptionColor} mb-2`}>
                Identify your inspiring role models
              </p>
              {getCompletionStatus('role_models') && (
                <Badge variant="default" className="mt-2 bg-green-600">Completed ✓</Badge>
              )}
              {!getCompletionStatus('role_models') && isAssessmentUnlocked('role_models') && (
                <Badge variant="secondary" className="mt-2">Available</Badge>
              )}
              {!isAssessmentUnlocked('role_models') && (
                <Badge variant="outline" className="mt-2">Locked 🔒</Badge>
              )}
                </CardContent>
              </Card>

          {/* 5. My Hobbies - Unlocked after Role Models */}
          <Card
            className={getAssessmentStatus('hobbies').className}
            onClick={() => startAssessment('hobbies')}
          >
            <CardContent className="p-6 text-center">
              {React.createElement(getAssessmentStatus('hobbies').icon, {
                className: `w-12 h-12 ${getAssessmentStatus('hobbies').iconColor} mx-auto mb-3`
              })}
              <h3 className={`font-semibold ${getAssessmentStatus('hobbies').textColor} mb-2`}>
                5. My Hobbies
              </h3>
              <p className={`text-sm ${getAssessmentStatus('hobbies').descriptionColor} mb-2`}>
                Discover career paths from your interests
              </p>
              {getCompletionStatus('hobbies') && (
                <Badge variant="default" className="mt-2 bg-green-600">Completed ✓</Badge>
              )}
              {!getCompletionStatus('hobbies') && isAssessmentUnlocked('hobbies') && (
                <Badge variant="secondary" className="mt-2">Available</Badge>
              )}
              {!isAssessmentUnlocked('hobbies') && (
                <Badge variant="outline" className="mt-2">Locked 🔒</Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Summary */}
        <Card className="border-0 shadow-lg">
                <CardHeader>
            <CardTitle className="text-xl text-gray-800">Assessment Progress Summary</CardTitle>
            <CardDescription>
              Track your completion status across all assessments
            </CardDescription>
                </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-green-800">1. My Inspiration</span>
                <Badge variant={inspirationCompleted ? "default" : (assessmentProgress ? "outline" : "secondary")}>
                  {inspirationCompleted ? "Completed ✓" : (assessmentProgress ? "In Progress" : "Not Started")}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-blue-800">2. My Dreams</span>
                <Badge variant={dreamsCompleted ? "default" : (inspirationCompleted ? "secondary" : "outline")}>
                  {dreamsCompleted ? "Completed ✓" : (inspirationCompleted ? "Available" : "Locked 🔒")}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="font-medium text-purple-800">3. My School & Learning</span>
                <Badge variant={stateLearningCompleted ? "default" : (dreamsCompleted ? "secondary" : "outline")}>
                  {stateLearningCompleted ? "Completed ✓" : (dreamsCompleted ? "Available" : "Locked 🔒")}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                <span className="font-medium text-pink-800">4. My Role Models</span>
                <Badge variant={roleModelsCompleted ? "default" : (stateLearningCompleted ? "secondary" : "outline")}>
                  {roleModelsCompleted ? "Completed ✓" : (stateLearningCompleted ? "Available" : "Locked 🔒")}
                </Badge>
                  </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="font-medium text-orange-800">5. My Hobbies</span>
                <Badge variant={hobbiesCompleted ? "default" : (roleModelsCompleted ? "secondary" : "outline")}>
                  {hobbiesCompleted ? "Completed ✓" : (roleModelsCompleted ? "Available" : "Locked 🔒")}
                </Badge>
                  </div>
                  </div>
                </CardContent>
              </Card>

        {/* CareerChat LM Section */}
        <div className="mt-12">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-2xl text-purple-800 flex items-center gap-3">
                <Bot className="w-6 h-6 text-purple-600" />
                CareerChat LM
              </CardTitle>
              <CardDescription className="text-purple-600">
                Get personalized career guidance based on your assessment responses
              </CardDescription>
                </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chat Interface */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]" ref={ccListRef}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-700">CareerBot</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Hello! I'm here to help guide your career journey. Based on your assessments, I can provide personalized advice and suggestions.
                    </p>
                    {ccMessages.map(m => (
                      <div key={m.id} className="mt-3">
                        <div className="text-xs text-gray-500 mb-1">{m.role === 'user' ? 'You' : 'CareerBot'}</div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap break-words bg-white border rounded p-2">
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Ask me about your career path..." 
                      className="flex-1"
                      value={ccInput}
                      onChange={(e)=> setCcInput(e.target.value)}
                    />
                    <Button onClick={handleCareerChatSend} disabled={!ccCanSend} className="bg-purple-600 hover:bg-purple-700">
                      {ccLoading ? '...' : <MessageSquare className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">AI-powered career guidance</p>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Quick Career Insights</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-800">Career Paths</p>
                        <p className="text-sm text-blue-600">Discover potential career options</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <GraduationCap className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Skill Development</p>
                        <p className="text-sm text-green-600">Identify skills to develop</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <Target className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-800">Goal Setting</p>
                        <p className="text-sm text-orange-600">Set career milestones</p>
                      </div>
                    </div>
                  </div>
                        </div>
                  </div>
                </CardContent>
              </Card>
            </div>
      </div>

      {/* Profile Editing Modal */}
      <ProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </div>
  );
}