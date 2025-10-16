import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle, 
  School,
  BookOpen,
  Heart,
  Star,
  Target,
  Users,
  Lightbulb,
  TrendingUp,
  Play,
  ExternalLink,
  GraduationCap,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SchoolLearningAssessmentResponse {
  part1: {
    question1: string; // Do you like to come to school?
    question2: string; // Why do you like to come to school?
    question3: string; // Why don't you like coming to school?
    question4: string; // Who is your best friend at school?
    question5: string; // Which is your favourite subject/topics?
    question6: string; // Why do you like these topics?
    question7: string; // Which subject/s do you not like?
  };
  part2: {
    question8: string; // Why do you not like these subjects?
    question9: string; // In which subject/s do you score more marks?
    question10: string; // In which subject/s do you score less marks?
    question11: {
      lookingAtPictures: boolean;
      reading: boolean;
      listening: boolean;
      experiment: boolean;
      discussions: boolean;
      practice: boolean;
      groupSessions: boolean;
      others: string;
    };
    question12: string; // Apart from school curriculum, what attracts you to school?
  };
  part3: {
    question13: string; // School activities you would like to participate in
    question14: string; // What would you want to change about your school?
    question15: string; // Favourite place to study and why?
    question16: string; // Is school important for your learning?
    question17: string; // How can schooling help you realise your dreams?
  };
}

export default function MySchoolLearningAssessment() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [responses, setResponses] = useState<SchoolLearningAssessmentResponse>({
    part1: {
      question1: '',
      question2: '',
      question3: '',
      question4: '',
      question5: '',
      question6: '',
      question7: ''
    },
    part2: {
      question8: '',
      question9: '',
      question10: '',
      question11: {
        lookingAtPictures: false,
        reading: false,
        listening: false,
        experiment: false,
        discussions: false,
        practice: false,
        groupSessions: false,
        others: ''
      },
      question12: ''
    },
    part3: {
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
  const [currentPart, setCurrentPart] = useState<'part1' | 'part2' | 'part3'>('part1');
  const navigate = useNavigate();

  useEffect(() => {
    checkExistingResponse();
  }, []);

  // Auto-save drafts on change (debounced)
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
          assessment_type: 'school_learning',
          assessment_title: 'My School, My Learning and I',
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
        .eq('assessment_type', 'school_learning')
        .eq('assessment_title', 'My School, My Learning and I')
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

  const handleResponseChange = (part: 'part1' | 'part2' | 'part3', questionKey: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [part]: {
        ...prev[part],
        [questionKey]: value
      }
    }));
  };

  const handleLearningMethodChange = (method: string, checked: boolean) => {
    setResponses(prev => ({
      ...prev,
      part2: {
        ...prev.part2,
        question11: {
          ...prev.part2.question11,
          [method]: checked
        }
      }
    }));
  };

  const getProgressPercentage = () => {
    const totalQuestions = 17;
    const answeredQuestions = 
      Object.values(responses.part1).filter(v => v.trim() !== '').length +
      Object.values(responses.part2).filter((v, i) => {
        if (i === 3) { // question11 (learning methods)
          const methods = responses.part2.question11;
          return Object.values(methods).some(v => v === true || (typeof v === 'string' && v.trim() !== ''));
        }
        return v.trim() !== '';
      }).length +
      Object.values(responses.part3).filter(v => v.trim() !== '').length;
    
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const canSubmit = () => {
    const part1Complete = Object.values(responses.part1).every(v => v.trim() !== '');
    const part2Complete = Object.values(responses.part2).filter((v, i) => {
      if (i === 3) { // question11 (learning methods)
        const methods = responses.part2.question11;
        return Object.values(methods).some(v => v === true || (typeof v === 'string' && v.trim() !== ''));
      }
      return v.trim() !== '';
    }).length === Object.values(responses.part2).length;
    const part3Complete = Object.values(responses.part3).every(v => v.trim() !== '');
    
    return part1Complete && part2Complete && part3Complete;
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
          assessment_type: 'state_learning',
          assessment_title: 'My School, My Learning and I',
          responses: responses,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "School Learning Assessment Completed! 📚",
        description: "Your school and learning experiences have been captured successfully!",
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your school learning assessment...</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-0 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-green-50 to-emerald-50">
              <School className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-green-800">School Learning Assessment Completed! 🏫</CardTitle>
              <CardDescription className="text-green-600">
                You've successfully shared your school experience and learning preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Thank you for sharing your thoughts about school and learning! Your responses have been saved and your teacher can now review them to better understand your needs.
                </p>
                <div className="flex justify-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCompleted(false)}
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    Review My Responses
                  </Button>
                  <Button 
                    onClick={() => navigate('/student')}
                    className="bg-green-600 hover:bg-green-700"
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-8">
      <div className="container mx-auto px-4">
        <TooltipProvider>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-left mb-2">
            <Button variant="ghost" onClick={() => navigate('/student')} className="text-green-700 hover:text-green-800 hover:bg-green-50">
              <ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-green-800 mb-2">🏫 My School, My Learning and I</h1>
          <p className="text-green-600 text-lg">
            In this practice sheet, you can share your thoughts about your school and your learning.
          </p>
          <p className="text-gray-600 mt-2">
            For example: what do you like most about your school, what would you like to do at school, 
            your likes, dislikes about your school, your marks, etc.
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
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              Part 1: School Experience
            </button>
            <button
              onClick={() => setCurrentPart('part2')}
              className={`px-4 py-2 rounded-md transition-all text-sm ${
                currentPart === 'part2'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              Part 2: Learning & Performance
            </button>
            <button
              onClick={() => setCurrentPart('part3')}
              className={`px-4 py-2 rounded-md transition-all text-sm ${
                currentPart === 'part3'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              Part 3: Activities & Future
            </button>
          </div>
        </div>

        {/* Part 1: State Experience */}
        {currentPart === 'part1' && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-xl text-green-800">Part 1: Your State Experience</CardTitle>
              <CardDescription className="text-green-600">
                Share your thoughts about coming to school and your preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    1. Do you like to come to school?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Help" className="text-green-700 hover:text-green-800">💬</button>
                      </TooltipTrigger>
                      <TooltipContent>Write ‘Yes’ or ‘No’ and say how you feel about school.</TooltipContent>
                    </Tooltip>
                  </label>
                  <Textarea
                    placeholder="Write ‘Yes’ or ‘No’ and say how you feel about school."
                    value={responses.part1.question1}
                    onChange={(e) => handleResponseChange('part1', 'question1', e.target.value)}
                    rows={3}
                    className="border-green-200 focus:border-green-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    2. Why do you like to come to school?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Help" className="text-green-700 hover:text-green-800">💬</button>
                      </TooltipTrigger>
                      <TooltipContent>Write what you enjoy about school — friends, teachers, learning, etc.</TooltipContent>
                    </Tooltip>
                  </label>
                  <Textarea
                    placeholder="Write what you enjoy about school — friends, teachers, learning, etc."
                    value={responses.part1.question2}
                    onChange={(e) => handleResponseChange('part1', 'question2', e.target.value)}
                    rows={3}
                    className="border-green-200 focus:border-green-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    3. Why don't you like coming to school?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Help" className="text-green-700 hover:text-green-800">💬</button>
                      </TooltipTrigger>
                      <TooltipContent>Write what makes school difficult or less enjoyable for you.</TooltipContent>
                    </Tooltip>
                  </label>
                  <Textarea
                    placeholder="Write what makes school difficult or less enjoyable for you."
                    value={responses.part1.question3}
                    onChange={(e) => handleResponseChange('part1', 'question3', e.target.value)}
                    rows={3}
                    className="border-green-200 focus:border-green-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    4. Who is your best friend at school?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Help" className="text-green-700 hover:text-green-800">💬</button>
                      </TooltipTrigger>
                      <TooltipContent>Write the name of your best friend or someone you like spending time with.</TooltipContent>
                    </Tooltip>
                  </label>
                  <Textarea
                    placeholder="Write the name of your best friend or someone you like spending time with."
                    value={responses.part1.question4}
                    onChange={(e) => handleResponseChange('part1', 'question4', e.target.value)}
                    rows={3}
                    className="border-green-200 focus:border-green-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    5. Which is your favourite subject/topic?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Help" className="text-green-700 hover:text-green-800">💬</button>
                      </TooltipTrigger>
                      <TooltipContent>Write the subject or topic you enjoy learning the most.</TooltipContent>
                    </Tooltip>
                  </label>
                  <Textarea
                    placeholder="Write the subject or topic you enjoy learning the most."
                    value={responses.part1.question5}
                    onChange={(e) => handleResponseChange('part1', 'question5', e.target.value)}
                    rows={3}
                    className="border-green-200 focus:border-green-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    6. Why do you like these topics?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Help" className="text-green-700 hover:text-green-800">💬</button>
                      </TooltipTrigger>
                      <TooltipContent>Write what makes this subject interesting or fun for you.</TooltipContent>
                    </Tooltip>
                  </label>
                  <Textarea
                    placeholder="Write what makes this subject interesting or fun for you."
                    value={responses.part1.question6}
                    onChange={(e) => handleResponseChange('part1', 'question6', e.target.value)}
                    rows={3}
                    className="border-green-200 focus:border-green-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    7. Which subject(s) do you not like?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Help" className="text-green-700 hover:text-green-800">💬</button>
                      </TooltipTrigger>
                      <TooltipContent>Write the subject(s) you find boring or hard to understand.</TooltipContent>
                    </Tooltip>
                  </label>
                  <Textarea
                    placeholder="Write the subject(s) you find boring or hard to understand."
                    value={responses.part1.question7}
                    onChange={(e) => handleResponseChange('part1', 'question7', e.target.value)}
                    rows={3}
                    className="border-green-200 focus:border-green-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Part 2: Learning & Performance */}
        {currentPart === 'part2' && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-xl text-blue-800">Part 2: Learning Methods & Academic Performance</CardTitle>
              <CardDescription className="text-blue-600">
                Understand your learning preferences and academic performance
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    8. Why do you not like these subjects?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Help" className="text-blue-700 hover:text-blue-800">💬</button>
                      </TooltipTrigger>
                      <TooltipContent>Explain what makes these subjects difficult or uninteresting for you.</TooltipContent>
                    </Tooltip>
                  </label>
                  <Textarea
                    placeholder="Explain what makes these subjects difficult or uninteresting for you."
                    value={responses.part2.question8}
                    onChange={(e) => handleResponseChange('part2', 'question8', e.target.value)}
                    rows={3}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    9. In which subject(s) do you score more marks?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Help" className="text-blue-700 hover:text-blue-800">💬</button>
                      </TooltipTrigger>
                      <TooltipContent>Write the subjects where you usually get high marks.</TooltipContent>
                    </Tooltip>
                  </label>
                  <Textarea
                    placeholder="Write the subjects where you usually get high marks."
                    value={responses.part2.question9}
                    onChange={(e) => handleResponseChange('part2', 'question9', e.target.value)}
                    rows={3}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    10. In which subject(s) do you score less marks?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Help" className="text-blue-700 hover:text-blue-800">💬</button>
                      </TooltipTrigger>
                      <TooltipContent>Write the subjects where your marks are usually low.</TooltipContent>
                    </Tooltip>
                  </label>
                  <Textarea
                    placeholder="Write the subjects where your marks are usually low."
                    value={responses.part2.question10}
                    onChange={(e) => handleResponseChange('part2', 'question10', e.target.value)}
                    rows={3}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    11. Which of the following learning methods do you like best?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Help" className="text-blue-700 hover:text-blue-800">💬</button>
                      </TooltipTrigger>
                      <TooltipContent>Tick the ways of learning that help you understand better.</TooltipContent>
                    </Tooltip>
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="lookingAtPictures"
                        checked={responses.part2.question11.lookingAtPictures}
                        onCheckedChange={(checked) => handleLearningMethodChange('lookingAtPictures', checked as boolean)}
                      />
                      <label htmlFor="lookingAtPictures" className="text-sm text-gray-700">
                        Looking at pictures / watching videos
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="reading"
                        checked={responses.part2.question11.reading}
                        onCheckedChange={(checked) => handleLearningMethodChange('reading', checked as boolean)}
                      />
                      <label htmlFor="reading" className="text-sm text-gray-700">
                        Reading
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="listening"
                        checked={responses.part2.question11.listening}
                        onCheckedChange={(checked) => handleLearningMethodChange('listening', checked as boolean)}
                      />
                      <label htmlFor="listening" className="text-sm text-gray-700">
                        Listening
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="experiment"
                        checked={responses.part2.question11.experiment}
                        onCheckedChange={(checked) => handleLearningMethodChange('experiment', checked as boolean)}
                      />
                      <label htmlFor="experiment" className="text-sm text-gray-700">
                        Experiment / Experiential learning
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="discussions"
                        checked={responses.part2.question11.discussions}
                        onCheckedChange={(checked) => handleLearningMethodChange('discussions', checked as boolean)}
                      />
                      <label htmlFor="discussions" className="text-sm text-gray-700">
                        Discussions
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="practice"
                        checked={responses.part2.question11.practice}
                        onCheckedChange={(checked) => handleLearningMethodChange('practice', checked as boolean)}
                      />
                      <label htmlFor="practice" className="text-sm text-gray-700">
                        Practice
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="groupSessions"
                        checked={responses.part2.question11.groupSessions}
                        onCheckedChange={(checked) => handleLearningMethodChange('groupSessions', checked as boolean)}
                      />
                      <label htmlFor="groupSessions" className="text-sm text-gray-700">
                        Group sessions
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="others"
                        checked={responses.part2.question11.others !== ''}
                        onCheckedChange={(checked) => {
                          if (!checked) handleLearningMethodChange('others', '');
                        }}
                      />
                      <label htmlFor="others" className="text-sm text-gray-700">
                        Others
                      </label>
                    </div>
                    {responses.part2.question11.others !== '' && (
                      <Textarea
                        placeholder="Please specify other learning methods..."
                        value={responses.part2.question11.others}
                        onChange={(e) => handleLearningMethodChange('others', e.target.value)}
                        rows={2}
                        className="border-blue-200 focus:border-blue-400 ml-6"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    12. Apart from the school curriculum, what are the other factors that attract you to the school?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Help" className="text-blue-700 hover:text-blue-800">💬</button>
                      </TooltipTrigger>
                      <TooltipContent>Write what else you like about school — friends, games, teachers, or events.</TooltipContent>
                    </Tooltip>
                  </label>
                  <Textarea
                    placeholder="What non-academic aspects of school do you enjoy?"
                    value={responses.part2.question12}
                    onChange={(e) => handleResponseChange('part2', 'question12', e.target.value)}
                    rows={3}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Part 3: Activities & Future */}
        {currentPart === 'part3' && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-xl text-purple-800">Part 3: School Activities & Future Planning</CardTitle>
              <CardDescription className="text-purple-600">
                Explore school activities and understand how school connects to your dreams
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    13. Make a list of the school activities in which you would like to participate.
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Help" className="text-purple-700 hover:text-purple-800">💬</button>
                      </TooltipTrigger>
                      <TooltipContent>Write the clubs, events, or competitions you want to join.</TooltipContent>
                    </Tooltip>
                  </label>
                  <Textarea
                    placeholder="What school activities interest you most?"
                    value={responses.part3.question13}
                    onChange={(e) => handleResponseChange('part3', 'question13', e.target.value)}
                    rows={3}
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    14. If there is something about your school that you would want to change, what would that be?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Help" className="text-purple-700 hover:text-purple-800">💬</button>
                      </TooltipTrigger>
                      <TooltipContent>Write what you wish could be better in your school.</TooltipContent>
                    </Tooltip>
                  </label>
                  <Textarea
                    placeholder="What improvements would you suggest for your school?"
                    value={responses.part3.question14}
                    onChange={(e) => handleResponseChange('part3', 'question14', e.target.value)}
                    rows={3}
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    15. Which is your favourite place to study? Why?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Help" className="text-purple-700 hover:text-purple-800">💬</button>
                      </TooltipTrigger>
                      <TooltipContent>Write where you like to study and explain why it helps you focus.</TooltipContent>
                    </Tooltip>
                  </label>
                  <Textarea
                    placeholder="Where do you prefer to study and what makes it special?"
                    value={responses.part3.question15}
                    onChange={(e) => handleResponseChange('part3', 'question15', e.target.value)}
                    rows={3}
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    16. Is school important for your learning?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Help" className="text-purple-700 hover:text-purple-800">💬</button>
                      </TooltipTrigger>
                      <TooltipContent>Write ‘Yes’ or ‘No’ and say why you think so.</TooltipContent>
                    </Tooltip>
                  </label>
                  <Textarea
                    placeholder="How important is school in your learning journey?"
                    value={responses.part3.question16}
                    onChange={(e) => handleResponseChange('part3', 'question16', e.target.value)}
                    rows={3}
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    17. How can schooling help you realise your dreams?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Help" className="text-purple-700 hover:text-purple-800">💬</button>
                      </TooltipTrigger>
                      <TooltipContent>Write how school lessons or activities can help you reach your goals.</TooltipContent>
                    </Tooltip>
                  </label>
                  <Textarea
                    placeholder="How does school education connect to your future goals?"
                    value={responses.part3.question17}
                    onChange={(e) => handleResponseChange('part3', 'question17', e.target.value)}
                    rows={3}
                    className="border-purple-200 focus:border-purple-400"
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
            className="border-green-200 text-green-700 hover:bg-green-50"
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
                className="bg-green-600 hover:bg-green-700"
              >
                Next: Part {currentPart === 'part1' ? '2' : '3'} →
              </Button>
            )}

            {currentPart === 'part3' && (
              <Button
                onClick={submitAssessment}
                disabled={!canSubmit() || submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <School className="w-4 h-4 mr-2" />
                    Submit Assessment
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
