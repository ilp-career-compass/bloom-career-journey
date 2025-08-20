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
  BookOpen
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RoleModel {
  name: string;
  relationship: string;
  admirationReasons: string;
  profession: string;
  desiredQualities: string;
  careerDiscussed: string;
}

interface RoleModelsAssessmentResponse {
  part1: {
    roleModel1: RoleModel;
    roleModel2: RoleModel;
    roleModel3: RoleModel;
  };
  part2: {
    question7: string; // What do they think about your dream/career?
    question8: string; // Are they willing to help with your dream/career interests?
    question9: string; // If so, what kind of help are you looking for?
  };
  part3: {
    question10: string; // Similarities between role models and yourself
    question11: string; // How to incorporate role model qualities
  };
}

export default function MyRoleModelsAssessment() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [responses, setResponses] = useState<RoleModelsAssessmentResponse>({
    part1: {
      roleModel1: {
        name: '',
        relationship: '',
        admirationReasons: '',
        profession: '',
        desiredQualities: '',
        careerDiscussed: ''
      },
      roleModel2: {
        name: '',
        relationship: '',
        admirationReasons: '',
        profession: '',
        desiredQualities: '',
        careerDiscussed: ''
      },
      roleModel3: {
        name: '',
        relationship: '',
        admirationReasons: '',
        profession: '',
        desiredQualities: '',
        careerDiscussed: ''
      }
    },
    part2: {
      question7: '',
      question8: '',
      question9: ''
    },
    part3: {
      question10: '',
      question11: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentPart, setCurrentPart] = useState<'part1' | 'part2' | 'part3'>('part1');

  useEffect(() => {
    checkExistingResponse();
  }, []);

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
        .maybeSingle();

      if (data && !error) {
        setIsCompleted(true);
        setResponses(data.responses || responses);
      }
    } catch (error) {
      // No existing response found, which is fine
    } finally {
      setLoading(false);
    }
  };

  const handleRoleModelChange = (roleModelKey: keyof typeof responses.part1, field: keyof RoleModel, value: string) => {
    setResponses(prev => ({
      ...prev,
      part1: {
        ...prev.part1,
        [roleModelKey]: {
          ...prev.part1[roleModelKey],
          [field]: value
        }
      }
    }));
  };

  const handleResponseChange = (part: 'part2' | 'part3', questionKey: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [part]: {
        ...prev[part],
        [questionKey]: value
      }
    }));
  };

  const getProgressPercentage = () => {
    const totalQuestions = 11;
    let answeredQuestions = 0;

    // Check role models (6 questions each, but only count if at least name is provided)
    Object.values(responses.part1).forEach(roleModel => {
      if (roleModel.name.trim() !== '') {
        answeredQuestions += Object.values(roleModel).filter(v => v.trim() !== '').length;
      }
    });

    // Check part 2 and 3 questions
    answeredQuestions += Object.values(responses.part2).filter(v => v.trim() !== '').length;
    answeredQuestions += Object.values(responses.part3).filter(v => v.trim() !== '').length;

    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const canSubmit = () => {
    // At least one role model must be fully completed
    const hasCompleteRoleModel = Object.values(responses.part1).some(roleModel => 
      Object.values(roleModel).every(v => v.trim() !== '')
    );

    // Part 2 and 3 must be complete
    const part2Complete = Object.values(responses.part2).every(v => v.trim() !== '');
    const part3Complete = Object.values(responses.part3).every(v => v.trim() !== '');

    return hasCompleteRoleModel && part2Complete && part3Complete;
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
          completed_at: new Date().toISOString()
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
                    onClick={() => (window.location.href = '/student')}
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
        {/* Header */}
        <div className="text-center mb-8">
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
              <span>Part {currentPart === 'part1' ? '1' : currentPart === 'part2' ? '2' : '3'} of 3</span>
              <span>{Math.round(getProgressPercentage())}% Complete</span>
            </div>
          </CardContent>
        </Card>

        {/* Part Navigation */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-white rounded-lg p-1 shadow-md">
            <button
              onClick={() => setCurrentPart('part1')}
              className={`px-4 py-2 rounded-md transition-all text-sm ${
                currentPart === 'part1'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Part 1: Role Models
            </button>
            <button
              onClick={() => setCurrentPart('part2')}
              className={`px-4 py-2 rounded-md transition-all text-sm ${
                currentPart === 'part1'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Part 2: Support & Guidance
            </button>
            <button
              onClick={() => setCurrentPart('part3')}
              className={`px-4 py-2 rounded-md transition-all text-sm ${
                currentPart === 'part1'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Part 3: Self-Reflection
            </button>
          </div>
        </div>

        {/* Part 1: Role Models */}
        {currentPart === 'part1' && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-xl text-purple-800">Part 1: Your Role Models</CardTitle>
              <CardDescription className="text-purple-600">
                Answer the following questions regarding your chosen role models (the qualities, traits, talent etc. in the person that inspire you)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-8">
                {/* Role Model 1 */}
                <div className="border rounded-lg p-6 bg-gradient-to-r from-purple-50 to-pink-50">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Role Model 1
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        1. Name of the role model
                      </label>
                      <Input
                        placeholder="Enter their name..."
                        value={responses.part1.roleModel1.name}
                        onChange={(e) => handleRoleModelChange('roleModel1', 'name', e.target.value)}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        2. Is this person from your family/school/village/acquaintance?
                      </label>
                      <Input
                        placeholder="e.g., Family, School, Village, Acquaintance..."
                        value={responses.part1.roleModel1.relationship}
                        onChange={(e) => handleRoleModelChange('roleModel1', 'relationship', e.target.value)}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        3. Why do you admire this person? (Make a list of the special qualities of each role model)
                      </label>
                      <Textarea
                        placeholder="List the qualities, traits, and talents that inspire you..."
                        value={responses.part1.roleModel1.admirationReasons}
                        onChange={(e) => handleRoleModelChange('roleModel1', 'admirationReasons', e.target.value)}
                        rows={3}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        4. What is his/her profession?
                      </label>
                      <Input
                        placeholder="e.g., Teacher, Engineer, Doctor..."
                        value={responses.part1.roleModel1.profession}
                        onChange={(e) => handleRoleModelChange('roleModel1', 'profession', e.target.value)}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        5. Which of the qualities and skills possessed by these role models would you want to imbibe?
                      </label>
                      <Input
                        placeholder="Specific qualities you want to adopt..."
                        value={responses.part1.roleModel1.desiredQualities}
                        onChange={(e) => handleRoleModelChange('roleModel1', 'desiredQualities', e.target.value)}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        6. Have you discussed your dream/career with these role models?
                      </label>
                      <Textarea
                        placeholder="Share your experience of discussing career goals with this person..."
                        value={responses.part1.roleModel1.careerDiscussed}
                        onChange={(e) => handleRoleModelChange('roleModel1', 'careerDiscussed', e.target.value)}
                        rows={2}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Role Model 2 */}
                <div className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-blue-500" />
                    Role Model 2
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        1. Name of the role model
                      </label>
                      <Input
                        placeholder="Enter their name..."
                        value={responses.part1.roleModel2.name}
                        onChange={(e) => handleRoleModelChange('roleModel2', 'name', e.target.value)}
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        2. Is this person from your family/school/village/acquaintance?
                      </label>
                      <Input
                        placeholder="e.g., Family, School, Village, Acquaintance..."
                        value={responses.part1.roleModel2.relationship}
                        onChange={(e) => handleRoleModelChange('roleModel2', 'relationship', e.target.value)}
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        3. Why do you admire this person? (Make a list of the special qualities of each role model)
                      </label>
                      <Textarea
                        placeholder="List the qualities, traits, and talents that inspire you..."
                        value={responses.part1.roleModel2.admirationReasons}
                        onChange={(e) => handleRoleModelChange('roleModel2', 'admirationReasons', e.target.value)}
                        rows={3}
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        4. What is his/her profession?
                      </label>
                      <Input
                        placeholder="e.g., Teacher, Engineer, Doctor..."
                        value={responses.part1.roleModel2.profession}
                        onChange={(e) => handleRoleModelChange('roleModel2', 'profession', e.target.value)}
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        5. Which of the qualities and skills possessed by these role models would you want to imbibe?
                      </label>
                      <Input
                        placeholder="Specific qualities you want to adopt..."
                        value={responses.part1.roleModel2.desiredQualities}
                        onChange={(e) => handleRoleModelChange('roleModel2', 'desiredQualities', e.target.value)}
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        6. Have you discussed your dream/career with these role models?
                      </label>
                      <Textarea
                        placeholder="Share your experience of discussing career goals with this person..."
                        value={responses.part1.roleModel2.careerDiscussed}
                        onChange={(e) => handleRoleModelChange('roleModel2', 'careerDiscussed', e.target.value)}
                        rows={2}
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Role Model 3 */}
                <div className="border rounded-lg p-6 bg-gradient-to-r from-green-50 to-emerald-50">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-green-500" />
                    Role Model 3
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        1. Name of the role model
                      </label>
                      <Input
                        placeholder="Enter their name..."
                        value={responses.part1.roleModel3.name}
                        onChange={(e) => handleRoleModelChange('roleModel3', 'name', e.target.value)}
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        2. Is this person from your family/school/village/acquaintance?
                      </label>
                      <Input
                        placeholder="e.g., Family, School, Village, Acquaintance..."
                        value={responses.part1.roleModel3.relationship}
                        onChange={(e) => handleRoleModelChange('roleModel3', 'relationship', e.target.value)}
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        3. Why do you admire this person? (Make a list of the special qualities of each role model)
                      </label>
                      <Textarea
                        placeholder="List the qualities, traits, and talents that inspire you..."
                        value={responses.part1.roleModel3.admirationReasons}
                        onChange={(e) => handleRoleModelChange('roleModel3', 'admirationReasons', e.target.value)}
                        rows={3}
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        4. What is his/her profession?
                      </label>
                      <Input
                        placeholder="e.g., Teacher, Engineer, Doctor..."
                        value={responses.part1.roleModel3.profession}
                        onChange={(e) => handleRoleModelChange('roleModel3', 'profession', e.target.value)}
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        5. Which of the qualities and skills possessed by these role models would you want to imbibe?
                      </label>
                      <Input
                        placeholder="Specific qualities you want to adopt..."
                        value={responses.part1.roleModel3.desiredQualities}
                        onChange={(e) => handleRoleModelChange('roleModel3', 'desiredQualities', e.target.value)}
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        6. Have you discussed your dream/career with these role models?
                      </label>
                      <Textarea
                        placeholder="Share your experience of discussing career goals with this person..."
                        value={responses.part1.roleModel3.careerDiscussed}
                        onChange={(e) => handleRoleModelChange('roleModel3', 'careerDiscussed', e.target.value)}
                        rows={2}
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Part 2: Support & Guidance */}
        {currentPart === 'part2' && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-xl text-blue-800">Part 2: Support & Guidance from Role Models</CardTitle>
              <CardDescription className="text-blue-600">
                Understand how your role models can support your career journey
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    7. What do they think about your dream/career?
                  </label>
                  <Textarea
                    placeholder="Share their thoughts and feedback on your career aspirations..."
                    value={responses.part2.question7}
                    onChange={(e) => handleResponseChange('part2', 'question7', e.target.value)}
                    rows={3}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    8. Are they willing to help with your dream/career interests?
                  </label>
                  <Textarea
                    placeholder="Describe their willingness and enthusiasm to support you..."
                    value={responses.part2.question8}
                    onChange={(e) => handleResponseChange('part2', 'question8', e.target.value)}
                    rows={3}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    9. If so, what kind of help are you looking for?
                  </label>
                  <Textarea
                    placeholder="Be specific about the type of assistance you need..."
                    value={responses.part2.question9}
                    onChange={(e) => handleResponseChange('part2', 'question9', e.target.value)}
                    rows={3}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Part 3: Self-Reflection & Integration */}
        {currentPart === 'part3' && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-xl text-green-800">Part 3: Self-Reflection & Personal Integration</CardTitle>
              <CardDescription className="text-green-600">
                Reflect on similarities and plan how to incorporate role model qualities
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    10. Are there any similarities between the qualities of your role model and your own?
                  </label>
                  <Textarea
                    placeholder="Identify qualities you already share with your role models..."
                    value={responses.part3.question10}
                    onChange={(e) => handleResponseChange('part3', 'question10', e.target.value)}
                    rows={3}
                    className="border-green-200 focus:border-green-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    11. How will you try to incorporate the qualities or skills of these individuals in your life?
                  </label>
                  <Textarea
                    placeholder="Create a concrete plan for adopting these qualities..."
                    value={responses.part3.question11}
                    onChange={(e) => handleResponseChange('part3', 'question11', e.target.value)}
                    rows={3}
                    className="border-green-200 focus:border-green-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation and Submit */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={() => {
              if (currentPart === 'part1') setCurrentPart('part3');
              else if (currentPart === 'part2') setCurrentPart('part1');
              else setCurrentPart('part2');
            }}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            {currentPart === 'part1' ? '← Previous: Part 3' : currentPart === 'part2' ? '← Previous: Part 1' : '← Previous: Part 2'}
          </Button>

          <div className="flex gap-3">
            {currentPart !== 'part3' && (
              <Button
                onClick={() => {
                  if (currentPart === 'part1') setCurrentPart('part2');
                  else setCurrentPart('part3');
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Next: Part {currentPart === 'part1' ? '2' : '3'} →
              </Button>
            )}

            {currentPart === 'part3' && (
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
        </div>
      </div>
    </div>
  );
}
