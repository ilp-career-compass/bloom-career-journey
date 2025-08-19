import React, { useState, useEffect } from 'react';
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

  // Profile editing state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: userProfile?.full_name || '',
    email: userProfile?.email || '',
    bio: '',
    interests: '',
    careerGoals: '',
    strengths: '',
    areasForGrowth: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
  const [schoolLearningProgress, setSchoolLearningProgress] = useState<Record<string, any> | null>(null);
  const [roleModelsProgress, setRoleModelsProgress] = useState<Record<string, any> | null>(null);
  const [hobbiesProgress, setHobbiesProgress] = useState<Record<string, any> | null>(null);

  // Assessment completion status
  const [inspirationCompleted, setInspirationCompleted] = useState(false);
  const [dreamsCompleted, setDreamsCompleted] = useState(false);
  const [schoolLearningCompleted, setSchoolLearningCompleted] = useState(false);
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

  // Helper function to get student ID
  const getStudentId = () => {
    if (!userProfile) return null;
    return userProfile.studentProfile?.id || userProfile.id;
  };

  const checkAssessmentProgress = async () => {
    const studentId = getStudentId();
    if (!studentId) return;

    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_type', 'inspiration')
        .eq('assessment_title', 'My Inspiration')
        .single();

      if (data && !error) {
        setAssessmentProgress(data);
      }
    } catch (error) {
      // No existing response found, which is fine
    }
  };

  const checkDreamsProgress = async () => {
    const studentId = getStudentId();
    if (!studentId) return;

    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_type', 'dreams')
        .eq('assessment_title', 'My Dreams')
        .single();

      if (data && !error) {
        setDreamsProgress(data);
      }
    } catch (error) {
      // No existing response found, which is fine
    }
  };

  const checkSchoolLearningProgress = async () => {
    const studentId = getStudentId();
    if (!studentId) return;

    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_type', 'school_learning')
        .eq('assessment_title', 'My School, My Learning and I')
        .single();

      if (data && !error) {
        setSchoolLearningProgress(data);
      }
    } catch (error) {
      // No existing response found, which is fine
    }
  };

  const checkRoleModelsProgress = async () => {
    const studentId = getStudentId();
    if (!studentId) return;

    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_type', 'role_models')
        .eq('assessment_title', 'My Role Models')
        .single();

      if (data && !error) {
        setRoleModelsProgress(data);
      }
    } catch (error) {
      // No existing response found, which is fine
    }
  };

  const checkHobbiesProgress = async () => {
    const studentId = getStudentId();
    if (!studentId) return;

    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_type', 'hobbies')
        .eq('assessment_title', 'My Hobbies')
        .single();

      if (data && !error) {
        setHobbiesProgress(data);
      }
    } catch (error) {
      // No existing response found, which is fine
    }
  };

  // Call useEffect after all functions are defined
  useEffect(() => {
    fetchData();
    checkAssessmentProgress();
    checkDreamsProgress();
    checkSchoolLearningProgress();
    checkRoleModelsProgress();
    checkHobbiesProgress();
  }, []);

  // Update completion status when progress changes
  useEffect(() => {
    setInspirationCompleted(!!assessmentProgress);
    setDreamsCompleted(!!dreamsProgress);
    setSchoolLearningCompleted(!!schoolLearningProgress);
    setRoleModelsCompleted(!!roleModelsProgress);
    setHobbiesCompleted(!!hobbiesProgress);
  }, [assessmentProgress, dreamsProgress, schoolLearningProgress, roleModelsProgress, hobbiesProgress]);

  const fetchData = async () => {
    if (!userProfile?.id) return;

    try {
      // Fetch student data
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          classes:class_id(name, schools:school_id(name)),
          teachers:teacher_id(users:user_id(full_name))
        `)
        .eq('user_id', userProfile.id)
        .single();

      if (studentError) throw studentError;
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
      case 'school_learning':
        return inspirationCompleted && dreamsCompleted;
      case 'role_models':
        return inspirationCompleted && dreamsCompleted && schoolLearningCompleted;
      case 'hobbies':
        return inspirationCompleted && dreamsCompleted && schoolLearningCompleted && roleModelsCompleted;
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
        return !!assessmentProgress;
      case 'dreams':
        return !!dreamsProgress;
      case 'school_learning':
        return !!schoolLearningProgress;
      case 'role_models':
        return !!roleModelsProgress;
      case 'hobbies':
        return !!hobbiesProgress;
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
      case 'school_learning':
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
    } else if (assessmentType === 'school_learning') {
      navigate('/assessment/school-learning');
    } else if (assessmentType === 'role_models') {
      navigate('/assessment/role-models');
    } else if (assessmentType === 'hobbies') {
      navigate('/assessment/hobbies');
    }
  };

  // Calculate overall progress
  const getOverallProgress = () => {
    const totalAssessments = 5;
    const completedAssessments = [inspirationCompleted, dreamsCompleted, schoolLearningCompleted, roleModelsCompleted, hobbiesCompleted]
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
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
                    </span>
                  </div>
                  <span className="text-gray-700 font-medium">{userProfile?.full_name || 'Student'}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-semibold">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>My Profile</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  setIsProfileOpen(true);
                  loadProfileData();
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
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
              {!getCompletionStatus('inspiration') && (
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
            className={getAssessmentStatus('school_learning').className}
            onClick={() => startAssessment('school_learning')}
          >
            <CardContent className="p-6 text-center">
              {React.createElement(getAssessmentStatus('school_learning').icon, {
                className: `w-12 h-12 ${getAssessmentStatus('school_learning').iconColor} mx-auto mb-3`
              })}
              <h3 className={`font-semibold ${getAssessmentStatus('school_learning').textColor} mb-2`}>
                3. My School & Learning
              </h3>
              <p className={`text-sm ${getAssessmentStatus('school_learning').descriptionColor} mb-2`}>
                Reflect on your learning journey
              </p>
              {getCompletionStatus('school_learning') && (
                <Badge variant="default" className="mt-2 bg-green-600">Completed ✓</Badge>
              )}
              {!getCompletionStatus('school_learning') && isAssessmentUnlocked('school_learning') && (
                <Badge variant="secondary" className="mt-2">Available</Badge>
              )}
              {!isAssessmentUnlocked('school_learning') && (
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
                <Badge variant={inspirationCompleted ? "default" : "secondary"}>
                  {inspirationCompleted ? "Completed ✓" : "Not Started"}
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
                <Badge variant={schoolLearningCompleted ? "default" : (dreamsCompleted ? "secondary" : "outline")}>
                  {schoolLearningCompleted ? "Completed ✓" : (dreamsCompleted ? "Available" : "Locked 🔒")}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                <span className="font-medium text-pink-800">4. My Role Models</span>
                <Badge variant={roleModelsCompleted ? "default" : (schoolLearningCompleted ? "secondary" : "outline")}>
                  {roleModelsCompleted ? "Completed ✓" : (schoolLearningCompleted ? "Available" : "Locked 🔒")}
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
                {/* Chat Interface Preview */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-700">CareerBot</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Hello! I'm here to help guide your career journey. Based on your assessments, I can provide personalized advice and suggestions.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Ask me about your career path..." 
                      className="flex-1"
                      disabled
                    />
                    <Button disabled className="bg-purple-600 hover:bg-purple-700">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    AI-powered career guidance coming in Phase 2 ✨
                  </p>
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
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gray-800">Edit Your Profile</DialogTitle>
            <DialogDescription>
              Update your personal information and career details to get better personalized guidance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>
            </div>

            {/* Career Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Career Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="interests">Interests & Hobbies</Label>
                <Textarea
                  id="interests"
                  value={profileData.interests}
                  onChange={(e) => setProfileData(prev => ({ ...prev, interests: e.target.value }))}
                  placeholder="What are you passionate about? What hobbies do you enjoy?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="careerGoals">Career Goals</Label>
                <Textarea
                  id="careerGoals"
                  value={profileData.careerGoals}
                  onChange={(e) => setProfileData(prev => ({ ...prev, careerGoals: e.target.value }))}
                  placeholder="What are your short-term and long-term career goals?"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="strengths">Strengths</Label>
                  <Textarea
                    id="strengths"
                    value={profileData.strengths}
                    onChange={(e) => setProfileData(prev => ({ ...prev, strengths: e.target.value }))}
                    placeholder="What are your key strengths and skills?"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="areasForGrowth">Areas for Growth</Label>
                  <Textarea
                    id="areasForGrowth"
                    value={profileData.areasForGrowth}
                    onChange={(e) => setProfileData(prev => ({ ...prev, areasForGrowth: e.target.value }))}
                    placeholder="What skills would you like to develop?"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsProfileOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleProfileSave} 
              disabled={isSavingProfile}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSavingProfile ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}