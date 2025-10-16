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
  Palette,
  Heart,
  Star,
  Target,
  Lightbulb,
  TrendingUp,
  Music,
  Camera,
  BookOpen,
  Gamepad2,
  Paintbrush,
  Dumbbell,
  Code,
  CameraIcon,
  Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HobbiesAssessmentResponse {
  question1: string; // What do you do in your spare time?
  question2: string; // Do you have any hobbies? If yes, what are they?
  question3: string; // Based on the above answer, what hobby do you like and enjoy the most and why?
  question4: string; // Have your hobbies ever changed?
  question5: string; // Where did the inspiration for your hobby come from? From whom?
  question6: string; // Do you know someone who has your hobby? Who?
  question7: string; // List the talents you have
  question8: string; // Do you practise to improve your talent?
  question9: string; // Do you have opportunities and encouragement at school and home to practise your hobbies?
  question10: string; // Do any of your hobbies complement your talents?
  question11: string; // Could you turn any hobby/talent into your career? If yes, how?
  question12: string; // Has someone you know made a career out of their hobby or talent?
}

export default function MyHobbiesAssessment() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<HobbiesAssessmentResponse>({
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
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    checkExistingResponse();
  }, []);

  // Auto-save drafts when answers change (debounced)
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
          assessment_type: 'hobbies',
          assessment_title: 'My Hobbies',
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
        .eq('assessment_type', 'hobbies')
        .eq('assessment_title', 'My Hobbies')
        .single();

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

  const handleResponseChange = (questionKey: keyof HobbiesAssessmentResponse, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionKey]: value
    }));
  };

  const getProgressPercentage = () => {
    const totalQuestions = Object.keys(responses).length;
    const answeredQuestions = Object.values(responses).filter(v => v.trim() !== '').length;
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const canSubmit = () => {
    return Object.values(responses).every(v => v.trim() !== '');
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
          assessment_type: 'hobbies',
          assessment_title: 'My Hobbies',
          responses: responses,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Hobbies Assessment Completed! 🎨",
        description: "Your hobbies and talents have been captured successfully!",
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your hobbies assessment...</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-0 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-orange-50 to-pink-50">
              <Palette className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-orange-800">Hobbies Assessment Completed! 🎨</CardTitle>
              <CardDescription className="text-orange-600">
                You've successfully shared your hobbies and talents
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Thank you for sharing your hobbies and talents! Your responses have been saved and your teacher can now review them to help identify potential career paths based on your interests.
                </p>
                <div className="flex justify-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCompleted(false)}
                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                  >
                    Review My Responses
                  </Button>
                  <Button 
                    onClick={() => navigate('/student')}
                    className="bg-orange-600 hover:bg-orange-700"
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
		<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 py-8">
			<div className="container mx-auto px-4">
				<TooltipProvider>
        <div className="text-left mb-2">
          <Button variant="ghost" onClick={() => navigate('/student')} className="text-orange-700 hover:text-orange-800 hover:bg-orange-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-2"><path fillRule="evenodd" d="M12.53 3.47a.75.75 0 010 1.06L6.31 10.75H21a.75.75 0 010 1.5H6.31l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" clipRule="evenodd" /></svg>
            Back to Dashboard
          </Button>
        </div>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-800 mb-2">🎨 My Hobbies</h1>
          <p className="text-orange-600 text-lg">
            Note down your hobbies in this practice sheet. By answering the following questions, you can find out if your hobbies and skills can be turned into a career option.
          </p>
          <p className="text-gray-600 mt-2">
            It will help the student understand his/her hobby and talent, practise his/her chosen hobby, helps in better learning based on the background of his/her hobby and talent.
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
              <span>12 Questions Total</span>
              <span>{Math.round(getProgressPercentage())}% Complete</span>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Questions */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-pink-50">
            <CardTitle className="text-xl text-orange-800">Hobby | Talent | Inspiration</CardTitle>
            <CardDescription className="text-orange-600">
              Answer each question thoughtfully to discover how your hobbies can shape your future career
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-8">
              {/* Question 1 */}
              <div className="border-l-4 border-orange-400 pl-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-orange-500" />
                  1. What do you do in your spare time?
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="Help" className="text-orange-600 hover:text-orange-700">💬</button>
                    </TooltipTrigger>
                    <TooltipContent>Write about what you like to do when you are free.</TooltipContent>
                  </Tooltip>
                </label>
                <Textarea
                  placeholder="Write about what you like to do when you are free."
                  value={responses.question1}
                  onChange={(e) => handleResponseChange('question1', e.target.value)}
                  rows={4}
                  className="border-orange-200 focus:border-orange-400 text-base"
                />
              </div>

              {/* Question 2 */}
              <div className="border-l-4 border-pink-400 pl-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  2. Do you have any hobbies? If yes, what are they?
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="Help" className="text-pink-600 hover:text-pink-700">💬</button>
                    </TooltipTrigger>
                    <TooltipContent>Write the activities you enjoy doing regularly, like drawing, reading, or playing games.</TooltipContent>
                  </Tooltip>
                </label>
                <Textarea
                  placeholder="Write the activities you enjoy doing regularly, like drawing, reading, or playing games."
                  value={responses.question2}
                  onChange={(e) => handleResponseChange('question2', e.target.value)}
                  rows={4}
                  className="border-pink-200 focus:border-pink-400 text-base"
                />
              </div>

              {/* Question 3 */}
              <div className="border-l-4 border-purple-400 pl-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-500" />
                  3. Based on the above answer, what hobby do you like and enjoy the most and why?
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="Help" className="text-purple-600 hover:text-purple-700">💬</button>
                    </TooltipTrigger>
                    <TooltipContent>Write your favourite hobby and explain why you like it the most.</TooltipContent>
                  </Tooltip>
                </label>
                <Textarea
                  placeholder="Write your favourite hobby and explain why you like it the most."
                  value={responses.question3}
                  onChange={(e) => handleResponseChange('question3', e.target.value)}
                  rows={4}
                  className="border-purple-200 focus:border-purple-400 text-base"
                />
              </div>

              {/* Question 4 */}
              <div className="border-l-4 border-blue-400 pl-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  4. Have your hobbies ever changed?
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="Help" className="text-blue-600 hover:text-blue-700">💬</button>
                    </TooltipTrigger>
                    <TooltipContent>Write if your hobbies have become different over time.</TooltipContent>
                  </Tooltip>
                </label>
                <Textarea
                  placeholder="Write if your hobbies have become different over time."
                  value={responses.question4}
                  onChange={(e) => handleResponseChange('question4', e.target.value)}
                  rows={4}
                  className="border-blue-200 focus:border-blue-400 text-base"
                />
              </div>

              {/* Question 5 */}
              <div className="border-l-4 border-green-400 pl-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-green-500" />
                  5. Where did the inspiration for your hobby come from? From whom?
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="Help" className="text-green-600 hover:text-green-700">💬</button>
                    </TooltipTrigger>
                    <TooltipContent>Write who or what made you start liking this hobby.</TooltipContent>
                  </Tooltip>
                </label>
                <Textarea
                  placeholder="Write who or what made you start liking this hobby."
                  value={responses.question5}
                  onChange={(e) => handleResponseChange('question5', e.target.value)}
                  rows={4}
                  className="border-green-200 focus:border-green-400 text-base"
                />
              </div>

              {/* Question 6 */}
              <div className="border-l-4 border-indigo-400 pl-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-500" />
                  6. Do you know someone who has your hobby? Who?
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="Help" className="text-indigo-600 hover:text-indigo-700">💬</button>
                    </TooltipTrigger>
                    <TooltipContent>Write the name of a person (friend, family, or teacher) who also enjoys the same hobby.</TooltipContent>
                  </Tooltip>
                </label>
                <Textarea
                  placeholder="Write the name of a person (friend, family, or teacher) who also enjoys the same hobby."
                  value={responses.question6}
                  onChange={(e) => handleResponseChange('question6', e.target.value)}
                  rows={4}
                  className="border-indigo-200 focus:border-indigo-400 text-base"
                />
              </div>

              {/* Question 7 */}
              <div className="border-l-4 border-red-400 pl-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-red-500" />
                  7. List the talents you have
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="Help" className="text-red-600 hover:text-red-700">💬</button>
                    </TooltipTrigger>
                    <TooltipContent>Write about the skills or things you are naturally good at.</TooltipContent>
                  </Tooltip>
                </label>
                <Textarea
                  placeholder="Write about the skills or things you are naturally good at."
                  value={responses.question7}
                  onChange={(e) => handleResponseChange('question7', e.target.value)}
                  rows={4}
                  className="border-red-200 focus:border-red-400 text-base"
                />
              </div>

              {/* Question 8 */}
              <div className="border-l-4 border-yellow-400 pl-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-yellow-500" />
                  8. Do you practise to improve your talent?
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="Help" className="text-yellow-600 hover:text-yellow-700">💬</button>
                    </TooltipTrigger>
                    <TooltipContent>Write how you try to get better at your skill or talent.</TooltipContent>
                  </Tooltip>
                </label>
                <Textarea
                  placeholder="Write how you try to get better at your skill or talent."
                  value={responses.question8}
                  onChange={(e) => handleResponseChange('question8', e.target.value)}
                  rows={4}
                  className="border-yellow-200 focus:border-yellow-400 text-base"
                />
              </div>

              {/* Question 9 */}
              <div className="border-l-4 border-teal-400 pl-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-500" />
                  9. Do you have opportunities and encouragement at school and at home to practise your hobbies?
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="Help" className="text-teal-600 hover:text-teal-700">💬</button>
                    </TooltipTrigger>
                    <TooltipContent>Write if your family or school supports and gives time for your hobbies.</TooltipContent>
                  </Tooltip>
                </label>
                <Textarea
                  placeholder="Write if your family or school supports and gives time for your hobbies."
                  value={responses.question9}
                  onChange={(e) => handleResponseChange('question9', e.target.value)}
                  rows={4}
                  className="border-teal-200 focus:border-teal-400 text-base"
                />
              </div>

              {/* Question 10 */}
              <div className="border-l-4 border-emerald-400 pl-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  10. Do any of your hobbies complement your talents?
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="Help" className="text-emerald-600 hover:text-emerald-700">💬</button>
                    </TooltipTrigger>
                    <TooltipContent>Write if any of your hobbies help you use or grow your talents.</TooltipContent>
                  </Tooltip>
                </label>
                <Textarea
                  placeholder="Write if any of your hobbies help you use or grow your talents."
                  value={responses.question10}
                  onChange={(e) => handleResponseChange('question10', e.target.value)}
                  rows={4}
                  className="border-emerald-200 focus:border-emerald-400 text-base"
                />
              </div>

              {/* Question 11 */}
              <div className="border-l-4 border-sky-400 pl-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-sky-500" />
                  11. Could you turn any of your hobbies or talents into your career? If yes, how?
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="Help" className="text-sky-600 hover:text-sky-700">💬</button>
                    </TooltipTrigger>
                    <TooltipContent>Write how your hobby or talent could become your future job.</TooltipContent>
                  </Tooltip>
                </label>
                <Textarea
                  placeholder="Write how your hobby or talent could become your future job."
                  value={responses.question11}
                  onChange={(e) => handleResponseChange('question11', e.target.value)}
                  rows={4}
                  className="border-sky-200 focus:border-sky-400 text-base"
                />
              </div>

              {/* Question 12 */}
              <div className="border-l-4 border-rose-400 pl-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-rose-500" />
                  12. Has someone you know, made a career out of their hobby or talent?
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="Help" className="text-rose-600 hover:text-rose-700">💬</button>
                    </TooltipTrigger>
                    <TooltipContent>Write about a person you know who turned their hobby into their job.</TooltipContent>
                  </Tooltip>
                </label>
                <Textarea
                  placeholder="Write about a person you know who turned their hobby into their job."
                  value={responses.question12}
                  onChange={(e) => handleResponseChange('question12', e.target.value)}
                  rows={4}
                  className="border-rose-200 focus:border-rose-400 text-base"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center mt-8">
          <Button
            onClick={submitAssessment}
            disabled={!canSubmit() || submitting}
            size="lg"
            className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white px-8 py-3 text-lg"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Submitting...
              </>
            ) : (
              <>
                <Palette className="w-5 h-5 mr-3" />
                Submit Hobbies Assessment
              </>
            )}
          </Button>
        </div>

        {/* Hobby Icons Inspiration */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Common Hobby Categories</h3>
          <div className="flex flex-wrap justify-center gap-6 text-gray-500">
            <div className="flex flex-col items-center gap-2">
              <Music className="w-8 h-8" />
              <span className="text-sm">Music</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Camera className="w-8 h-8" />
              <span className="text-sm">Photography</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <BookOpen className="w-8 h-8" />
              <span className="text-sm">Reading</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Gamepad2 className="w-8 h-8" />
              <span className="text-sm">Gaming</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Paintbrush className="w-8 h-8" />
              <span className="text-sm">Art</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Dumbbell className="w-8 h-8" />
              <span className="text-sm">Sports</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Code className="w-8 h-8" />
              <span className="text-sm">Technology</span>
            </div>
          </div>
        </div>
				</TooltipProvider>
			</div>
    </div>
  );
}
