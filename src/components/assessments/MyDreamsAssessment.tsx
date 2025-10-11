import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Star,
  Target,
  Heart,
  BookOpen,
  Music,
  MapPin,
  Palette,
  TrendingUp,
  AlertTriangle,
  Play,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface DreamAssessmentResponse {
  part1: {
    question1: string; // Future dreams
    question2: string; // Educational degree
    question3: string; // Aspirational career
    question4: string; // Professional sport
    question5: string; // Writing aspirations
    question6: string; // Musical instrument
    question7: string; // College preference
    question8: string; // Helping others
    question9: string; // Living location
    question10: string; // Artistic choice
    question11: string; // Other dreams
    question12: string; // Want to make dreams come true
  };
  part2: {
    question13: string; // What's needed to achieve dreams
    question14: string; // First step
    question15: string; // Willpower and enthusiasm
    question16: string; // Obstacles
    question17: string; // Is state education enough
  };
}

export default function MyDreamsAssessment() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<DreamAssessmentResponse>({
    part1: {
      question1: '',
      question2: '',
      question3: '',
      question4: '',
      question5: '',
      question6: '',
      question7: '',
      question8: '',
      question9: '',
      question10: '',
      question11: '',
      question12: ''
    },
    part2: {
      question13: '',
      question14: '',
      question15: '',
      question16: '',
      question17: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentPart, setCurrentPart] = useState<'part1' | 'part2'>('part1');

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
        .eq('assessment_type', 'dreams')
        .eq('assessment_title', 'My Dreams')
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

  const handleResponseChange = (part: 'part1' | 'part2', questionKey: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [part]: {
        ...prev[part],
        [questionKey]: value
      }
    }));
  };

  const getProgressPercentage = () => {
    const totalQuestions = 17;
    const answeredQuestions = Object.values(responses.part1).filter(v => v.trim() !== '').length +
                             Object.values(responses.part2).filter(v => v.trim() !== '').length;
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const canSubmit = () => {
    const part1Complete = Object.values(responses.part1).every(v => v.trim() !== '');
    const part2Complete = Object.values(responses.part2).every(v => v.trim() !== '');
    return part1Complete && part2Complete;
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
          assessment_type: 'dreams',
          assessment_title: 'My Dreams',
          responses: responses,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Dreams Assessment Completed! ⭐",
        description: "Your dreams and aspirations have been captured successfully!",
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your dreams assessment...</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-0 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <Star className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-blue-800">Dreams Assessment Completed! 🌟</CardTitle>
              <CardDescription className="text-blue-600">
                You've successfully captured your dreams and aspirations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Thank you for sharing your dreams! Your responses have been saved and your teacher can now review them to help guide your journey.
                </p>
                <div className="flex justify-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCompleted(false)}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    Review My Responses
                  </Button>
                  <Button 
                    onClick={() => navigate('/student')}
                    className="bg-blue-600 hover:bg-blue-700"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">🌟 My Dreams Assessment</h1>
          <p className="text-blue-600 text-lg">
            "The dreams that you dream of in your sleep are not dreams, the dream that does not let you sleep is the real dream" - Dr. A.P.J. Abdul Kalam
          </p>
          <p className="text-gray-600 mt-2">
            We all have dreams about our future. What according to you is a dream? And what are your dreams? 
            What are the dreams that haunt you repeatedly? In this practice sheet you will express your dreams.
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
              <span>Part {currentPart === 'part1' ? '1' : '2'} of 2</span>
              <span>{Math.round(getProgressPercentage())}% Complete</span>
            </div>
          </CardContent>
        </Card>

        {/* Part Navigation */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-white rounded-lg p-1 shadow-md">
            <button
              onClick={() => setCurrentPart('part1')}
              className={`px-6 py-2 rounded-md transition-all ${
                currentPart === 'part1'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Part 1: Your Dreams
            </button>
            <button
              onClick={() => setCurrentPart('part2')}
              className={`px-6 py-2 rounded-md transition-all ${
                currentPart === 'part2'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Part 2: Making Dreams Reality
            </button>
          </div>
        </div>

        {/* Part 1: Your Dreams */}
        {currentPart === 'part1' && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-xl text-blue-800">Part 1: Your Dreams & Aspirations</CardTitle>
              <CardDescription className="text-blue-600">
                Express your dreams for the future and what you aspire to achieve
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    1. What dreams do you have for your future?
                  </label>
                  <Textarea
                    placeholder="Describe your biggest dreams and aspirations..."
                    value={responses.part1.question1}
                    onChange={(e) => handleResponseChange('part1', 'question1', e.target.value)}
                    rows={4}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      2. Educational degree that you aspire to get?
                    </label>
                    <Textarea
                      placeholder="What degree do you want to pursue?"
                      value={responses.part1.question2}
                      onChange={(e) => handleResponseChange('part1', 'question2', e.target.value)}
                      rows={2}
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      3. Your aspirational career?
                    </label>
                    <Textarea
                      placeholder="What career do you dream of having?"
                      value={responses.part1.question3}
                      onChange={(e) => handleResponseChange('part1', 'question3', e.target.value)}
                      rows={2}
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      4. A sport that you aspire to play professionally
                    </label>
                    <Textarea
                      placeholder="Which sport would you love to play professionally?"
                      value={responses.part1.question4}
                      onChange={(e) => handleResponseChange('part1', 'question4', e.target.value)}
                      rows={2}
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      5. If you can become a writer, you will write about
                    </label>
                    <Textarea
                      placeholder="What would you write about?"
                      value={responses.part1.question5}
                      onChange={(e) => handleResponseChange('part1', 'question5', e.target.value)}
                      rows={2}
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      6. The musical instrument you desire to play
                    </label>
                    <Textarea
                      placeholder="Which instrument would you love to play?"
                      value={responses.part1.question6}
                      onChange={(e) => handleResponseChange('part1', 'question6', e.target.value)}
                      rows={2}
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      7. The college you would like to study in
                    </label>
                    <Textarea
                      placeholder="Which college is your dream college?"
                      value={responses.part1.question7}
                      onChange={(e) => handleResponseChange('part1', 'question7', e.target.value)}
                      rows={2}
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      8. If you can help anyone or anything in this world, that is
                    </label>
                    <Textarea
                      placeholder="Who or what would you help?"
                      value={responses.part1.question8}
                      onChange={(e) => handleResponseChange('part1', 'question8', e.target.value)}
                      rows={2}
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      9. If you can live anywhere in the world, that would be in
                    </label>
                    <Textarea
                      placeholder="Where would you love to live?"
                      value={responses.part1.question9}
                      onChange={(e) => handleResponseChange('part1', 'question9', e.target.value)}
                      rows={2}
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      10. If you can become an artiste, the art that you would choose would be
                    </label>
                    <Textarea
                      placeholder="Which form of art would you choose?"
                      value={responses.part1.question10}
                      onChange={(e) => handleResponseChange('part1', 'question10', e.target.value)}
                      rows={2}
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      11. Others
                    </label>
                    <Textarea
                      placeholder="Any other dreams or aspirations?"
                      value={responses.part1.question11}
                      onChange={(e) => handleResponseChange('part1', 'question11', e.target.value)}
                      rows={2}
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      12. Would you want to make your dream come true?
                    </label>
                    <Textarea
                      placeholder="How committed are you to achieving your dreams?"
                      value={responses.part1.question12}
                      onChange={(e) => handleResponseChange('part1', 'question12', e.target.value)}
                      rows={2}
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Part 2: Making Dreams Reality */}
        {currentPart === 'part2' && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-xl text-green-800">Part 2: Making Your Dreams Reality</CardTitle>
              <CardDescription className="text-green-600">
                Plan the steps needed to achieve your dreams and identify potential obstacles
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    13. What do you need to make your dreams come true? (For any one of your dreams)
                  </label>
                  <Textarea
                    placeholder="What resources, skills, or support do you need?"
                    value={responses.part2.question13}
                    onChange={(e) => handleResponseChange('part2', 'question13', e.target.value)}
                    rows={3}
                    className="border-green-200 focus:border-green-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    14. What is the first step you need to take to make your dreams come true?
                  </label>
                  <Textarea
                    placeholder="What's the very first action you should take?"
                    value={responses.part2.question14}
                    onChange={(e) => handleResponseChange('part2', 'question14', e.target.value)}
                    rows={3}
                    className="border-green-200 focus:border-green-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    15. Do you have the will power and enthusiasm to make your dream a reality?
                  </label>
                  <Textarea
                    placeholder="Assess your motivation and determination..."
                    value={responses.part2.question15}
                    onChange={(e) => handleResponseChange('part2', 'question15', e.target.value)}
                    rows={3}
                    className="border-green-200 focus:border-green-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    16. Are there any obstacles to reach your dream? If there are any, which ones?
                  </label>
                  <Textarea
                    placeholder="What challenges or barriers might you face?"
                    value={responses.part2.question16}
                    onChange={(e) => handleResponseChange('part2', 'question16', e.target.value)}
                    rows={3}
                    className="border-green-200 focus:border-green-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    17. Is state education enough to make your dreams come true? How?
                  </label>
                  <Textarea
                    placeholder="Evaluate if formal education is sufficient or what else you need..."
                    value={responses.part2.question17}
                    onChange={(e) => handleResponseChange('part2', 'question17', e.target.value)}
                    rows={3}
                    className="border-green-200 focus:border-green-400"
                  />
                </div>

                {/* Video Section */}
                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Play className="w-5 h-5 text-blue-600" />
                    Additional Inspiration
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Watch this video to get inspired about pursuing your dreams:
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('https://youtu.be/Bi-7pho5XB8', '_blank')}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Watch Video
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation and Submit */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPart(currentPart === 'part1' ? 'part2' : 'part1')}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            {currentPart === 'part1' ? 'Next: Making Dreams Reality →' : '← Back: Your Dreams'}
          </Button>

          {currentPart === 'part2' && (
            <Button
              onClick={submitAssessment}
              disabled={!canSubmit() || submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  Submit Dreams Assessment
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
