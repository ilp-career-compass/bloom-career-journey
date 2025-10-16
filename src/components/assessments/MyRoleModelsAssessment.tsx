import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  Users,
  Heart,
  Star,
  Target,
  Lightbulb,
  TrendingUp,
  UserCheck,
  MessageCircle,
  Award,
  BookOpen,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RoleModel {
  name: string;
  relationship: string;
  admirationReasons: string;
  profession: string;
  desiredQualities: string;
  careerDiscussed: string;
  opinion: string;
  willingToHelp: string;
  helpLookingFor: string;
  similarities: string;
  incorporatePlan: string;
}

interface RoleModelsAssessmentResponse {
  roleModel1: RoleModel;
  roleModel2: RoleModel;
  roleModel3: RoleModel;
}

export default function MyRoleModelsAssessment() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<RoleModelsAssessmentResponse>({
    roleModel1: {
      name: '',
      relationship: '',
      admirationReasons: '',
      profession: '',
      desiredQualities: '',
      careerDiscussed: '',
      opinion: '',
      willingToHelp: '',
      helpLookingFor: '',
      similarities: '',
      incorporatePlan: ''
    },
    roleModel2: {
      name: '',
      relationship: '',
      admirationReasons: '',
      profession: '',
      desiredQualities: '',
      careerDiscussed: '',
      opinion: '',
      willingToHelp: '',
      helpLookingFor: '',
      similarities: '',
      incorporatePlan: ''
    },
    roleModel3: {
      name: '',
      relationship: '',
      admirationReasons: '',
      profession: '',
      desiredQualities: '',
      careerDiscussed: '',
      opinion: '',
      willingToHelp: '',
      helpLookingFor: '',
      similarities: '',
      incorporatePlan: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentTab, setCurrentTab] = useState<'roleModel1' | 'roleModel2' | 'roleModel3'>('roleModel1');
  const [saving, setSaving] = useState(false);
  const [savedTabs, setSavedTabs] = useState<Partial<Record<keyof RoleModelsAssessmentResponse, string>>>({});

  useEffect(() => {
    checkExistingResponse();
  }, []);

  // Auto-save drafts on changes (debounced)
  useEffect(() => {
    if (loading || isCompleted) return;
    const t = setTimeout(async () => {
      try {
        if (!userProfile?.id) return;
        let studentId = userProfile.studentProfile?.id as string | undefined;
        if (!studentId) {
          const { data: row } = await supabase.from('students').select('id').eq('user_id', userProfile.id).maybeSingle();
          studentId = row?.id;
        }
        if (!studentId) return;
        await supabase.from('assessment_responses').upsert({
          student_id: studentId,
          assessment_type: 'role_models',
          assessment_title: 'My Role Models',
          responses,
          updated_at: new Date().toISOString(),
          completed_at: null
        });
      } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [responses, loading, isCompleted, userProfile]);

  const checkExistingResponse = async () => {
    if (!userProfile) return;

    // Resolve student_id from students table; do not fallback to users.id
    let studentId = userProfile.studentProfile?.id as string | undefined;
    if (!studentId) {
      const { data: studentRow } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userProfile.id)
        .maybeSingle();
      studentId = studentRow?.id;
    }

    if (!studentId) return;

    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_type', 'role_models')
        .eq('assessment_title', 'My Role Models')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setIsCompleted(!!data.completed_at);
        setResponses({
          roleModel1: { ...responses.roleModel1, ...(data.responses?.roleModel1 || {}) },
          roleModel2: { ...responses.roleModel2, ...(data.responses?.roleModel2 || {}) },
          roleModel3: { ...responses.roleModel3, ...(data.responses?.roleModel3 || {}) }
        });
      }
    } catch (error) {
      // No existing response found, which is fine
    } finally {
      setLoading(false);
    }
  };

  const isRoleModelComplete = (key: keyof RoleModelsAssessmentResponse) => {
    return Object.values(responses[key]).every(v => v.trim() !== '');
  };

  const isRoleModelSaved = (key: keyof RoleModelsAssessmentResponse) => {
    return !!savedTabs[key];
  };

  const saveCurrentRoleModel = async () => {
    if (!userProfile) return;
    // Resolve student_id from students table; do not fallback to users.id
    let studentId = userProfile.studentProfile?.id as string | undefined;
    if (!studentId) {
      const { data: studentRow } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userProfile.id)
        .maybeSingle();
      studentId = studentRow?.id;
    }
    if (!studentId) {
      toast({ title: 'Error', description: 'Student profile not found.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('assessment_responses')
        .upsert({
          student_id: studentId,
          assessment_type: 'role_models',
          assessment_title: 'My Role Models',
          responses,
          updated_at: new Date().toISOString(),
          completed_at: null
        });
      if (error) throw error;
      const label = currentTab === 'roleModel1' ? 'Role Model 1' : currentTab === 'roleModel2' ? 'Role Model 2' : 'Role Model 3';
      toast({ title: 'Progress Saved', description: `${label} progress saved successfully.` });
      setSavedTabs(prev => ({ ...prev, [currentTab]: new Date().toISOString() }));
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save progress. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRoleModelChange = (roleModelKey: keyof RoleModelsAssessmentResponse, field: keyof RoleModel, value: string) => {
    setResponses(prev => ({
      ...prev,
      [roleModelKey]: {
        ...prev[roleModelKey],
        [field]: value
      }
    }));
  };

  const getProgressPercentage = () => {
    const totalQuestions = 33;
    let answeredQuestions = 0;
    Object.values(responses).forEach(roleModel => {
      answeredQuestions += Object.values(roleModel).filter(v => v.trim() !== '').length;
    });
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const canSubmit = () => {
    return Object.values(responses).every(rm => Object.values(rm).every(v => v.trim() !== ''));
  };

  const submitAssessment = async () => {
    if (!userProfile) {
      toast({
        title: "Error",
        description: "User profile not found. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

    // Resolve student_id from students table; do not fallback to users.id
    let studentId = userProfile.studentProfile?.id as string | undefined;
    if (!studentId) {
      const { data: studentRow } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userProfile.id)
        .maybeSingle();
      studentId = studentRow?.id;
    }

    if (!studentId) {
      toast({
        title: "Error",
        description: "Student profile not found. Please contact your teacher or support.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('assessment_responses')
        .upsert({
          student_id: studentId,
          assessment_type: 'role_models',
          assessment_title: 'My Role Models',
          responses: responses,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Role Models Assessment Completed! ❤️",
        description: "Your role models and inspirations have been captured successfully!",
      });

      setIsCompleted(true);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your role models assessment...</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-0 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-purple-50 to-pink-50">
              <Users className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-purple-800">Role Models Assessment Completed! 🎯</CardTitle>
              <CardDescription className="text-purple-600">
                You've successfully identified and analyzed your role models
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Thank you for sharing your role model insights! Your responses have been saved and your teacher can now review them to help guide your personal development.
                </p>
                <div className="flex justify-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCompleted(false)}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    Review My Responses
                  </Button>
                  <Button 
                    onClick={() => navigate('/student')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8">
      <div className="container mx-auto px-4">
        <TooltipProvider>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-left mb-2">
            <Button variant="ghost" onClick={() => navigate('/student')} className="text-purple-700 hover:text-purple-800 hover:bg-purple-50">
              <ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-purple-800 mb-2">🎯 My Role Models</h1>
          <p className="text-purple-600 text-lg">
            People are inspired by others due to some particular qualities that they possess which we like.
          </p>
          <p className="text-gray-600 mt-2">
            There can be one or many such inspiring people in one's life. The person you write about today should be someone that you know personally and should not be a movie star/popular sportsperson/politician or any celebrity.
          </p>
          <p className="text-purple-600 mt-2 font-medium">
            It would be good to choose a role model who is from the field of your chosen profession.
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Your Progress</h2>
              <Badge variant="secondary">{Math.round(getProgressPercentage())}% Complete</Badge>
            </div>
            <Progress value={getProgressPercentage()} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>3 Tabs • 11 questions each</span>
              <span>{Math.round(getProgressPercentage())}% Complete</span>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Navigation */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-white rounded-lg p-1 shadow-md">
            <button
              onClick={() => setCurrentTab('roleModel1')}
              className={`px-4 py-2 rounded-md transition-all text-sm ${
                currentTab === 'roleModel1'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Role Model 1
            </button>
            <button
              onClick={() => setCurrentTab('roleModel2')}
              className={`px-4 py-2 rounded-md transition-all text-sm ${
                currentTab === 'roleModel2'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Role Model 2
            </button>
            <button
              onClick={() => setCurrentTab('roleModel3')}
              className={`px-4 py-2 rounded-md transition-all text-sm ${
                currentTab === 'roleModel3'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Role Model 3
            </button>
          </div>
        </div>

        {/* Current Tab Content */}
        <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-xl text-purple-800">{currentTab === 'roleModel1' ? 'Role Model 1' : currentTab === 'roleModel2' ? 'Role Model 2' : 'Role Model 3'}</CardTitle>
              <CardDescription className="text-purple-600">
                Answer all 11 questions for this role model
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-8">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        1. Name of the role model
                        <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>Write the name of your role model</TooltipContent></Tooltip>
                      </label>
                      <Input
                        placeholder="Write the name of your role model"
                        value={responses[currentTab].name}
                        onChange={(e) => handleRoleModelChange(currentTab, 'name', e.target.value)}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        2. Is this person from your family/school/village/acquaintance?
                        <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>Choose where this person is from — family, school, village, or someone you know.</TooltipContent></Tooltip>
                      </label>
                      <Input
                        placeholder="Family, School, Village, Acquaintance..."
                        value={responses[currentTab].relationship}
                        onChange={(e) => handleRoleModelChange(currentTab, 'relationship', e.target.value)}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        3. Why do you admire this person? (Make a list of the special qualities of each role model)
                        <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>Write what you like or respect about this person — their good habits, values, or actions.</TooltipContent></Tooltip>
                      </label>
                      <Textarea
                        placeholder="Write what you like or respect about this person — their good habits, values, or actions."
                        value={responses[currentTab].admirationReasons}
                        onChange={(e) => handleRoleModelChange(currentTab, 'admirationReasons', e.target.value)}
                        rows={3}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        4. What is his/her profession?
                        <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>Write what kind of work or job this person does.</TooltipContent></Tooltip>
                      </label>
                      <Input
                        placeholder="Write what kind of work or job this person does."
                        value={responses[currentTab].profession}
                        onChange={(e) => handleRoleModelChange(currentTab, 'profession', e.target.value)}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        5. Which of the qualities and skills possessed by these role models would you want to imbibe?
                        <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>Write the qualities or skills you would like to learn or follow from them.</TooltipContent></Tooltip>
                      </label>
                      <Input
                        placeholder="Write the qualities or skills you would like to learn or follow from them."
                        value={responses[currentTab].desiredQualities}
                        onChange={(e) => handleRoleModelChange(currentTab, 'desiredQualities', e.target.value)}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        6. Have you discussed your dream/career with these role models?
                        <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>Write ‘Yes’ or ‘No’ and mention if you’ve talked to them about your career plans.</TooltipContent></Tooltip>
                      </label>
                      <Textarea
                        placeholder="Write ‘Yes’ or ‘No’ and mention if you’ve talked to them about your career plans."
                        value={responses[currentTab].careerDiscussed}
                        onChange={(e) => handleRoleModelChange(currentTab, 'careerDiscussed', e.target.value)}
                        rows={2}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                  </div>
            {/* Q7–Q11 for current tab */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                7. What do they think about your dream/career?
                <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>Write what advice or opinion your role model shared about your dream.</TooltipContent></Tooltip>
              </label>
              <Textarea
                placeholder="Write what advice or opinion your role model shared about your dream."
                value={responses[currentTab].opinion}
                onChange={(e) => handleRoleModelChange(currentTab, 'opinion', e.target.value)}
                rows={3}
                className="border-purple-200 focus:border-purple-400"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  8. Are they willing to help with your dream/career interests?
                  <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>Write if this person has offered support or guidance for your dream.</TooltipContent></Tooltip>
                </label>
                <Input
                  placeholder="Yes/No and brief details"
                  value={responses[currentTab].willingToHelp}
                  onChange={(e) => handleRoleModelChange(currentTab, 'willingToHelp', e.target.value)}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  9. If so, what kind of help are you looking for?
                  <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>Write the type of help you expect — like guidance, ideas, or opportunities.</TooltipContent></Tooltip>
                </label>
                <Input
                  placeholder="Guidance, ideas, opportunities, introductions, etc."
                  value={responses[currentTab].helpLookingFor}
                  onChange={(e) => handleRoleModelChange(currentTab, 'helpLookingFor', e.target.value)}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                10. Are there any similarities between the qualities of your role model and your own?
                <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>Write if you share any similar habits, interests, or qualities with them.</TooltipContent></Tooltip>
              </label>
              <Textarea
                placeholder="Write if you share any similar habits, interests, or qualities with them."
                value={responses[currentTab].similarities}
                onChange={(e) => handleRoleModelChange(currentTab, 'similarities', e.target.value)}
                rows={3}
                className="border-purple-200 focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                11. How will you try to incorporate the qualities or skills of these individuals in your life?
                <Tooltip><TooltipTrigger asChild><button type="button" className="text-purple-600">💬</button></TooltipTrigger><TooltipContent>Write what steps you will take to build these good qualities in yourself.</TooltipContent></Tooltip>
              </label>
              <Textarea
                placeholder="Write what steps you will take to build these good qualities in yourself."
                value={responses[currentTab].incorporatePlan}
                onChange={(e) => handleRoleModelChange(currentTab, 'incorporatePlan', e.target.value)}
                rows={3}
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Navigation and Submit */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentTab(currentTab === 'roleModel1' ? 'roleModel3' : currentTab === 'roleModel2' ? 'roleModel1' : 'roleModel2')}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            {currentTab === 'roleModel1' ? '← Previous: Role Model 3' : currentTab === 'roleModel2' ? '← Previous: Role Model 1' : '← Previous: Role Model 2'}
          </Button>

            <div className="flex gap-3 items-center">
              {/* Save Progress status */}
              <div className="flex items-center gap-2 text-sm">
                {isRoleModelSaved(currentTab) ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{currentTab === 'roleModel1' ? 'Role Model 1' : currentTab === 'roleModel2' ? 'Role Model 2' : 'Role Model 3'} saved</span>
                  </div>
                ) : isRoleModelComplete(currentTab) ? (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Complete - Ready to save</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>Complete all questions to save</span>
                  </div>
                )}
              </div>
              <Button
                onClick={saveCurrentRoleModel}
                disabled={!isRoleModelComplete(currentTab) || saving || isRoleModelSaved(currentTab)}
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                    Saving...
                  </>
                ) : isRoleModelSaved(currentTab) ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Progress
                  </>
                )}
              </Button>
            </div>
            {currentTab !== 'roleModel3' && (
              <Button
                onClick={() => setCurrentTab(currentTab === 'roleModel1' ? 'roleModel2' : 'roleModel3')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Next: {currentTab === 'roleModel1' ? 'Role Model 2' : 'Role Model 3'} →
              </Button>
            )}

            {currentTab === 'roleModel3' && (
              <Button
                onClick={submitAssessment}
                disabled={!canSubmit() || submitting}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Submit Assessment
                  </>
                )}
              </Button>
            )}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
